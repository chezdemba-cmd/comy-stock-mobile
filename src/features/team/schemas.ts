import { z } from 'zod';

import type { AppRole } from '@/types/database';

export const roleLabel: Record<AppRole, string> = {
  owner: 'Propriétaire',
  manager: 'Manager',
  cashier: 'Caissier',
  stock_manager: 'Gestionnaire de stock',
  accountant: 'Comptable',
};

export const roleOptions = (Object.keys(roleLabel) as AppRole[]).map((value) => ({
  value,
  label: roleLabel[value],
}));

// Un manager ne peut inviter que ces rôles (voir invite_member côté serveur, qui applique
// la même règle — ce filtre côté client évite juste de proposer une option qui sera
// rejetée à la soumission).
export function invitableRoles(callerRole: AppRole): AppRole[] {
  return callerRole === 'owner'
    ? (Object.keys(roleLabel) as AppRole[])
    : (['cashier', 'stock_manager', 'accountant'] as AppRole[]);
}

export const inviteMemberSchema = z.object({
  shopId: z.string().min(1, 'Choisissez une boutique.'),
  role: z.string().min(1, 'Choisissez un rôle.'),
});

export type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;

export const joinCompanySchema = z.object({
  code: z.string().min(6, "Le code d'invitation doit contenir au moins 6 caractères."),
});

export type JoinCompanyFormValues = z.infer<typeof joinCompanySchema>;
