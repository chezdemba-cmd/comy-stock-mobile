import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { SaleReceipt } from './api';
import { formatMoney } from '@/utils/money';

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Espèces',
  card: 'Carte',
  orange_money: 'Orange Money',
  wave: 'Wave',
  moov_money: 'Moov Money',
  credit: 'Crédit',
};

export function buildReceiptHtml(receipt: SaleReceipt, shopName: string, currency: string): string {
  const { sale, items, payments, customer, sellerName } = receipt;
  const date = new Date(sale.created_at).toLocaleString('fr-FR');

  const rows = items
    .map(
      (item) => `
        <tr>
          <td>${item.product_name}</td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:right">${formatMoney(item.unit_price, currency)}</td>
          <td style="text-align:right">${formatMoney(item.line_total, currency)}</td>
        </tr>`
    )
    .join('');

  const paymentRows = payments
    .map(
      (payment) =>
        `<div class="payment-row"><span>${PAYMENT_LABEL[payment.method] ?? payment.method}</span><span>${formatMoney(payment.amount, currency)}</span></div>`
    )
    .join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0b0b0b; padding: 24px; }
          h1 { font-size: 20px; margin-bottom: 0; }
          .muted { color: #666; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { padding: 6px 4px; font-size: 13px; border-bottom: 1px solid #eee; text-align: left; }
          .totals { margin-top: 12px; width: 100%; }
          .totals div { display: flex; justify-content: space-between; padding: 2px 0; font-size: 13px; }
          .total-line { font-weight: bold; font-size: 16px; border-top: 1px solid #333; margin-top: 6px; padding-top: 6px; }
          .payment-row { display: flex; justify-content: space-between; font-size: 13px; padding: 2px 0; }
        </style>
      </head>
      <body>
        <h1>${shopName}</h1>
        <div class="muted">Reçu #${sale.sale_number} · ${date}</div>
        ${sellerName ? `<div class="muted">Vendeur : ${sellerName}</div>` : ''}
        ${customer ? `<div class="muted">Client : ${customer.name}</div>` : ''}

        <table>
          <thead>
            <tr><th>Article</th><th style="text-align:center">Qté</th><th style="text-align:right">P.U.</th><th style="text-align:right">Total</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="totals">
          <div><span>Sous-total</span><span>${formatMoney(sale.subtotal, currency)}</span></div>
          ${sale.discount_amount > 0 ? `<div><span>Réduction</span><span>-${formatMoney(sale.discount_amount, currency)}</span></div>` : ''}
          <div class="total-line"><span>Total</span><span>${formatMoney(sale.total, currency)}</span></div>
        </div>

        <div style="margin-top:16px">${paymentRows}</div>

        <div class="muted" style="margin-top:24px">Merci de votre confiance — Comy_stock</div>
      </body>
    </html>
  `;
}

export async function shareReceiptPdf(html: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
  }
}

export async function printReceipt(html: string): Promise<void> {
  await Print.printAsync({ html });
}
