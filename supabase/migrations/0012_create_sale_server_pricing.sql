-- Correctif d'audit (H2) — create_sale recalcule les montants côté serveur
--
-- Jusqu'ici create_sale (Phase 5) insérait tels quels les unit_price / unit_cost
-- / subtotal / total envoyés par le client, en ne vérifiant que
-- « somme(paiements) == p_total ». Un client modifié — ou un rejeu falsifié de la
-- file de synchro hors-ligne — pouvait donc enregistrer une vente à un CA / une
-- marge arbitraires tout en décrémentant réellement le stock, corrompant la
-- comptabilité que l'app est censée fiabiliser.
--
-- Désormais :
--   - unit_price  ← products.sale_price      (au moment de la vente)
--   - unit_cost   ← products.purchase_price  (idem, pour la marge)
--   - product_name ← products.name
--   - line_total / subtotal / total  recalculés
--   - p_discount_amount est la SEULE entrée monétaire libre, bornée à [0, subtotal]
--   - la vente est rejetée si le sous-total client s'écarte du sous-total serveur
--     (catalogue périmé → l'app doit rafraîchir le panier)
--   - boutique, affectation utilisateur et client sont validés explicitement
--   - chaque paiement doit être strictement positif
-- La signature est inchangée : le client continue d'envoyer ses valeurs, elles ne
-- servent plus qu'au contrôle de cohérence.

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
  v_payment_amount numeric;
  v_credit_total numeric := 0;
  v_payments_total numeric := 0;
  v_product products;
  v_quantity integer;
  v_line_total numeric;
  v_server_subtotal numeric := 0;
  v_discount numeric;
  v_server_total numeric;
begin
  if company_role(p_company_id) not in ('owner', 'manager', 'cashier') then
    raise exception 'Vous n''avez pas les droits pour enregistrer une vente.';
  end if;

  if not exists (
    select 1 from shops
    where id = p_shop_id and company_id = p_company_id
  ) then
    raise exception 'Cette boutique n''appartient pas à cette entreprise.';
  end if;

  if not exists (
    select 1 from shop_members
    where shop_id = p_shop_id and user_id = auth.uid()
  ) then
    raise exception 'Vous n''êtes pas affecté à cette boutique.';
  end if;

  if p_customer_id is not null and not exists (
    select 1 from customers
    where id = p_customer_id and company_id = p_company_id
  ) then
    raise exception 'Ce client n''appartient pas à cette entreprise.';
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

  -- Sous-total recalculé à partir du catalogue serveur.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Quantité invalide pour un article du panier.';
    end if;

    select * into v_product
    from products
    where id = (v_item ->> 'product_id')::uuid and company_id = p_company_id;

    if v_product.id is null then
      raise exception 'Un article du panier ne fait pas partie du catalogue de cette entreprise.';
    end if;

    v_server_subtotal := v_server_subtotal + v_quantity * v_product.sale_price;
  end loop;

  -- Remise : seule valeur monétaire décidée par le client, bornée.
  v_discount := coalesce(p_discount_amount, 0);
  if v_discount < 0 or v_discount > v_server_subtotal then
    raise exception 'Remise invalide (%). Elle doit être comprise entre 0 et le sous-total (%).',
      v_discount, v_server_subtotal;
  end if;

  v_server_total := v_server_subtotal - v_discount;

  -- Catalogue périmé côté client : on refuse plutôt que d'enregistrer un montant
  -- que le vendeur n'a pas vu à l'écran.
  if round(coalesce(p_subtotal, 0), 2) <> round(v_server_subtotal, 2) then
    raise exception 'Les prix ont changé depuis l''ouverture du panier. Rafraîchissez la caisse et recommencez.';
  end if;

  for v_payment in select * from jsonb_array_elements(p_payments)
  loop
    v_payment_amount := (v_payment ->> 'amount')::numeric;
    if v_payment_amount is null or v_payment_amount <= 0 then
      raise exception 'Le montant de chaque paiement doit être strictement positif.';
    end if;

    v_payments_total := v_payments_total + v_payment_amount;
    if (v_payment ->> 'method') = 'credit' then
      v_credit_total := v_credit_total + v_payment_amount;
    end if;
  end loop;

  if round(v_payments_total, 2) <> round(v_server_total, 2) then
    raise exception 'La somme des paiements (%) ne correspond pas au total (%).', v_payments_total, v_server_total;
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
    v_server_subtotal, v_discount, v_server_total, auth.uid()
  )
  returning * into v_sale;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;

    select * into v_product
    from products
    where id = (v_item ->> 'product_id')::uuid and company_id = p_company_id;

    v_line_total := v_quantity * v_product.sale_price;

    insert into sale_items (sale_id, product_id, product_name, quantity, unit_price, unit_cost, line_total)
    values (
      v_sale.id,
      v_product.id,
      v_product.name,
      v_quantity,
      v_product.sale_price,
      coalesce(v_product.purchase_price, 0),
      v_line_total
    );

    insert into stock_movements (company_id, shop_id, product_id, type, quantity_change, reason, created_by)
    values (
      p_company_id, p_shop_id, v_product.id, 'sale',
      -1 * v_quantity, 'Vente #' || v_sale_number, auth.uid()
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
