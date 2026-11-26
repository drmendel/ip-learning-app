// Loads every module, its lesson and the translations.
//   content/mNN-*.js            : module definition (English texts + reference solutions)
//   content/lessons/*.md        : English lessons
//   content/lessons/<lang>/*.md : translated lessons
//   content/i18n/<lang>/<moduleId>.js : translated exercise texts (English is the fallback)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import start from './m00-start.js';
import basics from './m01-basics.js';
import intensity from './m02-intensity.js';
import filters from './m03-filters.js';
import edges from './m04-edges.js';
import features from './m05-features.js';
import hough from './m06-hough.js';
import pyramids from './m07-pyramids.js';
import transforms from './m08-transforms.js';
import segmentation from './m09-segmentation.js';
import shape from './m10-shape.js';
import motion from './m11-motion-faces.js';
import theory from './m12-theory.js';
import practice from './m13-practice.js';
import mockzh from './m14-mock-zh.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const modules = [start, basics, intensity, filters, edges, features, hough, pyramids, transforms, segmentation, shape, motion, theory, practice, mockzh]
  .map((m) => ({
    ...m,
    lessonText: m.lesson && fs.existsSync(path.join(__dirname, 'lessons', m.lesson)) ? fs.readFileSync(path.join(__dirname, 'lessons', m.lesson), 'utf8') : '',
    exercises: m.exercises.map((e) => ({ ...e, module: m.id })),
  }));

export const exerciseById = new Map();
for (const m of modules) {
  for (const e of m.exercises) {
    if (exerciseById.has(e.id)) throw new Error('duplicate exercise id ' + e.id);
    exerciseById.set(e.id, e);
  }
}

// ---------------------------------------------------------------- translations
export const LANGUAGES = ['en', 'hu'];
const TEXT_FIELDS = ['title', 'prompt', 'hints', 'options', 'explain', 'answerText', 'starter'];

export const overlays = {};
for (const lang of LANGUAGES.filter((l) => l !== 'en')) {
  overlays[lang] = {};
  const dir = path.join(__dirname, 'i18n', lang);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
    overlays[lang][path.basename(f, '.js')] = (await import(pathToFileURL(path.join(dir, f)).href)).default;
  }
}

function localizeExercise(e, ov) {
  if (!ov) return e;
  const out = { ...e };
  for (const k of TEXT_FIELDS) if (ov[k] !== undefined) out[k] = ov[k];
  if (e.fields && ov.labels) out.fields = e.fields.map((f) => ({ ...f, label: ov.labels[f.key] ?? f.label }));
  if (e.grids && ov.grids) out.grids = e.grids.map((g, i) => ({ ...g, title: ov.grids[i] ?? g.title }));
  for (const k of ['require', 'forbid']) if (e[k] && ov[k]) out[k] = e[k].map(([re, m], i) => [re, ov[k][i] ?? m]);
  return out;
}

function localizeModule(m, lang) {
  const ov = overlays[lang]?.[m.id];
  const lessonFile = m.lesson && path.join(__dirname, 'lessons', lang, m.lesson);
  return {
    ...m,
    title: ov?.title ?? m.title,
    lab: ov?.lab ?? m.lab,
    lessonText: lessonFile && fs.existsSync(lessonFile) ? fs.readFileSync(lessonFile, 'utf8') : m.lessonText,
    exercises: m.exercises.map((e) => localizeExercise(e, ov?.exercises?.[e.id])),
  };
}

const cache = { en: { modules, byId: exerciseById } };
export function contentFor(lang) {
  if (!LANGUAGES.includes(lang)) lang = 'en';
  if (!cache[lang]) {
    const mods = modules.map((m) => localizeModule(m, lang));
    const byId = new Map();
    for (const m of mods) for (const e of m.exercises) byId.set(e.id, e);
    cache[lang] = { modules: mods, byId };
  }
  return cache[lang];
}

/** The reference sheet shown in the side drawer. */
export function cheatsheet(lang) {
  const f = path.join(__dirname, 'lessons', lang, 'cheatsheet.md');
  return fs.readFileSync(fs.existsSync(f) ? f : path.join(__dirname, 'lessons', 'cheatsheet.md'), 'utf8');
}
