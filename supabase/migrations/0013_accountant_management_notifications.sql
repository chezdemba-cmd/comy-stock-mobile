-- Comptable-manager, affectations multi-boutiques et notifications de stock.

-- Dans le contexte métier ciblé, le comptable possède les mêmes permissions
-- opérationnelles qu'un manager. Son rôle reste "accountant" dans les tables et
-- l'interface, mais les contrôles historiques basés sur company_role() le traitent
-- comme un manager. Les actions owner-only restent explicitement owner-only.
create or replace function company_role(p_company_id uuid)
returns app_role
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select case when role = 'accountant' then 'manager'::app_role else role end
  from company_members
  where company_id = p_company_id and user_id = auth.uid();
$$;

-- create_shop lisait directement company_members et ne passait pas par
-- company_role(); on l'aligne explicitement sur le rôle comptable-manager.
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

  if v_role is null or v_role not in ('owner', 'manager', 'accountant') then
    raise exception 'Vous devez être propriétaire, manager ou comptable pour créer une boutique.';
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

-- Gestion owner-only du rôle global et des boutiques d'un membre existant.
create or replace function update_member_role(
  p_company_id uuid,
  p_user_id uuid,
  p_role app_role
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_old_role app_role;
  v_owner_count integer;
begin
  if company_role(p_company_id) is distinct from 'owner'::app_role then
    raise exception 'Seul le propriétaire peut modifier les rôles.';
  end if;

  select role into v_old_role from company_members
  where company_id = p_company_id and user_id = p_user_id;
  if v_old_role is null then raise exception 'Membre introuvable.'; end if;

  if v_old_role = 'owner' and p_role <> 'owner' then
    select count(*) into v_owner_count from company_members
    where company_id = p_company_id and role = 'owner';
    if v_owner_count <= 1 then
      raise exception 'Impossible de modifier le rôle du dernier propriétaire.';
    end if;
  end if;

  update company_members set role = p_role
  where company_id = p_company_id and user_id = p_user_id;

  update shop_members sm set role = p_role
  where sm.user_id = p_user_id
    and sm.shop_id in (select id from shops where company_id = p_company_id);
end;
$$;

create or replace function assign_member_to_shop(
  p_company_id uuid,
  p_user_id uuid,
  p_shop_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role app_role;
begin
  if company_role(p_company_id) is distinct from 'owner'::app_role then
    raise exception 'Seul le propriétaire peut modifier les affectations.';
  end if;
  if not exists (select 1 from shops where id = p_shop_id and company_id = p_company_id) then
    raise exception 'Boutique invalide.';
  end if;
  select role into v_role from company_members
  where company_id = p_company_id and user_id = p_user_id;
  if v_role is null then raise exception 'Membre introuvable.'; end if;

  insert into shop_members (shop_id, user_id, role)
  values (p_shop_id, p_user_id, v_role)
  on conflict (shop_id, user_id) do update set role = excluded.role;
end;
$$;

create or replace function remove_member_from_shop(
  p_company_id uuid,
  p_user_id uuid,
  p_shop_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_assignment_count integer;
begin
  if company_role(p_company_id) is distinct from 'owner'::app_role then
    raise exception 'Seul le propriétaire peut modifier les affectations.';
  end if;
  if not exists (select 1 from shops where id = p_shop_id and company_id = p_company_id) then
    raise exception 'Boutique invalide.';
  end if;

  select count(*) into v_assignment_count
  from shop_members sm join shops s on s.id = sm.shop_id
  where sm.user_id = p_user_id and s.company_id = p_company_id;
  if v_assignment_count <= 1 then
    raise exception 'Un membre doit rester affecté à au moins une boutique.';
  end if;

  delete from shop_members where shop_id = p_shop_id and user_id = p_user_id;
end;
$$;

-- Centre de notifications internes. Chaque mouvement de stock génère une ligne
-- pour tous les propriétaires et comptables de l'entreprise.
create table user_notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  stock_movement_id uuid not null references stock_movements(id) on delete cascade,
  product_id uuid not null references products(id),
  movement_type stock_movement_type not null,
  quantity_change integer not null,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (recipient_id, stock_movement_id)
);

alter table user_notifications enable row level security;
create index user_notifications_recipient_idx on user_notifications(recipient_id, created_at desc);
create index user_notifications_company_idx on user_notifications(company_id, created_at desc);

create policy "notifications_select_own" on user_notifications for select
  using (recipient_id = auth.uid());
create policy "notifications_update_own" on user_notifications for update
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create or replace function notify_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product_name text;
  v_shop_name text;
  v_actor_name text;
  v_direction text;
begin
  select name into v_product_name from products where id = new.product_id;
  select name into v_shop_name from shops where id = new.shop_id;
  select full_name into v_actor_name from profiles where id = new.created_by;
  v_direction := case when new.quantity_change > 0 then 'Entrée' else 'Sortie' end;

  insert into user_notifications (
    company_id, shop_id, recipient_id, stock_movement_id, product_id,
    movement_type, quantity_change, title, message
  )
  select
    new.company_id, new.shop_id, cm.user_id, new.id, new.product_id,
    new.type, new.quantity_change,
    v_direction || ' de stock',
    abs(new.quantity_change) || ' × ' || coalesce(v_product_name, 'Produit') ||
      ' — ' || coalesce(v_shop_name, 'Boutique') ||
      ' — par ' || coalesce(v_actor_name, 'Utilisateur') ||
      case when new.reason is not null and new.reason <> '' then ' (' || new.reason || ')' else '' end
  from company_members cm
  where cm.company_id = new.company_id and cm.role in ('owner', 'accountant')
  on conflict (recipient_id, stock_movement_id) do nothing;

  return new;
end;
$$;

create trigger stock_movements_notify
  after insert on stock_movements
  for each row execute function notify_stock_movement();
