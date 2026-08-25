import { z } from 'zod';

export const supplierFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis.'),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;
