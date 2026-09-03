-- Purge quotidienne des entreprises dont la rétention de deux ans est terminée.
-- Le nom de job stable rend la planification idempotente dans Supabase Cron.

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'comy-purge-expired-deleted-companies',
  '15 2 * * *',
  $$select public.purge_expired_deleted_companies();$$
);
