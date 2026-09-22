import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as K from './kernel.mjs';

test('merges two non-matching-boundary run lists with no collapse', () => {
  const a = [{ value: 'a', length: 2 }];
  const b = [{ value: 'b', length: 3 }];
  const result = K.mergeAdjacent(a, b);
  assert.equal(result.ok, true);
  assert.deepEqual(result.runs, [
    { value: 'a', length: 2 },
    { value: 'b', length: 3 },
  ]);
  assert.equal(result.runs.length, 2);
});

test('collapses the boundary runs when values match, preserving total length', () => {
  const a = [{ value: 'a', length: 2 }, { value: 'x', length: 1 }];
  const b = [{ value: 'x', length: 4 }, { value: 'b', length: 2 }];
  const result = K.mergeAdjacent(a, b);
  assert.equal(result.ok, true);
  assert.equal(result.runs.length, 3);
  assert.deepEqual(result.runs, [
    { value: 'a', length: 2 },
    { value: 'x', length: 5 },
    { value: 'b', length: 2 },
  ]);
  assert.equal(K.totalLength(result.runs).total, 9);
});

test('length-conservation law: merged total equals sum of input totals', () => {
  const a = [{ value: 1, length: 3 }, { value: 2, length: 4 }];
  const b = [{ value: 2, length: 5 }, { value: 3, length: 1 }];
  const result = K.mergeAdjacent(a, b);
  assert.equal(result.ok, true);
  const total = K.totalLength(result.runs);
  assert.equal(total.ok, true);
  assert.equal(total.total, 13);
  assert.equal(total.total, K.totalLength(a).total + K.totalLength(b).total);
});

test('idempotency law: merging with an empty list is a no-op up to canonicalization', () => {
  const a = [
    { value: 'p', length: 2 },
    { value: 'p', length: 3 },
    { value: 'q', length: 1 },
  ];
  const merged = K.mergeAdjacent(a, []);
  const canon = K.canonicalize(a);
  assert.equal(merged.ok, true);
  assert.equal(canon.ok, true);
  assert.deepEqual(merged.runs, canon.runs);
  assert.deepEqual(merged.runs, [
    { value: 'p', length: 5 },
    { value: 'q', length: 1 },
  ]);
});

test('bad input returns {ok:false} instead of throwing', () => {
  assert.equal(K.mergeAdjacent(null, []).ok, false);
  assert.equal(K.mergeAdjacent([{ value: 'a', length: 0 }], []).ok, false);
  assert.equal(K.mergeAdjacent('not-an-array', [{ value: 'a', length: 1 }]).ok, false);
});

test('validateRunList rejects a run with an undefined value', () => {
  const result = K.validateRunList([{ value: undefined, length: 2 }]);
  assert.equal(result.ok, false);
  assert.equal(result.why, 'element-0-bad-value');
});
