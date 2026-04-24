import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Reseller } from '@/lib/supabase';

const ADMIN_EMAILS = ['v17tormr@gmail.com'];

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  reseller: Reseller | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshReseller: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function checkIsAdmin(user: User | null): boolean {
  if (!user) return false;
  return ADMIN_EMAILS.includes(user.email || '') || user.user_metadata?.role === 'admin';
}

// Auto-cria / atualiza row de reseller pra admin
async function ensureAdminReseller(user: User): Promise<Reseller | null> {
  const { data: existing } = await supabase.from('resellers').select('*').eq('user_id', user.id).maybeSingle();

  if (existing) {
    // Se admin mas entry_paid=false ou status diferente de active, força
    const e = existing as Reseller;
    if (!e.entry_paid || e.status !== 'active' || e.tier !== 'ouro') {
      const { data: updated } = await supabase.from('resellers').update({
        entry_paid: true,
        status: 'active',
        tier: 'ouro',
      }).eq('id', e.id).select('*').maybeSingle();
      return (updated || existing) as Reseller;
    }
    return e;
  }

  // Cria row nova
  const uniqueCpf = `ADMIN${user.id.slice(0, 8).toUpperCase()}`;
  const uniqueWa = `00000${user.id.slice(0, 6).replace(/[^\d]/g, '0').padEnd(6, '0')}`;

  const { data: inserted, error } = await supabase.from('resellers').insert({
    user_id: user.id,
    name: (user.user_metadata?.name as string) || 'Admin DSL',
    email: user.email || `admin-${user.id}@devsemlimites.site`,
    whatsapp: uniqueWa,
    cpf: uniqueCpf,
    entry_paid: true,
    status: 'active',
    tier: 'ouro',
  }).select('*').maybeSingle();

  if (error) {
    console.error('ensureAdminReseller error:', error.message);
    return null;
  }
  return inserted as Reseller | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReseller = async (user: User) => {
    const { data } = await supabase.from('resellers').select('*').eq('user_id', user.id).maybeSingle();

    if (data) {
      setReseller(data as Reseller);
      return;
    }

    // Se é admin sem row, cria automaticamente
    if (checkIsAdmin(user)) {
      const adminRow = await ensureAdminReseller(user);
      setReseller(adminRow);
      return;
    }

    setReseller(null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadReseller(data.session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        loadReseller(sess.user);
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
    if (session?.user) await loadReseller(session.user);
  };

  const user = session?.user ?? null;
  const isAdmin = checkIsAdmin(user);

  return (
    <AuthContext.Provider value={{ session, user, reseller, isAdmin, loading, signOut, refreshReseller }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
