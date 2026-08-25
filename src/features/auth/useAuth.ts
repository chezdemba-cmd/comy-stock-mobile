import { useState } from 'react';

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

  return { login, signup, isSubmitting };
}
