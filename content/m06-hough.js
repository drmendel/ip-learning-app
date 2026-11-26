import { L, q, c } from './util.js';

// ---------------------------------------------------------------- data
// hgh-1: (m, b) parameter space
const P1 = [[1, 3], [2, 5], [3, 7], [4, 4]];
const M1 = [0, 1, 2, 3];

// hgh-2/3: binary edge image (0-based coordinates!)
const B2 = [
  [0, 0, 0, 1, 0],
  [1, 0, 0, 1, 0],
  [0, 1, 0, 1, 0],
  [0, 0, 1, 1, 0],
  [0, 0, 0, 1, 0],
];
const pts2 = () => L.houghLines(B2, [0]).points; // [x, y] in scan order
const rho = (x, y, t) => Math.round(x * Math.cos(L.rad(t)) + y * Math.sin(L.rad(t)) + 1e-9) + 0;

// hgh-5: circle Hough with known gradient direction
const C5 = [ // x, y, cos θ, sin θ
  [9, 10, 0.6, 0.8],
  [1, 6, -1, 0],
  [6, 1, 0, -1],
  [2, 9, -0.8, 0.6],
  [10, 2, 1, 0],
];
const R5 = 5;
const centres5 = () => C5.map(([x, y, co, si]) => [Math.round(x - R5 * co), Math.round(y - R5 * si)]);

// hgh-6: least squares line
const P6 = [[1, 2], [2, 3], [3, 5], [4, 6]];
// hgh-7: least squares parabola, symmetric x
const P7 = [[-2, 5], [-1, 2], [0, 1], [1, 2], [2, 6]];
// hgh-8: split
const P8 = [[0, 0], [2, 1], [3, 4], [6, 2], [8, 0]];

// ---------------------------------------------------------------- code
const houghStarter = `function houghBest(bin, thetas) {
  // bin[y][x] = 1 for edge pixels (x = column, y = row, 0-based)
  // vote for rho = Math.round(x·cos θ + y·sin θ) for every θ in thetas (degrees)
  // return [theta, rho, votes] of the cell with the most votes
  // (tie: smaller theta first, then smaller rho)
  return [0, 0, 0];
}`;
const houghSolution = `function houghBest(bin, thetas) {
  const votes = new Map();
  for (let y = 0; y < bin.length; y++) for (let x = 0; x < bin[0].length; x++) {
    if (!bin[y][x]) continue;
    for (const t of thetas) {
      const a = t * Math.PI / 180;
      const r = Math.round(x * Math.cos(a) + y * Math.sin(a) + 1e-9) + 0;
      const key = t + '|' + r;
      votes.set(key, (votes.get(key) || 0) + 1);
    }
  }
  let best = null;
  for (const [key, v] of votes) {
    const [t, r] = key.split('|').map(Number);
    if (!best || v > best[2] || (v === best[2] && (t < best[0] || (t === best[0] && r < best[1])))) best = [t, r, v];
  }
  return best;
}`;
const diagImg = L.fromFn(8, 8, (y, x) => (x + y === 7 || (y === 2 && x < 5) ? 1 : 0));
const mixImg = L.fromFn(9, 10, (y, x) => (x === 6 || (y === x - 1 && x < 6) || (x * 3 + y * 5) % 23 === 0 ? 1 : 0));

export default {
  id: 'hough',
  title: 'Hough transform & curve fitting',
  lab: 'Lecture 8',
  lesson: '06-hough.md',
  exercises: [
    {
      id: 'hgh-1', type: 'calc', title: 'Voting in the (m, b) parameter space',
      prompt: 'A line y = m·x + b through an edge point (xᵢ, yᵢ) must satisfy **b = yᵢ − m·xᵢ**: every point is a *line* in the (m, b) parameter space.\n\nThe accumulator uses only the slopes **m ∈ {0, 1, 2, 3}**. For each edge point compute the b it votes for at each m. Which accumulator cell (m, b) receives the most votes, and how many?',
      grids: [{ title: 'edge points (x, y)', data: P1 }],
      fields: [
        { key: 'b', label: 'b = y − m·x', shape: [4, 4], int: true, rowLabels: P1.map(([x, y]) => `(${x}, ${y})`), colLabels: M1.map((m) => `m = ${m}`) },
        { key: 'm', label: 'best m', int: true }, { key: 'bb', label: 'best b', int: true }, { key: 'v', label: 'votes', int: true },
      ],
      solve: () => {
        const b = P1.map(([x, y]) => M1.map((m) => y - m * x));
        const votes = new Map();
        b.forEach((r) => r.forEach((bv, j) => { const k = `${M1[j]}|${bv}`; votes.set(k, (votes.get(k) || 0) + 1); }));
        const [k, v] = [...votes.entries()].sort((p, q2) => q2[1] - p[1])[0];
        const [m, bb] = k.split('|').map(Number);
        return { b, m, bb, v };
      },
      hints: ['(1, 3): b = 3 − m → 3, 2, 1, 0.', 'Look for a value that appears in the same column for several points.'],
      explain: 'Rows: (1, 3) → 3 2 1 0; (2, 5) → 5 3 1 −1; (3, 7) → 7 4 1 −2; (4, 4) → 4 0 −4 −8.\n\nIn the column m = 2 the value b = 1 appears **3 times** → the line **y = 2x + 1** (the point (4, 4) is an outlier). The weakness: a vertical line has m = ∞, so the (m, b) space cannot represent it → normal form.',
    },
    {
      id: 'hgh-2', type: 'calc', title: 'ρ values in the normal form',
      prompt: 'Normal form of a line: **x·cos θ + y·sin θ = ρ**. Here x = column, y = row, **0-based, origin = top-left pixel** (y grows downwards).\n\nFor the 8 edge pixels of the image compute ρ for **θ = 45°** and **θ = 135°**, rounded to the nearest integer (θ = 0° would simply give ρ = x, θ = 90° gives ρ = y). The pixels are listed in row-by-row scan order.',
      grids: [{ title: 'edge image (0-based coordinates)', data: B2, base: 0, image: true }],
      fields: [{
        key: 'r', label: 'ρ (rounded)', shape: [8, 2], int: true,
        rowLabels: pts2().map(([x, y]) => `(${x}, ${y})`), colLabels: ['θ = 45°', 'θ = 135°'],
      }],
      solve: () => ({ r: pts2().map(([x, y]) => [rho(x, y, 45), rho(x, y, 135)]) }),
      hints: ['cos 45° = sin 45° ≈ 0.707: ρ = 0.707·(x + y).', 'cos 135° ≈ −0.707, sin 135° ≈ 0.707: ρ = 0.707·(y − x) – it can be negative.'],
      explain: 'θ = 45°: ρ = round(0.707(x + y)): (3,0) 2, (0,1) 1, (3,1) 3, (1,2) 2, (3,2) 4, (2,3) 4, (3,3) 4, (3,4) 5.\n\nθ = 135°: ρ = round(0.707(y − x)): (3,0) −2, (0,1) 1, (3,1) −1, (1,2) 1, (3,2) −1, (2,3) 1, (3,3) 0, (3,4) 1.\n\nThe four points with y − x = 1 all give ρ = 1 at θ = 135° – they are on one line.',
    },
    {
      id: 'hgh-3', type: 'calc', title: 'Filling the accumulator',
      prompt: 'Use the same edge image and the accumulator with **θ ∈ {0°, 45°, 90°, 135°}**, ρ = round(x·cos θ + y·sin θ) (0-based, origin top-left).\n\nGive the **two strongest lines** as (θ, ρ, votes) – in any order – and the number of votes in the cell **(θ = 45°, ρ = 4)**.',
      grids: [{ title: 'edge image (0-based coordinates)', data: B2, base: 0, image: true }],
      fields: [
        { key: 'lines', label: 'θ, ρ, votes of the two strongest lines', shape: [2, 3], int: true, unordered: 'rows', colLabels: ['θ', 'ρ', 'votes'] },
        { key: 'c', label: 'votes in (45°, 4)', int: true },
      ],
      solve: () => {
        const h = L.houghLines(B2, [0, 45, 90, 135]);
        const lines = h.lines.slice(0, 2).map((l) => [l.theta, l.rho, l.votes]);
        return { lines, c: h.acc[1][h.rhos.indexOf(4)] };
      },
      hints: ['θ = 0°: ρ = x. How many pixels are in column 3?', 'Use your ρ table of the previous task for 45° and 135°.'],
      explain: 'θ = 0°: column x = 3 holds 5 pixels → **(0°, 3, 5)**: the vertical line x = 3. θ = 135°: ρ = 1 four times → **(135°, 1, 4)**: the line y = x + 1. Next: (45°, 4) has **3** votes from (3,2), (2,3), (3,3) – a "false" peak caused by the coarse θ and ρ quantisation (rounding). θ = 90° (ρ = y) has at most 2 votes.\n\nThe vertical line is no problem in the normal form: θ = 0°, ρ = 3.',
      wrong: [{ c: '2' }],
    },
    {
      id: 'hgh-4', type: 'calc', title: 'From y = mx + b to (θ, ρ)',
      prompt: 'Write each line in the normal form **x·cos θ + y·sin θ = ρ** with **0° ≤ θ < 180°** (ρ may be negative). Round ρ to 2 decimals.\n\n- A: y = −x + 4\n- B: x = 5 (vertical – no slope!)\n- C: y = x + 2',
      fields: [{ key: 'n', label: 'θ (degrees), ρ', shape: [3, 2], rowLabels: ['A', 'B', 'C'], colLabels: ['θ', 'ρ'] }],
      solve: () => ({ n: [[45, 4 / Math.SQRT2], [0, 5], [135, 2 / Math.SQRT2]] }),
      hints: ['A: x + y = 4. Divide by √2: x·(1/√2) + y·(1/√2) = 4/√2 → cos θ = sin θ = 1/√2.', 'C: −x + y = 2 → cos θ = −1/√2, sin θ = 1/√2 → θ = 135°.'],
      explain: 'Bring the line to a·x + b·y = d, then divide by √(a² + b²) so that (a, b) becomes (cos θ, sin θ):\n\n- A: x + y = 4 → θ = 45°, ρ = 4/√2 ≈ **2.83** (distance of the line from the origin)\n- B: x = 5 → θ = **0°**, ρ = **5**\n- C: −x + y = 2 → θ = **135°**, ρ = 2/√2 ≈ **1.41**\n\nB has m = ∞ in the slope form – the reason for the normal form.',
    },
    {
      id: 'hgh-5', type: 'calc', title: 'Circle Hough with gradient direction',
      prompt: 'We look for circles of radius **r = 5**. At every edge point we know the gradient direction θ (pointing out of the circle, y downwards), so each point votes for one centre only:\n\n**x₀ = x − r·cos θ,  y₀ = y − r·sin θ**\n\nCompute the centre candidate of each point. Which centre gets the most votes and how many?',
      grids: [{ title: 'x, y, cos θ, sin θ of the edge points', data: C5 }],
      fields: [
        { key: 'c', label: 'x₀, y₀', shape: [5, 2], int: true, rowLabels: C5.map(([x, y]) => `(${x}, ${y})`), colLabels: ['x₀', 'y₀'] },
        { key: 'x0', label: 'centre x₀', int: true }, { key: 'y0', label: 'centre y₀', int: true }, { key: 'v', label: 'votes', int: true },
      ],
      solve: () => {
        const cs = centres5();
        const votes = new Map(); cs.forEach(([a, b]) => { const k = `${a}|${b}`; votes.set(k, (votes.get(k) || 0) + 1); });
        const [k, v] = [...votes.entries()].sort((p, q2) => q2[1] - p[1])[0];
        const [x0, y0] = k.split('|').map(Number);
        return { c: cs, x0, y0, v };
      },
      hints: ['(9, 10): x₀ = 9 − 5·0.6 = 6, y₀ = 10 − 5·0.8 = 6.', '(6, 1) has sin θ = −1 (gradient points up): y₀ = 1 + 5 = 6.'],
      explain: 'Candidates: (6, 6), (6, 6), (6, 6), (6, 6), (5, 2). The centre **(6, 6)** gets **4** votes; (10, 2) is noise.\n\nWithout the gradient direction every point would have to vote for a whole circle of centres in the 3-D (x₀, y₀, r) accumulator; knowing θ reduces it to one vote per radius.',
    },
    {
      id: 'hgh-6', type: 'calc', title: 'Least-squares line fit',
      prompt: 'Fit the line **y = m·x + b** to the points by the **method of least squares** (minimise Σ (yᵢ − m·xᵢ − b)²). The normal equations give\n\nm = (n·Σxy − Σx·Σy) / (n·Σx² − (Σx)²),  b = (Σy − m·Σx) / n.\n\nAlso give the remaining error SSE = Σ (yᵢ − m·xᵢ − b)².',
      grids: [{ title: 'points (x, y)', data: P6 }],
      fields: [
        { key: 'sx', label: 'Σx' }, { key: 'sy', label: 'Σy' }, { key: 'sxx', label: 'Σx²' }, { key: 'sxy', label: 'Σxy' },
        { key: 'm', label: 'm' }, { key: 'b', label: 'b' }, { key: 'sse', label: 'SSE' },
      ],
      solve: () => { const f = L.fitLine(P6); return { sx: f.sx, sy: f.sy, sxx: f.sxx, sxy: f.sxy, m: f.m, b: f.b, sse: f.sse }; },
      hints: ['n = 4, Σxy = 1·2 + 2·3 + 3·5 + 4·6.', 'Residuals: yᵢ − (1.4·xᵢ + 0.5).'],
      explain: 'Σx = 10, Σy = 16, Σx² = 30, Σxy = 47.\n\nm = (4·47 − 10·16)/(4·30 − 100) = 28/20 = **1.4**, b = (16 − 14)/4 = **0.5**.\n\nFitted values 1.9, 3.3, 4.7, 6.1 → residuals 0.1, −0.3, 0.3, −0.1 → SSE = **0.2**.\n\nNote: this minimises *vertical* distances, so it fails for (near-)vertical lines – fitting x = m′y + b′ or the total least squares (perpendicular distances) fixes that.',
      wrong: [{ m: '1.5' }],
    },
    {
      id: 'hgh-7', type: 'calc', title: 'Least-squares parabola',
      prompt: 'Fit the parabola **y = a·x² + b·x + c** by least squares. The normal equations are\n\nΣx⁴·a + Σx³·b + Σx²·c = Σx²y\nΣx³·a + Σx²·b + Σx·c = Σxy\nΣx²·a + Σx·b + n·c = Σy\n\nThe x values are symmetric (−2…2), so Σx = Σx³ = 0 and the system splits up. Round to 3 decimals.',
      grids: [{ title: 'points (x, y)', data: P7 }],
      fields: [{ key: 'a', label: 'a' }, { key: 'b', label: 'b' }, { key: 'c', label: 'c' }],
      solve: () => { const f = L.fitParabola(P7); return { a: f.a, b: f.b, c: f.c }; },
      hints: ['Σx² = 10, Σx⁴ = 34, n = 5, Σy = 16, Σxy = 2, Σx²y = 48.', 'b = Σxy / Σx²; then solve 34a + 10c = 48, 10a + 5c = 16.'],
      explain: 'b = 2/10 = **0.2**. From 34a + 10c = 48 and 20a + 10c = 32: 14a = 16 → a = 8/7 ≈ **1.143**, c = (16 − 10a)/5 = 32/35 ≈ **0.914**.\n\nThe same idea works for any curve that is **linear in its parameters** (y = Σ αᵢ·φᵢ(x): polynomial, trigonometric, exponential bases).',
    },
    {
      id: 'hgh-8', type: 'calc', title: 'Splitting a contour',
      prompt: 'An ordered contour P1…P5 is approximated by a polyline. **Split** step: connect the end points, find the point with the largest distance from this chord; if it is larger than **E_max = 0.8**, break the contour there and repeat on both parts.\n\nDistance of a point (x, y) from the line through (x₁, y₁), (x₂, y₂):\n\nd = |(y₂ − y₁)x − (x₂ − x₁)y + x₂y₁ − y₂x₁| / √((x₂ − x₁)² + (y₂ − y₁)²)\n\nGive the distances of P2, P3, P4 from the chord P1P5, the distance of P2 from P1P3 and of P4 from P3P5 (2 decimals), and the final vertices (e.g. `1,3,5`).',
      grids: [{ title: 'P1…P5 (x, y)', data: P8 }],
      fields: [
        { key: 'd', label: 'd(P2), d(P3), d(P4) from P1P5', shape: [1, 3] },
        { key: 'd2', label: 'd(P2) from P1P3' }, { key: 'd4', label: 'd(P4) from P3P5' },
        { key: 'v', label: 'vertices', kind: 'str' },
      ],
      solve: () => ({
        d: [P8.slice(1, 4).map((p) => L.pointLineDistance(p, P8[0], P8[4]))],
        d2: L.pointLineDistance(P8[1], P8[0], P8[2]),
        d4: L.pointLineDistance(P8[3], P8[2], P8[4]),
        v: L.splitPolyline(P8, 0.8).map((i) => i + 1).join(','),
      }),
      hints: ['P1P5 lies on the x axis, so the distances are simply the y values.', 'P3P5: (3, 4) → (8, 0), length √41 ≈ 6.40.'],
      explain: 'From P1P5: 1, **4**, 2 → split at P3 (4 > 0.8).\n\nP1P3 (length 5): d(P2) = |4·2 − 3·1| / 5 = **1.00** > 0.8 → split at P2.\n\nP3P5: d(P4) = |−4·6 − 5·2 + 8·4| / √41 = 2/6.40 ≈ **0.31** ≤ 0.8 → keep.\n\nVertices: **1, 2, 3, 5**. The lecture\'s split & merge also **merges** neighbouring segments again if the union stays under E_max, and then moves the break points to reduce the error.',
      wrong: [{ v: '1,3,5' }],
    },
    {
      id: 'hgh-9', type: 'code', title: 'Hough accumulator for lines',
      prompt: 'Write `houghBest(bin, thetas)` that runs the line Hough transform on a binary image and returns the strongest line as **[θ, ρ, votes]**.\n\n- Edge pixels: `bin[y][x]` non-zero; x = column, y = row, 0-based, origin top-left.\n- For every edge pixel and every θ in `thetas` (degrees) vote for ρ = `Math.round(x·cos θ + y·sin θ)` (add `1e-9` before rounding to avoid floating-point surprises).\n- Ties: smaller θ wins, then smaller ρ.',
      fn: 'houghBest',
      starter: houghStarter,
      solution: houghSolution,
      tests: [[B2, [0, 45, 90, 135]], [diagImg, [0, 45, 90, 135]], [mixImg, [0, 30, 60, 90, 120, 150]], [diagImg, [0, 90]]],
      hints: ['A `Map` keyed by `θ + "|" + ρ` is the easiest accumulator (ρ can be negative).', 'Convert degrees to radians: `t * Math.PI / 180`.'],
      explain: 'The 2-D accumulator array of the lecture has one row per θ and one column per ρ ∈ [−diagonal, diagonal]; a Map avoids the offset. Cost: (number of edge pixels) × (number of θ values) – much less than testing all point pairs.',
    },
    q('hgh-10', 'Why the normal form?',
      'Why does the Hough transform use x·cos θ + y·sin θ = ρ instead of y = m·x + b?',
      ['It is faster to compute', 'Vertical lines have infinite m (and b); θ ∈ [0°, 180°) and |ρ| ≤ image diagonal are bounded', 'It also finds circles', 'It needs no accumulator'], 1,
      'In the (m, b) space the parameters are unbounded (m → ∞ for vertical lines) and cannot be quantised evenly. In the normal form θ is bounded and ρ is at most the image diagonal – a numerically stable description for any direction.'),
    q('hgh-11', 'Accumulator of the circle Hough',
      'What is the dimension of the accumulator when searching for circles (x − x₀)² + (y − y₀)² = r² of unknown centre and radius?',
      ['1-D: r', '2-D: (θ, ρ)', '3-D: (x₀, y₀, r)', '4-D: (x₀, y₀, r, θ)'], 2,
      'Three unknowns → a 3-D accumulator A(x₀, y₀, r). In practice one parameter is fixed (e.g. r) and the other two vary; with the gradient direction θ at each edge point, x₀ = x − r cos θ, y₀ = y − r sin θ gives one vote per r. A general curve with p parameters needs a p-D accumulator.'),
    c('hgh-12', 'Hough transform for lines',
      'Describe the steps of line detection with the Hough transform. What are the difficulties?',
      '**Input:** binary edge image, threshold.\n\n1. Create a 2-D accumulator for (θ, ρ): θ ∈ [0°, 180°) (e.g. steps of 10°), |ρ| ≤ image diagonal; set it to 0.\n2. For every edge point (x, y) and every θ: ρ = x cos θ + y sin θ, increment A(θ, ρ).\n3. Find the **local maxima** above the threshold – each is a line.\n4. Convert back: x cos θ + y sin θ = ρ in the image.\n\nKey idea: a hard global problem (which points are collinear) becomes finding local maxima in the parameter space; one image point = one sinusoid in (θ, ρ).\n\n**Difficulties:** choice of the grid (too coarse: lines merge; too fine: noise splits peaks), how many lines there are, which point belongs to which line, noise. The same scheme works for circles (3-D accumulator) and general curves y = f(x, a) (p-D accumulator).'),
  ],
};
