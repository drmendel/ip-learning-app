// Grading of every exercise type that is checked on the server.
//   calc  – typed numbers / matrices / short strings, compared with the reference values (per cell)
//   code  – a JavaScript function, run on test inputs and compared with the reference implementation
//   steps – a sequence of 3-D transformations, checked against the target position and the constraints
import { tryEval } from './expr.js';
import { callUserFunction } from './sandbox.js';
import { runProgram, points, samePointSet } from './transform.js';
import { msg } from './messages.js';
import { IMAGES } from './images.js';

// ---------------------------------------------------------------- reference values (memoised)
const refCache = new Map();
/** Reference answers of a calc exercise: ex.solve() → { key: number | string | matrix }. */
export function referenceOf(ex) {
  if (!refCache.has(ex.id)) refCache.set(ex.id, ex.solve ? ex.solve() : {});
  return refCache.get(ex.id);
}
const testCache = new Map();
/** Test argument lists of a code exercise. '@img:name' strings are replaced by the sample image. */
export function testsOf(ex) {
  if (!testCache.has(ex.id)) {
    const raw = typeof ex.tests === 'function' ? ex.tests() : ex.tests || [];
    const sub = (v) => (typeof v === 'string' && v.startsWith('@img:') ? IMAGES[v.slice(5)] : Array.isArray(v) ? v.map(sub) : v);
    testCache.set(ex.id, raw.map((args) => args.map(sub)));
  }
  return testCache.get(ex.id);
}
const expCache = new Map();
function expectedOf(ex) {
  if (!expCache.has(ex.id)) {
    const r = callUserFunction(ex.solution, ex.fn, testsOf(ex));
    if (r.error || r.results.some((x) => x.error)) throw new Error(`reference solution of ${ex.id} fails: ${r.error || r.results.find((x) => x.error).error}`);
    expCache.set(ex.id, r.results.map((x) => x.value));
  }
  return expCache.get(ex.id);
}

// ---------------------------------------------------------------- comparison helpers
const DEFAULT_TOL = { abs: 0.011, rel: 0.005 };
export function close(got, want, tol = DEFAULT_TOL) {
  if (typeof tol === 'number') return Math.abs(got - want) <= tol + 1e-9;
  return Math.abs(got - want) <= Math.max(tol.abs ?? 0, (tol.rel ?? 0) * Math.abs(want)) + 1e-9;
}
const isMatrix = (v) => Array.isArray(v) && Array.isArray(v[0]);
const asMatrix = (v) => (isMatrix(v) ? v : Array.isArray(v) ? [v] : [[v]]);
const normStr = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/,/g, '.');

/** Grade one field. Returns { ok, empty, cells?, bad? } where cells[r][c] ∈ true | false | null (empty). */
function gradeField(f, want, got, lang) {
  if (f.kind === 'str' || typeof want === 'string') {
    const g = String(got ?? '').trim();
    if (!g) return { ok: false, empty: true };
    const acc = [want, ...(f.accept || [])].map(normStr);
    return { ok: acc.includes(normStr(g)) };
  }
  if (f.check) { // custom checker gets the parsed numbers (matrix if the field has a shape)
    const [h, w] = f.shape || [1, 1];
    const G = asMatrix(got ?? '');
    const parsed = Array.from({ length: h }, (_, r) => Array.from({ length: w }, (_, c) => tryEval(G[r]?.[c])));
    const flatP = parsed.flat();
    if (flatP.every((v) => v === null)) return { ok: false, empty: true };
    const badAt = flatP.findIndex((v) => v === null || v === undefined);
    if (badAt >= 0) return { ok: false, bad: [Math.floor(badAt / w) + 1, (badAt % w) + 1] };
    const r = f.check(f.shape ? parsed : parsed[0][0], lang);
    return r === true ? { ok: true } : { ok: false, note: typeof r === 'string' ? r : null };
  }
  const W = asMatrix(want);
  const G = asMatrix(got ?? '');
  const tol = f.int ? 0 : (f.tol ?? DEFAULT_TOL);
  const parsed = W.map((row, r) => row.map((_, c) => tryEval(G[r]?.[c])));
  const flatP = parsed.flat();
  if (flatP.every((v) => v === null)) return { ok: false, empty: true };
  let bad = null;
  parsed.forEach((row, r) => row.forEach((v, c) => { if (v === undefined && !bad) bad = [r + 1, c + 1]; }));
  let cells;
  if (f.unordered === 'rows' || f.unordered === 'cols') {
    const tr = (m) => m[0].map((_, j) => m.map((r) => r[j]));
    const Wv = f.unordered === 'cols' ? tr(W) : W, Pv = f.unordered === 'cols' ? tr(parsed) : parsed;
    const used = new Array(Wv.length).fill(false);
    const rowOk = Pv.map((pr) => { const j = Wv.findIndex((wr, k) => !used[k] && wr.every((w, c) => typeof pr[c] === 'number' && close(pr[c], w, tol))); if (j >= 0) { used[j] = true; return true; } return false; });
    const cv = Pv.map((pr, r) => pr.map((v) => (v === null ? null : rowOk[r])));
    cells = f.unordered === 'cols' ? tr(cv) : cv;
  } else {
    cells = parsed.map((row, r) => row.map((v, c) => (v === null ? null : typeof v === 'number' ? close(v, W[r][c], tol) : false)));
  }
  const ok = cells.flat().every((v) => v === true);
  return { ok, cells, bad };
}

/** Grade a calc exercise. answers = { key: string | string[][] } */
export function gradeCalc(ex, answers, lang) {
  const ref = referenceOf(ex);
  const fields = ex.fields || [];
  let got = 0, max = 0, okCount = 0;
  const res = {};
  const lines = [];
  for (const f of fields) {
    const r = gradeField(f, ref[f.key], answers?.[f.key], lang);
    res[f.key] = r;
    const pts = f.pts ?? 1;
    max += pts;
    const label = f.label || f.key;
    if (r.ok) { got += pts; okCount++; lines.push(msg(lang, 'fieldOk', label)); continue; }
    if (r.empty) lines.push(msg(lang, 'fieldEmpty', label));
    else if (r.bad) lines.push(msg(lang, 'fieldBadNum', label, Array.isArray(r.bad) ? msg(lang, 'at', ...r.bad) : ''));
    else if (r.cells && r.cells.flat().length > 1) lines.push(msg(lang, 'fieldWrongCells', label, r.cells.flat().filter((v) => v !== true).length, r.cells.flat().length) + (f.unordered ? ` – ${msg(lang, 'unorderedNote')}` : ''));
    else if (r.note) lines.push(`• ${label}: ${r.note}`);
    else lines.push(msg(lang, typeof ref[f.key] === 'string' ? 'fieldWrongStr' : 'fieldWrong', label));
  }
  const pass = okCount === fields.length;
  return {
    pass, score: max ? got / max : 0,
    message: pass ? msg(lang, 'allCorrect') : msg(lang, 'partsCorrect', okCount, fields.length),
    detail: pass ? '' : lines.join('\n'),
    fields: res,
  };
}

/** Pretty values of the reference (for the "Solution" button). */
export function solutionValues(ex) {
  const ref = referenceOf(ex);
  const out = {};
  for (const f of ex.fields || []) {
    const v = ref[f.key];
    const r = (x) => (typeof x === 'number' ? Math.round(x * 10000) / 10000 : x);
    out[f.key] = Array.isArray(v) ? (isMatrix(v) ? v.map((row) => row.map(r)) : v.map(r)) : r(v);
  }
  return out;
}

// ---------------------------------------------------------------- code exercises
function describe(v) {
  if (isMatrix(v)) return `${v.length}×${v[0].length}`;
  if (Array.isArray(v)) return `[${v.length}]`;
  if (v === null || v === undefined) return String(v);
  if (typeof v === 'object') return '{' + Object.keys(v).join(', ') + '}';
  return typeof v === 'number' ? String(Math.round(v * 1e4) / 1e4) : JSON.stringify(v);
}
/** Deep comparison with tolerance; returns null if equal, otherwise a description of the first difference. */
export function firstDiff(got, want, tol, path = '', lang = 'en') {
  if (typeof want === 'number') {
    if (typeof got !== 'number') return msg(lang, 'codeType', describe(got), describe(want));
    return close(got, want, tol) ? null : msg(lang, 'codeCell', path || 'result', describe(got), describe(want));
  }
  if (Array.isArray(want)) {
    if (!Array.isArray(got)) return msg(lang, 'codeType', describe(got), describe(want));
    if (got.length !== want.length || (isMatrix(want) && (!isMatrix(got) || got[0].length !== want[0].length))) return msg(lang, 'codeShape', describe(got), describe(want));
    for (let i = 0; i < want.length; i++) { const d = firstDiff(got[i], want[i], tol, `${path}[${i}]`, lang); if (d) return d; }
    return null;
  }
  if (want && typeof want === 'object') {
    if (!got || typeof got !== 'object') return msg(lang, 'codeType', describe(got), describe(want));
    for (const k of Object.keys(want)) { const d = firstDiff(got[k], want[k], tol, `${path}.${k}`, lang); if (d) return d; }
    return null;
  }
  return got === want ? null : msg(lang, 'codeType', describe(got), describe(want));
}
function checkRules(ex, code, lang) {
  for (const [re, m] of ex.require || []) if (!new RegExp(re, 'i').test(code)) return m || msg(lang, 'required');
  for (const [re, m] of ex.forbid || []) if (new RegExp(re, 'i').test(code)) return m || msg(lang, 'forbidden');
  return null;
}
function codeOutput(ex, r, value) {
  return { kind: 'code', display: ex.display || 'auto', value, logs: r.logs || [], shows: r.shows || [], error: r.error || null };
}
export function gradeCode(ex, code, lang) {
  const rule = checkRules(ex, code, lang);
  const tests = testsOf(ex);
  const want = expectedOf(ex);
  const r = callUserFunction(code, ex.fn, tests);
  if (r.error) return { pass: false, message: r.missing ? msg(lang, 'codeMissing', ex.fn) : msg(lang, 'codeError', r.error), output: codeOutput(ex, r) };
  const tol = ex.tol ?? { abs: 1e-6, rel: 1e-6 };
  for (let i = 0; i < tests.length; i++) {
    const g = r.results[i];
    if (g.error) return { pass: false, message: msg(lang, 'codeTestError', i + 1, g.error), output: codeOutput(ex, r, r.results[0]?.value) };
    const d = firstDiff(g.value, want[i], tol, '', lang);
    if (d) return { pass: false, message: msg(lang, 'codeWrong', i + 1, tests.length), detail: d, output: codeOutput(ex, r, g.value), failedTest: i };
  }
  if (rule) return { pass: false, message: rule, output: codeOutput(ex, r, r.results[0]?.value) };
  return { pass: true, message: msg(lang, 'codeOk', tests.length), output: codeOutput(ex, r, r.results[0]?.value) };
}
export function runCode(ex, code) {
  const r = callUserFunction(code, ex.fn, testsOf(ex).slice(0, 1));
  return codeOutput(ex, r, r.results?.[0]?.value ?? undefined);
}
export const expectedCode = (ex) => ({ kind: 'code', display: ex.display || 'auto', value: expectedOf(ex)[0], logs: [], shows: [], error: null });

// ---------------------------------------------------------------- transformation sequences
function stepsOutput(ex, r) {
  return {
    kind: 'steps', steps: r.steps.map((s) => ({ line: s.line, label: s.label, T: s.T, P: s.P, minZ: s.minZ, sweepMinZ: s.sweepMinZ })),
    T: r.T, P: r.P, error: r.error || null, errorLine: r.errorLine || null,
    vertices: ex.vertices, edges: ex.edges, target: ex.target, extra: ex.extra || [],
  };
}
export function runSteps(ex, code) { return stepsOutput(ex, runProgram(code, ex.vertices, { gate: ex.constraints?.gate })); }
export function gradeSteps(ex, code, lang) {
  const r = runProgram(code, ex.vertices, { gate: ex.constraints?.gate });
  const output = stepsOutput(ex, r);
  if (r.error) return { pass: false, message: msg(lang, 'stepsParse', r.errorLine, r.error), output };
  if (!r.steps.length) return { pass: false, message: msg(lang, 'stepsEmpty'), output };
  const c = ex.constraints || {};
  if (c.rigid) { const s = r.steps.find((x) => x.kind === 'scale'); if (s) return { pass: false, message: msg(lang, 'stepsScale', s.line), output }; }
  if (c.minZ !== undefined) {
    const s = r.steps.find((x) => x.sweepMinZ < c.minZ - 1e-6);
    if (s) return { pass: false, message: msg(lang, 'stepsBelow', s.line, Math.round(s.sweepMinZ * 1000) / 1000), output };
  }
  if (c.gate) { const s = r.steps.find((x) => x.gateHit); if (s) return { pass: false, message: msg(lang, 'stepsGate', s.line), output }; }
  const got = points(r.P);
  const atTarget = c.ordered
    ? got.every((p, i) => p.every((v, k) => Math.abs(v - ex.target[i][k]) <= 1e-4))
    : samePointSet(got, ex.target, 1e-4);
  if (!atTarget) return { pass: false, message: msg(lang, c.ordered ? 'stepsNotTargetOrdered' : 'stepsNotTarget'), output };
  return { pass: true, message: msg(lang, c.minZ !== undefined ? 'stepsOk' : 'stepsOkFree', r.steps.length), output };
}

/** Field checker factory: a 4×4 rigid homogeneous matrix that maps `start` (points) onto `target` (as a set). */
export function rigidMapsCheck(start, target) {
  return (T, lang = 'en') => {
    if (!Array.isArray(T) || T.length !== 4) return false;
    const [a, b, c, d] = T[3];
    if (Math.abs(a) > 1e-3 || Math.abs(b) > 1e-3 || Math.abs(c) > 1e-3 || Math.abs(d - 1) > 1e-3) return msg(lang, 'rigidBottom');
    const R = T.slice(0, 3).map((r) => r.slice(0, 3));
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const dot = R[0][i] * R[0][j] + R[1][i] * R[1][j] + R[2][i] * R[2][j]; if (Math.abs(dot - (i === j ? 1 : 0)) > 0.02) return msg(lang, 'rigidNotOrtho'); }
    const det = R[0][0] * (R[1][1] * R[2][2] - R[1][2] * R[2][1]) - R[0][1] * (R[1][0] * R[2][2] - R[1][2] * R[2][0]) + R[0][2] * (R[1][0] * R[2][1] - R[1][1] * R[2][0]);
    if (det < 0) return msg(lang, 'rigidNotOrtho');
    const mapped = start.map(([x, y, z]) => [0, 1, 2].map((i) => T[i][0] * x + T[i][1] * y + T[i][2] * z + T[i][3]));
    return samePointSet(mapped, target, 0.02) ? true : msg(lang, 'rigidMaps');
  };
}

// ---------------------------------------------------------------- dispatch
export function grade(ex, body, lang) {
  if (ex.type === 'calc') return gradeCalc(ex, body.answers || {}, lang);
  if (ex.type === 'code') return gradeCode(ex, String(body.code || ''), lang);
  if (ex.type === 'steps') return gradeSteps(ex, String(body.code || ''), lang);
  throw new Error('not gradable on the server: ' + ex.type);
}
