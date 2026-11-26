import { L, q, c } from './util.js';

const small = [
  [12, 40, 40, 200, 210],
  [15, 45, 180, 220, 230],
  [10, 170, 190, 225, 240],
  [160, 175, 200, 230, 250],
];
const tiny = [[0, 3, 7], [1, 5, 6], [2, 2, 4]];
const cube = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
const cubeEdges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];

export default {
  id: 'start',
  title: 'Start here',
  lab: 'Intro',
  lesson: '00-start.md',
  exercises: [
    {
      id: 'start-1', type: 'calc', title: 'Reading a pixel',
      prompt: 'In the tables of this course (and of the ZH) **x is the column index, growing to the right**, **y is the row index, growing downwards**, and both start at **1**.\n\nWhat is the intensity at **x = 4, y = 2**? And at **x = 2, y = 4**?',
      grids: [{ title: 'f(x, y)', data: small }],
      fields: [{ key: 'a', label: 'f(4, 2)', int: true }, { key: 'b', label: 'f(2, 4)', int: true }],
      solve: () => ({ a: small[1][3], b: small[3][1] }),
      hints: ['Go to column 4 first, then down to row 2.'],
      explain: 'f(4, 2) is in row 2, column 4 → 220. f(2, 4) is in row 4, column 2 → 175. In code (0-based) the same pixels are `img[1][3]` and `img[3][1]` – the **row comes first**.',
    },
    {
      id: 'start-2', type: 'calc', title: 'Your first matrix answer',
      prompt: 'The 3×3 image below has **L = 8** grey levels (0…7). Compute its **negative** s = (L − 1) − r and type the result into the grid.\n\nTip: you can paste a whole table (e.g. from a spreadsheet) into the first cell.',
      grids: [{ title: 'r', data: tiny }],
      fields: [{ key: 'neg', label: 'negative image', shape: [3, 3], int: true }],
      solve: () => ({ neg: L.negate(tiny, 8) }),
      hints: ['7 − 0 = 7, 7 − 3 = 4, …'],
      explain: 'Every pixel independently: s = 7 − r. A point operation never looks at the neighbours.',
    },
    {
      id: 'start-3', type: 'calc', title: 'Expressions are fine',
      prompt: 'Answer cells accept expressions, so you do not have to round by hand: `sqrt(2)/2`, `3/4`, `cos(45)` (degrees!), `pi/4`, and the Hungarian decimal comma `0,5` all work.\n\nType the value of **cos 45°** in any form.',
      fields: [{ key: 'v', label: 'cos 45°' }],
      solve: () => ({ v: Math.SQRT1_2 }),
      explain: 'cos 45° = √2 / 2 ≈ 0.7071. Values are accepted within a small tolerance (about ±0.01 or 0.5 %).',
    },
    {
      id: 'start-4', type: 'code', title: 'Your first image function',
      prompt: 'Code tasks give you a function to write in **JavaScript**. Images are arrays of rows: `img[y][x]`, values 0…255.\n\nWrite `invert(img)` that returns a **new** image with every value replaced by **255 − value**. Press **Run** to see your output as a picture, **Check** to grade it on several test images.',
      fn: 'invert',
      starter: 'function invert(img) {\n  // img.length = number of rows, img[0].length = number of columns\n  return img.map(row => row.map(v => v));\n}',
      solution: 'function invert(img) {\n  return img.map(row => row.map(v => 255 - v));\n}',
      tests: [['@img:shapes'], [[[0, 128, 255]]], ['@img:gradient']],
      display: 'image',
      hints: ['Only the inner arrow function has to change.'],
      explain: 'Helpers available in every code task: `zeros(h, w, v)`, `clone(img)`, `shape(img)` → [h, w], `clamp(v, lo, hi)`, `round(v, d)`, `print(...)`, `show(img, title)`.',
    },
    {
      id: 'start-5', type: 'steps', title: 'Moving an object',
      prompt: 'Transformation tasks: write **one elementary transformation per line**; each one is applied in the **base (world) frame** – so the composite matrix is T = Mₙ · … · M₂ · M₁.\n\nMove the unit cube so that it ends up at **x ∈ [3, 4]** (y and z unchanged). Press **Run** to see the position after every step.',
      vertices: cube, edges: cubeEdges,
      target: cube.map(([x, y, z]) => [x + 3, y, z]),
      constraints: { minZ: 0, rigid: true },
      starter: '# e.g. Tran(1, 0, 0)\n',
      solution: 'Tran(3, 0, 0)',
      hints: ['A single translation along x is enough: `Tran(3, 0, 0)`.'],
      explain: 'Available commands: `Tran(x, y, z)`, `Rx(a)`, `Ry(a)`, `Rz(a)` (degrees) and `Ry(a) about (px, py, pz)` for a rotation about an axis parallel to y through a point.',
    },
    q('start-6', 'Row or column?', 'In code, which index comes first in `img[i][j]`?',
      ['The column (x)', 'The row (y)', 'It depends on the image size', 'The colour channel'], 1,
      '`img[y][x]`: the outer array is the list of rows. The ZH tables use the same layout, only 1-based.'),
    c('start-7', 'Digital image', 'What makes an image **digital**? Name the two steps.',
      'A digital image is a 2-D function f(x, y) where **x, y and f are all discrete**.\n\n- **Sampling** – the continuous image is measured only at grid points (pixels) → discrete x, y.\n- **Quantisation** – the measured amplitude is rounded to one of L levels (e.g. 256 for 8 bits) → discrete f.'),
  ],
};
