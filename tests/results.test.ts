import { test } from 'node:test';
import assert from 'node:assert/strict';
import { percentages, resultFor, total, sidedWithMajority } from '../src/domain/results.ts';
test('three-part result includes skips and rounds to 100', () => {
  assert.deepEqual(percentages({ good: 50, skip: 20, bad: 30 }), { good: 50, skip: 20, bad: 30 });
  assert.equal(total(percentages({ good: 1, skip: 1, bad: 1 })), 100);
  assert.deepEqual(percentages({ good: 0, skip: 0, bad: 0 }), { good: 0, skip: 0, bad: 0 });
});
test('recorded response changes only its tally; skipped responses cannot side with majority', () => {
  const story = { id: 'test', topic: 'Tech', publishedAt: '', headline: '', summary: '', sources: [], totals: { good: 10, bad: 5, skip: 100 } };
  assert.deepEqual(resultFor({ story, value: 'bad' }), { good: 10, bad: 6, skip: 100 });
  assert.equal(story.totals.bad, 5);
  assert.equal(sidedWithMajority({ story, value: 'good' }), true);
  assert.equal(sidedWithMajority({ story, value: 'skip' }), false);
});
