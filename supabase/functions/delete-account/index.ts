import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST')
    return json({ error: 'Method not allowed.' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer '))
    return json({ error: 'Sign in to delete your account.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('Account deletion is missing Supabase configuration.');
    return json({ error: 'Account deletion is not configured yet.' }, 503);
  }

  const accessToken = authorization.slice('Bearer '.length);
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userResult, error: authError } = await userClient.auth.getUser(
    accessToken,
  );
  if (authError || !userResult.user)
    return json({ error: 'Your session expired. Sign in again.' }, 401);

  const userId = userResult.user.id;
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // Keep events and notices available to the campus, but detach their creator
    // reference before deleting the user and administrator records.
    const { error: postsError } = await adminClient
      .from('events')
      .update({ created_by: null })
      .eq('created_by', userId);
    if (postsError) throw new Error(`Could not detach authored posts: ${postsError.message}`);

    const { error: registrationError } = await adminClient
      .from('event_registrations')
      .delete()
      .eq('user_id', userId);
    if (registrationError)
      throw new Error(`Could not delete event registrations: ${registrationError.message}`);

    const { error: tokenError } = await adminClient
      .from('device_tokens')
      .delete()
      .eq('user_id', userId);
    if (tokenError)
      throw new Error(`Could not delete notification device tokens: ${tokenError.message}`);

    const { error: adminError } = await adminClient
      .from('admins')
      .delete()
      .eq('id', userId);
    if (adminError)
      throw new Error(`Could not delete administrator access: ${adminError.message}`);

    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError)
      throw new Error(`Could not delete the user profile: ${profileError.message}`);

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(
      userId,
      false,
    );
    if (deleteUserError)
      throw new Error(`Could not delete the authentication account: ${deleteUserError.message}`);

    return json({ success: true });
  } catch (error) {
    console.error('Account deletion failed:', error);
    return json(
      {
        error: 'Account deletion could not be completed. Please try again or contact UniVents support.',
      },
      500,
    );
  }
});
