import { supabase } from '@/services/supabase';
import { expenseCategoryLabel } from '@/features/expenses/schemas';
import type { RecentOperation } from './types';

export async function fetchRecentOperations(companyId: string, shopId: string): Promise<RecentOperation[]> {
  const [salesResult, expensesResult] = await Promise.all([
    supabase
      .from('sales')
      .select('id, sale_number, total, created_at')
      .eq('company_id', companyId)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('expenses')
      .select('id, category, description, amount, created_at')
      .eq('company_id', companyId)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (salesResult.error) throw salesResult.error;
  if (expensesResult.error) throw expensesResult.error;

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const salesOps: RecentOperation[] = (salesResult.data ?? []).map((sale) => ({
    id: `sale-${sale.id}`,
    kind: 'sale',
    title: `Vente #${sale.sale_number}`,
    subtitle: 'Vente',
    amount: sale.total as number,
    time: formatTime(sale.created_at as string),
    createdAt: sale.created_at as string,
  }));

  const expenseOps: RecentOperation[] = (expensesResult.data ?? []).map((expense) => ({
    id: `expense-${expense.id}`,
    kind: 'expense',
    title: expenseCategoryLabel[expense.category as string] ?? (expense.category as string),
    subtitle: (expense.description as string) || 'Dépense',
    amount: -(expense.amount as number),
    time: formatTime(expense.created_at as string),
    createdAt: expense.created_at as string,
  }));

  return [...salesOps, ...expenseOps]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
}
