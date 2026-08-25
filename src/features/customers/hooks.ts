import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCompanyStore } from '@/stores/companyStore';
import {
  createCustomer,
  createCustomerFull,
  fetchCustomerById,
  fetchCustomerDebtSummary,
  fetchCustomers,
  fetchCustomerStats,
  fetchOutstandingDebtsByCustomer,
  payCustomerDebt,
  updateCustomer,
  type CustomerInput,
} from './api';

function useActiveCompanyId() {
  return useCompanyStore((state) => state.activeCompanyId);
}

export function useCustomers() {
  const companyId = useActiveCompanyId();

  return useQuery({
    queryKey: ['customers', companyId],
    queryFn: () => fetchCustomers(companyId as string),
    enabled: Boolean(companyId),
  });
}

export function useOutstandingDebtsByCustomer() {
  const companyId = useActiveCompanyId();

  return useQuery({
    queryKey: ['outstandingDebtsByCustomer', companyId],
    queryFn: () => fetchOutstandingDebtsByCustomer(companyId as string),
    enabled: Boolean(companyId),
  });
}

export function useCustomer(customerId: string | undefined) {
  return useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => fetchCustomerById(customerId as string),
    enabled: Boolean(customerId),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: ({ name, phone }: { name: string; phone: string }) =>
      createCustomer(companyId as string, name, phone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', companyId] });
    },
  });
}

export function useCreateCustomerFull() {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: CustomerInput) => createCustomerFull(companyId as string, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', companyId] });
    },
  });
}

export function useUpdateCustomer(customerId: string) {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (input: CustomerInput) => updateCustomer(customerId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', companyId] });
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
    },
  });
}

export function useCustomerStats(customerId: string | undefined) {
  return useQuery({
    queryKey: ['customerStats', customerId],
    queryFn: () => fetchCustomerStats(customerId as string),
    enabled: Boolean(customerId),
  });
}

export function useCustomerDebtSummary(customerId: string | undefined) {
  return useQuery({
    queryKey: ['customerDebtSummary', customerId],
    queryFn: () => fetchCustomerDebtSummary(customerId as string),
    enabled: Boolean(customerId),
  });
}

export function usePayCustomerDebt(customerId: string) {
  const queryClient = useQueryClient();
  const companyId = useActiveCompanyId();

  return useMutation({
    mutationFn: (amount: number) => payCustomerDebt(customerId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerDebtSummary', customerId] });
      queryClient.invalidateQueries({ queryKey: ['outstandingDebtsByCustomer', companyId] });
    },
  });
}
