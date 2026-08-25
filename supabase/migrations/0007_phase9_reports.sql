-- Phase 9 — Rapports
--
-- Correctif : la policy profiles_select_own (Phase 1) ne permet de lire que son
-- propre profil. C'était invisible jusqu'ici mais casse deux choses qui lisent
-- le profil d'un·e collègue : le nom du vendeur sur le reçu (Phase 5) et, plus
-- flagrant, ce rapport employés (une entreprise avec plusieurs vendeurs verrait
-- "Utilisateur" pour tout le monde sauf soi-même). On autorise la lecture du
-- profil d'un collègue partageant au moins une entreprise commune.
create policy "profiles_select_company_colleagues"
  on profiles for select
  using (
    exists (
      select 1 from company_members cm1
      join company_members cm2 on cm1.company_id = cm2.company_id
      where cm1.user_id = auth.uid() and cm2.user_id = profiles.id
    )
  );
-- Fonctions d'agrégation en lecture seule. Contrairement aux RPC d'écriture des
-- phases précédentes, aucune n'est SECURITY DEFINER : ce sont de simples
-- requêtes, la RLS déjà en place sur sales/sale_items/expenses/products suffit
-- à garantir l'isolation entre entreprises — pas besoin de la contourner ici.

-- ─────────────────────────────────────────────────────────────────────────
-- Résumé : CA, bénéfice brut, dépenses, bénéfice net, nb ventes, panier moyen
-- ─────────────────────────────────────────────────────────────────────────
create or replace function report_sales_summary(
  p_company_id uuid,
  p_shop_id uuid,
  p_start date,
  p_end date
)
returns table (
  revenue numeric,
  gross_profit numeric,
  expenses_total numeric,
  net_profit numeric,
  sales_count bigint,
  average_basket numeric
)
language sql
stable
as $$
  with period_sales as (
    select s.id, s.total
    from sales s
    where s.company_id = p_company_id
      and s.shop_id = p_shop_id
      and s.status = 'completed'
      and s.created_at::date between p_start and p_end
  ),
  cost_of_goods as (
    select coalesce(sum(si.quantity * si.unit_cost), 0) as total
    from sale_items si
    where si.sale_id in (select id from period_sales)
  ),
  period_expenses as (
    select coalesce(sum(e.amount), 0) as total
    from expenses e
    where e.company_id = p_company_id
      and e.shop_id = p_shop_id
      and e.expense_date between p_start and p_end
  )
  select
    coalesce(sum(ps.total), 0) as revenue,
    coalesce(sum(ps.total), 0) - (select total from cost_of_goods) as gross_profit,
    (select total from period_expenses) as expenses_total,
    coalesce(sum(ps.total), 0) - (select total from cost_of_goods) - (select total from period_expenses) as net_profit,
    count(ps.id) as sales_count,
    case when count(ps.id) > 0 then coalesce(sum(ps.total), 0) / count(ps.id) else 0 end as average_basket
  from period_sales ps;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Ventes par produit : quantité, CA, marge, catégorie
-- ─────────────────────────────────────────────────────────────────────────
create or replace function report_product_sales(
  p_company_id uuid,
  p_shop_id uuid,
  p_start date,
  p_end date
)
returns table (
  product_id uuid,
  product_name text,
  category_id uuid,
  category_name text,
  quantity_sold bigint,
  revenue numeric,
  margin numeric
)
language sql
stable
as $$
  select
    si.product_id,
    si.product_name,
    p.category_id,
    pc.name as category_name,
    sum(si.quantity)::bigint as quantity_sold,
    sum(si.line_total) as revenue,
    sum(si.line_total - si.quantity * si.unit_cost) as margin
  from sale_items si
  join sales s on s.id = si.sale_id
  left join products p on p.id = si.product_id
  left join product_categories pc on pc.id = p.category_id
  where s.company_id = p_company_id
    and s.shop_id = p_shop_id
    and s.status = 'completed'
    and s.created_at::date between p_start and p_end
  group by si.product_id, si.product_name, p.category_id, pc.name;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- CA par jour, pour l'histogramme
-- ─────────────────────────────────────────────────────────────────────────
create or replace function report_daily_revenue(
  p_company_id uuid,
  p_shop_id uuid,
  p_start date,
  p_end date
)
returns table (
  sale_date date,
  revenue numeric
)
language sql
stable
as $$
  select s.created_at::date as sale_date, sum(s.total) as revenue
  from sales s
  where s.company_id = p_company_id
    and s.shop_id = p_shop_id
    and s.status = 'completed'
    and s.created_at::date between p_start and p_end
  group by s.created_at::date
  order by s.created_at::date;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Ventes par employé : nb ventes, CA, remises accordées
-- ─────────────────────────────────────────────────────────────────────────
create or replace function report_employee_sales(
  p_company_id uuid,
  p_shop_id uuid,
  p_start date,
  p_end date
)
returns table (
  employee_id uuid,
  employee_name text,
  sales_count bigint,
  revenue numeric,
  total_discounts numeric
)
language sql
stable
as $$
  select
    s.created_by as employee_id,
    coalesce(pr.full_name, 'Utilisateur') as employee_name,
    count(s.id)::bigint as sales_count,
    sum(s.total) as revenue,
    sum(s.discount_amount) as total_discounts
  from sales s
  left join profiles pr on pr.id = s.created_by
  where s.company_id = p_company_id
    and s.shop_id = p_shop_id
    and s.status = 'completed'
    and s.created_at::date between p_start and p_end
  group by s.created_by, pr.full_name;
$$;
