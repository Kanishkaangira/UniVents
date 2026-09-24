import {supabase} from './supabase';

const check = ({data, error}) => {
  if (error) throw new Error(error.message);
  return data;
};

// Static tables (users cannot edit them)
export const fetchDepartments = () =>
  supabase.from('departments').select('id, name, code').order('created_at').then(check);

export const fetchClubs = () =>
  supabase.from('clubs').select('id, name, code').order('created_at').then(check);

// Profile of the logged-in user (one row in `profiles`)
export const fetchMyProfile = userId =>
  supabase.from('profiles').select('*').eq('id', userId).maybeSingle().then(check);

export const createMyProfile = (userId, email, fields) =>
  supabase.from('profiles').upsert({id: userId, email, ...fields}, {onConflict: 'id'}).select('*').single().then(check);

// Only the columns allowed by the database: user_name, department_id, course, batch, semester
export const updateMyProfile = (userId, fields) =>
  supabase.from('profiles').update(fields).eq('id', userId).select().single().then(check);

// Events AND notices come from the same table (`events`). RLS already hides rows the user may not see;
// the visibility filter is repeated here so the query is explicit.
export const fetchPosts = userType =>
  supabase
    .from('events')
    .select('*')
    .in('visibility', ['all', userType])
    .neq('status', 'completed')
    .then(check);

export const signInWithEmail = (email, password) =>
  supabase.auth.signInWithPassword({email, password});

export const requestEmailOnlyOtp = email =>
  supabase.auth.signInWithOtp({email, options: {shouldCreateUser: true}});

export const verifyEmailOtp = (email, token) =>
  supabase.auth.verifyOtp({email, token, type: 'email'});

export const signOut = () => supabase.auth.signOut();
