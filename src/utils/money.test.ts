import { describe, expect, it } from 'vitest';

import { formatMoney } from './money';

describe('formatMoney', () => {
  it('formate le franc CFA utilisé au Mali sans décimales', () => {
    expect(formatMoney(1234.6, 'XOF')).toBe('1 235 F CFA');
  });

  it('conserve un code de devise inconnu comme suffixe', () => {
    expect(formatMoney(42, 'MNT')).toBe('42 MNT');
  });
});
