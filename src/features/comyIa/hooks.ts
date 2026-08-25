import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCompanyStore } from '@/stores/companyStore';
import { fetchLatestConversationMessages, sendMessage } from './api';

function useActiveScope() {
  const companyId = useCompanyStore((state) => state.activeCompanyId);
  const shopId = useCompanyStore((state) => state.activeShopId);
  return { companyId, shopId };
}

export function useLatestConversation() {
  const { companyId, shopId } = useActiveScope();

  return useQuery({
    queryKey: ['aiConversation', companyId, shopId],
    queryFn: () => fetchLatestConversationMessages(companyId as string, shopId as string),
    enabled: Boolean(companyId && shopId),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { companyId, shopId } = useActiveScope();

  return useMutation({
    mutationFn: (input: { conversationId: string | null; message: string }) =>
      sendMessage({
        conversationId: input.conversationId,
        companyId: companyId as string,
        shopId: shopId as string,
        message: input.message,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiConversation', companyId, shopId] });
    },
  });
}
