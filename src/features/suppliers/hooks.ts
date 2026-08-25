import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCompanyStore } from '@/stores/companyStore';
import {
  createPurchase,
  createSupplierFull,
  fetchOutstandingDebtsBySupplier,
  fetchSupplierById,
  fetchSupplierDebtSummary,
  fetchSuppliers,
  fetchSupplierStats,
  paySupplierDebt,
  updateSupplier,
  type CreatePurchaseInput,
  type SupplierInput,
} from './api';

function useActiveScope() {
  const companyId = useCompanyStore((state) => state.activeCompanyId);
  const shopId = useCompanyStore((state) => state.activeShopId);
  return { companyId, shopId };
}

export function useSuppliers() {
  const { companyId } = useActiveScope();

  return useQuery({
    queryKey: ['suppliers', companyId],
    queryFn: () => fetchSuppliers(companyId as string),
    enabled: Boolean(companyId),
  });
}

export function useSupplier(supplierId: string | undefined) {
  return useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => fetchSupplierById(supplierId as string),
    enabled: Boolean(supplierId),
  });
}

export function useOutstandingDebtsBySupplier() {
  const { companyId } = useActiveScope();

  return useQuery({
    queryKey: ['outstandingDebtsBySupplier', companyId],
    queryFn: () => fetchOutstandingDebtsBySupplier(companyId as string),
    enabled: Boolean(companyId),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  const { companyId } = useActiveScope();

  return useMutation({
    mutationFn: (input: SupplierInput) => createSupplierFull(companyId as string, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', companyId] });
    },
  });
}

export function useUpdateSupplier(supplierId: string) {
  const queryClient = useQueryClient();
  const { companyId } = useActiveScope();

  return useMutation({
    mutationFn: (input: SupplierInput) => updateSupplier(supplierId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', companyId] });
      queryClient.invalidateQueries({ queryKey: ['supplier', supplierId] });
    },
  });
}

export function useSupplierStats(supplierId: string | undefined) {
  return useQuery({
    queryKey: ['supplierStats', supplierId],
    queryFn: () => fetchSupplierStats(supplierId as string),
    enabled: Boolean(supplierId),
  });
}

export function useSupplierDebtSummary(supplierId: string | undefined) {
  return useQuery({
    queryKey: ['supplierDebtSummary', supplierId],
    queryFn: () => fetchSupplierDebtSummary(supplierId as string),
    enabled: Boolean(supplierId),
  });
}

export function usePaySupplierDebt(supplierId: string) {
  const queryClient = useQueryClient();
  const { companyId } = useActiveScope();

  return useMutation({
    mutationFn: (amount: number) => paySupplierDebt(supplierId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierDebtSummary', supplierId] });
      queryClient.invalidateQueries({ queryKey: ['outstandingDebtsBySupplier', companyId] });
    },
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  const { companyId, shopId } = useActiveScope();

  return useMutation({
    mutationFn: (input: CreatePurchaseInput) => createPurchase(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', companyId, shopId] });
      queryClient.invalidateQueries({ queryKey: ['supplierStats', variables.supplierId] });
      queryClient.invalidateQueries({ queryKey: ['supplierDebtSummary', variables.supplierId] });
      queryClient.invalidateQueries({ queryKey: ['outstandingDebtsBySupplier', companyId] });
    },
  });
}
