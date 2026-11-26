import { L, q, c } from './util.js';

// ---------------------------------------------------------------- data
// fea-1/2: a bright block with a corner at (3, 3) (1-based)
const F1 = [
  [2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2],
  [2, 2, 8, 8, 8],
  [2, 2, 8, 8, 9],
  [2, 3, 8, 9, 9],
];
const st1 = () => L.structureTensor(F1, { grad: 'central', win: 3, avg: false });
const inner3 = (m) => L.sub(m, 1, 1, 3, 3);

// fea-3: three given H matrices (flat, edge, corner)
const H3 = [[10, 2, 12], [800, 20, 2], [500, 100, 600]];

// fea-4: corner at (3, 3), straight horizontal edge at (5, 3)
const F2 = [
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 4, 4, 4, 4, 4],
  [0, 0, 4, 4, 4, 4, 4],
  [0, 0, 4, 4, 4, 4, 4],
];

// fea-5: Moravec
const M5 = [
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 1],
];
const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]]; // [dy, dx]: right, down, down-right, down-left
const moravecDirs = (img, y, x) => DIRS.map(([dy, dx]) => {
  let s = 0;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) s += (img[y + i + dy][x + j + dx] - img[y + i][x + j]) ** 2;
  return s;
});

// fea-6: template matching
const I6 = [
  [3, 1, 4, 1, 5],
  [9, 2, 6, 5, 3],
  [5, 8, 9, 7, 9],
  [3, 2, 3, 8, 4],
];
const T6 = [[6, 4], [9, 8]];

// fea-7: CC vs NCC on a 1-D signal
const S7 = [[1, 2, 3, 9, 9, 9, 2]];
const T7 = [[1, 2, 3]];

// ---------------------------------------------------------------- code
const ssdStarter = `function ssdMap(img, t) {
  // img: h×w, t: th×tw. Return an (h−th+1)×(w−tw+1) map:
  // out[y][x] = Σ (img[y+i][x+j] − t[i][j])²  (template's top-left corner at (x, y))
  const [h, w] = shape(img), [th, tw] = shape(t);
  return zeros(h - th + 1, w - tw + 1);
}`;
const ssdSolution = `function ssdMap(img, t) {
  const [h, w] = shape(img), [th, tw] = shape(t);
  return fromFn(h - th + 1, w - tw + 1, (y, x) => {
    let s = 0;
    for (let i = 0; i < th; i++) for (let j = 0; j < tw; j++) s += (img[y + i][x + j] - t[i][j]) ** 2;
    return s;
  });
}`;
const harrisStarter = `function harrisAt(img, y, x, k) {
  // 1. Ix = f(x+1, y) − f(x−1, y),  Iy = f(x, y+1) − f(x, y−1)  (no division by 2)
  // 2. A = Σ Ix², B = Σ Ix·Iy, C = Σ Iy² over the 3×3 window centred at (x, y)
  // 3. return R = A·C − B² − k·(A + C)²
  return 0;
}`;
const harrisSolution = `function harrisAt(img, y, x, k) {
  let A = 0, B = 0, C = 0;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const yy = y + i, xx = x + j;
    const ix = img[yy][xx + 1] - img[yy][xx - 1];
    const iy = img[yy + 1][xx] - img[yy - 1][xx];
    A += ix * ix; B += ix * iy; C += iy * iy;
  }
  return A * C - B * B - k * (A + C) ** 2;
}`;
const ramp = L.fromFn(6, 6, (y, x) => 10 * x + 3 * y);

export default {
  id: 'features',
  title: 'Corners, feature points & template matching',
  lab: 'Lectures 6–7',
  lesson: '05-features.md',
  exercises: [
    {
      id: 'fea-1', type: 'calc', title: 'Image derivatives by central difference',
      prompt: 'Compute the image derivatives with the **central difference** mask [−1 0 1] (no division by 2):\n\n- Ix(x, y) = f(x+1, y) − f(x−1, y)\n- Iy(x, y) = f(x, y+1) − f(x, y−1)  (y grows downwards)\n\nx = column, y = row, 1-based. Give Ix and Iy for the **inner 3×3** pixels (x, y = 2…4); the border pixels have no two neighbours.',
      grids: [{ title: 'f(x, y)', data: F1, image: true }],
      fields: [
        { key: 'ix', label: 'Ix (x, y = 2…4)', shape: [3, 3], int: true },
        { key: 'iy', label: 'Iy (x, y = 2…4)', shape: [3, 3], int: true },
      ],
      solve: () => { const s = st1(); return { ix: inner3(s.Ix), iy: inner3(s.Iy) }; },
      hints: ['Ix(2, 3) = f(3, 3) − f(1, 3) = 8 − 2 = 6.', 'Iy(3, 2) = f(3, 3) − f(3, 1) = 8 − 2 = 6.'],
      explain: 'Ix (rows y = 2…4): [0 0 0], [6 6 0], [6 6 1]. Iy: [0 6 6], [0 6 6], [1 0 1].\n\nIx is non-zero on the **vertical** edge (left side of the block), Iy on the **horizontal** edge (top side). Around (3, 3) both are present – that is what makes a corner.',
      wrong: [{ ix: [[0, 0, 0], [3, 3, 0], [3, 3, 0.5]] }],
    },
    {
      id: 'fea-2', type: 'calc', title: 'The H (structure) matrix and its eigenvalues',
      prompt: 'The derivatives of the previous task (inner 3×3 of f, centred at (3, 3)) are given below. Build the matrix\n\nH = Σ_W [Ix²  IxIy; IxIy  Iy²] = [A B; B C]\n\nover the whole **3×3 window** (plain sums, no averaging). Then compute the eigenvalues\n\nλ± = (A + C)/2 ± √(((A − C)/2)² + B²).\n\nRound λ to 2 decimals.',
      grids: [{ title: 'Ix', data: inner3(L.structureTensor(F1, { avg: false }).Ix) }, { title: 'Iy', data: inner3(L.structureTensor(F1, { avg: false }).Iy) }],
      fields: [
        { key: 'A', label: 'A = Σ Ix²', int: true }, { key: 'B', label: 'B = Σ Ix·Iy', int: true }, { key: 'C', label: 'C = Σ Iy²', int: true },
        { key: 'lp', label: 'λ+' }, { key: 'lm', label: 'λ−' },
      ],
      solve: () => {
        const s = st1(); const A = s.A[2][2], B = s.B[2][2], C = s.C[2][2]; const e = L.eig2(A, B, C);
        return { A, B, C, lp: e.lmax, lm: e.lmin };
      },
      hints: ['A = 4·36 + 1 = 145 (four 6s and one 1 in Ix).', 'B: multiply the two tables cell by cell: only the cells where both are non-zero count.'],
      explain: 'A = 4·6² + 1² = **145**, C = 4·6² + 1² + 1² = **146**. The cell-by-cell products Ix·Iy are [0 0 0], [0 36 0], [6 0 1] → B = **43**.\n\n(A + C)/2 = 145.5, √(0.5² + 43²) = √1849.25 ≈ 43.00 → **λ+ ≈ 188.50, λ− ≈ 102.50**. Both eigenvalues are large → **corner**.',
      wrong: [{ B: '36' }],
    },
    {
      id: 'fea-3', type: 'calc', title: 'Flat, edge or corner? λ− and R',
      prompt: 'Three windows gave the H matrices below (H = [A B; B C]). For each compute\n\n- the smaller eigenvalue λ− = (A + C)/2 − √(((A − C)/2)² + B²),\n- the response **R = det H − k·(trace H)²** with **k = 0.04** and with **k = 0.05**.\n\n(det H = AC − B², trace H = A + C.) Round to 2 decimals. Which one is flat, which is an edge and which is a corner?',
      grids: [{ title: 'A, B, C of the three windows', data: H3 }],
      fields: [{
        key: 't', label: 'λ−, R (k = 0.04), R (k = 0.05)', shape: [3, 3],
        rowLabels: ['window 1', 'window 2', 'window 3'], colLabels: ['λ−', 'R, k = 0.04', 'R, k = 0.05'],
      }],
      solve: () => ({
        t: H3.map(([a, b, cc]) => [L.eig2(a, b, cc).lmin, a * cc - b * b - 0.04 * (a + cc) ** 2, a * cc - b * b - 0.05 * (a + cc) ** 2]),
      }),
      hints: ['Window 1: det = 120 − 4 = 116, trace = 22, 0.04·484 = 19.36.', 'Window 2: det = 1600 − 400 = 1200, trace = 802 → R is negative.'],
      explain: '| window | λ− | R (0.04) | R (0.05) | type |\n| --- | --- | --- | --- | --- |\n| 1 | 8.76 | 96.64 | 91.80 | **flat** – both eigenvalues small, R small |\n| 2 | 1.50 | −24 528.16 | −30 960.2 | **edge** – one large, one ≈ 0 eigenvalue, R < 0 |\n| 3 | 438.20 | 241 600 | 229 500 | **corner** – both eigenvalues large, R ≫ 0 |\n\nA larger k subtracts more of trace², so the detector becomes **less sensitive** (fewer corners) – as the lecture says.',
    },
    {
      id: 'fea-4', type: 'calc', title: 'Corner detector by hand: two pixels',
      prompt: 'Compute the corner measures of the pixels **P = (3, 3)** and **Q = (5, 3)** (x = column, y = row, 1-based):\n\n1. Ix, Iy with the central difference [−1 0 1] (no division),\n2. A = Σ Ix², B = Σ IxIy, C = Σ Iy² over the 3×3 window centred at the pixel (plain sums),\n3. λ− (smaller eigenvalue) and R = AC − B² − k(A + C)² with **k = 0.04**.\n\nRound to 2 decimals.',
      grids: [{ title: 'f(x, y)', data: F2, highlight: [[2, 2], [2, 4]], image: true }],
      fields: [{
        key: 't', label: 'A, B, C, λ−, R', shape: [2, 5],
        rowLabels: ['P (3, 3)', 'Q (5, 3)'], colLabels: ['A', 'B', 'C', 'λ−', 'R'],
      }],
      solve: () => {
        const r = L.cornerResponse(F2, { grad: 'central', win: 3, avg: false, k: 0.04 });
        return { t: [2, 4].map((x) => [r.A[2][x], r.B[2][x], r.C[2][x], r.lmin[2][x], r.harris[2][x]]) };
      },
      hints: ['Around Q every column looks the same, so Ix = 0 in the whole window.', 'Around P: Ix = 4 at x = 2 for y = 3, 4; Iy = 4 at y = 2 and y = 3 for x = 3, 4 … list all nine values first.'],
      explain: '**P (3, 3)** – Ix in the window (x = 2…4, y = 2…4): [0 0 0], [4 4 0], [4 4 0] → A = 64; Iy: [0 4 4], [0 4 4], [0 0 0] → C = 64; IxIy is non-zero only at (3, 3): 4·4 → B = 16. λ− = 64 − 16 = **48**, R = 64·64 − 256 − 0.04·128² = **3184.64** → corner.\n\n**Q (5, 3)** – Ix = 0 everywhere, Iy = 4 in rows 2 and 3 → A = 0, B = 0, C = 96. λ− = **0**, R = 0 − 0 − 0.04·96² = **−368.64** → edge (change only across the edge).',
      wrong: [{ t: [[64, 16, 64, 48, 3840], [0, 0, 96, 0, 0]] }],
    },
    {
      id: 'fea-5', type: 'calc', title: 'Moravec operator',
      prompt: 'The **Moravec** operator shifts a 3×3 window by one pixel in 4 directions and sums the squared differences:\n\nV_d(x, y) = Σ_W (f(x+u, y+v) − f(x, y))², d ∈ {right (1, 0), down (0, 1), down-right (1, 1), down-left (−1, 1)}  (u = Δx, v = Δy)\n\nand takes the minimum V = min_d V_d.\n\nCompute the four sums and V for the pixel **P = (3, 3)**, and V for **Q = (4, 3)** (1-based).',
      grids: [{ title: 'f(x, y)', data: M5, highlight: [[2, 2], [2, 3]], image: true }],
      fields: [
        { key: 'v', label: 'P: V_right, V_down, V_down-right, V_down-left', shape: [1, 4], int: true },
        { key: 'vp', label: 'V(P)', int: true },
        { key: 'vq', label: 'V(Q)', int: true },
      ],
      solve: () => { const mo = L.moravec(M5, 3); return { v: [moravecDirs(M5, 2, 2)], vp: mo[2][2], vq: mo[2][3] }; },
      hints: ['Shifting the window around P to the right: the shifted window covers x = 3…5 – compare it cell by cell with the original (x = 2…4).', 'Q lies on a straight horizontal edge: one of the shifts does not change the window at all.'],
      explain: 'Window of P (x = 2…4, y = 2…4): [0 0 0], [0 1 1], [0 1 1].\n\n- right → [0 0 0], [1 1 1], [1 1 1]: 2 differences → **2**\n- down → [0 1 1], [0 1 1], [0 1 1]: **2**\n- down-right → all 1 except the top row: **5**\n- down-left → [0 0 1], [0 0 1], [0 0 1]: **3**\n\nV(P) = min = **2**. For Q the shift to the right gives the same window → **V(Q) = 0**: Moravec reports an edge only if *every* direction changes the window, so it is not a corner. (Weakness: only 4 directions, so it is anisotropic and noise-sensitive.)',
    },
    {
      id: 'fea-6', type: 'calc', title: 'Template matching with SSD and SAD',
      prompt: 'Slide the 2×2 template t over the image (only positions where it fits completely). For every position of its **top-left corner** (x, y) compute\n\n- SSD = Σ (I(x+i, y+j) − t(i, j))²\n- SAD = Σ |I(x+i, y+j) − t(i, j)|\n\nThe maps are 3 rows × 4 columns (y = 1…3, x = 1…4). Where is the best match (1-based top-left corner)?',
      grids: [{ title: 'I(x, y)', data: I6 }, { title: 't', data: T6 }],
      fields: [
        { key: 'ssd', label: 'SSD map', shape: [3, 4], int: true },
        { key: 'sad', label: 'SAD map', shape: [3, 4], int: true },
        { key: 'x', label: 'best x', int: true }, { key: 'y', label: 'best y', int: true },
      ],
      solve: () => {
        const m = L.matchTemplate(I6, T6); const [y, x] = L.argmin2(m.ssd);
        return { ssd: m.ssd, sad: m.sad, x: x + 1, y: y + 1 };
      },
      hints: ['Position (1, 1) covers [3 1; 9 2]: SSD = 9 + 9 + 0 + 36 = 54.', 'The best match is the **minimum** of SSD/SAD.'],
      explain: 'SSD: [54 78 31 67], [29 22 **2** 7], [89 103 54 43]; SAD: [12 14 11 15], [9 8 **2** 5], [17 19 12 11].\n\nBoth have their minimum at **x = 3, y = 2** (the patch [6 5; 9 7]). SSD punishes large differences much more than SAD (squares); SAD is cheaper and less sensitive to outliers.',
      wrong: [{ x: '2', y: '3' }],
    },
    {
      id: 'fea-7', type: 'calc', title: 'Cross-correlation vs normalised cross-correlation',
      prompt: 'Match the template t = [1 2 3] along the 1-D signal s (positions x = 1…5 = index of the first sample under the template). Compute\n\n- CC = Σ s·t (to be **maximised**),\n- NCC = Σ (s − s̄)(t − t̄) / √(Σ(s − s̄)² · Σ(t − t̄)²), where s̄ is the mean of the covered samples (define NCC = 0 if the patch is constant).\n\nRound to 2 decimals. At which position is the best match according to CC, and according to NCC?',
      grids: [{ title: 's', data: S7 }, { title: 't', data: T7 }],
      fields: [
        { key: 'cc', label: 'CC (x = 1…5)', shape: [1, 5] },
        { key: 'ncc', label: 'NCC (x = 1…5)', shape: [1, 5] },
        { key: 'bcc', label: 'best x by CC', int: true }, { key: 'bncc', label: 'best x by NCC', int: true },
      ],
      solve: () => {
        const m = L.matchTemplate(S7, T7);
        return { cc: m.cc, ncc: m.ncc, bcc: L.argmax2(m.cc)[1] + 1, bncc: L.argmax2(m.ncc)[1] + 1 };
      },
      hints: ['CC at x = 4: 9·1 + 9·2 + 9·3 = 54.', 't − t̄ = [−1 0 1], Σ(t − t̄)² = 2. At x = 1 the patch is exactly t → NCC = 1.'],
      explain: 'CC = [14 35 48 **54** 33] → CC picks x = 4, the **bright** constant part, although it does not look like the template at all. NCC = [**1** 0.92 0.87 0 −0.87] → NCC picks x = 1, the real ramp 1 2 3.\n\nNCC removes the mean and divides by the contrast, so it is invariant to brightness offset and gain – that is why it is preferred over plain CC.',
      wrong: [{ bcc: '1' }],
    },
    {
      id: 'fea-8', type: 'code', title: 'SSD map of a template',
      prompt: 'Write `ssdMap(img, t)` that slides the template `t` over `img` (valid positions only) and returns the map of **sums of squared differences**:\n\nout[y][x] = Σᵢ Σⱼ (img[y+i][x+j] − t[i][j])²\n\nindexed by the template\'s **top-left corner** (0-based). The size of the output is (h − th + 1) × (w − tw + 1). The best match is where the map is minimal.',
      fn: 'ssdMap',
      starter: ssdStarter,
      solution: ssdSolution,
      tests: [[I6, T6], [S7, T7], [L.fromFn(8, 9, (y, x) => (x * 7 + y * 13) % 17), [[3, 10], [0, 7], [14, 4]]]],
      display: 'auto',
      hints: ['Two loops for the position (y, x), two more for the template cell (i, j).', '`fromFn(h, w, (y, x) => …)` builds the output matrix.'],
      explain: 'Four nested loops: O(h·w·th·tw). In practice SSD is expanded as Σ I² − 2 Σ I·t + Σ t²: the middle term is a correlation (can be done with FFT), the first is a box sum (integral image) and the last is constant.',
      wrong: ['function ssdMap(img, t) { const [h, w] = shape(img), [th, tw] = shape(t); return fromFn(h - th + 1, w - tw + 1, (y, x) => { let s = 0; for (let i = 0; i < th; i++) for (let j = 0; j < tw; j++) s += Math.abs(img[y + i][x + j] - t[i][j]); return s; }); }'],
    },
    {
      id: 'fea-9', type: 'code', title: 'Corner response at one pixel',
      prompt: 'Write `harrisAt(img, y, x, k)` (0-based indices, the pixel is at least 2 pixels from the border) that returns\n\nR = det H − k·(trace H)² = A·C − B² − k·(A + C)²\n\nwhere A = Σ Ix², B = Σ Ix·Iy, C = Σ Iy² are **plain sums** over the 3×3 window centred at (x, y), and the derivatives use the central difference without division:\n\nIx = img[y][x+1] − img[y][x−1],  Iy = img[y+1][x] − img[y−1][x].',
      fn: 'harrisAt',
      starter: harrisStarter,
      solution: harrisSolution,
      tests: [[F2, 2, 2, 0.04], [F2, 2, 4, 0.04], [F1, 2, 2, 0.05], [ramp, 3, 2, 0.04], [M5, 2, 3, 0.06]],
      tol: { abs: 1e-6, rel: 1e-9 },
      hints: ['Loop over i, j = −1…1; for every window pixel (y+i, x+j) compute its own Ix and Iy.', 'Do not forget the minus sign of B²: det = AC − B².'],
      explain: 'This is exactly what `lib.cornerResponse(img, { avg: false, k })` computes for every pixel. On a linear ramp Ix and Iy are constant, so H has rank 1 (det = 0) and R = −k·trace² < 0: a ramp behaves like an edge.',
    },
    q('fea-10', 'Reading the eigenvalues',
      'The H matrix of a window has λ+ = 950 and λ− = 3. What is under the window?',
      ['A flat region', 'An edge: strong change only across it', 'A corner', 'Noise only – H cannot be computed'], 1,
      'One large and one near-zero eigenvalue: shifting the window **along** the edge (eigenvector of λ−) causes almost no change, shifting across it (eigenvector of λ+) a large one. Corner: both large; flat: both small.'),
    q('fea-11', 'Which name for which response?',
      'In **lecture 6** the method that thresholds the smaller eigenvalue, min(λ₁, λ₂) > Th, is called the *Harris corner detector*, and R = det(H) − k·trace(H)² (0 ≤ k ≤ 0.25) is attributed to *Kanade–Lucas–Tomasi*. How is it in most of the literature (and in lecture 7)?',
      ['The same as in lecture 6', 'The other way round: det − k·trace² is Harris (Harris–Stephens), min(λ) is Shi–Tomasi / KLT', 'Both are called Moravec', 'det − k·trace² is SUSAN'], 1,
      'Usual naming: **Harris (Harris–Stephens, 1988)**: R = det − k·trace² (k ≈ 0.04…0.06), no square root needed. **Shi–Tomasi** ("Good features to track", used by the KLT tracker): λ− > threshold. Lecture 7 (Seitz slides) uses "Harris operator" for f = det/trace = λ₁λ₂/(λ₁ + λ₂). In the ZH, write the formula, then the name is unambiguous.'),
    c('fea-12', 'SSD and SAD (ZH theory, 3 points)',
      'What do **SSD** and **SAD** mean? Where did we use them?',
      '- **SSD – Sum of Squared Differences**: Σ (I₁(x, y) − I₂(x, y))². **SAD – Sum of Absolute Differences**: Σ |I₁(x, y) − I₂(x, y)|. Both measure the *dissimilarity* of two equal-size image parts → the best match is the **minimum**.\n- SSD = Σ I₁² − 2 Σ I₁I₂ + Σ I₂²: minimising SSD is close to maximising the cross-correlation CC = Σ I₁I₂ (if Σ I₁² is roughly constant); NCC also normalises mean and contrast.\n- **Uses:**\n  - **template matching** (mintaillesztés): slide the template over the image, take the position with the smallest SSD/SAD;\n  - **feature point detection**: the SSD "error" E(u, v) = Σ_W (I(x+u, y+v) − I(x, y))² of a shifted window; its Taylor expansion gives E ≈ [u v] H [u v]ᵀ with H = Σ [Ix² IxIy; IxIy Iy²] → Harris / KLT (and Moravec uses the same sums for 4 shifts);\n  - **block matching** for motion estimation (video coding, optical flow) and **stereo correspondence** (disparity search along the epipolar line).\n- SAD is cheaper (no multiplication) and more robust to outliers; SSD is differentiable and penalises large errors more.'),
  ],
};
