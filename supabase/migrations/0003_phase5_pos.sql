-- Phase 5 — Caisse (POS)
-- Une vente est une transaction atomique : sales + sale_items + payments +
-- stock_movements (type 'sale') + éventuellement customer_debts, le tout dans
-- une seule fonction RPC SECURITY DEFINER. Réutilise le trigger de stock (Phase 4).

create type payment_method as enum ('cash', 'card', 'orange_money', 'wave', 'moov_money', 'credit');
create type sale_status as enum ('completed', 'cancelled');
create type cash_movement_type as enum ('in', 'out');
create type cash_session_status as enum ('open', 'closed');

-- ─────────────────────────────────────────────────────────────────────────
-- customers (minimum requis pour la vente à crédit — CRM complet en Phase 6)
-- ─────────────────────────────────────────────────────────────────────────
create table customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  phone text,
  whatsapp text,
  email text,
  address text,
  notes text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table customers enable row level security;

create index customers_company_id_idx on customers (company_id);

create trigger customers_set_updated_at
  before update on customers
  for each row execute function set_updated_at();

create policy "customers_select_member"
  on customers for select
  using (is_company_member(company_id));

create policy "customers_insert_pos_roles"
  on customers for insert
  with check (company_role(company_id) in ('owner', 'manager', 'cashier'));

create policy "customers_update_pos_roles"
  on customers for update
  using (company_role(company_id) in ('owner', 'manager', 'cashier'));

-- ─────────────────────────────────────────────────────────────────────────
-- Compteur de numéro de vente par boutique (incrément verrouillé, pas de course)
-- ─────────────────────────────────────────────────────────────────────────
create table shop_sale_counters (
  shop_id uuid primary key references shops (id) on delete cascade,
  next_number integer not null default 1
);

alter table shop_sale_counters enable row level security;

create policy "shop_sale_counters_select_member"
  on shop_sale_counters for select
  using (exists (select 1 from shops s where s.id = shop_id and is_company_member(s.company_id)));

-- Initialise le compteur pour les boutiques déjà existantes, et pour toute nouvelle
-- boutique créée à l'avenir (le fallback dans create_sale reste un filet de sécurité).
insert into shop_sale_counters (shop_id, next_number)
select id, 1 from shops
on conflict (shop_id) do nothing;

create or replace function init_shop_sale_counter()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into shop_sale_counters (shop_id, next_number) values (new.id, 1);
  return new;
end;
$$;

create trigger shops_init_sale_counter
  after insert on shops
  for each row execute function init_shop_sale_counter();

-- ─────────────────────────────────────────────────────────────────────────
-- cash_register_sessions / cash_movements
-- ─────────────────────────────────────────────────────────────────────────
create table cash_register_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  shop_id uuid not null references shops (id) on delete cascade,
  opening_amount numeric(12, 2) not null default 0,
  opened_by uuid not null references auth.users (id),
  opened_at timestamptz not null default now(),
  closing_theoretical numeric(12, 2),
  closing_real numeric(12, 2),
  difference numeric(12, 2),
  closed_by uuid references auth.users (id),
  closed_at timestamptz,
  status cash_session_status not null default 'open',
  notes text
);

alter table cash_register_sessions enable row level security;

create index cash_sessions_shop_id_idx on cash_register_sessions (shop_id);
-- Une seule session ouverte par boutique à la fois.
create unique index cash_sessions_one_open_per_shop
  on cash_register_sessions (shop_id)
  where status = 'open';

create policy "cash_sessions_select_member"
  on cash_register_sessions for select
  using (is_company_member(company_id));

create table cash_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  shop_id uuid not null references shops (id) on delete cascade,
  session_id uuid not null references cash_register_sessions (id) on delete cascade,
  type cash_movement_type not null,
  amount numeric(12, 2) not null,
  reason text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table cash_movements enable row level security;

create index cash_movements_session_id_idx on cash_movements (session_id);

create policy "cash_movements_select_member"
  on cash_movements for select
  using (is_company_member(company_id));

create policy "cash_movements_insert_pos_roles"
  on cash_movements for insert
  with check (company_role(company_id) in ('owner', 'manager', 'cashier'));

-- ─────────────────────────────────────────────────────────────────────────
-- sales / sale_items / payments
-- ─────────────────────────────────────────────────────────────────────────
create table sales (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  shop_id uuid not null references shops (id) on delete cascade,
  customer_id uuid references customers (id),
  cash_session_id uuid references cash_register_sessions (id),
  sale_number integer not null,
  subtotal numeric(12, 2) not null,
  discount_amount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null,
  status sale_status not null default 'completed',
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  unique (shop_id, sale_number)
);

alter table sales enable row level security;

create index sales_company_id_idx on sales (company_id);
create index sales_shop_id_idx on sales (shop_id, created_at desc);

create policy "sales_select_member"
  on sales for select
  using (is_company_member(company_id));

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales (id) on delete cascade,
  product_id uuid not null references products (id),
  product_name text not null,
  quantity integer not null,
  unit_price numeric(12, 2) not null,
  unit_cost numeric(12, 2) not null default 0,
  line_total numeric(12, 2) not null
);

alter table sale_items enable row level security;

create index sale_items_sale_id_idx on sale_items (sale_id);

create policy "sale_items_select_member"
  on sale_items for select
  using (exists (select 1 from sales s where s.id = sale_id and is_company_member(s.company_id)));

create table payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales (id) on delete cascade,
  method payment_method not null,
  amount numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

alter table payments enable row level security;

create index payments_sale_id_idx on payments (sale_id);

create policy "payments_select_member"
  on payments for select
  using (exists (select 1 from sales s where s.id = sale_id and is_company_member(s.company_id)));

-- ─────────────────────────────────────────────────────────────────────────
-- customer_debts / customer_debt_payments
-- ─────────────────────────────────────────────────────────────────────────
create table customer_debts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  shop_id uuid not null references shops (id) on delete cascade,
  customer_id uuid not null references customers (id),
  sale_id uuid references sales (id),
  original_amount numeric(12, 2) not null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table customer_debts enable row level security;

create index customer_debts_company_id_idx on customer_debts (company_id);
create index customer_debts_customer_id_idx on customer_debts (customer_id);

create policy "customer_debts_select_member"
  on customer_debts for select
  using (is_company_member(company_id));

create table customer_debt_payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references customer_debts (id) on delete cascade,
  amount numeric(12, 2) not null,
  paid_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id)
);

alter table customer_debt_payments enable row level security;

create index customer_debt_payments_debt_id_idx on customer_debt_payments (debt_id);

create policy "customer_debt_payments_select_member"
  on customer_debt_payments for select
  using (
    exists (
      select 1 from customer_debts d where d.id = debt_id and is_company_member(d.company_id)
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- RPC : ouverture / clôture de caisse
-- ─────────────────────────────────────────────────────────────────────────
create or replace function open_cash_session(p_shop_id uuid, p_opening_amount numeric)
returns cash_register_sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_company_id uuid;
  v_session cash_register_sessions;
begin
  select company_id into v_company_id from shops where id = p_shop_id;

  if v_company_id is null or company_role(v_company_id) not in ('owner', 'manager', 'cashier') then
    raise exception 'Vous n''avez pas les droits pour ouvrir la caisse de cette boutique.';
  end if;

  if exists (select 1 from cash_register_sessions where shop_id = p_shop_id and status = 'open') then
    raise exception 'Une session de caisse est déjà ouverte pour cette boutique.';
  end if;

  insert into cash_register_sessions (company_id, shop_id, opening_amount, opened_by)
  values (v_company_id, p_shop_id, p_opening_amount, auth.uid())
  returning * into v_session;

  return v_session;
end;
$$;

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

  v_theoretical := v_session.opening_amount + v_cash_sales + v_cash_in - v_cash_out;

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

-- ─────────────────────────────────────────────────────────────────────────
-- RPC : create_sale — cœur transactionnel de la caisse
-- p_items : jsonb [{product_id, product_name, quantity, unit_price, unit_cost}]
-- p_payments : jsonb [{method, amount}]
-- ─────────────────────────────────────────────────────────────────────────
create or replace function create_sale(
  p_company_id uuid,
  p_shop_id uuid,
  p_customer_id uuid,
  p_subtotal numeric,
  p_discount_amount numeric,
  p_total numeric,
  p_items jsonb,
  p_payments jsonb
)
returns sales
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_sale sales;
  v_session_id uuid;
  v_sale_number integer;
  v_item jsonb;
  v_payment jsonb;
  v_credit_total numeric := 0;
  v_payments_total numeric := 0;
begin
  if company_role(p_company_id) not in ('owner', 'manager', 'cashier') then
    raise exception 'Vous n''avez pas les droits pour enregistrer une vente.';
  end if;

  select id into v_session_id
  from cash_register_sessions
  where shop_id = p_shop_id and status = 'open';

  if v_session_id is null then
    raise exception 'Aucune session de caisse ouverte pour cette boutique. Ouvrez la caisse avant de vendre.';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Le panier est vide.';
  end if;

  for v_payment in select * from jsonb_array_elements(p_payments)
  loop
    v_payments_total := v_payments_total + (v_payment ->> 'amount')::numeric;
    if (v_payment ->> 'method') = 'credit' then
      v_credit_total := v_credit_total + (v_payment ->> 'amount')::numeric;
    end if;
  end loop;

  if round(v_payments_total, 2) <> round(p_total, 2) then
    raise exception 'La somme des paiements (%) ne correspond pas au total (%).', v_payments_total, p_total;
  end if;

  if v_credit_total > 0 and p_customer_id is null then
    raise exception 'Un client est requis pour une vente à crédit.';
  end if;

  update shop_sale_counters
  set next_number = next_number + 1
  where shop_id = p_shop_id
  returning next_number - 1 into v_sale_number;

  if v_sale_number is null then
    insert into shop_sale_counters (shop_id, next_number) values (p_shop_id, 2);
    v_sale_number := 1;
  end if;

  insert into sales (
    company_id, shop_id, customer_id, cash_session_id, sale_number,
    subtotal, discount_amount, total, created_by
  )
  values (
    p_company_id, p_shop_id, p_customer_id, v_session_id, v_sale_number,
    p_subtotal, p_discount_amount, p_total, auth.uid()
  )
  returning * into v_sale;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into sale_items (sale_id, product_id, product_name, quantity, unit_price, unit_cost, line_total)
    values (
      v_sale.id,
      (v_item ->> 'product_id')::uuid,
      v_item ->> 'product_name',
      (v_item ->> 'quantity')::integer,
      (v_item ->> 'unit_price')::numeric,
      coalesce((v_item ->> 'unit_cost')::numeric, 0),
      (v_item ->> 'quantity')::integer * (v_item ->> 'unit_price')::numeric
    );

    insert into stock_movements (company_id, shop_id, product_id, type, quantity_change, reason, created_by)
    values (
      p_company_id, p_shop_id, (v_item ->> 'product_id')::uuid, 'sale',
      -1 * (v_item ->> 'quantity')::integer, 'Vente #' || v_sale_number, auth.uid()
    );
  end loop;

  for v_payment in select * from jsonb_array_elements(p_payments)
  loop
    insert into payments (sale_id, method, amount)
    values (v_sale.id, (v_payment ->> 'method')::payment_method, (v_payment ->> 'amount')::numeric);
  end loop;

  if v_credit_total > 0 then
    insert into customer_debts (company_id, shop_id, customer_id, sale_id, original_amount, created_by)
    values (p_company_id, p_shop_id, p_customer_id, v_sale.id, v_credit_total, auth.uid());
  end if;

  return v_sale;
end;
$$;
