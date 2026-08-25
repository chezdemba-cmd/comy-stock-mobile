import { useState } from 'react';

import { supabase } from '@/services/supabase';
import type { LoginFormValues, SignupFormValues } from './schemas';

export function useAuth() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function login(values: LoginFormValues) {
    setIsSubmitting(true);
    setErrorMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    setIsSubmitting(false);
    if (error) {
      setErrorMessage(error.message);
      return false;
    }
    return true;
  }

  async function signup(values: SignupFormValues) {
    setIsSubmitting(true);
    setErrorMessage(null);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName },
      },
    });
    setIsSubmitting(false);
    if (error) {
      setErrorMessage(error.message);
      return false;
    }
    return true;
  }

  return { login, signup, isSubmitting, errorMessage };
}
