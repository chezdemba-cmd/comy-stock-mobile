import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const envAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!envUrl || !envAnonKey) {
  if (!__DEV__) {
    throw new Error(
      '[supabase] Configuration de production absente : EXPO_PUBLIC_SUPABASE_URL et ' +
        'EXPO_PUBLIC_SUPABASE_ANON_KEY sont obligatoires.'
    );
  }

  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY manquants. ' +
      'Copiez .env.example vers .env et renseignez vos identifiants Supabase. ' +
      "En attendant, un client factice est utilisé : l'app démarre mais aucun appel réseau ne fonctionnera."
  );
}

// createClient() lève une exception si l'URL est vide/invalide (pas juste un avertissement) :
// En développement uniquement, une URL factice permet d'afficher l'interface
// avant d'avoir configuré le projet. Un bundle de production échoue plus haut.
const supabaseUrl = envUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = envAnonKey || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // PKCE plutôt que le flux implicite par défaut : sur mobile, il n'y a pas de barre
    // d'adresse pour porter un fragment #access_token=..., donc le lien de réinitialisation
    // de mot de passe (reset-password.tsx) doit recevoir un ?code=... échangeable via
    // exchangeCodeForSession — c'est ce que documente Supabase pour React Native/Expo.
    flowType: 'pkce',
  },
});
