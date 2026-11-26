// Transformation-sequence engine for the 3-D modelling tasks.
//
// A program is one elementary transformation per line, applied in the BASE frame (active view):
// the composite matrix is T = Mn · … · M2 · M1 (left multiplication).
//
//   Tran(x, y, z)            translation              (aliases: T, Trans, Translate)
//   Rx(a)  Ry(a)  Rz(a)      rotation by a degrees    (aliases: RotX(a), Rot(x, a), …)
//   Ry(a) about (px, py, pz) rotation about the axis parallel to y through the point (px, py, pz)
//   Scale(sx, sy, sz)        scaling (rejected when the task forbids resizing)
//   # comment / // comment
// Arguments may be expressions: sqrt(2), -sqrt(2)/2, 90/2 …
import { Tran, RotX, RotY, RotZ, Scale, matmul, identity, cleanZero } from './imglib.js';
import { evaluate } from './expr.js';

/** Split at top-level commas/semicolons (commas inside sqrt(…) etc. are kept). */
function splitArgs(s) {
  const out = []; let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if ((ch === ',' || ch === ';') && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
/** Read "name(args)" with balanced parentheses from the start of s. Returns { name, args, rest } or null. */
function call(s) {
  const m = /^([a-z]+)\s*\(/i.exec(s);
  if (!m) return null;
  let depth = 0, i = m[0].length - 1;
  for (; i < s.length; i++) { if (s[i] === '(') depth++; else if (s[i] === ')' && --depth === 0) break; }
  if (depth !== 0) throw new Error('missing ")"');
  return { name: m[1].toLowerCase(), args: s.slice(m[0].length, i), rest: s.slice(i + 1).trim() };
}

/** Parse one line into { kind, args, about, label } or throw. */
export function parseLine(raw) {
  const line = raw.replace(/(#|\/\/).*$/, '').trim();
  if (!line) return null;
  const c = call(line);
  if (!c) throw new Error('unknown command – use Tran(x,y,z), Rx(a), Ry(a), Rz(a), optionally “about (px,py,pz)”');
  let about = null;
  if (c.rest) {
    const m = /^about\s*(\(.*\))$/i.exec(c.rest);
    if (!m) throw new Error(`unexpected text after the command: "${c.rest}"`);
    about = splitArgs(m[1].slice(1, -1)).map(evaluate);
    if (about.length !== 3) throw new Error('about (px, py, pz) needs 3 numbers');
  }
  if (['tran', 'trans', 'translate', 't'].includes(c.name)) {
    if (about) throw new Error('"about" only works with rotations');
    const a = splitArgs(c.args).map(evaluate);
    if (a.length !== 3) throw new Error('Tran needs 3 numbers: Tran(x, y, z)');
    return { kind: 'tran', args: a, label: `Tran(${a.map(fmt).join(', ')})` };
  }
  let axis = null, angleSrc = null;
  const rm = /^(?:r|rot)([xyz])$/.exec(c.name);
  if (rm) { axis = rm[1]; angleSrc = c.args; }
  else if (c.name === 'rot') { const a = splitArgs(c.args); if (a.length !== 2 || !/^[xyz]$/i.test(a[0])) throw new Error('use Rot(x, angle), Rot(y, angle) or Rot(z, angle)'); axis = a[0].toLowerCase(); angleSrc = a[1]; }
  if (axis) {
    const angle = evaluate(angleSrc);
    return { kind: 'rot', axis, angle, about, label: `Rot(${axis}, ${fmt(angle)}°)${about ? ` about (${about.map(fmt).join(', ')})` : ''}` };
  }
  if (c.name === 'scale' || c.name === 's') {
    const a = splitArgs(c.args).map(evaluate);
    if (a.length !== 3) throw new Error('Scale needs 3 numbers: Scale(sx, sy, sz)');
    return { kind: 'scale', args: a, label: `Scale(${a.map(fmt).join(', ')})` };
  }
  throw new Error('unknown command – use Tran(x,y,z), Rx(a), Ry(a), Rz(a), optionally “about (px,py,pz)”');
}
const fmt = (v) => String(Math.round(v * 1e4) / 1e4);

const ROT = { x: RotX, y: RotY, z: RotZ };
/** Matrix of a parsed step; for rotations `frac` (0..1) gives the partially rotated state (for the sweep check). */
export function stepMatrix(st, frac = 1) {
  if (st.kind === 'tran') return Tran(...st.args.map((v) => v * frac));
  if (st.kind === 'scale') return Scale(...st.args.map((v) => 1 + (v - 1) * frac));
  const R = ROT[st.axis](st.angle * frac);
  if (!st.about) return R;
  const [px, py, pz] = st.about;
  return matmul(Tran(px, py, pz), matmul(R, Tran(-px, -py, -pz)));
}
export const apply = (M, P) => cleanZero(matmul(M, P));
/** 4×n descriptor → list of [x, y, z]. */
export const points = (P) => P[0].map((_, j) => [P[0][j], P[1][j], P[2][j]]);
export const descriptorOf = (pts) => [0, 1, 2].map((i) => pts.map((p) => p[i])).concat([pts.map(() => 1)]);

/** Same set of points (order ignored) within tol. */
export function samePointSet(a, b, tol = 1e-6) {
  if (a.length !== b.length) return false;
  const used = new Array(b.length).fill(false);
  return a.every((p) => {
    const j = b.findIndex((q, k) => !used[k] && Math.abs(p[0] - q[0]) <= tol && Math.abs(p[1] - q[1]) <= tol && Math.abs(p[2] - q[2]) <= tol);
    if (j < 0) return false; used[j] = true; return true;
  });
}

/**
 * Run a program on the object. Returns { steps: [{ label, M, T, P, minZ, sweepMinZ }], T, P, error, errorLine }.
 * minZ of every state and, for rotations, the lowest z reached WHILE rotating (sampled every 1°).
 */
export function runProgram(code, vertices, opts = {}) {
  const gate = opts.gate; // { x, maxZ, yMin, yMax }: while the object straddles the plane x = gate.x it must fit through the opening
  const P0 = descriptorOf(vertices);
  const steps = [];
  let T = identity(4);
  const lines = String(code || '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    let st;
    try { st = parseLine(lines[i]); } catch (e) { return { steps, T: cleanZero(T), P: apply(T, P0), error: e.message, errorLine: i + 1 }; }
    if (!st) continue;
    const before = T;
    const M = stepMatrix(st);
    T = matmul(M, T);
    const P = apply(T, P0);
    let sweepMinZ = Math.min(...P[2]);
    let gateHit = false;
    const n = st.kind === 'rot' ? Math.max(40, Math.ceil(Math.abs(st.angle))) : 40;
    const startP = matmul(before, P0);
    for (let k = 0; k <= n; k++) {
      const Pk = k === n ? P : matmul(stepMatrix(st, k / n), startP);
      sweepMinZ = Math.min(sweepMinZ, ...Pk[2]);
      if (gate && Math.min(...Pk[0]) < gate.x - 1e-9 && Math.max(...Pk[0]) > gate.x + 1e-9) {
        if (Math.max(...Pk[2]) > gate.maxZ + 1e-9 || Math.min(...Pk[1]) < gate.yMin - 1e-9 || Math.max(...Pk[1]) > gate.yMax + 1e-9) gateHit = true;
      }
    }
    steps.push({ line: i + 1, label: st.label, kind: st.kind, M: cleanZero(M), T: cleanZero(T), P, minZ: Math.min(...P[2]), sweepMinZ, gateHit });
  }
  return { steps, T: cleanZero(T), P: apply(T, P0) };
}
