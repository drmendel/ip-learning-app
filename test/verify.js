// Self-test:  npm test   (or: deno run -A test/verify.js)
//  1. every calc reference has the right shape and grades itself as correct,
//  2. every code/steps reference solution passes, starters fail,
//  3. typical wrong answers fail (cases below + content `wrong` lists),
//  4. every exercise, label and lesson is translated.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { grade, referenceOf } from '../engines/grade.js';
import { MESSAGES } from '../engines/messages.js';
import { evaluate } from '../engines/expr.js';
import { modules, exerciseById, overlays, LANGUAGES, contentFor } from '../content/index.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0, bad = 0;
const fail = (m) => { bad++; console.log('  ✗ ' + m); };
const only = process.argv[2]; // optional module id filter

const toStr = (v) => (Array.isArray(v) ? v.map(toStr) : typeof v === 'number' ? String(Math.round(v * 1e6) / 1e6) : String(v));
const isMatrix = (v) => Array.isArray(v) && Array.isArray(v[0]);

console.log('Reference solutions:');
for (const m of modules) {
  if (only && m.id !== only) continue;
  if (!m.title || !m.lab) fail(`${m.id}: module title/lab missing`);
  if (m.lesson && !fs.existsSync(path.join(ROOT, 'content', 'lessons', m.lesson))) fail(`${m.id}: lesson ${m.lesson} missing`);
  for (const ex of m.exercises) {
    const tag = `${m.id}/${ex.id}`;
    try {
      if (!ex.title || !ex.prompt) fail(`${tag}: title/prompt missing`);
      if (ex.type === 'quiz') { if (!Array.isArray(ex.options) || ex.answer === undefined || !ex.options[ex.answer]) fail(`${tag}: malformed quiz`); else ok++; continue; }
      if (ex.type === 'card') { if (!ex.answerText) fail(`${tag}: card without answer`); else ok++; continue; }
      if (ex.type === 'calc') {
        const ref = referenceOf(ex);
        const answers = {};
        for (const f of ex.fields || []) {
          const v = ref[f.key];
          if (v === undefined) { fail(`${tag}: solve() has no value for "${f.key}"`); continue; }
          if (f.shape) {
            if (f.check) { answers[f.key] = toStr(v); continue; }
            if (!isMatrix(v) || v.length !== f.shape[0] || v[0].length !== f.shape[1]) { fail(`${tag}: "${f.key}" should be ${f.shape.join('×')}, solve() gives ${isMatrix(v) ? v.length + '×' + v[0].length : typeof v}`); continue; }
            if (v.flat().some((x) => typeof x !== 'number' || !Number.isFinite(x))) fail(`${tag}: "${f.key}" contains non-finite values`);
          } else if (f.kind === 'str') { if (typeof v !== 'string') fail(`${tag}: "${f.key}" should be a string`); }
          else if (typeof v !== 'number' || !Number.isFinite(v)) fail(`${tag}: "${f.key}" should be a finite number, got ${JSON.stringify(v)}`);
          if (f.int && (isMatrix(v) ? v.flat() : [v]).some((x) => !Number.isInteger(x))) fail(`${tag}: "${f.key}" is marked int but has non-integers`);
          answers[f.key] = toStr(v);
        }
        const r = grade(ex, { answers }, 'en');
        if (r.pass) ok++; else fail(`${tag}: reference does not pass: ${r.message} ${r.detail}`);
        const empty = grade(ex, { answers: {} }, 'en');
        if (empty.pass) fail(`${tag}: empty answer passes`);
        for (const w of ex.wrong || []) { const rw = grade(ex, { answers: { ...answers, ...w } }, 'en'); if (rw.pass) fail(`${tag}: wrong answer passes: ${JSON.stringify(w)}`); else ok++; }
        continue;
      }
      if (ex.type === 'code' || ex.type === 'steps') {
        if (!ex.solution) { fail(`${tag}: no solution`); continue; }
        const r = grade(ex, { code: ex.solution }, 'en');
        if (r.pass) ok++; else fail(`${tag}: reference does not pass: ${r.message} ${r.detail || ''}`);
        if (ex.starter && ex.starter.trim() !== ex.solution.trim()) { const s = grade(ex, { code: ex.starter }, 'en'); if (s.pass) fail(`${tag}: the starter code already passes`); else ok++; }
        for (const w of ex.wrong || []) { const rw = grade(ex, { code: w }, 'en'); if (rw.pass) fail(`${tag}: wrong answer passes:\n${w}`); else ok++; }
        continue;
      }
      fail(`${tag}: unknown type ${ex.type}`);
    } catch (e) { fail(`${tag}: threw ${e.stack || e.message}`); }
  }
}

console.log('\nExpression parser:');
for (const [src, want] of [['3/4', 0.75], ['0,25', 0.25], ['sqrt(2)/2', Math.SQRT1_2], ['cos(60)', 0.5], ['2^3', 8], ['-2^2', -4], ['2pi', 2 * Math.PI], ['√2', Math.SQRT2], ['atan(1)', 45], ['1e-3', 0.001], ['(1+2)*3', 9]]) {
  try { const v = evaluate(src); if (Math.abs(v - want) < 1e-9) ok++; else fail(`expr ${src} = ${v}, want ${want}`); } catch (e) { fail(`expr ${src} threw ${e.message}`); }
}
for (const src of ['alert(1)', '2+', 'x', 'process.exit()', '']) { try { evaluate(src); fail(`expr "${src}" should be rejected`); } catch { ok++; } }

// ---------------------------------------------------------------- translations
console.log('\nTranslations:');
for (const lang of LANGUAGES.filter((l) => l !== 'en')) {
  for (const k of Object.keys(MESSAGES.en)) if (!MESSAGES[lang]?.[k]) fail(`${lang}: grader message "${k}" missing`);
  const ov = overlays[lang] || {};
  for (const id of Object.keys(ov)) if (!modules.find((m) => m.id === id)) fail(`${lang}: overlay for unknown module ${id}`);
  for (const m of modules) {
    if (only && m.id !== only) continue;
    const mo = ov[m.id];
    if (!mo) { fail(`${lang}: no overlay for module ${m.id}`); continue; }
    if (!mo.title || !mo.lab) fail(`${lang}/${m.id}: module title/lab missing`);
    if (m.lesson && !fs.existsSync(path.join(ROOT, 'content', 'lessons', lang, m.lesson))) fail(`${lang}: lesson ${m.lesson} missing`);
    for (const id of Object.keys(mo.exercises || {})) if (!exerciseById.has(id)) fail(`${lang}/${m.id}: unknown exercise ${id}`);
    for (const ex of m.exercises) {
      const o = (mo.exercises || {})[ex.id];
      if (!o) { fail(`${lang}: ${ex.id} not translated`); continue; }
      const probs = [];
      if (!o.title) probs.push('title');
      if (!o.prompt) probs.push('prompt');
      for (const k of ['hints', 'options']) if (ex[k] && (!o[k] || o[k].length !== ex[k].length)) probs.push(`${k} (${o[k]?.length ?? 0}/${ex[k].length})`);
      for (const k of ['require', 'forbid']) if (ex[k] && (!o[k] || o[k].length !== ex[k].length)) probs.push(`${k} messages`);
      for (const k of ['explain', 'answerText']) if (ex[k] && !o[k]) probs.push(k);
      for (const f of ex.fields || []) if (f.label && !o.labels?.[f.key]) probs.push(`label ${f.key}`);
      if ((ex.grids || []).some((g) => g.title) && (!o.grids || o.grids.length !== ex.grids.length)) probs.push('grid titles');
      if (probs.length) fail(`${lang}: ${ex.id} missing ${probs.join(', ')}`); else ok++;
    }
  }
  const cs = path.join(ROOT, 'content', 'lessons', lang, 'cheatsheet.md');
  if (!fs.existsSync(cs)) fail(`${lang}: cheatsheet.md missing`);
  // Hungarian grading really returns Hungarian text
  const huStart = contentFor('hu').byId.get('start-1');
  const r = grade(huStart, { answers: { a: '1', b: '' } }, 'hu');
  if (/helyes/.test(r.message)) ok++; else fail(`hu feedback not Hungarian: ${r.message}`);
}
if (!fs.existsSync(path.join(ROOT, 'content', 'lessons', 'cheatsheet.md'))) fail('cheatsheet.md missing');

const total = modules.reduce((a, m) => a + m.exercises.length, 0);
console.log(`\n${ok} ok, ${bad} failed  (${modules.length} modules, ${total} exercises)`);
process.exit(bad ? 1 : 0);
