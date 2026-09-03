import { supabase } from '@/services/supabase';
import type {
  PlanTier,
  SubscriptionBillingCycle,
  SubscriptionPaymentOrder,
  SubscriptionPaymentProvider,
  SubscriptionUsage,
} from '@/types/database';

export async function fetchSubscriptionUsage(companyId: string): Promise<SubscriptionUsage> {
  const { data, error } = await supabase.rpc('subscription_usage', { p_company_id: companyId }).single();

  if (error) throw error;
  return data as SubscriptionUsage;
}

export async function createSubscriptionCheckout(input: {
  companyId: string;
  plan: Exclude<PlanTier, 'free'>;
  cycle: SubscriptionBillingCycle;
  provider: SubscriptionPaymentProvider;
}): Promise<{ orderId: string; checkoutUrl: string }> {
  const { data, error } = await supabase.functions.invoke('create-subscription-checkout', { body: input });
  if (error) {
    const context = error.context as Response | undefined;
    const payload = await context?.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error ?? 'Impossible de demarrer le paiement.');
  }
  return data as { orderId: string; checkoutUrl: string };
}

export async function fetchLatestSubscriptionPayment(companyId: string): Promise<SubscriptionPaymentOrder | null> {
  const { data, error } = await supabase.from('subscription_payment_orders').select(
    'id, company_id, target_plan, billing_cycle, provider, amount, currency, status, created_at, paid_at',
  ).eq('company_id', companyId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data as SubscriptionPaymentOrder | null;
}
