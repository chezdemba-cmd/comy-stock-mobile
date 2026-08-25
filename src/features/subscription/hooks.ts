import { useQuery } from '@tanstack/react-query';

import { useCompanyStore } from '@/stores/companyStore';
import { fetchSubscriptionUsage } from './api';

export function useSubscriptionUsage() {
  const companyId = useCompanyStore((state) => state.activeCompanyId);

  return useQuery({
    queryKey: ['subscriptionUsage', companyId],
    queryFn: () => fetchSubscriptionUsage(companyId as string),
    enabled: Boolean(companyId),
  });
}
