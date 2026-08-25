import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useOpenSession } from '@/features/pos/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useCompanyStore } from '@/stores/companyStore';
import { useSyncQueueStore } from '@/stores/syncQueueStore';
import {
  createExpense,
  fetchExpenses,
  fetchSessionExpenses,
  type CreateExpenseInput,
} from './api';

function useActiveScope() {
  const companyId = useCompanyStore((state) => state.activeCompanyId);
  const shopId = useCompanyStore((state) => state.activeShopId);
  return { companyId, shopId };
}

export function useExpenses() {
  const { companyId, shopId } = useActiveScope();

  return useQuery({
    queryKey: ['expenses', companyId, shopId],
    queryFn: () => fetchExpenses(companyId as string, shopId as string),
    enabled: Boolean(companyId && shopId),
  });
}

export function useSessionExpenses(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['sessionExpenses', sessionId],
    queryFn: () => fetchSessionExpenses(sessionId as string),
    enabled: Boolean(sessionId),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { companyId, shopId } = useActiveScope();
  const { data: openSession } = useOpenSession();
  const { isOnline } = useNetworkStatus();
  const enqueue = useSyncQueueStore((state) => state.enqueue);

  return useMutation({
    mutationFn: async (input: Omit<CreateExpenseInput, 'companyId' | 'shopId' | 'cashSessionId'>) => {
      const payload: CreateExpenseInput = {
        ...input,
        companyId: companyId as string,
        shopId: shopId as string,
        cashSessionId: openSession?.id ?? null,
      };
      if (!isOnline) {
        enqueue({ type: 'createExpense', payload });
        return;
      }
      await createExpense(payload);
    },
    onSuccess: () => {
      if (isOnline) {
        queryClient.invalidateQueries({ queryKey: ['expenses', companyId, shopId] });
        if (openSession?.id) {
          queryClient.invalidateQueries({ queryKey: ['sessionExpenses', openSession.id] });
        }
      }
    },
  });
}
