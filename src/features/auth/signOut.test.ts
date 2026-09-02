import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearLocalSession, signOut } from './signOut';

const mocks = vi.hoisted(() => ({
  authSignOut: vi.fn(),
  queryClear: vi.fn(),
  clearQueueStorage: vi.fn(),
  clearCart: vi.fn(),
  clearCompany: vi.fn(),
  removeItem: vi.fn(),
  setQueueState: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { removeItem: mocks.removeItem },
}));
vi.mock('@/services/supabase', () => ({ supabase: { auth: { signOut: mocks.authSignOut } } }));
vi.mock('@/services/queryClient', () => ({
  queryClient: { clear: mocks.queryClear },
  QUERY_CACHE_PERSIST_KEY: 'comy-stock/query-cache',
}));
vi.mock('@/stores/cartStore', () => ({
  useCartStore: { getState: () => ({ clear: mocks.clearCart }) },
}));
vi.mock('@/stores/companyStore', () => ({
  useCompanyStore: { getState: () => ({ clear: mocks.clearCompany }) },
}));
vi.mock('@/stores/syncQueueStore', () => ({
  useSyncQueueStore: {
    persist: { clearStorage: mocks.clearQueueStorage },
    setState: mocks.setQueueState,
  },
}));

describe('déconnexion sécurisée', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authSignOut.mockResolvedValue(undefined);
    mocks.clearQueueStorage.mockResolvedValue(undefined);
    mocks.removeItem.mockResolvedValue(undefined);
  });

  it('efface toutes les données locales', async () => {
    await clearLocalSession();

    expect(mocks.queryClear).toHaveBeenCalledOnce();
    expect(mocks.clearQueueStorage).toHaveBeenCalledOnce();
    expect(mocks.setQueueState).toHaveBeenCalledWith({ items: [] });
    expect(mocks.clearCart).toHaveBeenCalledOnce();
    expect(mocks.clearCompany).toHaveBeenCalledOnce();
    expect(mocks.removeItem).toHaveBeenCalledWith('comy-stock/query-cache');
  });

  it('purge les données même si Supabase refuse la déconnexion', async () => {
    mocks.authSignOut.mockRejectedValueOnce(new Error('Réseau indisponible'));

    await expect(signOut()).rejects.toThrow('Réseau indisponible');

    expect(mocks.clearQueueStorage).toHaveBeenCalledOnce();
    expect(mocks.clearCart).toHaveBeenCalledOnce();
    expect(mocks.clearCompany).toHaveBeenCalledOnce();
  });

  it('termine la purge mémoire si le stockage local échoue', async () => {
    mocks.clearQueueStorage.mockRejectedValueOnce(new Error('Stockage indisponible'));
    mocks.removeItem.mockRejectedValueOnce(new Error('Stockage indisponible'));

    await expect(clearLocalSession()).resolves.toBeUndefined();

    expect(mocks.setQueueState).toHaveBeenCalledWith({ items: [] });
    expect(mocks.clearCart).toHaveBeenCalledOnce();
    expect(mocks.clearCompany).toHaveBeenCalledOnce();
  });
});
