import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ChatTurn = { role: 'user' | 'model'; text: string };
type EventSnapshot = {
  event_id: string;
  title: string;
  message: string;
  event_date: string | null;
  start_time: string | null;
  venue: string | null;
  organizer_name: string | null;
  visibility: string;
};

type GeminiModel = { name: string; supportedGenerationMethods?: string[] };
let cachedFlashModels: { names: string[]; expiresAt: number } | null = null;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getGeminiModels(apiKey: string, refresh = false) {
  if (
    !refresh &&
    cachedFlashModels &&
    cachedFlashModels.expiresAt > Date.now()
  ) {
    return cachedFlashModels.names;
  }

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models',
    { headers: { 'x-goog-api-key': apiKey } },
  );
  if (!response.ok) {
    console.error('Could not list Gemini models. Status:', response.status);
    throw new Error(
      response.status === 401 || response.status === 403
        ? 'Gemini could not list models for this key. Check that GEMINI_API_KEY is valid and the Generative Language API is enabled for its Google project.'
        : 'Could not check which Gemini models are available for this API key.',
    );
  }

  const body = await response.json();
  const models = (body.models || []) as GeminiModel[];
  const availableFlashModels = models
    .filter(model =>
      model.supportedGenerationMethods?.includes('generateContent'),
    )
    .map(model => model.name.replace(/^models\//, ''))
    .filter(name => /flash/i.test(name) && !/embedding/i.test(name));
  const preferred =
    Deno.env.get('GEMINI_MODEL')?.replace(/^models\//, '') ||
    'gemini-2.5-flash';
  const candidates = [
    ...new Set([
      ...(availableFlashModels.includes(preferred) ? [preferred] : []),
      ...availableFlashModels.sort((left, right) =>
        right.localeCompare(left, undefined, { numeric: true }),
      ),
    ]),
  ];

  if (candidates.length === 0) {
    const available = models
      .filter(model =>
        model.supportedGenerationMethods?.includes('generateContent'),
      )
      .map(model => model.name.replace(/^models\//, ''))
      .slice(0, 8);
    throw new Error(
      available.length
        ? `No Gemini Flash model is available to this API key. Available models: ${available.join(
            ', ',
          )}. Set GEMINI_MODEL to one of these models in Supabase Edge Function secrets.`
        : 'This API key has no Gemini models available for content generation. Check the Google project and API key permissions.',
    );
  }

  cachedFlashModels = {
    names: candidates,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };
  return candidates;
}

function dateOffset(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST')
    return json({ error: 'Method not allowed.' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer '))
    return json({ error: 'Sign in to use the campus assistant.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!supabaseUrl || !anonKey || !geminiApiKey) {
    console.error(
      'Campus assistant is missing required Supabase or Gemini configuration.',
    );
    return json({ error: 'The campus assistant is not configured yet.' }, 503);
  }

  let payload: { question?: unknown; history?: unknown; today?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Send a valid chat question.' }, 400);
  }

  const question =
    typeof payload.question === 'string' ? payload.question.trim() : '';
  if (!question || question.length > 1000)
    return json({ error: 'Enter a question of up to 1,000 characters.' }, 400);
  const today =
    typeof payload.today === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(payload.today)
      ? payload.today
      : new Date().toISOString().slice(0, 10);
  const history: ChatTurn[] = Array.isArray(payload.history)
    ? payload.history
        .filter(
          (turn): turn is { role: string; text: string } =>
            !!turn &&
            typeof turn === 'object' &&
            typeof turn.text === 'string' &&
            ['user', 'model'].includes(String(turn.role)),
        )
        .slice(-6)
        .map(turn => ({
          role: turn.role as ChatTurn['role'],
          text: turn.text.slice(0, 1000),
        }))
    : [];

  const accessToken = authorization.slice('Bearer '.length);
  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: userResult, error: authError } = await supabase.auth.getUser(
    accessToken,
  );
  if (authError || !userResult.user)
    return json({ error: 'Your session expired. Sign in again.' }, 401);

  try {
    const { data: notifications, error: notificationError } = await supabase
      .from('event_notifications')
      .select(
        'event_id, title, message, event_date, start_time, venue, organizer_name, visibility',
      )
      .gte('event_date', dateOffset(today, -30))
      .lte('event_date', dateOffset(today, 365))
      .order('event_date', { ascending: true })
      .limit(150);

    if (notificationError)
      throw new Error(
        `Could not load approved event notifications: ${notificationError.message}`,
      );
    const snapshots = (notifications || []) as EventSnapshot[];
    const eventIds = snapshots.map(event => event.event_id);
    let detailsById: Record<
      string,
      { description: string | null; category: string | null }
    > = {};
    if (eventIds.length) {
      const { data: details, error: detailsError } = await supabase
        .from('events')
        .select('id, description, category')
        .in('id', eventIds)
        .eq('content_type', 'event')
        .eq('approval', 'approved');
      if (detailsError)
        throw new Error(
          `Could not load approved event details: ${detailsError.message}`,
        );
      detailsById = Object.fromEntries(
        (details || []).map(event => [event.id, event]),
      );
    }

    const eventContext = snapshots.map(event => ({
      title: event.title,
      date: event.event_date,
      startTime: event.start_time,
      venue: event.venue,
      organizer: event.organizer_name,
      category: detailsById[event.event_id]?.category || null,
      description:
        detailsById[event.event_id]?.description?.slice(0, 600) || null,
      notification: event.message,
    }));

    let models = await getGeminiModels(geminiApiKey);
    const contents = [
      ...history.map(turn => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      })),
      { role: 'user', parts: [{ text: question }] },
    ];
    const generationRequest = {
      systemInstruction: {
        parts: [
          {
            text: `You are UniVents, a helpful campus assistant. Use the approved event data supplied below for campus-specific facts. Never invent event names, dates, venues, times, registration details, speakers, agendas, or availability. If no event matches a campus-event question, say so clearly. For date questions, match the event date exactly and include the year when useful.

Users may ask what an event is about or ask general questions related to its title, category, or description. Match the event from the supplied data, summarize its actual description when available, then add a brief explanation of the topic using your general knowledge. Clearly label this as general background when it is not stated in the event data. A title or topic is only a clue: do not present guessed activities, event plans, audience, or outcomes as confirmed facts. If the event is ambiguous, ask which event they mean. You may answer general educational follow-up questions on any subject; distinguish general knowledge from information confirmed about UniVents events. For notices or other campus-specific information absent from the supplied event data, say that you cannot confirm it.

Format every answer for a small mobile chat bubble using plain text and line breaks. Do not use Markdown headings, bold markers, or code formatting. Put the direct answer first. When listing multiple events, add a short heading, then use one bullet per event with its title followed by only the available date, time, and venue on indented lines. Keep wording concise and easy to scan. End with one warm, relevant sentence that offers a useful next step, such as asking which event they want details about. Avoid repeating the same generic sign-off.

Today's local date is ${today}. Approved event data: ${JSON.stringify(
              eventContext,
            )}`,
          },
        ],
      },
      contents,
      generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
    };

    let geminiResponse: Response | null = null;
    let attemptedModels: string[] = [];
    for (let refresh = 0; refresh < 2; refresh += 1) {
      if (refresh === 1) models = await getGeminiModels(geminiApiKey, true);
      for (const model of models) {
        if (attemptedModels.includes(model)) continue;
        attemptedModels.push(model);
        geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            model,
          )}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': geminiApiKey,
            },
            body: JSON.stringify(generationRequest),
          },
        );
        if (geminiResponse.ok || geminiResponse.status !== 404) {
          if (geminiResponse.ok)
            cachedFlashModels = {
              names: [model, ...models.filter(name => name !== model)],
              expiresAt: Date.now() + 5 * 60 * 1000,
            };
          break;
        }
      }
      if (
        geminiResponse?.ok ||
        (geminiResponse && geminiResponse.status !== 404)
      )
        break;
    }

    if (!geminiResponse || !geminiResponse.ok) {
      if (geminiResponse?.status === 404) {
        cachedFlashModels = null;
        return json(
          {
            error: `Gemini returned 404 for every available Flash model (${attemptedModels.join(
              ', ',
            )}). Check that Supabase GEMINI_API_KEY is the active key for the UniVents project, and remove GEMINI_MODEL unless you intentionally set it.`,
          },
          502,
        );
      }
      if (!geminiResponse) {
        throw new Error('No Gemini model request was completed.');
      }
      const providerError = await geminiResponse.text();
      console.error(
        'Gemini request failed:',
        geminiResponse.status,
        providerError,
      );
      const errorMessage =
        geminiResponse.status === 401 || geminiResponse.status === 403
          ? 'Gemini rejected the API key or its permissions. Check GEMINI_API_KEY and the key restrictions in Supabase.'
          : geminiResponse.status === 429
          ? 'Gemini quota or rate limit reached. Check the Gemini API quota for this key and try again later.'
          : 'Gemini could not answer this request. Check the function logs and try again.';
      return json({ error: errorMessage }, 502);
    }

    const result = await geminiResponse.json();
    const answer = result.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join('')
      .trim();
    if (!answer)
      return json(
        { error: 'The AI returned an empty response. Please try again.' },
        502,
      );
    return json({ answer });
  } catch (error) {
    console.error('Campus assistant request failed:', error);
    if (
      error instanceof Error &&
      /^(Gemini |No Gemini |This API key )/.test(error.message)
    ) {
      return json({ error: error.message }, 502);
    }
    return json(
      { error: 'Could not load campus event information. Please try again.' },
      500,
    );
  }
});
