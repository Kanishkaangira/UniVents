import {supabase} from './supabase';

const check = ({data, error}) => {
  if (error) {
    if (error.code === 'PGRST204' && /enroll_no|skill_faculty_id/i.test(error.message)) {
      throw new Error('The profiles table is missing profile fields. Run supabase/account_setup.sql and supabase/profile_skill_faculty_scope.sql in the Supabase SQL Editor, then retry.');
    }
    if (error.code === '23503' && /profiles_department_id_fkey|profiles_skill_faculty_id_fkey/i.test(`${error.message} ${error.details || ''}`)) {
      throw new Error('Profile faculty or department setup is out of date. Run supabase/profile_skill_faculty_scope.sql in the Supabase SQL Editor, then retry.');
    }
    throw new Error(error.message);
  }
  return data;
};

// Static tables (users cannot edit them)
export const fetchSkillFaculties = () =>
  supabase.from('skill_faculty').select('id, name, code').order('created_at').then(check);

export const fetchDepartments = () =>
  supabase.from('department').select('id, name, code, skill_faculty_id').order('created_at').then(check);

export const fetchClubs = () =>
  supabase.from('clubs').select('id, name, code').order('created_at').then(check);

// Profile of the logged-in user (one row in `profiles`)
export const fetchMyProfile = userId =>
  supabase.from('profiles').select('*').eq('id', userId).maybeSingle().then(check);

// A profile is created once, right after the email code is verified. Its id/email
// always come from Supabase Auth, keeping profiles.id linked to auth.users.id.
export const createMyProfile = async fields => {
  const {data, error} = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Your session expired. Sign in again to finish your profile.');

  return supabase
    .from('profiles')
    .insert({id: data.user.id, email: data.user.email, ...fields})
    .select('*')
    .single()
    .then(check);
};

// Password for later sign-ins (the account itself is created with the email code, without a password)
export const setMyPassword = password =>
  supabase.auth.updateUser({password, data: {password_set: true}});

// Update the authenticated user's editable profile fields in Supabase.
export const updateMyProfile = async fields => {
  const {data, error} = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Your session expired. Sign in again to edit your profile.');

  const result = await supabase.from('profiles').update(fields).eq('id', data.user.id).select().single();
  if (result.error?.code === '42501') {
    throw new Error('Supabase blocked this profile update. Run the latest supabase/account_setup.sql to add the profile update policy, then retry.');
  }
  return check(result);
};

// Events AND notices come from the same table (`events`). RLS already hides rows the user may not see;
// the visibility filter is repeated here so the query is explicit.
export const fetchPosts = userType =>
  supabase
    .from('events')
    .select('*')
    .eq('approval', 'approved')
    .in('visibility', ['all', userType])
    .order('created_at', {ascending: false})
    .then(check);

// Approved event and notice snapshots are maintained by the database trigger.
export const fetchPostNotifications = userType =>
  supabase
    .from('event_notifications')
    .select('*')
    .in('visibility', ['all', userType])
    .order('published_at', {ascending: false})
    .then(check);

// Registration records are owned by the signed-in user. Profile fields are
// copied server-side by register_for_event so clients cannot forge snapshots.
export const fetchMyRegistrations = userId =>
  supabase
    .from('event_registrations')
    .select('event_id')
    .eq('user_id', userId)
    .then(check)
    .then(rows => Object.fromEntries(rows.map(row => [row.event_id, true])));

export const registerForEvent = eventId =>
  supabase.rpc('register_for_event', {p_event_id: eventId}).then(check);

export const signInWithEmail = (email, password) =>
  supabase.auth.signInWithPassword({email, password});

export const isEmailRegistered = email =>
  supabase.rpc('email_is_registered', {p_email: email});

export const requestEmailOnlyOtp = email =>
  supabase.auth.signInWithOtp({email, options: {shouldCreateUser: true}});

export const verifyEmailOtp = (email, token) =>
  supabase.auth.verifyOtp({email, token, type: 'email'});

export const requestPasswordResetOtp = email =>
  supabase.auth.resetPasswordForEmail(email);

export const verifyPasswordResetOtp = (email, token) =>
  supabase.auth.verifyOtp({email, token, type: 'recovery'});

export const updatePassword = password =>
  supabase.auth.updateUser({password});

export const deleteMyAccount = async () => {
  const {data, error} = await supabase.functions.invoke('delete-account', {body: {}});
  if (error) {
    let message = error.message || 'Could not delete your account.';
    try {
      const response = await error.context?.json();
      if (typeof response?.error === 'string') message = response.error;
    } catch {
      // Keep the Functions client error when the response has no JSON body.
    }
    throw new Error(message);
  }

  const {error: signOutError} = await supabase.auth.signOut({scope: 'local'});
  if (signOutError) throw new Error(signOutError.message);
  return data;
};

export const signOut = () => supabase.auth.signOut();
