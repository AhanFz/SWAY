import type { Response, Totals } from './types';
export function total(t: Totals) { return t.good + t.skip + t.bad; }
export function resultFor(response: Response): Totals {
  return { ...response.story.totals, [response.value]: response.story.totals[response.value] + 1 };
}
export function percentages(t: Totals) {
  const n = total(t);
  if (!n) return { good: 0, skip: 0, bad: 0 };
  // Largest remainder rounding makes labels sum to exactly 100.
  const keys = ['good', 'skip', 'bad'] as const;
  const raw = keys.map(key => ({ key, value: 100 * t[key] / n }));
  const rounded = Object.fromEntries(raw.map(r => [r.key, Math.floor(r.value)])) as Totals;
  let remaining = 100 - total(rounded);
  for (const r of [...raw].sort((a, b) => (b.value % 1) - (a.value % 1))) {
    if (remaining-- > 0) rounded[r.key]++;
  }
  return rounded;
}
export function sidedWithMajority(r: Response) {
  if (r.value === 'skip') return false;
  const t = resultFor(r);
  return t[r.value] >= t[r.value === 'good' ? 'bad' : 'good'];
}
