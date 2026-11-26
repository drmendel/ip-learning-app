// Every task of the four "gyakorló" (practice) sheets of the course, with the original points.
// Where the sheet leaves a convention open (border handling, derivative mask, the "marked area", the target pose)
// the prompt fixes one – the lesson explains these choices.
import { L, c } from './util.js';

const G = L.parseGrid;
const deg8 = ['0', '1', '2', '3', '4', '5', '6', '7'];

// ---------------------------------------------------------------- sheet 1 (topic 5)
const histImg = G(`0 1 5 5 5 5 5 0
1 1 1 4 5 5 5 4
1 0 0 1 6 6 6 4
1 0 0 3 6 6 6 4
1 0 3 3 6 4 4 7
0 0 3 2 6 4 4 4
0 2 2 2 6 4 4 4
0 2 2 2 4 6 4 0`);
const square = L.fromFn(10, 10, (y, x) => (y >= 3 && y <= 6 && x >= 3 && x <= 6 ? 1 : 0));
const sob = L.sobel(square);
const R6 = (m) => L.sub(m, 2, 2, 6, 6); // the 6×6 block x, y = 3..8 (1-based) where the gradient is non-zero
const absDiff = (a, b) => Math.abs(a - b);
const absIJ = L.fromFn(8, 8, (i, j) => Math.abs(i - j));

// ---------------------------------------------------------------- sheet 2 (topic 8)
const houghImg = G(`0 1 0 0 0 0 0 0
0 1 0 0 0 0 0 0
0 1 0 0 0 0 0 0
0 1 1 1 1 1 1 0
0 1 0 0 1 0 0 0
0 1 0 0 0 1 0 0
0 1 0 0 0 0 0 0
0 1 0 0 0 0 0 0`);
const harrisImg = G(`131 133 145 153 163 173
88 90 99 109 115 124
101 106 89 76 81 83
148 162 106 43 23 29
154 158 108 38 35 30
143 153 109 59 64 56`);
const harris = () => L.cornerResponse(harrisImg, { grad: 'central', win: 3, avg: true });
const C2 = (m) => L.sub(m, 2, 2, 2, 2);

// ---------------------------------------------------------------- sheet 3 (topic 9): half of a unit cube
const s2 = Math.SQRT2;
const wedge = [[0, 0, 0], [1, 0, 0], [0, 0, 1], [0, 1, 0], [1, 1, 0], [0, 1, 1]];
const wedgeEdges = [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3], [0, 3], [1, 4], [2, 5]];
const wedgeTarget = [[-s2, 0, 0], [0, 0, 0], [-s2 / 2, 0, s2 / 2], [-s2, 1, 0], [0, 1, 0], [-s2 / 2, 1, s2 / 2]];

// ---------------------------------------------------------------- sheet 4 (topic 11)
const chain = '076666553321212';
const isoImg = G(`64 67 83 122 146 140 142 142
66 73 96 129 146 141 139 143
68 82 101 137 147 140 147 139
70 91 135 147 155 156 151 140
70 95 137 155 156 151 140 143
69 83 141 156 160 156 146 150
68 87 126 153 163 158 152 155
68 88 126 153 164 158 155 155`);
const huImg = G(`0 0 0 0 0 0 0 0 0 0
0 0 0 0 0 0 0 0 0 0
0 0 1 1 1 0 1 1 0 0
0 0 0 1 1 1 1 0 0 0
0 0 0 1 1 1 1 0 0 0
0 0 0 0 0 1 1 0 0 0
0 0 0 0 0 0 0 0 0 0
0 0 0 0 0 0 0 0 0 0`);
const tight = { abs: 0.0005, rel: 0.005 };

export default {
  id: 'practice',
  title: 'Practice sheets (gyakorló)',
  lab: 'Gyakorló',
  lesson: '13-practice.md',
  exercises: [
    // ============ sheet 1
    {
      id: 'prc-1a', type: 'calc', points: 2, title: 'Sheet 1 · 1a) Histogram',
      prompt: '*Gyakorló feladat az eddigi témakörökből, task 1 (2 + 6 points).*\n\nThe image below has **eight possible grey levels (0…7)**. Draw (here: count) the **histogram** of the image.',
      grids: [{ title: 'f(x, y)', data: histImg, image: true }],
      fields: [{ key: 'h', label: 'h(r) for r = 0 … 7', shape: [1, 8], int: true, colLabels: deg8, rowLabels: ['h'] }],
      solve: () => ({ h: [L.histogram(histImg, 8)] }),
      hints: ['Count row by row and check that the counts add up to 64.'],
      explain: 'h = [12, 8, 7, 4, 14, 8, 10, 1], Σ = 64. Plotted as bars over r = 0…7 this is the histogram the sheet asks you to draw.',
    },
    {
      id: 'prc-1b', type: 'calc', points: 6, title: 'Sheet 1 · 1b) Histogram equalisation',
      prompt: 'Equalise the histogram of the same image: **s = round(7 · Σ_{i≤r} p(i))** with p(i) = h(i)/64, rounding half up. Give the grey-level mapping and the transformed image.',
      grids: [{ title: 'f(x, y)', data: histImg }],
      fields: [
        { key: 'map', label: 's = T(r) for r = 0 … 7', shape: [1, 8], int: true, colLabels: deg8, rowLabels: ['s'], pts: 2 },
        { key: 'out', label: 'transformed image', shape: [8, 8], int: true, pts: 4 },
      ],
      solve: () => { const e = L.histEq(histImg, 8); return { map: [e.map], out: e.out }; },
      hints: ['Cumulative counts: 12, 20, 27, 31, 45, 53, 63, 64. Multiply each by 7/64 and round.', 'Then replace every pixel value r by T(r).'],
      explain: 'Cumulative: 12, 20, 27, 31, 45, 53, 63, 64 → ·7/64 = 1.31, 2.19, 2.95, 3.39, 4.92, 5.80, 6.89, 7 → T = [1, 2, 3, 3, 5, 6, 7, 7]. Levels 2 and 3 merge (both → 3), level 0 moves up to 1: the result uses the range more evenly but cannot be perfectly flat because the values are discrete.',
      wrong: [{ map: [['0', '2', '3', '3', '5', '6', '7', '7']] }],
    },
    {
      id: 'prc-2a', type: 'calc', points: 6, title: 'Sheet 1 · 2a) Sobel on a square',
      prompt: '*Task 2 (6 + 4 + 2 points).* A **10 × 10** binary image has a **4 × 4 square of ones in the middle** (x, y = 4…7, 1-based) and zeros elsewhere. Apply the **Sobel** operator (zero padding outside the image).\n\nfx = (x2 + 2x5 + x8) − (x0 + 2x3 + x6), fy = (x6 + 2x7 + x8) − (x0 + 2x1 + x2) — right − left, bottom − top.\n\nThe gradient is zero except in the 6 × 6 block **x, y = 3…8**. Give fx and fy there.',
      grids: [{ title: 'f(x, y)', data: square }],
      fields: [
        { key: 'gx', label: 'fx (x, y = 3…8)', shape: [6, 6], int: true, rowLabels: ['3', '4', '5', '6', '7', '8'], colLabels: ['3', '4', '5', '6', '7', '8'], pts: 3 },
        { key: 'gy', label: 'fy (x, y = 3…8)', shape: [6, 6], int: true, rowLabels: ['3', '4', '5', '6', '7', '8'], colLabels: ['3', '4', '5', '6', '7', '8'], pts: 3 },
      ],
      solve: () => ({ gx: R6(sob.gx), gy: R6(sob.gy) }),
      hints: ['Left edge of the square: fx > 0, right edge: fx < 0. Top edge: fy > 0 (bright below), bottom edge: fy < 0.', 'Along a straight edge the full column weight 1 + 2 + 1 = 4 applies; at a corner only part of it (1 or 3).'],
      explain: 'Rows of fx (y = 3…8): [1 1 0 0 −1 −1], [3 3 0 0 −3 −3], [4 4 0 0 −4 −4], [4 4 0 0 −4 −4], [3 3 0 0 −3 −3], [1 1 0 0 −1 −1]; fy is its transpose with signs “bright below” positive. The gradient direction (atan2(fy, fx)) always points from the background **into** the square: 0° on the left edge, 90° (downwards) on the top edge, 45° at the top-left corner, etc. — this is what the sheet asks you to draw as arrows.',
    },
    {
      id: 'prc-2b', type: 'calc', points: 4, title: 'Sheet 1 · 2b) Two distance notions',
      prompt: 'Compute the gradient **magnitude** in the same 6 × 6 block with **both distance notions** of the lecture:\n\n- Euclidean: |∇f|₂ = √(fx² + fy²)\n- Manhattan (city block): |∇f|₁ = |fx| + |fy|',
      fields: [
        { key: 'e', label: '|∇f|₂ (x, y = 3…8)', shape: [6, 6], rowLabels: ['3', '4', '5', '6', '7', '8'], colLabels: ['3', '4', '5', '6', '7', '8'], pts: 2 },
        { key: 'm', label: '|∇f|₁ (x, y = 3…8)', shape: [6, 6], int: true, rowLabels: ['3', '4', '5', '6', '7', '8'], colLabels: ['3', '4', '5', '6', '7', '8'], pts: 2 },
      ],
      solve: () => ({ e: R6(sob.mag), m: R6(sob.mag1) }),
      hints: ['Use your fx, fy from 2a. √(1+1) = 1.414, √(1+9) = 3.162, √(9+9) = 4.243.'],
      explain: 'Along the straight parts of the edges one of fx, fy is 0, so both norms give 4. They differ only where both components are non-zero – the **corner regions**.',
    },
    {
      id: 'prc-2c', type: 'calc', points: 2, title: 'Sheet 1 · 2c) Where do they differ?',
      prompt: 'Where and by how much do the two results differ? Give the **largest difference** |∇f|₁ − |∇f|₂, the **number of pixels** where the two differ, and the gradient **direction** (degrees, atan2(fy, fx), y pointing down) at the top-left corner pixel **(x, y) = (3, 3)** and at **(4, 4)**.',
      fields: [
        { key: 'max', label: 'largest difference' },
        { key: 'n', label: 'number of pixels that differ', int: true },
        { key: 'd33', label: 'direction at (3, 3) [°]' },
        { key: 'd44', label: 'direction at (4, 4) [°]' },
      ],
      solve: () => {
        const d = L.zip(R6(sob.mag1), R6(sob.mag), absDiff).flat();
        return { max: Math.max(...d), n: d.filter((v) => v > 1e-9).length, d33: sob.dir[2][2], d44: sob.dir[3][3] };
      },
      hints: ['They differ only where fx ≠ 0 and fy ≠ 0: 3 pixels at each of the 4 corners.'],
      explain: 'The difference is largest at the diagonal corner pixels such as (4, 4): |∇f|₁ = 6 but |∇f|₂ = √18 ≈ 4.243 → 1.757. The Manhattan norm over-estimates diagonal gradients by up to a factor √2; along horizontal/vertical edges the two are identical. Directions: 45° at both corner pixels (pointing into the square).',
    },
    {
      id: 'prc-3', type: 'calc', points: 3, title: 'Sheet 1 · 3) Median filter on |i − j|',
      prompt: '*Task 3 (3 points).* Let **f(i, j) = |i − j|**, i, j = 0, 1, …, 7 (an 8 × 8 image). Apply a **3 × 3 median filter**; the **border pixels must not change**. Give the inner 6 × 6 result (i, j = 1…6, i = row).',
      grids: [{ title: 'f(i, j) = |i − j|  (headers 0-based)', data: absIJ, base: 0 }],
      fields: [{ key: 'm', label: 'median, i, j = 1…6', shape: [6, 6], int: true, base: 1 }],
      solve: () => ({ m: L.sub(L.median(absIJ, 3, 'keep'), 1, 1, 6, 6) }),
      hints: ['On the main diagonal the 3×3 window holds 0, 0, 0, 1, 1, 1, 1, 2, 2 → median 1.', 'Away from the diagonal the image is a linear ramp, and the median of a ramp is the centre value.'],
      explain: 'Only the diagonal changes: every inner diagonal pixel 0 becomes **1** (the zero line is one pixel wide, and the median deletes thin lines). Everything else stays: on a ramp the median equals the centre value, and next to the diagonal (value 1) the window still has five values ≤ 1.',
    },
    // ============ sheet 2
    {
      id: 'prc-4', type: 'calc', points: 10, title: 'Sheet 2 · 1) Hough transform',
      prompt: '*Korábbi képfeldolgozás témákhoz gyakorló feladat, task 1 (10 points).* Run a **Hough transform** on the binary image and give the **two most relevant lines**.\n\nUse the normal form **x·cosθ + y·sinθ = ρ** with x = column, y = row, **0-based**, origin at the top-left pixel, θ ∈ {0°, 45°, 90°, 135°} and ρ rounded to the nearest integer.',
      grids: [{ title: 'E(x, y)  (headers 0-based)', data: houghImg, base: 0 }],
      fields: [
        { key: 'a0', label: 'votes for θ = 0°, ρ = 0 … 7', shape: [1, 8], int: true, colLabels: deg8, rowLabels: ['0°'], pts: 3 },
        { key: 'a90', label: 'votes for θ = 90°, ρ = 0 … 7', shape: [1, 8], int: true, colLabels: deg8, rowLabels: ['90°'], pts: 3 },
        { key: 'lines', label: 'the two strongest lines: θ, ρ, votes', shape: [2, 3], unordered: 'rows', colLabels: ['θ', 'ρ', 'votes'], rowLabels: ['1', '2'], pts: 4 },
      ],
      solve: () => {
        const h = L.houghLines(houghImg, [0, 45, 90, 135]);
        const row = (t) => [Array.from({ length: 8 }, (_, r) => h.lines.find((l) => l.theta === t && l.rho === r)?.votes ?? 0)];
        return { a0: row(0), a90: row(90), lines: h.lines.slice(0, 2).map((l) => [l.theta, l.rho, l.votes]) };
      },
      hints: ['θ = 0°: ρ = x, so the votes are just the column counts. θ = 90°: ρ = y → row counts.', 'Check 45° and 135° too: the best cells there get only 4 votes (e.g. θ = 135°, ρ = 0: the pixels (1,1), (3,3), (4,4), (5,5)).'],
      explain: 'Column x = 1 contains 8 edge pixels → (θ = 0°, ρ = 1) with 8 votes: the vertical line **x = 1**. Row y = 3 contains 6 → (θ = 90°, ρ = 3) with 6 votes: the horizontal line **y = 3**. The diagonal candidates reach only 4 votes. In the (θ, ρ) accumulator each pixel votes once per θ, and the local maxima are the lines.',
    },
    {
      id: 'prc-5', type: 'calc', points: 12, title: 'Sheet 2 · 2) Feature point with the H matrix',
      prompt: '*Task 2 (12 points).* Decide which pixel of the **marked area** is the most characteristic feature point, using the **smaller eigenvalue** of the H matrix **averaged over a 3 × 3 window**.\n\nConventions fixed here (the sheet does not show the marking): the marked area is the **central 2 × 2 block, x, y = 3…4** (1-based); derivatives by the **central difference** Ix = I(x+1, y) − I(x−1, y), Iy = I(x, y+1) − I(x, y−1); H = (1/9)·Σ over the 3 × 3 window of [Ix², IxIy; IxIy, Iy²] = [A, B; B, C]; λ− = (A + C)/2 − √(((A − C)/2)² + B²).',
      grids: [{ title: 'I(x, y)', data: harrisImg, highlight: [[2, 2], [2, 3], [3, 2], [3, 3]] }],
      fields: [
        { key: 'A', label: 'A = avg Ix²', shape: [2, 2], rowLabels: ['y=3', 'y=4'], colLabels: ['x=3', 'x=4'], tol: 0.5, pts: 2 },
        { key: 'B', label: 'B = avg IxIy', shape: [2, 2], rowLabels: ['y=3', 'y=4'], colLabels: ['x=3', 'x=4'], tol: 0.5, pts: 2 },
        { key: 'C', label: 'C = avg Iy²', shape: [2, 2], rowLabels: ['y=3', 'y=4'], colLabels: ['x=3', 'x=4'], tol: 0.5, pts: 2 },
        { key: 'l', label: 'λ−', shape: [2, 2], rowLabels: ['y=3', 'y=4'], colLabels: ['x=3', 'x=4'], tol: 1, pts: 4 },
        { key: 'best', label: 'the feature point (x, y)', shape: [1, 2], int: true, colLabels: ['x', 'y'], rowLabels: [''], pts: 2 },
      ],
      solve: () => {
        const h = harris(); const lm = C2(h.lmin);
        let best = [0, 0]; lm.forEach((r, i) => r.forEach((v, j) => { if (v > lm[best[0]][best[1]]) best = [i, j]; }));
        return { A: C2(h.A), B: C2(h.B), C: C2(h.C), l: lm, best: [[best[1] + 3, best[0] + 3]] };
      },
      hints: ['First compute Ix and Iy for x, y = 2…5 (16 pixels each) – every 3 × 3 window around the four candidates uses them.', 'Example: at (3, 3) the window covers x, y = 2…4; Σ Ix² = 24660 → A = 2740.'],
      explain: 'λ− (rounded): (3,3) 2203, (4,3) 2507, (3,4) 1574, (4,4) 2080. The largest smaller eigenvalue is at **(x, y) = (4, 3)**: there the intensity changes strongly in every direction (both eigenvalues are large). A large λ+ with a small λ− would only be an edge.',
    },
    // ============ sheet 3
    {
      id: 'prc-6a', type: 'calc', points: 3, title: 'Sheet 3 · 1a) Descriptor matrix of the half cube',
      prompt: '*Objektum leírása és mozgatása transzformációk használatával (10 points).* Half of a unit cube (a triangular prism) stands with its right-angle edge on the **y axis**: its cross-section in the xz plane is the triangle (0,0), (1,0), (0,1), and it extends from y = 0 to y = 1. The diagonal face has side lengths 1 and √2.\n\nWrite its **homogeneous descriptor matrix** (4 × 6, one column per vertex) in this vertex order:\n\n1 = (0,0,0), 2 = (1,0,0), 3 = (0,0,1), 4 = (0,1,0), 5 = (1,1,0), 6 = (0,1,1).',
      fields: [{ key: 'D', label: 'descriptor matrix', shape: [4, 6], int: true, rowLabels: ['x', 'y', 'z', '1'], colLabels: ['1', '2', '3', '4', '5', '6'] }],
      solve: () => ({ D: L.descriptor(wedge) }),
      explain: 'Rows x, y, z and the homogeneous 1; columns = vertices. Multiplying this matrix from the left by a 4 × 4 transformation moves every vertex at once.',
    },
    {
      id: 'prc-6b', type: 'steps', points: 7, title: 'Sheet 3 · 1b) Move the half cube',
      prompt: 'Move the prism into the **target pose** (green, dashed): it lies on its **diagonal face** (the √2 × 1 rectangle is on the xy plane), the right-angle edge on top, occupying **x ∈ [−√2, 0]**, y ∈ [0, 1].\n\nThe object may **not be resized** and may **never go below the xy plane** (also not while rotating). Write the sequence of elementary transformations; Run shows the position after every step – this is the “new position after each elementary transformation” the sheet asks for.',
      vertices: wedge, edges: wedgeEdges, target: wedgeTarget,
      constraints: { minZ: 0, rigid: true },
      starter: '# one transformation per line, e.g.\n# Ry(90) about (1, 0, 0)\n',
      solution: 'Tran(-1, 0, 0)\nRy(135)\nTran(-sqrt(2), 0, 0)',
      hints: ['Rotating about the y axis through the origin would push the vertex (1,0,0) below the ground. Tip it over its bottom edge at x = 1 instead.', 'Ry(+θ) turns the z axis towards +x. The diagonal face must turn from 135° to 0° around the edge at x = 1 → 135°.', 'After `Ry(135) about (1, 0, 0)` the prism lies at x ∈ [1, 1 + √2]; one more translation finishes it.'],
      explain: 'One solution: Tran(−1, 0, 0) moves the bottom edge x = 1 onto the y axis (nothing goes below z = 0), Ry(135°) tips the prism onto its diagonal face (it stays above the ground during the whole rotation), Tran(−√2, 0, 0) places it. Composite: T = Tran(−√2,0,0) · Ry(135°) · Tran(−1,0,0). Equivalent: `Ry(135) about (1,0,0)` then `Tran(-1-sqrt(2), 0, 0)`.',
      wrong: ['Ry(135)\nTran(0, 0, 0)', 'Ry(-45)\nTran(0,0,0.7071)'],
    },
    // ============ sheet 4
    {
      id: 'prc-7', type: 'calc', points: 6, title: 'Sheet 4 · 1) Shape number',
      prompt: '*Gyakorló feladatok (topic 11), task 1 (6 points).* Assume the **8-direction chain code** `076666553321212`. Compute its **first difference** (circular: dᵢ = (cᵢ − cᵢ₋₁) mod 8, the first element uses the last code element) and the **shape number**.',
      fields: [
        { key: 'd', label: 'first difference', kind: 'str', pts: 3 },
        { key: 's', label: 'shape number', kind: 'str', pts: 3 },
      ],
      solve: () => ({ d: L.chainDiff(chain, 8).join(''), s: L.shapeNumber(chain, 8) }),
      hints: ['d₀ = (0 − 2) mod 8 = 6 (the last code element is 2).', 'The shape number is the rotation of the difference code that reads as the smallest number – start at the longest run of zeros.'],
      explain: 'Difference: **677000706077171**. Rotations starting with 000…: 000706077171677 is the smallest → shape number **000706077171677**. It does not depend on the start point (rotation of the sequence) nor on rotating the object by multiples of 45°.',
      wrong: [{ s: '677000706077171' }],
    },
    {
      id: 'prc-8', type: 'calc', points: 6, title: 'Sheet 4 · 2) Isodata thresholding (optional)',
      prompt: '*Task 2 – the sheet notes: “not part of this year\'s material”.* The array contains the intensities of an image. Run the **iterative (Isodata) thresholding**: start with T₀ = (min + max)/2, then T = (μ_low + μ_high)/2 where μ_low is the mean of the values **≤ T**, until T no longer changes. Give T₁ and the final T (2 decimals). (The Niblack part with a 4 × 4 window is skipped here.)',
      grids: [{ title: 'f(x, y)', data: isoImg, image: true }],
      fields: [{ key: 't0', label: 'T₀' }, { key: 't1', label: 'T₁' }, { key: 't', label: 'final T' }],
      solve: () => { const r = L.isodata(isoImg, null, 1e-9); return { t0: r.steps[0].T, t1: r.steps[0].Tn, t: r.T }; },
      hints: ['min = 64, max = 164 → T₀ = 114.'],
      explain: 'The dark left columns (~64–101) and the bright right part (~122–164) separate quickly; the threshold settles after a few iterations.',
    },
    {
      id: 'prc-9', type: 'calc', points: 12, title: 'Sheet 4 · 3) Hu invariants and principal axis',
      prompt: '*Task 3 (8 + 4 points).* The ones mark the object (x = column →, y = row ↓, both **1-based**). Determine the **first two Hu invariants** and the direction of the **principal (moment) axis**.\n\nη_pq = μ_pq / μ00^((p+q)/2 + 1), φ1 = η20 + η02, φ2 = (η20 − η02)² + 4η11², tan 2θ = 2μ11 / (μ20 − μ02) — θ measured from +x towards +y, i.e. **clockwise on the screen** because y points down.',
      grids: [{ title: 'B(x, y)', data: huImg }],
      fields: [
        { key: 'A', label: 'area μ00', int: true, pts: 1 },
        { key: 'c', label: 'centroid (x̄, ȳ)', shape: [1, 2], colLabels: ['x̄', 'ȳ'], rowLabels: [''], pts: 1 },
        { key: 'mu', label: 'μ20, μ02, μ11', shape: [1, 3], colLabels: ['μ20', 'μ02', 'μ11'], rowLabels: [''], pts: 2 },
        { key: 'p1', label: 'φ1', tol: tight, pts: 2 },
        { key: 'p2', label: 'φ2', tol: { abs: 0.00005, rel: 0.01 }, pts: 2 },
        { key: 'th', label: 'θ of the principal axis [°]', tol: 0.5, pts: 4 },
      ],
      solve: () => { const m = L.moments(huImg, 1); return { A: m.area, c: [[m.xc, m.yc]], mu: [[m.mu['20'], m.mu['02'], m.mu['11']]], p1: m.hu[0], p2: m.hu[1], th: m.theta }; },
      hints: ['15 object pixels; x̄ = 84/15 = 5.6, ȳ = 63/15 = 4.2.', 'μ20 = Σ(x − x̄)², μ02 = Σ(y − ȳ)², μ11 = Σ(x − x̄)(y − ȳ). For η use μ00² (p + q = 2 → exponent 2).'],
      explain: 'μ20 = 29.6, μ02 = 16.4, μ11 = 4.2 → η20 = 0.1316, η02 = 0.0729, η11 = 0.0187 → φ1 ≈ 0.2044, φ2 ≈ 0.00484. tan 2θ = 8.4/13.2 → θ ≈ 16.2°: the axis is almost horizontal, tilted 16° clockwise on the screen (its right end lower), through the centroid (5.6, 4.2).',
    },
    {
      id: 'prc-10', type: 'calc', points: 8, title: 'Sheet 4 · 4) Signature of a square',
      prompt: '*Task 4 (8 points).* A square of side **a** stands on its vertex: its centroid is at the origin and its diagonals lie along the x and y axes (usual math axes, y up). Starting from the horizontal direction, plot the **gradient (outward normal) direction of the boundary as a function of the polar angle θ** (0°…360°).\n\nGive the value of this signature at θ = 30°, 120°, 200°, 300°, and the four angles where it jumps.',
      fields: [
        { key: 'v', label: 'gradient direction at θ = 30°, 120°, 200°, 300°', shape: [1, 4], colLabels: ['30°', '120°', '200°', '300°'], rowLabels: [''] },
        { key: 'j', label: 'jump positions (any order)', shape: [1, 4], unordered: 'cols', int: true, rowLabels: [''], colLabels: ['', '', '', ''] },
      ],
      solve: () => ({ v: [[45, 135, 225, 315]], j: [[0, 90, 180, 270]] }),
      hints: ['Between the vertices on the +x and +y axes the boundary is one straight edge – its outward normal points to 45°.'],
      explain: 'The signature is a **staircase**: 45° for 0° < θ < 90°, 135° for 90° < θ < 180°, 225° for 180° < θ < 270°, 315° for 270° < θ < 360°, jumping by 90° at the vertices (θ = 0°, 90°, 180°, 270°). It does not depend on a (scale invariant) and shifts when the square is rotated. For comparison, the distance signature of the same square is r(θ) = (a/√2) / (|cos θ| + |sin θ|): maximal at the vertices, minimal (a/2) at 45°, 135°, …',
    },
    c('prc-11', 'Sheet 4 · 4) Sketch the signature', 'Sketch both signatures of the square standing on its vertex (side a): the **gradient-direction** signature and the **distance** signature r(θ). What is each invariant to?',
      'Gradient-direction signature: a staircase with steps of 90° — 45° on (0°, 90°), 135° on (90°, 180°), 225° on (180°, 270°), 315° on (270°, 360°); jumps at the vertices θ = 0°, 90°, 180°, 270°.\n\nDistance signature: r(θ) = (a/√2) / (|cos θ| + |sin θ|) — four equal humps between the maxima a/√2 at the vertices and the minima a/2 at θ = 45°, 135°, 225°, 315°.\n\nBoth are **invariant to translation** (measured from the centroid). Rotating the object **shifts** the signature along θ (invariant if the start point is chosen consistently, e.g. at the farthest point). The direction signature is scale invariant; r(θ) becomes so after normalising to [0, 1].'),
  ],
};
