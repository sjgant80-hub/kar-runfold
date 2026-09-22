// kernel.mjs — pure functions, no I/O. Bad input returns {ok:false, why} instead of throwing.
//
// RunFold: merges two adjacent run-length-encoded segment lists into one,
// collapsing boundary runs of equal value, while preserving total length
// and order.
//
// A run is {value, length} with length a positive integer.

function isPlainRun(r) {
  return (
    r !== null &&
    typeof r === 'object' &&
    !Array.isArray(r) &&
    Object.prototype.hasOwnProperty.call(r, 'value') &&
    Object.prototype.hasOwnProperty.call(r, 'length')
  );
}

export function validateRunList(runs) {
  if (!Array.isArray(runs)) {
    return { ok: false, why: 'not-an-array' };
  }
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    if (!isPlainRun(r)) {
      return { ok: false, why: `element-${i}-not-a-run` };
    }
    if (!Number.isInteger(r.length) || r.length <= 0) {
      return { ok: false, why: `element-${i}-bad-length` };
    }
    if (r.value === undefined) {
      return { ok: false, why: `element-${i}-bad-value` };
    }
  }
  return { ok: true, runs };
}

export function totalLength(runs) {
  const v = validateRunList(runs);
  if (!v.ok) return v;
  const total = runs.reduce((sum, r) => sum + r.length, 0);
  return { ok: true, total };
}

// Collapse adjacent runs sharing the same value into single runs,
// preserving order and total length.
export function canonicalize(runs) {
  const v = validateRunList(runs);
  if (!v.ok) return v;
  const out = [];
  for (const r of runs) {
    const last = out[out.length - 1];
    if (last && last.value === r.value) {
      last.length += r.length;
    } else {
      out.push({ value: r.value, length: r.length });
    }
  }
  return { ok: true, runs: out };
}

// The kernel: merge two adjacent run-length-encoded segment lists into one,
// collapsing the boundary runs when they share a value.
export function mergeAdjacent(runsA, runsB) {
  const va = validateRunList(runsA);
  if (!va.ok) return { ok: false, why: `left-${va.why}` };
  const vb = validateRunList(runsB);
  if (!vb.ok) return { ok: false, why: `right-${vb.why}` };

  if (runsA.length === 0) return canonicalize(runsB);
  if (runsB.length === 0) return canonicalize(runsA);

  const left = runsA.map((r) => ({ value: r.value, length: r.length }));
  const right = runsB.map((r) => ({ value: r.value, length: r.length }));

  const lastLeft = left[left.length - 1];
  const firstRight = right[0];

  let merged;
  if (lastLeft.value === firstRight.value) {
    const boundary = { value: lastLeft.value, length: lastLeft.length + firstRight.length };
    merged = [...left.slice(0, -1), boundary, ...right.slice(1)];
  } else {
    merged = [...left, ...right];
  }

  return canonicalize(merged);
}
