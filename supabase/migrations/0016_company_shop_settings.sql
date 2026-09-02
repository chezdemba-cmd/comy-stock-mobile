-- Modification encadrée des informations d'entreprise et de boutique.

create or replace function update_company_settings(
  p_company_id uuid,
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
  if company_role(p_company_id) is distinct from 'owner'::app_role then
    raise exception 'Seul le propriétaire peut modifier l''entreprise.';
  end if;
  if nullif(trim(p_name), '') is null or nullif(trim(p_country), '') is null
    or nullif(trim(p_city), '') is null or nullif(trim(p_currency), '') is null
    or nullif(trim(p_business_type), '') is null then
    raise exception 'Tous les champs obligatoires doivent être renseignés.';
  end if;

  update companies set
    name = trim(p_name), country = trim(p_country), city = trim(p_city),
    currency = trim(p_currency), business_type = trim(p_business_type)
  where id = p_company_id
  returning * into v_company;
  return v_company;
end;
$$;

create or replace function update_shop_settings(
  p_company_id uuid,
  p_shop_id uuid,
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
begin
  if company_role(p_company_id) not in ('owner', 'manager') then
    raise exception 'Vous n''avez pas les droits pour modifier cette boutique.';
  end if;
  if not exists (select 1 from shops where id = p_shop_id and company_id = p_company_id) then
    raise exception 'Boutique introuvable.';
  end if;
  if nullif(trim(p_name), '') is null or nullif(trim(p_location), '') is null
    or nullif(trim(p_phone), '') is null then
    raise exception 'Le nom, la localisation et le téléphone sont obligatoires.';
  end if;

  update shops set
    name = trim(p_name), location = trim(p_location), phone = trim(p_phone),
    address = nullif(trim(p_address), '')
  where id = p_shop_id
  returning * into v_shop;
  return v_shop;
end;
$$;

