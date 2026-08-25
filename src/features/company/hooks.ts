import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';
import {
  createCompany,
  createShop,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myMembershipsKey(userId) });
    },
  });
}
