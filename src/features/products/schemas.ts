import { z } from 'zod';

function numericString(message: string) {
  return z
    .string()
    .min(1, message)
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, message);
}

export const productFormSchema = z.object({
  name: z.string().min(1, 'Le nom du produit est requis.'),
  categoryId: z.string().nullable(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  purchasePrice: numericString("Le prix d'achat doit être un nombre positif."),
  salePrice: numericString('Le prix de vente doit être un nombre positif.'),
  initialStock: z.string().optional(),
  stockMin: numericString('Le stock minimum doit être un nombre positif.'),
  unit: z.string().min(1, "L'unité est requise."),
  supplierName: z.string().optional(),
  description: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const unitOptions = [
  { value: 'unité', label: 'Unité' },
  { value: 'sac', label: 'Sac' },
  { value: 'carton', label: 'Carton' },
  { value: 'kg', label: 'Kg' },
  { value: 'litre', label: 'Litre' },
  { value: 'paquet', label: 'Paquet' },
];
