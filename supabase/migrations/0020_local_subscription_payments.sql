-- Paiements locaux des abonnements Comy Stock.
-- Les montants et l'activation sont exclusivement controles cote serveur.

create type subscription_payment_provider as enum ('wave', 'orange_money', 'moov_money');
create type subscription_billing_cycle as enum ('monthly', 'yearly');
create type subscription_payment_status as enum ('pending', 'processing', 'succeeded', 'failed', 'expired');

alter table companies add column plan_expires_at timestamptz;

create table subscription_payment_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  target_plan plan_tier not null check (target_plan <> 'free'),
  billing_cycle subscription_billing_cycle not null,
  provider subscription_payment_provider not null,
  amount integer not null check (amount > 0),
  currency text not null default 'XOF' check (currency = 'XOF'),
  status subscription_payment_status not null default 'pending',
  provider_checkout_id text unique,
  provider_transaction_id text,
  checkout_url text,
  failure_reason text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscription_payment_orders_company_created_idx
  on subscription_payment_orders (company_id, created_at desc);

create trigger subscription_payment_orders_set_updated_at
  before update on subscription_payment_orders
  for each row execute function set_updated_at();

alter table subscription_payment_orders enable row level security;

create policy "subscription_payment_orders_select_owner"
  on subscription_payment_orders for select
  using (company_role(company_id) = 'owner');

-- Aucun INSERT/UPDATE client : les Edge Functions utilisant la service role
-- creent les commandes et activent les formules apres verification du webhook.
create or replace function activate_paid_subscription(
  p_order_id uuid,
  p_provider_transaction_id text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order subscription_payment_orders;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Acces interdit.';
  end if;

  select * into v_order
  from subscription_payment_orders
  where id = p_order_id
  for update;

  if v_order.id is null or v_order.status = 'succeeded' then
    return;
  end if;

  update companies
  set plan = v_order.target_plan,
      plan_expires_at = greatest(coalesce(plan_expires_at, now()), now())
        + case v_order.billing_cycle when 'monthly' then interval '1 month' else interval '1 year' end
  where id = v_order.company_id;
  update subscription_payment_orders
  set status = 'succeeded', provider_transaction_id = p_provider_transaction_id, paid_at = now()
  where id = p_order_id;
end;
$$;

revoke all on function activate_paid_subscription(uuid, text) from public, anon, authenticated;
grant execute on function activate_paid_subscription(uuid, text) to service_role;
