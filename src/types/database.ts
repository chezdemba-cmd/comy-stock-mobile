export type AppRole = 'owner' | 'manager' | 'cashier' | 'stock_manager' | 'accountant';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  country: string;
  city: string;
  currency: string;
  business_type: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Shop {
  id: string;
  company_id: string;
  name: string;
  location: string;
  phone: string;
  address: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ShopMember {
  id: string;
  shop_id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  company_id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  company_id: string;
  category_id: string | null;
  name: string;
  sku: string | null;
  barcode: string | null;
  purchase_price: number;
  sale_price: number;
  stock_min: number;
  unit: string;
  supplier_name: string | null;
  description: string | null;
  photo_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type StockMovementType =
  | 'entry'
  | 'sale'
  | 'return'
  | 'correction'
  | 'loss'
  | 'breakage'
  | 'transfer'
  | 'inventory';

export interface StockMovement {
  id: string;
  company_id: string;
  shop_id: string;
  product_id: string;
  type: StockMovementType;
  quantity_change: number;
  reason: string | null;
  created_by: string;
  created_at: string;
}

export interface StockLevel {
  id: string;
  company_id: string;
  shop_id: string;
  product_id: string;
  quantity: number;
  updated_at: string;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'cash' | 'card' | 'orange_money' | 'wave' | 'moov_money' | 'credit';

export type SaleStatus = 'completed' | 'cancelled';

export interface Sale {
  id: string;
  company_id: string;
  shop_id: string;
  customer_id: string | null;
  cash_session_id: string | null;
  sale_number: number;
  subtotal: number;
  discount_amount: number;
  total: number;
  status: SaleStatus;
  created_by: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  line_total: number;
}

export interface Payment {
  id: string;
  sale_id: string;
  method: PaymentMethod;
  amount: number;
  created_at: string;
}

export interface CustomerDebt {
  id: string;
  company_id: string;
  shop_id: string;
  customer_id: string;
  sale_id: string | null;
  original_amount: number;
  due_date: string | null;
  created_by: string;
  created_at: string;
}

export interface CustomerDebtPayment {
  id: string;
  debt_id: string;
  amount: number;
  paid_at: string;
  created_by: string;
}

export type CashSessionStatus = 'open' | 'closed';

export interface CashRegisterSession {
  id: string;
  company_id: string;
  shop_id: string;
  opening_amount: number;
  opened_by: string;
  opened_at: string;
  closing_theoretical: number | null;
  closing_real: number | null;
  difference: number | null;
  closed_by: string | null;
  closed_at: string | null;
  status: CashSessionStatus;
  notes: string | null;
}

export type CashMovementType = 'in' | 'out';

export interface CashMovement {
  id: string;
  company_id: string;
  shop_id: string;
  session_id: string;
  type: CashMovementType;
  amount: number;
  reason: string | null;
  created_by: string;
  created_at: string;
}
