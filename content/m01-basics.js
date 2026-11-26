import { L, q, c } from './util.js';

// ---------------------------------------------------------------- data
const H6 = [[0, 2, 2, 3], [1, 2, 3, 3], [2, 3, 5, 6], [2, 2, 3, 7]];          // bas-6, L = 8
const H7 = [[1, 3, 3, 2, 4], [0, 3, 4, 4, 3], [2, 3, 5, 3, 1], [3, 4, 6, 3, 2]]; // bas-7, L = 8, 20 pixels
const I10 = [[1, 2, 0, 3], [2, 1, 4, 1], [0, 3, 2, 2], [1, 0, 1, 4]];          // bas-10
const I11 = [[3, 1, 4, 1, 5], [2, 6, 5, 3, 5], [8, 9, 7, 9, 3], [2, 3, 8, 4, 6], [2, 6, 4, 3, 3]]; // bas-11
const I12 = [[1, 2, 0, 1, 3, 2], [2, 5, 6, 1, 0, 1], [1, 7, 4, 2, 1, 0], [0, 6, 5, 1, 2, 1], [2, 1, 0, 3, 1, 1]]; // bas-12

/** s(x, y) = s(x, y − 1) + i(x, y): cumulative column sum (down the rows). */
const colCum = (img) => img.map((r, y) => r.map((_, x) => img.slice(0, y + 1).reduce((a, rr) => a + rr[x], 0)));

const ops = 1024 * 1024;           // one operation per pixel
const passMs = ops * 1e-8 * 1000;  // ms per pass

export default {
  id: 'basics',
  title: 'Digital images & data structures',
  lab: 'Lectures 2–3',
  lesson: '01-basics.md',
  exercises: [
    {
      id: 'bas-1', type: 'calc', title: 'Storage and real-time budget',
      prompt: 'Lecture 3 example: a **1024 × 1024** greyscale image with **8 bits** per pixel.\n\n1. How many **bytes** does it take?\n2. How many bytes does a **512 × 512 RGB** image take (8 bits per channel, no compression)?\n3. One operation per pixel at **10⁻⁸ s / operation**: how many **milliseconds** does one pass over the 1024 × 1024 image take?\n4. At **25 fps** a frame lasts 40 ms. How many such full passes fit into one frame (whole passes only)?',
      fields: [
        { key: 'b1', label: 'bytes (1024², 8 bit)', int: true },
        { key: 'b2', label: 'bytes (512², RGB)', int: true },
        { key: 'ms', label: 'one pass [ms]' },
        { key: 'n', label: 'passes per frame', int: true },
      ],
      solve: () => ({ b1: (1024 * 1024 * 8) / 8, b2: 512 * 512 * 3, ms: passMs, n: Math.floor(40 / passMs) }),
      hints: ['1024 × 1024 = 2²⁰ pixels, 8 bits = 1 byte each.', 'RGB = 3 bytes per pixel.', '2²⁰ · 10⁻⁸ s = 0.01048576 s.'],
      explain: '1. 2²⁰ pixels × 1 byte = **1 048 576 B** (1 MB).\n2. 512 · 512 · 3 = **786 432 B**.\n3. 2²⁰ · 10⁻⁸ s ≈ 0.010486 s ≈ **10.49 ms** – the lecture rounds this to "about 10 ms".\n4. 40 / 10.49 ≈ 3.8 → only **3** full passes per frame. Real algorithms need many operations per pixel, so real-time processing is tight – this is why the lecture stresses data-parallel implementations.',
      wrong: [{ n: '4' }, { b2: '262144' }],
    },
    {
      id: 'bas-2', type: 'calc', title: 'Quantisation levels',
      prompt: 'Quantisation with k bits gives **L = 2ᵏ** grey levels, numbered 0 … L − 1.\n\n1. How many levels does a **6-bit** image have, and what is the largest value?\n2. How many bits are needed at least to store **100** different levels?\n3. An 8-bit pixel value **203** is re-quantised to **4 bits** by dropping the 4 least significant bits. Which 4-bit **level** (0…15) does it get, and which 8-bit value represents that level if the dropped bits are set back to 0?',
      fields: [
        { key: 'L', label: 'L (6 bit)', int: true },
        { key: 'max', label: 'largest value (6 bit)', int: true },
        { key: 'bits', label: 'bits for 100 levels', int: true },
        { key: 'lvl', label: '4-bit level of 203', int: true },
        { key: 'rep', label: '8-bit value of that level', int: true },
      ],
      solve: () => ({ L: 2 ** 6, max: 2 ** 6 - 1, bits: Math.ceil(Math.log2(100)), lvl: 203 >> 4, rep: (203 >> 4) << 4 }),
      hints: ['2⁶ = 64, and counting starts at 0.', '2⁶ = 64 < 100 ≤ 128 = 2⁷.', '203 = 1100 1011₂ → keep 1100₂.'],
      explain: '1. L = 2⁶ = **64**, values 0…**63**.\n2. 6 bits give only 64 levels, 7 bits give 128 ≥ 100 → **7 bits**.\n3. 203 = 1100 1011₂. Dropping the lower 4 bits: 1100₂ = **12** (= ⌊203 / 16⌋). Shifting back: 12 · 16 = 1100 0000₂ = **192** (= 203 AND 240). This is the "grey-level reduction" of lecture 4.',
      wrong: [{ max: '64' }, { rep: '208' }],
    },
    q('bas-3', 'Sampling or quantisation?',
      'A camera stores 640 × 480 pixels, each with 256 grey levels. Which statement is correct?',
      ['640 × 480 is the result of quantisation, 256 levels of sampling',
        '640 × 480 is the result of sampling (discrete x, y), 256 levels of quantisation (discrete f)',
        'Both numbers are determined by quantisation only',
        'Sampling and quantisation are the same step, viewed in 1-D and 2-D'], 1,
      '**Sampling** measures the continuous image only at grid points → discrete coordinates (the resolution). **Quantisation** rounds the measured amplitude to one of L levels → discrete intensities. An image is digital if x, y **and** f are all discrete.'),
    q('bas-4', 'Level of processing',
      'According to the lecture, on which level of digital image processing does **segmentation** (splitting the image into parts / objects) belong?',
      ['Low level – input and output are both images', 'Intermediate level – input is an image, output is attributes extracted from it', 'High level – recognition and interpretation of the scene', 'It is not image processing but computer graphics'], 1,
      'Low level: image → image (noise filtering, sharpening, contrast). **Intermediate level**: segmentation, representation and description – the outputs are attributes of the components (some AI is needed). High level: recognition and interpretation of the objects as a whole.'),
    q('bas-5', 'DIP, CV or CG?',
      'A system receives a photo and outputs the text "two cars and a pedestrian on a crossing". Which field does this input/output pair belong to?',
      ['Digital image processing (image → image)', 'Computer graphics (description → image)', 'Computer vision (image → description)', 'Image compression (image → bit stream)'], 2,
      'Lecture 2 classifies the fields by input and output: **image → image** is image processing, **description → image** is computer graphics (rendering from models), **image → description** is computer vision (analysis, understanding), description → description is AI.'),
    {
      id: 'bas-6', type: 'calc', title: 'Histogram and cumulative histogram',
      prompt: 'The 4 × 4 image has **L = 8** grey levels (0…7). Compute the **histogram** h(k) = number of pixels with value k, and the **cumulative histogram** H(k) = number of pixels with value **≤ k**, for k = 0…7.',
      grids: [{ title: 'f(x, y)', data: H6 }],
      fields: [
        { key: 'h', label: 'h(k), k = 0…7', shape: [1, 8], int: true, colLabels: ['0', '1', '2', '3', '4', '5', '6', '7'] },
        { key: 'H', label: 'H(k), k = 0…7', shape: [1, 8], int: true, colLabels: ['0', '1', '2', '3', '4', '5', '6', '7'] },
      ],
      solve: () => { const h = L.histogram(H6, 8); return { h: [h], H: [L.cumulative(h)] }; },
      hints: ['Count the 2s carefully: there are six of them.', 'H(k) = H(k − 1) + h(k); the last value must be 16.'],
      explain: 'h = [1, 1, 6, 5, 0, 1, 1, 1] (sum 16).\n\nH = running sum = [1, 2, 8, 13, 13, 14, 15, 16]. H is never decreasing and ends at the number of pixels; where h(k) = 0 (k = 4) the cumulative histogram stays flat.',
      wrong: [{ H: '1 2 8 13 0 14 15 16' }],
    },
    {
      id: 'bas-7', type: 'calc', title: 'Normalised histogram and mean',
      prompt: 'The 4 × 5 image has **L = 8** grey levels. Compute the **normalised histogram** p(k) = h(k) / (M·N), its **cumulative** version P(k) = Σ_{j≤k} p(j) and the **mean intensity** μ = Σ k · p(k).',
      grids: [{ title: 'f(x, y)', data: H7 }],
      fields: [
        { key: 'p', label: 'p(k), k = 0…7', shape: [1, 8], colLabels: ['0', '1', '2', '3', '4', '5', '6', '7'] },
        { key: 'P', label: 'P(k), k = 0…7', shape: [1, 8], colLabels: ['0', '1', '2', '3', '4', '5', '6', '7'] },
        { key: 'mu', label: 'μ' },
      ],
      solve: () => { const p = L.normalizedHistogram(H7, 8); return { p: [p], P: [L.cumulative(p)], mu: p.reduce((s, v, k) => s + k * v, 0) }; },
      hints: ['M·N = 20, so every pixel is worth 0.05.', 'Counts: h = [1, 2, 3, 8, 4, 1, 1, 0].', 'μ = Σ k·p(k) is the same as the plain average of the 20 pixels.'],
      explain: 'h = [1, 2, 3, 8, 4, 1, 1, 0], divided by 20:\n\np = [0.05, 0.10, 0.15, 0.40, 0.20, 0.05, 0.05, 0]\n\nP = [0.05, 0.15, 0.30, 0.70, 0.90, 0.95, 1, 1]\n\nμ = 0·0.05 + 1·0.10 + 2·0.15 + 3·0.40 + 4·0.20 + 5·0.05 + 6·0.05 = **2.95** (= 59 / 20, the average of the pixels). The normalised histogram is an estimate of the probability density of the intensities, so it sums to 1 and P(L − 1) = 1.',
      wrong: [{ mu: '3.5' }],
    },
    c('bas-8', 'ZH: normalised histogram',
      'What is the **normalised histogram** of a greyscale image? How is it computed, what are its properties and what is it used for?',
      'Let the image have M × N pixels and L grey levels (0 … L − 1).\n\n- **Histogram**: h(rₖ) = nₖ, the number of pixels whose intensity is rₖ (k = 0 … L − 1).\n- **Normalised histogram**: the histogram values are divided by the number of pixels:\n  p(rₖ) = nₖ / (M·N).\n- Properties: 0 ≤ p(rₖ) ≤ 1 and Σₖ p(rₖ) = 1, so p(rₖ) is an estimate of the **probability** that a pixel has intensity rₖ. It does not depend on the image size, so images of different sizes can be compared. It carries no spatial information (shuffling the pixels gives the same histogram).\n- Cumulative (halmozott) version: P(rₖ) = Σ_{j≤k} p(rⱼ) – the fraction of pixels not brighter than rₖ; it is non-decreasing and ends at 1.\n- Uses: judging brightness/contrast (dark, bright, low- or high-contrast image), histogram stretching and **equalisation** (s = (L − 1)·P(r)), threshold selection (e.g. Otsu), mean and variance (μ = Σ rₖ p(rₖ)).\n- Computation: one pass over the image (`hist[p[y][x]]++`), easy to parallelise by data decomposition (partial histograms are summed).'),
    {
      id: 'bas-9', type: 'code', title: 'Normalised histogram in code',
      prompt: 'Write `normHist(img, L)` that returns an **array of length L** with p(k) = (number of pixels of value k) / (number of pixels). Pixel values are integers in 0 … L − 1.',
      fn: 'normHist',
      starter: 'function normHist(img, L) {\n  const h = new Array(L).fill(0);\n  // count, then divide by the number of pixels\n  return h;\n}',
      solution: 'function normHist(img, L) {\n  const h = new Array(L).fill(0);\n  for (const row of img) for (const v of row) h[v]++;\n  const n = img.length * img[0].length;\n  return h.map((c) => c / n);\n}',
      tests: [[[[0, 2, 2, 3], [1, 2, 3, 3], [2, 3, 5, 6], [2, 2, 3, 7]], 8], ['@img:shapes', 256], ['@img:checker', 256], [[[1, 1, 0]], 2]],
      display: 'auto',
      hints: ['`for (const row of img) for (const v of row) h[v]++;`', 'Divide by `img.length * img[0].length`.'],
      explain: 'One pass over the pixels, then one pass over the L bins. The result sums to 1. Forgetting the division gives the plain histogram; dividing by L instead of the pixel count is a common slip.',
      wrong: ['function normHist(img, L) { const h = new Array(L).fill(0); for (const r of img) for (const v of r) h[v]++; return h; }'],
    },
    {
      id: 'bas-10', type: 'calc', title: 'Integral image in two steps',
      prompt: 'Lecture 3 computes the integral image in one pass with two recurrences (x = column, y = row):\n\n- s(x, y) = s(x, y − 1) + i(x, y)  – cumulative **column** sum, s(x, 0) = 0\n- ii(x, y) = ii(x − 1, y) + s(x, y), ii(0, y) = 0\n\nso ii(x, y) = Σ i(x′, y′) over x′ ≤ x, y′ ≤ y. Fill in **s** and **ii** for the 4 × 4 image.',
      grids: [{ title: 'i(x, y)', data: I10 }],
      fields: [
        { key: 's', label: 's(x, y)', shape: [4, 4], int: true },
        { key: 'ii', label: 'ii(x, y)', shape: [4, 4], int: true },
      ],
      solve: () => ({ s: colCum(I10), ii: L.integralImage(I10) }),
      hints: ['s: go down each column and keep a running sum.', 'ii: go along each row of s and keep a running sum.', 'Check: ii(4, 4) is the sum of the whole image (27).'],
      explain: 's (running sums down the columns):\n\n```\n1 2 0 3\n3 3 4 4\n3 6 6 6\n4 6 7 10\n```\n\nii (running sums of s along the rows):\n\n```\n1  3  3  6\n3  6 10 14\n3  9 15 21\n4 10 17 27\n```\n\nThe bottom-right value 27 is the total of the image. Each pixel needs only two additions, so the whole table is built in a single pass.',
      wrong: [{ ii: '1 3 3 6\n3 6 10 14\n3 9 15 21\n4 10 17 28' }],
    },
    {
      id: 'bas-11', type: 'calc', title: 'Rectangle sum with 4 look-ups',
      prompt: 'Compute the integral image of the 5 × 5 image (in your head or on paper), then the sum of the **highlighted rectangle x = 2…4, y = 2…4** using only **four look-ups**:\n\nsum = ii(4, 4) − ii(4, 1) − ii(1, 4) + ii(1, 1)\n\n(here ii(x, y), x = column, y = row, 1-based). Enter the four look-up values and the sum.',
      grids: [{ title: 'i(x, y)', data: I11, highlight: [[1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3], [3, 1], [3, 2], [3, 3]] }],
      fields: [
        { key: 'd', label: 'ii(4, 4)', int: true },
        { key: 'b', label: 'ii(4, 1)', int: true },
        { key: 'c', label: 'ii(1, 4)', int: true },
        { key: 'a', label: 'ii(1, 1)', int: true },
        { key: 'sum', label: 'rectangle sum', int: true },
      ],
      solve: () => { const ii = L.integralImage(I11); return { d: ii[3][3], b: ii[0][3], c: ii[3][0], a: ii[0][0], sum: L.rectSum(ii, 1, 1, 3, 3) }; },
      hints: ['ii(4, 1) is the sum of row 1, columns 1…4; ii(1, 4) is the sum of column 1, rows 1…4.', 'ii(1, 1) was subtracted twice, so it is added back once.'],
      explain: 'ii(4, 4) = 75 (top-left 4 × 4 block), ii(4, 1) = 3 + 1 + 4 + 1 = 9, ii(1, 4) = 3 + 2 + 8 + 2 = 15, ii(1, 1) = 3.\n\nsum = 75 − 9 − 15 + 3 = **54**. Check directly: (6 + 5 + 3) + (9 + 7 + 9) + (3 + 8 + 4) = 14 + 25 + 15 = 54. The cost is 4 look-ups whatever the size of the rectangle.',
      wrong: [{ sum: '48' }],
    },
    {
      id: 'bas-12', type: 'calc', title: 'Two-rectangle Haar feature',
      prompt: 'A two-rectangle Haar-like feature on the 5 × 6 image: the **black** rectangle is x = 2…3, y = 2…4, the **white** rectangle is x = 4…5, y = 2…4 (adjacent, highlighted together).\n\nFeature value = Σ(black) − Σ(white). Because the rectangles share an edge, **six look-ups** of the integral image are enough: ii at x ∈ {1, 3, 5} and y ∈ {1, 4}. Enter these six ii values, the two sums and the feature value.',
      grids: [{ title: 'i(x, y)', data: I12, highlight: [[1, 1], [1, 2], [1, 3], [1, 4], [2, 1], [2, 2], [2, 3], [2, 4], [3, 1], [3, 2], [3, 3], [3, 4]] }],
      fields: [
        { key: 'ii', label: 'ii look-ups', shape: [2, 3], int: true, rowLabels: ['y = 1', 'y = 4'], colLabels: ['x = 1', 'x = 3', 'x = 5'] },
        { key: 'black', label: 'Σ black', int: true },
        { key: 'white', label: 'Σ white', int: true },
        { key: 'f', label: 'feature = black − white', int: true },
      ],
      solve: () => {
        const ii = L.integralImage(I12);
        const black = L.rectSum(ii, 1, 1, 3, 2), white = L.rectSum(ii, 1, 3, 3, 4);
        return { ii: [[ii[0][0], ii[0][2], ii[0][4]], [ii[3][0], ii[3][2], ii[3][4]]], black, white, f: L.haar2(ii, [1, 1, 3, 2], [1, 3, 3, 4]) };
      },
      hints: ['Σ black = ii(3, 4) − ii(3, 1) − ii(1, 4) + ii(1, 1).', 'Σ white = ii(5, 4) − ii(5, 1) − ii(3, 4) + ii(3, 1) – ii(3, ·) is shared.'],
      explain: 'Look-ups: ii(1, 1) = 1, ii(3, 1) = 3, ii(5, 1) = 7, ii(1, 4) = 4, ii(3, 4) = 39, ii(5, 4) = 50.\n\nΣ black = 39 − 3 − 4 + 1 = **33** (5 + 6 + 7 + 4 + 6 + 5).\n\nΣ white = 50 − 7 − 39 + 3 = **7** (1 + 0 + 2 + 1 + 1 + 2).\n\nFeature = 33 − 7 = **26**. The two shared corners are reused, so 6 instead of 8 look-ups.',
      wrong: [{ f: '-26' }],
    },
    {
      id: 'bas-13', type: 'code', title: 'Integral image in code',
      prompt: 'Write `integralImage(img)` that returns ii with ii[y][x] = sum of img over all rows ≤ y and columns ≤ x (0-based, inclusive). Make it a **single pass** using the lecture\'s recurrences (a running column sum s and a running row sum of s), or equivalently ii[y][x] = img[y][x] + ii[y−1][x] + ii[y][x−1] − ii[y−1][x−1].',
      fn: 'integralImage',
      starter: 'function integralImage(img) {\n  const [h, w] = shape(img);\n  const ii = zeros(h, w);\n  // fill ii\n  return ii;\n}',
      solution: 'function integralImage(img) {\n  const [h, w] = shape(img);\n  const ii = zeros(h, w);\n  for (let y = 0; y < h; y++) {\n    let rowSum = 0;\n    for (let x = 0; x < w; x++) {\n      rowSum += img[y][x];\n      ii[y][x] = rowSum + (y > 0 ? ii[y - 1][x] : 0);\n    }\n  }\n  return ii;\n}',
      tests: [[[[1, 2, 0, 3], [2, 1, 4, 1], [0, 3, 2, 2], [1, 0, 1, 4]]], ['@img:step'], ['@img:shapes'], [[[5]]]],
      display: 'auto',
      hints: ['Treat x = 0 and y = 0 as having zero neighbours outside the image.', 'Running row sum + the ii value directly above = ii[y][x].'],
      explain: 'Each output value needs a constant number of additions, so the cost is O(M·N). The last value ii[h−1][w−1] is the sum of the whole image. Displayed as an image the integral image is a smooth ramp growing towards the bottom-right corner.',
      wrong: ['function integralImage(img) { return img.map((r) => { let s = 0; return r.map((v) => (s += v)); }); }'],
    },
    c('bas-14', 'Integral image and look-up counts',
      'What is the **integral image**, how is it computed, and how many array look-ups are needed for a 1-, 2-, 3- and 4-rectangle Haar-like feature?',
      '- **Definition**: ii(x, y) = Σ i(x′, y′) over x′ ≤ x, y′ ≤ y – the sum of all pixels above and to the left, inclusive.\n- **Computation** in a single pass: s(x, y) = s(x, y − 1) + i(x, y) (cumulative column sum), ii(x, y) = ii(x − 1, y) + s(x, y), with s(x, 0) = 0 and ii(0, y) = 0.\n- **Rectangle sum** with corners 1 (top-left outside), 2 (top-right), 3 (bottom-left), 4 (bottom-right): D = ii(4) − ii(3) − ii(2) + ii(1) – constant time, independent of the rectangle size.\n- **Look-ups** (adjacent rectangles share corners): 1 rectangle **4**, 2 rectangles **6**, 3 rectangles **8**, 4 rectangles (2 × 2) **9**.\n- **Haar-like feature** = Σ(black area) − Σ(white area). Used by the **Viola–Jones** real-time face detector (features evaluated in many sub-windows at many scales), and also in SURF and image compression.'),
  ],
};
