import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useCompanyStore } from '@/stores/companyStore';
import { useSyncQueueStore } from '@/stores/syncQueueStore';
import type { Sale } from '@/types/database';
import {
  addCashMovement,
  closeCashSession,
  createSale,
  fetchOpenSession,
  fetchSaleReceipt,
  openCashSession,
  type CreateSaleInput,
} from './api';

export type CreateSaleResult = { status: 'synced'; sale: Sale } | { status: 'queued'; queueId: string };

function useActiveScope() {
  const companyId = useCompanyStore((state) => state.activeCompanyId);
  const shopId = useCompanyStore((state) => state.activeShopId);
  return { companyId, shopId };
}

export function useOpenSession() {
  const { shopId } = useActiveScope();

  return useQuery({
    queryKey: ['cashSession', shopId],
    queryFn: () => fetchOpenSession(shopId as string),
    enabled: Boolean(shopId),
  });
}

export function useOpenCashSession() {
  const queryClient = useQueryClient();
  const { shopId } = useActiveScope();

  return useMutation({
    mutationFn: (openingAmount: number) => openCashSession(shopId as string, openingAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashSession', shopId] });
    },
  });
}

export function useCloseCashSession() {
  const queryClient = useQueryClient();
  const { shopId } = useActiveScope();

  return useMutation({
    mutationFn: ({ sessionId, closingReal, notes }: { sessionId: string; closingReal: number; notes: string }) =>
      closeCashSession(sessionId, closingReal, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashSession', shopId] });
    },
  });
}

export function useAddCashMovement() {
  const queryClient = useQueryClient();
  const { companyId, shopId } = useActiveScope();
  const { isOnline } = useNetworkStatus();
  const enqueue = useSyncQueueStore((state) => state.enqueue);

  return useMutation({
    mutationFn: async (input: { sessionId: string; type: 'in' | 'out'; amount: number; reason: string }) => {
      const payload = { companyId: companyId as string, shopId: shopId as string, ...input };
      if (!isOnline) {
        enqueue({ type: 'addCashMovement', payload });
        return;
      }
      await addCashMovement(payload);
    },
    onSuccess: () => {
      if (isOnline) {
        queryClient.invalidateQueries({ queryKey: ['cashSession', shopId] });
      }
    },
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { companyId, shopId } = useActiveScope();
  const { isOnline } = useNetworkStatus();
  const enqueue = useSyncQueueStore((state) => state.enqueue);

  return useMutation({
    mutationFn: async (input: CreateSaleInput): Promise<CreateSaleResult> => {
      if (!isOnline) {
        const item = enqueue({ type: 'createSale', payload: input });
        return { status: 'queued', queueId: item.id };
      }
      const sale = await createSale(input);
      return { status: 'synced', sale };
    },
    onSuccess: (result) => {
      if (result.status === 'synced') {
        queryClient.invalidateQueries({ queryKey: ['products', companyId, shopId] });
        queryClient.invalidateQueries({ queryKey: ['cashSession', shopId] });
      }
    },
  });
}

export function useSaleReceipt(saleId: string | undefined) {
  return useQuery({
    queryKey: ['saleReceipt', saleId],
    queryFn: () => fetchSaleReceipt(saleId as string),
    enabled: Boolean(saleId),
  });
}
