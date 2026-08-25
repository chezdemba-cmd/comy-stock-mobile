import { supabase } from '@/services/supabase';
import type { Expense, ExpenseCategory } from '@/types/database';

export async function fetchExpenses(companyId: string, shopId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('company_id', companyId)
    .eq('shop_id', shopId)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Expense[];
}

export async function fetchSessionExpenses(sessionId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('cash_session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Expense[];
}

export interface CreateExpenseInput {
  companyId: string;
  shopId: string;
  cashSessionId: string | null;
  category: ExpenseCategory;
  amount: number;
  description: string;
  expenseDate: string;
  receiptPhotoUrl: string | null;
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      company_id: input.companyId,
      shop_id: input.shopId,
      cash_session_id: input.cashSessionId,
      category: input.category,
      amount: input.amount,
      description: input.description || null,
      expense_date: input.expenseDate,
      receipt_photo_url: input.receiptPhotoUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Expense;
}

export async function uploadExpenseReceipt(companyId: string, localUri: string): Promise<string> {
  const extension = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${companyId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`;
  const contentType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from('expense-receipts')
    .upload(path, arrayBuffer, { contentType });

  if (error) throw error;

  const { data } = supabase.storage.from('expense-receipts').getPublicUrl(path);
  return data.publicUrl;
}
