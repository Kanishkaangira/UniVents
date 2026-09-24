import React, {createContext, useContext, useMemo, useState} from 'react';
import {NOTICES, flatten} from '../Data/data';

const AppContext = createContext(null);

export function AppProvider({children}) {
  const [profile, setProfile] = useState({
    name: 'Kanishka', faculty: 'SFET', course: 'B.Tech CSE', batch: '2022 – 2026',
    email: 'kanishka@youruniversity.edu.in',
  });
  const [registered, setRegistered] = useState({});
  const [saved, setSaved] = useState({});
  const [read, setRead] = useState({});

  const value = useMemo(() => {
    const toggle = setter => id => setter(prev => ({...prev, [id]: !prev[id]}));
    return {
      profile, setProfile, registered, saved, read,
      toggleRegister: toggle(setRegistered),
      toggleSave: toggle(setSaved),
      markRead: id => setRead(prev => ({...prev, [id]: true})),
      unreadCount: flatten(NOTICES).filter(n => !read[n.id]).length,
      count: obj => Object.values(obj).filter(Boolean).length,
    };
  }, [profile, registered, saved, read]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
