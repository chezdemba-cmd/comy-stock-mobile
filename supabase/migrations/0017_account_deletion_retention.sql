-- Suppression de compte et conservation commerciale pendant deux ans.
-- L'identité auth/profil et les appartenances sont supprimées immédiatement.
-- Les références d'audit deviennent NULL afin de conserver les pièces commerciales
-- sans maintenir un identifiant personnel. Une entreprise sans autre membre est
-- placée en rétention puis supprimable après exactement deux ans.

create table company_deletion_retention (
  company_id uuid primary key references companies(id) on delete cascade,
  requested_at timestamptz not null default now(),
  purge_after timestamptz not null default (now() + interval '2 years'),
  constraint company_deletion_retention_dates_check check (purge_after > requested_at)
);

alter table company_deletion_retention enable row level security;

-- Aucun accès depuis le client : cette table est réservée au service de suppression.
revoke all on company_deletion_retention from anon, authenticated;

-- Les journaux commerciaux doivent survivre à la suppression de l'identité.
alter table companies alter column created_by drop not null;
alter table companies drop constraint companies_created_by_fkey;
alter table companies add constraint companies_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;

alter table shops alter column created_by drop not null;
alter table shops drop constraint shops_created_by_fkey;
alter table shops add constraint shops_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;

alter table products alter column created_by drop not null;
alter table products drop constraint products_created_by_fkey;
alter table products add constraint products_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;

alter table stock_movements alter column created_by drop not null;
alter table stock_movements drop constraint stock_movements_created_by_fkey;
alter table stock_movements add constraint stock_movements_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;

alter table customers alter column created_by drop not null;
alter table customers drop constraint customers_created_by_fkey;
alter table customers add constraint customers_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;

alter table cash_register_sessions alter column opened_by drop not null;
alter table cash_register_sessions drop constraint cash_register_sessions_opened_by_fkey;
alter table cash_register_sessions add constraint cash_register_sessions_opened_by_fkey foreign key (opened_by) references auth.users(id) on delete set null;
alter table cash_register_sessions drop constraint cash_register_sessions_closed_by_fkey;
alter table cash_register_sessions add constraint cash_register_sessions_closed_by_fkey foreign key (closed_by) references auth.users(id) on delete set null;

alter table cash_movements alter column created_by drop not null;
alter table cash_movements drop constraint cash_movements_created_by_fkey;
alter table cash_movements add constraint cash_movements_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;

alter table sales alter column created_by drop not null;
alter table sales drop constraint sales_created_by_fkey;
alter table sales add constraint sales_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;

alter table customer_debts alter column created_by drop not null;
alter table customer_debts drop constraint customer_debts_created_by_fkey;
alter table customer_debts add constraint customer_debts_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;

alter table customer_debt_payments alter column created_by drop not null;
alter table customer_debt_payments drop constraint customer_debt_payments_created_by_fkey;
alter table customer_debt_payments add constraint customer_debt_payments_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;

alter table suppliers alter column created_by drop not null;
alter table suppliers drop constraint suppliers_created_by_fkey;
alter table suppliers add constraint suppliers_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;

alter table purchases alter column created_by drop not null;
alter table purchases drop constraint purchases_created_by_fkey;
alter table purchases add constraint purchases_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;

alter table supplier_debts alter column created_by drop not null;
alter table supplier_debts drop constraint supplier_debts_created_by_fkey;
alter table supplier_debts add constraint supplier_debts_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;

alter table supplier_debt_payments alter column created_by drop not null;
alter table supplier_debt_payments drop constraint supplier_debt_payments_created_by_fkey;
alter table supplier_debt_payments add constraint supplier_debt_payments_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;

alter table expenses alter column created_by drop not null;
alter table expenses drop constraint expenses_created_by_fkey;
alter table expenses add constraint expenses_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;

alter table invitations alter column invited_by drop not null;
alter table invitations drop constraint invitations_invited_by_fkey;
alter table invitations add constraint invitations_invited_by_fkey foreign key (invited_by) references auth.users(id) on delete set null;
alter table invitations drop constraint invitations_accepted_by_fkey;
alter table invitations add constraint invitations_accepted_by_fkey foreign key (accepted_by) references auth.users(id) on delete set null;

-- Les conversations IA sont personnelles et sont donc effacées avec le compte.
alter table ai_conversations drop constraint ai_conversations_created_by_fkey;
alter table ai_conversations add constraint ai_conversations_created_by_fkey foreign key (created_by) references auth.users(id) on delete cascade;

create or replace function prepare_account_deletion(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company record;
  v_successor record;
  v_retained integer := 0;
  v_transferred integer := 0;
begin
  if p_user_id is null then
    raise exception 'Utilisateur requis.';
  end if;

  for v_company in
    select company_id
    from company_members
    where user_id = p_user_id and role = 'owner'
  loop
    select cm.user_id, cm.role
    into v_successor
    from company_members cm
    where cm.company_id = v_company.company_id
      and cm.user_id <> p_user_id
    order by
      case cm.role
        when 'owner' then 0
        when 'accountant' then 1
        when 'manager' then 2
        when 'stock_manager' then 3
        else 4
      end,
      cm.created_at
    limit 1;

    if v_successor.user_id is not null then
      update company_members
      set role = 'owner'
      where company_id = v_company.company_id and user_id = v_successor.user_id;

      update shop_members sm
      set role = 'owner'
      from shops s
      where sm.shop_id = s.id
        and s.company_id = v_company.company_id
        and sm.user_id = v_successor.user_id;

      v_transferred := v_transferred + 1;
    else
      insert into company_deletion_retention(company_id)
      values (v_company.company_id)
      on conflict (company_id) do nothing;
      v_retained := v_retained + 1;
    end if;
  end loop;

  -- Évite qu'une invitation encore ouverte puisse recréer l'accès supprimé.
  delete from invitations where lower(email) = lower((select email from profiles where id = p_user_id));

  return jsonb_build_object(
    'retained_companies', v_retained,
    'transferred_companies', v_transferred,
    'purge_after', now() + interval '2 years'
  );
end;
$$;

revoke all on function prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function prepare_account_deletion(uuid) to service_role;

create or replace function purge_expired_deleted_companies()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with deleted as (
    delete from companies c
    using company_deletion_retention r
    where c.id = r.company_id and r.purge_after <= now()
    returning c.id
  )
  select count(*) into v_count from deleted;
  return v_count;
end;
$$;

revoke all on function purge_expired_deleted_companies() from public, anon, authenticated;
grant execute on function purge_expired_deleted_companies() to service_role;
