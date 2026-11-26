import { L, q, c } from './util.js';

const S = (m) => m.map((r) => r.map(String)); // matrix → strings (for `wrong` answers)
const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

// 1-D differences
const f1 = [10, 10, 10, 20, 50, 80, 90, 90, 90];
const fwd = () => f1.slice(0, -1).map((v, i) => f1[i + 1] - v);
const sec = () => f1.slice(1, -1).map((v, i) => f1[i + 2] - 2 * v + f1[i]); // x = 2 … n−1
function zeroCross() {
  const d = sec(); // d[i] belongs to x = i + 2 (1-based)
  for (let i = 0; i < d.length; i++) {
    if (d[i] === 0 && i > 0 && i < d.length - 1 && d[i - 1] * d[i + 1] < 0) return i + 2; // {+,0,−}
    if (i + 1 < d.length && d[i] * d[i + 1] < 0) return i + 2.5; // between two samples
  }
  return NaN;
}
// one-pixel gradient operators
const p2 = [[10, 20, 60], [20, 50, 90], [40, 80, 100]];
const at = (k) => L.correlate(p2, k, 'valid')[0][0];
const rob2 = L.sub(p2, 1, 1, 2, 2); // centre pixel = top-left of the Roberts 2×2 window
// Sobel on a square
const sq = L.fromFn(7, 7, (y, x) => (y >= 2 && y <= 4 && x >= 2 && x <= 4 ? 10 : 0));
// compass masks
const pc = [[90, 100, 100], [30, 80, 100], [10, 20, 60]];
const ring = [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0], [1, 0]];
function kirschMasks() {
  const base = [5, 5, 5, -3, -3, -3, -3, -3];
  return Array.from({ length: 8 }, (_, r) => { const k = L.zeros(3, 3); ring.forEach(([y, x], i) => { k[y][x] = base[(i - r + 8) % 8]; }); return k; });
}
const resp = (masks) => masks.map((k) => L.correlate(pc, k, 'valid')[0][0]);
const argmax = (a) => a.indexOf(Math.max(...a));
// non-maximum suppression
const magN = [[10, 40, 90, 50, 10], [12, 45, 95, 60, 15], [8, 50, 85, 88, 20], [10, 30, 70, 92, 40], [5, 20, 40, 80, 75]];
const dirN = [[0, 0, 45], [0, 45, 0], [135, 90, 45]];
const dirFull = L.fromFn(5, 5, (y, x) => (y > 0 && y < 4 && x > 0 && x < 4 ? dirN[y - 1][x - 1] : 0));
// hysteresis
const hyImg = [[0, 0, 120, 0, 0, 0], [0, 60, 0, 0, 45, 0], [0, 70, 0, 0, 0, 30], [0, 0, 50, 110, 0, 0], [80, 0, 0, 0, 55, 90]];
// SUSAN
const suImg = [[10, 12, 11, 50, 52], [11, 10, 13, 48, 55], [12, 14, 15, 51, 50], [10, 11, 47, 49, 53], [13, 12, 50, 52, 48]];
// expected-position vertical edge (5 × 10)
const vImg = [
  [21, 20, 40, 113, 119, 120, 112, 42, 23, 20],
  [19, 22, 42, 108, 121, 118, 111, 47, 22, 18],
  [20, 23, 39, 110, 122, 115, 113, 45, 21, 21],
  [22, 21, 41, 109, 120, 119, 110, 46, 22, 19],
  [18, 24, 38, 110, 118, 118, 114, 45, 22, 22],
];
const colSums = () => vImg[0].map((_, x) => L.sum(vImg.map((r) => r[x])));
const diffC = (s) => s.slice(1, -1).map((_, i) => s[i + 2] - s[i]);
const T8 = 200;
function peaks(e, T, first) { // local maxima of |e| above T; e[i] belongs to position i + first
  const out = [];
  for (let i = 0; i < e.length; i++) {
    const a = Math.abs(e[i]), l = i > 0 ? Math.abs(e[i - 1]) : -Infinity, r = i + 1 < e.length ? Math.abs(e[i + 1]) : -Infinity;
    if (a >= T && a > l && a > r) out.push({ pos: i + first, val: e[i] });
  }
  return out;
}
// expected-position 45° edge (7 × 7, band 4 ≤ x+y ≤ 12, −2 ≤ x−y ≤ 3, 1-based)
const dImg = [
  [28, 30, 32, 29, 31, 38, 80],
  [31, 28, 30, 32, 39, 81, 113],
  [29, 31, 28, 40, 82, 114, 121],
  [32, 29, 41, 78, 115, 122, 119],
  [30, 42, 79, 116, 118, 120, 122],
  [38, 80, 117, 119, 121, 118, 120],
  [81, 113, 120, 122, 119, 121, 118],
];
const band = [];
for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) { const k = x + y + 2, d = x - y; if (k >= 4 && k <= 12 && d >= -2 && d <= 3) band.push([y, x]); }
const diagSums = () => { const s = []; for (let k = 4; k <= 12; k++) s.push(L.sum(band.filter(([y, x]) => x + y + 2 === k).map(([y, x]) => dImg[y][x]))); return s; };
const T9 = 100;

export default {
  id: 'edges',
  title: 'Edge detection',
  lab: 'Lecture 6',
  lesson: '04-edges.md',
  exercises: [
    {
      id: 'edg-1', type: 'calc', title: '1-D differences and the zero crossing',
      prompt: 'Horizontal intensity profile (x = 1 … 9):\n\n**f = [10 10 10 20 50 80 90 90 90]**\n\n1. Forward difference **d(x) = f(x+1) − f(x)** for x = 1 … 8.\n2. Second difference **d₂(x) = f(x+1) − 2f(x) + f(x−1)** for x = 2 … 8.\n3. At which x does the second difference have its **zero crossing** (the edge position)?',
      fields: [
        { key: 'd', label: 'd(x), x = 1…8', shape: [1, 8], int: true },
        { key: 'd2', label: 'd₂(x), x = 2…8', shape: [1, 7], int: true },
        { key: 'x0', label: 'zero crossing at x =' },
      ],
      solve: () => ({ d: [fwd()], d2: [sec()], x0: zeroCross() }),
      wrong: [{ x0: '4' }, { x0: '6' }],
      hints: ['d = [0 0 10 30 30 10 0 0].', 'd₂ changes sign from + to − and passes through 0 exactly at one sample.'],
      explain: 'd = [0 0 10 30 30 10 0 0] – the first derivative is large along the whole ramp (thick edge).\n\nd₂ = [0 10 20 0 −20 −10 0] for x = 2 … 8: positive at the bottom of the ramp, negative at the top, and **0 at x = 5** between +20 and −20 (the {+, 0, −} case of the lecture). The zero crossing marks the middle of the edge, where the first derivative is maximal (f(5) = 50, the central difference f(6) − f(4) = 60 is the largest).',
    },
    {
      id: 'edg-2', type: 'calc', title: 'Sobel, Prewitt and Roberts at one pixel',
      prompt: 'Compute the gradient at the **centre pixel** of the 3×3 neighbourhood (masks as **correlation**; fx = right − left, fy = bottom − top, y grows downwards).\n\n- **Sobel**: fx, fy, the magnitude with the **Euclidean** √(fx² + fy²) and the **Manhattan** |fx| + |fy| norm, and the direction θ = atan2(fy, fx) in degrees.\n- **Prewitt**: fx, fy.\n- **Roberts cross** on the 2×2 window whose top-left pixel is the centre pixel: r₁ = f(x, y) − f(x+1, y+1), r₂ = f(x+1, y) − f(x, y+1).',
      grids: [{ title: 'f (3×3 neighbourhood)', data: p2, highlight: [[1, 1]] }],
      fields: [
        { key: 'sx', label: 'Sobel fx', int: true },
        { key: 'sy', label: 'Sobel fy', int: true },
        { key: 'mag', label: '√(fx² + fy²)' },
        { key: 'mag1', label: '|fx| + |fy|', int: true },
        { key: 'dir', label: 'θ (degrees)' },
        { key: 'px', label: 'Prewitt fx', int: true },
        { key: 'py', label: 'Prewitt fy', int: true },
        { key: 'r1', label: 'Roberts r₁', int: true },
        { key: 'r2', label: 'Roberts r₂', int: true },
      ],
      solve: () => {
        const sx = at(L.K.sobelX), sy = at(L.K.sobelY);
        return {
          sx, sy, mag: Math.hypot(sx, sy), mag1: Math.abs(sx) + Math.abs(sy), dir: L.deg(Math.atan2(sy, sx)),
          px: at(L.K.prewittX), py: at(L.K.prewittY),
          r1: L.correlate(rob2, L.K.robertsA, 'valid')[0][0], r2: L.correlate(rob2, L.K.robertsB, 'valid')[0][0],
        };
      },
      wrong: [{ dir: String(L.deg(Math.atan2(250, 190))) }, { sx: '180' }],
      hints: [
        'Sobel fx = (x2 + 2·x5 + x8) − (x0 + 2·x3 + x6) = (60 + 180 + 100) − (10 + 40 + 40).',
        'Roberts window: [50 90; 80 100].',
      ],
      explain: 'Pixel numbering x0 … x8 row by row: 10 20 60 / 20 50 90 / 40 80 100.\n\n- Sobel fx = (60 + 2·90 + 100) − (10 + 2·20 + 40) = 340 − 90 = **250**; fy = (40 + 2·80 + 100) − (10 + 2·20 + 60) = 300 − 110 = **190**.\n- Euclidean magnitude √(250² + 190²) = √98600 ≈ **314.0**; Manhattan 250 + 190 = **440**.\n- θ = atan2(190, 250) ≈ **37.2°** – the gradient points right and down (towards the bright lower-right corner); the edge itself runs perpendicular to it.\n- Prewitt (weights 1 1 1): fx = (60 + 90 + 100) − (10 + 20 + 40) = **180**, fy = (40 + 80 + 100) − (10 + 20 + 60) = **130**.\n- Roberts: r₁ = 50 − 100 = **−50**, r₂ = 90 − 80 = **10** (|r₁| + |r₂| = 60).',
    },
    {
      id: 'edg-3', type: 'calc', title: 'Sobel on a bright square',
      prompt: 'The 7×7 image is 0 except for a 3×3 square of value 10 (x, y = 3 … 5). Apply the Sobel masks (correlation, fx = right − left, fy = bottom − top) and give **fx** and **fy** for the **inner 5×5 pixels** (x, y = 2 … 6). Then give the Manhattan magnitude |fx| + |fy| at the corner pixel **(3, 3)**.',
      grids: [{ title: 'f', data: sq, image: true }],
      fields: [
        { key: 'gx', label: 'fx (x, y = 2…6)', shape: [5, 5], int: true },
        { key: 'gy', label: 'fy (x, y = 2…6)', shape: [5, 5], int: true },
        { key: 'm', label: '|fx| + |fy| at (3, 3)', int: true },
      ],
      solve: () => {
        const gx = L.correlate(sq, L.K.sobelX, 'valid'), gy = L.correlate(sq, L.K.sobelY, 'valid');
        return { gx, gy, m: Math.abs(gx[1][1]) + Math.abs(gy[1][1]) };
      },
      wrong: [{ gx: S(L.correlate(sq, L.K.sobelY, 'valid')) }, { gx: S(L.convolve(sq, L.K.sobelX, 'valid')) }],
      hints: [
        'At (2, 4) (left of the square, middle row) only the right column of the mask sees the square: fx = 10 + 2·10 + 10 = 40.',
        'fy is fx transposed: the square is symmetric.',
      ],
      explain: 'fx (rows y = 2 … 6):\n\n| 10 | 10 | 0 | −10 | −10 |\n| --- | --- | --- | --- | --- |\n| 30 | 30 | 0 | −30 | −30 |\n| 40 | 40 | 0 | −40 | −40 |\n| 30 | 30 | 0 | −30 | −30 |\n| 10 | 10 | 0 | −10 | −10 |\n\nfy is its transpose (positive above the square, negative below). The response is **two pixels wide** on each side (columns 2 and 3 both give 40) – the 3×3 mask smooths but localises worse. The centre column is 0 because the left and right sides cancel. At the corner (3, 3): fx = 30, fy = 30 → |fx| + |fy| = **60**.',
    },
    {
      id: 'edg-4', type: 'calc', title: 'Robinson and Kirsch compass masks',
      prompt: 'Compass masks measure the edge in 8 directions; the strongest response gives the magnitude and its mask the direction.\n\n- **Robinson** N mask: [1 2 1; 0 0 0; −1 −2 −1]. **Kirsch** N mask: [5 5 5; −3 0 −3; −3 −3 −3].\n- The other masks are obtained by rotating the outer ring of weights **clockwise by one cell** (45°): N, NE, E, SE, S, SW, W, NW – named after the side where the large positive weights sit (Robinson NE = [0 1 2; −1 0 1; −2 −1 0], Kirsch NE = [−3 5 5; −3 0 5; −3 −3 −3]).\n\nApply all 16 masks (correlation) at the centre pixel. Give the responses in the order N, NE, E, SE, S, SW, W, NW, and the direction name of the maximal response for both operators.',
      grids: [{ title: 'f (3×3 neighbourhood)', data: pc, highlight: [[1, 1]] }],
      fields: [
        { key: 'r', label: 'Robinson N … NW', shape: [1, 8], int: true, colLabels: DIRS },
        { key: 'k', label: 'Kirsch N … NW', shape: [1, 8], int: true, colLabels: DIRS },
        { key: 'dr', label: 'Robinson max direction (e.g. SW)', kind: 'str' },
        { key: 'dk', label: 'Kirsch max direction', kind: 'str' },
      ],
      solve: () => {
        const r = resp(L.robinsonMasks()), k = resp(kirschMasks());
        return { r: [r], k: [k], dr: DIRS[argmax(r)], dk: DIRS[argmax(k)] };
      },
      wrong: [{ dr: 'SW' }, { dk: 'N' }],
      hints: [
        'Robinson N = (90 + 2·100 + 100) − (10 + 2·20 + 60) = 280.',
        'The opposite mask is the negative: S = −N, SW = −NE, … so you only need 4 of the 8.',
      ],
      explain: 'Robinson: N 280, NE 330, E 200, SE −70, S −280, SW −330, W −200, NW 70 → maximum **330 at NE**.\n\nKirsch: N 790, NE 870, E 550, SE −90, S −810, SW −1050, W −490, NW 230 → maximum **870 at NE**.\n\nThe bright region is the upper-right corner, so the NE masks respond most. For Robinson the opposite mask is exactly the negative (S = −N); for Kirsch it is not (N = 790 but S = −810), because its ring has three 5s and five −3s. Note the minimum (SW) would also mark the edge with the opposite polarity – the compass operators take the **maximum**, which encodes the direction of the brighter side.',
    },
    {
      id: 'edg-5', type: 'calc', title: 'Non-maximum suppression',
      prompt: 'Canny step 2: the gradient magnitude E_s and the **quantised gradient direction** (0°, 45°, 90°, 135°) of the inner 3×3 pixels are given. Keep a pixel only if its magnitude is **≥ both neighbours along the gradient direction**, otherwise set it to 0.\n\nWith y growing **downwards**: 0° → compare left/right, 90° → up/down, **45° → lower-right and upper-left**, **135° → lower-left and upper-right**. Give the result for the inner 3×3 pixels (x, y = 2 … 4).',
      grids: [
        { title: 'E_s (magnitude)', data: magN, highlight: [[1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3], [3, 1], [3, 2], [3, 3]] },
        { title: 'direction (inner 3×3, °)', data: dirN },
      ],
      fields: [{ key: 'n', label: 'I_N (x, y = 2…4)', shape: [3, 3], int: true }],
      solve: () => ({ n: L.sub(L.nonMaxSuppression(magN, dirFull), 1, 1, 3, 3) }),
      wrong: [{ n: [['0', '95', '0'], ['0', '0', '88'], ['0', '0', '0']] }, { n: [['0', '95', '0'], ['0', '85', '88'], ['0', '0', '92']] }],
      hints: [
        '(2, 2) = 45, direction 0°: neighbours 12 and 95 → suppressed.',
        '(4, 2) = 60, direction 45°: lower-right (5, 3) = 20, upper-left (3, 1) = 90 → suppressed.',
      ],
      explain: '- (2, 2) 45, 0°: 12 / 95 → 0. (3, 2) 95, 0°: 45 / 60 → **95**. (4, 2) 60, 45°: 20 / 90 → 0.\n- (2, 3) 50, 0°: 8 / 85 → 0. (3, 3) 85, 45°: 92 / 45 → 0. (4, 3) 88, 0°: 85 / 20 → **88**.\n- (2, 4) 30, 135°: lower-left 5 / upper-right 85 → 0. (3, 4) 70, 90°: 40 / 85 → 0. (4, 4) 92, 45°: 75 / 85 → **92**.\n\nOnly the ridge of the magnitude survives, so the edge becomes **one pixel wide**. Mixing up the y direction (treating 45° as upper-right / lower-left) would wrongly keep (3, 3) = 85 as well.',
    },
    {
      id: 'edg-6', type: 'calc', title: 'Hysteresis thresholding',
      prompt: 'Canny step 3 on the result of non-maximum suppression, with **low threshold l = 40** and **high threshold h = 100**:\n\n- value ≥ h → edge (strong);\n- value < l → not an edge;\n- l ≤ value < h → edge **only if it is connected** to a strong pixel through edge pixels (8-neighbourhood, chains of weak pixels allowed).\n\nGive the binary edge map (1 = edge).',
      grids: [{ title: 'I_N', data: hyImg }],
      fields: [{ key: 'e', label: 'edge map', shape: [5, 6], int: true }],
      solve: () => ({ e: L.hysteresis(hyImg, 40, 100) }),
      wrong: [{ e: S(L.map(hyImg, (v) => (v >= 40 ? 1 : 0))) }, { e: S(L.map(hyImg, (v) => (v >= 100 ? 1 : 0))) }],
      hints: [
        'Strong pixels: 120 at (3, 1) and 110 at (4, 4). Start from them and follow neighbours ≥ 40.',
        '80 at (1, 5) is above l but has no edge neighbour.',
      ],
      explain: 'From 120 at (3, 1): 60 (2, 2) → 70 (2, 3) → 50 (3, 4) → 110 (4, 4, strong anyway) → 55 (5, 5) → 90 (6, 5). These form one long contour.\n\nRejected: 45 at (5, 2) – its neighbours are 0 or 30 (< l); 30 at (6, 3) – below l; 80 at (1, 5) – a weak pixel with no edge neighbour, even though it is larger than several accepted ones.\n\nA single threshold of 40 would keep the isolated 45 and 80 (noise), a single threshold of 100 would break the contour into two points – that is why Canny uses **two thresholds**.',
    },
    {
      id: 'edg-7', type: 'calc', title: 'SUSAN edge response',
      prompt: 'SUSAN with a **3×3 mask (centre included, n_max = 9)**, brightness threshold **t = 10** and geometric threshold **g = ¾ · n_max = 6.75**:\n\n- C(r, r₀) = 1 if |I(r) − I(r₀)| ≤ t, else 0 (the nucleus counts itself);\n- USAN area n(r₀) = Σ C(r, r₀);\n- edge response R(r₀) = g − n(r₀) if n(r₀) < g, otherwise 0.\n\nCompute n and R for the inner 3×3 pixels (x, y = 2 … 4).',
      grids: [{ title: 'I', data: suImg, image: true }],
      fields: [
        { key: 'n', label: 'n (USAN area)', shape: [3, 3], int: true },
        { key: 'R', label: 'R (edge response)', shape: [3, 3] },
      ],
      solve: () => { const s = L.susan(suImg, 10, 1, 3 / 4); return { n: L.sub(s.n, 1, 1, 3, 3), R: L.sub(s.R, 1, 1, 3, 3) }; },
      wrong: [{ R: [['0', '0.75', '0.75'], ['0', '1.75', '0'], ['0', '1.75', '0.75']] }],
      hints: [
        'Centre (3, 3) = 15: similar (≤ 10 away) are 10, 13, 14, 15, 11 → n = 5.',
        'R = 6.75 − n only where n < 6.75, i.e. n ≤ 6.',
      ],
      explain: 'n = [9 6 6; 8 5 7; 7 5 8], so R = [0 **0.75** **0.75**; 0 **1.75** 0; 0 **1.75** 0].\n\nInside the dark region (2, 2) all 9 pixels are similar → n = n_max, no edge. Next to the boundary between the dark (≈ 10–15) and the bright (≈ 47–55) region the USAN shrinks to about half the mask, and the **smaller** the USAN, the larger R. SUSAN needs **no derivatives**, so it is less sensitive to noise. (For corners a smaller geometric threshold, g = n_max/2, is used.)',
    },
    {
      id: 'edg-8', type: 'calc', title: 'Edges at expected positions (vertical)',
      prompt: 'We look for a **vertical edge pair** (a bright stripe) in a 5×10 window; the run (the search direction) is horizontal, perpendicular to the expected edges.\n\n1. **Project onto the run**: sum every **column** (parallel to the expected edge; the lecture does not divide by the equal column heights) → S(x), x = 1 … 10.\n2. **Edge-strength array** along the run with the difference filter [−1 0 1]: e(x) = S(x+1) − S(x−1), x = 2 … 9.\n3. **Edge positions**: local maxima of |e| (larger than both neighbours) with **|e| ≥ 200**.\n4. **Check the conditions**: polarity (dark → bright or bright → dark) and the distance between the two edges.\n\nGive S, e, the position of the dark → bright edge, the bright → dark edge, and their distance.',
      grids: [{ title: 'f', data: vImg, image: true }],
      fields: [
        { key: 's', label: 'S(x), x = 1…10', shape: [1, 10], int: true },
        { key: 'e', label: 'e(x), x = 2…9', shape: [1, 8], int: true },
        { key: 'xr', label: 'dark → bright edge at x =', int: true },
        { key: 'xf', label: 'bright → dark edge at x =', int: true },
        { key: 'w', label: 'distance of the edges', int: true },
      ],
      solve: () => {
        const s = colSums(), e = diffC(s), pk = peaks(e, T8, 2);
        const xr = pk.find((p) => p.val > 0).pos, xf = pk.find((p) => p.val < 0).pos;
        return { s: [s], e: [e], xr, xf, w: xf - xr };
      },
      wrong: [{ xr: '4' }, { xf: '7' }],
      hints: [
        'S = [100 110 200 550 600 590 560 225 110 100].',
        'e(3) = S(4) − S(2) = 440 and e(4) = 400: the peak is at x = 3.',
      ],
      explain: 'S = [100 110 200 550 600 590 560 225 110 100].\n\ne = [100 **440** 400 40 −40 −365 **−450** −125] for x = 2 … 9.\n\n- |e| local maxima ≥ 200: x = 3 (440 > 100, 400) and x = 8 (|−450| > 365, 125). x = 4 (400) is not a maximum – it belongs to the same ramp.\n- Positive e → **dark → bright at x = 3**, negative e → **bright → dark at x = 8**; distance **5** pixels.\n\nSumming along the edge averages out the noise of the individual rows, and the condition checks (minimal strength, expected position, polarity, expected distance of an edge pair) decide whether the edge pair is the one we were looking for.',
    },
    {
      id: 'edg-9', type: 'calc', title: 'Edges at expected positions (45°)',
      prompt: 'Now the expected edge runs at **45°** (from bottom-left to top-right), i.e. along the anti-diagonals **x + y = k** (x = column, y = row, 1-based). Only the **highlighted band** is used: every anti-diagonal k = 4 … 12 contains exactly **3** highlighted cells.\n\n1. Sum the highlighted cells of every anti-diagonal (along the expected edge): S(k), k = 4 … 12.\n2. Edge strength across the diagonals: e(k) = S(k+1) − S(k−1), k = 5 … 11.\n3. The edge is at the local maximum of |e| with **|e| ≥ 100**. Give its k and e(k).',
      grids: [{ title: 'f (band highlighted)', data: dImg, highlight: band, image: true }],
      fields: [
        { key: 's', label: 'S(k), k = 4…12', shape: [1, 9], int: true },
        { key: 'e', label: 'e(k), k = 5…11', shape: [1, 7], int: true },
        { key: 'k', label: 'edge at x + y =', int: true },
        { key: 'ek', label: 'e at the edge', int: true },
      ],
      solve: () => {
        const s = diagSums(), e = diffC(s), pk = peaks(e, T9, 5);
        return { s: [s], e: [e], k: pk[0].pos, ek: pk[0].val };
      },
      wrong: [{ k: '9' }, { k: '7' }],
      hints: [
        'k = 4: the cells (x, y) = (1, 3), (2, 2), (3, 1) → 29 + 28 + 32 = 89.',
        'S = [89 90 89 120 239 345 359 360 359].',
      ],
      explain: 'S(4 … 12) = [89 90 89 120 239 345 359 360 359] (e.g. k = 8: f(3, 5) + f(4, 4) + f(5, 3) = 79 + 78 + 82 = 239).\n\ne(5 … 11) = [0 30 150 **225** 120 15 0]. The only local maximum above 100 is **k = 8, e = 225** (positive: dark → bright as x + y grows). The edge line is x + y = 8, e.g. the pixels (4, 4), (3, 5), (5, 3).\n\nThis is the ZH method: the band makes every diagonal sum contain the same number of pixels, so the sums are directly comparable without dividing.',
    },
    {
      id: 'edg-10', type: 'code', title: 'Sobel magnitude',
      prompt: 'Write `sobelMag(img)` returning the **Euclidean Sobel gradient magnitude** √(fx² + fy²) for every inner pixel (masks as correlation: fx = [−1 0 1; −2 0 2; −1 0 1], fy = [−1 −2 −1; 0 0 0; 1 2 1]). **Border pixels are 0.** No rounding.',
      fn: 'sobelMag',
      starter: 'function sobelMag(img) {\n  const [h, w] = shape(img);\n  const out = zeros(h, w);\n  // fx = right column − left column (weights 1 2 1), fy = bottom row − top row\n  return out;\n}',
      solution: 'function sobelMag(img) {\n  const [h, w] = shape(img);\n  const out = zeros(h, w);\n  for (let y = 1; y < h - 1; y++)\n    for (let x = 1; x < w - 1; x++) {\n      const f = (dy, dx) => img[y + dy][x + dx];\n      const fx = f(-1, 1) + 2 * f(0, 1) + f(1, 1) - f(-1, -1) - 2 * f(0, -1) - f(1, -1);\n      const fy = f(1, -1) + 2 * f(1, 0) + f(1, 1) - f(-1, -1) - 2 * f(-1, 0) - f(-1, 1);\n      out[y][x] = Math.sqrt(fx * fx + fy * fy);\n    }\n  return out;\n}',
      tests: [['@img:shapes'], ['@img:step'], [[[0, 0, 0, 0], [0, 10, 20, 0], [0, 30, 40, 0], [0, 0, 0, 0]]]],
      display: 'image',
      wrong: [
        'function sobelMag(img) {\n  const [h, w] = shape(img);\n  const out = zeros(h, w);\n  for (let y = 1; y < h - 1; y++)\n    for (let x = 1; x < w - 1; x++) {\n      const f = (dy, dx) => img[y + dy][x + dx];\n      const fx = f(-1, 1) + 2 * f(0, 1) + f(1, 1) - f(-1, -1) - 2 * f(0, -1) - f(1, -1);\n      const fy = f(1, -1) + 2 * f(1, 0) + f(1, 1) - f(-1, -1) - 2 * f(-1, 0) - f(-1, 1);\n      out[y][x] = Math.abs(fx) + Math.abs(fy);\n    }\n  return out;\n}',
        'function sobelMag(img) {\n  const [h, w] = shape(img);\n  const out = zeros(h, w);\n  for (let y = 1; y < h - 1; y++)\n    for (let x = 1; x < w - 1; x++) {\n      const f = (dy, dx) => img[y + dy][x + dx];\n      const fx = f(-1, 1) + f(0, 1) + f(1, 1) - f(-1, -1) - f(0, -1) - f(1, -1);\n      const fy = f(1, -1) + f(1, 0) + f(1, 1) - f(-1, -1) - f(-1, 0) - f(-1, 1);\n      out[y][x] = Math.sqrt(fx * fx + fy * fy);\n    }\n  return out;\n}',
      ],
      hints: ['A helper `f(dy, dx)` that reads `img[y + dy][x + dx]` keeps the formulas short.', 'The Manhattan norm |fx| + |fy| or Prewitt weights (1 1 1) will not pass.'],
      explain: 'Thresholding this magnitude gives the classic Sobel edge detector (input: image + threshold → filter, magnitude, threshold). The Sobel mask is separable: a [1 2 1] smoothing **parallel** to the edge times a [−1 0 1] difference across it, which is why it is less noise-sensitive than a plain difference.',
    },
    {
      id: 'edg-11', type: 'code', title: 'Edge-strength array of a run',
      prompt: 'Write `rowStrength(img)` for the expected-position edge search with a horizontal run (vertical edges):\n\n1. S[x] = sum of column x (all rows, no division);\n2. return the array e of length w with **e[x] = S[x+1] − S[x−1]** for 1 ≤ x ≤ w − 2 and **e[0] = e[w−1] = 0**.\n\nReturn a plain 1-D array (0-based indices).',
      fn: 'rowStrength',
      starter: 'function rowStrength(img) {\n  const [h, w] = shape(img);\n  const e = new Array(w).fill(0);\n  // 1) column sums  2) central difference of the sums\n  return e;\n}',
      solution: 'function rowStrength(img) {\n  const [h, w] = shape(img);\n  const S = new Array(w).fill(0);\n  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) S[x] += img[y][x];\n  const e = new Array(w).fill(0);\n  for (let x = 1; x < w - 1; x++) e[x] = S[x + 1] - S[x - 1];\n  return e;\n}',
      tests: [[vImg], ['@img:step'], [[[1, 2, 3], [4, 5, 6]]], ['@img:shapes']],
      display: 'auto',
      wrong: ['function rowStrength(img) {\n  const [h, w] = shape(img);\n  const S = new Array(w).fill(0);\n  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) S[x] += img[y][x];\n  const e = new Array(w).fill(0);\n  for (let x = 1; x < w - 1; x++) e[x] = S[x + 1] - S[x];\n  return e;\n}', 'function rowStrength(img) {\n  const [h, w] = shape(img);\n  const S = new Array(h).fill(0);\n  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) S[y] += img[y][x];\n  const e = new Array(w).fill(0);\n  for (let x = 1; x < w - 1 && x < h - 1; x++) e[x] = S[x + 1] - S[x - 1];\n  return e;\n}'],
      hints: ['Sum the **columns** (index x), not the rows.', 'For the 5×10 task of the previous exercise the result is [0, 100, 440, 400, 40, −40, −365, −450, −125, 0].'],
      explain: 'The peaks of |e| (above a minimal strength) are the edge candidates; their sign gives the polarity. A wider difference mask (e.g. [−1 −1 0 1 1]) smooths more along the run at the cost of localisation.',
    },
    q('edg-12', 'Zero crossings', 'Which edge detector marks edges at the **zero crossings** of its response (cases {+,−}, {+,0,−}, {−,+}, {−,0,+})?',
      ['Sobel', 'Laplacian of Gaussian (Marr–Hildreth)', 'Robinson compass', 'Roberts cross'], 1,
      'The LoG (“Mexican hat”) approximates the second derivative of the Gauss-smoothed image; where the gradient is maximal, the second derivative changes sign. It gives the position but not the direction of the edge, is isotropic, and the smoothing makes it robust against noise. Sobel, Robinson and Roberts are first-derivative (gradient) operators – their edges are where the magnitude is large.'),
    q('edg-13', 'Why non-maximum suppression?', 'What is the purpose of the non-maximum suppression step of the Canny detector?',
      ['To remove noise before computing the gradient', 'To thin the edges to one pixel by keeping only local maxima of the magnitude along the gradient direction', 'To connect broken edge segments using two thresholds', 'To quantise the gradient direction to 8 compass directions'], 1,
      'Gradient operators give thick (several-pixel-wide) edge responses. NMS compares every pixel with its two neighbours along the gradient (normal) direction quantised to 0°/45°/90°/135° and zeroes it if it is not the maximum. Noise removal is the Gaussian smoothing (step 1); linking with two thresholds is hysteresis (step 4).'),
    c('edg-14', 'Main steps of the Canny edge detector', 'List the **main steps of the Canny edge detector** (4 points in the ZH) and say briefly what each one does.',
      '1. **Gaussian smoothing** J = I ∗ G – reduces noise (larger σ: less noise, but worse localisation and slower).\n2. **Gradient computation** – Jx, Jy (e.g. with differences/Sobel); edge strength E_s = √(Jx² + Jy²) and edge normal (orientation) E_o = arctan(Jy / Jx).\n3. **Non-maximum suppression** – quantise E_o to 0°, 45°, 90°, 135°; keep E_s only where it is ≥ both neighbours along that direction, otherwise 0 → one-pixel-wide edges.\n4. **Hysteresis thresholding** with **two thresholds** l < h – pixels ≥ h are edges; pixels between l and h are edges only if connected to an edge pixel (following the chain of local maxima); pixels < l are discarded → long, unbroken contours with few false edges.\n\nAssumptions: mainly step edges, Gaussian noise. Output: lists of contours. Criteria of the "optimal" detector: good detection, good localisation, a single response per edge.'),
  ],
};
