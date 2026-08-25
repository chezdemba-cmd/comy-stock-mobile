import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const envAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!envUrl || !envAnonKey) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY manquants. ' +
      'Copiez .env.example vers .env et renseignez vos identifiants Supabase. ' +
      "En attendant, un client factice est utilisé : l'app démarre mais aucun appel réseau ne fonctionnera."
  );
}

// createClient() lève une exception si l'URL est vide/invalide (pas juste un avertissement) :
// sans identifiants réels on retombe sur une URL factice mais valide pour que l'app démarre
// quand même (onboarding, connexion...) au lieu de planter au chargement.
const supabaseUrl = envUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = envAnonKey || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
