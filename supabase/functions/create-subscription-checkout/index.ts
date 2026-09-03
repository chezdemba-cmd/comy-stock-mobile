import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const prices = {
  premium: { monthly: 10000, yearly: 108000 },
  pro: { monthly: 20000, yearly: 216000 },
} as const;

type Plan = keyof typeof prices;
type Cycle = keyof (typeof prices)['premium'];
type Provider = 'wave' | 'orange_money' | 'moov_money';

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Methode non autorisee.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('Authorization');
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) {
    return json({ error: 'Configuration ou authentification absente.' }, 401);
  }

  let input: { companyId?: string; plan?: Plan; cycle?: Cycle; provider?: Provider };
  try {
    input = await request.json();
  } catch {
    return json({ error: 'Corps de requete invalide.' }, 400);
  }

  const { companyId, plan, cycle, provider } = input;
  if (!companyId || !plan || !cycle || !provider || !prices[plan]?.[cycle]) {
    return json({ error: 'Formule, periodicite ou moyen de paiement invalide.' }, 400);
  }

  if (provider !== 'wave') {
    const label = provider === 'orange_money' ? 'Orange Money' : 'Moov Money';
    return json({ error: `${label} sera active des que le compte marchand sera configure.`, code: 'PROVIDER_NOT_CONFIGURED' }, 503);
  }

  const waveApiKey = Deno.env.get('WAVE_API_KEY');
  if (!waveApiKey) {
    return json({ error: "Le compte marchand Wave n'est pas encore configure.", code: 'PROVIDER_NOT_CONFIGURED' }, 503);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Session invalide.' }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: membership } = await admin.from('company_members').select('role')
    .eq('company_id', companyId).eq('user_id', userData.user.id).maybeSingle();
  if (membership?.role !== 'owner') return json({ error: 'Seul le proprietaire peut changer la formule.' }, 403);

  const amount = prices[plan][cycle];
  const { data: order, error: orderError } = await admin.from('subscription_payment_orders').insert({
    company_id: companyId,
    requested_by: userData.user.id,
    target_plan: plan,
    billing_cycle: cycle,
    provider,
    amount,
  }).select('id').single();
  if (orderError || !order) return json({ error: 'Impossible de creer la demande de paiement.' }, 500);

  const publicSite = Deno.env.get('PAYMENT_RETURN_BASE_URL') ?? 'https://chezdemba-cmd.github.io/comy-stock-mobile';
  const waveBody = JSON.stringify({
    amount: String(amount),
    currency: 'XOF',
    client_reference: order.id,
    success_url: `${publicSite}/paiement/?status=success&order=${order.id}`,
    error_url: `${publicSite}/paiement/?status=error&order=${order.id}`,
  });
  const waveResponse = await fetch('https://api.wave.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${waveApiKey}`, 'Content-Type': 'application/json' },
    body: waveBody,
  });
  const waveResult = await waveResponse.json().catch(() => ({}));

  if (!waveResponse.ok || typeof waveResult.id !== 'string' || typeof waveResult.wave_launch_url !== 'string') {
    await admin.from('subscription_payment_orders').update({ status: 'failed', failure_reason: `Wave HTTP ${waveResponse.status}` }).eq('id', order.id);
    return json({ error: 'Wave ne peut pas demarrer le paiement pour le moment.' }, 502);
  }

  await admin.from('subscription_payment_orders').update({
    status: 'processing', provider_checkout_id: waveResult.id, checkout_url: waveResult.wave_launch_url,
  }).eq('id', order.id);
  return json({ orderId: order.id, checkoutUrl: waveResult.wave_launch_url });
});
