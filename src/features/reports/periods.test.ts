import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getPeriodRange } from './periods';

describe('getPeriodRange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calcule aujourd’hui et hier', () => {
    expect(getPeriodRange('today')).toEqual({ from: '2026-09-15', to: '2026-09-15' });
    expect(getPeriodRange('yesterday')).toEqual({ from: '2026-09-14', to: '2026-09-14' });
  });

  it('calcule les sept derniers jours, jour courant inclus', () => {
    expect(getPeriodRange('week')).toEqual({ from: '2026-09-09', to: '2026-09-15' });
  });

  it('calcule le mois courant', () => {
    expect(getPeriodRange('month')).toEqual({ from: '2026-09-01', to: '2026-09-15' });
  });
});
