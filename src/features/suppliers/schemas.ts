import { z } from 'zod';

export const supplierFormSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis.'),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.union([z.literal(''), z.string().trim().email("L'adresse email est invalide.")]).optional(),
  address: z.string().optional(),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;
