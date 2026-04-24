import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Reseller } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  reseller: Reseller | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshReseller: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReseller = async (userId: string) => {
    const { data } = await supabase.from('resellers').select('*').eq('user_id', userId).maybeSingle();
    setReseller(data as Reseller | null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadReseller(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        loadReseller(sess.user.id);
      } else {
        setReseller(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setReseller(null);
  };

  const refreshReseller = async () => {
    if (session?.user) await loadReseller(session.user.id);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, reseller, loading, signOut, refreshReseller }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
