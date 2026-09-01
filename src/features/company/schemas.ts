import { z } from 'zod';

export const businessTypeOptions = [
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'vetements', label: 'Vêtements' },
  { value: 'electronique', label: 'Électronique' },
  { value: 'beaute', label: 'Beauté' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'quincaillerie', label: 'Quincaillerie' },
  { value: 'grossiste', label: 'Grossiste' },
  { value: 'autre', label: 'Autre' },
];

export const currencyOptions = [
  { value: 'XOF', label: 'F CFA' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
  { value: 'GNF', label: 'GNF' },
  { value: 'CDF', label: 'CDF' },
  { value: 'NGN', label: 'NGN' },
  { value: 'GHS', label: 'GHS' },
];

export const createCompanySchema = z.object({
  name: z.string().trim().min(1, 'Le nom du commerce est requis.'),
  country: z.string().trim().min(1, 'Le pays est requis.'),
  city: z.string().trim().min(1, 'La ville est requise.'),
  currency: z.string().min(1, 'Choisissez une devise.'),
  businessType: z.string().min(1, "Choisissez un type d'activité."),
});

export type CreateCompanyFormValues = z.infer<typeof createCompanySchema>;

export const createShopSchema = z.object({
  name: z.string().trim().min(1, 'Le nom de la boutique est requis.'),
  location: z.string().trim().min(1, 'La localisation est requise.'),
  phone: z.string().trim().min(1, 'Le téléphone est requis.'),
  address: z.string().optional(),
});

export type CreateShopFormValues = z.infer<typeof createShopSchema>;
