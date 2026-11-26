import { L, q, c } from './util.js';

const S = (m) => m.map((r) => r.map(String)); // matrix → strings (for `wrong` answers)

// 1-D convolution / correlation
const f1 = [2, 0, 1, 3];
const g1 = [1, 2, -1];
// 2-D convolution vs correlation
const img2 = [[4, 1, 0, 2, 6], [3, 5, 1, 6, 2], [0, 2, 4, 6, 1], [1, 7, 9, 8, 3], [5, 0, 2, 1, 4]];
const w2 = [[1, 2, 0], [0, 1, 0], [0, 0, -1]];
// box filter
const boxImg = [[12, 15, 14, 60, 62], [10, 13, 16, 64, 61], [11, 90, 15, 63, 65], [13, 12, 14, 66, 60], [10, 14, 13, 62, 64]];
// median (impulse noise)
const medImg = [[20, 22, 21, 23, 25], [21, 255, 22, 0, 24], [22, 23, 24, 22, 255], [0, 21, 255, 23, 22], [23, 22, 21, 24, 23]];
// median non-linearity
const pa = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
const pb = [[9, 0, 0], [0, 0, 0], [0, 0, 9]];
const med9 = (m) => m.flat().slice().sort((a, b) => a - b)[4];
// Laplace sharpening
const shImg = [[40, 40, 40, 40, 40], [40, 40, 40, 90, 90], [40, 40, 90, 90, 90], [40, 90, 90, 90, 90], [90, 90, 90, 90, 90]];
// 1-D unsharp masking
const f9 = [20, 20, 20, 50, 50, 50];
const A9 = 1.5;
const blur9 = () => f9.slice(1, -1).map((_, i) => (f9[i] + f9[i + 1] + f9[i + 2]) / 3);

const box9 = L.boxKernel(3);
const tiny = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]];

export default {
  id: 'filters',
  title: 'Filtering & convolution',
  lab: 'Lecture 5',
  lesson: '03-filters.md',
  exercises: [
    {
      id: 'flt-1', type: 'calc', title: '1-D convolution and correlation',
      prompt: 'Signal **f = [2 0 1 3]**, mask **g = [1 2 −1]**.\n\nCompute the **full** 1-D **convolution** f ∗ g and the **full correlation** of f with g (length 4 + 3 − 1 = 6; outside f the signal is 0).\n\n- Convolution: (f ∗ g)(n) = Σ f(i) · g(n − i) – the mask is **mirrored**, then slid along f.\n- Correlation: the mask is slid along f **without mirroring**. The first output value belongs to the position where only the **last** mask element overlaps f(1); the last output to the position where only the **first** mask element overlaps f(4).',
      fields: [
        { key: 'conv', label: 'f ∗ g (convolution)', shape: [1, 6], int: true },
        { key: 'corr', label: 'correlation', shape: [1, 6], int: true },
      ],
      solve: () => ({ conv: [L.convolve1D(f1, g1)], corr: [L.correlate1D(f1, g1)] }),
      wrong: [{ conv: S([L.correlate1D(f1, g1)]) }, { corr: S([L.convolve1D(f1, g1)]) }],
      hints: [
        'Convolution: mirror g to [−1 2 1], then slide it across f. First value: only 1·2 overlaps → 2.',
        'Correlation: slide [1 2 −1] itself. First value: only the last element (−1) overlaps f(1) = 2 → −2.',
      ],
      explain: 'Convolution (mirrored mask [−1 2 1] sliding left → right):\n\n- 2·1 = **2**\n- 2·2 + 0·1 = **4**\n- 2·(−1) + 0·2 + 1·1 = **−1**\n- 0·(−1) + 1·2 + 3·1 = **5**\n- 1·(−1) + 3·2 = **5**\n- 3·(−1) = **−3**\n\n→ f ∗ g = [2 4 −1 5 5 −3].\n\nCorrelation (unmirrored [1 2 −1]): −2, 2·2 + 0·(−1) = 4, 2·1 + 0·2 + 1·(−1) = 1, 0·1 + 1·2 + 3·(−1) = −1, 1·1 + 3·2 = 7, 3·1 = 3 → [−2 4 1 −1 7 3].\n\nThe correlation is the convolution with the mirrored mask – the two differ because g is **not symmetric**.',
    },
    {
      id: 'flt-2', type: 'calc', title: '2-D convolution vs correlation',
      prompt: 'Compute the response of the **non-symmetric** mask w at the pixel **x = 2, y = 3** (column 2, row 3, 1-based; the highlighted cell is the mask origin).\n\n1. as a **correlation**: g(x, y) = Σ w(k, l) · f(x + l, y + k), the mask is laid on the image as printed;\n2. as a **convolution** (lecture definition y(i, j) = Σ h(k, l) · x(i − k, j − l)): the mask is first **rotated by 180°**.',
      grids: [
        { title: 'f', data: img2, highlight: [[2, 1]] },
        { title: 'w (origin = centre)', data: w2 },
      ],
      fields: [
        { key: 'corr', label: 'correlation at (2, 3)', int: true },
        { key: 'conv', label: 'convolution at (2, 3)', int: true },
      ],
      solve: () => ({ corr: L.correlate(img2, w2)[2][1], conv: L.convolve(img2, w2)[2][1] }),
      wrong: [{ corr: String(L.convolve(img2, w2)[2][1]) }],
      hints: [
        'The 3×3 neighbourhood of (2, 3) is rows 2–4, columns 1–3: [3 5 1; 0 2 4; 1 7 9].',
        'Rotated mask: [−1 0 0; 0 1 0; 0 2 1].',
      ],
      explain: 'Neighbourhood N = [3 5 1; 0 2 4; 1 7 9].\n\n- Correlation: 1·3 + 2·5 + 1·2 + (−1)·9 = **6**.\n- Convolution: rotate w by 180° → [−1 0 0; 0 1 0; 0 2 1]; (−1)·3 + 1·2 + 2·7 + 1·9 = **22**.\n\nFor a symmetric mask (box, Gauss, Laplace) the rotation changes nothing, so the two operations coincide – that is why the difference is easy to forget.',
    },
    {
      id: 'flt-3', type: 'calc', title: '3×3 box filter by hand',
      prompt: 'Smooth the 5×5 image with the **3×3 box (averaging) filter** (1/9)·[1 1 1; 1 1 1; 1 1 1]. Compute only the **inner 3×3 pixels** (x, y = 2…4) and **round to the nearest integer** (half up).',
      grids: [{ title: 'f', data: boxImg, image: true }],
      fields: [{ key: 'g', label: 'g (inner 3×3, rows y = 2…4)', shape: [3, 3], int: true }],
      solve: () => ({ g: L.correlate(boxImg, box9, 'valid').map((r) => r.map(L.roundHalfUp)) }),
      wrong: [{ g: S(L.correlate(boxImg, box9, 'valid').map((r) => r.map(Math.floor))) }],
      hints: [
        'g(2, 2) = (12 + 15 + 14 + 10 + 13 + 16 + 11 + 90 + 15) / 9 = 196 / 9.',
        'Sliding to the right you can reuse the sum: drop the left column, add the new right column.',
      ],
      explain: 'Window sums (÷ 9):\n\n| y \\ x | 2 | 3 | 4 |\n| --- | --- | --- | --- |\n| 2 | 196 → 21.8 | 350 → 38.9 | 420 → 46.7 |\n| 3 | 194 → 21.6 | 353 → 39.2 | 424 → 47.1 |\n| 4 | 192 → 21.3 | 349 → 38.8 | 422 → 46.9 |\n\nRounded: [22 39 47; 22 39 47; 21 39 47].\n\nNote: the impulse 90 at (2, 3) is spread over its whole neighbourhood instead of being removed, and the edge between columns 3 and 4 becomes a ramp (39 → 47) – the averaging filter blurs edges.',
    },
    {
      id: 'flt-4', type: 'calc', title: 'Binomial 5×5 filter and separability',
      prompt: 'The binomial filter approximates the Gaussian. Its 1-D row of length n comes from **Pascal\'s triangle** (or from repeated convolution with [1 1]); the 2-D mask is the outer product of the row with itself, divided by the sum of all weights (1/2^(2p), p = n − 1).\n\nFor **n = 5** give:\n\n1. the 1-D row (integers),\n2. the normalising divisor of the 2-D mask,\n3. the centre weight of the **unnormalised** 2-D mask,\n4. the number of multiplications and additions per pixel when the 5×5 mask is applied directly in 2-D,\n5. the same when it is applied **separably** (a 1-D row pass, then a 1-D column pass).',
      fields: [
        { key: 'row', label: '1-D row', shape: [1, 5], int: true },
        { key: 'div', label: 'divisor', int: true },
        { key: 'cw', label: 'centre weight (unnormalised)', int: true },
        { key: 'm2', label: '2-D: multiplications', int: true },
        { key: 'a2', label: '2-D: additions', int: true },
        { key: 'm1', label: 'separable: multiplications', int: true },
        { key: 'a1', label: 'separable: additions', int: true },
      ],
      solve: () => {
        const n = 5, r = L.binomialRow(n);
        return { row: [r], div: L.sum(L.binomialKernel(n, false)), cw: L.binomialKernel(n, false)[2][2], m2: n * n, a2: n * n - 1, m1: 2 * n, a1: 2 * (n - 1) };
      },
      wrong: [{ div: '16' }, { a1: '10' }],
      hints: [
        'Pascal: 1 / 1 1 / 1 2 1 / 1 3 3 1 / 1 4 6 4 1.',
        'Divisor = (sum of the row)² = 16². A 1-D pass with n taps needs n multiplications and n − 1 additions.',
      ],
      explain: 'Row: **[1 4 6 4 1]** (sum 16 = 2⁴). The 2-D mask is the outer product, sum 16² = **256**, centre weight 6·6 = **36** (so the normalised centre is 36/256 ≈ 0.14).\n\n- Direct 2-D: n² = **25** multiplications, n² − 1 = **24** additions per pixel.\n- Separable: two 1-D passes, 2n = **10** multiplications, 2(n − 1) = **8** additions.\n\nThe saving grows with n (n² vs 2n). Because the weights are integers, the lecture notes that the multiplications can even be replaced by [1 1] passes (additions) and shifts.',
    },
    {
      id: 'flt-5', type: 'calc', title: 'Gaussian mask weights',
      prompt: 'The Gaussian smoothing mask is proportional to w(x, y) = exp(−(x² + y²) / (2σ²)), where (x, y) is measured from the mask centre.\n\n1. For **σ = 1** give the **unnormalised** weight of a corner cell (x = ±1, y = ±1).\n2. Give the whole **normalised** 3×3 mask (weights divided by their sum, 4 decimals are enough).\n3. The lecture\'s rule of thumb: mask height = width ≈ **5σ** (rounded to an odd integer). What size (n for an n×n mask) belongs to **σ = 1.4**?',
      fields: [
        { key: 'corner', label: 'corner weight (σ = 1, unnormalised)' },
        { key: 'k', label: 'normalised 3×3 mask (σ = 1)', shape: [3, 3], tol: 0.001 },
        { key: 'n', label: 'n for σ = 1.4', int: true },
      ],
      solve: () => {
        let n = Math.round(5 * 1.4);
        if (n % 2 === 0) n += 1;
        return { corner: Math.exp(-1), k: L.gaussKernel(3, 1), n };
      },
      wrong: [{ corner: String(Math.exp(-0.5)) }],
      hints: [
        'Centre: e⁰ = 1, edge cells: e^(−1/2) ≈ 0.6065, corners: e^(−2/2) = e⁻¹ ≈ 0.3679.',
        'Sum = 1 + 4·0.6065 + 4·0.3679 ≈ 4.8976; divide every weight by it.',
      ],
      explain: 'Unnormalised: centre 1, edge e^(−0.5) ≈ 0.6065, corner **e⁻¹ ≈ 0.3679**. Sum ≈ 4.8976, so the normalised mask is\n\n| 0.0751 | 0.1238 | 0.0751 |\n| --- | --- | --- |\n| 0.1238 | 0.2042 | 0.1238 |\n| 0.0751 | 0.1238 | 0.0751 |\n\n(Its sum is 1, so the mean brightness is kept.) For σ = 1.4: 5 · 1.4 = 7 → a **7×7** mask; larger σ needs a larger mask, otherwise the Gaussian is cut off and the filter starts to behave like a box filter (ringing).',
    },
    {
      id: 'flt-6', type: 'calc', title: 'Median filter on impulse noise',
      prompt: 'Apply a **3×3 median filter** to the image (salt-and-pepper noise: 0 and 255). **Border pixels are left unchanged.** Give the whole 5×5 result.',
      grids: [{ title: 'f', data: medImg, image: true }],
      fields: [{ key: 'g', label: 'median-filtered image', shape: [5, 5], int: true }],
      solve: () => ({ g: L.median(medImg, 3, 'keep') }),
      wrong: [{ g: S(L.median(medImg, 3, 'replicate')) }],
      hints: [
        'Sort the 9 values of each window and take the 5th one.',
        'Window of (2, 2): 20 21 21 22 22 22 23 24 255 → 22.',
      ],
      explain: 'Inner pixels (sorted window → 5th value):\n\n- (2, 2): 20 21 21 22 22 22 23 24 255 → **22**\n- (3, 2): 0 21 22 22 22 23 23 24 255 → **22**\n- (4, 2): 0 21 22 22 23 24 24 25 255 → **23**\n- (2, 3) … (4, 4) likewise → 22, 23, 23 / 22, 23, 23.\n\nEvery 0/255 impulse in the interior disappears, while the border impulses (0 at (1, 4), 255 at (5, 3)) stay because the border is not processed. A box filter would instead smear each impulse over 9 pixels.',
    },
    {
      id: 'flt-7', type: 'calc', title: 'The median is not linear',
      prompt: 'Two 3×3 windows are given. Compute the medians and check the lecture\'s statements: median{f₁ + f₂} ≠ median{f₁} + median{f₂} in general, but median{c · f} = c · median{f}.',
      grids: [{ title: 'f₁', data: pa }, { title: 'f₂', data: pb }],
      fields: [
        { key: 'm1', label: 'median{f₁}', int: true },
        { key: 'm2', label: 'median{f₂}', int: true },
        { key: 'm12', label: 'median{f₁ + f₂}', int: true },
        { key: 'm3', label: 'median{3 · f₁}', int: true },
      ],
      solve: () => ({ m1: med9(pa), m2: med9(pb), m12: med9(L.zip(pa, pb, (a, b) => a + b)), m3: med9(L.map(pa, (v) => 3 * v)) }),
      wrong: [{ m12: '5' }],
      hints: ['f₁ + f₂ = [10 2 3; 4 5 6; 7 8 18].'],
      explain: 'median{f₁} = **5**, median{f₂} = **0** (seven zeros). f₁ + f₂ = [10 2 3; 4 5 6; 7 8 18], sorted 2 3 4 5 **6** 7 8 10 18 → **6** ≠ 5 + 0. Scaling keeps the order of the values, so median{3f₁} = **15** = 3 · 5.\n\nThe median is a **rank-order (non-linear)** filter: it cannot be written as a mask (weighted sum), and it is **not** the same as a convolution.',
    },
    {
      id: 'flt-8', type: 'calc', title: 'Laplace sharpening',
      prompt: 'Sharpen the image with the Laplace sharpening mask\n\ng(x, y) = 5·f(x, y) − [f(x+1, y) + f(x−1, y) + f(x, y+1) + f(x, y−1)]  (mask [0 −1 0; −1 5 −1; 0 −1 0]).\n\nCompute the **inner 3×3** pixels and **clip** the result to 0…255.',
      grids: [
        { title: 'f', data: shImg, image: true },
        { title: 'mask', data: L.K.laplaceSharpen },
      ],
      fields: [{ key: 'g', label: 'g (inner 3×3, clipped)', shape: [3, 3], int: true }],
      solve: () => ({ g: L.correlate(shImg, L.K.laplaceSharpen, 'valid').map((r) => r.map((v) => L.clamp(v))) }),
      wrong: [{ g: S(L.correlate(shImg, L.K.laplaceSharpen, 'valid')) }],
      hints: ['g(3, 2) = 5·40 − (40 + 90 + 40 + 90) = −60 → clipped to 0.'],
      explain: 'Raw responses: [40 −60 190; −60 190 90; 190 90 90]. After clipping: **[40 0 190; 0 190 90; 190 90 90]**.\n\nIn flat regions (40 or 90) g = f, because the weights sum to 1 (5 − 4). At the step the dark side gets darker (undershoot) and the bright side brighter (overshoot): the contrast of the edge is increased. The mask is f − ∇²f with the lecture\'s 4-neighbour Laplacian ∇²f = f(x+1,y) + f(x−1,y) + f(x,y+1) + f(x,y−1) − 4f(x,y).',
    },
    {
      id: 'flt-9', type: 'calc', title: 'Unsharp masking and high-boost',
      prompt: '1-D signal **f = [20 20 20 50 50 50]**. Blur it with the 3-tap mean (1/3)·[1 1 1] (positions 2…5 only).\n\nThen compute for positions 2…5:\n\n- the **unsharp-masked** (sharpened) signal g_s = f − f̄ (original − blurred),\n- the **high-boost** signal g_hb = A·f − f̄ with **A = 1.5** (= (A − 1)·f + g_s).',
      fields: [
        { key: 'b', label: 'f̄ (positions 2…5)', shape: [1, 4] },
        { key: 'gs', label: 'g_s', shape: [1, 4] },
        { key: 'ghb', label: 'g_hb (A = 1.5)', shape: [1, 4] },
      ],
      solve: () => {
        const b = blur9();
        const f = f9.slice(1, -1);
        return { b: [b], gs: [f.map((v, i) => v - b[i])], ghb: [f.map((v, i) => A9 * v - b[i])] };
      },
      wrong: [{ ghb: [['30', '20', '75', '75']] }],
      hints: ['f̄ = [20 30 40 50].', 'g_hb = 0.5·f + g_s.'],
      explain: 'f̄ = [(20+20+20)/3, (20+20+50)/3, (20+50+50)/3, (50+50+50)/3] = **[20 30 40 50]**.\n\ng_s = f − f̄ = [20−20, 20−30, 50−40, 50−50] = **[0 −10 10 0]**: zero in flat parts, a negative/positive pair at the step (the high-frequency detail).\n\ng_hb = 1.5·f − f̄ = [30−20, 30−30, 75−40, 75−50] = **[10 0 35 25]** = 0.5·f + g_s: the detail is added on top of a (scaled) copy of the original, so the low frequencies are kept too. A = 1 gives plain unsharp masking.',
    },
    {
      id: 'flt-10', type: 'code', title: 'Correlation with a 3×3 mask',
      prompt: 'Write `correlate3x3(img, k)` that applies the 3×3 mask `k` as a **correlation** (no flipping):\n\ng(y, x) = Σ_{i=−1..1} Σ_{j=−1..1} k[i+1][j+1] · img[y+i][x+j]\n\n**Border pixels are copied unchanged.** No rounding, no clipping. The tests use a sharpening mask, a box mask and a non-symmetric mask (so a convolution will not pass).',
      fn: 'correlate3x3',
      starter: 'function correlate3x3(img, k) {\n  const [h, w] = shape(img);\n  const out = clone(img);\n  // loop over the inner pixels and sum k[i+1][j+1] * img[y+i][x+j]\n  return out;\n}',
      solution: 'function correlate3x3(img, k) {\n  const [h, w] = shape(img);\n  const out = clone(img);\n  for (let y = 1; y < h - 1; y++)\n    for (let x = 1; x < w - 1; x++) {\n      let s = 0;\n      for (let i = -1; i <= 1; i++)\n        for (let j = -1; j <= 1; j++) s += k[i + 1][j + 1] * img[y + i][x + j];\n      out[y][x] = s;\n    }\n  return out;\n}',
      tests: [['@img:shapes', L.K.laplaceSharpen], [tiny, w2], ['@img:noisy', box9]],
      display: 'image',
      wrong: ['function correlate3x3(img, k) {\n  const [h, w] = shape(img);\n  const out = clone(img);\n  for (let y = 1; y < h - 1; y++)\n    for (let x = 1; x < w - 1; x++) {\n      let s = 0;\n      for (let i = -1; i <= 1; i++)\n        for (let j = -1; j <= 1; j++) s += k[1 - i][1 - j] * img[y + i][x + j];\n      out[y][x] = s;\n    }\n  return out;\n}'],
      hints: ['Two loops over the inner pixels (1 … h−2, 1 … w−2) and two over the mask offsets −1 … 1.', 'Read from `img`, write into `out` – never write the result back into the image you are reading.'],
      explain: 'Writing into a separate output is essential ("nem önmagába írjuk az eredményt"): otherwise already-filtered values would be reused. A convolution would index the mask as `k[1 - i][1 - j]`; for the symmetric sharpening and box masks this gives the same result, but not for the non-symmetric test mask.',
    },
    {
      id: 'flt-11', type: 'code', title: '3×3 median filter',
      prompt: 'Write `median3(img)`: every inner pixel is replaced by the **median of its 3×3 neighbourhood** (sort the 9 values, take the 5th). **Border pixels are copied unchanged.**',
      fn: 'median3',
      starter: 'function median3(img) {\n  const [h, w] = shape(img);\n  const out = clone(img);\n  // collect the 9 values, sort them numerically, take the middle one\n  return out;\n}',
      solution: 'function median3(img) {\n  const [h, w] = shape(img);\n  const out = clone(img);\n  for (let y = 1; y < h - 1; y++)\n    for (let x = 1; x < w - 1; x++) {\n      const v = [];\n      for (let i = -1; i <= 1; i++)\n        for (let j = -1; j <= 1; j++) v.push(img[y + i][x + j]);\n      v.sort((a, b) => a - b);\n      out[y][x] = v[4];\n    }\n  return out;\n}',
      tests: [['@img:saltpepper'], [medImg], [[[5, 3, 9, 1], [100, 2, 8, 7], [4, 6, 0, 10], [1, 1, 1, 1]]]],
      display: 'image',
      wrong: ['function median3(img) {\n  const [h, w] = shape(img);\n  const out = clone(img);\n  for (let y = 1; y < h - 1; y++)\n    for (let x = 1; x < w - 1; x++) {\n      let s = 0;\n      for (let i = -1; i <= 1; i++)\n        for (let j = -1; j <= 1; j++) s += img[y + i][x + j];\n      out[y][x] = s / 9;\n    }\n  return out;\n}', 'function median3(img) {\n  const [h, w] = shape(img);\n  const out = clone(img);\n  for (let y = 1; y < h - 1; y++)\n    for (let x = 1; x < w - 1; x++) {\n      const v = [];\n      for (let i = -1; i <= 1; i++)\n        for (let j = -1; j <= 1; j++) v.push(img[y + i][x + j]);\n      v.sort();\n      out[y][x] = v[4];\n    }\n  return out;\n}'],
      hints: ['`v.sort()` without a compare function sorts as **strings** (100 < 20!). Use `v.sort((a, b) => a - b)`.'],
      explain: 'The median removes isolated 0/255 impulses completely and keeps step edges sharp, but it deletes 1-pixel-wide lines, single points and corners. Sorting 9 values per pixel is slower than a 3×3 mask (bubble-sorting only up to the 5th element takes 8 + 7 + 6 + 5 + 4 = 30 steps).',
    },
    q('flt-12', 'Salt-and-pepper noise', 'An image is corrupted by isolated black and white pixels (impulse / salt-and-pepper noise). Which filter removes them best while keeping the edges sharp?',
      ['3×3 box (averaging) filter', '3×3 median filter', 'Laplace sharpening', 'Gaussian filter with σ = 0.5'], 1,
      'The median ignores the extreme values of the window, so a single 0 or 255 never becomes the output, and a step edge is kept. Averaging filters (box, Gauss) spread the impulse over the neighbourhood and blur the edges; sharpening even amplifies the noise.'),
    q('flt-13', 'When do convolution and correlation agree?', 'For which masks do convolution and correlation give exactly the same result on every image?',
      ['For masks that are unchanged by a 180° rotation (point-symmetric masks)', 'For masks whose weights sum to 1', 'For masks whose weights sum to 0', 'Never – convolution always mirrors the image'], 0,
      'Convolution = correlation with the mask rotated by 180°. If the rotation leaves the mask unchanged (box, Gauss, binomial, Laplace), the two are identical. The sum of the weights only controls the overall brightness (1: mean kept, 0: flat regions → 0). Sobel x is not point-symmetric (it changes sign), so its convolution is the negated correlation.'),
    c('flt-14', 'Scale factor of low-pass masks', 'Why is a **scale factor equal to the sum of the mask weights** (e.g. 1/9, 1/16, 1/256) used for low-pass (smoothing) filters?',
      'Dividing by the sum makes the **normalised weights sum to 1** (DC gain = 1):\n\n- The **mean brightness of the image is kept** – the filter only redistributes intensity, it does not brighten or darken the image.\n- A **constant region stays unchanged**: if every pixel under the mask is c, the output is c · Σw / Σw = c.\n- The output stays in the **input range** (a weighted average of values in 0…255 is again in 0…255) → no overflow, no extra normalisation needed.\n\nWithout the factor, e.g. the 3×3 box mask would multiply every flat region by 9. (Masks for sharpening/edges have weights summing to 1 or 0 instead.)'),
  ],
};
