import { L, q, c } from './util.js';

// ---------------------------------------------------------------- data (own examples)
const dark = [
  [200, 210, 190, 205, 198],
  [195, 60, 45, 150, 202],
  [188, 55, 40, 70, 120],
  [207, 180, 65, 185, 199],
];
const ptHist = [3, 5, 4, 6, 9, 7, 4, 2]; // L = 8, N = 40
const hyst = [
  [20, 120, 130, 30, 20],
  [40, 190, 110, 20, 140],
  [30, 150, 60, 20, 150],
  [20, 40, 130, 40, 160],
  [110, 20, 30, 200, 30],
];
const iso = [
  [10, 120, 180, 30],
  [60, 210, 20, 140],
];
const otsuHist = [6, 10, 8, 2, 1, 4, 7, 2]; // L = 8, N = 40
const nib = [
  [200, 190, 180, 170, 160],
  [195, 90, 85, 150, 155],
  [185, 80, 120, 140, 150],
  [180, 175, 70, 130, 145],
  [178, 170, 165, 160, 140],
];
const ccl = [
  [1, 1, 0, 0, 1, 0, 1],
  [0, 1, 0, 1, 1, 0, 1],
  [0, 0, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 0, 1, 0],
];
const grow = [
  [95, 98, 140, 150, 60],
  [92, 104, 108, 145, 99],
  [50, 97, 100, 103, 101],
  [55, 60, 112, 96, 94],
  [99, 58, 105, 91, 88],
];
const quad = [
  [1, 1, 1, 1, 0, 0, 0, 0],
  [1, 1, 1, 1, 0, 0, 0, 0],
  [1, 1, 1, 1, 0, 0, 1, 1],
  [1, 1, 1, 1, 0, 0, 1, 1],
  [0, 0, 1, 1, 0, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0],
];

// ---------------------------------------------------------------- helpers computed inline (not in the toolbox)
/** p-tile: smallest T whose cumulative count reaches p·N (dark object = levels <= T). */
function ptile(h, p) {
  const N = L.sum(h); let s = 0;
  for (let T = 0; T < h.length; T++) { s += h[T]; if (s >= p * N) return { T, n: s }; }
  return { T: h.length - 1, n: N };
}
/** First pass of the two-pass (sequential) labelling, 8-neighbourhood: number of provisional labels and of merges. */
function firstPass8(bin) {
  const h = bin.length, w = bin[0].length; const lab = L.zeros(h, w); let n = 0;
  const parent = [0]; const find = (a) => (parent[a] === a ? a : (parent[a] = find(parent[a])));
  let merges = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!bin[y][x]) continue;
    const nb = [[y, x - 1], [y - 1, x - 1], [y - 1, x], [y - 1, x + 1]].map(([a, b]) => lab[a]?.[b] || 0).filter((v) => v);
    if (!nb.length) { n++; parent.push(n); lab[y][x] = n; continue; }
    const m = Math.min(...nb); lab[y][x] = m;
    for (const v of nb) { const a = find(v), b = find(m); if (a !== b) { parent[Math.max(a, b)] = Math.min(a, b); merges++; } }
  }
  return { provisional: n, merges, final: n - merges };
}
/** Quadtree split of a binary 2^k × 2^k image: leaves, black (1) leaves, grey (internal) nodes. */
function quadtree(img, y = 0, x = 0, s = img.length) {
  const v = img.slice(y, y + s).flatMap((r) => r.slice(x, x + s));
  if (v.every((a) => a === v[0])) return { leaves: 1, black: v[0] ? 1 : 0, grey: 0 };
  const h = s / 2; const parts = [[y, x], [y, x + h], [y + h, x], [y + h, x + h]].map(([a, b]) => quadtree(img, a, b, h));
  return parts.reduce((acc, p) => ({ leaves: acc.leaves + p.leaves, black: acc.black + p.black, grey: acc.grey + p.grey }), { leaves: 0, black: 0, grey: 1 });
}
const window3 = (img, y, x) => [-1, 0, 1].flatMap((dy) => [-1, 0, 1].map((dx) => img[y + dy][x + dx]));
const popStd = (v) => { const m = L.mean(v); return Math.sqrt(L.mean(v.map((a) => (a - m) ** 2))); };

const otsuSolution = `function otsuThreshold(hist) {
  const N = hist.reduce((a, b) => a + b, 0);
  const p = hist.map((c) => c / N);
  let mu = 0;
  for (let i = 0; i < p.length; i++) mu += i * p[i];
  let qB = 0, muT = 0, best = 0, bestV = -1;
  for (let T = 0; T < p.length; T++) {
    qB += p[T];
    muT += T * p[T];
    const qO = 1 - qB;
    const v = qB > 0 && qO > 0 ? (mu * qB - muT) ** 2 / (qB * qO) : 0;
    if (v > bestV + 1e-12) { bestV = v; best = T; }
  }
  return best;
}`;

export default {
  id: 'segmentation',
  title: 'Thresholding & segmentation',
  lab: 'Lecture 10',
  lesson: '09-segmentation.md',
  exercises: [
    {
      id: 'seg-1', type: 'calc', title: 'Global and multi-level thresholding',
      prompt: 'A **dark object** lies on a bright background. Use the lecture\'s rule\n\n- **(a)** t(x, y) = 1 (object) if f(x, y) ≤ T, otherwise 0, with **T = 100**;\n- **(b)** three levels with **T₁ = 100, T₂ = 170**: f < T₁ → 255, T₁ ≤ f < T₂ → 128, otherwise 0.',
      grids: [{ title: 'f(x, y)', data: dark, image: true }],
      fields: [
        { key: 'bin', label: '(a) binary t', shape: [4, 5], int: true },
        { key: 'multi', label: '(b) three-level result', shape: [4, 5], int: true },
      ],
      solve: () => ({
        bin: L.map(dark, (v) => (v <= 100 ? 1 : 0)),
        multi: L.map(dark, (v) => (v < 100 ? 255 : v < 170 ? 128 : 0)),
      }),
      hints: ['Only the pixels 60, 45, 55, 40, 70 and 65 are ≤ 100.', 'In (b) the 150 and the 120 fall between the two thresholds.'],
      explain: '**(a)** The six dark pixels (60, 45, 55, 40, 70, 65) become 1, everything else 0 – a point operation, every pixel is decided on its own value only.\n\n**(b)** The same six pixels get 255, the two medium pixels (150 and 120) get 128, the bright background 0. Multi-level thresholding works well when the histogram has strong peaks separated by deep valleys.',
      wrong: [{ bin: [[0, 0, 0, 0, 0], [0, 1, 1, 1, 0], [0, 1, 1, 1, 0], [0, 0, 1, 0, 0]] }],
    },
    {
      id: 'seg-2', type: 'calc', title: 'p-tile thresholding',
      prompt: 'An image with **L = 8** grey levels (0…7) and N = 40 pixels has the histogram below. We know that the **dark object covers p = 25 %** of the image.\n\nThe p-tile method picks the **smallest T** for which the number of pixels with level ≤ T reaches p·N. Give T and the number of pixels that are then classified as object.',
      grids: [{ title: 'h(r) for r = 0 … 7', data: [ptHist], base: 0 }],
      fields: [{ key: 'T', label: 'T', int: true }, { key: 'n', label: 'object pixels', int: true }],
      solve: () => { const r = ptile(ptHist, 0.25); return { T: r.T, n: r.n }; },
      hints: ['p·N = 0.25 · 40 = 10 pixels.', 'Cumulative histogram: 3, 8, 12, …'],
      explain: 'p·N = 10. The cumulative counts are 3 (r ≤ 0), 8 (r ≤ 1), **12 (r ≤ 2)** → the first level where 10 is reached is **T = 2**. Because the histogram is discrete, the object then has 12 pixels (30 %), not exactly 10.\n\nThe p-tile method needs prior knowledge of the object size (e.g. a printed page: the text covers about p % of the paper).',
      wrong: [{ T: '3' }],
    },
    {
      id: 'seg-3', type: 'calc', title: 'Hysteresis thresholding',
      prompt: 'A **bright** object is searched with hysteresis thresholding, **T_low = 100, T_high = 180**:\n\n- f ≥ T_high → object;\n- f < T_low → background;\n- T_low ≤ f < T_high → object **only if it is connected to an object pixel** (8-neighbourhood, also through a chain of such in-between pixels).\n\nGive the binary result (1 = object) and the number of object pixels.',
      grids: [{ title: 'f(x, y)', data: hyst, image: true }],
      fields: [
        { key: 'out', label: 'result', shape: [5, 5], int: true },
        { key: 'n', label: 'number of object pixels', int: true },
      ],
      solve: () => { const o = L.hysteresis(hyst, 100, 180); return { out: o, n: L.sum(o) }; },
      hints: ['Start from the two strong pixels (190 and 200) and grow through 8-neighbours with value ≥ 100.', 'The 110 in the bottom-left corner has no in-between or strong neighbour.'],
      explain: 'Strong pixels: 190 at (2, 2) and 200 at (4, 5). From 190 the chain reaches 120, 130, 110, 150 and (diagonally) the 130 at (3, 4). From 200 it reaches 160 (diagonal), then 150 and 140 above it. The **110 at (1, 5)** is above T_low but isolated → background. Result: **10** object pixels.\n\nA single threshold at 100 would also keep that isolated pixel (11 pixels); a single threshold at 180 would keep only 2 pixels.',
      wrong: [{ n: '11' }],
    },
    {
      id: 'seg-4', type: 'calc', title: 'ISODATA by hand (optional)',
      prompt: '*(optional – the practice sheet marks ISODATA as not part of this year\'s material)*\n\nRun the ISODATA (iterative) threshold on the 8 pixels below. Start with **T₀ = 128**. "Low" class = values **≤ T**, "high" class = values > T; the new threshold is the mean of the two class means. Stop when T no longer changes.',
      grids: [{ title: 'f(x, y)', data: iso }],
      fields: [
        { key: 't1', label: 'T₁' }, { key: 't2', label: 'T₂' }, { key: 'T', label: 'final T' },
        { key: 'nlo', label: 'pixels in the low class at the end', int: true },
      ],
      solve: () => {
        const r = L.isodata(iso, 128, 1e-9);
        return { t1: r.steps[0].Tn, t2: r.steps[1].Tn, T: r.T, nlo: iso.flat().filter((v) => v <= r.T).length };
      },
      hints: ['Iteration 1: low = {10, 30, 60, 20, 120}, high = {180, 210, 140}.', 'With T₁ ≈ 112.3 the 120 switches to the high class.'],
      explain: '- T₀ = 128: μ_low = (10+30+60+20+120)/5 = 48, μ_high = (180+210+140)/3 = 176.67 → **T₁ = 112.33**.\n- T₁: the 120 is now high. μ_low = 120/4 = 30, μ_high = 650/4 = 162.5 → **T₂ = 96.25**.\n- T₂: the classes do not change → T₃ = 96.25 = T₂, stop. **T = 96.25**, 4 low pixels.\n\nISODATA works well when object and background have about the same number of pixels.',
      wrong: [{ T: '112.33' }],
    },
    {
      id: 'seg-5', type: 'calc', title: 'Otsu by hand',
      prompt: 'Histogram of an image with **L = 8** levels (0…7), N = 40 pixels. Class B = levels **≤ T**, class O = levels > T. With p_i = h(i)/N\n\nq_B(T) = Σ_{i≤T} p_i,  μ(T) = Σ_{i≤T} i·p_i,  μ = Σ i·p_i (mean of the whole image)\n\nσ_B²(T) = (μ·q_B(T) − μ(T))² / (q_B(T)·(1 − q_B(T)))\n\nCompute μ, q_B(2), μ(2), σ_B² for T = 2, 3 and 4, and the Otsu threshold (the T with the largest σ_B²).',
      grids: [{ title: 'h(i) for i = 0 … 7', data: [otsuHist], base: 0 }],
      fields: [
        { key: 'mu', label: 'μ' }, { key: 'q2', label: 'q_B(2)' }, { key: 'm2', label: 'μ(2)' },
        { key: 's2', label: 'σ_B²(2)' }, { key: 's3', label: 'σ_B²(3)' }, { key: 's4', label: 'σ_B²(4)' },
        { key: 'T', label: 'Otsu T', int: true },
      ],
      solve: () => {
        const o = L.otsu(otsuHist); const N = L.sum(otsuHist); const p = otsuHist.map((v) => v / N);
        return { mu: o.mu, q2: p[0] + p[1] + p[2], m2: p[1] + 2 * p[2], s2: o.sigmaB[2], s3: o.sigmaB[3], s4: o.sigmaB[4], T: o.T };
      },
      hints: ['μ = (0·6 + 1·10 + 2·8 + 3·2 + 4·1 + 5·4 + 6·7 + 7·2)/40 = 112/40.', 'q_B(2) = 24/40 = 0.6, μ(2) = (10 + 16)/40 = 0.65.', 'σ_B²(2) = (2.8·0.6 − 0.65)² / (0.6·0.4).'],
      explain: 'μ = 112/40 = **2.8**.\n\n| T | q_B | μ(T) | σ_B² |\n| --- | --- | --- | --- |\n| 2 | 24/40 = 0.6 | 26/40 = 0.65 | (1.68 − 0.65)²/0.24 = **4.420** |\n| 3 | 26/40 = 0.65 | 32/40 = 0.8 | (1.82 − 0.8)²/0.2275 = **4.573** |\n| 4 | 27/40 = 0.675 | 36/40 = 0.9 | (1.89 − 0.9)²/0.219375 = **4.468** |\n\nThe maximum is at **T = 3** (levels 0…3 → class B). The between-class variance rises until T = 3 and falls afterwards – Otsu assumes a bimodal histogram with a single maximum of σ_B².',
      wrong: [{ T: '2' }],
    },
    {
      id: 'seg-6', type: 'calc', title: 'Niblack and mean − C (optional)',
      prompt: '*(optional – Niblack is not part of this year\'s ZH material, but the local idea is)*\n\nCompute the local threshold for the **centre pixel (x = 3, y = 3)** using its **3×3 window**:\n\n- Niblack: T = μ + k·σ with **k = −0.2** (dark object), σ = population standard deviation (divide by 9);\n- dynamic: T = μ − C with **C = 7**.\n\nIs the centre pixel an object pixel with the Niblack threshold (object: f ≤ T → 1, otherwise 0)?',
      grids: [{ title: 'f(x, y)', data: nib, highlight: [[2, 2]] }],
      fields: [
        { key: 'mu', label: 'μ (3×3)' }, { key: 'sd', label: 'σ (3×3)' },
        { key: 'tn', label: 'T Niblack' }, { key: 'tc', label: 'T = μ − C' },
        { key: 'obj', label: 'centre pixel (1 = object, 0 = background)', int: true },
      ],
      solve: () => {
        const w = window3(nib, 2, 2); const tn = L.niblack(nib, 3, -0.2)[2][2];
        return { mu: L.mean(w), sd: popStd(w), tn, tc: L.mean(w) - 7, obj: nib[2][2] <= tn ? 1 : 0 };
      },
      hints: ['The window: 90, 85, 150, 80, 120, 140, 175, 70, 130 – sum 1040.', 'σ² = Σ(f − μ)²/9.'],
      explain: 'μ = 1040/9 = **115.56**, σ = √(Σ(f − μ)²/9) = **34.11**.\n\nNiblack: T = 115.56 − 0.2·34.11 = **108.73**; mean − C: T = 115.56 − 7 = **108.56**. The centre value 120 is above both → **background (0)**.\n\nThe threshold now depends on the position: T(x, y) = μ(x, y) + k·σ(x, y) follows uneven illumination. k < 0 for dark objects, k > 0 for bright ones, |k| ≈ 0.2…0.5; the window must be small enough to keep local details and large enough to suppress noise (the lecture uses 15×15).',
    },
    {
      id: 'seg-7', type: 'calc', title: 'Connected components: 4 vs 8 and the two-pass method',
      prompt: 'Binary image (1 = object). \n\n- **(a)** How many connected components are there with **4-neighbourhood** and with **8-neighbourhood**?\n- **(b)** Run the **first pass** of the sequential (two-pass) algorithm with 8-neighbourhood: scan left→right, top→bottom; a pixel looks at its already visited neighbours (left, top-left, top, top-right); if none is labelled it gets a **new label**, otherwise it takes one of theirs and different labels are recorded as **equivalent**. How many provisional labels are created, and how many equivalences (label merges) are recorded?',
      grids: [{ title: 'B(x, y)', data: ccl, image: true }],
      fields: [
        { key: 'c4', label: 'components (4-neighbourhood)', int: true },
        { key: 'c8', label: 'components (8-neighbourhood)', int: true },
        { key: 'prov', label: 'provisional labels (pass 1)', int: true },
        { key: 'eq', label: 'equivalences', int: true },
      ],
      solve: () => {
        const f = firstPass8(ccl);
        return { c4: L.labelComponents(ccl, 4).count, c8: L.labelComponents(ccl, 8).count, prov: f.provisional, eq: f.merges };
      },
      hints: ['With 8-neighbourhood the pixel (3, 3) joins the two groups at the top-left via diagonals.', 'Pass 1 creates labels at (1,1), (5,1), (7,1), (1,4), (5,4), (4,6), (6,6).'],
      explain: '**(a)** 4-neighbourhood: **7** components (diagonal contacts do not count). 8-neighbourhood: the top-left group, the single pixel (3, 3) and the group around (5, 1) are joined through diagonals → **5** components (top-left group, right-hand hook, bottom-left L, and the two single pixels in the last row).\n\n**(b)** Pass 1 creates **7** labels: a (1,1), b (5,1), c (7,1), d (1,4), e (5,4), f (4,6), g (6,6). Two equivalences are recorded: at (3, 3) **a = b** (top-left neighbour a, top-right neighbour b) and at (6, 4) **c = e** (left neighbour e, top-right neighbour c). Pass 2 replaces each label by its class representative: 7 − 2 = **5** components, as in (a).',
      wrong: [{ c8: '7' }],
    },
    {
      id: 'seg-8', type: 'calc', title: 'Region growing from a seed',
      prompt: 'Grow a region from the **seed (x = 3, y = 3)**. A pixel joins the region if it is a **4-neighbour** of a region pixel and |f − f(seed)| ≤ **10**. Give the region mask (1 = region) and its area.',
      grids: [{ title: 'f(x, y)', data: grow, highlight: [[2, 2]] }],
      fields: [
        { key: 'mask', label: 'region', shape: [5, 5], int: true },
        { key: 'A', label: 'area (pixels)', int: true },
      ],
      solve: () => { const m = L.regionGrow(grow, [2, 2], 10); return { mask: m, A: L.sum(m) }; },
      hints: ['Accepted values: 90 … 110.', 'The 99 in the bottom-left corner fits the range but is not connected to the region.'],
      explain: 'Allowed values 90…110. Starting from 100 the region spreads to 97, 103, 108, 104, 98, 95, 92, 101, 99 (top right), 96, 94, 91 and – through 91 – to 105. The 112 is too bright, so 105 can only be reached from 91. The 99 at (1, 5) has the right value but **no connected path** → not in the region. Area = **14**.\n\nRegion growing guarantees connected regions – unlike thresholding, which would also mark the isolated 99.',
      wrong: [{ A: '15' }],
    },
    {
      id: 'seg-9', type: 'calc', title: 'Split: quadtree of a binary image',
      prompt: 'Split the 8×8 binary image recursively into **4 equal quadrants** until every block is homogeneous (all 0 or all 1) – the quadtree of split-and-merge. The leaves are white (0) or black (1) blocks, the internal nodes are grey.\n\nHow many **leaves**, how many **black leaves** and how many **grey nodes** (including the root) does the tree have?',
      grids: [{ title: 'B(x, y)', data: quad, image: true }],
      fields: [
        { key: 'leaves', label: 'leaves', int: true },
        { key: 'black', label: 'black leaves', int: true },
        { key: 'grey', label: 'grey nodes', int: true },
      ],
      solve: () => quadtree(quad),
      hints: ['Top-left 4×4 quadrant: all 1 → one leaf. Bottom-right: all 0 → one leaf.', 'The bottom-left quadrant needs one more split down to single pixels.'],
      explain: 'Root (grey) → NW: black leaf; NE (grey): three white 2×2 leaves + one black 2×2 leaf; SW (grey): white, black and white 2×2 leaves + one mixed 2×2 block (grey) → 4 single pixels (1 black); SE: white leaf.\n\nLeaves = 1 + 4 + 3 + 4 + 1 = **13**, black = 1 + 1 + 1 + 1 = **4**, grey = root + NE + SW + SW-sub = **4**.\n\nIn split-and-merge the merge step would then join neighbouring uniform leaves (e.g. the white blocks) into larger regions.',
      wrong: [{ leaves: '10' }],
    },
    {
      id: 'seg-10', type: 'code', title: 'Otsu threshold from a histogram',
      prompt: 'Write `otsuThreshold(hist)`: `hist[i]` is the number of pixels with grey level i (i = 0 … L−1). Class B = levels **≤ T**. Return the **T that maximises** σ_B²(T) = (μ·q_B − μ(T))² / (q_B·(1 − q_B)) (if q_B = 0 or 1 take σ_B² = 0; on ties keep the smaller T).',
      fn: 'otsuThreshold',
      starter: 'function otsuThreshold(hist) {\n  const N = hist.reduce((a, b) => a + b, 0);\n  const p = hist.map((c) => c / N);\n  // TODO: try every T, compute σ_B²(T), keep the best\n  return Math.floor(hist.length / 2);\n}',
      solution: otsuSolution,
      tests: [[otsuHist], [[1, 3, 9, 5, 2, 1, 6, 5]], [[2, 8, 6, 3, 1, 2, 9, 9]], [[0, 12, 30, 8, 0, 0, 1, 3, 20, 14, 2, 0, 0, 0, 0, 0]], [[5, 40, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 30, 10]]],
      display: 'auto',
      hints: ['Accumulate q_B and μ(T) while T runs from 0 upwards – one pass is enough.', 'μ (the global mean) is computed once before the loop.'],
      explain: 'The running sums make Otsu O(L): q_B(T) = q_B(T−1) + p_T and μ(T) = μ(T−1) + T·p_T. Maximising the between-class variance is equivalent to minimising the within-class variance, because their sum (the total variance) does not depend on T.',
      wrong: ['function otsuThreshold(hist) {\n  const N = hist.reduce((a, b) => a + b, 0);\n  let s = 0, m = 0;\n  hist.forEach((c, i) => { m += i * c; });\n  return Math.round(m / N);\n}'],
    },
    q('seg-11', 'Global, local or dynamic?', 'The lecture writes the threshold as T = T{x, y, A(x, y), I(x, y)}, where A(x, y) is a local property of the neighbourhood (e.g. the window mean). Which type of thresholding is this?',
      ['Global', 'Local', 'Dynamic', 'p-tile'], 2,
      'Global: T = T{I(x, y)} – one value for the whole image. Local: T = T{A(x, y), I(x, y)}. **Dynamic**: T also depends on the **position (x, y)**, e.g. T(x, y) = window mean − C or Niblack\'s μ + kσ.'),
    q('seg-12', 'Region- vs edge-based segmentation', 'Which statement is **true**?',
      ['Edge detection always yields closed object boundaries.',
        'Region segmentation yields closed boundaries; edge detection is a local operation and usually does not.',
        'Region segmentation gives more precise boundary positions than edge detection.',
        'Adding features (motion, texture) helps edge detection much more than region segmentation.'], 1,
      'From the lecture\'s comparison: region segmentation produces **closed** boundaries and is global; edge detection is local, its boundaries are usually not closed (needs edge linking, relaxation), but it locates boundary points precisely. Richer feature vectors mostly help region segmentation.'),
    c('seg-13', 'Region segmentation', 'Define segmentation into regions. List the region-based approaches and explain the idea of the **phagocyte** algorithm.',
      '**Definition:** split I(x, y) into connected regions R₁ … Rₙ with **∪ Rᵢ = I** and **Rᵢ ∩ Rⱼ = ∅** (i ≠ j); inside each region a similarity predicate holds, **P(Rᵢ) = 1** (e.g. equal intensities, max − min ≤ threshold, deviation from the region mean ≤ threshold, small variance). Good segmentation: homogeneous regions without holes, clearly different neighbours, simple and accurate boundaries.\n\n**Approaches:** region growing (from seeds), merge, split, **split and merge** (quadtree: split non-uniform blocks into 4, merge similar neighbours, stop when neither is possible), phagocyte algorithm, likelihood-ratio test. Seed segmentation: smooth the histogram, find peaks/valleys (peakiness test), threshold, then connected-component labelling.\n\n**Phagocyte:** merges regions across **weak boundaries**. On the crack edges between R₁ and R₂ a boundary point is weak (W = 1) if |I(x_R1) − I(x_R2)| < T. Two regions are merged if the weak part is large compared with the smaller perimeter, W/min(P₁, P₂) ≥ T₂ (T₂ < ½ lets the boundary grow, > ½ shrink), or compared with the whole common boundary (W/|boundary| ≥ T₃). Like region merging, but based on boundary weakness – the regions "eat" each other.'),
  ],
};
