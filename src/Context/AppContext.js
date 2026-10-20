import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {supabase} from '../Services/supabase';
import * as api from '../Services/api';
import {buildTree, mapPost} from '../Services/mappers';

const AppContext = createContext(null);

const profileIsComplete = row => Boolean(
  row?.user_name?.trim() && row.user_type && (row.user_type === 'administration' || row.department_id) &&
  (row.user_type === 'faculty' || row.user_type === 'administration' || (row.user_type === 'student' && row.enroll_no?.trim() && row.course?.trim() && row.batch?.trim() && row.semester)),
);

export function AppProvider({children}) {
  // ---- auth + data from Supabase ----
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileStatus, setProfileStatus] = useState('checking');
  const [skillFaculties, setSkillFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ---- local preferences + persisted registrations ----
  const [registered, setRegistered] = useState({});
  const [saved, setSaved] = useState({});
  const [read, setRead] = useState({});
  const currentUserId = useRef(null);
  const loadRequest = useRef(0);
  const sessionUserId = session?.user?.id || null;
  currentUserId.current = sessionUserId;

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => {
      setSession(data.session);
      setBooting(false);
    });
    const {data} = supabase.auth.onAuthStateChange((event, s) => {
      // Keep recovery OTP verification inside the login screen so the user can
      // choose a new password before the normal signed-in routes are mounted.
      if (event === 'PASSWORD_RECOVERY') return;
      // Setting the password during profile setup must not reload the app state mid-form
      if (event === 'USER_UPDATED') return;
      setSession(s);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const load = useCallback(async ({silent = false} = {}) => {
    const requestId = ++loadRequest.current;
    if (!sessionUserId) {
      setProfile(null);
      setProfileStatus('signedOut');
      setSkillFaculties([]);
      setDepartments([]);
      setClubs([]);
      setPosts([]);
      setRegistered({});
      setError(null);
      setLoading(false);
      return;
    }

    const requestUserId = sessionUserId;
    const isCurrentRequest = () => currentUserId.current === requestUserId && loadRequest.current === requestId;
    if (!silent) setLoading(true);
    setError(null);
    let profileResolved = false;
    try {
      const me = await api.fetchMyProfile(requestUserId);
      if (!isCurrentRequest()) return;
      setProfile(me);
      setProfileStatus(profileIsComplete(me) ? 'complete' : 'missing');
      profileResolved = true;
      const [faculties, deps, cls, rows] = await Promise.all([
        api.fetchSkillFaculties(),
        api.fetchDepartments(),
        api.fetchClubs(),
        api.fetchPosts(me?.user_type || 'student'),
      ]);
      if (!isCurrentRequest()) return;
      setSkillFaculties(faculties);
      setDepartments(deps);
      setClubs(cls);
      setPosts(rows);
      try {
        const registrations = await api.fetchMyRegistrations(requestUserId);
        if (isCurrentRequest()) setRegistered(registrations);
      } catch {
        // Keep the feed available if the optional registrations migration has not run yet.
        if (isCurrentRequest()) setRegistered({});
      }
    } catch (e) {
      if (isCurrentRequest()) {
        setError(e.message);
        if (!profileResolved) setProfileStatus('error');
      }
    } finally {
      if (isCurrentRequest() && !silent) setLoading(false);
    }
  }, [sessionUserId]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    setProfileStatus(sessionUserId ? 'checking' : 'signedOut');
    load();
  }, [sessionUserId, load]);

  const value = useMemo(() => {
    const items = posts.map(mapPost);
    const events = items.filter(i => i.kind === 'event').sort((a, b) => String(a.dateISO).localeCompare(String(b.dateISO)));
    const notices = items.filter(i => i.kind === 'notice').sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const toggle = setter => id => setter(prev => ({...prev, [id]: !prev[id]}));
    return {
      session, booting, profile, profileStatus, skillFaculties, departments, clubs, loading, refreshing, error, refresh,
      events, notices,
      eventTree: buildTree(events, skillFaculties, departments, clubs),
      noticeTree: buildTree(notices, skillFaculties, departments, clubs),
      myDepartment: departments.find(d => d.id === profile?.department_id)
        || skillFaculties.find(faculty => faculty.id === profile?.department_id),
      registered, saved, read,
      registerForEvent: async id => {
        if (!profile?.id) throw new Error('Sign in and complete your profile before registering.');
        if (registered[id]) return false;
        await api.registerForEvent(id);
        setRegistered(prev => ({...prev, [id]: true}));
        return true;
      },
      toggleSave: toggle(setSaved),
      markRead: id => setRead(prev => ({...prev, [id]: true})),
      unreadCount: notices.filter(n => !read[n.id]).length,
      count: obj => Object.values(obj).filter(Boolean).length,
      signIn: async (email, password) => (await api.signInWithEmail(email, password)).error?.message,
      requestEmailOnlyOtp: email => api.requestEmailOnlyOtp(email),
      verifyEmailOtp: (email, token) => api.verifyEmailOtp(email, token),
      setPassword: async password => {
        const {error: e} = await api.setMyPassword(password);
        // retrying after a failed profile save sends the same password again: that is fine
        if (e && !/different from the old password/i.test(e.message)) throw new Error(e.message);
      },
      signOut: () => api.signOut(),
      saveProfile: async fields => setProfile(await api.updateMyProfile(fields)),
      completeProfile: async fields => {
        const created = await api.createMyProfile(fields);
        setProfile(created);
        setProfileStatus('complete');
        return created;
      },
    };
  }, [session, booting, profile, profileStatus, skillFaculties, departments, clubs, posts, loading, refreshing, error, refresh, registered, saved, read]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
