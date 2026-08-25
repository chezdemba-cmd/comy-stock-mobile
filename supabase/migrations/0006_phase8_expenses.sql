-- Phase 8 — Dépenses et caisse
-- Ajoute le registre des dépenses et intègre les dépenses de la session dans
-- le calcul de clôture de caisse (promis en Phase 5 : close_cash_session ne
-- comptait jusqu'ici que les ventes cash + mouvements manuels).

create type expense_category as enum (
  'transport', 'electricite', 'loyer', 'salaire', 'achat', 'livraison',
  'maintenance', 'communication', 'autre'
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  shop_id uuid not null references shops (id) on delete cascade,
  cash_session_id uuid references cash_register_sessions (id),
  category expense_category not null,
  amount numeric(12, 2) not null,
  description text,
  receipt_photo_url text,
  expense_date date not null default current_date,
  created_by uuid not null references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now()
);

alter table expenses enable row level security;

create index expenses_company_id_idx on expenses (company_id);
create index expenses_shop_id_idx on expenses (shop_id, expense_date desc);
create index expenses_cash_session_id_idx on expenses (cash_session_id);

create policy "expenses_select_member"
  on expenses for select
  using (is_company_member(company_id));

create policy "expenses_insert_accounting_roles"
  on expenses for insert
  with check (company_role(company_id) in ('owner', 'manager', 'accountant'));

-- ─────────────────────────────────────────────────────────────────────────
-- Storage : justificatifs de dépenses (même pattern que product-photos, Phase 4)
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('expense-receipts', 'expense-receipts', true)
on conflict (id) do nothing;

create policy "expense_receipts_public_read"
  on storage.objects for select
  using (bucket_id = 'expense-receipts');

create policy "expense_receipts_insert_member"
  on storage.objects for insert
  with check (
    bucket_id = 'expense-receipts'
    and is_company_member(((storage.foldername(name))[1])::uuid)
  );

create policy "expense_receipts_delete_member"
  on storage.objects for delete
  using (
    bucket_id = 'expense-receipts'
    and is_company_member(((storage.foldername(name))[1])::uuid)
  );

-- ─────────────────────────────────────────────────────────────────────────
-- close_cash_session : intègre désormais les dépenses de la session dans le
-- calcul du théorique (même signature, seul le corps change).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function close_cash_session(p_session_id uuid, p_closing_real numeric, p_notes text)
returns cash_register_sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session cash_register_sessions;
  v_cash_sales numeric;
  v_cash_in numeric;
  v_cash_out numeric;
  v_expenses numeric;
  v_theoretical numeric;
begin
  select * into v_session from cash_register_sessions where id = p_session_id for update;

  if v_session.id is null then
    raise exception 'Session de caisse introuvable.';
  end if;

  if company_role(v_session.company_id) not in ('owner', 'manager', 'cashier') then
    raise exception 'Vous n''avez pas les droits pour clôturer cette caisse.';
  end if;

  if v_session.status = 'closed' then
    raise exception 'Cette session est déjà clôturée.';
  end if;

  select coalesce(sum(p.amount), 0) into v_cash_sales
  from payments p
  join sales s on s.id = p.sale_id
  where s.cash_session_id = p_session_id and p.method = 'cash';

  select coalesce(sum(amount), 0) into v_cash_in
  from cash_movements where session_id = p_session_id and type = 'in';

  select coalesce(sum(amount), 0) into v_cash_out
  from cash_movements where session_id = p_session_id and type = 'out';

  select coalesce(sum(amount), 0) into v_expenses
  from expenses where cash_session_id = p_session_id;

  v_theoretical := v_session.opening_amount + v_cash_sales + v_cash_in - v_cash_out - v_expenses;

  update cash_register_sessions
  set
    closing_theoretical = v_theoretical,
    closing_real = p_closing_real,
    difference = p_closing_real - v_theoretical,
    closed_by = auth.uid(),
    closed_at = now(),
    status = 'closed',
    notes = nullif(p_notes, '')
  where id = p_session_id
  returning * into v_session;

  return v_session;
end;
$$;
