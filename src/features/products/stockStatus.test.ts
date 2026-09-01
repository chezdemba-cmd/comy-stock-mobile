import { describe, expect, it } from 'vitest';

import { getStockStatus } from './stockStatus';

describe('getStockStatus', () => {
  it.each([
    { quantity: -1, minimum: 5, expected: 'outOfStock' },
    { quantity: 0, minimum: 5, expected: 'outOfStock' },
    { quantity: 1, minimum: 5, expected: 'low' },
    { quantity: 5, minimum: 5, expected: 'low' },
    { quantity: 6, minimum: 5, expected: 'available' },
  ] as const)('retourne $expected pour un stock de $quantity et un minimum de $minimum', ({ quantity, minimum, expected }) => {
    expect(getStockStatus(quantity, minimum)).toBe(expected);
  });
});
