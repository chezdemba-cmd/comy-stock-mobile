import { z } from 'zod';

export const expenseCategoryOptions = [
  { value: 'transport', label: 'Transport' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'loyer', label: 'Loyer' },
  { value: 'salaire', label: 'Salaire' },
  { value: 'achat', label: 'Achat' },
  { value: 'livraison', label: 'Livraison' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'communication', label: 'Communication' },
  { value: 'autre', label: 'Autre' },
] as const;

export const expenseCategoryLabel: Record<string, string> = Object.fromEntries(
  expenseCategoryOptions.map((option) => [option.value, option.label])
);

export const expenseFormSchema = z.object({
  amount: z
    .string()
    .min(1, 'Le montant est requis.')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, 'Le montant doit être positif.'),
  category: z.string().min(1, 'La catégorie est requise.'),
  description: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
