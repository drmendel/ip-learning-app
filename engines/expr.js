// Safe evaluator for the numbers students type into answer cells.
//   12   -3.5   0,25 (decimal comma)   3/4   2^3   sqrt(2)/2   √2   cos(45)   pi/4   π   1e-3
// Trigonometric functions work in DEGREES (cos(60) = 0.5); asin/acos/atan return degrees.
// No identifiers other than the whitelisted functions/constants are accepted.

const FUN = {
  sqrt: Math.sqrt, abs: Math.abs, ln: Math.log, log: Math.log10, exp: Math.exp,
  sin: (d) => Math.sin((d * Math.PI) / 180), cos: (d) => Math.cos((d * Math.PI) / 180), tan: (d) => Math.tan((d * Math.PI) / 180),
  asin: (v) => (Math.asin(v) * 180) / Math.PI, acos: (v) => (Math.acos(v) * 180) / Math.PI, atan: (v) => (Math.atan(v) * 180) / Math.PI,
  round: Math.round, floor: Math.floor, ceil: Math.ceil,
};
const CONST = { pi: Math.PI, 'π': Math.PI, e: Math.E };

function tokenize(src) {
  const s = String(src).trim()
    .replace(/(\d),(\d)/g, '$1.$2')          // Hungarian decimal comma
    .replace(/[−–]/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/')
    .replace(/√\s*\(/g, 'sqrt(').replace(/√\s*([\d.]+)/g, 'sqrt($1)').replace(/²/g, '^2').replace(/³/g, '^3');
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    const num = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i));
    if (num) { out.push({ t: 'n', v: Number(num[0]) }); i += num[0].length; continue; }
    const id = /^[a-zπ]+/i.exec(s.slice(i));
    if (id) { out.push({ t: 'id', v: id[0].toLowerCase() }); i += id[0].length; continue; }
    if ('+-*/^()'.includes(c)) { out.push({ t: c }); i++; continue; }
    throw new Error(`unexpected character "${c}"`);
  }
  return out;
}

// Grammar:  expr = term (('+'|'-') term)* ; term = unary (('*'|'/') unary | implicit-multiplication)* ;
//           unary = ('-'|'+') unary | power ; power = atom ('^' unary)? ; atom = number | const | fn '(' expr ')' | '(' expr ')'
export function evaluate(src) {
  const tk = tokenize(src);
  if (!tk.length) throw new Error('empty');
  let p = 0;
  const peek = () => tk[p];
  const eat = (t) => { if (tk[p]?.t !== t) throw new Error(`expected "${t}"`); p++; };
  function expr() {
    let v = term();
    while (peek() && (peek().t === '+' || peek().t === '-')) { const op = tk[p++].t; const r = term(); v = op === '+' ? v + r : v - r; }
    return v;
  }
  function term() {
    let v = unary();
    for (;;) {
      const n = peek();
      if (n && (n.t === '*' || n.t === '/')) { p++; const r = unary(); v = n.t === '*' ? v * r : v / r; continue; }
      if (n && (n.t === 'n' || n.t === 'id' || n.t === '(')) { v *= unary(); continue; } // 2pi, 2sqrt(2), 3(4)
      return v;
    }
  }
  function unary() {
    const n = peek();
    if (n && n.t === '-') { p++; return -unary(); }
    if (n && n.t === '+') { p++; return unary(); }
    return power();
  }
  function power() { const b = atom(); if (peek()?.t === '^') { p++; return b ** unary(); } return b; }
  function atom() {
    const n = tk[p++];
    if (!n) throw new Error('unexpected end');
    if (n.t === 'n') return n.v;
    if (n.t === '(') { const v = expr(); eat(')'); return v; }
    if (n.t === 'id') {
      if (n.v in CONST) return CONST[n.v];
      if (n.v in FUN) { eat('('); const v = expr(); eat(')'); return FUN[n.v](v); }
      throw new Error(`unknown name "${n.v}"`);
    }
    throw new Error(`unexpected "${n.t}"`);
  }
  const v = expr();
  if (p !== tk.length) throw new Error('unexpected input after the expression');
  if (!Number.isFinite(v)) throw new Error('not a finite number');
  return v;
}

/** Evaluate or return null (empty / invalid input). */
export function tryEval(src) {
  if (src === null || src === undefined || String(src).trim() === '') return null;
  try { return evaluate(src); } catch { return undefined; }
}
