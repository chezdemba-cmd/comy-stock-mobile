-- Phase 2 — Entreprise et boutique
-- Tables : profiles, companies, company_members, shops, shop_members
-- Sécurité : RLS sur toutes les tables, écriture réservée aux fonctions RPC SECURITY DEFINER.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- Rôles applicatifs (section 4 du cahier des charges)
-- ─────────────────────────────────────────────────────────────────────────
create type app_role as enum ('owner', 'manager', 'cashier', 'stock_manager', 'accountant');

-- ─────────────────────────────────────────────────────────────────────────
-- Utilitaire : maintien automatique de updated_at
-- ─────────────────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own"
  on profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on profiles for update
  using (id = auth.uid());

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Provisionne automatiquement un profil à l'inscription.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────
-- companies
-- ─────────────────────────────────────────────────────────────────────────
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  city text not null,
  currency text not null,
  business_type text not null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table companies enable row level security;

create trigger companies_set_updated_at
  before update on companies
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- company_members
-- ─────────────────────────────────────────────────────────────────────────
create table company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

alter table company_members enable row level security;

create index company_members_user_id_idx on company_members (user_id);
create index company_members_company_id_idx on company_members (company_id);

-- Fonction SECURITY DEFINER : contourne volontairement la RLS de company_members
-- pour éviter la récursion infinie qu'entraînerait une sous-requête sur
-- company_members directement dans la policy de company_members elle-même.
create or replace function is_company_member(p_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from company_members
    where company_id = p_company_id and user_id = auth.uid()
  );
$$;

create policy "companies_select_member"
  on companies for select
  using (is_company_member(id));

create policy "company_members_select_own_company"
  on company_members for select
  using (user_id = auth.uid() or is_company_member(company_id));

-- ─────────────────────────────────────────────────────────────────────────
-- shops
-- ─────────────────────────────────────────────────────────────────────────
create table shops (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  location text not null,
  phone text not null,
  address text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table shops enable row level security;

create index shops_company_id_idx on shops (company_id);

create trigger shops_set_updated_at
  before update on shops
  for each row execute function set_updated_at();

create policy "shops_select_company_member"
  on shops for select
  using (is_company_member(company_id));

-- ─────────────────────────────────────────────────────────────────────────
-- shop_members
-- ─────────────────────────────────────────────────────────────────────────
create table shop_members (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (shop_id, user_id)
);

alter table shop_members enable row level security;

create index shop_members_user_id_idx on shop_members (user_id);
create index shop_members_shop_id_idx on shop_members (shop_id);

create policy "shop_members_select_own_or_company"
  on shop_members for select
  using (
    user_id = auth.uid()
    or shop_id in (
      select s.id from shops s
      join company_members cm on cm.company_id = s.company_id
      where cm.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- RPC : création atomique entreprise + boutique (contourne l'œuf-et-poule RLS)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function create_company(
  p_name text,
  p_country text,
  p_city text,
  p_currency text,
  p_business_type text
)
returns companies
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_company companies;
begin
  insert into companies (name, country, city, currency, business_type, created_by)
  values (p_name, p_country, p_city, p_currency, p_business_type, auth.uid())
  returning * into v_company;

  insert into company_members (company_id, user_id, role)
  values (v_company.id, auth.uid(), 'owner');

  return v_company;
end;
$$;

create or replace function create_shop(
  p_company_id uuid,
  p_name text,
  p_location text,
  p_phone text,
  p_address text
)
returns shops
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_shop shops;
  v_role app_role;
begin
  select role into v_role
  from company_members
  where company_id = p_company_id and user_id = auth.uid();

  if v_role is null or v_role not in ('owner', 'manager') then
    raise exception 'Vous devez être propriétaire ou manager de cette entreprise pour créer une boutique.';
  end if;

  insert into shops (company_id, name, location, phone, address, created_by)
  values (p_company_id, p_name, p_location, p_phone, nullif(p_address, ''), auth.uid())
  returning * into v_shop;

  insert into shop_members (shop_id, user_id, role)
  values (v_shop.id, auth.uid(), v_role);

  return v_shop;
end;
$$;
