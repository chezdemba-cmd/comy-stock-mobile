-- Phase 10 — Comy IA
-- Historique de conversation (privé par utilisateur) + deux fonctions de
-- lecture supplémentaires pour les outils get_customer_debts/get_supplier_debts.
-- Le reste des 7 outils de la Phase 10 réutilise les fonctions report_* de la
-- Phase 9 telles quelles — voir supabase/functions/comy-ai.

-- ─────────────────────────────────────────────────────────────────────────
-- ai_conversations / ai_messages — privées par utilisateur
-- ─────────────────────────────────────────────────────────────────────────
create type ai_message_role as enum ('user', 'assistant');

create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  shop_id uuid not null references shops (id) on delete cascade,
  created_by uuid not null references auth.users (id) default auth.uid(),
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ai_conversations enable row level security;

create index ai_conversations_created_by_idx on ai_conversations (created_by, created_at desc);

create trigger ai_conversations_set_updated_at
  before update on ai_conversations
  for each row execute function set_updated_at();

create policy "ai_conversations_owner_select"
  on ai_conversations for select
  using (created_by = auth.uid());

create policy "ai_conversations_owner_insert"
  on ai_conversations for insert
  with check (created_by = auth.uid());

create policy "ai_conversations_owner_update"
  on ai_conversations for update
  using (created_by = auth.uid());

create table ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations (id) on delete cascade,
  role ai_message_role not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table ai_messages enable row level security;

create index ai_messages_conversation_id_idx on ai_messages (conversation_id, created_at);

create policy "ai_messages_owner_select"
  on ai_messages for select
  using (
    exists (
      select 1 from ai_conversations c where c.id = conversation_id and c.created_by = auth.uid()
    )
  );

create policy "ai_messages_owner_insert"
  on ai_messages for insert
  with check (
    exists (
      select 1 from ai_conversations c where c.id = conversation_id and c.created_by = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- report_customer_debts / report_supplier_debts — solde dû par client/fournisseur
-- (lecture pure, pas de SECURITY DEFINER : la RLS existante suffit, même
-- principe que les fonctions report_* de la Phase 9)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function report_customer_debts(p_company_id uuid)
returns table (customer_id uuid, customer_name text, outstanding_amount numeric)
language sql
stable
as $$
  select
    c.id as customer_id,
    c.name as customer_name,
    sum(d.original_amount) - coalesce(sum(p.paid), 0) as outstanding_amount
  from customer_debts d
  join customers c on c.id = d.customer_id
  left join (
    select debt_id, sum(amount) as paid from customer_debt_payments group by debt_id
  ) p on p.debt_id = d.id
  where d.company_id = p_company_id
  group by c.id, c.name
  having sum(d.original_amount) - coalesce(sum(p.paid), 0) > 0
  order by outstanding_amount desc;
$$;

create or replace function report_supplier_debts(p_company_id uuid)
returns table (supplier_id uuid, supplier_name text, outstanding_amount numeric)
language sql
stable
as $$
  select
    s.id as supplier_id,
    s.name as supplier_name,
    sum(d.original_amount) - coalesce(sum(p.paid), 0) as outstanding_amount
  from supplier_debts d
  join suppliers s on s.id = d.supplier_id
  left join (
    select debt_id, sum(amount) as paid from supplier_debt_payments group by debt_id
  ) p on p.debt_id = d.id
  where d.company_id = p_company_id
  group by s.id, s.name
  having sum(d.original_amount) - coalesce(sum(p.paid), 0) > 0
  order by outstanding_amount desc;
$$;
