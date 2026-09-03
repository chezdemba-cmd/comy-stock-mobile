import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('Authorization');

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) {
    return json({ error: 'Configuration ou authentification absente.' }, 401);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Session invalide.' }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const userId = userData.user.id;

  // Bloque immédiatement toute nouvelle session pendant la préparation.
  const { error: banError } = await admin.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
  if (banError) return json({ error: 'Impossible de désactiver le compte.' }, 500);

  const { data: retention, error: prepareError } = await admin.rpc('prepare_account_deletion', {
    p_user_id: userId,
  });
  if (prepareError) {
    await admin.auth.admin.updateUserById(userId, { ban_duration: 'none' });
    return json({ error: 'Impossible de préparer la conservation des données.' }, 500);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return json({ error: 'Compte désactivé, suppression définitive à finaliser.', retryable: true }, 500);
  }

  return json({ deleted: true, retention });
});
