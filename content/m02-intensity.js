import { L, q, c } from './util.js';

// ---------------------------------------------------------------- data
const R1 = [[0, 3, 7], [12, 5, 9], [15, 10, 4]];                // int-1, L = 16
const B2 = [[200, 37, 129], [255, 64, 170], [13, 128, 91]];     // int-2
const S3 = [[60, 80, 100], [90, 120, 140], [70, 110, 160]];     // int-3
const F5 = [[100, 180, 90], [140, 60, 200]];                    // int-5
const E6 = [[1, 2, 2, 3], [2, 3, 3, 4], [2, 3, 4, 4], [3, 3, 4, 7]]; // int-6, L = 8
const H7 = [2, 6, 10, 8, 4, 2, 0, 0];                           // int-7, histogram, L = 8, 32 pixels
const I1 = [[100, 52, 190], [30, 60, 61]];                      // int-9 frames
const I2 = [[106, 40, 160], [33, 150, 60]];
const I3 = [[94, 58, 190], [27, 60, 59]];
const R11 = [[10, 20, 30, 40, 50], [20, 60, 90, 70, 40], [30, 80, 150, 120, 60], [40, 70, 200, 180, 90], [50, 60, 100, 110, 80]]; // int-11

const levels8 = ['0', '1', '2', '3', '4', '5', '6', '7'];
const cosd = (a) => Math.cos(L.rad(a)), sind = (a) => Math.sin(L.rad(a));

/** Equalisation map straight from a histogram (s = round half up((L−1)·cdf)). */
const eqMapFromHist = (h, Lv) => { const n = L.sum(h); return L.cumulative(h).map((cv) => L.roundHalfUp(((Lv - 1) * cv) / n)); };

/** Inverse of the lecture-4 forward rotation (r = row, c = column, 1-based like the table). */
function backward(rOut, cOut, r0, c0, beta) {
  const dr = rOut - r0, dc = cOut - c0;
  return [r0 + dr * cosd(beta) + dc * sind(beta), c0 - dr * sind(beta) + dc * cosd(beta)];
}

export default {
  id: 'intensity',
  title: 'Intensity transformations',
  lab: 'Lecture 4',
  lesson: '02-intensity.md',
  exercises: [
    {
      id: 'int-1', type: 'calc', title: 'Negative, threshold, intensity-level slicing',
      prompt: 'The 3 × 3 image has **L = 16** grey levels (0…15). Apply three point operations s = T(r) independently:\n\n1. **Negative**: s = (L − 1) − r.\n2. **Thresholding** with T = 8: s = 0 if r < 8, otherwise s = 15.\n3. **Intensity-level slicing**: highlight the range [5, 10] – s = 15 if 5 ≤ r ≤ 10, otherwise the pixel is **left unchanged** (s = r).',
      grids: [{ title: 'r', data: R1 }],
      fields: [
        { key: 'neg', label: 'negative', shape: [3, 3], int: true },
        { key: 'thr', label: 'threshold T = 8', shape: [3, 3], int: true },
        { key: 'sl', label: 'slicing [5, 10]', shape: [3, 3], int: true },
      ],
      solve: () => ({ neg: L.negate(R1, 16), thr: L.threshold(R1, 8, 15, 0), sl: L.map(R1, (v) => (v >= 5 && v <= 10 ? 15 : v)) }),
      hints: ['Negative: 15 − r, e.g. 15 − 3 = 12.', 'r = 8 would already be 15 (the condition is r < T for black).', 'Slicing keeps 0, 3, 12, 15, 4 and raises the rest to 15.'],
      explain: 'Negative: [[15, 12, 8], [3, 10, 6], [0, 5, 11]].\n\nThreshold: [[0, 0, 0], [15, 0, 15], [15, 15, 0]].\n\nSlicing: [[0, 3, 15], [12, 15, 15], [15, 15, 4]].\n\nAll three are **point operations**: each output pixel depends only on the same input pixel, so they are trivially data-parallel and can be implemented as a look-up table of L entries.',
      wrong: [{ neg: '16 13 9\n4 11 7\n1 6 12' }],
    },
    {
      id: 'int-2', type: 'calc', title: 'Bit planes and grey-level reduction',
      prompt: 'For the 8-bit image compute\n\n1. **bit plane 7** (most significant bit) and **bit plane 0** (least significant bit) – each entry is 0 or 1;\n2. the **grey-level reduction** to 3 bits by dropping the 5 least significant bits: s = r AND 224 (224 = 1110 0000₂).',
      grids: [{ title: 'r', data: B2 }],
      fields: [
        { key: 'b7', label: 'bit plane 7', shape: [3, 3], int: true },
        { key: 'b0', label: 'bit plane 0', shape: [3, 3], int: true },
        { key: 'red', label: 'r AND 224', shape: [3, 3], int: true },
      ],
      solve: () => ({ b7: L.bitPlane(B2, 7), b0: L.bitPlane(B2, 0), red: L.map(B2, (v) => v & 224) }),
      hints: ['Bit 7 is 1 exactly when r ≥ 128.', 'Bit 0 is 1 exactly when r is odd.', 'r AND 224 = 32 · ⌊r / 32⌋.'],
      explain: 'Plane 7 = (r ≥ 128): [[1, 0, 1], [1, 0, 1], [0, 1, 0]] – it is a threshold at 128.\n\nPlane 0 = r mod 2: [[0, 1, 1], [1, 0, 0], [1, 0, 1]] – looks like noise; this is why low planes can hide data (steganography).\n\nr AND 224 = 32·⌊r/32⌋: [[192, 32, 128], [224, 64, 160], [0, 128, 64]] – only 8 grey levels remain, but the image still looks similar because the high planes carry most of the information.',
      wrong: [{ red: '200 32 128\n224 64 160\n0 128 64' }],
    },
    {
      id: 'int-3', type: 'calc', title: 'Histogram stretching vs contrast stretching',
      prompt: 'L = 256. Round **half up** (x.5 → x + 1) and clip to [0, 255].\n\n1. **Histogram stretching** (min–max): s = (L − 1)(r − min) / (max − min) with the image\'s own min and max.\n2. **Contrast stretching** of the window [low, high] = [80, 140]: s = (L − 1)(r − low) / (high − low), values below low → 0, above high → 255.',
      grids: [{ title: 'r', data: S3 }],
      fields: [
        { key: 'mm', label: 'min–max stretch', shape: [3, 3], int: true },
        { key: 'win', label: 'stretch [80, 140]', shape: [3, 3], int: true },
      ],
      solve: () => ({ mm: L.stretch(S3, 256), win: L.stretch(S3, 256, 80, 140) }),
      hints: ['min = 60, max = 160, so s = 2.55 · (r − 60).', 'For [80, 140]: s = 4.25 · (r − 80).', 'Watch the halves: 76.5 → 77, 25.5 → 26, 127.5 → 128, 42.5 → 43.'],
      explain: 'Min–max: s = 255(r − 60)/100 → 0, 51, 102 / 76.5 → **77**, 153, 204 / 25.5 → **26**, 127.5 → **128**, 255.\n\nWindow [80, 140]: s = 255(r − 80)/60 → 60 → 0 (clipped), 0, 85 / 42.5 → **43**, 170, 255 / 70 → 0 (clipped), 127.5 → **128**, 160 → 255 (clipped).\n\nThe window version spreads a narrower range over the full scale – more contrast inside the window, but everything outside it is saturated.',
      wrong: [{ mm: '0 51 102\n76 153 204\n25 127 255' }],
    },
    q('int-4', 'Gamma and log',
      'The power-law transformation is s = c · rᵞ (r normalised to [0, 1]). Which statement is correct?',
      ['γ < 1 brightens dark images: it expands the dark range and compresses the bright range – like the log transform',
        'γ < 1 darkens the image, γ > 1 brightens it',
        'The log transform s = c · log(1 + r) compresses the dark range and expands the bright range',
        'γ = 1 is the negative of the image'], 0,
      'For γ < 1 the curve lies above the identity: dark values are stretched apart, bright ones squeezed together (brightening) – the same shape as the log transform, which is used e.g. to display Fourier spectra with a huge dynamic range. γ > 1 does the opposite (darkens). γ = 1 with c = 1 is the identity. Gamma correction adjusts images to the response of different displays.'),
    {
      id: 'int-5', type: 'calc', title: 'Floyd–Steinberg error diffusion',
      prompt: 'Binarise the 2 × 3 image with **Floyd–Steinberg error diffusion**, as in the lecture: scan row by row, left to right; new value = 0 if the current (already modified) value is in [0, 127], otherwise **255** (shown as **1** in the output). Error = old − new (computed with **255**, not 1!), distributed as 7/16 → right, 3/16 → bottom-left, 5/16 → bottom, 1/16 → bottom-right. Error falling outside the image is discarded; do not round intermediate values.\n\nEnter the error of pixel (1, 1), the modified value of pixel (2, 1) just before it is quantised, and the binary output (0/1).',
      grids: [{ title: 'f(x, y)', data: F5 }],
      fields: [
        { key: 'e1', label: 'error at (1, 1)' },
        { key: 'v2', label: 'value at (2, 1) before quantising' },
        { key: 'e2', label: 'error at (2, 1)' },
        { key: 'out', label: 'output (0 / 1)', shape: [2, 3], int: true },
      ],
      solve: () => {
        const { out, work } = L.floydSteinberg(F5, 255, 128);
        return { e1: work[0][0] - out[0][0], v2: work[0][1], e2: work[0][1] - out[0][1], out: L.map(out, (v) => v / 255) };
      },
      hints: ['(1, 1) = 100 → 0, error +100; 7/16 of it goes right: 180 + 43.75.', '223.75 → 1 (255), error 223.75 − 255 = −31.25.', 'Keep track of the second row: (1, 2) receives 5/16·100 + 3/16·(−31.25), etc.'],
      explain: 'Pixel (1, 1): 100 → 0, e = **100** → (2, 1) = 180 + 43.75 = **223.75**, (1, 2) = 140 + 31.25, (2, 2) = 60 + 6.25.\n\nPixel (2, 1): 223.75 → 1, e = **−31.25** → (3, 1) = 90 − 13.67 = 76.33, (1, 2) = 171.25 − 5.86 = 165.39, (2, 2) = 66.25 − 9.77 = 56.48, (3, 2) = 200 − 1.95 = 198.05.\n\nPixel (3, 1): 76.33 → 0, e = 76.33 → (2, 2) = 70.80, (3, 2) = 221.90.\n\nRow 2: 165.39 → 1 (e = −89.61, right neighbour 70.80 − 39.20 = 31.59 → 0, e = 31.59), 221.90 + 13.82 = 235.72 → 1.\n\nOutput [[0, 1, 0], [1, 0, 1]]. Note that 90 alone would be 0 and 60 alone 0 – but 140 and 200 survive as 1; the local average brightness is preserved. Using 1 instead of 255 for the error would give a completely different (wrong) result.',
      wrong: [{ out: '0 1 1\n1 1 1' }, { e2: '-0.75' }],
    },
    {
      id: 'int-6', type: 'calc', title: 'Histogram equalisation – warm-up',
      prompt: 'Equalise the 4 × 4 image with **L = 8** levels: s = T(r) = round((L − 1) · Σ_{j≤r} p(j)), rounding **half up**. Give the histogram h(r), the mapping T(r) for r = 0…7 and the output image.',
      grids: [{ title: 'r', data: E6 }],
      fields: [
        { key: 'h', label: 'h(r)', shape: [1, 8], int: true, colLabels: levels8 },
        { key: 'map', label: 'T(r)', shape: [1, 8], int: true, colLabels: levels8 },
        { key: 'out', label: 'output image', shape: [4, 4], int: true },
      ],
      solve: () => { const e = L.histEq(E6, 8); return { h: [e.hist], map: [e.map], out: e.out }; },
      hints: ['h = [0, 1, 4, 6, 4, 0, 0, 1].', 'Cumulative / 16: 0, 1/16, 5/16, 11/16, 15/16, 15/16, 15/16, 1.', 'Multiply by 7: 0, 0.44, 2.19, 4.81, 6.56, … → round.'],
      explain: 'h = [0, 1, 4, 6, 4, 0, 0, 1], cumulative = [0, 1, 5, 11, 15, 15, 15, 16].\n\nT(r) = round(7 · cum / 16) = round(0, 0.4375, 2.1875, 4.8125, 6.5625, 6.5625, 6.5625, 7) = **[0, 0, 2, 5, 7, 7, 7, 7]**.\n\nOutput: [[0, 2, 2, 5], [2, 5, 5, 7], [2, 5, 7, 7], [5, 5, 7, 7]]. The levels now spread over 0…7 – note that 4 and 7 both become 7: the discrete equalisation can merge levels, it never splits one.',
      wrong: [{ map: '0 0 2 4 6 6 6 7' }],
    },
    {
      id: 'int-7', type: 'calc', title: 'Equalisation from a histogram vs stretching',
      prompt: 'A 32-pixel image with **L = 8** has the histogram below (only levels 0…5 occur).\n\n1. Compute the **equalisation map** T(r) = round((L − 1) · cdf(r)) for r = 0…7 (half up) and the **histogram of the output**.\n2. Compare it with **histogram stretching** (min = 0, max = 5 → [0, 7]): s = round(7 · r / 5) for r = 0…5.',
      grids: [{ title: 'h(r), r = 0…7', data: [H7], base: 0 }],
      fields: [
        { key: 'map', label: 'equalisation T(r)', shape: [1, 8], int: true, colLabels: levels8 },
        { key: 'hout', label: 'output histogram', shape: [1, 8], int: true, colLabels: levels8 },
        { key: 'st', label: 'stretching s(r), r = 0…5', shape: [1, 6], int: true, colLabels: levels8.slice(0, 6) },
      ],
      solve: () => {
        const map = eqMapFromHist(H7, 8);
        const hout = new Array(8).fill(0); H7.forEach((n, r) => { hout[map[r]] += n; });
        return { map: [map], hout: [hout], st: L.stretch([[0, 1, 2, 3, 4, 5]], 8) };
      },
      hints: ['Cumulative: 2, 8, 18, 26, 30, 32, 32, 32 (out of 32).', '7 · 18 / 32 = 3.9375 → 4; 7 · 26 / 32 = 5.6875 → 6.', 'Output histogram: add up the counts of the levels mapped to the same s.'],
      explain: 'cdf · 7 = 0.4375, 1.75, 3.9375, 5.6875, 6.5625, 7, 7, 7 → T = **[0, 2, 4, 6, 7, 7, 7, 7]**.\n\nOutput histogram: s = 0: 2, s = 2: 6, s = 4: 10, s = 6: 8, s = 7: 4 + 2 = 6 → [2, 0, 6, 0, 10, 0, 8, 6].\n\nStretching: 7r/5 = 0, 1.4, 2.8, 4.2, 5.6, 7 → [0, 1, 3, 4, 6, 7].\n\nStretching is **linear**: it keeps the shape of the histogram and only spreads it to the full range. Equalisation is **non-linear** (it follows the cumulative histogram): frequent levels get pulled apart (2 → 4, 3 → 6), rare ones get squeezed (4 and 5 both → 7). The output histogram is only approximately flat, because levels can be merged but never split.',
      wrong: [{ map: '0 1 3 5 6 7 7 7' }],
    },
    {
      id: 'int-8', type: 'code', title: 'Histogram equalisation in code',
      prompt: 'Write `histEq(img, L)` that returns the **equalised image**: s = round((L − 1) · cdf(r)) with cdf(r) = (number of pixels ≤ r) / (number of pixels). Round **half up**: `Math.floor(v + 0.5 + 1e-9)` (the tiny epsilon protects x.5 values against floating-point error).',
      fn: 'histEq',
      starter: 'function histEq(img, L) {\n  const hist = new Array(L).fill(0);\n  // 1. histogram  2. cumulative  3. look-up table  4. apply\n  return clone(img);\n}',
      solution: 'function histEq(img, L) {\n  const hist = new Array(L).fill(0);\n  for (const row of img) for (const v of row) hist[v]++;\n  const n = img.length * img[0].length;\n  const lut = [];\n  let cum = 0;\n  for (let k = 0; k < L; k++) {\n    cum += hist[k];\n    lut.push(Math.floor(((L - 1) * cum) / n + 0.5 + 1e-9));\n  }\n  return img.map((row) => row.map((v) => lut[v]));\n}',
      tests: [['@img:lowcontrast', 256], [[[1, 2, 2, 3], [2, 3, 3, 4], [2, 3, 4, 4], [3, 3, 4, 7]], 8], ['@img:dark', 256], [[[0, 1], [1, 3]], 4]],
      display: 'image',
      hints: ['Build the look-up table once (L entries), then map every pixel through it.', 'Use the cumulative count **including** the current level.'],
      explain: 'Three passes: histogram (M·N), cumulative + LUT (L), mapping (M·N). On the low-contrast sample image the narrow band of grey levels is spread over the whole 0…255 range. A typical mistake is using the cumulative count *before* the level (cdf(r − 1)) – then the brightest level never reaches L − 1.',
      wrong: ['function histEq(img, L) { const h = new Array(L).fill(0); for (const r of img) for (const v of r) h[v]++; const n = img.length * img[0].length; const lut = []; let c = 0; for (let k = 0; k < L; k++) { lut.push(Math.round((L - 1) * c / n)); c += h[k]; } return img.map((r) => r.map((v) => lut[v])); }'],
    },
    {
      id: 'int-9', type: 'calc', title: 'Whole-image operations',
      prompt: 'Three noisy frames of a scene are given (I₁, I₂, I₃).\n\n1. **Averaging**: O = (I₁ + I₂ + I₃) / 3.\n2. **Change detection**: D = |I₁ − I₂|, then threshold with T = 25 (B = 1 if D ≥ 25, else 0).\n3. **AND masking**: keep I₂ where B = 1 (mask value 255 → I₂ AND 255 = I₂) and set the rest to 0 (I₂ AND 0 = 0).',
      grids: [{ title: 'I₁', data: I1 }, { title: 'I₂', data: I2 }, { title: 'I₃', data: I3 }],
      fields: [
        { key: 'avg', label: 'average O', shape: [2, 3] },
        { key: 'diff', label: '|I₁ − I₂|', shape: [2, 3], int: true },
        { key: 'bin', label: 'B (T = 25)', shape: [2, 3], int: true },
        { key: 'mask', label: 'I₂ AND mask', shape: [2, 3], int: true },
      ],
      solve: () => {
        const diff = L.zip(I1, I2, (a, b) => Math.abs(a - b));
        const bin = L.threshold(diff, 25);
        return { avg: L.map(I1, (v, y, x) => (v + I2[y][x] + I3[y][x]) / 3), diff, bin, mask: L.zip(I2, bin, (v, m) => v & (m ? 255 : 0)) };
      },
      hints: ['100 + 106 + 94 = 300 → 100.', '|190 − 160| = 30 ≥ 25 → 1; |60 − 150| = 90 → 1.'],
      explain: 'Average: [[100, 50, 180], [30, 90, 60]] – the noise (zero mean) cancels out; with n frames its standard deviation drops by √n.\n\n|I₁ − I₂| = [[6, 12, 30], [3, 90, 1]] → B = [[0, 0, 1], [0, 1, 0]].\n\nMasked: [[0, 0, 160], [0, 150, 0]] – only the changed pixels of the current frame remain. Small differences (noise) are removed by the threshold; that is why change detection always needs one.',
      wrong: [{ bin: '0 0 1\n0 1 1' }],
    },
    {
      id: 'int-10', type: 'calc', title: 'Geometric transformations of a point',
      prompt: 'Lecture 4 uses row/column coordinates (r, c). Transform the point **(r, c) = (5, 3)**:\n\n1. **Translation** by (t_r, t_c) = (2, −1): r′ = r + t_r, c′ = c + t_c.\n2. **Scaling** by (s_r, s_c) = (2, 3): r′ = s_r · r, c′ = s_c · c.\n3. **Rotation** by β = 90° about (r₀, c₀) = (2, 2): r′ = r₀ + (r − r₀)cos β − (c − c₀)sin β, c′ = c₀ + (r − r₀)sin β + (c − c₀)cos β.\n4. **Affine**: r′ = a₁₁r + a₁₂c + b₁, c′ = a₂₁r + a₂₂c + b₂ with a₁₁ = 1, a₁₂ = 2, b₁ = −1, a₂₁ = 0, a₂₂ = 1, b₂ = 4.',
      fields: [
        { key: 'p', label: '(r′, c′)', shape: [4, 2], rowLabels: ['translation', 'scaling', 'rotation', 'affine'], colLabels: ['r′', 'c′'] },
      ],
      solve: () => {
        const r = 5, cc = 3, r0 = 2, c0 = 2, b = 90;
        return { p: L.cleanZero([
          [r + 2, cc - 1],
          [2 * r, 3 * cc],
          [r0 + (r - r0) * cosd(b) - (cc - c0) * sind(b), c0 + (r - r0) * sind(b) + (cc - c0) * cosd(b)],
          [1 * r + 2 * cc - 1, 0 * r + 1 * cc + 4],
        ]) };
      },
      hints: ['Rotation: Δr = 3, Δc = 1, cos 90° = 0, sin 90° = 1.'],
      explain: 'Translation (7, 2); scaling (10, 9); rotation: r′ = 2 + 3·0 − 1·1 = 1, c′ = 2 + 3·1 + 1·0 = 5 → (1, 5); affine: r′ = 5 + 6 − 1 = 10, c′ = 3 + 4 = 7 → (10, 7).\n\nTranslation, scaling and rotation are all special affine transformations (rotation: a₁₁ = a₂₂ = cos β, a₁₂ = −sin β, a₂₁ = sin β plus the matching b terms).',
      wrong: [{ p: '7 2\n10 9\n3 -1\n10 7' }],
    },
    {
      id: 'int-11', type: 'calc', title: 'Backward mapping of one output pixel',
      prompt: 'The image is rotated by **β = 30°** about **(r₀, c₀) = (2, 2)** with the lecture\'s forward formula (r = row, c = column, both 1-based like the table). With **backward mapping** we start from the output pixel **(r′, c′) = (3, 3)** and use the inverse rotation:\n\nr = r₀ + Δr′ cos β + Δc′ sin β,  c = c₀ − Δr′ sin β + Δc′ cos β  (Δr′ = r′ − r₀, Δc′ = c′ − c₀).\n\nGive the source position (r, c), the value by **nearest neighbour** and by **bilinear interpolation** of the input image.',
      grids: [{ title: 'f(r, c)', data: R11, highlight: [[2, 1], [2, 2], [3, 1], [3, 2]] }],
      fields: [
        { key: 'r', label: 'source r' },
        { key: 'c', label: 'source c' },
        { key: 'nn', label: 'nearest neighbour', int: true },
        { key: 'bil', label: 'bilinear', tol: 0.1 },
      ],
      solve: () => {
        const [r, cc] = backward(3, 3, 2, 2, 30);
        return { r, c: cc, nn: L.nearest(R11, r - 1, cc - 1), bil: L.bilinear(R11, r - 1, cc - 1) };
      },
      hints: ['cos 30° ≈ 0.8660, sin 30° = 0.5; Δr′ = Δc′ = 1.', 'Nearest: round (3.366, 2.366) → row 3, column 2.', 'Bilinear between rows 3–4, columns 2–3 with weights 0.366 / 0.634.'],
      explain: 'r = 2 + 0.866 + 0.5 = **3.366**, c = 2 − 0.5 + 0.866 = **2.366**.\n\nNearest neighbour: (3, 2) → **80**.\n\nBilinear (a = 0.366 in both directions) with f(3,2) = 80, f(3,3) = 150, f(4,2) = 70, f(4,3) = 200:\n\n- row 3: 80 + 0.366·(150 − 80) = 105.62\n- row 4: 70 + 0.366·(200 − 70) = 117.58\n- result: 105.62 + 0.366·(117.58 − 105.62) ≈ **110.0**\n\nEvery output pixel gets exactly one value this way – no holes.',
      wrong: [{ r: '2.634' }],
    },
    {
      id: 'int-12', type: 'code', title: 'Rotation with backward mapping',
      prompt: 'Write `rotateNN(img, beta)` that rotates the image by **beta degrees** about its centre (r₀, c₀) = ((h − 1)/2, (w − 1)/2) using **backward mapping** and **nearest-neighbour** interpolation. For every output pixel (r′, c′) = (y, x):\n\nr = r₀ + Δr′ cos β + Δc′ sin β,  c = c₀ − Δr′ sin β + Δc′ cos β\n\n(the inverse of the lecture\'s forward rotation), then take `img[Math.round(r)][Math.round(c)]`, or **0** if that is outside the image. Output size = input size.',
      fn: 'rotateNN',
      starter: 'function rotateNN(img, beta) {\n  const [h, w] = shape(img);\n  const out = zeros(h, w);\n  // for every OUTPUT pixel, find its source\n  return out;\n}',
      solution: 'function rotateNN(img, beta) {\n  const [h, w] = shape(img);\n  const r0 = (h - 1) / 2, c0 = (w - 1) / 2;\n  const b = (beta * Math.PI) / 180, cs = Math.cos(b), sn = Math.sin(b);\n  return fromFn(h, w, (y, x) => {\n    const dr = y - r0, dc = x - c0;\n    const r = Math.round(r0 + cs * dr + sn * dc), c = Math.round(c0 - sn * dr + cs * dc);\n    return r >= 0 && r < h && c >= 0 && c < w ? img[r][c] : 0;\n  });\n}',
      tests: [['@img:shapes', 30], ['@img:checker', 45], [[[1, 2, 3], [4, 5, 6], [7, 8, 9]], 90], ['@img:step', -20]],
      display: 'image',
      hints: ['Loop over the **output** pixels, not the input ones.', 'Convert degrees to radians: β · π / 180.', 'Check the bounds before indexing; outside → 0.'],
      explain: 'Because the loop runs over the output grid, every output pixel is written exactly once: no holes and no overlaps. The corners that come from outside the input are filled with 0. With the 3 × 3 test and β = 90° the output is [[3, 6, 9], [2, 5, 8], [1, 4, 7]].',
      wrong: ['function rotateNN(img, beta) { const [h, w] = shape(img); const r0 = (h - 1) / 2, c0 = (w - 1) / 2; const b = beta * Math.PI / 180, cs = Math.cos(b), sn = Math.sin(b); return fromFn(h, w, (y, x) => { const dr = y - r0, dc = x - c0; const r = Math.round(r0 + cs * dr - sn * dc), c = Math.round(c0 + sn * dr + cs * dc); return r >= 0 && r < h && c >= 0 && c < w ? img[r][c] : 0; }); }'],
    },
    q('int-13', 'Problems of forward mapping',
      'An image is rotated by 30° with **forward mapping**: every input pixel is sent to round(T(r, c)) in the output. What happens?',
      ['Nothing special – forward and backward mapping give identical images',
        'Some output pixels receive no value (holes) while others receive several (overlaps), because the mapping between the two pixel grids is not one-to-one',
        'Only the image border is affected; inner pixels are always correct',
        'The image becomes blurred because forward mapping always interpolates'], 1,
      'Rounded forward mapping is not a bijection between the pixel grids: several inputs can land on the same output pixel (overlap), and some output pixels are never hit (holes – visible as a pattern of black dots). Backward mapping loops over the output pixels and fetches each value through the inverse transformation (with interpolation), so every output pixel gets exactly one value.'),
    c('int-14', 'ZH: why backward mapping?',
      'Why is **backward mapping** used for image rotation (and other geometric transformations)? What problems does it solve and how are non-integer coordinates handled?',
      'Problems of geometric transformations (lecture 4):\n\n1. The transformed coordinates may fall **outside** the image.\n2. Input and output pixels do **not correspond one-to-one**: with **forward mapping** (input → output) some output pixels are hit several times (overlap), others never (**holes**).\n3. The transformed coordinates are **not integers**.\n\n**Backward mapping** starts from every **output** pixel (r′, c′) and uses the **inverse** transformation to compute the source position (r, c) in the input, then reads (interpolates) the value there and writes it into the output. For rotation by β about (r₀, c₀): r = r₀ + Δr′ cos β + Δc′ sin β, c = c₀ − Δr′ sin β + Δc′ cos β.\n\n- Every output pixel gets **exactly one value** → no holes, no overlaps (solves problem 2).\n- Source positions outside the input get a fill value, e.g. 0 (problem 1).\n- Non-integer (r, c) are handled by **interpolation** (problem 3): 0th order = nearest neighbour, 1st order = bilinear (weighted average of the 4 neighbours), higher order = bicubic, spline.'),
  ],
};
