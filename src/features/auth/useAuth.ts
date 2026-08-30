import { useState } from 'react';
import * as Linking from 'expo-linking';

import { supabase } from '@/services/supabase';
import type { LoginFormValues, SignupFormValues } from './schemas';

export function useAuth() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function login(values: LoginFormValues): Promise<string | null> {
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    setIsSubmitting(false);
    return error ? error.message : null;
  }

  async function signup(values: SignupFormValues): Promise<string | null> {
    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName },
      },
    });
    setIsSubmitting(false);
    return error ? error.message : null;
  }

  // Envoie l'email de réinitialisation. Le lien pointe vers reset-password (deep link
  // comystock://reset-password), qui échange le code contre une session le temps de
  // choisir un nouveau mot de passe. Ne révèle jamais si l'email existe ou non (Supabase
  // renvoie un succès dans les deux cas côté API) pour éviter l'énumération de comptes.
  async function requestPasswordReset(email: string): Promise<string | null> {
    setIsSubmitting(true);
    const redirectTo = Linking.createURL('reset-password');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setIsSubmitting(false);
    return error ? error.message : null;
  }

  async function updatePassword(password: string): Promise<string | null> {
    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);
    return error ? error.message : null;
  }

  return { login, signup, requestPasswordReset, updatePassword, isSubmitting };
}
