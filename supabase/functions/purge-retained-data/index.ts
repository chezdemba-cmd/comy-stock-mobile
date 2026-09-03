import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKETS = ['product-photos', 'expense-receipts'] as const;
const PAGE_SIZE = 1_000;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function removeCompanyFiles(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  companyId: string,
): Promise<void> {
  // Les uploads Comy utilisent toujours le chemin <companyId>/<fichier>.
  // On relit la première page après chaque suppression pour ne jamais sauter
  // d'objet à cause du déplacement des offsets.
  while (true) {
    const { data, error } = await admin.storage.from(bucket).list(companyId, {
      limit: PAGE_SIZE,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw error;
    if (!data || data.length === 0) return;

    const paths = data.filter((item) => item.id).map((item) => `${companyId}/${item.name}`);
    if (paths.length === 0) return;

    const { error: removeError } = await admin.storage.from(bucket).remove(paths);
    if (removeError) throw removeError;
    if (data.length < PAGE_SIZE) return;
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Configuration serveur absente.' }, 500);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: claimed, error: claimError } = await admin.rpc('claim_retention_purge');
  if (claimError) return json({ error: 'Impossible de verrouiller la purge.' }, 500);
  if (!claimed) return json({ skipped: true, reason: 'Une purge a déjà démarré récemment.' }, 202);

  const { data: expired, error } = await admin.rpc('list_expired_company_deletions');
  if (error) return json({ error: 'Impossible de lire les échéances.' }, 500);

  let purged = 0;
  const failures: string[] = [];

  for (const row of (expired ?? []) as { company_id: string }[]) {
    try {
      for (const bucket of BUCKETS) await removeCompanyFiles(admin, bucket, row.company_id);

      const { data: deleted, error: deleteError } = await admin.rpc('purge_expired_deleted_company', {
        p_company_id: row.company_id,
      });
      if (deleteError) throw deleteError;
      if (deleted) purged += 1;
    } catch (purgeError) {
      console.error(`Purge failed for company ${row.company_id}`, purgeError);
      failures.push(row.company_id);
    }
  }

  return json({ checked: expired?.length ?? 0, purged, failures }, failures.length > 0 ? 207 : 200);
});
