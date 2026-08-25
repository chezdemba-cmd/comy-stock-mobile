import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCompanyStore } from '@/stores/companyStore';
import {
  addCashMovement,
  closeCashSession,
  createSale,
  fetchOpenSession,
  fetchSaleReceipt,
  openCashSession,
  type CreateSaleInput,
} from './api';

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

  return useMutation({
    mutationFn: (input: { sessionId: string; type: 'in' | 'out'; amount: number; reason: string }) =>
      addCashMovement({ companyId: companyId as string, shopId: shopId as string, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashSession', shopId] });
    },
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { companyId, shopId } = useActiveScope();

  return useMutation({
    mutationFn: (input: CreateSaleInput) => createSale(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', companyId, shopId] });
      queryClient.invalidateQueries({ queryKey: ['cashSession', shopId] });
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
