import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSwipe, exitDuration, dragProgress } from '../src/domain/gestures.ts';
test('slow drags commit only after the specified thresholds', () => {
  assert.equal(resolveSwipe(100, 0, 0, 0, 400, 500), null);
  assert.equal(resolveSwipe(113, 0, 0, 0, 400, 500), 'good');
  assert.equal(resolveSwipe(-113, 0, 0, 0, 400, 500), 'bad');
  assert.equal(resolveSwipe(0, 89, 0, 0, 400, 500), null);
  assert.equal(resolveSwipe(0, 91, 0, 0, 400, 500), 'skip');
});
test('flicks require both minimum distance and matching velocity direction', () => {
  assert.equal(resolveSwipe(30, 0, 451, 0, 400, 500), 'good');
  assert.equal(resolveSwipe(-30, 0, -451, 0, 400, 500), 'bad');
  assert.equal(resolveSwipe(29, 0, 1000, 0, 400, 500), null);
  assert.equal(resolveSwipe(30, 0, -1000, 0, 400, 500), null);
  assert.equal(resolveSwipe(0, 30, 0, 451, 400, 500), 'skip');
});
test('upward and mostly upward drags never vote', () => {
  assert.equal(resolveSwipe(0, -300, 0, -1200, 400, 500), null);
  assert.equal(resolveSwipe(120, -300, 500, -1200, 400, 500), null);
});
test('animation timing and underneath-card progress stay bounded', () => {
  assert.equal(exitDuration(0), 340); assert.equal(exitDuration(5000), 180);
  assert.equal(exitDuration(-5000), 180);
  assert.equal(dragProgress(0, -200, 400, 500), 0);
  assert.equal(dragProgress(1000, 0, 400, 500), 1);
});
