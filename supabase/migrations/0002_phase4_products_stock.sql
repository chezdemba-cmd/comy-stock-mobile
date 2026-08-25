-- Phase 4 — Produits et stock
-- Tables : product_categories, products, stock_movements, stock_levels
-- Règle clé (section 13) : stock_levels n'est JAMAIS écrit directement par le client,
-- uniquement recalculé par un trigger à partir de stock_movements.

create type stock_movement_type as enum (
  'entry', 'sale', 'return', 'correction', 'loss', 'breakage', 'transfer', 'inventory'
);

-- Rôle de l'appelant dans une entreprise (pour restreindre les écritures produits/stock
-- à owner/manager/stock_manager — section 4). SECURITY DEFINER pour la même raison que
-- is_company_member : éviter toute récursion RLS.
create or replace function company_role(p_company_id uuid)
returns app_role
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select role from company_members
  where company_id = p_company_id and user_id = auth.uid();
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- product_categories
-- ─────────────────────────────────────────────────────────────────────────
create table product_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table product_categories enable row level security;

create index product_categories_company_id_idx on product_categories (company_id);

create policy "categories_select_member"
  on product_categories for select
  using (is_company_member(company_id));

create policy "categories_write_stock_roles"
  on product_categories for insert
  with check (company_role(company_id) in ('owner', 'manager', 'stock_manager'));

-- ─────────────────────────────────────────────────────────────────────────
-- products (catalogue au niveau entreprise, partagé entre boutiques)
-- ─────────────────────────────────────────────────────────────────────────
create table products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  category_id uuid references product_categories (id) on delete set null,
  name text not null,
  sku text,
  barcode text,
  purchase_price numeric(12, 2) not null default 0,
  sale_price numeric(12, 2) not null default 0,
  stock_min integer not null default 0,
  unit text not null default 'unité',
  supplier_name text,
  description text,
  photo_url text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table products enable row level security;

create index products_company_id_idx on products (company_id);
create index products_barcode_idx on products (company_id, barcode);

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

create policy "products_select_member"
  on products for select
  using (is_company_member(company_id));

create policy "products_update_stock_roles"
  on products for update
  using (company_role(company_id) in ('owner', 'manager', 'stock_manager'));

create policy "products_delete_owner_manager"
  on products for delete
  using (company_role(company_id) in ('owner', 'manager'));

-- ─────────────────────────────────────────────────────────────────────────
-- stock_movements — journal, seule source de vérité pour faire évoluer le stock
-- ─────────────────────────────────────────────────────────────────────────
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  shop_id uuid not null references shops (id) on delete cascade,
  product_id uuid not null references products (id) on delete restrict,
  type stock_movement_type not null,
  quantity_change integer not null,
  reason text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table stock_movements enable row level security;

create index stock_movements_company_id_idx on stock_movements (company_id);
create index stock_movements_product_id_idx on stock_movements (product_id, created_at desc);
create index stock_movements_shop_id_idx on stock_movements (shop_id);

create policy "stock_movements_select_member"
  on stock_movements for select
  using (is_company_member(company_id));

create policy "stock_movements_insert_stock_roles"
  on stock_movements for insert
  with check (company_role(company_id) in ('owner', 'manager', 'stock_manager'));

-- Un rôle autorisé sur company_id ne suffit pas : il faut aussi garantir que le produit
-- et la boutique du mouvement appartiennent bien à cette même entreprise (sinon un
-- utilisateur pourrait fabriquer un mouvement avec son propre company_id mais le
-- product_id/shop_id d'une autre entreprise, corrompant leur stock_levels).
create or replace function validate_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from products where id = new.product_id and company_id = new.company_id
  ) then
    raise exception 'Ce produit n''appartient pas à cette entreprise.';
  end if;

  if not exists (
    select 1 from shops where id = new.shop_id and company_id = new.company_id
  ) then
    raise exception 'Cette boutique n''appartient pas à cette entreprise.';
  end if;

  return new;
end;
$$;

create trigger stock_movements_validate
  before insert on stock_movements
  for each row execute function validate_stock_movement();

-- ─────────────────────────────────────────────────────────────────────────
-- stock_levels — cache maintenu uniquement par trigger (aucune policy d'écriture client)
-- ─────────────────────────────────────────────────────────────────────────
create table stock_levels (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  shop_id uuid not null references shops (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  quantity integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (shop_id, product_id)
);

alter table stock_levels enable row level security;

create index stock_levels_company_id_idx on stock_levels (company_id);
create index stock_levels_product_id_idx on stock_levels (product_id);

create policy "stock_levels_select_member"
  on stock_levels for select
  using (is_company_member(company_id));

create or replace function apply_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into stock_levels (company_id, shop_id, product_id, quantity)
  values (new.company_id, new.shop_id, new.product_id, new.quantity_change)
  on conflict (shop_id, product_id)
  do update set
    quantity = stock_levels.quantity + excluded.quantity,
    updated_at = now();
  return new;
end;
$$;

create trigger stock_movements_apply
  after insert on stock_movements
  for each row execute function apply_stock_movement();

-- ─────────────────────────────────────────────────────────────────────────
-- RPC : création atomique produit + mouvement de stock initial
-- ─────────────────────────────────────────────────────────────────────────
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
  p_supplier_name text,
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
    stock_min, unit, supplier_name, description, photo_url, created_by
  )
  values (
    p_company_id, p_category_id, p_name, nullif(p_sku, ''), nullif(p_barcode, ''),
    p_purchase_price, p_sale_price, p_stock_min, coalesce(nullif(p_unit, ''), 'unité'),
    nullif(p_supplier_name, ''), nullif(p_description, ''), nullif(p_photo_url, ''), auth.uid()
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
-- Storage : photos produits (bucket public en lecture, écriture par membres de l'entreprise)
-- Chemin attendu : {company_id}/{uuid}.jpg
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

create policy "product_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'product-photos');

create policy "product_photos_insert_member"
  on storage.objects for insert
  with check (
    bucket_id = 'product-photos'
    and is_company_member(((storage.foldername(name))[1])::uuid)
  );

create policy "product_photos_delete_member"
  on storage.objects for delete
  using (
    bucket_id = 'product-photos'
    and is_company_member(((storage.foldername(name))[1])::uuid)
  );
