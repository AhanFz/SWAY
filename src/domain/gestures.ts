import type { ResponseValue } from './types';
// RNGH reports velocity in points/second; the brief uses px/ms (0.45 = 450).
export function resolveSwipe(x: number, y: number, vx: number, vy: number, width: number, height: number): ResponseValue | null {
  'worklet';
  if (Math.abs(x) >= Math.abs(y)) {
    if (Math.abs(x) > width * 0.28 || (Math.abs(x) >= 30 && Math.abs(vx) > 450 && Math.sign(vx) === Math.sign(x))) return x > 0 ? 'good' : 'bad';
  } else if (y > 0 && (y > height * 0.18 || (y >= 30 && vy > 450))) return 'skip';
  return null;
}
export function exitDuration(velocity: number) {
  'worklet';
  return Math.max(180, Math.min(340, 340 - Math.abs(velocity) * 0.12));
}
export function dragProgress(x: number, y: number, width: number, height: number) {
  'worklet';
  return Math.min(1, Math.max(Math.abs(x) / (width * 0.4), y / (height * 0.25), 0));
}
