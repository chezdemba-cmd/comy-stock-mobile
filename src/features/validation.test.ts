import { describe, expect, it } from 'vitest';

import { loginSchema, signupSchema } from './auth/schemas';
import { createCompanySchema, createShopSchema } from './company/schemas';
import { customerFormSchema } from './customers/schemas';
import { expenseFormSchema } from './expenses/schemas';
import { productFormSchema } from './products/schemas';
import { supplierFormSchema } from './suppliers/schemas';

const validProduct = {
  name: 'Riz local',
  categoryId: null,
  sku: '',
  barcode: '',
  purchasePrice: '15000',
  salePrice: '17500',
  initialStock: '10',
  stockMin: '2',
  unit: 'sac',
  description: '',
};

describe('validation des formulaires', () => {
  it('normalise une adresse email de connexion', () => {
    const result = loginSchema.parse({ email: ' awa@example.com ', password: 'motdepasse' });
    expect(result.email).toBe('awa@example.com');
  });

  it('refuse un nom d’inscription composé d’espaces', () => {
    expect(signupSchema.safeParse({ fullName: '   ', email: 'awa@example.com', password: 'motdepasse' }).success).toBe(false);
  });

  it('accepte une entreprise et une boutique maliennes', () => {
    expect(createCompanySchema.safeParse({
      name: 'Bamako Commerce', country: 'Mali', city: 'Bamako', currency: 'XOF', businessType: 'alimentation',
    }).success).toBe(true);
    expect(createShopSchema.safeParse({
      name: 'Boutique ACI 2000', location: 'Bamako', phone: '+223 70 00 00 00', address: '',
    }).success).toBe(true);
  });

  it('refuse un stock initial négatif et un prix non numérique', () => {
    expect(productFormSchema.safeParse({ ...validProduct, initialStock: '-1' }).success).toBe(false);
    expect(productFormSchema.safeParse({ ...validProduct, purchasePrice: 'quinze mille' }).success).toBe(false);
  });

  it('accepte un stock initial vide', () => {
    expect(productFormSchema.safeParse({ ...validProduct, initialStock: '' }).success).toBe(true);
  });

  it.each([customerFormSchema, supplierFormSchema])('refuse un email de contact invalide', (schema) => {
    expect(schema.safeParse({ name: 'Awa', email: 'adresse-invalide' }).success).toBe(false);
    expect(schema.safeParse({ name: 'Awa', email: '' }).success).toBe(true);
  });

  it('exige un montant de dépense strictement positif', () => {
    expect(expenseFormSchema.safeParse({ amount: '0', category: 'transport', description: '' }).success).toBe(false);
    expect(expenseFormSchema.safeParse({ amount: '2500', category: 'transport', description: '' }).success).toBe(true);
  });
});
