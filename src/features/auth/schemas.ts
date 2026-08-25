import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'auth.validation.emailInvalid').email('auth.validation.emailInvalid'),
  password: z.string().min(8, 'auth.validation.passwordMin'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  fullName: z.string().min(1, 'auth.validation.nameRequired'),
  email: z.string().min(1, 'auth.validation.emailInvalid').email('auth.validation.emailInvalid'),
  password: z.string().min(8, 'auth.validation.passwordMin'),
});

export type SignupFormValues = z.infer<typeof signupSchema>;
