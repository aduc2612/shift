import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import type { Session } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
      })
      .catch((err) => {
        console.error('useAuth: getSession failed', err);
      })
      .finally(() => {
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session,
    loading,
  };
}
