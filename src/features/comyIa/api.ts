import { supabase } from '@/services/supabase';
import type { AiMessage } from '@/types/database';

export interface SendMessageInput {
  conversationId: string | null;
  companyId: string;
  shopId: string;
  message: string;
}

export interface SendMessageResult {
  conversationId: string;
  messages: AiMessage[];
}

export async function sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
  const { data, error } = await supabase.functions.invoke('comy-ai', {
    body: {
      conversationId: input.conversationId ?? undefined,
      companyId: input.companyId,
      shopId: input.shopId,
      message: input.message,
    },
  });

  if (error) throw error;
  return data as SendMessageResult;
}

export async function fetchLatestConversationMessages(
  companyId: string,
  shopId: string
): Promise<{ conversationId: string | null; messages: AiMessage[] }> {
  const { data: conversation, error: conversationError } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('company_id', companyId)
    .eq('shop_id', shopId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (conversationError) throw conversationError;
  if (!conversation) return { conversationId: null, messages: [] };

  const { data: messages, error: messagesError } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true });

  if (messagesError) throw messagesError;

  return { conversationId: conversation.id as string, messages: (messages ?? []) as AiMessage[] };
}
