// Mock ZH – a replica of the two sample ZH sheets (minta_zh_1.jpg: 28 practical points, minta_zh_2.jpg: 21 theory points).
import { L, rigidMapsCheck } from './util.js';
import { IMAGES } from '../engines/images.js';

// ---------------------------------------------------------------- task 1: 45° edge in the highlighted band
const Z = IMAGES.zh; // the 8×8 table of the sheet
// The highlighted cells form a band rotated by 45°: 1-based (r, c) with 5 ≤ r + c ≤ 13 and −4 ≤ r − c ≤ 3 (4 cells on every anti-diagonal).
const inBand = (r, c) => r + c >= 5 && r + c <= 13 && r - c >= -4 && r - c <= 3;
const band = [];
for (let r = 1; r <= 8; r++) for (let c = 1; c <= 8; c++) if (inBand(r, c)) band.push([r - 1, c - 1]);
const sums = () => Array.from({ length: 9 }, (_, i) => band.filter(([r, c]) => r + c + 2 === i + 5).reduce((s, [r, c]) => s + Z[r][c], 0));
const strength = (S) => S.slice(1, -1).map((_, i) => S[i + 2] - S[i]); // [-1 0 1] for k = 6 … 12

// ---------------------------------------------------------------- task 2: moments
const B = L.parseGrid(`0 0 0 0 0 0 0 0 0 0
0 0 0 0 0 0 0 0 0 0
0 0 1 1 1 0 1 1 1 0
0 0 0 1 1 1 1 1 0 0
0 0 0 1 1 1 1 0 0 0
0 0 0 0 1 1 1 1 0 0
0 0 0 0 0 1 0 0 0 0
0 0 0 0 0 0 0 0 0 0`);

// ---------------------------------------------------------------- task 3: box through the gate
const box = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 2], [1, 0, 2], [1, 1, 2], [0, 1, 2]];
const boxEdges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
const XS = 3; // x* (the sheet only says x* > 2)
const boxTarget = [[4, 0, 0], [6, 0, 0], [6, 1, 0], [4, 1, 0], [4, 0, 1], [6, 0, 1], [6, 1, 1], [4, 1, 1]];
const gate = { vertices: [[XS, -0.15, 0], [XS, -0.15, 1.3], [XS, 1.15, 1.3], [XS, 1.15, 0]], edges: [[0, 1], [1, 2], [2, 3]] };
const boxSolution = 'Ry(90) about (1, 0, 0)\nTran(3, 0, 0)';

const card = (id, points, title, prompt, answerText) => ({ id, type: 'card', points, title, prompt, answerText });

export default {
  id: 'mockzh',
  title: 'Mock ZH',
  lab: 'Exam',
  lesson: '14-mock-zh.md',
  exam: { minutes: 90 },
  exercises: [
    {
      id: 'zh-1', type: 'calc', points: 8, title: '1) Position of a 45° edge',
      prompt: 'We know that a **straight, 45° diagonal edge** (running parallel to the band, i.e. along the lines **x + y = const**) lies in the **highlighted region** of the image. Determine its exact position.\n\nUse the expected-position edge-segment method: **(a)** sum the intensities of the highlighted cells along each diagonal x + y = k (k = 5 … 13; every diagonal has 4 highlighted cells), **(b)** build the edge-strength array across the band with the difference mask **[−1 0 1]**: d(k) = S(k+1) − S(k−1) for k = 6 … 12, **(c)** the edge is where |d| is maximal: give k, i.e. the line x + y = k (x = column, y = row, 1-based).',
      grids: [{ title: 'f(x, y)', data: Z, highlight: band, image: true }],
      fields: [
        { key: 'S', label: '(a) S(k), k = 5 … 13', shape: [1, 9], int: true, colLabels: ['5', '6', '7', '8', '9', '10', '11', '12', '13'], rowLabels: ['S'], pts: 3 },
        { key: 'd', label: '(b) d(k) = S(k+1) − S(k−1), k = 6 … 12', shape: [1, 7], int: true, colLabels: ['6', '7', '8', '9', '10', '11', '12'], rowLabels: ['d'], pts: 3 },
        { key: 'k', label: '(c) the edge lies on x + y = k, k =', int: true, pts: 2 },
      ],
      solve: () => { const S = sums(); const d = strength(S); let k = 0; d.forEach((v, i) => { if (Math.abs(v) > Math.abs(d[k])) k = i; }); return { S: [S], d: [d], k: k + 6 }; },
      hints: ['k = 5: f(4,1) + f(3,2) + f(2,3) + f(1,4) = 70 + 82 + 96 + 123 = 371.'],
      explain: 'S = 371, 467, 513, 572, 691, 615, 615, 599, 611. d = 142, 105, **178**, 43, −76, −16, −4. The strongest (dark → bright) change is at **k = 8**: the edge runs along **x + y = 8**, through the pixels (6,2), (5,3), (4,4), (3,5) (x, y). Summing along the edge direction averages out the noise, so the 1-D profile across the band shows the step clearly. (With a forward difference [−1 1] the maximum, 119, lies between k = 8 and 9 — say which mask you use.)',
      wrong: [{ k: '9' }],
    },
    {
      id: 'zh-2', type: 'calc', points: 8, title: '2) Centroid and central moments',
      prompt: 'Consider the following binary image, where the ones mark the object (x = column →, y = row ↓, both from **1**). Determine the location of the **centroid** and the **first three central moments** (the second-order ones: μ20, μ02, μ11).',
      grids: [{ title: 'B(x, y)', data: B }],
      fields: [
        { key: 'xc', label: 'x̄', pts: 1 },
        { key: 'yc', label: 'ȳ', pts: 1 },
        { key: 'm20', label: 'μ20 = Σ (x − x̄)²', tol: 0.02, pts: 2 },
        { key: 'm02', label: 'μ02 = Σ (y − ȳ)²', tol: 0.02, pts: 2 },
        { key: 'm11', label: 'μ11 = Σ (x − x̄)(y − ȳ)', tol: 0.02, pts: 2 },
      ],
      solve: () => { const m = L.moments(B, 1); return { xc: m.xc, yc: m.yc, m20: m.mu['20'], m02: m.mu['02'], m11: m.mu['11'] }; },
      explain: 'Area m00 = 20, Σx = 120, Σy = 89 → **x̄ = 6, ȳ = 4.45**. μ20 = Σx² − m00·x̄² = 770 − 720 = **50**, μ02 = Σy² − m00·ȳ² = 427 − 396.05 = **30.95**, μ11 = Σxy − m00·x̄·ȳ = 536 − 534 = **2**. (μ00 = 20 and μ10 = μ01 = 0 by definition — the zero- and first-order central moments carry no shape information.)',
      wrong: [{ yc: '4.5' }, { m02: '31' }],
    },
    {
      id: 'zh-3a', type: 'calc', points: 4, title: '3a) Descriptor matrix of the box',
      prompt: 'A rigid, non-resizable **box** (1 × 1 × 2: x ∈ [0, 1], y ∈ [0, 1], z ∈ [0, 2]) has to be pushed through a **gate** standing at distance **x\\* = 3** (opening 1.3 high and 1.3 wide).\n\nWrite the **homogeneous descriptor matrix** of the box (one column per vertex) in this vertex order:\n\n1 = (0,0,0), 2 = (1,0,0), 3 = (1,1,0), 4 = (0,1,0), 5 = (0,0,2), 6 = (1,0,2), 7 = (1,1,2), 8 = (0,1,2).',
      fields: [{ key: 'D', label: 'descriptor matrix', shape: [4, 8], int: true, rowLabels: ['x', 'y', 'z', '1'], colLabels: ['1', '2', '3', '4', '5', '6', '7', '8'] }],
      solve: () => ({ D: L.descriptor(box) }),
      explain: 'Rows x, y, z, 1; one column per vertex. The fourth row of ones makes translations expressible as a matrix product.',
    },
    {
      id: 'zh-3b', type: 'steps', points: 5, title: '3b) Through the gate',
      prompt: 'Give the **transformation sequence** that moves the box from its start position through the gate (orange, at x\\* = 3, opening 1.3 high) into the **target position** (green): lying flat, **x ∈ [4, 6]**, y ∈ [0, 1], z ∈ [0, 1].\n\nThe box must **never get below the z = 0 plane** (not even while rotating), cannot be resized, and must fit through the opening while it passes x = 3.',
      vertices: box, edges: boxEdges, target: boxTarget, extra: [gate],
      constraints: { minZ: 0, rigid: true, gate: { x: XS, maxZ: 1.3, yMin: -0.15, yMax: 1.15 } },
      starter: '# one transformation per line\n',
      solution: boxSolution,
      wrong: ['Tran(3, 0, 0)\nRy(90) about (4, 0, 0)', 'Ry(90)\nTran(4, 0, 2)'],
      explain: 'The box is 2 high but the gate only 1.3 → it must be **tipped over** first. Rotating about the y axis through the origin would push it below z = 0, so rotate about its **bottom edge at x = 1**: Tran(−1, 0, 0), Ry(90°), Tran(1, 0, 0) (written here as `Ry(90) about (1, 0, 0)`) – it now lies on x ∈ [1, 3]. Then Tran(3, 0, 0) pushes it through the gate to x ∈ [4, 6].',
    },
    {
      id: 'zh-3c', type: 'calc', points: 3, title: '3c) The composite matrix',
      prompt: 'Give the **composite homogeneous transformation matrix T** (4 × 4) of your sequence, i.e. the matrix with **new descriptor = T · old descriptor** that takes the box from the start position to the target position of 3b. Entries may be expressions such as cos(90).',
      fields: [{ key: 'T', label: 'T', shape: [4, 4], rowLabels: ['', '', '', ''], colLabels: ['', '', '', ''], check: rigidMapsCheck(box, boxTarget) }],
      solve: () => ({ T: L.cleanZero(L.composeActive([L.Tran(-1, 0, 0), L.RotY(90), L.Tran(1, 0, 0), L.Tran(3, 0, 0)])) }),
      explain: 'With the sequence Tran(−1,0,0), Ry(90°), Tran(1,0,0), Tran(3,0,0): T = Tran(4,0,0)·Ry(90°)·Tran(−1,0,0) = [[0, 0, 1, 4], [0, 1, 0, 0], [−1, 0, 0, 1], [0, 0, 0, 1]]. Check: vertex 5 = (0,0,2) → (2+4, 0, 0+1) = (6, 0, 1). Any rigid T that maps the start box onto the target box is accepted (e.g. also tipping the other way and rotating about z).',
    },
    card('zh-t1', 2, 'Theory 1) Normalised histogram', 'What do we mean by the **normalised histogram** of a greyscale image? (2 points)',
      'The histogram h(r_k) = n_k counts the pixels of each grey level r_k (k = 0 … L−1). The **normalised histogram** divides by the number of pixels n: **p(r_k) = n_k / n**. It estimates the **probability** that a pixel has intensity r_k; its values sum to **1**, so it is independent of the image size (images of different size are comparable) and it is the basis of histogram equalisation (cumulative sum) and of Otsu thresholding.'),
    card('zh-t2', 3, 'Theory 2) SSD and SAD', 'What do **SSD** and **SAD** mean? Where did we use them? (3 points)',
      '**SSD** = sum of squared differences: Σ (I₁(x, y) − I₂(x, y))². **SAD** = sum of absolute differences: Σ |I₁(x, y) − I₂(x, y)|. Both measure the **dissimilarity** of two image patches – 0 for identical patches, the best match is the **minimum**.\n\nUsed in: **template matching** (slide the template over the image, take the minimum; SAD is cheaper, SSD punishes large errors more), the derivation of **feature-point detection** (the SSD error E(u, v) of a shifted window → H matrix / Harris), and block matching for **motion / optical flow and stereo** correspondence.'),
    card('zh-t3', 2, 'Theory 3) Backward mapping', 'Why is a **backward** (inverse) transformation used when rotating an image? (2 points)',
      'With **forward** mapping (source pixel → transformed position) the results are non-integer coordinates; some target pixels get **no value (holes)**, others get **several (overlaps)**, because there is no one-to-one correspondence between the pixel grids.\n\n**Backward** mapping goes through **every output pixel**, computes with the **inverse** transformation where it comes from in the source, and **interpolates** there (nearest neighbour, bilinear, …). So every output pixel gets exactly one, well-defined value – no holes.'),
    card('zh-t4', 2, 'Theory 4) Scale factor of low-pass masks', 'Why do low-pass filters use a **scale factor equal to the sum of the mask weights**? (2 points)',
      'The output is the weighted sum of the neighbours; dividing by the **sum of the weights** makes the effective weights sum to **1**. So the filter only averages: the **mean intensity (overall brightness) of the image is preserved**, a **constant region stays unchanged** (DC gain = 1), and the result stays in the original value range (no overflow / saturation). Without it e.g. a 3×3 box mask would multiply the brightness by 9.'),
    card('zh-t5', 2, 'Theory 5) Gaussian vs Laplacian pyramid', 'Which level of the **Gaussian** and the **Laplacian pyramid** is identical, and why? (2 points)',
      'The **top (smallest, coarsest) level**. Every Laplacian level is a difference L_k = g_k − EXPAND(g_{k+1}); for the coarsest level there is **no smaller level** to expand and subtract, so it is stored **as it is**: L_top = g_top. It is needed to **reconstruct** the image (g_k = L_k + EXPAND(g_{k+1}), starting from the top).'),
    card('zh-t6', 4, 'Theory 6) Canny edge detector', 'What are the main steps of the **Canny edge detector**? (4 points)',
      '1. **Smoothing with a Gaussian** filter (noise reduction; σ trades noise suppression against localisation).\n2. **Gradient** computation: Ix, Iy → edge strength (magnitude) √(Ix² + Iy²) and edge orientation atan(Iy / Ix).\n3. **Non-maximum suppression**: the direction is quantised to 0°, 45°, 90°, 135°; a pixel is kept only if its magnitude is not smaller than its two neighbours along the gradient direction → one-pixel-wide edges.\n4. **Hysteresis thresholding** with two thresholds: above the high threshold → edge; below the low one → not an edge; in between → edge only if connected to an edge pixel (edge tracking) → long, unbroken contours.'),
    card('zh-t7', 4, 'Theory 7) n-th order shapes', 'What are **n-th order shapes**? (2 points) What are they used for? (2 points)',
      '**n-th order shapes** are the possible closed shapes whose boundary can be described by a chain code of **n elements** (the order = length of the chain code = perimeter in grid steps). E.g. with the 4-direction code order 4 is only the unit square, order 6 has one shape (a 1×2 rectangle), order 8 has three shapes.\n\n**Use:** they are the basis of the **shape number** (the smallest circular rotation of the difference chain code, which is independent of the start point and of rotations by 90°). Shapes are compared/classified by their shape numbers of a **fixed order** (modified shape number: fit a grid whose rectangle has the object\'s eccentricity and gives the required order) – e.g. for matching and recognising contours, and measuring similarity by the highest order at which two shapes still agree.'),
    card('zh-t8', 2, 'Theory 8) Central moments', 'How do we compute the **central moments**, and to which transformation(s) are their values invariant? (2 points)',
      'μ_pq = Σ_x Σ_y (x − x̄)ᵖ (y − ȳ)^q · B(x, y), with the centroid x̄ = m10/m00, ȳ = m01/m00 (m_pq = Σ Σ xᵖ y^q B(x, y)). Because they are measured from the centroid they are **invariant to translation**. They are not invariant to scaling or rotation; normalising η_pq = μ_pq / μ00^((p+q)/2+1) gives **scale** invariance, and the Hu invariants built from η (e.g. φ1 = η20 + η02) are invariant to **translation, scaling and rotation**.'),
  ],
};
