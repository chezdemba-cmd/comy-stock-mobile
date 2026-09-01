import { useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { clearLocalSession } from '@/features/auth/signOut';
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

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      // Couvre aussi la déconnexion non explicite (token expiré, refresh échoué) :
      // le SDK émet SIGNED_OUT sans passer par notre écran de déconnexion.
      if (event === 'SIGNED_OUT') {
        void clearLocalSession();
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [setSession, setInitializing]);
}
