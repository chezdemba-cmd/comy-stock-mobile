import { supabase } from '@/services/supabase';
import type { Product, ProductCategory, StockLevel, StockMovement } from '@/types/database';

export interface ProductWithStock extends Product {
  quantity: number;
}

export async function fetchProducts(companyId: string, shopId: string): Promise<ProductWithStock[]> {
  const [productsResult, stockResult] = await Promise.all([
    supabase.from('products').select('*').eq('company_id', companyId).order('name'),
    supabase.from('stock_levels').select('*').eq('company_id', companyId).eq('shop_id', shopId),
  ]);

  if (productsResult.error) throw productsResult.error;
  if (stockResult.error) throw stockResult.error;

  const quantityByProduct = new Map<string, number>();
  for (const level of (stockResult.data ?? []) as StockLevel[]) {
    quantityByProduct.set(level.product_id, level.quantity);
  }

  return ((productsResult.data ?? []) as Product[]).map((product) => ({
    ...product,
    quantity: quantityByProduct.get(product.id) ?? 0,
  }));
}

export async function fetchProductById(productId: string, shopId: string): Promise<ProductWithStock> {
  const [productResult, stockResult] = await Promise.all([
    supabase.from('products').select('*').eq('id', productId).single(),
    supabase
      .from('stock_levels')
      .select('*')
      .eq('product_id', productId)
      .eq('shop_id', shopId)
      .maybeSingle(),
  ]);

  if (productResult.error) throw productResult.error;
  if (stockResult.error) throw stockResult.error;

  return {
    ...(productResult.data as Product),
    quantity: (stockResult.data as StockLevel | null)?.quantity ?? 0,
  };
}

export async function fetchCategories(companyId: string): Promise<ProductCategory[]> {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('company_id', companyId)
    .order('name');

  if (error) throw error;
  return (data ?? []) as ProductCategory[];
}

export async function createCategory(companyId: string, name: string): Promise<ProductCategory> {
  const { data, error } = await supabase
    .from('product_categories')
    .insert({ company_id: companyId, name })
    .select()
    .single();

  if (error) throw error;
  return data as ProductCategory;
}

export interface ProductInput {
  companyId: string;
  shopId: string;
  categoryId: string | null;
  name: string;
  sku: string;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  stockMin: number;
  unit: string;
  supplierName: string;
  description: string;
  photoUrl: string | null;
}

export async function createProduct(input: ProductInput, initialStock: number): Promise<Product> {
  const { data, error } = await supabase
    .rpc('create_product', {
      p_company_id: input.companyId,
      p_shop_id: input.shopId,
      p_category_id: input.categoryId,
      p_name: input.name,
      p_sku: input.sku,
      p_barcode: input.barcode,
      p_purchase_price: input.purchasePrice,
      p_sale_price: input.salePrice,
      p_stock_min: input.stockMin,
      p_unit: input.unit,
      p_supplier_name: input.supplierName,
      p_description: input.description,
      p_photo_url: input.photoUrl,
      p_initial_stock: initialStock,
    })
    .single();

  if (error) throw error;
  return data as Product;
}

export type ProductEditInput = Omit<ProductInput, 'companyId' | 'shopId'>;

export async function updateProduct(productId: string, input: ProductEditInput): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({
      category_id: input.categoryId,
      name: input.name,
      sku: input.sku || null,
      barcode: input.barcode || null,
      purchase_price: input.purchasePrice,
      sale_price: input.salePrice,
      stock_min: input.stockMin,
      unit: input.unit || 'unité',
      supplier_name: input.supplierName || null,
      description: input.description || null,
      photo_url: input.photoUrl,
    })
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
}

export interface AdjustStockInput {
  companyId: string;
  shopId: string;
  productId: string;
  quantityChange: number;
  reason: string;
}

export async function adjustStock(input: AdjustStockInput): Promise<void> {
  const { error } = await supabase.from('stock_movements').insert({
    company_id: input.companyId,
    shop_id: input.shopId,
    product_id: input.productId,
    type: 'correction',
    quantity_change: input.quantityChange,
    reason: input.reason || null,
  });

  if (error) throw error;
}

export async function fetchStockMovements(productId: string, shopId: string): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('product_id', productId)
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as StockMovement[];
}

export async function uploadProductPhoto(companyId: string, localUri: string): Promise<string> {
  const extension = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${companyId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`;
  const contentType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from('product-photos')
    .upload(path, arrayBuffer, { contentType });

  if (error) throw error;

  const { data } = supabase.storage.from('product-photos').getPublicUrl(path);
  return data.publicUrl;
}
