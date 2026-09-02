import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';
import { useCompanyStore } from '@/stores/companyStore';
import type { AppRole } from '@/types/database';
import {
  createCompany,
  createShop,
  fetchCompanyShops,
  fetchMyMemberships,
  type CreateCompanyInput,
  type CreateShopInput,
} from './api';

export const myMembershipsKey = (userId: string | undefined) => ['myMemberships', userId] as const;

export function useMyMemberships() {
  const userId = useAuthStore((state) => state.session?.user.id);

  return useQuery({
    queryKey: myMembershipsKey(userId),
    queryFn: () => fetchMyMemberships(userId as string),
    enabled: Boolean(userId),
  });
}

export function useCompanyShops() {
  const companyId = useCompanyStore((state) => state.activeCompanyId);
  return useQuery({
    queryKey: ['companyShops', companyId],
    queryFn: () => fetchCompanyShops(companyId as string),
    enabled: Boolean(companyId),
  });
}

export function useActiveCompanyRole(): AppRole | null {
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const { data: memberships } = useMyMemberships();
  if (!activeCompanyId) return null;
  return memberships?.companyRoles[activeCompanyId] ?? null;
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.session?.user.id);

  return useMutation({
    mutationFn: (input: CreateCompanyInput) => createCompany(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myMembershipsKey(userId) });
    },
  });
}

export function useCreateShop() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.session?.user.id);

  return useMutation({
    mutationFn: (input: CreateShopInput) => createShop(input),
    onSuccess: (_shop, input) => {
      queryClient.invalidateQueries({ queryKey: myMembershipsKey(userId) });
      queryClient.invalidateQueries({ queryKey: ['companyShops', input.companyId] });
    },
  });
}
