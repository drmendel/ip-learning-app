import { L, q, c } from './util.js';

// ---------------------------------------------------------------- data (own examples)
const f0 = [20, 30, 40, 50, 60];
const f1 = [15, 25, 35, 45, 55];
const g2 = { Ix: 3, Iy: 4, It: -10 };

const lkIx = [[1, 2, 1], [2, 3, 2], [1, 2, 0]];
const lkIy = [[0, 1, 2], [1, 0, 1], [2, 1, 1]];
const lkIt = [[-1, -1, 1], [-1, -3, -1], [1, -1, 1]];

const apIx = [[2, 2], [2, 2]];
const apIy = [[1, 1], [1, 1]];
const apIt = [[-4, -4], [-4, -4]];

const hsU = [[0, 1, 0], [1.5, 0, 1], [0, 0.5, 0]];
const hsV = [[0, 0, 0], [0.2, 0, 0.2], [0, 0.4, 0]];
const hs = { Ix: 2, Iy: 1, It: -3, lambda: 1 };
const avg4 = (m) => (m[0][1] + m[2][1] + m[1][0] + m[1][2]) / 4;

const ii0 = [
  [1, 2, 0, 3],
  [4, 1, 2, 1],
  [0, 3, 1, 2],
  [2, 1, 4, 1],
];
const patch = [
  [40, 35, 50, 45, 30, 40],
  [30, 25, 40, 35, 20, 30],
  [90, 100, 110, 120, 95, 105],
  [80, 95, 100, 110, 90, 100],
];
const white = [2, 0, 3, 5]; // rows 3–4 (1-based), all columns – [y0, x0, y1, x1] 0-based
const black = [0, 0, 1, 5]; // rows 1–2

const adaLabels = [1, 1, 1, -1, -1, -1];
const adaPreds = [1, 1, -1, -1, -1, 1];
const adaW = new Array(6).fill(1 / 6);

const psi = [100, 120, 80, 100];
const eig = [[0.5, 0.5, 0.5, 0.5], [0.5, -0.5, 0.5, -0.5]];
const face = [130, 110, 110, 90];
const known = [[20, 35], [-10, 40], [25, -5]]; // persons A, B, C in face space
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);

const iiSolution = `function integralImage(img) {
  const h = img.length, w = img[0].length;
  const ii = zeros(h, w);
  for (let y = 0; y < h; y++) {
    let s = 0;                       // running sum of the current row
    for (let x = 0; x < w; x++) {
      s += img[y][x];
      ii[y][x] = s + (y > 0 ? ii[y - 1][x] : 0);
    }
  }
  return ii;
}`;

export default {
  id: 'motion',
  title: 'Optical flow & face detection',
  lab: 'Lectures 12–13',
  lesson: '11-motion-faces.md',
  exercises: [
    {
      id: 'mot-1', type: 'calc', title: 'Brightness constancy and normal flow',
      prompt: '**(a) 1-D.** A row of two consecutive frames is given. At **x = 3** compute Ix with the **central difference** (f(x+1) − f(x−1))/2 on frame t, It = f_{t+1}(x) − f_t(x), and the velocity from Ix·u + It = 0.\n\n**(b) 2-D.** At a pixel Ix = 3, Iy = 4, It = −10. The constraint Ix·u + Iy·v + It = 0 is a line in the (u, v) plane. Give the **normal flow** (the component along the gradient) – its signed length −It/|∇I| and its vector (u_n, v_n) – and the v of the solution that has u = 0.',
      grids: [{ title: 'f_t (top) and f_{t+1} (bottom), x = 1 … 5', data: [f0, f1] }],
      fields: [
        { key: 'ix', label: '(a) Ix' }, { key: 'it', label: '(a) It' }, { key: 'u', label: '(a) u' },
        { key: 'n', label: '(b) −It/|∇I|' }, { key: 'un', label: '(b) u_n' }, { key: 'vn', label: '(b) v_n' }, { key: 'v0', label: '(b) v when u = 0' },
      ],
      solve: () => {
        const ix = (f0[3] - f0[1]) / 2, it = f1[2] - f0[2];
        const n = L.normalFlow(g2.Ix, g2.Iy, g2.It); const g = Math.hypot(g2.Ix, g2.Iy);
        return { ix, it, u: -it / ix, n, un: (n * g2.Ix) / g, vn: (n * g2.Iy) / g, v0: -g2.It / g2.Iy };
      },
      hints: ['(a) Ix = (50 − 30)/2, It = 35 − 40.', '(b) |∇I| = √(3² + 4²) = 5; the normal flow points along (3, 4)/5.'],
      explain: '**(a)** Ix = 10, It = −5 → u = −It/Ix = **0.5** pixel/frame: the ramp moved half a pixel to the right (each value dropped by 5, the slope is 10 per pixel).\n\n**(b)** The normal flow is the point of the constraint line closest to the origin: −It/|∇I| = 10/5 = **2**, (u_n, v_n) = 2·(3, 4)/5 = **(1.2, 1.6)**. With u = 0: v = −It/Iy = **2.5**. (1.2, 1.6), (0, 2.5), (2, 1), … all satisfy 3u + 4v − 10 = 0 – one equation cannot fix both unknowns: this is the **aperture problem**; only the component along the gradient is measurable.',
      wrong: [{ u: '-0.5' }],
    },
    {
      id: 'mot-2', type: 'calc', title: 'Lucas–Kanade in a 3×3 window',
      prompt: 'Lucas–Kanade assumes the **same (u, v)** for every pixel of the window and solves the least-squares system\n\n[ΣIx²  ΣIxIy; ΣIxIy  ΣIy²] · [u; v] = −[ΣIxIt; ΣIyIt]\n\nCompute the five sums and (u, v) for the window below.',
      grids: [{ title: 'Ix', data: lkIx }, { title: 'Iy', data: lkIy }, { title: 'It', data: lkIt }],
      fields: [
        { key: 'sxx', label: 'ΣIx²', int: true }, { key: 'sxy', label: 'ΣIxIy', int: true }, { key: 'syy', label: 'ΣIy²', int: true },
        { key: 'sxt', label: 'ΣIxIt', int: true }, { key: 'syt', label: 'ΣIyIt', int: true },
        { key: 'u', label: 'u' }, { key: 'v', label: 'v' },
      ],
      solve: () => {
        const r = L.lucasKanade(lkIx, lkIy, lkIt);
        return { sxx: r.A[0][0], sxy: r.A[0][1], syy: r.A[1][1], sxt: -r.B[0], syt: -r.B[1], u: r.u, v: r.v };
      },
      hints: ['Multiply the grids element by element and add the 9 products.', 'For a 2×2 system: u = (ΣIy²·(−ΣIxIt) − ΣIxIy·(−ΣIyIt)) / det, v = (ΣIx²·(−ΣIyIt) − ΣIxIy·(−ΣIxIt)) / det.'],
      explain: 'ΣIx² = 28, ΣIxIy = 12, ΣIy² = 13, ΣIxIt = −16, ΣIyIt = 1.\n\ndet = 28·13 − 12² = 220.\n\nu = (13·16 − 12·(−1)) / 220 = 220/220 = **1**, v = (28·(−1) − 12·16) / 220 = −220/220 = **−1**. Check: every pixel satisfies Ix·1 + Iy·(−1) + It = 0 exactly – with real data the equations disagree and (u, v) is the least-squares compromise.\n\nThe matrix [ΣIx² ΣIxIy; ΣIxIy ΣIy²] is the structure tensor of the window (as in Harris): the system is well conditioned only if the window has gradients in **two different directions** (a corner / texture).',
      wrong: [{ u: '-1' }],
    },
    {
      id: 'mot-3', type: 'calc', title: 'The aperture problem in Lucas–Kanade',
      prompt: 'A 2×2 window lies on a straight edge: every pixel has Ix = 2, Iy = 1, It = −4.\n\nCompute the Lucas–Kanade matrix A = [ΣIx² ΣIxIy; ΣIxIy ΣIy²], its determinant, and the normal flow length −It/|∇I| (the only measurable component).',
      grids: [{ title: 'Ix', data: apIx }, { title: 'Iy', data: apIy }, { title: 'It', data: apIt }],
      fields: [
        { key: 'A', label: 'A', shape: [2, 2], int: true },
        { key: 'det', label: 'det A', int: true },
        { key: 'n', label: '−It/|∇I|' },
      ],
      solve: () => { const r = L.lucasKanade(apIx, apIy, apIt); return { A: r.A, det: r.det, n: L.normalFlow(2, 1, -4) }; },
      hints: ['All four rows of the system are the same equation 2u + v − 4 = 0.', '|∇I| = √5.'],
      explain: 'A = [16 8; 8 4], det = 16·4 − 8·8 = **0** → A is singular, (u, v) is not unique. All equations say 2u + v = 4: the motion **along the edge** is invisible through this small aperture. Only the normal flow is known: 4/√5 ≈ **1.789** pixel along (2, 1)/√5.\n\nIn practice: check the smaller eigenvalue of A (as in corner detection) and only trust windows where it is large enough.',
      wrong: [{ det: '4' }],
    },
    {
      id: 'mot-4', type: 'calc', title: 'One Horn–Schunck update',
      prompt: 'Horn–Schunck adds a **smoothness** term. The iteration for one pixel is\n\nu = ū − Ix·P/D, v = v̄ − Iy·P/D, P = Ix·ū + Iy·v̄ + It, D = λ + Ix² + Iy²\n\nwhere ū, v̄ are the averages of the **four neighbours** (up, down, left, right) from the previous iteration.\n\nThe centre pixel has Ix = 2, Iy = 1, It = −3, λ = 1. The current u and v fields are given (only the 4-neighbours of the centre matter). Compute ū, v̄ and the new (u, v) of the centre.',
      grids: [{ title: 'u (previous iteration)', data: hsU, highlight: [[1, 1]] }, { title: 'v (previous iteration)', data: hsV, highlight: [[1, 1]] }],
      fields: [{ key: 'ua', label: 'ū' }, { key: 'va', label: 'v̄' }, { key: 'u', label: 'new u' }, { key: 'v', label: 'new v' }],
      solve: () => { const ua = avg4(hsU), va = avg4(hsV); const r = L.hornSchunckStep(hs.Ix, hs.Iy, hs.It, ua, va, hs.lambda); return { ua, va, u: r.u, v: r.v }; },
      hints: ['ū = (1 + 0.5 + 1.5 + 1)/4.', 'P = 2·1 + 1·0.2 − 3 = −0.8, D = 1 + 4 + 1 = 6.'],
      explain: 'ū = 4/4 = **1**, v̄ = 0.8/4 = **0.2**. P = 2 + 0.2 − 3 = −0.8, D = 6.\n\nu = 1 − 2·(−0.8)/6 = **1.267**, v = 0.2 − 1·(−0.8)/6 = **0.333**.\n\nThe update moves the neighbourhood average towards the constraint line along the gradient direction. Start with u = v = 0, compute the derivatives once, then iterate – the smoothness term fills in the flow in homogeneous areas where the constraint alone says nothing.',
      wrong: [{ u: '0.733' }],
    },
    {
      id: 'mot-5', type: 'calc', title: 'Integral image and a rectangle sum',
      prompt: 'Compute the **integral image** ii(x, y) = Σ_{x\' ≤ x, y\' ≤ y} i(x\', y\') of the 4×4 image, then the sum of the rectangle **x = 2…4, y = 2…3** (1-based) with **four look-ups**: D = ii(4) − ii(2) − ii(3) + ii(1).',
      grids: [{ title: 'i(x, y)', data: ii0, highlight: [[1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3]] }],
      fields: [
        { key: 'ii', label: 'ii', shape: [4, 4], int: true },
        { key: 's', label: 'rectangle sum', int: true },
      ],
      solve: () => { const ii = L.integralImage(ii0); return { ii, s: L.rectSum(ii, 1, 1, 2, 3) }; },
      hints: ['Row by row: ii(x, y) = ii(x, y − 1) + (sum of row y up to x).', 'The four look-ups: ii(4, 3) − ii(4, 1) − ii(1, 3) + ii(1, 1).'],
      explain: 'ii =\n\n| 1 | 3 | 3 | 6 |\n| --- | --- | --- | --- |\n| 5 | 8 | 10 | 14 |\n| 5 | 11 | 14 | 20 |\n| 7 | 14 | 21 | 28 |\n\nRectangle: ii(4, 3) − ii(4, 1) − ii(1, 3) + ii(1, 1) = 20 − 6 − 5 + 1 = **10** (check: 1 + 2 + 1 + 3 + 1 + 2 = 10).\n\nOne pass over the image builds ii (s(x, y) = s(x, y−1) + i(x, y), ii(x, y) = ii(x−1, y) + s(x, y)); afterwards any rectangle costs 4 array references, independent of its size.',
      wrong: [{ s: '20' }],
    },
    {
      id: 'mot-6', type: 'calc', title: 'A two-rectangle Haar feature',
      prompt: 'A Viola–Jones "eye-region" feature on a 4×6 patch: the **black** rectangle is rows 1–2, the **white** rectangle rows 3–4 (all columns). Following the lecture, white pixels count **+1**, black pixels **−1**: f = Σ(white) − Σ(black).\n\nGive both sums, f, and how many integral-image **array references** two adjacent rectangles need.',
      grids: [{ title: 'patch (rows 1–2 black, rows 3–4 white)', data: patch, image: true }],
      fields: [
        { key: 'sw', label: 'Σ white', int: true }, { key: 'sb', label: 'Σ black', int: true },
        { key: 'f', label: 'f', int: true }, { key: 'refs', label: 'array references', int: true },
      ],
      solve: () => { const ii = L.integralImage(patch); return { sw: L.rectSum(ii, ...white), sb: L.rectSum(ii, ...black), f: L.haar2(ii, white, black), refs: 6 }; },
      hints: ['Row sums: 240, 180, 620, 575.', 'Two adjacent rectangles share two corners: 4 + 4 − 2.'],
      explain: 'Σ black = 240 + 180 = **420**, Σ white = 620 + 575 = **1195**, f = 1195 − 420 = **775** – a large value: the upper half (eyes) is much darker than the lower half (cheeks).\n\nArray references: one rectangle 4, two adjacent rectangles **6**, three 8, four 9. A weak classifier thresholds such a feature: h(x) = 1 if p·f(x) < p·θ.',
      wrong: [{ refs: '8' }],
    },
    {
      id: 'mot-7', type: 'calc', title: 'One AdaBoost round',
      prompt: 'Six training samples (labels +1 = face, −1 = non-face) start with **equal weights 1/6**. The chosen weak classifier predicts the row below.\n\nCompute the weighted error ε, the classifier weight **α = ½·ln((1 − ε)/ε)** and the new, **normalised** weights w_i ← w_i·e^(−α·y_i·h_i) / Z.',
      grids: [{ title: 'labels y (top) and predictions h (bottom), samples 1 … 6', data: [adaLabels, adaPreds] }],
      fields: [
        { key: 'eps', label: 'ε' }, { key: 'alpha', label: 'α' },
        { key: 'w', label: 'new weights', shape: [1, 6] },
      ],
      solve: () => { const r = L.adaboostRound(adaW, adaLabels, adaPreds); return { eps: r.eps, alpha: r.alpha, w: [r.weights] }; },
      hints: ['Samples 3 and 6 are misclassified → ε = 2/6.', 'α = ½·ln 2 ≈ 0.347; wrong samples are multiplied by e^α = √2, correct ones by e^(−α) = 1/√2.'],
      explain: 'ε = 2·(1/6) = **1/3**, α = ½·ln(2) = **0.347**.\n\nUnnormalised: correct 1/(6√2) ≈ 0.1179, wrong √2/6 ≈ 0.2357; Z = 4·0.1179 + 2·0.2357 = 0.9428. Normalised: correct **0.125**, wrong **0.25**. After the update the misclassified samples carry exactly half of the total weight → the next weak classifier must concentrate on them (it "complements the team").\n\nFinal strong classifier: H(x) = sign(Σ α_t·h_t(x)) – each weak classifier weighted by its accuracy.',
      wrong: [{ alpha: '0.693' }],
    },
    {
      id: 'mot-8', type: 'calc', title: 'Eigenfaces: projection and nearest person',
      prompt: 'A toy "face space" of 4-pixel images: mean face ψ, two orthonormal eigenfaces u₁, u₂. The weights of a face are ω_k = u_kᵀ·(x − ψ).\n\nProject the new face x, compute its Euclidean distance to the stored persons in (ω₁, ω₂) space and identify it (1:N identification).',
      grids: [
        { title: 'ψ (top), u₁, u₂, new face x (bottom)', data: [psi, ...eig, face] },
        { title: 'stored persons A, B, C: (ω₁, ω₂)', data: known },
      ],
      fields: [
        { key: 'w1', label: 'ω₁' }, { key: 'w2', label: 'ω₂' },
        { key: 'd', label: 'distances to A, B, C', shape: [1, 3] },
        { key: 'id', label: 'identified person (1 = A, 2 = B, 3 = C)', int: true },
      ],
      solve: () => {
        const d0 = face.map((v, i) => v - psi[i]); const w = eig.map((u) => dot(u, d0));
        const d = known.map(([a, b]) => Math.hypot(w[0] - a, w[1] - b));
        return { w1: w[0], w2: w[1], d: [d], id: d.indexOf(Math.min(...d)) + 1 };
      },
      hints: ['x − ψ = (30, −10, 30, −10).', 'ω₁ = 0.5·(30 − 10 + 30 − 10), ω₂ = 0.5·(30 + 10 + 30 + 10).'],
      explain: 'x − ψ = (30, −10, 30, −10) → ω₁ = **20**, ω₂ = **40**.\n\nDistances: A √(0² + 5²) = **5**, B √(30² + 0²) = **30**, C √(5² + 45²) = **45.28** → the face is **A**.\n\nEigenfaces (PCA): the eigenvectors of the covariance of the training faces with the largest eigenvalues span the face space; every face is described by a few weights. Verification (1:1) would only compare the distance to the claimed person with a threshold.',
      wrong: [{ id: '2' }],
    },
    {
      id: 'mot-9', type: 'code', title: 'Integral image',
      prompt: 'Write `integralImage(img)`: `ii[y][x]` = sum of `img` over all rows ≤ y and columns ≤ x (inclusive). One pass over the image is enough.',
      fn: 'integralImage',
      starter: 'function integralImage(img) {\n  const ii = clone(img);\n  // TODO: accumulate along the rows and the columns\n  return ii;\n}',
      solution: iiSolution,
      tests: [[ii0], [patch], ['@img:checker'], [[[5]]], [[[1, 2, 3, 4, 5]]]],
      display: 'auto',
      hints: ['Keep a running sum s of the current row; ii[y][x] = s + ii[y − 1][x].', 'Alternative: ii[y][x] = img[y][x] + ii[y−1][x] + ii[y][x−1] − ii[y−1][x−1].'],
      explain: 'Both recurrences visit every pixel once. With ii, any rectangle sum needs 4 references: `ii[y1][x1] − ii[y0−1][x1] − ii[y1][x0−1] + ii[y0−1][x0−1]` (terms with index −1 are 0). This is what makes Viola–Jones evaluate thousands of Haar features per window in real time.',
      wrong: ['function integralImage(img) {\n  return img.map((r) => { let s = 0; return r.map((v) => (s += v)); });\n}'],
    },
    q('mot-10', 'Identification or verification?', 'At a door a person shows an ID card ("I am Emily Dawson") and the camera checks whether the face matches the stored template of Emily Dawson. Which task is this?',
      ['Identification (1:N)', 'Verification (1:1)', 'Face detection', 'Enrolment'], 1,
      '**Verification (1:1):** the claimed identity is checked against one template (match or not). **Identification (1:N):** the system compares the face with every stored person and answers who it is ("This person is Emily Dawson"). Detection only finds where faces are; enrolment stores the template.'),
    q('mot-11', 'Large motions and pyramids', 'An object moves 10 pixels between two frames. Lucas–Kanade is computed on a Gaussian pyramid with 3 halvings. How large is the motion on the coarsest level, and why does this help?',
      ['10 px – the pyramid only removes noise',
        '1.25 px – small enough for the Taylor approximation; the estimate is propagated (×2) and refined on the finer levels',
        '5 px – each level halves the motion once in total',
        '0.125 px – too small to be measured'], 1,
      'Every level halves the image and the motion: 10 → 5 → 2.5 → **1.25** px. Horn–Schunck and Lucas–Kanade assume small motions (first-order Taylor expansion); on the coarsest level this holds. The flow found there is doubled and used as the starting point on the next finer level, where only a small correction remains.'),
    q('mot-12', 'Motion field vs optical flow', 'A perfectly uniform (texture-free) sphere rotates in front of the camera under constant lighting. What are the motion field and the optical flow?',
      ['Both are zero',
        'The motion field is non-zero, the optical flow is zero',
        'The motion field is zero, the optical flow is non-zero',
        'Both are non-zero and equal'], 1,
      'The **motion field** is the 2-D projection of the real 3-D motion – the surface points do move. The **optical flow** is the apparent motion of the brightness pattern – nothing changes in the image, so it is zero. Conversely, a moving light source gives optical flow without a motion field. Optical flow equals the motion field only under brightness constancy with enough texture.'),
    c('mot-13', 'Viola–Jones face detector', 'Summarise the Viola–Jones detector: which **four ideas** make it fast and accurate?',
      '1. **Haar-like features:** sums of pixel intensities in white rectangles minus black rectangles (two-, three-, four-rectangle features) inside a 24×24 sub-window – crude but sensitive, and very fast.\n2. **Integral image:** ii(x, y) = Σ_{x\'≤x, y\'≤y} i(x\', y\'), built in one pass; any rectangle sum needs 4 references (two rectangles 6, three 8, four 9).\n3. **AdaBoost:** every feature + threshold is a weak classifier. Start with equal sample weights; in each round choose the weak classifier with the smallest weighted error ε, weight it with α = ½ ln((1 − ε)/ε), increase the weights of the misclassified samples. The strong classifier is the weighted vote Σ α_t h_t(x). Boosting also selects the few useful features out of the huge pool.\n4. **Cascade:** a chain of increasingly complex boosted classifiers. Early, simple stages reject most non-face windows quickly (false negatives must be avoided there); only promising windows reach the later stages. The original detector: 38 stages, about 6000 features, trained on 5K faces and 350M non-faces, real time (0.067 s for 384×288 on a 700 MHz PIII).\n\nLimits: sliding windows are expensive (positions × scales × orientations), fixed 2-D viewpoint (profiles need another detector), sensitive to partial occlusion, needs huge cropped training sets.'),
  ],
};
