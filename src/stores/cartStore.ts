import { create } from 'zustand';

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  unitCost: number;
  quantity: number;
  availableQuantity: number;
}

interface CartState {
  items: CartItem[];
  discountAmount: number;
  customerId: string | null;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  setDiscount: (amount: number) => void;
  setCustomer: (customerId: string | null) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  discountAmount: 0,
  customerId: null,

  addItem: (item, quantity = 1) =>
    set((state) => {
      const existing = state.items.find((line) => line.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((line) =>
            line.productId === item.productId
              ? { ...line, quantity: line.quantity + quantity }
              : line
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity }] };
    }),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((line) => line.productId !== productId)
          : state.items.map((line) => (line.productId === productId ? { ...line, quantity } : line)),
    })),

  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((line) => line.productId !== productId) })),

  setDiscount: (amount) => set({ discountAmount: amount }),
  setCustomer: (customerId) => set({ customerId }),

  clear: () => set({ items: [], discountAmount: 0, customerId: null }),
}));

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}
