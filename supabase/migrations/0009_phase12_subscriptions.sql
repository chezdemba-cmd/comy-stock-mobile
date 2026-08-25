-- Phase 12 — Abonnements
--
-- Trois formules (Free / Premium / Pro), reprises telles quelles du site
-- vitrine (design_handoff_comy_stock/README.md, section "Tarifs"). Le
-- changement de plan se fait hors application (contact WhatsApp + Mobile
-- Money) : aucune policy d'update n'est ajoutée sur companies.plan, il n'en
-- existait déjà aucune sur companies — la colonne reste donc modifiable
-- uniquement via une requête SQL manuelle (service role / Dashboard).
--
-- Les limites qui protègent contre un coût réel ou une croissance de
-- données illimitée (boutiques, produits, achats, messages Comy IA) sont
-- appliquées ici côté serveur, dans les RPC d'écriture existantes. Le
-- blocage des Rapports pour le plan Free est un choix commercial sans enjeu
-- de sécurité (RLS isole déjà les données par entreprise) : il est géré
-- uniquement côté mobile, pas ici.

create type plan_tier as enum ('free', 'premium', 'pro');

alter table companies add column plan plan_tier not null default 'free';

-- ─────────────────────────────────────────────────────────────────────────
-- Limites par formule (null = illimité)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function plan_max_shops(p_plan plan_tier)
returns integer
language sql
immutable
as $$
  select case p_plan
    when 'free' then 1
    when 'premium' then 3
    when 'pro' then 10
  end;
$$;

create or replace function plan_max_products(p_plan plan_tier)
returns integer
language sql
immutable
as $$
  select case p_plan when 'free' then 10 else null end;
$$;

create or replace function plan_max_purchases(p_plan plan_tier)
returns integer
language sql
immutable
as $$
  select case p_plan when 'free' then 5 else null end;
$$;

create or replace function plan_ai_max_messages(p_plan plan_tier)
returns integer
language sql
immutable
as $$
  select case p_plan
    when 'free' then 15
    when 'premium' then 15
    when 'pro' then 50
  end;
$$;

create or replace function plan_ai_period(p_plan plan_tier)
returns text
language sql
immutable
as $$
  select case p_plan when 'free' then 'month' else 'day' end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Usage courant d'une entreprise par rapport à sa formule.
-- SECURITY DEFINER : le comptage des messages Comy IA doit agréger tous les
-- utilisateurs de l'entreprise, alors qu'ai_conversations est scindé par
-- created_by = auth.uid() côté RLS (Phase 10) — même besoin que
-- company_role()/is_company_member().
-- ─────────────────────────────────────────────────────────────────────────
create or replace function subscription_usage(p_company_id uuid)
returns table (
  plan plan_tier,
  shops_used integer,
  shops_max integer,
  products_used integer,
  products_max integer,
  purchases_used integer,
  purchases_max integer,
  ai_used integer,
  ai_max integer,
  ai_period text
)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_plan plan_tier;
  v_ai_period text;
  v_window_start timestamptz;
begin
  if not is_company_member(p_company_id) then
    raise exception 'Vous n''êtes pas membre de cette entreprise.';
  end if;

  select c.plan into v_plan from companies c where c.id = p_company_id;
  v_ai_period := plan_ai_period(v_plan);
  v_window_start := case v_ai_period
    when 'day' then date_trunc('day', now())
    else date_trunc('month', now())
  end;

  return query
  select
    v_plan,
    (select count(*)::integer from shops s where s.company_id = p_company_id),
    plan_max_shops(v_plan),
    (select count(*)::integer from products p where p.company_id = p_company_id),
    plan_max_products(v_plan),
    (select count(*)::integer from purchases pu where pu.company_id = p_company_id),
    plan_max_purchases(v_plan),
    (
      select count(*)::integer
      from ai_messages m
      join ai_conversations c on c.id = m.conversation_id
      where c.company_id = p_company_id and m.role = 'user' and m.created_at >= v_window_start
    ),
    plan_ai_max_messages(v_plan),
    v_ai_period;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- create_shop — ajout de la limite de boutiques par formule
-- ─────────────────────────────────────────────────────────────────────────
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
  v_plan plan_tier;
  v_max integer;
  v_count integer;
begin
  select role into v_role
  from company_members
  where company_id = p_company_id and user_id = auth.uid();

  if v_role is null or v_role not in ('owner', 'manager') then
    raise exception 'Vous devez être propriétaire ou manager de cette entreprise pour créer une boutique.';
  end if;

  select plan into v_plan from companies where id = p_company_id;
  v_max := plan_max_shops(v_plan);
  if v_max is not null then
    select count(*) into v_count from shops where company_id = p_company_id;
    if v_count >= v_max then
      raise exception 'Limite de % boutique(s) atteinte pour votre formule actuelle. Passez à une formule supérieure pour continuer.', v_max;
    end if;
  end if;

  insert into shops (company_id, name, location, phone, address, created_by)
  values (p_company_id, p_name, p_location, p_phone, nullif(p_address, ''), auth.uid())
  returning * into v_shop;

  insert into shop_members (shop_id, user_id, role)
  values (v_shop.id, auth.uid(), v_role);

  return v_shop;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- create_product — ajout de la limite de produits par formule
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
  v_plan plan_tier;
  v_max integer;
  v_count integer;
begin
  if company_role(p_company_id) not in ('owner', 'manager', 'stock_manager') then
    raise exception 'Vous n''avez pas les droits pour créer un produit dans cette entreprise.';
  end if;

  select plan into v_plan from companies where id = p_company_id;
  v_max := plan_max_products(v_plan);
  if v_max is not null then
    select count(*) into v_count from products where company_id = p_company_id;
    if v_count >= v_max then
      raise exception 'Limite de % produits atteinte pour votre formule actuelle. Passez à une formule supérieure pour continuer.', v_max;
    end if;
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
-- create_purchase — ajout de la limite d'approvisionnements par formule
-- (contrôlée avant l'incrémentation du compteur, pour ne pas consommer un
-- numéro d'achat sur une tentative rejetée)
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
  v_plan plan_tier;
  v_max integer;
  v_count integer;
begin
  if company_role(p_company_id) not in ('owner', 'manager', 'stock_manager') then
    raise exception 'Vous n''avez pas les droits pour enregistrer un achat.';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'L''achat doit contenir au moins un article.';
  end if;

  select plan into v_plan from companies where id = p_company_id;
  v_max := plan_max_purchases(v_plan);
  if v_max is not null then
    select count(*) into v_count from purchases where company_id = p_company_id;
    if v_count >= v_max then
      raise exception 'Limite de % approvisionnement(s) atteinte pour votre formule actuelle. Passez à une formule supérieure pour continuer.', v_max;
    end if;
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
