import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCompanyStore } from '@/stores/companyStore';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from './api';

export function useNotifications() {
  const companyId = useCompanyStore((state) => state.activeCompanyId);
  return useQuery({
    queryKey: ['notifications', companyId],
    queryFn: () => fetchNotifications(companyId as string),
    enabled: Boolean(companyId),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const companyId = useCompanyStore((state) => state.activeCompanyId);
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', companyId] }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const companyId = useCompanyStore((state) => state.activeCompanyId);
  return useMutation({
    mutationFn: () => markAllNotificationsRead(companyId as string),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', companyId] }),
  });
}
