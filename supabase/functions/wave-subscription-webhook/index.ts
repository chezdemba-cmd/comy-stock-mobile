import { createClient } from 'npm:@supabase/supabase-js@2';

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}

async function verifySignature(rawBody: string, header: string, secret: string) {
  const parts = header.split(',');
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds) || Math.abs(Date.now() / 1000 - timestampSeconds) > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(timestamp + rawBody)));
  return signatures.some((candidate) => safeEqual(candidate, signature));
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const secret = Deno.env.get('WAVE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret || !supabaseUrl || !serviceRoleKey) return new Response('Not configured', { status: 503 });

  const rawBody = await request.text();
  const signature = request.headers.get('Wave-Signature') ?? '';
  if (!(await verifySignature(rawBody, signature, secret))) return new Response('Invalid signature', { status: 401 });

  let event: Record<string, unknown>;
  try { event = JSON.parse(rawBody); } catch { return new Response('Invalid JSON', { status: 400 }); }
  if (event.type !== 'checkout.session.completed') return new Response('OK', { status: 200 });
  const data = event.data as Record<string, unknown> | undefined;
  if (!data || data.payment_status !== 'succeeded' || typeof data.id !== 'string') return new Response('OK', { status: 200 });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: order } = await admin.from('subscription_payment_orders')
    .select('id, company_id, target_plan, amount, currency, status')
    .eq('provider', 'wave').eq('provider_checkout_id', data.id).maybeSingle();
  if (!order || order.status === 'succeeded') return new Response('OK', { status: 200 });
  if (String(data.amount) !== String(order.amount) || data.currency !== order.currency) return new Response('Payment mismatch', { status: 409 });

  const { error } = await admin.rpc('activate_paid_subscription', {
    p_order_id: order.id,
    p_provider_transaction_id: typeof data.transaction_id === 'string' ? data.transaction_id : null,
  });
  if (error) return new Response('Activation failed', { status: 500 });
  return new Response('OK', { status: 200 });
});
