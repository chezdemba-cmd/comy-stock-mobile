-- Correctif d'audit (H3) — Visibilité des profils entre membres d'une entreprise
--
-- Depuis la Phase 2, la seule policy SELECT sur `profiles` est
-- `profiles_select_own` (id = auth.uid()). Tant qu'un compte était seul dans son
-- entreprise, cela suffisait. La Phase 15 (invitations d'équipe) a rendu possible
-- d'avoir plusieurs utilisateurs par entreprise, mais sans policy correspondante :
--   - src/features/team/api.ts (fetchTeamMembers) lit profiles.full_name / email
--     des autres membres → renvoyait toujours null (écran Équipe sans noms) ;
--   - src/features/pos/api.ts (fetchSaleReceipt) lit profiles.full_name du
--     vendeur → le reçu n'affichait jamais qui avait fait la vente.
--
-- On ajoute une 2e policy permissive : PostgreSQL combine les policies SELECT en
-- OR, donc `profiles_select_own` continue de couvrir le cas « pas encore membre
-- d'une entreprise ».

-- SECURITY DEFINER pour la même raison que is_company_member / company_role :
-- éviter que la sous-requête sur company_members ne déclenche sa propre RLS de
-- façon récursive, et garder le même patron que le reste des helpers RLS.
create or replace function shares_company_with(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from company_members me
    join company_members them on them.company_id = me.company_id
    where me.user_id = auth.uid()
      and them.user_id = p_user_id
  );
$$;

create policy "profiles_select_company_peers"
  on profiles for select
  using (shares_company_with(id));
