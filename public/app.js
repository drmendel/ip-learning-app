/* ip-learning-app – client (vanilla JS, no dependencies).
   Progress is stored in this browser's localStorage; the server is stateless. */
'use strict';

// ---------------------------------------------------------------- storage helpers
function lsGet(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
function lsDel(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } }

function detectLang() {
  const saved = lsGet('lang');
  if (saved && window.I18N[saved]) return saved;
  return (navigator.language || '').toLowerCase().startsWith('hu') ? 'hu' : 'en';
}

const EMPTY_PROGRESS = () => ({ exercises: {}, quiz: {}, cards: {}, exams: [] });
const state = {
  lang: detectLang(),
  modules: [],
  byId: new Map(),
  progress: { ...EMPTY_PROGRESS(), ...lsGet('progress', {}) },
  cheat: null,
  images: null,
  exam: lsGet('kepf-exam', null),
};
function saveProgress() { lsSet('progress', state.progress); }

// ---------------------------------------------------------------- i18n
function t(key, ...args) {
  const v = window.I18N[state.lang]?.[key] ?? window.I18N.en[key];
  return typeof v === 'function' ? v(...args) : (v ?? key);
}

// ---------------------------------------------------------------- utils
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function h(html) { const tpl = document.createElement('template'); tpl.innerHTML = html.trim(); return tpl.content.firstElementChild; }
async function api(path, body) {
  const url = `/api${path}${path.includes('?') ? '&' : '?'}lang=${state.lang}`;
  const opts = body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({ error: 'Bad response from the server' }));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}
const fmtNum = (v) => (typeof v !== 'number' ? String(v ?? '') : Number.isInteger(v) ? String(v) : String(Math.round(v * 10000) / 10000));
const isMatrix = (v) => Array.isArray(v) && v.length > 0 && Array.isArray(v[0]);

// ---------------------------------------------------------------- deferred image slots
// HTML is built as strings; canvases are inserted afterwards with hydrate().
const slots = new Map(); let slotN = 0;
function slot(data, opts = {}) { const id = 's' + (++slotN); slots.set(id, { data, opts }); return `<span class="slot" data-slot="${id}"></span>`; }
function hydrate(root) {
  $$('.slot', root).forEach((el) => {
    const s = slots.get(el.dataset.slot); slots.delete(el.dataset.slot);
    if (s) el.replaceWith(imageCanvas(s.data, s.opts));
  });
}
function imageCanvas(m, opts = {}) {
  const hgt = m.length, wid = m[0]?.length || 0;
  const vals = m.flat().filter((v) => typeof v === 'number' && Number.isFinite(v));
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (opts.range) [lo, hi] = opts.range;
  else if (lo >= 0 && hi <= 1 && vals.every((v) => v === 0 || v === 1)) { lo = 0; hi = 1; }
  else if (lo >= 0 && hi <= 255 && hi > 1 && !opts.auto) { lo = 0; hi = 255; }
  if (hi === lo) hi = lo + 1;
  const scale = opts.scale || Math.max(1, Math.floor((opts.size || 224) / Math.max(hgt, wid)));
  const c = document.createElement('canvas');
  c.width = wid; c.height = hgt; c.className = 'img';
  c.style.width = wid * scale + 'px'; c.style.height = hgt * scale + 'px';
  const ctx = c.getContext('2d'); const id = ctx.createImageData(wid, hgt);
  for (let y = 0; y < hgt; y++) for (let x = 0; x < wid; x++) {
    const v = m[y][x]; const i = 4 * (y * wid + x);
    if (typeof v !== 'number' || !Number.isFinite(v)) { id.data[i] = 200; id.data[i + 1] = 40; id.data[i + 2] = 40; id.data[i + 3] = 255; continue; }
    const g = Math.round(255 * Math.min(1, Math.max(0, (v - lo) / (hi - lo))));
    id.data[i] = id.data[i + 1] = id.data[i + 2] = g; id.data[i + 3] = 255;
  }
  ctx.putImageData(id, 0, 0);
  const wrap = document.createElement('div');
  wrap.appendChild(c);
  const cap = document.createElement('div'); cap.className = 'img-range';
  cap.textContent = `${hgt}×${wid} · ${fmtNum(lo)} → black, ${fmtNum(hi)} → white`;
  wrap.appendChild(cap);
  return wrap;
}

// ---------------------------------------------------------------- grids (pixel tables)
/** opts: { title, base (1|0), highlight: [[r,c]...], image: bool, axes: bool } */
function gridHtml(m, opts = {}) {
  if (!isMatrix(m)) m = [m];
  const base = opts.base ?? 1;
  const hl = new Set((opts.highlight || []).map(([r, c]) => `${r},${c}`));
  const binary = m.flat().every((v) => v === 0 || v === 1);
  const head = `<tr><th class="corner">${opts.axes === false ? '' : 'y\\x'}</th>${m[0].map((_, j) => `<th>${j + base}</th>`).join('')}</tr>`;
  const body = m.map((r, i) => `<tr><th>${i + base}</th>${r.map((v, j) => `<td class="${hl.has(`${i},${j}`) ? 'hl' : binary && v === 1 && opts.markOnes !== false ? 'one' : ''}">${esc(fmtNum(v))}</td>`).join('')}</tr>`).join('');
  const table = `<div class="grid-wrap"><table class="grid">${head}${body}</table></div>`;
  const img = opts.image ? `<div style="margin-top:6px">${slot(m, { size: 160 })}</div>` : '';
  return `<div class="grid-box">${opts.title ? `<div class="gt">${esc(opts.title)}</div>` : ''}${table}${img}</div>`;
}

// ---------------------------------------------------------------- markdown
function inline(s) {
  const codes = [];
  let out = esc(s).replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  out = out.replace(/\\\*/g, '\u0001'); // escaped asterisk = literal *
  out = out
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return out.replace(/\u0001/g, '*').replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
}
function splitRow(line) {
  const cells = []; let cur = ''; let inCode = false;
  const s = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && s[i + 1] === '|') { cur += '|'; i++; continue; }
    if (c === '`') inCode = !inCode;
    if (c === '|' && !inCode) { cells.push(cur.trim()); cur = ''; } else cur += c;
  }
  cells.push(cur.trim());
  return cells;
}
/** ```grid block: optional first line "# title", then rows of numbers; a trailing * highlights a cell. */
function gridFence(lines, info) {
  let title = ''; const rows = []; const hl = [];
  for (const l of lines) {
    if (/^#/.test(l.trim())) { title = l.trim().replace(/^#\s*/, ''); continue; }
    if (!l.trim()) continue;
    const r = rows.length;
    rows.push(l.trim().split(/[\s|]+/).filter(Boolean).map((tok, c) => { if (tok.endsWith('*')) { hl.push([r, c]); tok = tok.slice(0, -1); } const n = Number(tok.replace(',', '.')); return Number.isNaN(n) ? tok : n; }));
  }
  const base = /base=0/.test(info) ? 0 : 1;
  return `<div class="grids">${gridHtml(rows, { title, highlight: hl, base, image: /image/.test(info) })}</div>`;
}
function md(src, { tryButtons = false } = {}) {
  const lines = String(src || '').replace(/\r/g, '').split('\n');
  let html = '';
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fence = /^```(\w*)(.*)$/.exec(line);
    if (fence) {
      const lang = fence[1]; const buf = []; i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) buf.push(lines[i++]);
      i++;
      if (lang === 'grid') { html += gridFence(buf, fence[2] || ''); continue; }
      const code = buf.join('\n');
      html += `<div class="codeblock"><pre><code>${esc(code)}</code></pre>${tryButtons && lang === 'js' ? `<button class="btn try" data-try="1" data-code="${esc(code)}">▶ Try</button>` : ''}</div>`;
      continue;
    }
    if (/^#{1,4}\s/.test(line)) { const n = line.match(/^#+/)[0].length; html += `<h${n}>${inline(line.slice(n).trim())}</h${n}>`; i++; continue; }
    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const head = splitRow(line); i += 2;
      let body = '';
      while (i < lines.length && /^\s*\|/.test(lines[i])) { body += '<tr>' + splitRow(lines[i]).map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>'; i++; }
      html += `<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>`;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      html += `<blockquote>${md(buf.join('\n'))}</blockquote>`;
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const stack = [];
      let out = '';
      while (i < lines.length && (/^\s*([-*]|\d+\.)\s+/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && stack.length))) {
        const l = lines[i];
        const m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(l);
        if (!m) { out += ' ' + inline(l.trim()); i++; continue; }
        const indent = m[1].length; const type = /\d/.test(m[2]) ? 'ol' : 'ul';
        while (stack.length && indent < stack[stack.length - 1].indent) { out += `</li></${stack.pop().type}>`; }
        if (!stack.length || indent > stack[stack.length - 1].indent) { stack.push({ indent, type }); out += `<${type}><li>`; }
        else out += '</li><li>';
        out += inline(m[3]);
        i++;
      }
      while (stack.length) out += `</li></${stack.pop().type}>`;
      html += out;
      continue;
    }
    if (!line.trim()) { i++; continue; }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(```|#{1,4}\s|>|\s*([-*]|\d+\.)\s+|\s*\|)/.test(lines[i])) buf.push(lines[i++]);
    if (!buf.length) { buf.push(lines[i++]); }
    html += `<p>${inline(buf.join(' '))}</p>`;
  }
  return html;
}

// ---------------------------------------------------------------- progress helpers
const gradable = (ex) => ['calc', 'code', 'steps'].includes(ex.type);
function status(ex) {
  if (gradable(ex)) {
    const p = state.progress.exercises[ex.id];
    if (!p) return '';
    if (p.passed) return 'pass';
    if (p.last === 'fail') return 'fail';
    if (p.revealed) return 'seen';
    return '';
  }
  if (ex.type === 'quiz') { const v = state.progress.quiz[ex.id]; return v === true ? 'pass' : v === false ? 'fail' : ''; }
  if (ex.type === 'card') { const v = state.progress.cards[ex.id]; return v === undefined ? '' : v >= 1 ? 'pass' : 'seen'; }
  return '';
}
const ICON = { pass: '✓', fail: '✗', seen: '◐', '': '○' };
function modProgress(m) { const done = m.exercises.filter((e) => status(e) === 'pass').length; return { done, total: m.exercises.length }; }

// ---------------------------------------------------------------- static chrome
function renderChrome() {
  document.documentElement.lang = state.lang;
  document.title = t('title');
  $('#brandName').textContent = t('title');
  $('#playLink').textContent = t('playground');
  $('#cheatBtn').textContent = t('cheat');
  $('#drawerTitle').textContent = t('cheatTitle');
  $('#themeBtn').title = t('toggleDark');
  $('#menuBtn').title = t('menu');
  $('#drawerClose').title = t('close');
  const sel = $('#langSel');
  sel.title = t('language');
  sel.innerHTML = Object.keys(window.I18N).map((l) => `<option value="${l}" title="${esc(window.I18N[l].langName)}" ${l === state.lang ? 'selected' : ''}>${l.toUpperCase()}</option>`).join('');
}

// ---------------------------------------------------------------- sidebar
function renderSidebar(activeModule, activeEx) {
  const sb = $('#sidebar');
  sb.innerHTML = '';
  state.modules.forEach((m, idx) => {
    const { done, total } = modProgress(m);
    const open = m.id === activeModule;
    const el = h(`<div class="mod">
      <a class="mod-head ${open && !activeEx ? 'active' : ''}" href="#/m/${m.id}">
        <span class="mod-num ${done === total && total ? 'done' : ''}">${done === total && total ? '✓' : idx}</span>
        <span class="mod-title"><div class="t">${esc(m.title)}</div>
          <div class="s"><span>${esc(m.lab)}</span><span class="bar"><span style="width:${total ? (100 * done / total) : 0}%"></span></span><span>${done}/${total}</span></div></span>
      </a></div>`);
    if (open) {
      const ul = h('<ul class="ex-list"></ul>');
      ul.appendChild(h(`<li><a href="#/m/${m.id}" class="${!activeEx ? 'active' : ''}"><span class="st">📖</span>${esc(t('lesson'))}</a></li>`));
      for (const ex of m.exercises) {
        const s = status(ex);
        ul.appendChild(h(`<li><a href="#/e/${ex.id}" class="${ex.id === activeEx ? 'active' : ''}"><span class="st ${s}">${ICON[s]}</span>${esc(ex.title)}</a></li>`));
      }
      el.appendChild(ul);
    }
    sb.appendChild(el);
  });
  renderOverall();
}
function renderOverall() {
  let done = 0, total = 0;
  for (const m of state.modules) { const p = modProgress(m); done += p.done; total += p.total; }
  const el = $('#overall');
  el.title = t('overall');
  el.innerHTML = `<span class="bar"><span style="width:${total ? 100 * done / total : 0}%"></span></span><span class="txt">${esc(t('done', done, total))}</span>`;
}

// ---------------------------------------------------------------- routing
function route() {
  document.body.classList.remove('menu-open');
  const hash = location.hash.replace(/^#\/?/, '');
  const [kind, id] = hash.split('/');
  $('#main').scrollTop = 0;
  if (kind === 'm' && state.modules.find((m) => m.id === id)) return renderLesson(state.modules.find((m) => m.id === id));
  if (kind === 'e' && state.byId.has(id)) return renderExercise(state.byId.get(id));
  if (kind === 'play') return renderPlayground();
  if (kind === 'exam-result') return renderExamResult();
  return renderHome();
}
function mount(el) { const main = $('#main'); main.innerHTML = ''; main.appendChild(el); hydrate(el); }

// ---------------------------------------------------------------- home
function nextTodo() {
  for (const m of state.modules) for (const ex of m.exercises) if (status(ex) !== 'pass' && !m.exam) return ex;
  return null;
}
function renderHome() {
  renderSidebar(null, null);
  const next = nextTodo();
  const exams = state.progress.exams || [];
  const last = exams[exams.length - 1];
  const page = h(`<div class="page">
    <h1>${esc(t('homeTitle'))}</h1>
    <p class="muted">${esc(t('homeSub'))}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
      ${next ? `<a class="btn primary" href="#/e/${next.id}">${esc(t('continue', next.title))}</a>` : `<span class="badge pts">${esc(t('allDone'))}</span>`}
      <a class="btn" href="#/m/start">${esc(t('howItWorks'))}</a>
      <a class="btn" href="#/m/practice">${esc(t('practice'))}</a>
      <a class="btn" href="#/m/mockzh">${esc(t('mockZh'))}${last ? esc(t('lastExam', last.percent, last.grade)) : ''}</a>
    </div>
    <div class="home-grid"></div>
    <p style="margin-top:28px"><button class="btn ghost" id="resetProgress" style="font-size:13px">${esc(t('resetProgress'))}</button></p>
  </div>`);
  const grid = $('.home-grid', page);
  state.modules.forEach((m, idx) => {
    const { done, total } = modProgress(m);
    grid.appendChild(h(`<a class="card home-card" href="#/m/${m.id}">
      <div class="t">${idx}. ${esc(m.title)}</div>
      <div class="s">${esc(m.lab)} · ${esc(t('items', total))}</div>
      <div class="bar"><span style="width:${total ? 100 * done / total : 0}%"></span></div>
    </a>`));
  });
  $('#resetProgress', page).addEventListener('click', () => {
    if (!confirm(t('confirmResetProgress'))) return;
    state.progress = EMPTY_PROGRESS(); saveProgress();
    try { Object.keys(localStorage).filter((k) => /^(draft|card|calc|examdraft|examcard|examcalc):/.test(k)).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
    renderHome();
  });
  mount(page);
}

// ---------------------------------------------------------------- lesson
function renderLesson(m) {
  renderSidebar(m.id, null);
  const first = m.exercises[0];
  const page = h(`<div class="page">
    <div class="crumbs"><a href="#/">${esc(t('home'))}</a> › <span>${esc(m.lab)}</span></div>
    <div class="md lesson">${md(m.lessonText, { tryButtons: true })}</div>
    <div class="exam-box"></div>
    <div class="nav-row"><span></span>${first ? `<a class="btn primary" href="#/e/${first.id}">${esc(t('startExercises', m.exercises.length))}</a>` : ''}</div>
  </div>`);
  bindTryButtons(page);
  if (m.exam) renderExamBox($('.exam-box', page), m);
  mount(page);
}
function bindTryButtons(root) {
  $$('[data-try]', root).forEach((b) => b.addEventListener('click', () => { lsSet('play:code', b.getAttribute('data-code')); location.hash = '#/play'; }));
}

// ---------------------------------------------------------------- exercise page
function siblings(ex) {
  const m = state.modules.find((x) => x.id === ex.module);
  const i = m.exercises.findIndex((e) => e.id === ex.id);
  return { m, prev: m.exercises[i - 1], next: m.exercises[i + 1], idx: i };
}
function inExam(ex) { return state.exam && !state.exam.finished && state.exam.moduleId === ex.module; }

function renderExercise(ex) {
  const { m, prev, next, idx } = siblings(ex);
  renderSidebar(m.id, ex.id);
  const exam = inExam(ex);
  const grids = (ex.grids || []).map((g) => gridHtml(g.data, g)).join('');
  const page = h(`<div class="page">
    <div class="crumbs"><a href="#/">${esc(t('home'))}</a> › <a href="#/m/${m.id}">${esc(m.title)}</a> › <span>${idx + 1} / ${m.exercises.length}</span></div>
    <h1>${esc(ex.title)}</h1>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <span class="badge ${ex.type}">${esc(t('engine')[ex.type] || ex.type)}</span>
      ${ex.points ? `<span class="badge pts">${esc(t('points', ex.points))}</span>` : ''}
      ${exam ? `<span class="badge pts">${esc(t('examNoHints'))}</span>` : ''}
    </div>
    <div class="card prompt"><div class="md">${md(ex.prompt)}</div>${grids ? `<div class="grids">${grids}</div>` : ''}</div>
    <div class="body"></div>
    <div class="nav-row">
      ${prev ? `<a class="btn" href="#/e/${prev.id}">← ${esc(prev.title)}</a>` : `<a class="btn" href="#/m/${m.id}">← ${esc(t('lesson'))}</a>`}
      ${next ? `<a class="btn" href="#/e/${next.id}">${esc(next.title)} →</a>` : (exam ? `<button class="btn primary" id="finishBtn2">${esc(t('finishExam'))}</button>` : `<a class="btn" href="#/">${esc(t('backOverview'))}</a>`)}
    </div>
  </div>`);
  const body = $('.body', page);
  if (ex.type === 'calc') renderCalc(ex, body, exam);
  else if (ex.type === 'code' || ex.type === 'steps') renderCodeExercise(ex, body, exam);
  else if (ex.type === 'quiz') renderQuiz(ex, body, exam);
  else if (ex.type === 'card') renderCard(ex, body, exam);
  const fb = $('#finishBtn2', page);
  if (fb) fb.addEventListener('click', finishExam);
  mount(page);
}

function hintsHtml(hints) {
  return hints.length ? `<div class="hints"><button class="btn ghost" data-act="hint">${esc(t('showHint', 1, hints.length))}</button><div class="hint-list"></div></div>` : '';
}
function bindHints(body, hints) {
  let n = 0;
  body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act="hint"]');
    if (!btn) return;
    if (n < hints.length) $('.hint-list', body).insertAdjacentHTML('beforeend', `<div class="hint"><div class="md">${md(hints[n])}</div></div>`);
    n++;
    if (n >= hints.length) btn.remove(); else btn.textContent = t('showHint', n + 1, hints.length);
  });
}
function recordResult(ex, r, saved, exam) {
  if (exam) {
    state.exam.results[ex.id] = { pass: r.pass, score: r.score ?? (r.pass ? 1 : 0), saved };
    saveExam();
    return;
  }
  const p = state.progress.exercises[ex.id] || { attempts: 0 };
  p.attempts++; p.last = r.pass ? 'pass' : 'fail';
  if (typeof saved === 'string') p.code = saved; else p.answers = saved;
  if (r.pass) { p.passed = true; p.passedAt = p.passedAt || new Date().toISOString(); }
  state.progress.exercises[ex.id] = p;
  saveProgress();
}
function feedbackHtml(r) {
  return `<div class="feedback ${r.pass ? 'pass' : 'fail'}"><strong>${r.pass ? '✓ ' : '✗ '}${esc(r.message)}</strong>${r.detail ? `<pre>${esc(r.detail)}</pre>` : ''}</div>`;
}
function addNextButton(ex, fbBox) {
  const { next } = siblings(ex);
  if (next) fbBox.firstElementChild.insertAdjacentHTML('beforeend', ` <a class="btn ok" style="margin-top:8px" href="#/e/${next.id}">${esc(t('next', next.title))}</a>`);
}

// ---------------------------------------------------------------- calc exercises (typed answers)
function calcKey(ex) { return (inExam(ex) ? 'examcalc:' : 'calc:') + ex.id; }
function fieldInputs(f) {
  if (f.kind === 'str') return `<input class="cell str" data-r="0" data-c="0" spellcheck="false" autocomplete="off">`;
  if (!f.shape) return `<input class="cell wide" data-r="0" data-c="0" inputmode="decimal" autocomplete="off">`;
  const [rows, cols] = f.shape;
  const cl = f.colLabels || Array.from({ length: cols }, (_, j) => j + (f.base ?? 1));
  const rl = f.rowLabels || Array.from({ length: rows }, (_, i) => i + (f.base ?? 1));
  const head = `<tr><th></th>${cl.map((c) => `<th>${esc(c)}</th>`).join('')}</tr>`;
  const body = rl.map((rlab, r) => `<tr><th>${esc(rlab)}</th>${cl.map((_, c) => `<td><input class="cell" data-r="${r}" data-c="${c}" inputmode="decimal" autocomplete="off"></td>`).join('')}</tr>`).join('');
  return `<div class="grid-wrap"><table class="inputs">${head}${body}</table></div>`;
}
function readField(box, f) {
  if (!f.shape || f.kind === 'str') return $('input', box).value;
  const [rows, cols] = f.shape;
  const m = Array.from({ length: rows }, () => new Array(cols).fill(''));
  $$('input', box).forEach((inp) => { m[+inp.dataset.r][+inp.dataset.c] = inp.value; });
  return m;
}
function writeField(box, f, v) {
  if (!f.shape || f.kind === 'str') { $('input', box).value = v ?? ''; return; }
  $$('input', box).forEach((inp) => { inp.value = v?.[+inp.dataset.r]?.[+inp.dataset.c] ?? ''; });
}
function renderCalc(ex, body, exam) {
  const hints = exam ? [] : (ex.hints || []);
  body.innerHTML = `${hintsHtml(hints)}
    <div class="card calc-card">
      <p class="help">${esc(t('calcHelp'))}</p>
      ${(ex.fields || []).map((f) => `<div class="field" data-key="${esc(f.key)}"><div class="field-label">${inline(f.label || f.key)}${f.pts && ex.points ? `<span class="pts">(${f.pts})</span>` : ''}</div>${fieldInputs(f)}</div>`).join('')}
      <div class="calc-bar">
        <button class="btn primary" data-act="check" title="Ctrl+Shift+Enter">${esc(t('check'))}</button>
        <span class="lbl muted" style="font-size:12px"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> ${esc(t('kbdCheck'))}</span>
        <span class="spacer"></span>
        ${!exam ? `<button class="btn ghost" data-act="solution">${esc(t('solution'))}</button>` : ''}
        <button class="btn ghost" data-act="clear">${esc(t('clearFields'))}</button>
      </div>
    </div>
    <div class="feedback-box"></div>
    <div class="solution-box"></div>`;
  bindHints(body, hints);
  const fieldBox = (key) => $(`.field[data-key="${CSS.escape(key)}"]`, body);
  const prog = state.progress.exercises[ex.id];
  const saved = lsGet(calcKey(ex)) ?? (exam ? state.exam.results[ex.id]?.saved : prog?.answers) ?? {};
  for (const f of ex.fields || []) writeField(fieldBox(f.key), f, saved[f.key]);
  const collect = () => Object.fromEntries((ex.fields || []).map((f) => [f.key, readField(fieldBox(f.key), f)]));
  const save = debounce(() => lsSet(calcKey(ex), collect()), 300);
  body.addEventListener('input', (e) => { if (e.target.matches('input.cell')) { e.target.classList.remove('right', 'wrong', 'sol'); save(); } });
  // paste a whole table into one cell → fill the matrix from there
  body.addEventListener('paste', (e) => {
    const inp = e.target.closest('input.cell'); if (!inp) return;
    const box = inp.closest('.field'); const f = (ex.fields || []).find((x) => x.key === box.dataset.key);
    if (!f?.shape) return;
    const text = (e.clipboardData || window.clipboardData).getData('text');
    const rows = text.trim().split(/\r?\n/).map((l) => l.trim().split(/[\s;|]+/).filter(Boolean));
    if (rows.length === 1 && rows[0].length <= 1) return;
    e.preventDefault();
    const r0 = +inp.dataset.r, c0 = +inp.dataset.c; const [R, Cc] = f.shape;
    const flatMode = rows.length === 1;
    let k = 0;
    if (flatMode) { for (let r = r0; r < R; r++) for (let c = r === r0 ? c0 : 0; c < Cc; c++) { const el = $(`input[data-r="${r}"][data-c="${c}"]`, box); if (el && k < rows[0].length) el.value = rows[0][k++]; } }
    else rows.forEach((row, i) => row.forEach((v, j) => { const el = $(`input[data-r="${r0 + i}"][data-c="${c0 + j}"]`, box); if (el) el.value = v; }));
    save();
  });
  async function doCheck() {
    const fbBox = $('.feedback-box', body);
    fbBox.innerHTML = `<div class="feedback info">${esc(t('checking'))}</div>`;
    const answers = collect();
    try {
      const r = await api('/check', { exerciseId: ex.id, answers });
      fbBox.innerHTML = feedbackHtml(r);
      for (const f of ex.fields || []) {
        const box = fieldBox(f.key); const fr = r.fields?.[f.key];
        box.classList.toggle('ok', !!fr?.ok); box.classList.toggle('bad', !!fr && !fr.ok && !fr.empty);
        $$('input', box).forEach((inp) => {
          inp.classList.remove('right', 'wrong', 'sol');
          if (!fr || exam) return;
          const v = fr.cells ? fr.cells[+inp.dataset.r]?.[+inp.dataset.c] : (inp.value.trim() ? fr.ok : null);
          if (v === true) inp.classList.add('right'); else if (v === false) inp.classList.add('wrong');
        });
      }
      recordResult(ex, r, answers, exam);
      if (r.pass && !exam) { lsDel(calcKey(ex)); addNextButton(ex, fbBox); }
      renderSidebar(ex.module, ex.id);
    } catch (e) { fbBox.innerHTML = `<div class="feedback fail">${esc(e.message)}</div>`; }
  }
  body.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); doCheck(); } });
  body.addEventListener('click', async (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'check') doCheck();
    if (act === 'clear' && confirm(t('confirmClear'))) { for (const f of ex.fields || []) writeField(fieldBox(f.key), f, null); lsDel(calcKey(ex)); $$('.field', body).forEach((b) => b.classList.remove('ok', 'bad')); }
    if (act === 'solution') {
      const p = state.progress.exercises[ex.id];
      if (!(p && (p.attempts > 0 || p.passed)) && !confirm(t('confirmSolution'))) return;
      const r = await api('/reveal', { exerciseId: ex.id, what: 'solution' });
      const pp = state.progress.exercises[ex.id] || { attempts: 0 }; pp.revealed = true; state.progress.exercises[ex.id] = pp; saveProgress();
      const box = $('.solution-box', body);
      const vals = (ex.fields || []).map((f) => {
        const v = r.values[f.key];
        const shown = isMatrix(v) ? gridHtml(v, { axes: false, base: 1, markOnes: false }) : Array.isArray(v) ? gridHtml([v], { axes: false, markOnes: false }) : `<code>${esc(fmtNum(v))}</code>`;
        return `<div class="field"><div class="field-label">${inline(f.label || f.key)}</div>${shown}</div>`;
      }).join('');
      box.innerHTML = `<div class="card answer"><strong>${esc(t('modelSolution'))}</strong>${vals}<button class="btn" data-act="fill">${esc(t('fillSolution'))}</button>${r.explain ? `<div class="md" style="margin-top:10px">${md(r.explain)}</div>` : ''}</div>`;
      box._vals = r.values;
      hydrate(box);
      renderSidebar(ex.module, ex.id);
    }
    if (act === 'fill') {
      const vals = $('.solution-box', body)._vals;
      for (const f of ex.fields || []) {
        const v = vals[f.key];
        const str = isMatrix(v) ? v.map((row) => row.map(fmtNum)) : Array.isArray(v) ? [v.map(fmtNum)] : fmtNum(v);
        writeField(fieldBox(f.key), f, str);
        $$('input', fieldBox(f.key)).forEach((i) => i.classList.add('sol'));
      }
      save();
    }
  });
}

// ---------------------------------------------------------------- code & steps exercises (editor)
function draftKey(ex) { return (inExam(ex) ? 'examdraft:' : 'draft:') + ex.id; }
function renderCodeExercise(ex, body, exam) {
  const saved = lsGet(draftKey(ex));
  const prog = state.progress.exercises[ex.id];
  const initial = saved ?? (exam ? (state.exam.results[ex.id]?.saved ?? ex.starter ?? '') : (prog?.code ?? ex.starter ?? ''));
  const hints = exam ? [] : (ex.hints || []);
  const isSteps = ex.type === 'steps';
  const canRun = !(exam && isSteps);
  body.innerHTML = `
    ${hintsHtml(hints)}
    ${isSteps ? `<div class="output pre-view"></div>` : ''}
    <div class="card editor-wrap">
      <div class="editor-bar">
        ${canRun ? `<button class="btn" data-act="run" title="Ctrl+Enter">${esc(t('run'))}</button>` : ''}
        <button class="btn primary" data-act="check" title="Ctrl+Shift+Enter">${esc(t('check'))}</button>
        <span class="lbl">${canRun ? `<kbd>Ctrl</kbd>+<kbd>Enter</kbd> ${esc(t('kbdRun'))} · ` : ''}<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Enter</kbd> ${esc(t('kbdCheck'))}</span>
        <span class="spacer"></span>
        ${!exam ? `<button class="btn ghost" data-act="expected">${esc(t('expectedOutput'))}</button>` : ''}
        ${!exam ? `<button class="btn ghost" data-act="solution">${esc(t('solution'))}</button>` : ''}
        <button class="btn ghost" data-act="clear" title="${esc(t('restore'))}">↺</button>
      </div>
      <textarea class="editor" spellcheck="false" placeholder="${esc(t('placeholder')[ex.type] || '')}"></textarea>
    </div>
    <div class="feedback-box"></div>
    <div class="solution-box"></div>
    <div class="output main-out"></div>`;
  bindHints(body, hints);
  const ta = $('textarea', body);
  ta.value = initial;
  autoGrow(ta);
  const save = debounce(() => lsSet(draftKey(ex), ta.value), 300);
  ta.addEventListener('input', () => { autoGrow(ta); save(); });
  editorKeys(ta, () => (canRun ? doRun() : doCheck()), doCheck);
  const out = $('.main-out', body);
  const fbBox = $('.feedback-box', body);
  if (isSteps) { // show start + target before anything is run
    const pv = $('.pre-view', body);
    pv.innerHTML = ''; pv.appendChild(stepsView({ steps: [], vertices: ex.vertices, edges: ex.edges, target: ex.target, extra: ex.extra || [], P: null }, { hideSteps: true }));
  }
  const render = (o, title) => {
    if (isSteps) { if (exam) { out.innerHTML = `<p class="muted">${esc(t('examHiddenOutput'))}</p>`; return; } const pv = $('.pre-view', body); if (pv) pv.innerHTML = ''; out.innerHTML = `<h3>${esc(title)}</h3>`; out.appendChild(stepsView(o)); }
    else renderCodeOutput(out, o, title);
  };
  async function doRun() {
    out.innerHTML = `<p class="muted">${esc(t('running'))}</p>`;
    try { render(await api('/run', { exerciseId: ex.id, code: ta.value }), t('output')); }
    catch (e) { out.innerHTML = `<div class="feedback fail">${esc(e.message)}</div>`; }
  }
  async function doCheck() {
    fbBox.innerHTML = `<div class="feedback info">${esc(t('checking'))}</div>`;
    try {
      const r = await api('/check', { exerciseId: ex.id, code: ta.value });
      fbBox.innerHTML = feedbackHtml(r);
      if (r.output) render(r.output, t('yourOutput')); else out.innerHTML = '';
      recordResult(ex, r, ta.value, exam);
      if (r.pass && !exam) { lsDel(draftKey(ex)); addNextButton(ex, fbBox); }
      renderSidebar(ex.module, ex.id);
    } catch (e) { fbBox.innerHTML = `<div class="feedback fail">${esc(e.message)}</div>`; }
  }
  body.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]');
    const act = btn?.dataset.act;
    if (!act || act === 'hint') return;
    if (act === 'run') doRun();
    if (act === 'check') doCheck();
    if (act === 'expected') {
      out.innerHTML = `<p class="muted">${esc(t('computing'))}</p>`;
      try { render(await api('/reveal', { exerciseId: ex.id, what: 'expected' }), t('expectedRef')); }
      catch (err) { out.innerHTML = `<div class="feedback fail">${esc(err.message)}</div>`; }
    }
    if (act === 'solution') {
      const p = state.progress.exercises[ex.id];
      if (!(p && (p.attempts > 0 || p.passed)) && !confirm(t('confirmSolution'))) return;
      const r = await api('/reveal', { exerciseId: ex.id, what: 'solution' });
      const pp = state.progress.exercises[ex.id] || { attempts: 0 };
      pp.revealed = true; state.progress.exercises[ex.id] = pp; saveProgress();
      const box = $('.solution-box', body);
      box.innerHTML = `<div class="card answer"><strong>${esc(t('modelSolution'))}</strong><pre style="white-space:pre-wrap;margin:8px 0"><code>${esc(r.solution)}</code></pre><button class="btn" data-act="copy">${esc(t('copyEditor'))}</button>${r.explain ? `<div class="md">${md(r.explain)}</div>` : ''}</div>`;
      box._sol = r.solution;
      renderSidebar(ex.module, ex.id);
    }
    if (act === 'copy') { ta.value = $('.solution-box', body)._sol; autoGrow(ta); save(); ta.focus(); }
    if (act === 'clear') { if (confirm(t('confirmRestore'))) { ta.value = ex.starter || ''; lsDel(draftKey(ex)); autoGrow(ta); } }
  });
  setTimeout(() => ta.focus(), 0);
}

// ---------------------------------------------------------------- code output rendering
function valueHtml(v, display = 'auto', depth = 0) {
  if (v === undefined) return `<p class="muted">${esc(t('nothingRan'))}</p>`;
  if (v === null) return '<code>null</code>';
  if (typeof v === 'number') return `<div class="val-num">${esc(fmtNum(v))}</div>`;
  if (typeof v === 'string' || typeof v === 'boolean') return `<pre class="logs">${esc(String(v))}</pre>`;
  if (isMatrix(v) && v.every((r) => Array.isArray(r) && r.every((x) => typeof x === 'number' || x === null))) {
    const small = v.length <= 20 && v[0].length <= 20;
    const showImg = display === 'image' || v.length * v[0].length >= 36;
    return `<div class="img-row">${showImg ? `<div>${slot(v.map((r) => r.map((x) => (x === null ? NaN : x))))}</div>` : ''}${small && display !== 'image' ? gridHtml(v, { base: 0, markOnes: false }) : ''}${small && display === 'image' ? `<details><summary class="muted" style="font-size:12px;cursor:pointer">${esc(t('asTable'))}</summary>${gridHtml(v, { base: 0, markOnes: false })}</details>` : ''}</div>`;
  }
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x === 'number' || x === null)) return gridHtml([v], { base: 0, axes: false, markOnes: false });
    return v.map((x, i) => `<div><span class="muted">[${i}]</span> ${valueHtml(x, display, depth + 1)}</div>`).join('');
  }
  if (typeof v === 'object') {
    return `<div class="img-row">${Object.entries(v).map(([k, x]) => `<div><div class="gt" style="font-weight:600;font-size:13px">${esc(k)}</div>${valueHtml(x, display, depth + 1)}</div>`).join('')}</div>`;
  }
  return esc(String(v));
}
function renderCodeOutput(el, o, title) {
  if (!o) { el.innerHTML = ''; return; }
  let html = `<h3>${esc(title)}</h3>`;
  if (o.error) html += `<div class="logs err">${esc(o.error)}</div>`;
  if (o.kind === 'code' && o.value !== undefined) html += valueHtml(o.value, o.display);
  if (o.logs?.length) html += `<div class="logs">${esc(o.logs.join('\n'))}</div>`;
  if (o.shows?.length) html += `<div class="img-row">${o.shows.map((s) => `<div>${isMatrix(s.data) ? slot(s.data, s.opts || {}) : valueHtml(s.data)}<div class="img-cap">${esc(s.title)}</div></div>`).join('')}</div>`;
  if (!o.error && o.value === undefined && !o.logs?.length && !o.shows?.length) html += `<p class="muted">${esc(t('nothingRan'))}</p>`;
  el.innerHTML = html;
  hydrate(el);
}

// ---------------------------------------------------------------- transformation steps view (oblique 3-D drawing)
function cols(P) { return P ? P[0].map((_, j) => [P[0][j], P[1][j], P[2][j]]) : []; }
function project([x, y, z]) { const k = 0.5, a = Math.PI / 6; return [x + k * y * Math.cos(a), -(z + k * y * Math.sin(a))]; }
function isoSvg({ start, now, target, edges, extra }) {
  const all = [...start, ...(now || []), ...(target || []), ...(extra || []).flatMap((o) => o.vertices), [0, 0, 0]];
  const pts2 = all.map(project);
  let x0 = Math.min(...pts2.map((p) => p[0])), x1 = Math.max(...pts2.map((p) => p[0]));
  let y0 = Math.min(...pts2.map((p) => p[1])), y1 = Math.max(...pts2.map((p) => p[1]));
  const pad = 0.6; x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
  const W = 360, Hh = Math.max(180, Math.min(420, W * (y1 - y0) / (x1 - x0)));
  const sc = Math.min(W / (x1 - x0), Hh / (y1 - y0));
  const P = (p) => { const [a, b] = project(p); return [((a - x0) * sc).toFixed(1), ((b - y0) * sc).toFixed(1)]; };
  const poly = (pts, cls) => edges.map(([i, j]) => { const [a, b] = P(pts[i]); const [c, d] = P(pts[j]); return `<line class="${cls}" x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`; }).join('');
  const ext = Math.max(1.5, ...all.map((p) => Math.max(...p.map(Math.abs)))) * 0.25 + 1;
  const axes = [[[ext, 0, 0], 'x'], [[0, ext, 0], 'y'], [[0, 0, ext], 'z']].map(([p, l]) => { const [a, b] = P([0, 0, 0]); const [c, d] = P(p); return `<line class="axis" x1="${a}" y1="${b}" x2="${c}" y2="${d}" marker-end="url(#arr)"/><text class="axis-lbl" x="${+c + 4}" y="${+d - 2}">${l}</text>`; }).join('');
  const ex = (extra || []).map((o) => o.edges.map(([i, j]) => { const [a, b] = P(o.vertices[i]); const [c, d] = P(o.vertices[j]); return `<line class="e-obst" x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`; }).join('')).join('');
  const labels = (now || start).map((p, i) => { const [a, b] = P(p); return `<text class="v-lbl" x="${+a + 3}" y="${+b - 3}">${i + 1}</text>`; }).join('');
  return `<svg class="iso" viewBox="0 0 ${(W).toFixed(0)} ${Hh.toFixed(0)}" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" opacity=".55"/></marker></defs>
    ${axes}${ex}${poly(start, 'e-start')}${target ? poly(target, 'e-target') : ''}${now ? poly(now, 'e-now') : ''}${labels}</svg>`;
}
function matTable(M, headers) {
  return `<table class="mat">${headers ? `<tr>${headers.map((x) => `<th>${esc(x)}</th>`).join('')}</tr>` : ''}${M.map((r, i) => `<tr class="${i === 3 ? 'h' : ''}">${r.map((v) => `<td>${esc(fmtNum(Math.abs(v) < 1e-9 ? 0 : v))}</td>`).join('')}</tr>`).join('')}</table>`;
}
function stepsView(o, { hideSteps = false } = {}) {
  const wrap = h('<div></div>');
  if (o.error) wrap.appendChild(h(`<div class="logs err">${esc(o.errorLine ? `#${o.errorLine}: ` : '')}${esc(o.error)}</div>`));
  const startPts = o.vertices;
  const states = [{ label: t('stepsStart'), P: startPts, T: null, minZ: Math.min(...startPts.map((p) => p[2])), sweepMinZ: null }, ...(o.steps || []).map((s) => ({ label: `${s.line}: ${s.label}`, P: cols(s.P), T: s.T, minZ: s.minZ, sweepMinZ: s.sweepMinZ }))];
  let sel = states.length - 1;
  const grid = h('<div class="steps-view"><div class="pic"></div><div class="info"></div></div>');
  wrap.appendChild(grid);
  const legend = `<div class="legend"><span><i style="border-color:var(--muted);border-top-style:dashed"></i>${esc(t('legendStart'))}</span><span><i style="border-color:var(--accent)"></i>${esc(t('legendNow'))}</span><span><i style="border-color:var(--ok);border-top-style:dashed"></i>${esc(t('legendTarget'))}</span>${o.extra?.length ? `<span><i style="border-color:var(--warn)"></i>${esc(t('legendObstacle'))}</span>` : ''}</div>`;
  const draw = () => {
    const st = states[sel];
    $('.pic', grid).innerHTML = isoSvg({ start: startPts, now: st.P, target: o.target, edges: o.edges, extra: o.extra }) + legend;
    const hdr = st.P.map((_, i) => `${t('vertex')} ${i + 1}`);
    const desc = [0, 1, 2].map((k) => st.P.map((p) => p[k])).concat([st.P.map(() => 1)]);
    const list = hideSteps ? '' : `<div class="step-list">${states.map((s, i) => `<div class="step-item ${i === sel ? 'on' : ''}" data-i="${i}"><span class="lbl">${esc(s.label)}</span> <span class="z ${s.sweepMinZ !== null && s.sweepMinZ < -1e-6 ? 'badz' : ''}">${s.sweepMinZ !== null ? `· ${esc(t('lowestZ'))}: ${fmtNum(Math.round(s.sweepMinZ * 1000) / 1000)}` : ''}</span></div>`).join('')}</div>`;
    $('.info', grid).innerHTML = `${list}<div style="margin-top:8px"><strong style="font-size:13px">${esc(st.label)}</strong>${matTable(desc, hdr)}</div>${st.T && sel === states.length - 1 ? `<div style="margin-top:6px"><strong style="font-size:13px">${esc(t('composite'))}</strong>${matTable(st.T)}</div>` : ''}`;
    $$('.step-item', grid).forEach((el) => el.addEventListener('click', () => { sel = +el.dataset.i; draw(); }));
  };
  draw();
  return wrap;
}

// ---------------------------------------------------------------- quiz & card
function renderQuiz(ex, body, exam) {
  body.innerHTML = `<div class="quiz-opts">${ex.options.map((o, i) => `<label class="quiz-opt"><input type="radio" name="q" value="${i}"><span class="md">${md(o)}</span></label>`).join('')}</div>
    <button class="btn primary" data-act="check">${esc(t('check'))}</button><div class="feedback-box"></div>`;
  $('[data-act=check]', body).addEventListener('click', () => {
    const sel = $('input[name=q]:checked', body);
    if (!sel) return;
    const choice = Number(sel.value);
    const right = choice === ex.answer;
    $$('.quiz-opt', body).forEach((l, i) => { l.classList.remove('right', 'wrong'); if (i === ex.answer) l.classList.add('right'); else if (i === choice) l.classList.add('wrong'); });
    $('.feedback-box', body).innerHTML = `<div class="feedback ${right ? 'pass' : 'fail'}"><strong>${esc(right ? t('correct') : t('notQuite'))}</strong>${ex.explain ? `<div class="md">${md(ex.explain)}</div>` : ''}</div>`;
    if (exam) { state.exam.results[ex.id] = { pass: right, score: right ? 1 : 0 }; saveExam(); }
    else { if (state.progress.quiz[ex.id] !== true) { state.progress.quiz[ex.id] = right; saveProgress(); } renderSidebar(ex.module, ex.id); }
  });
}
function renderCard(ex, body, exam) {
  const key = (exam ? 'examcard:' : 'card:') + ex.id;
  body.innerHTML = `<div class="card editor-wrap"><div class="editor-bar"><span class="lbl">${esc(t('yourAnswerCard'))}</span></div>
      <textarea class="editor" style="font-family:var(--sans);min-height:120px" placeholder="${esc(t('typeAnswer'))}"></textarea></div>
    ${exam ? `<p class="muted">${esc(t('examCardNote'))}</p>` : `<button class="btn primary" data-act="reveal" style="margin-top:10px">${esc(t('revealAnswer'))}</button><div class="ans"></div>`}`;
  const ta = $('textarea', body);
  ta.value = lsGet(key, '');
  ta.addEventListener('input', debounce(() => lsSet(key, ta.value), 300));
  const rb = $('[data-act=reveal]', body);
  if (rb) rb.addEventListener('click', () => {
    rb.remove();
    const ans = $('.ans', body);
    ans.innerHTML = `<div class="card answer"><strong>${esc(t('modelAnswer'))}</strong><div class="md">${md(ex.answerText)}</div></div>
      <div class="rate"><span class="muted" style="align-self:center">${esc(t('howDid'))}</span>
        <button class="btn" data-r="0">${esc(t('didntKnow'))}</button><button class="btn" data-r="1">${esc(t('partly'))}</button><button class="btn ok" data-r="2">${esc(t('knewIt'))}</button></div>`;
    hydrate(ans);
    $$('[data-r]', ans).forEach((b) => b.addEventListener('click', () => {
      const v = Number(b.dataset.r);
      state.progress.cards[ex.id] = v; saveProgress();
      $('.rate', ans).innerHTML = `<span class="muted">${esc(v === 2 ? t('savedGreat') : t('savedLater'))}</span>`;
      renderSidebar(ex.module, ex.id);
    }));
  });
}

// ---------------------------------------------------------------- editor helpers
function autoGrow(ta) { ta.style.height = 'auto'; ta.style.height = Math.min(Math.max(ta.scrollHeight + 4, 150), 640) + 'px'; }
function debounce(fn, ms) { let tm; return (...a) => { clearTimeout(tm); tm = setTimeout(() => fn(...a), ms); }; }
function editorKeys(ta, run, check) {
  ta.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); (e.shiftKey ? check : run)(); return; }
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end');
      ta.dispatchEvent(new Event('input'));
    }
  });
}

// ---------------------------------------------------------------- playground (image lab)
const PLAY_SAMPLE = `// Sobel edge magnitude of a sample image
const img = IMG.shapes;
const g = lib.sobel(img);
show(img, 'original');
show(g.mag, 'Sobel magnitude');
show(lib.threshold(g.mag, 200), 'edges (|G| >= 200)');
print('largest gradient:', Math.max(...g.mag.flat()));`;
const LIB_API = [
  ['histogram(img, L)', 'counts per grey level'], ['histEq(img, L)', '{hist, cdf, map, out}'], ['stretch(img, L, lo, hi)', 'linear contrast stretch'],
  ['integralImage(img)', 'summed-area table'], ['rectSum(ii, y0, x0, y1, x1)', '4 look-ups'], ['floydSteinberg(img)', 'error diffusion'],
  ['correlate(img, k, border)', 'no flip'], ['convolve(img, k, border)', 'mask flipped'], ['gaussKernel(n, σ)', ''], ['binomialKernel(n)', ''], ['median(img, n)', 'borders kept'],
  ['sobel(img)', '{gx, gy, mag, mag1, dir}'], ['prewitt(img)', ''], ['K.laplace4, K.sobelX, …', 'masks'], ['nonMaxSuppression(mag, dir)', ''], ['hysteresis(img, lo, hi)', ''],
  ['structureTensor(img, {grad, win, avg})', 'H matrix'], ['cornerResponse(img, opts)', '{lmin, harris}'], ['matchTemplate(img, t)', '{ssd, sad, cc, ncc}'],
  ['houghLines(bin, thetas)', '{acc, lines}'], ['fitLine(points)', 'least squares'], ['reduce1D(g, a)', 'pyramid REDUCE'], ['pyramids(img, levels)', '{gauss, laplace}'],
  ['Tran, RotX, RotY, RotZ, matmul', '4×4 homogeneous'], ['isodata(img)', ''], ['otsu(hist)', ''], ['niblack(img, win, k)', ''], ['labelComponents(bin, 4|8)', ''],
  ['chainCode(bin)', ''], ['chainDiff(code, N)', ''], ['shapeNumber(code, N)', ''], ['moments(bin, base)', '{m, mu, eta, hu, xc, yc, theta}'], ['lucasKanade(Ix, Iy, It)', '{u, v}'],
];
async function renderPlayground() {
  renderSidebar(null, null);
  if (!state.images) { try { state.images = await api('/images'); } catch { state.images = {}; } }
  const page = h(`<div class="page" style="max-width:1200px">
    <div class="crumbs"><a href="#/">${esc(t('home'))}</a> › ${esc(t('playground'))}</div>
    <h1>${esc(t('playground'))}</h1>
    <p class="muted">${esc(t('playIntro'))}</p>
    <div class="play-grid">
      <div>
        <div class="card editor-wrap">
          <div class="editor-bar"><button class="btn primary" data-act="run">${esc(t('run'))}</button><span class="lbl"><kbd>Ctrl</kbd>+<kbd>Enter</kbd></span><span class="spacer"></span></div>
          <textarea class="editor" spellcheck="false" placeholder="${esc(t('placeholder').play)}"></textarea>
        </div>
        <div class="output"></div>
      </div>
      <div class="card play-side" style="padding:10px 12px">
        <h4 style="margin-top:0">${esc(t('images'))}</h4>
        ${Object.entries(state.images).map(([k, v]) => `<div class="item" data-ins="IMG.${k}" title="${esc(v.info)}"><code>IMG.${k}</code><small>${v.h}×${v.w}</small></div>`).join('')}
        <h4>${esc(t('apiRef'))}</h4>
        ${LIB_API.map(([f, d]) => `<div class="item" data-ins="lib.${f.split('(')[0].split(',')[0]}" title="${esc(d)}"><code>${esc(f)}</code></div>`).join('')}
      </div>
    </div>
  </div>`);
  const ta = $('textarea', page);
  ta.value = lsGet('play:code') ?? PLAY_SAMPLE;
  const save = debounce(() => lsSet('play:code', ta.value), 300);
  ta.addEventListener('input', () => { autoGrow(ta); save(); });
  const out = $('.output', page);
  async function run() {
    out.innerHTML = `<p class="muted">${esc(t('running'))}</p>`;
    try { renderCodeOutput(out, await api('/run', { code: ta.value }), t('output')); }
    catch (e) { out.innerHTML = `<div class="feedback fail">${esc(e.message)}</div>`; }
  }
  editorKeys(ta, run, run);
  $('[data-act=run]', page).addEventListener('click', run);
  $$('[data-ins]', page).forEach((el) => el.addEventListener('click', () => { ta.setRangeText(el.dataset.ins, ta.selectionStart, ta.selectionEnd, 'end'); ta.focus(); save(); }));
  mount(page);
  autoGrow(ta);
  ta.focus();
}

// ---------------------------------------------------------------- cheat sheet drawer
async function toggleCheat() {
  const d = $('#drawer');
  d.hidden = !d.hidden;
  if (d.hidden) return;
  if (!state.cheat) {
    $('#drawerBody').innerHTML = `<p class="muted">${esc(t('loading'))}</p>`;
    state.cheat = (await api('/cheatsheet')).md;
  }
  $('#drawerBody').innerHTML = md(state.cheat);
  hydrate($('#drawerBody'));
}

// ---------------------------------------------------------------- exam mode
function saveExam() { lsSet('kepf-exam', state.exam); }
function examPoints(m) { return m.exercises.reduce((s, e) => s + (e.points || 0), 0); }
function renderExamBox(box, m) {
  const ex = state.exam;
  if (ex && !ex.finished && ex.moduleId === m.id) {
    box.innerHTML = `<div class="feedback info"><strong>${esc(t('examRunning'))}</strong> ${esc(t('examUseList'))} <button class="btn primary" id="finishBtn">${esc(t('finishExam'))}</button> <button class="btn ghost" id="abortBtn">${esc(t('abort'))}</button></div>`;
    $('#finishBtn', box).addEventListener('click', finishExam);
    $('#abortBtn', box).addEventListener('click', () => { if (confirm(t('confirmAbort'))) { state.exam = null; lsDel('kepf-exam'); clearExamDrafts(); updateTimer(); route(); } });
    return;
  }
  const exams = state.progress.exams || [];
  box.innerHTML = `<div class="card prompt"><strong>${esc(t('ready'))}</strong> ${esc(t('examInfo', m.exercises.length, m.exam.minutes, examPoints(m)))}
    ${exams.length ? `<div class="muted" style="margin-top:6px">${esc(t('prevAttempts'))} ${exams.slice(-5).map((e) => `${e.percent}% (${e.grade})`).join(', ')}</div>` : ''}
    <div style="margin-top:10px"><button class="btn primary" id="startExam">${esc(t('startExam'))}</button>
    <span class="muted" style="font-size:13px;margin-left:8px">${esc(t('practiceNote'))}</span></div></div>`;
  $('#startExam', box).addEventListener('click', () => {
    clearExamDrafts();
    state.exam = { moduleId: m.id, startedAt: Date.now(), endsAt: Date.now() + m.exam.minutes * 60000, results: {}, cardScores: {}, finished: false };
    saveExam(); updateTimer();
    location.hash = '#/e/' + m.exercises[0].id;
  });
}
function clearExamDrafts() {
  try { Object.keys(localStorage).filter((k) => /^(examdraft|examcard|examcalc):/.test(k)).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
}
function updateTimer() {
  const el = $('#examTimer');
  const ex = state.exam;
  if (!ex || ex.finished) { el.hidden = true; return; }
  const left = ex.endsAt - Date.now();
  el.hidden = false;
  if (left <= 0) { el.textContent = '00:00'; finishExam(true); return; }
  const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
  el.textContent = `⏱ ${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  el.classList.toggle('low', left < 10 * 60000);
  el.onclick = () => { location.hash = '#/m/' + ex.moduleId; };
  el.style.cursor = 'pointer';
}
function finishExam(timeUp) {
  if (!state.exam || state.exam.finished) return;
  if (timeUp !== true && !confirm(t('confirmFinish'))) return;
  state.exam.finished = true;
  state.exam.finishedAt = Date.now();
  saveExam(); updateTimer();
  location.hash = '#/exam-result';
  if (timeUp === true) route();
}
function gradeOf(p) { return p >= 85 ? 5 : p >= 70 ? 4 : p >= 55 ? 3 : p >= 40 ? 2 : 1; }
function renderExamResult() {
  const ex = state.exam;
  const m = ex ? state.modules.find((x) => x.id === ex.moduleId) : state.modules.find((x) => x.exam);
  renderSidebar(m.id, null);
  if (!ex || !ex.finished) { location.hash = '#/m/' + m.id; return; }
  const page = h(`<div class="page exam-summary"><div class="crumbs"><a href="#/">${esc(t('home'))}</a> › <a href="#/m/${m.id}">${esc(m.title)}</a> › ${esc(t('result'))}</div>
    <h1>${esc(t('examResult'))}</h1><div class="sum"></div><div class="cards-rate"></div></div>`);
  function compute() {
    let got = 0, max = 0, auto = 0, autoMax = 0;
    const rows = m.exercises.map((e) => {
      max += e.points || 0;
      let pts = 0, note = '';
      if (e.type === 'card') { const s = ex.cardScores[e.id]; pts = s === undefined ? 0 : s * e.points; note = s === undefined ? t('st').rate : t('st').self; }
      else {
        const r = ex.results[e.id];
        pts = r ? Math.round((r.score ?? (r.pass ? 1 : 0)) * e.points * 2) / 2 : 0;
        note = !r ? t('st').none : r.pass ? t('st').correct : pts > 0 ? t('st').partial : t('st').incorrect;
        autoMax += e.points; auto += pts;
      }
      got += pts;
      return `<tr><td>${esc(e.title)}</td><td>${esc(note)}</td><td style="text-align:right">${pts} / ${e.points}</td></tr>`;
    });
    const pct = Math.round(100 * got / max);
    const mins = Math.round((ex.finishedAt - ex.startedAt) / 60000);
    $('.sum', page).innerHTML = `<div class="card prompt" style="display:flex;gap:28px;align-items:center;flex-wrap:wrap">
        <div><div class="grade-big">${gradeOf(pct)}</div><div class="muted">${esc(t('grade'))}</div></div>
        <div><div class="grade-big">${pct}%</div><div class="muted">${esc(t('pointsOf', got, max))}</div></div>
        <div class="muted">${esc(t('practical', auto, autoMax))}<br>${esc(t('timeUsed', mins))}</div>
        <div><button class="btn primary" id="saveRes">${esc(t('saveResult'))}</button> <a class="btn" href="#/m/${m.id}">${esc(t('back'))}</a></div></div>
      <table><thead><tr><th>${esc(t('task'))}</th><th>${esc(t('status'))}</th><th style="text-align:right">${esc(t('pointsCol'))}</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
    $('#saveRes', page).addEventListener('click', () => {
      state.progress.exams.push({ percent: pct, grade: gradeOf(pct), points: got, max, minutes: mins, ts: new Date().toISOString() });
      saveProgress();
      state.exam = null; lsDel('kepf-exam'); clearExamDrafts();
      location.hash = '#/m/' + m.id;
    });
  }
  const cr = $('.cards-rate', page);
  const cards = m.exercises.filter((e) => e.type === 'card');
  cr.innerHTML = `<h2 style="margin-top:28px">${esc(t('scoreTheory'))}</h2>` + cards.map((e) => `
    <div class="card prompt" data-id="${e.id}"><strong>${esc(e.title)} (${e.points} p)</strong>
      <div class="md">${md(e.prompt)}</div>
      <div class="muted" style="margin-top:6px">${esc(t('yourAnswer'))}</div><pre style="white-space:pre-wrap;margin:4px 0">${esc(lsGet('examcard:' + e.id, '') || t('empty'))}</pre>
      <div class="card answer"><strong>${esc(t('modelAnswer'))}</strong><div class="md">${md(e.answerText)}</div></div>
      <div class="rate"><button class="btn" data-s="0">${esc(t('zeroPts'))}</button><button class="btn" data-s="0.5">${esc(t('halfPts'))}</button><button class="btn" data-s="1">${esc(t('fullPts'))}</button></div>
    </div>`).join('');
  $$('[data-s]', cr).forEach((b) => b.addEventListener('click', () => {
    const id = b.closest('[data-id]').dataset.id;
    ex.cardScores[id] = Number(b.dataset.s); saveExam();
    $$('[data-s]', b.parentElement).forEach((x) => x.classList.remove('primary'));
    b.classList.add('primary');
    compute();
  }));
  cards.forEach((e) => { const s = ex.cardScores[e.id]; if (s !== undefined) $(`[data-id="${e.id}"] [data-s="${s}"]`, cr)?.classList.add('primary'); });
  compute();
  mount(page);
}

// ---------------------------------------------------------------- boot
async function loadContent() {
  const mods = await api('/modules');
  state.modules = mods;
  state.byId = new Map();
  for (const m of mods) for (const e of m.exercises) state.byId.set(e.id, e);
}
async function setLang(lang) {
  if (!window.I18N[lang] || lang === state.lang) return;
  state.lang = lang; lsSet('lang', lang);
  state.cheat = null;
  renderChrome();
  await loadContent();
  if (!$('#drawer').hidden) { $('#drawer').hidden = true; toggleCheat(); }
  route();
}
async function boot() {
  const theme = lsGet('theme');
  if (theme) document.documentElement.dataset.theme = theme;
  renderChrome();
  $('#themeBtn').addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'light' : 'dark';
    lsSet('theme', document.documentElement.dataset.theme);
  });
  $('#langSel').addEventListener('change', (e) => setLang(e.target.value));
  $('#cheatBtn').addEventListener('click', toggleCheat);
  $('#drawerClose').addEventListener('click', toggleCheat);
  $('#menuBtn').addEventListener('click', () => document.body.classList.toggle('menu-open'));
  try {
    await loadContent();
  } catch (e) {
    $('#main').innerHTML = `<div class="page"><div class="feedback fail"><strong>${esc(t('serverDown'))}</strong> ${t('serverDownHelp')}<pre>${esc(e.message)}</pre></div></div>`;
    return;
  }
  window.addEventListener('hashchange', route);
  setInterval(updateTimer, 1000);
  updateTimer();
  route();
}
boot();
