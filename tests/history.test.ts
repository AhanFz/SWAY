import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateGuess, roomScore, personalInsight, agrees, type HistoryEntry } from '../src/domain/history.ts';
const entry = (n: number, patch: Partial<HistoryEntry> = {}): HistoryEntry => ({ id: String(n), story: { id: String(n), headline: 'Sample', summary: 'Text', sources: [], publishedAt: '', topic: 'Tech', totals: { good: 60, bad: 40, skip: 0 } }, value: 'good', respondedAt: new Date(2026, 9, 1, 0, n).toISOString(), localDay: '2026-10-01', sessionId: 'session', status: 'confirmed', totals: { good: 60, bad: 40, skip: 0 }, guess: 'good', guessCorrect: true, revealed: true, ...patch });
test('a near-tie counts either guess, ignoring skips for the majority', () => {
  assert.equal(evaluateGuess({ good: 51, bad: 49, skip: 1000 }, 'bad')?.message, 'Split decision.');
  assert.equal(evaluateGuess({ good: 51, bad: 49, skip: 1000 }, 'good')?.correct, true);
  assert.equal(evaluateGuess({ good: 60, bad: 40, skip: 1000 }, 'bad')?.correct, false);
});
test('suppressed totals and all-skipped totals cannot score a guess', () => {
  assert.equal(evaluateGuess({ good: 10, bad: 9, skip: 0 }, 'good'), null);
  assert.equal(evaluateGuess({ good: 0, bad: 0, skip: 100 }, 'good'), null);
});
test('score includes only last 50 scored confirmed guesses', () => {
  const history = Array.from({ length: 65 }, (_, i) => entry(i, { guessCorrect: i >= 15 }));
  history.push(entry(66, { guessCorrect: false, status: 'pending' }));
  assert.deepEqual(roomScore(history), { count: 50, correct: 50, percent: 100 });
});
test('insights need 10 votes or a five-event streak, and return only one', () => {
  assert.equal(personalInsight(Array.from({ length: 4 }, (_, i) => entry(i))), null);
  assert.match(personalInsight(Array.from({ length: 5 }, (_, i) => entry(i)))!, /5 times in a row/);
  const history = Array.from({ length: 10 }, (_, i) => entry(i, { guessCorrect: null, guess: null }));
  assert.equal(personalInsight(history), 'You sided with the majority on 10 of your last 10 votes.');
});
test('minority day streaks require consecutive days', () => {
  const history = Array.from({ length: 5 }, (_, i) => entry(i, { localDay: `2026-10-0${i + 1}`, value: 'bad', guessCorrect: null }));
  assert.match(personalInsight(history)!, /5 days in a row/);
  history[2].localDay = '2026-09-20';
  assert.equal(personalInsight(history), null);
});
test('pending, skipped and small samples are excluded from majority insights', () => {
  assert.equal(agrees(entry(1, { status: 'pending' })), null);
  assert.equal(agrees(entry(2, { value: 'skip' })), null);
  assert.equal(agrees(entry(3, { totals: { good: 1, bad: 0, skip: 0 } })), null);
});
