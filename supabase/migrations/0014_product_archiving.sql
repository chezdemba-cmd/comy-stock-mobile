-- Archivage logique des produits : l'historique financier et de stock reste intact.

alter table products add column archived_at timestamptz;
create index products_active_company_idx on products (company_id, name)
  where archived_at is null;

-- La suppression physique n'est plus exposée aux utilisateurs de l'application.
drop policy if exists "products_delete_owner_manager" on products;

create or replace function archive_product(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_company_id uuid;
begin
  select company_id into v_company_id
  from products
  where id = p_product_id;

  if v_company_id is null then
    raise exception 'Produit introuvable.';
  end if;

  if company_role(v_company_id) not in ('owner', 'manager') then
    raise exception 'Vous n''avez pas les droits pour archiver ce produit.';
  end if;

  update products
  set archived_at = now()
  where id = p_product_id and archived_at is null;
end;
$$;

