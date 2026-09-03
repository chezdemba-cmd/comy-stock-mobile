-- La purge doit passer par l'API Storage avant de supprimer les lignes SQL.
-- Supabase déconseille formellement DELETE sur storage.objects, qui laisserait
-- les fichiers physiques orphelins. Ces RPC sont réservées à la fonction Edge.

create or replace function list_expired_company_deletions()
returns table(company_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  select r.company_id
  from company_deletion_retention r
  where r.purge_after <= now()
  order by r.purge_after;
$$;

revoke all on function list_expired_company_deletions() from public, anon, authenticated;
grant execute on function list_expired_company_deletions() to service_role;

create table retention_purge_control (
  singleton boolean primary key default true check (singleton),
  last_started_at timestamptz
);

insert into retention_purge_control(singleton) values (true);
alter table retention_purge_control enable row level security;
revoke all on retention_purge_control from anon, authenticated;

create or replace function claim_retention_purge()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update retention_purge_control
  set last_started_at = now()
  where singleton = true
    and (last_started_at is null or last_started_at < now() - interval '15 minutes');
  return found;
end;
$$;

revoke all on function claim_retention_purge() from public, anon, authenticated;
grant execute on function claim_retention_purge() to service_role;

create or replace function purge_expired_deleted_company(p_company_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from companies c
  using company_deletion_retention r
  where c.id = p_company_id
    and r.company_id = c.id
    and r.purge_after <= now();

  return found;
end;
$$;

revoke all on function purge_expired_deleted_company(uuid) from public, anon, authenticated;
grant execute on function purge_expired_deleted_company(uuid) to service_role;

-- Remplace la purge SQL directe par l'appel quotidien de la fonction Edge.
-- L'endpoint ne prend aucun identifiant fourni par l'appelant : il ne traite que
-- les échéances vérifiées côté base et reste donc sûr à appeler sans JWT utilisateur.
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'comy-purge-expired-deleted-companies',
  '15 2 * * *',
  $$
    select net.http_post(
      url := 'https://osuwckxvgqvjghzuzxoz.supabase.co/functions/v1/purge-retained-data',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  $$
);
