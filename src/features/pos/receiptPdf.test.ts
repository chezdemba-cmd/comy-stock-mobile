import { describe, expect, it, vi } from 'vitest';
import type { SaleReceipt } from './api';
import { buildReceiptHtml } from './receiptPdf';

vi.mock('expo-print', () => ({ printToFileAsync: vi.fn(), printAsync: vi.fn() }));
vi.mock('expo-sharing', () => ({ isAvailableAsync: vi.fn(), shareAsync: vi.fn() }));
vi.mock('@/utils/money', () => ({
  formatMoney: (amount: number, currency: string) => `${amount.toLocaleString('fr-FR')} ${currency}`,
  formatNumber: (value: number) => value.toLocaleString('fr-FR'),
}));

const receipt = {
  sale: {
    id: 'sale-1',
    company_id: 'company-1',
    shop_id: 'shop-1',
    customer_id: null,
    cash_session_id: 'session-1',
    sale_number: 1,
    subtotal: 1000,
    discount_amount: 0,
    total: 1000,
    status: 'completed',
    created_by: 'user-1',
    created_at: '2026-09-02T10:00:00.000Z',
  },
  items: [{
    id: 'item-1', sale_id: 'sale-1', product_id: 'product-1', product_name: '<Riz & mil>',
    quantity: 1, unit_price: 1000, unit_cost: 800, line_total: 1000,
  }],
  payments: [{ id: 'payment-1', sale_id: 'sale-1', method: 'cash', amount: 1000, created_at: '2026-09-02T10:00:00.000Z' }],
  customer: null,
  sellerName: '<script>alert(1)</script>',
} as SaleReceipt;

describe('buildReceiptHtml', () => {
  it('échappe les textes et le code de devise injectés dans le reçu', () => {
    const html = buildReceiptHtml(receipt, '<Boutique Bamako>', '<script>');

    expect(html).toContain('&lt;Boutique Bamako&gt;');
    expect(html).toContain('&lt;Riz &amp; mil&gt;');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('1 000 &lt;script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
