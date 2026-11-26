# Writing content for ip-learning-app

One module = four files:

| File | Content |
| --- | --- |
| `content/mNN-name.js` | Module definition: English texts + reference solutions (`export default { id, title, lab, lesson, exercises }`) |
| `content/i18n/hu/<moduleId>.js` | Hungarian texts for every exercise (`export default { title, lab, exercises: { id: {...} } }`) |
| `content/lessons/NN-name.md` | English lesson (markdown) |
| `content/lessons/hu/NN-name.md` | Hungarian lesson |

`content/m00-start.js` + `content/i18n/hu/start.js` + `content/lessons/00-start.md` show every exercise type. Copy their style.

Run the self-test for one module: `deno run -A test/verify.js <moduleId>` (or `node test/verify.js <moduleId>`). It must end with `0 failed`.

## Conventions (state them in prompts where relevant)

- An image is `f(x, y)`: **x = column (right), y = row (down)**. ZH-style tables are **1-based** (`grids` show 1-based headers by default). Code is **0-based**: `img[y][x]`.
- Derivative masks are applied as **correlation** (no flip): fx = right − left, fy = bottom − top (y grows downwards). `L.K.sobelX = [[-1,0,1],[-2,0,2],[-1,0,1]]`, `L.K.sobelY = [[-1,-2,-1],[0,0,0],[1,2,1]]`.
- Convolution (lecture definition) flips the mask: `y(i,j) = Σ h(k,l) x(i−k, j−l)`; correlation does not. For symmetric masks they are equal.
- Gradient magnitude: Euclidean `√(fx²+fy²)` or Manhattan `|fx|+|fy|`; direction `atan2(fy, fx)` in degrees.
- Always say how borders are handled (border pixels unchanged / zero padding / only inner pixels asked).
- Always say how to round (histogram equalisation: `s = round((L−1)·cdf)`, round half up).
- Angles are in **degrees** everywhere.

## Exercise types

### calc – typed numbers / matrices (the main type: ZH-style hand calculation)

```js
{
  id: 'flt-3', type: 'calc', title: 'Box filter by hand',
  prompt: 'markdown …',
  grids: [{ title: 'f', data: [[...], ...], highlight: [[r, c], ...] /* 0-based cells */, base: 1, image: false }],
  fields: [
    { key: 'g', label: 'g (inner 3×3)', shape: [3, 3], int: true },   // matrix input
    { key: 'v', label: 'g(2, 3)' },                                    // single number
    { key: 'sn', label: 'shape number', kind: 'str' },                 // short text, spaces ignored
    { key: 'lines', label: 'θ, ρ of both lines', shape: [2, 2], unordered: 'rows' }, // row order free
  ],
  solve: () => ({ g: ..., v: ..., sn: '0123', lines: [[0, 1], [90, 3]] }), // computed with L.* – never hard-code what you can compute
  hints: ['…'], explain: 'worked solution (markdown) shown with the model answer',
  wrong: [{ v: '12' }],   // optional: answers that MUST be rejected (checked by the self-test)
}
```

- Tolerance: ±0.011 absolute or 0.5 % relative (whichever is larger). `int: true` → exact. `tol: 0.1` to loosen.
- Optional per field: `rowLabels`, `colLabels` (arrays of strings), `pts` (points, mock exam), `check: (value, lang) => true | 'message'` (custom checker; value = number or matrix).
- Keep inputs reasonable: ≤ ~40 cells per field, ≤ ~80 per exercise.
- `grids` render the given data as a ZH-style table (1-based headers, highlighted cells); `image: true` also draws it as a grey image.

### code – implement a function in JavaScript

```js
{
  id: 'flt-5', type: 'code', title: 'Median filter', prompt: '…', fn: 'median3',
  starter: 'function median3(img) {\n  // …\n  return clone(img);\n}',
  solution: 'function median3(img) { … }',        // a STRING – it runs in the sandbox, so it may only use the helpers below
  tests: [['@img:saltpepper'], [[[1,2,3],[4,5,6],[7,8,9]]]],   // argument lists; '@img:name' = sample image
  display: 'image',                                // 'image' | 'auto'
  tol: { abs: 1e-6 },                              // optional
  hints: [...], explain: '…',
  wrong: ['function median3(img){ return img; }'], // optional: must fail
}
```

Sandbox helpers (no `lib` in exercises!): `zeros(h, w, v=0)`, `clone(img)`, `shape(img)`, `clamp(v, lo=0, hi=255)`, `round(v, d=0)`, `fromFn(h, w, (y, x) => …)`, `print`, `show`, `Math`. Sample images (`engines/images.js`): shapes, noisy, saltpepper, lowcontrast, dark, gradient, checker, step, lines, blob, frame1, frame2, zh. The starter must NOT pass.

### steps – 3-D transformation sequences

```js
{ id, type: 'steps', title, prompt, vertices: [[x,y,z],...], edges: [[i,j],...], target: [[x,y,z],...],
  constraints: { minZ: 0, rigid: true }, solution: 'Tran(-1,0,0)\nRy(90)\nTran(4,0,0)', starter: '# …', extra: [{ vertices, edges }] /* obstacles drawn in orange */ }
```

Commands: `Tran(x,y,z)`, `Rx(a)`, `Ry(a)`, `Rz(a)`, `Ry(a) about (px,py,pz)`; applied in the base frame (T = Mn·…·M1). Target = point set (order ignored).

### quiz / card

```js
import { L, q, c, mdMatrix } from './util.js';
q('id', 'title', 'question (markdown)', ['option', 'option', …], correctIndex, 'explanation'),
c('id', 'title', 'question', 'model answer (markdown)'),
```

## Hungarian overlay

```js
const q = (title, prompt, options, explain) => ({ title, prompt, options, explain });
const c = (title, prompt, answerText) => ({ title, prompt, answerText });
export default {
  title: '…', lab: '…',
  exercises: {
    'flt-3': { title, prompt, hints: [...same length], explain, labels: { g: '…', v: '…' }, grids: ['title of grid 0', …] },
    'flt-9': q('…', '…', ['…', …], '…'),
  },
};
```

Every field with a `label` needs `labels[key]`; if any grid has a title, `grids` must list a title for every grid. Hints/options arrays must have the same length as in English. Use the Hungarian terminology of the lectures (e.g. küszöbölés, élkiemelés, nyomaték, súlypont, alakszám, lánckód, hisztogram kiegyenlítés, maszk, konvolúció, korreláció).

## Lesson markdown

Headings, lists, tables, `> quotes`, inline `code`, fenced code. Two special fences:

- ```` ```js ```` – gets a **▶ Try** button that opens it in the Image lab (full `lib` + `IMG` available there).
- ```` ```grid ```` – a ZH-style pixel table; optional first line `# title`; a trailing `*` highlights a cell (`123*`); add `image` after `grid` to also draw it.

No HTML, no LaTeX – write formulas with Unicode (Σ, √, ², ·, θ, σ, μ, ∇, ≈, ≤).
