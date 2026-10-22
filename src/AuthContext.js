import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Phone + password login. Supabase needs an email, so we build a hidden one from the phone number.
const cleanPhone = (phone) => String(phone).replace(/[^0-9]/g, '');
const phoneToEmail = (phone) => `${cleanPhone(phone)}@dalab.app`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBooting(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const uid = session?.user?.id;

  // Load my profile (the database creates it right after sign-up, so retry a few times).
  useEffect(() => {
    let active = true;
    if (!uid) {
      setProfile(null);
      return undefined;
    }
    (async () => {
      for (let i = 0; i < 6 && active; i++) {
        const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
        if (data) {
          if (active) setProfile(data);
          return;
        }
        await sleep(700);
      }
      if (active) setProfile({ id: uid, name: '', phone: '', role: 'customer' });
    })();
    return () => {
      active = false;
    };
  }, [uid]);

  const signUp = async (name, phone, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: phoneToEmail(phone),
      password,
      options: { data: { name: name.trim(), phone: cleanPhone(phone) } },
    });
    if (error) throw error;
    if (!data.session) throw new Error('confirm email is on');
  };

  const signIn = async (phone, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(phone),
      password,
    });
    if (error) throw error;
  };

  const signOut = () => supabase.auth.signOut();

  const user = session?.user || null;
  const loading = booting;
  const isStaff = profile?.role === 'rider' || profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isStaff, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
