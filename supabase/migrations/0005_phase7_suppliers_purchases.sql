-- Phase 7 — Fournisseurs et achats
-- Normalise products.supplier_name (texte libre, Phase 4) en une vraie table
-- suppliers, ajoute les achats (qui augmentent le stock via l'infrastructure
-- stock_movements de la Phase 4) et les dettes fournisseurs (miroir des dettes
-- clients de la Phase 6).

-- ─────────────────────────────────────────────────────────────────────────
-- suppliers
-- ─────────────────────────────────────────────────────────────────────────
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  phone text,
  email text,
  whatsapp text,
  address text,
  created_by uuid not null references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table suppliers enable row level security;

create index suppliers_company_id_idx on suppliers (company_id);

create trigger suppliers_set_updated_at
  before update on suppliers
  for each row execute function set_updated_at();

create policy "suppliers_select_member"
  on suppliers for select
  using (is_company_member(company_id));

create policy "suppliers_insert_stock_roles"
  on suppliers for insert
  with check (company_role(company_id) in ('owner', 'manager', 'stock_manager'));

create policy "suppliers_update_stock_roles"
  on suppliers for update
  using (company_role(company_id) in ('owner', 'manager', 'stock_manager'));

-- ─────────────────────────────────────────────────────────────────────────
-- Normalisation products.supplier_name -> products.supplier_id
-- ─────────────────────────────────────────────────────────────────────────
alter table products add column supplier_id uuid references suppliers (id) on delete set null;

insert into suppliers (company_id, name, created_by)
select distinct p.company_id, p.supplier_name, p.created_by
from products p
where p.supplier_name is not null and length(trim(p.supplier_name)) > 0;

update products p
set supplier_id = s.id
from suppliers s
where s.company_id = p.company_id
  and s.name = p.supplier_name
  and p.supplier_name is not null;

alter table products drop column supplier_name;

-- Corrige une faille passée inaperçue en Phase 4 : la policy d'écriture sur
-- products vérifie le rôle sur company_id mais jamais que category_id (déjà
-- présent) ou supplier_id (ajouté ici) appartiennent bien à cette entreprise —
-- même classe de faille que celle corrigée sur stock_movements en Phase 4.
create or replace function validate_product_refs()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.category_id is not null and not exists (
    select 1 from product_categories where id = new.category_id and company_id = new.company_id
  ) then
    raise exception 'Cette catégorie n''appartient pas à cette entreprise.';
  end if;

  if new.supplier_id is not null and not exists (
    select 1 from suppliers where id = new.supplier_id and company_id = new.company_id
  ) then
    raise exception 'Ce fournisseur n''appartient pas à cette entreprise.';
  end if;

  return new;
end;
$$;

create trigger products_validate_refs
  before insert or update on products
  for each row execute function validate_product_refs();

-- Recrée create_product avec p_supplier_id (uuid) au lieu de p_supplier_name (text).
drop function if exists create_product(uuid, uuid, uuid, text, text, text, numeric, numeric, integer, text, text, text, text, integer);

create or replace function create_product(
  p_company_id uuid,
  p_shop_id uuid,
  p_category_id uuid,
  p_name text,
  p_sku text,
  p_barcode text,
  p_purchase_price numeric,
  p_sale_price numeric,
  p_stock_min integer,
  p_unit text,
  p_supplier_id uuid,
  p_description text,
  p_photo_url text,
  p_initial_stock integer
)
returns products
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product products;
begin
  if company_role(p_company_id) not in ('owner', 'manager', 'stock_manager') then
    raise exception 'Vous n''avez pas les droits pour créer un produit dans cette entreprise.';
  end if;

  insert into products (
    company_id, category_id, name, sku, barcode, purchase_price, sale_price,
    stock_min, unit, supplier_id, description, photo_url, created_by
  )
  values (
    p_company_id, p_category_id, p_name, nullif(p_sku, ''), nullif(p_barcode, ''),
    p_purchase_price, p_sale_price, p_stock_min, coalesce(nullif(p_unit, ''), 'unité'),
    p_supplier_id, nullif(p_description, ''), nullif(p_photo_url, ''), auth.uid()
  )
  returning * into v_product;

  if p_initial_stock is not null and p_initial_stock > 0 then
    insert into stock_movements (company_id, shop_id, product_id, type, quantity_change, reason, created_by)
    values (p_company_id, p_shop_id, v_product.id, 'entry', p_initial_stock, 'Stock initial', auth.uid());
  end if;

  return v_product;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Compteur d'achats par boutique (même mécanique que shop_sale_counters)
-- ─────────────────────────────────────────────────────────────────────────
create table shop_purchase_counters (
  shop_id uuid primary key references shops (id) on delete cascade,
  next_number integer not null default 1
);

alter table shop_purchase_counters enable row level security;

create policy "shop_purchase_counters_select_member"
  on shop_purchase_counters for select
  using (exists (select 1 from shops s where s.id = shop_id and is_company_member(s.company_id)));

insert into shop_purchase_counters (shop_id, next_number)
select id, 1 from shops
on conflict (shop_id) do nothing;

create or replace function init_shop_purchase_counter()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into shop_purchase_counters (shop_id, next_number) values (new.id, 1);
  return new;
end;
$$;

create trigger shops_init_purchase_counter
  after insert on shops
  for each row execute function init_shop_purchase_counter();

-- ─────────────────────────────────────────────────────────────────────────
-- purchases / purchase_items
-- ─────────────────────────────────────────────────────────────────────────
create table purchases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  shop_id uuid not null references shops (id) on delete cascade,
  supplier_id uuid references suppliers (id),
  purchase_number integer not null,
  total numeric(12, 2) not null,
  amount_paid numeric(12, 2) not null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  unique (shop_id, purchase_number)
);

alter table purchases enable row level security;

create index purchases_company_id_idx on purchases (company_id);
create index purchases_supplier_id_idx on purchases (supplier_id, created_at desc);

create policy "purchases_select_member"
  on purchases for select
  using (is_company_member(company_id));

create table purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases (id) on delete cascade,
  product_id uuid not null references products (id),
  product_name text not null,
  quantity integer not null,
  unit_cost numeric(12, 2) not null,
  line_total numeric(12, 2) not null
);

alter table purchase_items enable row level security;

create index purchase_items_purchase_id_idx on purchase_items (purchase_id);

create policy "purchase_items_select_member"
  on purchase_items for select
  using (exists (select 1 from purchases p where p.id = purchase_id and is_company_member(p.company_id)));

-- ─────────────────────────────────────────────────────────────────────────
-- supplier_debts / supplier_debt_payments (miroir des dettes clients, Phase 6)
-- ─────────────────────────────────────────────────────────────────────────
create table supplier_debts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  shop_id uuid not null references shops (id) on delete cascade,
  supplier_id uuid not null references suppliers (id),
  purchase_id uuid references purchases (id),
  original_amount numeric(12, 2) not null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table supplier_debts enable row level security;

create index supplier_debts_company_id_idx on supplier_debts (company_id);
create index supplier_debts_supplier_id_idx on supplier_debts (supplier_id);

create policy "supplier_debts_select_member"
  on supplier_debts for select
  using (is_company_member(company_id));

create table supplier_debt_payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references supplier_debts (id) on delete cascade,
  amount numeric(12, 2) not null,
  paid_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id)
);

alter table supplier_debt_payments enable row level security;

create index supplier_debt_payments_debt_id_idx on supplier_debt_payments (debt_id);

create policy "supplier_debt_payments_select_member"
  on supplier_debt_payments for select
  using (
    exists (
      select 1 from supplier_debts d where d.id = debt_id and is_company_member(d.company_id)
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- RPC : create_purchase — atomique (achat + lignes + entrées de stock + dette)
-- p_items : jsonb [{product_id, product_name, quantity, unit_cost}]
-- ─────────────────────────────────────────────────────────────────────────
create or replace function create_purchase(
  p_company_id uuid,
  p_shop_id uuid,
  p_supplier_id uuid,
  p_items jsonb,
  p_amount_paid numeric
)
returns purchases
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_purchase purchases;
  v_purchase_number integer;
  v_item jsonb;
  v_total numeric := 0;
  v_debt_amount numeric;
begin
  if company_role(p_company_id) not in ('owner', 'manager', 'stock_manager') then
    raise exception 'Vous n''avez pas les droits pour enregistrer un achat.';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'L''achat doit contenir au moins un article.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_total := v_total + (v_item ->> 'quantity')::integer * (v_item ->> 'unit_cost')::numeric;
  end loop;

  if p_amount_paid > v_total then
    raise exception 'Le montant payé (%) dépasse le total de l''achat (%).', p_amount_paid, v_total;
  end if;

  update shop_purchase_counters
  set next_number = next_number + 1
  where shop_id = p_shop_id
  returning next_number - 1 into v_purchase_number;

  if v_purchase_number is null then
    insert into shop_purchase_counters (shop_id, next_number) values (p_shop_id, 2);
    v_purchase_number := 1;
  end if;

  insert into purchases (company_id, shop_id, supplier_id, purchase_number, total, amount_paid, created_by)
  values (p_company_id, p_shop_id, p_supplier_id, v_purchase_number, v_total, p_amount_paid, auth.uid())
  returning * into v_purchase;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into purchase_items (purchase_id, product_id, product_name, quantity, unit_cost, line_total)
    values (
      v_purchase.id,
      (v_item ->> 'product_id')::uuid,
      v_item ->> 'product_name',
      (v_item ->> 'quantity')::integer,
      (v_item ->> 'unit_cost')::numeric,
      (v_item ->> 'quantity')::integer * (v_item ->> 'unit_cost')::numeric
    );

    insert into stock_movements (company_id, shop_id, product_id, type, quantity_change, reason, created_by)
    values (
      p_company_id, p_shop_id, (v_item ->> 'product_id')::uuid, 'entry',
      (v_item ->> 'quantity')::integer, 'Achat #' || v_purchase_number, auth.uid()
    );
  end loop;

  v_debt_amount := v_total - p_amount_paid;
  if v_debt_amount > 0 then
    if p_supplier_id is null then
      raise exception 'Un fournisseur est requis pour un achat non payé intégralement.';
    end if;

    insert into supplier_debts (company_id, shop_id, supplier_id, purchase_id, original_amount, created_by)
    values (p_company_id, p_shop_id, p_supplier_id, v_purchase.id, v_debt_amount, auth.uid());
  end if;

  return v_purchase;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- RPC : pay_supplier_debt — identique à pay_customer_debt (FIFO)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function pay_supplier_debt(p_supplier_id uuid, p_amount numeric)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_company_id uuid;
  v_debt record;
  v_paid numeric;
  v_remaining_on_debt numeric;
  v_remaining_to_allocate numeric := p_amount;
  v_total_outstanding numeric := 0;
begin
  select company_id into v_company_id from suppliers where id = p_supplier_id;

  if v_company_id is null then
    raise exception 'Fournisseur introuvable.';
  end if;

  if company_role(v_company_id) not in ('owner', 'manager', 'stock_manager') then
    raise exception 'Vous n''avez pas les droits pour enregistrer ce paiement.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Le montant doit être positif.';
  end if;

  select coalesce(sum(d.original_amount - coalesce(p.paid, 0)), 0)
  into v_total_outstanding
  from supplier_debts d
  left join (
    select debt_id, sum(amount) as paid from supplier_debt_payments group by debt_id
  ) p on p.debt_id = d.id
  where d.supplier_id = p_supplier_id;

  if p_amount > v_total_outstanding then
    raise exception 'Le montant (%) dépasse la dette totale envers ce fournisseur (%).', p_amount, v_total_outstanding;
  end if;

  for v_debt in
    select d.id, d.original_amount,
      coalesce((select sum(amount) from supplier_debt_payments where debt_id = d.id), 0) as paid
    from supplier_debts d
    where d.supplier_id = p_supplier_id
    order by d.created_at asc
  loop
    exit when v_remaining_to_allocate <= 0;

    v_remaining_on_debt := v_debt.original_amount - v_debt.paid;
    if v_remaining_on_debt <= 0 then
      continue;
    end if;

    v_paid := least(v_remaining_on_debt, v_remaining_to_allocate);

    insert into supplier_debt_payments (debt_id, amount, created_by)
    values (v_debt.id, v_paid, auth.uid());

    v_remaining_to_allocate := v_remaining_to_allocate - v_paid;
  end loop;
end;
$$;
