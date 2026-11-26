// Helpers for writing exercises (see CONTENT_GUIDE.md).
export * as L from '../engines/imglib.js';
export { rigidMapsCheck } from '../engines/grade.js';

export const q = (id, title, prompt, options, answer, explain = '') => ({ id, type: 'quiz', title, prompt, options, answer, explain });
export const c = (id, title, prompt, answerText) => ({ id, type: 'card', title, prompt, answerText });

/** Markdown table of a matrix (optional 1-based row/column headers). */
export function mdMatrix(m, { header = true, base = 1, fmt = (v) => String(v) } = {}) {
  const w = m[0].length;
  if (!header) return ['| ' + m[0].map(fmt).join(' | ') + ' |', '|' + ' --- |'.repeat(w), ...m.slice(1).map((r) => '| ' + r.map(fmt).join(' | ') + ' |')].join('\n');
  const head = '| y \\ x | ' + Array.from({ length: w }, (_, i) => i + base).join(' | ') + ' |';
  return [head, '|' + ' --- |'.repeat(w + 1), ...m.map((r, i) => `| **${i + base}** | ` + r.map(fmt).join(' | ') + ' |')].join('\n');
}
/** Matrix as plain text block (for code-fenced display in prompts). */
export const txtMatrix = (m) => m.map((r) => r.map((v) => String(v).padStart(4)).join(' ')).join('\n');
