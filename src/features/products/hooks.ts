import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCompanyStore } from '@/stores/companyStore';
import {
  adjustStock,
  createCategory,
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchProductById,
  fetchProducts,
  fetchStockMovements,
  updateProduct,
  type AdjustStockInput,
  type ProductEditInput,
  type ProductInput,
} from './api';

function useActiveScope() {
  const companyId = useCompanyStore((state) => state.activeCompanyId);
  const shopId = useCompanyStore((state) => state.activeShopId);
  return { companyId, shopId };
}

export function useProducts() {
  const { companyId, shopId } = useActiveScope();

  return useQuery({
    queryKey: ['products', companyId, shopId],
    queryFn: () => fetchProducts(companyId as string, shopId as string),
    enabled: Boolean(companyId && shopId),
  });
}

export function useProduct(productId: string | undefined) {
  const { shopId } = useActiveScope();

  return useQuery({
    queryKey: ['product', productId, shopId],
    queryFn: () => fetchProductById(productId as string, shopId as string),
    enabled: Boolean(productId && shopId),
  });
}

export function useCategories() {
  const { companyId } = useActiveScope();

  return useQuery({
    queryKey: ['categories', companyId],
    queryFn: () => fetchCategories(companyId as string),
    enabled: Boolean(companyId),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { companyId } = useActiveScope();

  return useMutation({
    mutationFn: (name: string) => createCategory(companyId as string, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', companyId] });
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { companyId, shopId } = useActiveScope();

  return useMutation({
    mutationFn: ({ input, initialStock }: { input: ProductInput; initialStock: number }) =>
      createProduct(input, initialStock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', companyId, shopId] });
    },
  });
}

export function useUpdateProduct(productId: string) {
  const queryClient = useQueryClient();
  const { companyId, shopId } = useActiveScope();

  return useMutation({
    mutationFn: (input: ProductEditInput) => updateProduct(productId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', companyId, shopId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId, shopId] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { companyId, shopId } = useActiveScope();

  return useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', companyId, shopId] });
    },
  });
}

export function useAdjustStock(productId: string) {
  const queryClient = useQueryClient();
  const { companyId, shopId } = useActiveScope();

  return useMutation({
    mutationFn: (input: Omit<AdjustStockInput, 'companyId' | 'shopId' | 'productId'>) =>
      adjustStock({ ...input, companyId: companyId as string, shopId: shopId as string, productId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', companyId, shopId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId, shopId] });
      queryClient.invalidateQueries({ queryKey: ['stockMovements', productId, shopId] });
    },
  });
}

export function useStockMovements(productId: string | undefined) {
  const { shopId } = useActiveScope();

  return useQuery({
    queryKey: ['stockMovements', productId, shopId],
    queryFn: () => fetchStockMovements(productId as string, shopId as string),
    enabled: Boolean(productId && shopId),
  });
}
