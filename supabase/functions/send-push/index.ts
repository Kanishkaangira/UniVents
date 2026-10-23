import {createClient} from 'npm:@supabase/supabase-js@2';

const encoder = new TextEncoder();
const oauthScope = 'https://www.googleapis.com/auth/firebase.messaging';
const oauthAudience = 'https://oauth2.googleapis.com/token';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type EventNotification = {
  id: string;
  event_id: string;
  content_type: string;
  title: string;
  message: string;
  visibility: string;
  image_url?: string | null;
};

type EventRow = {
  id: string;
  content_type: string;
  approval: string;
  organizer_scope: string;
  skill_faculty_id: string | null;
  department_id: string | null;
  club_id: string | null;
};

type AdminRow = {
  id: string;
  scope_type: string;
  skill_faculty_id: string | null;
  department_id: string | null;
  club_id: string | null;
};

let cachedAccessToken: {value: string; expiresAt: number} | null = null;

function base64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function encodeJson(value: unknown) {
  return base64Url(encoder.encode(JSON.stringify(value)));
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {...corsHeaders, 'Content-Type': 'application/json'},
  });
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

function adminCanReviewEvent(admin: AdminRow, event: EventRow) {
  return admin.scope_type === 'super'
    || (admin.scope_type === 'skill_faculty'
      && ['skill_faculty', 'department'].includes(event.organizer_scope)
      && event.skill_faculty_id === admin.skill_faculty_id)
    || (admin.scope_type === 'department'
      && event.organizer_scope === 'department'
      && event.department_id === admin.department_id)
    || (admin.scope_type === 'club'
      && event.organizer_scope === 'club'
      && event.club_id === admin.club_id);
}

async function getFirebaseAccessToken(serviceAccount: Record<string, string>) {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.value;
  }

  const privateKeyPem = serviceAccount.private_key?.replace(/\\n/g, '\n');
  if (!serviceAccount.client_email || !privateKeyPem) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is missing client_email or private_key.');
  }

  const keyBytes = Uint8Array.from(
    atob(privateKeyPem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')),
    character => character.charCodeAt(0),
  );
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'},
    false,
    ['sign'],
  );

  const now = Math.floor(Date.now() / 1000);
  const unsignedAssertion = `${encodeJson({alg: 'RS256', typ: 'JWT'})}.${encodeJson({
    iss: serviceAccount.client_email,
    scope: oauthScope,
    aud: oauthAudience,
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(unsignedAssertion),
  );
  const assertion = `${unsignedAssertion}.${base64Url(new Uint8Array(signature))}`;
  const tokenResponse = await fetch(oauthAudience, {
    method: 'POST',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Google OAuth token request failed (${tokenResponse.status}).`);
  }

  const token = await tokenResponse.json();
  cachedAccessToken = {
    value: token.access_token,
    expiresAt: Date.now() + Number(token.expires_in ?? 3600) * 1000,
  };
  return cachedAccessToken.value;
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', {headers: corsHeaders});
  if (request.method !== 'POST') return json({error: 'Method not allowed.'}, 405);

  const authorization = request.headers.get('authorization') ?? '';
  const bearerToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : '';
  const isDatabaseWebhook = !!supabaseServiceKey
    && constantTimeEqual(bearerToken, supabaseServiceKey);
  if (!supabaseUrl || !supabaseServiceKey || (!isDatabaseWebhook && !anonKey)) {
    console.error('Missing Supabase runtime configuration for send-push.');
    return json({error: 'Push service is not configured.'}, 500);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json({error: 'Request body must be valid JSON.'}, 400);
  }

  let adminUserId = '';
  if (!isDatabaseWebhook) {
    if (!bearerToken) return json({error: 'Sign in to an admin account first.'}, 401);
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: {persistSession: false, autoRefreshToken: false},
    });
    const {data: authData, error: authError} = await authClient.auth.getUser(bearerToken);
    if (authError || !authData.user) {
      return json({error: 'Your admin session is invalid or expired.'}, 401);
    }
    adminUserId = authData.user.id;
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {persistSession: false, autoRefreshToken: false},
  });
  let row: EventNotification;
  try {
    if (isDatabaseWebhook) {
      if (payload.table === 'event_notifications' && payload.type === 'INSERT' && payload.record) {
        row = payload.record as EventNotification;
      } else if (
        payload.table === 'events'
        && ['INSERT', 'UPDATE'].includes(String(payload.type))
        && payload.record
        && typeof (payload.record as Record<string, unknown>).id === 'string'
      ) {
        const eventRecord = payload.record as Record<string, unknown>;
        const eventId = eventRecord.id as string;
        const oldEventRecord = (payload.old_record ?? payload.old) as Record<string, unknown> | undefined;
        if (
          payload.type === 'UPDATE'
          && (!oldEventRecord || oldEventRecord.approval === 'approved')
        ) {
          return json({ignored: true, reason: 'The post was not newly approved.'});
        }

        const {data: event, error: eventError} = await adminClient
          .from('events')
          .select('id, content_type, approval')
          .eq('id', eventId)
          .maybeSingle();
        if (eventError) throw eventError;
        if (!event || !['event', 'notice'].includes(event.content_type) || event.approval !== 'approved') {
          return json({ignored: true, reason: 'The post is not approved for notification.'});
        }

        const {data, error: notificationError} = await adminClient
          .from('event_notifications')
          .select('id, event_id, content_type, title, message, visibility, image_url')
          .eq('event_id', eventId)
          .maybeSingle();
        if (notificationError) throw notificationError;
        if (!data) return json({ignored: true, reason: 'The approved post notification row was not created.'});
        row = data as EventNotification;
      } else {
        return json({ignored: true, reason: 'Unsupported database webhook event.'});
      }
    } else {
      const eventId = typeof payload.event_id === 'string' ? payload.event_id : '';
      if (!eventId) return json({error: 'event_id is required.'}, 400);

      const [{data: admin, error: adminError}, {data: event, error: eventError}] = await Promise.all([
        adminClient.from('admins')
          .select('id, scope_type, skill_faculty_id, department_id, club_id')
          .eq('id', adminUserId)
          .maybeSingle(),
        adminClient.from('events')
          .select('id, content_type, approval, organizer_scope, skill_faculty_id, department_id, club_id')
          .eq('id', eventId)
          .maybeSingle(),
      ]);
      if (adminError || eventError) throw adminError ?? eventError;
      if (!admin || !event || !adminCanReviewEvent(admin as AdminRow, event as EventRow)) {
        return json({error: 'This event is outside your admin scope.'}, 403);
      }
      if (!['event', 'notice'].includes(event.content_type) || event.approval !== 'approved') {
        return json({error: 'Only approved events and notices can send a push notification.'}, 409);
      }

      const {data, error: notificationError} = await adminClient
        .from('event_notifications')
        .select('id, event_id, content_type, title, message, visibility, image_url')
        .eq('event_id', eventId)
        .maybeSingle();
      if (notificationError) throw notificationError;
      if (!data) return json({error: 'The approved post notification row was not created.'}, 409);
      row = data as EventNotification;
    }
  } catch (error) {
    console.error('Could not load the approved event notification:', error instanceof Error ? error.message : 'Unknown error');
    return json({error: 'Could not load the approved event notification.'}, 500);
  }

  if (!row.id || !row.event_id || !row.title || !row.message
    || !['event', 'notice'].includes(row.content_type)) {
    return json({error: 'Post notification row is missing required fields.'}, 400);
  }

  const recipientUserTypes = row.visibility === 'all'
    ? ['student', 'faculty']
    : ['student', 'faculty'].includes(row.visibility)
      ? [row.visibility]
      : null;
  if (!recipientUserTypes) return json({error: 'The post has an unsupported notification audience.'}, 400);

  let tokens: {fcm_token: string}[] = [];
  for (let offset = 0; ; offset += 1000) {
    const {data: deviceTokens, error: tokenError} = await adminClient.rpc(
      'get_event_push_device_tokens',
      {p_user_types: recipientUserTypes, p_offset: offset, p_limit: 1000},
    );
    if (tokenError) {
      console.error('Could not load registered push devices:', tokenError.message);
      return json({error: 'Could not load registered push devices.'}, 500);
    }
    const page = deviceTokens ?? [];
    tokens.push(...page);
    if (page.length < 1000) break;
  }

  const {data: claimed, error: claimError} = await adminClient
    .from('event_notifications')
    .update({push_sent_at: new Date().toISOString()})
    .eq('id', row.id)
    .is('push_sent_at', null)
    .select('id')
    .maybeSingle();
  if (claimError) {
    console.error('Could not claim the event push:', claimError.message);
    return json({error: 'Could not prepare the event push. Check the push_sent_at database migration.'}, 500);
  }
  if (!claimed) return json({sent: false, reason: 'already_sent'});

  if (tokens.length === 0) {
    return json({sent: false, reason: 'no_registered_devices'});
  }

  try {
    const rawServiceAccount = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!rawServiceAccount) throw new Error('FIREBASE_SERVICE_ACCOUNT is not configured.');
    const serviceAccount = JSON.parse(rawServiceAccount);
    const projectId = serviceAccount.project_id;
    if (!projectId) throw new Error('FIREBASE_SERVICE_ACCOUNT is missing project_id.');

    const accessToken = await getFirebaseAccessToken(serviceAccount);
    const sendToToken = async (fcmToken: string) => {
      try {
        const fcmResponse = await fetch(
          `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`,
          {
            method: 'POST',
            headers: {
              authorization: `Bearer ${accessToken}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              message: {
                token: fcmToken,
                notification: {title: row.title, body: row.message},
                android: {
                  priority: 'high',
                  notification: {
                    channel_id: 'univents_event_updates_v2',
                    icon: 'ic_stat_univents',
                    color: '#5B4BFF',
                    sound: 'default',
                    ...(row.image_url ? {image: row.image_url} : {}),
                  },
                },
                data: {
                  notification_id: row.id,
                  event_id: row.event_id,
                  type: `${row.content_type}_published`,
                },
              },
            }),
          },
        );
        if (fcmResponse.ok) return {sent: true, token: fcmToken};
        const details = await fcmResponse.text();
        return {sent: false, token: fcmToken, status: fcmResponse.status, details};
      } catch (error) {
        return {
          sent: false,
          token: fcmToken,
          status: 0,
          details: error instanceof Error ? error.message : 'FCM request failed.',
        };
      }
    };

    const results: Awaited<ReturnType<typeof sendToToken>>[] = [];
    for (let index = 0; index < tokens.length; index += 10) {
      const batch = tokens.slice(index, index + 10);
      results.push(...await Promise.all(batch.map(device => sendToToken(device.fcm_token))));
    }

    const sentTokens = results.filter(result => result.sent);
    const failedTokens = results.filter(
      (result): result is Extract<typeof result, {sent: false}> => !result.sent,
    );
    const invalidTokens = failedTokens.filter(result => {
      try {
        const error = JSON.parse(result.details);
        return error.error?.details?.some((detail: {errorCode?: string}) =>
          detail.errorCode === 'UNREGISTERED');
      } catch {
        return false;
      }
    });

    if (invalidTokens.length > 0) {
      const {error: cleanupError} = await adminClient
        .from('device_tokens')
        .delete()
        .in('fcm_token', invalidTokens.map(result => result.token));
      if (cleanupError) {
        console.error('Could not remove invalid push device tokens:', cleanupError.message);
      }
    }

    if (failedTokens.length > 0) {
      console.error(
        `FCM rejected ${failedTokens.length} of ${results.length} event push deliveries.`,
        failedTokens.map(result => ({status: result.status, details: result.details})),
      );
    }
    if (sentTokens.length === 0) {
      const {error: releaseError} = await adminClient
        .from('event_notifications')
        .update({push_sent_at: null})
        .eq('id', row.id);
      if (releaseError) console.error('Could not release failed push claim:', releaseError.message);
      return json({error: 'Firebase rejected all push notification deliveries.'}, 502);
    }

    return json({
      sent: true,
      sent_count: sentTokens.length,
      failed_count: failedTokens.length,
    });
  } catch (error) {
    const {error: releaseError} = await adminClient.from('event_notifications')
      .update({push_sent_at: null}).eq('id', row.id);
    if (releaseError) console.error('Could not release failed push claim:', releaseError.message);
    console.error('Push notification failed:', error instanceof Error ? error.message : 'Unknown error');
    return json({error: error instanceof Error ? error.message : 'Could not send the push notification.'}, 500);
  }
});
