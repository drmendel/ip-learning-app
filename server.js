// ip-learning-app – local interactive practice server for Képfeldolgozás (image processing).
// Start:  npm start  (Node ≥ 20)   or   deno run -A server.js   →  http://localhost:8766
//
// The server is stateless: learning progress lives in each visitor's browser (localStorage),
// so one instance can serve many people. No npm dependencies.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { grade, runCode, expectedCode, runSteps, solutionValues } from './engines/grade.js';
import { runScript } from './engines/sandbox.js';
import { IMAGES, IMAGE_INFO } from './engines/images.js';
import { normLang } from './engines/messages.js';
import { contentFor, LANGUAGES, cheatsheet } from './content/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8766);
const HOST = process.env.HOST || '127.0.0.1';
const PUBLIC = path.join(__dirname, 'public');
const MAX_BODY = 200_000;

// ------------------------------------------------------------------ helpers
const SECRET = new Set(['solution', 'solve', 'tests', 'require', 'forbid']);
function publicExercise(ex) {
  const out = {};
  for (const [k, v] of Object.entries(ex)) if (!SECRET.has(k) && typeof v !== 'function') out[k] = v;
  if (ex.fields) out.fields = ex.fields.map(({ check, ...f }) => { void check; return f; });
  return out;
}
function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > MAX_BODY) { reject(new Error('Request too large')); req.destroy(); } });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon' };

// ------------------------------------------------------------------ routes
async function api(req, res, url) {
  const route = url.pathname.replace(/^\/api/, '');
  const lang = normLang(url.searchParams.get('lang') || 'en');
  const content = contentFor(lang);

  if (req.method === 'GET') {
    if (route === '/health') return send(res, 200, { ok: true });
    if (route === '/languages') return send(res, 200, LANGUAGES);
    if (route === '/modules') return send(res, 200, content.modules.map((m) => ({ ...m, exercises: m.exercises.map(publicExercise) })));
    if (route === '/images') return send(res, 200, Object.fromEntries(Object.entries(IMAGES).map(([k, v]) => [k, { info: IMAGE_INFO[k], h: v.length, w: v[0].length }])));
    if (route === '/cheatsheet') return send(res, 200, { md: cheatsheet(lang) });
    return send(res, 404, { error: 'not found' });
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' });

  const body = await readBody(req);
  const ex = body.exerciseId ? content.byId.get(body.exerciseId) : null;
  if (body.exerciseId && !ex) return send(res, 404, { error: 'unknown exercise' });

  if (route === '/run') {
    const code = String(body.code || '');
    if (ex?.type === 'code') return send(res, 200, runCode(ex, code));
    if (ex?.type === 'steps') return send(res, 200, runSteps(ex, code));
    return send(res, 200, { kind: 'script', ...runScript(code) });
  }
  if (route === '/check' && ex) return send(res, 200, grade(ex, body, lang));
  if (route === '/reveal' && ex) {
    if (body.what === 'solution') {
      if (ex.type === 'calc') return send(res, 200, { values: solutionValues(ex), explain: ex.explain || '' });
      return send(res, 200, { solution: ex.solution, explain: ex.explain || '' });
    }
    if (body.what === 'expected') {
      if (ex.type === 'code') return send(res, 200, expectedCode(ex));
      if (ex.type === 'steps') return send(res, 200, runSteps(ex, ex.solution));
    }
    return send(res, 400, { error: 'what?' });
  }
  return send(res, 404, { error: 'not found' });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    let file = path.normalize(path.join(PUBLIC, url.pathname === '/' ? 'index.html' : url.pathname));
    if (!file.startsWith(PUBLIC)) return send(res, 403, 'forbidden', 'text/plain');
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC, 'index.html');
    send(res, 200, fs.readFileSync(file), MIME[path.extname(file)] || 'application/octet-stream');
  } catch (e) {
    console.error(e);
    send(res, 500, { error: String((e && e.message) || e) });
  }
});

server.listen(PORT, HOST, () => {
  const mods = contentFor('en').modules;
  const n = mods.reduce((a, m) => a + m.exercises.length, 0);
  console.log(`\n  ip-learning-app is running:  http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}\n  ${mods.length} modules, ${n} exercises · languages: ${LANGUAGES.join(', ')}\n  (Ctrl+C to stop)\n`);
});
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { server.close(); process.exit(0); });
