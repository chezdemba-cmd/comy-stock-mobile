const CURRENCY_SUFFIX: Record<string, string> = {
  XOF: 'F CFA',
  GNF: 'F GNF',
  CDF: 'F CDF',
  NGN: '₦',
  GHS: 'GHS',
  EUR: '€',
  USD: '$',
};

function groupThousands(value: number): string {
  const rounded = Math.round(value);
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(rounded);
}

export function formatMoney(amount: number, currencyCode: string): string {
  const suffix = CURRENCY_SUFFIX[currencyCode] ?? currencyCode;
  return `${groupThousands(amount)} ${suffix}`;
}
