import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface CompanyState {
  activeCompanyId: string | null;
  activeShopId: string | null;
  setActiveCompany: (companyId: string | null) => void;
  setActiveShop: (shopId: string | null) => void;
  clear: () => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      activeCompanyId: null,
      activeShopId: null,
      setActiveCompany: (companyId) => set({ activeCompanyId: companyId }),
      setActiveShop: (shopId) => set({ activeShopId: shopId }),
      clear: () => set({ activeCompanyId: null, activeShopId: null }),
    }),
    {
      name: 'comy-stock/active-company',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
