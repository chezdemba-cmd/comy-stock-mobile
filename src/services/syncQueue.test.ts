import { beforeEach, describe, expect, it, vi } from 'vitest';
import { processQueue } from './syncQueue';

const mocks = vi.hoisted(() => ({
  getNetworkStateAsync: vi.fn(),
  createSale: vi.fn(),
  markSyncing: vi.fn(),
  markError: vi.fn(),
  remove: vi.fn(),
  state: { items: [] as Record<string, unknown>[] },
}));

vi.mock('expo-network', () => ({ getNetworkStateAsync: mocks.getNetworkStateAsync }));
vi.mock('@/features/pos/api', () => ({ createSale: mocks.createSale, addCashMovement: vi.fn() }));
vi.mock('@/features/expenses/api', () => ({ createExpense: vi.fn() }));
vi.mock('@/features/products/api', () => ({ adjustStock: vi.fn() }));
vi.mock('@/services/queryClient', () => ({ queryClient: { invalidateQueries: vi.fn() } }));
vi.mock('@/stores/syncQueueStore', () => ({
  useSyncQueueStore: {
    getState: () => ({
      items: mocks.state.items,
      markSyncing: mocks.markSyncing,
      markError: mocks.markError,
      remove: mocks.remove,
    }),
  },
}));

const saleItem = (status: 'pending' | 'syncing' | 'error') => ({
  id: 'sale-1',
  type: 'createSale',
  status,
  createdAt: '2026-09-01T00:00:00.000Z',
  payload: { companyId: 'company-1', shopId: 'shop-1' },
});

describe('processQueue', () => {
  beforeEach(() => {
    mocks.state.items = [];
    vi.clearAllMocks();
    mocks.getNetworkStateAsync.mockResolvedValue({ isConnected: true, isInternetReachable: true });
  });

  it('ne traite pas la file sans connexion', async () => {
    mocks.state.items = [saleItem('pending')];
    mocks.getNetworkStateAsync.mockResolvedValue({ isConnected: false, isInternetReachable: false });

    await processQueue();

    expect(mocks.createSale).not.toHaveBeenCalled();
    expect(mocks.markSyncing).not.toHaveBeenCalled();
  });

  it('traite et retire une opération en attente', async () => {
    mocks.state.items = [saleItem('pending')];

    await processQueue();

    expect(mocks.markSyncing).toHaveBeenCalledWith('sale-1');
    expect(mocks.createSale).toHaveBeenCalledOnce();
    expect(mocks.remove).toHaveBeenCalledWith('sale-1');
  });

  it('laisse une opération en erreur en attente d’une reprise manuelle', async () => {
    mocks.state.items = [saleItem('error')];

    await processQueue();

    expect(mocks.createSale).not.toHaveBeenCalled();
    expect(mocks.markSyncing).not.toHaveBeenCalled();
  });

  it('enregistre l’erreur serveur sans retirer l’opération', async () => {
    mocks.state.items = [saleItem('pending')];
    mocks.createSale.mockRejectedValueOnce(new Error('Serveur indisponible'));

    await processQueue();

    expect(mocks.markError).toHaveBeenCalledWith('sale-1', 'Serveur indisponible');
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('empêche deux traitements simultanés pendant la vérification réseau', async () => {
    let resolveNetwork!: (value: { isConnected: boolean; isInternetReachable: boolean }) => void;
    mocks.getNetworkStateAsync.mockImplementationOnce(
      () => new Promise((resolve) => { resolveNetwork = resolve; }),
    );

    const first = processQueue();
    const second = processQueue();
    resolveNetwork({ isConnected: true, isInternetReachable: true });
    await Promise.all([first, second]);

    expect(mocks.getNetworkStateAsync).toHaveBeenCalledOnce();
  });
});
