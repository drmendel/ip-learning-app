// Runs visitor JavaScript in a fresh node:vm context with a time limit.
// NOTE: node:vm is NOT a security boundary – see README "Hosting for others".
import vm from 'node:vm';
import * as lib from './imglib.js';
import { IMAGES } from './images.js';

const TIMEOUT_MS = 1500;
const MAX_LOG = 200;
const MAX_SHOWS = 24;

const plain = (v) => {
  try { return JSON.parse(JSON.stringify(v, (k, x) => (typeof x === 'number' && !Number.isFinite(x) ? null : x))); }
  catch { return String(v); }
};
const fmt = (v) => (typeof v === 'string' ? v : (() => { try { return JSON.stringify(v, (k, x) => (typeof x === 'number' ? Math.round(x * 1e6) / 1e6 : x)); } catch { return String(v); } })());

// Small helpers available in EVERY sandbox (exercises + playground).
const BASIC = {
  zeros: lib.zeros, clone: lib.clone, shape: lib.shape, clamp: lib.clamp, round: lib.round, fromFn: lib.fromFn,
};

function makeContext(extra = {}) {
  const out = { logs: [], shows: [] };
  const ctx = {
    ...BASIC,
    ...extra,
    print: (...a) => { if (out.logs.length < MAX_LOG) out.logs.push(a.map(fmt).join(' ')); },
    show: (img, title = '', opts = {}) => { if (out.shows.length < MAX_SHOWS) out.shows.push({ title: String(title), data: plain(img), opts: plain(opts) }); },
  };
  ctx.console = { log: ctx.print };
  return { context: vm.createContext(ctx), out };
}

function errText(e) {
  if (!e) return 'error';
  if (e.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') return `Time limit exceeded (${TIMEOUT_MS} ms) – infinite loop?`;
  return String(e.message || e).split('\n')[0];
}

/**
 * Define `code` in a fresh context and call the function `fn` once per argument list.
 * Every call gets deep copies of the arguments. Returns { error } or { results: [{ value, error }], logs, shows }.
 */
export function callUserFunction(code, fn, argLists, { full = false } = {}) {
  const { context, out } = makeContext(full ? { lib, IMG: structuredClone(IMAGES) } : {});
  try {
    vm.runInContext(`${code}\n;globalThis.__fn = (typeof ${fn} === 'function') ? ${fn} : undefined;`, context, { timeout: TIMEOUT_MS, filename: 'your-code.js' });
  } catch (e) { return { error: errText(e), logs: out.logs, shows: out.shows }; }
  if (typeof context.__fn !== 'function') return { error: `function ${fn}(…) is not defined`, missing: true, logs: out.logs, shows: out.shows };
  const results = argLists.map((args) => {
    context.__args = structuredClone(args);
    try { return { value: plain(vm.runInContext('__fn(...__args)', context, { timeout: TIMEOUT_MS })) }; }
    catch (e) { return { error: errText(e) }; }
  });
  return { results, logs: out.logs, shows: out.shows };
}

/** Playground: run a whole script with the full toolbox (`lib`, `IMG`). */
export function runScript(code) {
  const { context, out } = makeContext({ lib, IMG: structuredClone(IMAGES) });
  let error = null; let value;
  try { value = vm.runInContext(code, context, { timeout: TIMEOUT_MS * 2, filename: 'playground.js' }); }
  catch (e) { error = errText(e); }
  if (!error && value !== undefined && typeof value !== 'function' && !out.logs.length && !out.shows.length) out.logs.push(fmt(plain(value)));
  return { logs: out.logs, shows: out.shows, error };
}
