import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCompanyStore } from '@/stores/companyStore';
import { createSubscriptionCheckout, fetchLatestSubscriptionPayment, fetchSubscriptionUsage } from './api';

export function useSubscriptionUsage() {
  const companyId = useCompanyStore((state) => state.activeCompanyId);

  return useQuery({
    queryKey: ['subscriptionUsage', companyId],
    queryFn: () => fetchSubscriptionUsage(companyId as string),
    enabled: Boolean(companyId),
  });
}

export function useLatestSubscriptionPayment() {
  const companyId = useCompanyStore((state) => state.activeCompanyId);
  return useQuery({
    queryKey: ['subscriptionPayment', companyId],
    queryFn: () => fetchLatestSubscriptionPayment(companyId as string),
    enabled: Boolean(companyId),
    refetchInterval: (query) => query.state.data?.status === 'processing' ? 5000 : false,
  });
}

export function useCreateSubscriptionCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubscriptionCheckout,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPayment', variables.companyId] });
    },
  });
}
