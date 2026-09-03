import { describe, expect, it } from 'vitest';

import { formatMoney, formatNumber } from './money';

describe('formatNumber', () => {
  it('sépare les milliers selon le format français', () => {
    expect(formatNumber(1000)).toBe('1\u202f000');
    expect(formatNumber(10000)).toBe('10\u202f000');
  });
});

describe('formatMoney', () => {
  it('formate le franc CFA utilisé au Mali sans décimales', () => {
    expect(formatMoney(1234.6, 'XOF')).toBe('1 235 F CFA');
  });

  it('conserve un code de devise inconnu comme suffixe', () => {
    expect(formatMoney(42, 'MNT')).toBe('42 MNT');
  });
});
