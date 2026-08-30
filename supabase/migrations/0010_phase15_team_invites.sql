-- Phase 15 — Invitation d'équipe
--
-- Corrige l'écart identifié en audit avant mise en production : company_members
-- et shop_members n'étaient alimentés que par create_company/create_shop, qui
-- assignent toujours le créateur comme owner (voir Phase 2). Aucun moyen
-- n'existait d'ajouter un second utilisateur à une entreprise, alors que les
-- 5 rôles applicatifs et toute la RLS métier (Phases 4 à 12) les distinguent
-- déjà. Flux par code plutôt que par email : ce projet n'a pas d'envoi
-- d'email transactionnel personnalisé, et le reste des flux administratifs
-- (changement de formule, Phase 12) passe déjà par un partage manuel
-- (WhatsApp) plutôt qu'une intégration email.

create type invitation_status as enum ('pending', 'accepted', 'revoked');

create table invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  shop_id uuid not null references shops (id) on delete cascade,
  role app_role not null,
  code text not null unique,
  status invitation_status not null default 'pending',
  invited_by uuid not null references auth.users (id) default auth.uid(),
  accepted_by uuid references auth.users (id),
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

alter table invitations enable row level security;

create index invitations_company_id_idx on invitations (company_id);
create index invitations_code_idx on invitations (code);

create policy "invitations_select_member"
  on invitations for select
  using (is_company_member(company_id));

-- Aucune policy insert/update : tout passe par invite_member/revoke_invite/
-- accept_invite (SECURITY DEFINER), même principe que sales/purchases
-- (Phases 5/7) — la personne invitée n'est pas encore membre au moment
-- d'accepter, donc RLS la bloquerait de toute façon sans le bypass.

create or replace function generate_invite_code()
returns text
language sql
volatile
as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- invite_member — seul owner/manager peut inviter. Un manager ne peut inviter
-- que cashier/stock_manager/accountant : seul un owner peut créer un pair
-- (owner/manager), pour éviter qu'un manager s'auto-élève en cascade.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function invite_member(
  p_company_id uuid,
  p_shop_id uuid,
  p_role app_role
)
returns invitations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller_role app_role;
  v_invitation invitations;
begin
  v_caller_role := company_role(p_company_id);

  if v_caller_role is null or v_caller_role not in ('owner', 'manager') then
    raise exception 'Vous n''avez pas les droits pour inviter un membre.';
  end if;

  if p_role in ('owner', 'manager') and v_caller_role <> 'owner' then
    raise exception 'Seul le propriétaire peut inviter avec ce rôle.';
  end if;

  if not exists (select 1 from shops where id = p_shop_id and company_id = p_company_id) then
    raise exception 'Cette boutique n''appartient pas à cette entreprise.';
  end if;

  insert into invitations (company_id, shop_id, role, code, invited_by)
  values (p_company_id, p_shop_id, p_role, generate_invite_code(), auth.uid())
  returning * into v_invitation;

  return v_invitation;
end;
$$;

create or replace function revoke_invite(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_company_id uuid;
begin
  select company_id into v_company_id from invitations where id = p_invitation_id;

  if v_company_id is null or company_role(v_company_id) not in ('owner', 'manager') then
    raise exception 'Vous n''avez pas les droits pour annuler cette invitation.';
  end if;

  update invitations set status = 'revoked' where id = p_invitation_id and status = 'pending';
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- accept_invite — rejoint l'entreprise ET la boutique de l'invitation.
-- SECURITY DEFINER indispensable : l'appelant n'est pas encore membre, donc
-- ni la lecture de l'invitation ni l'insertion dans company_members/
-- shop_members ne passeraient la RLS sans ce bypass. Usage unique (le champ
-- status empêche un rejeu), expire après 7 jours (voir défaut de la colonne).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function accept_invite(p_code text)
returns table (company_id uuid, shop_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invitation invitations;
begin
  select * into v_invitation from invitations where code = upper(trim(p_code)) for update;

  if v_invitation.id is null then
    raise exception 'Code d''invitation introuvable.';
  end if;

  if v_invitation.status <> 'pending' then
    raise exception 'Ce code a déjà été utilisé ou a été annulé.';
  end if;

  if v_invitation.expires_at < now() then
    raise exception 'Ce code a expiré. Demandez-en un nouveau à votre employeur.';
  end if;

  if exists (
    select 1 from company_members where company_id = v_invitation.company_id and user_id = auth.uid()
  ) then
    raise exception 'Vous êtes déjà membre de cette entreprise.';
  end if;

  insert into company_members (company_id, user_id, role)
  values (v_invitation.company_id, auth.uid(), v_invitation.role);

  insert into shop_members (shop_id, user_id, role)
  values (v_invitation.shop_id, auth.uid(), v_invitation.role);

  update invitations
  set status = 'accepted', accepted_by = auth.uid(), accepted_at = now()
  where id = v_invitation.id;

  return query select v_invitation.company_id, v_invitation.shop_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- remove_member — retire un membre de l'entreprise et de toutes ses boutiques.
-- Un manager ne peut pas retirer un owner (anti-escalade, symétrique à
-- invite_member) ; personne ne peut retirer le dernier owner restant (sinon
-- l'entreprise se retrouve sans personne habilitée à en gérer les boutiques).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function remove_member(p_company_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller_role app_role;
  v_target_role app_role;
  v_owner_count integer;
begin
  v_caller_role := company_role(p_company_id);
  if v_caller_role is null or v_caller_role not in ('owner', 'manager') then
    raise exception 'Vous n''avez pas les droits pour retirer un membre.';
  end if;

  select role into v_target_role
  from company_members where company_id = p_company_id and user_id = p_user_id;

  if v_target_role is null then
    raise exception 'Ce membre ne fait pas partie de cette entreprise.';
  end if;

  if v_target_role = 'owner' and v_caller_role <> 'owner' then
    raise exception 'Seul un propriétaire peut retirer un autre propriétaire.';
  end if;

  if v_target_role = 'owner' then
    select count(*) into v_owner_count
    from company_members where company_id = p_company_id and role = 'owner';

    if v_owner_count <= 1 then
      raise exception 'Impossible de retirer le dernier propriétaire de l''entreprise.';
    end if;
  end if;

  delete from shop_members
  where user_id = p_user_id
    and shop_id in (select id from shops where company_id = p_company_id);

  delete from company_members where company_id = p_company_id and user_id = p_user_id;
end;
$$;
