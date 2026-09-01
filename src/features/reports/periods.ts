export type PeriodPreset = 'today' | 'yesterday' | 'week' | 'month';

export interface DateRange {
  from: string;
  to: string;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPeriodRange(preset: PeriodPreset): DateRange {
  const now = new Date();

  if (preset === 'today') {
    const iso = toIsoDate(now);
    return { from: iso, to: iso };
  }

  if (preset === 'yesterday') {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const iso = toIsoDate(yesterday);
    return { from: iso, to: iso };
  }

  if (preset === 'week') {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { from: toIsoDate(start), to: toIsoDate(now) };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: toIsoDate(start), to: toIsoDate(now) };
}

export const periodPresetOptions: { value: PeriodPreset; label: string }[] = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'yesterday', label: 'Hier' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
];
