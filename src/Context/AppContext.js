import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {supabase} from '../Services/supabase';
import * as api from '../Services/api';
import {buildTree, mapPost} from '../Services/mappers';

const AppContext = createContext(null);

const profileIsComplete = row => Boolean(
  row?.user_name?.trim() && row.user_type && row.department_id &&
  (row.user_type === 'faculty' || (row.user_type === 'student' && row.enroll_no?.trim() && row.course?.trim() && row.batch?.trim() && row.semester)),
);

export function AppProvider({children}) {
  // ---- auth + data from Supabase ----
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileStatus, setProfileStatus] = useState('checking');
  const [departments, setDepartments] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ---- local-only state (the schema has no registrations / saved / read tables) ----
  const [registered, setRegistered] = useState({});
  const [saved, setSaved] = useState({});
  const [read, setRead] = useState({});
  const currentUserId = useRef(null);
  currentUserId.current = session?.user?.id || null;

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => {
      setSession(data.session);
      setBooting(false);
    });
    const {data} = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    if (!session) {
      setProfile(null);
      setProfileStatus('signedOut');
      setDepartments([]);
      setClubs([]);
      setPosts([]);
      setError(null);
      setLoading(false);
      return;
    }

    const requestUserId = session.user.id;
    setLoading(true);
    setError(null);
    let profileResolved = false;
    try {
      const me = await api.fetchMyProfile(session.user.id);
      if (currentUserId.current !== requestUserId) return;
      setProfile(me);
      setProfileStatus(profileIsComplete(me) ? 'complete' : 'missing');
      profileResolved = true;
      const [deps, cls, rows] = await Promise.all([
        api.fetchDepartments(),
        api.fetchClubs(),
        api.fetchPosts(me?.user_type || 'student'),
      ]);
      if (currentUserId.current !== requestUserId) return;
      setDepartments(deps);
      setClubs(cls);
      setPosts(rows);
    } catch (e) {
      if (currentUserId.current === requestUserId) {
        setError(e.message);
        if (!profileResolved) setProfileStatus('error');
      }
    } finally {
      if (currentUserId.current === requestUserId) setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    setProfileStatus(session ? 'checking' : 'signedOut');
    load();
  }, [session, load]);

  // Live updates: reload whenever someone adds / edits an event or notice
  useEffect(() => {
    if (!session) return undefined;
    const channel = supabase
      .channel('events-feed')
      .on('postgres_changes', {event: '*', schema: 'public', table: 'events'}, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, load]);

  const value = useMemo(() => {
    const items = posts.map(mapPost);
    const events = items.filter(i => i.kind === 'event').sort((a, b) => String(a.dateISO).localeCompare(String(b.dateISO)));
    const notices = items.filter(i => i.kind === 'notice').sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const toggle = setter => id => setter(prev => ({...prev, [id]: !prev[id]}));
    return {
      session, booting, profile, profileStatus, departments, clubs, loading, error, refresh: load,
      events, notices,
      eventTree: buildTree(events, departments, clubs),
      noticeTree: buildTree(notices, departments, clubs),
      myDepartment: departments.find(d => d.id === profile?.department_id),
      registered, saved, read,
      toggleRegister: toggle(setRegistered),
      toggleSave: toggle(setSaved),
      markRead: id => setRead(prev => ({...prev, [id]: true})),
      unreadCount: notices.filter(n => !read[n.id]).length,
      count: obj => Object.values(obj).filter(Boolean).length,
      signIn: async (email, password) => (await api.signInWithEmail(email, password)).error?.message,
      requestEmailOnlyOtp: email => api.requestEmailOnlyOtp(email),
      verifyEmailOtp: (email, token) => api.verifyEmailOtp(email, token),
      signOut: () => api.signOut(),
      saveProfile: async fields => setProfile(await api.updateMyProfile(session.user.id, fields)),
      completeProfile: async fields => {
        const created = await api.createMyProfile(session.user.id, session.user.email, fields);
        setProfile(created);
        setProfileStatus('complete');
        return created;
      },
    };
  }, [session, booting, profile, profileStatus, departments, clubs, posts, loading, error, load, registered, saved, read]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
