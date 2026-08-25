import { supabase } from '@/services/supabase';
import type { Customer, CustomerDebtPayment, Sale } from '@/types/database';

export async function fetchCustomers(companyId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', companyId)
    .order('name');

  if (error) throw error;
  return (data ?? []) as Customer[];
}

export async function fetchCustomerById(customerId: string): Promise<Customer> {
  const { data, error } = await supabase.from('customers').select('*').eq('id', customerId).single();
  if (error) throw error;
  return data as Customer;
}

export async function createCustomer(companyId: string, name: string, phone: string): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert({ company_id: companyId, name, phone: phone || null })
    .select()
    .single();

  if (error) throw error;
  return data as Customer;
}

export interface CustomerInput {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  notes: string;
}

export async function createCustomerFull(companyId: string, input: CustomerInput): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      company_id: companyId,
      name: input.name,
      phone: input.phone || null,
      whatsapp: input.whatsapp || null,
      email: input.email || null,
      address: input.address || null,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Customer;
}

export async function updateCustomer(customerId: string, input: CustomerInput): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update({
      name: input.name,
      phone: input.phone || null,
      whatsapp: input.whatsapp || null,
      email: input.email || null,
      address: input.address || null,
      notes: input.notes || null,
    })
    .eq('id', customerId)
    .select()
    .single();

  if (error) throw error;
  return data as Customer;
}

export interface CustomerStats {
  totalRevenue: number;
  purchaseCount: number;
  lastVisit: string | null;
}

export async function fetchCustomerStats(customerId: string): Promise<CustomerStats> {
  const { data, error } = await supabase
    .from('sales')
    .select('total, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const sales = (data ?? []) as Pick<Sale, 'total' | 'created_at'>[];

  return {
    totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
    purchaseCount: sales.length,
    lastVisit: sales[0]?.created_at ?? null,
  };
}

export interface CustomerDebtSummary {
  totalOutstanding: number;
  payments: (CustomerDebtPayment & { debt_original_amount: number })[];
}

export async function fetchCustomerDebtSummary(customerId: string): Promise<CustomerDebtSummary> {
  const { data: debts, error: debtsError } = await supabase
    .from('customer_debts')
    .select('id, original_amount')
    .eq('customer_id', customerId);

  if (debtsError) throw debtsError;

  const debtIds = (debts ?? []).map((debt) => debt.id as string);
  const totalDebts = (debts ?? []).reduce((sum, debt) => sum + (debt.original_amount as number), 0);

  if (debtIds.length === 0) {
    return { totalOutstanding: 0, payments: [] };
  }

  const { data: payments, error: paymentsError } = await supabase
    .from('customer_debt_payments')
    .select('*')
    .in('debt_id', debtIds)
    .order('paid_at', { ascending: false });

  if (paymentsError) throw paymentsError;

  const debtAmountById = new Map((debts ?? []).map((debt) => [debt.id as string, debt.original_amount as number]));
  const totalPaid = (payments ?? []).reduce((sum, payment) => sum + (payment.amount as number), 0);

  return {
    totalOutstanding: Math.max(totalDebts - totalPaid, 0),
    payments: (payments ?? []).map((payment) => ({
      ...(payment as CustomerDebtPayment),
      debt_original_amount: debtAmountById.get(payment.debt_id as string) ?? 0,
    })),
  };
}

export async function fetchOutstandingDebtsByCustomer(companyId: string): Promise<Record<string, number>> {
  const { data: debts, error: debtsError } = await supabase
    .from('customer_debts')
    .select('id, customer_id, original_amount')
    .eq('company_id', companyId);

  if (debtsError) throw debtsError;
  if (!debts || debts.length === 0) return {};

  const debtIds = debts.map((debt) => debt.id as string);

  const { data: payments, error: paymentsError } = await supabase
    .from('customer_debt_payments')
    .select('debt_id, amount')
    .in('debt_id', debtIds);

  if (paymentsError) throw paymentsError;

  const paidByDebt = new Map<string, number>();
  for (const payment of payments ?? []) {
    const debtId = payment.debt_id as string;
    paidByDebt.set(debtId, (paidByDebt.get(debtId) ?? 0) + (payment.amount as number));
  }

  const outstandingByCustomer: Record<string, number> = {};
  for (const debt of debts) {
    const customerId = debt.customer_id as string;
    const remaining = (debt.original_amount as number) - (paidByDebt.get(debt.id as string) ?? 0);
    outstandingByCustomer[customerId] = (outstandingByCustomer[customerId] ?? 0) + Math.max(remaining, 0);
  }

  return outstandingByCustomer;
}

export async function payCustomerDebt(customerId: string, amount: number): Promise<void> {
  const { error } = await supabase.rpc('pay_customer_debt', {
    p_customer_id: customerId,
    p_amount: amount,
  });

  if (error) throw error;
}
