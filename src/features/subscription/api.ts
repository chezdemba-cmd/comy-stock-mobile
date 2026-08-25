import { supabase } from '@/services/supabase';
import type { SubscriptionUsage } from '@/types/database';

export async function fetchSubscriptionUsage(companyId: string): Promise<SubscriptionUsage> {
  const { data, error } = await supabase.rpc('subscription_usage', { p_company_id: companyId }).single();

  if (error) throw error;
  return data as SubscriptionUsage;
}
