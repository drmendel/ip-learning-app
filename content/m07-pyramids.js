import { L, q, c } from './util.js';

// ---------------------------------------------------------------- data
const A2 = [0.4, 0.5, 3 / 8, 0.3];
const ALIAS = [0, 100, 0, 100, 0, 100, 0, 100];
const G4 = [8, 8, 24, 40, 56, 40, 24, 8];
const G5 = [10, 20, 40, 40, 30, 10, 10, 20];
const G6 = [16, 24, 40, 48, 32, 16, 8, 8];
const I7 = [
  [16, 32, 48, 16],
  [32, 64, 32, 16],
  [48, 32, 16, 0],
  [16, 16, 0, 0],
];
const pyr6 = () => {
  const g1 = L.reduce1D(G6, 0.5), g2 = L.reduce1D(g1, 0.5);
  const L1 = L.zip([g1], [L.expand1D(g2, 4, 0.5)], (u, v) => u - v)[0];
  const L0 = L.zip([G6], [L.expand1D(g1, 8, 0.5)], (u, v) => u - v)[0];
  return { g1, g2, L1, L0 };
};

// ---------------------------------------------------------------- code
const reduceStarter = `function reduce1D(g, a) {
  // kernel w = [c, b, a, b, c], b = 1/4, c = 1/4 − a/2
  // out(i) = Σ_{m=−2..2} w(m) · g(2i + m),  i = 0 … ceil(n/2) − 1
  // outside the signal use the nearest border sample (replicate)
  return g.filter((_, i) => i % 2 === 0);   // plain sub-sampling – no smoothing yet
}`;
const reduceSolution = `function reduce1D(g, a) {
  const w = [0.25 - a / 2, 0.25, a, 0.25, 0.25 - a / 2];
  const n = g.length, out = [];
  for (let i = 0; i < Math.ceil(n / 2); i++) {
    let s = 0;
    for (let m = -2; m <= 2; m++) s += w[m + 2] * g[Math.min(n - 1, Math.max(0, 2 * i + m))];
    out.push(s);
  }
  return out;
}`;

export default {
  id: 'pyramids',
  title: 'Image pyramids',
  lab: 'Lecture 8',
  lesson: '07-pyramids.md',
  exercises: [
    {
      id: 'pyr-1', type: 'calc', title: 'Size of a pyramid',
      prompt: 'A 512 × 512 (= 2⁹ × 2⁹) image is the base of a Gaussian pyramid; every level halves both sides, down to a 1 × 1 image.\n\n- How many levels does the pyramid have (base and 1 × 1 included)?\n- What is the side length after **3** REDUCE steps?\n- How many pixels does the whole pyramid contain, and how many times the base is that (4 decimals)?',
      fields: [
        { key: 'n', label: 'number of levels', int: true },
        { key: 's', label: 'side after 3 REDUCE steps', int: true },
        { key: 'tot', label: 'pixels in all levels', int: true },
        { key: 'ratio', label: 'total / base' },
      ],
      solve: () => {
        const sides = []; for (let s = 512; s >= 1; s /= 2) sides.push(s);
        const tot = sides.reduce((a, s) => a + s * s, 0);
        return { n: sides.length, s: sides[3], tot, ratio: tot / (512 * 512) };
      },
      hints: ['512, 256, 128, … , 2, 1 – count them.', 'Every level has ¼ of the pixels of the one below: 1 + ¼ + 1/16 + … → 4/3.'],
      explain: 'Sides 512, 256, …, 1 → **10 levels** (2⁹ … 2⁰). After 3 steps: 512/8 = **64**.\n\nTotal = 4⁹ + 4⁸ + … + 1 = (4¹⁰ − 1)/3 = **349 525** pixels ≈ **1.3333** × the base: the whole pyramid costs only one third more memory than the image itself.',
      wrong: [{ n: '9' }],
    },
    {
      id: 'pyr-2', type: 'calc', title: 'The REDUCE kernel',
      prompt: 'The generating kernel of the pyramid is the symmetric 5-tap mask **w = [c, b, a, b, c]** with\n\n- normalisation: a + 2b + 2c = 1,\n- equal contribution: every node contributes the same total weight to the next level: a + 2c = 2b.\n\nFrom these b = 1/4 and c = 1/4 − a/2. Give b and c for the four values of a.',
      fields: [{ key: 'k', label: 'b, c', shape: [4, 2], rowLabels: ['a = 0.4', 'a = 0.5', 'a = 3/8', 'a = 0.3'], colLabels: ['b', 'c'] }],
      solve: () => ({ k: A2.map((a) => { const w = L.pyramidKernel(a); return [w[1], w[0]]; }) }),
      hints: ['Add the two equations: (a + 2c) + 2b = 1 and a + 2c = 2b → 4b = 1.', 'c = (1 − a − 2b)/2.'],
      explain: 'b = **0.25** always. c = 0.25 − a/2:\n\n- a = 0.4 → c = **0.05**: [0.05 0.25 0.4 0.25 0.05] – **Gaussian-like**\n- a = 0.5 → c = **0**: [0 ¼ ½ ¼ 0] – **triangle** (linear interpolation)\n- a = 3/8 → c = **1/16**: [1 4 6 4 1]/16 – binomial, **easy to compute**\n- a = 0.3 → c = **0.1**: broader, flatter.',
    },
    {
      id: 'pyr-3', type: 'calc', title: 'Why smooth before sub-sampling?',
      prompt: 'The signal alternates between 0 and 100 (the finest possible detail).\n\n1. **Sub-sample** it: keep every second sample, starting with the first.\n2. **REDUCE** it instead with **a = 0.5** (kernel [0, ¼, ½, ¼, 0]): g₁(i) = Σ w(m)·g₀(2i + m); outside the signal use the nearest border sample (replicate).',
      grids: [{ title: 'g₀', data: [ALIAS] }],
      fields: [
        { key: 'sub', label: 'sub-sampled', shape: [1, 4] },
        { key: 'red', label: 'REDUCE (a = 0.5)', shape: [1, 4] },
      ],
      solve: () => ({ sub: L.downsample([ALIAS]), red: [L.reduce1D(ALIAS, 0.5)] }),
      hints: ['Samples 1, 3, 5, 7 are all 0.', 'g₁(1) = ¼·g₀(1) + ½·g₀(2) + ¼·g₀(3) (0-based) = 25 + 0 + 25.'],
      explain: 'Sub-sampling gives **[0 0 0 0]** – a flat black signal: the 100s simply disappear. This is **aliasing**: the detail is finer than the new sampling rate can represent and shows up as a false, low-frequency pattern.\n\nREDUCE gives **[25 50 50 50]** (the first value uses the replicated g₀(−1) = 0): the correct average grey. Low-pass filtering (averaging or Gaussian) before sub-sampling removes the frequencies that would alias.',
    },
    {
      id: 'pyr-4', type: 'calc', title: 'Two REDUCE steps by hand',
      prompt: 'Build a 1-D Gaussian pyramid with **a = 3/8**, i.e. w = [1, 4, 6, 4, 1]/16:\n\ng_l(i) = Σ_{m=−2..2} w(m)·g_{l−1}(2i + m)  (0-based i)\n\nOutside the signal use the nearest border sample (**replicate**). Compute g₁ (4 values) and g₂ (2 values).',
      grids: [{ title: 'g₀', data: [G4] }],
      fields: [
        { key: 'g1', label: 'g₁', shape: [1, 4] },
        { key: 'g2', label: 'g₂', shape: [1, 2] },
      ],
      solve: () => { const g1 = L.reduce1D(G4, 3 / 8); return { g1: [g1], g2: [L.reduce1D(g1, 3 / 8)] }; },
      hints: ['g₁(0) uses g₀(−2), g₀(−1), g₀(0), g₀(1), g₀(2) = 8, 8, 8, 8, 24 → (8 + 32 + 48 + 32 + 24)/16.', 'g₁(3) uses g₀(4…8) = 56, 40, 24, 8, 8 (g₀(8) is replicated).'],
      explain: 'g₁ = [(8 + 32 + 48 + 32 + 24)/16, (8 + 32 + 144 + 160 + 56)/16, (24 + 160 + 336 + 160 + 24)/16, (56 + 160 + 144 + 32 + 8)/16] = **[9 25 44 25]**.\n\ng₂(0): 9, 9, 9, 25, 44 → (9 + 36 + 54 + 100 + 44)/16 = 243/16 ≈ **15.19**; g₂(1): 9, 25, 44, 25, 25 → (9 + 100 + 264 + 100 + 25)/16 = 498/16 ≈ **31.13**.',
      wrong: [{ g1: [[8, 24, 56, 24]] }],
    },
    {
      id: 'pyr-5', type: 'calc', title: 'One Laplacian level',
      prompt: 'Use the triangle kernel **a = 0.5** (w = [0, ¼, ½, ¼, 0]), replicate at the borders.\n\n1. g₁ = REDUCE(g₀) (4 values).\n2. EXPAND(g₁) back to 8 samples: e(i) = 2·Σ_m w(m)·g₁((i − m)/2), only where (i − m)/2 is an integer. With a = 0.5 this is linear interpolation: e(2j) = g₁(j), e(2j + 1) = (g₁(j) + g₁(j + 1))/2 (the last one uses g₁(4) = g₁(3)).\n3. The Laplacian level L₀ = g₀ − EXPAND(g₁).',
      grids: [{ title: 'g₀', data: [G5] }],
      fields: [
        { key: 'g1', label: 'g₁', shape: [1, 4] },
        { key: 'e', label: 'EXPAND(g₁)', shape: [1, 8] },
        { key: 'l0', label: 'L₀ = g₀ − EXPAND(g₁)', shape: [1, 8] },
      ],
      solve: () => {
        const g1 = L.reduce1D(G5, 0.5), e = L.expand1D(g1, 8, 0.5);
        return { g1: [g1], e: [e], l0: [G5.map((v, i) => v - e[i])] };
      },
      hints: ['g₁(0) = ¼·10 + ½·10 + ¼·20 = 12.5 (g₀(−1) replicated as 10).', 'EXPAND: 12.5, (12.5 + 35)/2, 35, …'],
      explain: 'g₁ = **[12.5 35 27.5 12.5]**. EXPAND = **[12.5 23.75 35 31.25 27.5 20 12.5 12.5]**.\n\nL₀ = **[−2.5 −3.75 5 8.75 2.5 −10 −2.5 7.5]**: the details that the coarser level cannot represent – small numbers around 0, like an edge-filtered (band-pass) signal. That is why the Laplacian pyramid compresses well.',
    },
    {
      id: 'pyr-6', type: 'calc', title: 'Reconstruction from the Laplacian pyramid',
      prompt: 'A 1-D Laplacian pyramid (a = 0.5, replicate at the borders, EXPAND = linear interpolation as in the previous task) is stored as the **top level g₂** and the detail levels L₁, L₀. Reconstruct the image:\n\ng₁ = L₁ + EXPAND(g₂),  g₀ = L₀ + EXPAND(g₁).',
      grids: [{ title: 'g₂ (top)', data: [pyr6().g2] }, { title: 'L₁', data: [pyr6().L1] }, { title: 'L₀', data: [pyr6().L0] }],
      fields: [
        { key: 'g1', label: 'g₁', shape: [1, 4] },
        { key: 'g0', label: 'g₀', shape: [1, 8] },
      ],
      solve: () => ({ g1: [pyr6().g1], g0: [G6] }),
      hints: ['EXPAND(g₂) = [23, 25.5, 28, 28].', 'Then EXPAND(g₁) = [18, 28, 38, 35, 32, 21, 10, 10].'],
      explain: 'EXPAND(g₂) = [23 25.5 28 28] → g₁ = L₁ + … = **[18 38 32 10]**.\n\nEXPAND(g₁) = [18 28 38 35 32 21 10 10] → g₀ = L₀ + … = **[16 24 40 48 32 16 8 8]** – exactly the original. The reconstruction is **lossless** whatever the kernel is, because every L_k stored exactly what EXPAND missed; but the top level g₂ must be kept, since there is no coarser level to subtract from it.',
    },
    {
      id: 'pyr-7', type: 'calc', title: 'REDUCE in 2-D (separable)',
      prompt: 'The kernel is separable, so REDUCE in 2-D = 1-D REDUCE on **every row**, then on **every column** of the result. Use **a = 0.5** (w = [0, ¼, ½, ¼, 0]) and replicate at the borders.\n\nGive the intermediate 4 × 2 image (rows reduced) and the final 2 × 2 level g₁.',
      grids: [{ title: 'g₀', data: I7, image: true }],
      fields: [
        { key: 'r', label: 'rows reduced (4 × 2)', shape: [4, 2] },
        { key: 'g1', label: 'g₁ (2 × 2)', shape: [2, 2] },
      ],
      solve: () => ({ r: I7.map((row) => L.reduce1D(row, 0.5)), g1: L.reduce2D(I7, 0.5) }),
      hints: ['Row 1: [¼·16 + ½·16 + ¼·32, ¼·32 + ½·48 + ¼·16] = [20, 36].', 'Then column 1 of the 4 × 2 image: [20, 40, 44, 16] → reduce it the same way.'],
      explain: 'Rows: [20 36], [40 36], [44 16], [16 4].\n\nColumns: [20 40 44 16] → [¼·20 + ½·20 + ¼·40, ¼·40 + ½·44 + ¼·16] = [25, 36]; [36 36 16 4] → [36, 18].\n\ng₁ = **[25 36; 36 18]** – a quarter of the pixels.',
    },
    {
      id: 'pyr-8', type: 'code', title: 'REDUCE in 1-D',
      prompt: 'Write `reduce1D(g, a)` – one level of the Gaussian pyramid for a 1-D signal:\n\n- kernel w = [c, b, a, b, c] with b = 1/4, c = 1/4 − a/2,\n- out(i) = Σ_{m=−2..2} w(m)·g(2i + m) for i = 0 … ceil(n/2) − 1,\n- samples outside the signal: nearest border sample (replicate).\n\nThe starter only sub-samples – add the smoothing.',
      fn: 'reduce1D',
      starter: reduceStarter,
      solution: reduceSolution,
      tests: [[G4, 3 / 8], [ALIAS, 0.5], [G5, 0.4], [[3, 9, 1, 7, 5, 2, 8], 0.4], [[50], 0.5], [Array.from({ length: 16 }, (_, i) => (i * 37) % 23), 0.3]],
      tol: { abs: 1e-9, rel: 1e-9 },
      hints: ['`Math.min(n − 1, Math.max(0, k))` clamps an index to the signal.', 'w[m + 2] is the weight of offset m.'],
      explain: 'This is `lib.reduce1D`. In 2-D apply it to every row and then to every column (`lib.reduce2D`), because the kernel w(m, n) = w(m)·w(n) is separable.',
    },
    q('pyr-9', 'Identical levels (ZH theory)',
      'Which level of the Gaussian and the Laplacian pyramid is the same?',
      ['The base (the original image)', 'The top, coarsest (smallest) level', 'All levels – the Laplacian is just a copy', 'None of them'], 1,
      'L_k = g_k − EXPAND(g_{k+1}) needs a coarser level. The top level has none, so it is stored unchanged: L_top = g_top. It is needed for the reconstruction g_k = L_k + EXPAND(g_{k+1}), which starts from the top. (The lecture numbers the levels from the smallest image, so there it reads L₁ = g₁.)'),
    q('pyr-10', 'Sub-sampling',
      'What happens if a pyramid is built by simply dropping every second row and column, without smoothing?',
      ['Nothing – it is the same as REDUCE', 'Aliasing: fine details (edges, stripes) turn into false coarse patterns or vanish', 'The image becomes blurred', 'The pixel count does not decrease'], 1,
      'Sampling at half the rate cannot represent the highest frequencies; they fold back as false low frequencies (aliasing, e.g. moiré). A low-pass filter (averaging, Gaussian, e.g. σ ≈ 1–1.4 pixels) applied before sub-sampling removes them.'),
    c('pyr-11', 'Gaussian vs Laplacian pyramid (ZH theory, 2 points)',
      'Which level of the Gaussian and the Laplacian pyramid is the same, and why?',
      '- The **top (coarsest, smallest) level**: L_N = g_N.\n- **Why:** every other Laplacian level is a difference with the next coarser Gaussian level, L_k = g_k − EXPAND(g_{k+1}). The top level has no coarser level to subtract, so it is kept as it is.\n- It must be kept, because the reconstruction starts from it: g_{N−1} = L_{N−1} + EXPAND(g_N), …, g₀ = L₀ + EXPAND(g₁).\n- Note: the lecture numbers the levels from the smallest image (g₁ = coarsest), so in its notation **L₁ = g₁**.'),
  ],
};
