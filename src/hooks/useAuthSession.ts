import { useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/stores/authStore';

/**
 * Initialise la session Supabase au démarrage et s'abonne aux changements
 * (connexion, déconnexion, refresh de token).
 */
export function useAuthSession() {
  const setSession = useAuthStore((state) => state.setSession);
  const setInitializing = useAuthStore((state) => state.setInitializing);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [setSession, setInitializing]);
}
