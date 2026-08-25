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
