-- Phase 6 — Clients et dettes
-- Ajoute l'échéance sur les dettes et une RPC d'encaissement qui alloue le
-- paiement sur les dettes les plus anciennes du client (FIFO), potentiellement
-- réparti sur plusieurs dettes.

alter table customer_debts add column due_date date;

-- Correctif Phase 5 : customers.created_by est NOT NULL sans défaut, or la création
-- de client (CustomerPicker de la caisse, puis le formulaire complet de cette phase)
-- ne le fournit pas explicitement — l'insertion échouerait. auth.uid() comme défaut
-- règle ça au niveau base, sans changer le code client déjà écrit en Phase 5.
alter table customers alter column created_by set default auth.uid();

create or replace function pay_customer_debt(p_customer_id uuid, p_amount numeric)
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
  select company_id into v_company_id from customers where id = p_customer_id;

  if v_company_id is null then
    raise exception 'Client introuvable.';
  end if;

  if company_role(v_company_id) not in ('owner', 'manager', 'cashier') then
    raise exception 'Vous n''avez pas les droits pour encaisser un paiement.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Le montant doit être positif.';
  end if;

  -- Calcule le total encore dû, pour rejeter un montant excessif.
  select coalesce(sum(d.original_amount - coalesce(p.paid, 0)), 0)
  into v_total_outstanding
  from customer_debts d
  left join (
    select debt_id, sum(amount) as paid from customer_debt_payments group by debt_id
  ) p on p.debt_id = d.id
  where d.customer_id = p_customer_id;

  if p_amount > v_total_outstanding then
    raise exception 'Le montant (%) dépasse la dette totale du client (%).', p_amount, v_total_outstanding;
  end if;

  for v_debt in
    select d.id, d.original_amount,
      coalesce((select sum(amount) from customer_debt_payments where debt_id = d.id), 0) as paid
    from customer_debts d
    where d.customer_id = p_customer_id
    order by d.created_at asc
  loop
    exit when v_remaining_to_allocate <= 0;

    v_remaining_on_debt := v_debt.original_amount - v_debt.paid;
    if v_remaining_on_debt <= 0 then
      continue;
    end if;

    v_paid := least(v_remaining_on_debt, v_remaining_to_allocate);

    insert into customer_debt_payments (debt_id, amount, created_by)
    values (v_debt.id, v_paid, auth.uid());

    v_remaining_to_allocate := v_remaining_to_allocate - v_paid;
  end loop;
end;
$$;
