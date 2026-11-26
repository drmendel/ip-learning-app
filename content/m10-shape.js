import { L, q, c } from './util.js';

// ---------------------------------------------------------------- data (own examples)
const code4 = '0030322121'; // 4-direction staircase shape
const rot4 = [...code4].map((d) => (Number(d) + 1) % 4).join(''); // rotated by +90°
const g8 = [
  [0, 1, 1, 1, 0],
  [0, 1, 1, 1, 1],
  [1, 1, 1, 1, 0],
  [0, 0, 1, 0, 0],
];
const band = [[1, 1, 0, 0], [1, 1, 1, 0], [0, 1, 1, 1], [0, 0, 1, 1]];
const code8 = L.chainCode(band); // '07764332' – given to the student as a string
const m1 = [
  [0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0],
  [0, 1, 1, 1, 1],
  [0, 0, 1, 1, 0],
];
const m3 = [
  [1, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 0],
  [0, 0, 0, 1, 1, 1],
];
const disk = [
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
];
const euler = [
  [1, 1, 1, 0, 0, 0, 0],
  [1, 0, 1, 0, 1, 1, 1],
  [1, 1, 1, 0, 1, 0, 1],
  [0, 0, 0, 0, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 0],
];

const cmSolution = `function centralMoments(bin) {
  let A = 0, sx = 0, sy = 0;
  bin.forEach((row, y) => row.forEach((v, x) => { if (v) { A++; sx += x + 1; sy += y + 1; } }));
  const xc = sx / A, yc = sy / A;
  let mu20 = 0, mu02 = 0, mu11 = 0;
  bin.forEach((row, y) => row.forEach((v, x) => {
    if (!v) return;
    const dx = x + 1 - xc, dy = y + 1 - yc;
    mu20 += dx * dx; mu02 += dy * dy; mu11 += dx * dy;
  }));
  return [xc, yc, mu20, mu02, mu11];
}`;

export default {
  id: 'shape',
  title: 'Shape descriptors & moments',
  lab: 'Lecture 11',
  lesson: '10-shape.md',
  exercises: [
    {
      id: 'shp-1', type: 'calc', title: 'Difference code and shape number (4 directions)',
      prompt: 'A boundary is described by the **4-direction** Freeman chain code (0 = east, 1 = north, 2 = west, 3 = south; counter-clockwise numbering, boundary followed clockwise):\n\n**0030322121**\n\nCompute the **first difference** d_i = (c_i − c_{i−1}) mod 4, treating the code as **circular** (d₀ uses the last element), the **shape number** (the smallest circular rotation of the difference code) and the **order** n.\n\nType the codes as digit strings (spaces are ignored).',
      fields: [
        { key: 'diff', label: 'first difference', kind: 'str' },
        { key: 'sn', label: 'shape number', kind: 'str' },
        { key: 'n', label: 'order n', int: true },
      ],
      solve: () => ({ diff: L.chainDiff(code4, 4).join(''), sn: L.shapeNumber(code4, 4), n: code4.length }),
      hints: ['d₀ = (0 − 1) mod 4 = 3, because the element before the first one is the last one (1).', 'A negative difference: (0 − 3) mod 4 = 1.', 'Among the rotations that start with 0, pick the smallest number.'],
      explain: 'c = 0 0 3 0 3 2 2 1 2 1 → d = (0−1, 0−0, 3−0, 0−3, 3−0, 2−3, 2−2, 1−2, 2−1, 1−2) mod 4 = **3031330313**.\n\nRotations starting with 0: 0313303133 (from position 2) and the same again from position 7 (the shape is symmetric) → shape number **0313303133**, order **n = 10**.\n\nCheck on the lecture example: 10103322 → 33133030, and 003221 → 303303 → 033033.',
      wrong: [{ diff: '0303133031' }],
    },
    {
      id: 'shp-2', type: 'calc', title: 'Chain code of a binary object (8 directions)',
      prompt: 'Write the **8-direction** chain code of the object\'s outer boundary (0 = east, 1 = north-east, 2 = north, …, 7 = south-east; counter-clockwise numbering).\n\nStart at the **top-left object pixel** (the first 1 in the first row that has one) and follow the boundary **clockwise** (on the screen, y grows downwards) through the centres of the boundary pixels (8-neighbourhood).\n\nAlso give the perimeter estimate a + b·√2 (a = number of even codes, b = number of odd codes) and the shape number.',
      grids: [{ title: 'B(x, y)', data: g8, image: true, highlight: [[0, 1]] }],
      fields: [
        { key: 'cc', label: 'chain code', kind: 'str' },
        { key: 'P', label: 'perimeter a + b√2' },
        { key: 'sn', label: 'shape number', kind: 'str' },
      ],
      solve: () => { const cc = L.chainCode(g8); return { cc, P: L.chainPerimeter(cc), sn: L.shapeNumber(cc, 8) }; },
      hints: ['From (2, 1): east, east, then south-east to (5, 2).', 'Back along the bottom: (5, 2) → (4, 3) → (3, 4) are two south-west steps (5, 5).', 'The code has 9 elements; 4 of them are even.'],
      explain: 'Path: (2,1) →0 (3,1) →0 (4,1) →7 (5,2) →5 (4,3) →5 (3,4) →3 (2,3) →4 (1,3) →1 (2,2) →2 (2,1).\n\nChain code **007553412**. Even codes: 0, 0, 4, 2 → a = 4; odd: 7, 5, 5, 3, 1 → b = 5; P ≈ 4 + 5√2 = **11.07**.\n\nDifference (circular): 607606151 → shape number **061516076**.',
      wrong: [{ cc: '0075534121' }],
    },
    {
      id: 'shp-3', type: 'calc', title: 'Shape number of an 8-direction code',
      prompt: 'An 8-direction chain code (0 = east, counter-clockwise numbering) of a closed boundary:\n\n**' + code8 + '**\n\nGive the circular first difference d_i = (c_i − c_{i−1}) mod 8, the shape number, the order and the perimeter estimate a + b√2.',
      fields: [
        { key: 'diff', label: 'first difference', kind: 'str' },
        { key: 'sn', label: 'shape number', kind: 'str' },
        { key: 'n', label: 'order n', int: true },
        { key: 'P', label: 'perimeter a + b√2' },
      ],
      solve: () => ({ diff: L.chainDiff(code8, 8).join(''), sn: L.shapeNumber(code8, 8), n: code8.length, P: L.chainPerimeter(code8) }),
      hints: ['d₀ = (0 − 2) mod 8 = 6.', '(7 − 0) mod 8 = 7, (6 − 7) mod 8 = 7.', 'Even codes: 0, 6, 4, 2 → a = 4.'],
      explain: 'c = 0 7 7 6 4 3 3 2 → d = (0−2, 7−0, 7−7, 6−7, 4−6, 3−4, 3−3, 2−3) mod 8 = **67076707**.\n\nRotations starting with 0: 07670767 and 07670767 (twice, the shape is symmetric) → shape number **07670767**, n = **8**.\n\nPerimeter: a = 4 even (0, 6, 4, 2), b = 4 odd (7, 7, 3, 3) → 4 + 4√2 ≈ **9.66**.',
      wrong: [{ diff: '21012121' }],
    },
    {
      id: 'shp-4', type: 'calc', title: 'Start point and rotation',
      prompt: 'The chain code of a shape depends on the **start point** and on the **orientation**. Take the 4-direction code **0030322121** again.\n\n- **(a)** Rotate the shape by **+90°** (counter-clockwise on the screen). Every direction code changes by the same amount – write the new chain code.\n- **(b)** Give the first difference of the rotated code.\n- **(c)** Start the original code at its 4th element instead (0322121003). What is the shape number?',
      fields: [
        { key: 'rot', label: '(a) rotated chain code', kind: 'str' },
        { key: 'drot', label: '(b) difference of the rotated code', kind: 'str' },
        { key: 'sn', label: '(c) shape number', kind: 'str' },
      ],
      solve: () => ({ rot: rot4, drot: L.chainDiff(rot4, 4).join(''), sn: L.shapeNumber('0322121003', 4) }),
      hints: ['+90° = one step counter-clockwise: c → (c + 1) mod 4.', 'A constant added to every element cancels in the differences.'],
      explain: '**(a)** c + 1 mod 4: **1101033232** – a completely different string for the same shape.\n\n**(b)** The difference is unchanged: **3031330313** (the +1 cancels in c_i − c_{i−1}). So the difference code is rotation-invariant (for multiples of 90° with 4 directions, of 45° with 8).\n\n**(c)** Changing the start point only rotates the circular difference sequence; picking the smallest rotation removes that → the shape number is again **0313303133**.',
      wrong: [{ rot: '3323212010' }],
    },
    {
      id: 'shp-5', type: 'calc', title: 'Centroid and central moments – warm-up 1',
      prompt: 'Binary image, the 1s are the object. Coordinates are **1-based**, **x = column (→), y = row (↓)**.\n\nCompute the area m₀₀, the raw moments m₁₀ = Σx, m₀₁ = Σy, the centroid (x̄, ȳ) and the central moments\n\nμ₂₀ = Σ(x − x̄)², μ₀₂ = Σ(y − ȳ)², μ₁₁ = Σ(x − x̄)(y − ȳ).',
      grids: [{ title: 'B(x, y)', data: m1, image: true }],
      fields: [
        { key: 'A', label: 'm₀₀', int: true }, { key: 'm10', label: 'm₁₀', int: true }, { key: 'm01', label: 'm₀₁', int: true },
        { key: 'xc', label: 'x̄' }, { key: 'yc', label: 'ȳ' },
        { key: 'mu20', label: 'μ₂₀' }, { key: 'mu02', label: 'μ₀₂' }, { key: 'mu11', label: 'μ₁₁' },
      ],
      solve: () => { const r = L.moments(m1, 1); return { A: r.area, m10: r.m['10'], m01: r.m['01'], xc: r.xc, yc: r.yc, mu20: r.mu['20'], mu02: r.mu['02'], mu11: r.mu['11'] }; },
      hints: ['The first row and column are empty – they still count for the coordinates (the object starts at x = 2, y = 2).', 'Shortcut: μ₂₀ = Σx² − m₀₀·x̄², μ₀₂ = Σy² − m₀₀·ȳ², μ₁₁ = Σxy − m₀₀·x̄·ȳ.'],
      explain: 'Pixels: y = 2: x = 2, 3, 4; y = 3: x = 2…5; y = 4: x = 3, 4. m₀₀ = **9**, m₁₀ = 9 + 14 + 7 = **30**, m₀₁ = 3·2 + 4·3 + 2·4 = **26** → x̄ = 30/9 = **3.333**, ȳ = 26/9 = **2.889**.\n\nΣx² = 108 → μ₂₀ = 108 − 9·3.333² = **8**; Σy² = 80 → μ₀₂ = 80 − 9·2.889² = **4.889**; Σxy = 88 → μ₁₁ = 88 − 9·3.333·2.889 = **1.333**.',
      wrong: [{ xc: '2.333' }],
    },
    {
      id: 'shp-6', type: 'calc', title: 'Normalised moments and Hu invariants – warm-up 2',
      prompt: 'Binary image (1-based, x → column, y ↓ row). Compute the centroid, μ₂₀, μ₀₂, μ₁₁, the normalised central moments\n\nη_pq = μ_pq / μ₀₀^γ, γ = (p + q)/2 + 1 (so γ = 2 for second-order moments),\n\nand the first two Hu invariants φ₁ = η₂₀ + η₀₂, φ₂ = (η₂₀ − η₀₂)² + 4η₁₁².',
      grids: [{ title: 'B(x, y)', data: band, image: true }],
      fields: [
        { key: 'xc', label: 'x̄' }, { key: 'yc', label: 'ȳ' },
        { key: 'mu20', label: 'μ₂₀' }, { key: 'mu02', label: 'μ₀₂' }, { key: 'mu11', label: 'μ₁₁' },
        { key: 'e20', label: 'η₂₀', tol: 0.001 }, { key: 'e11', label: 'η₁₁', tol: 0.001 },
        { key: 'p1', label: 'φ₁', tol: 0.001 }, { key: 'p2', label: 'φ₂', tol: 0.0005 },
      ],
      solve: () => { const r = L.moments(band, 1); return { xc: r.xc, yc: r.yc, mu20: r.mu['20'], mu02: r.mu['02'], mu11: r.mu['11'], e20: r.eta['20'], e11: r.eta['11'], p1: r.hu[0], p2: r.hu[1] }; },
      hints: ['The object is symmetric about the main diagonal → x̄ = ȳ and μ₂₀ = μ₀₂.', 'μ₀₀ = 10 → divide the second-order moments by 10² = 100.'],
      explain: 'm₀₀ = 10, Σx = Σy = 25 → x̄ = ȳ = **2.5**. Σx² = 73 → μ₂₀ = 73 − 10·6.25 = **10.5** = μ₀₂. Σxy = 70 → μ₁₁ = 70 − 62.5 = **7.5**.\n\nη₂₀ = η₀₂ = 10.5/100 = **0.105**, η₁₁ = 7.5/100 = **0.075**.\n\nφ₁ = 0.105 + 0.105 = **0.21**, φ₂ = 0² + 4·0.075² = **0.0225**.',
      wrong: [{ p2: '0.075' }],
    },
    {
      id: 'shp-7', type: 'calc', title: 'Orientation: the principal axis',
      prompt: 'Binary image (1-based, x → column, y ↓ row). Compute the centroid, μ₂₀, μ₀₂, μ₁₁ and the direction θ of the **principal axis** (axis of least second moment):\n\ntan 2θ = 2μ₁₁ / (μ₂₀ − μ₀₂)\n\nθ is measured from the **+x axis towards +y** – because y points **down**, a positive θ means the axis goes down to the right on the screen. Give θ in **degrees** (−90° < θ ≤ 90°; choose the quadrant of 2θ from the signs of numerator and denominator, i.e. 2θ = atan2(2μ₁₁, μ₂₀ − μ₀₂)).',
      grids: [{ title: 'B(x, y)', data: m3, image: true }],
      fields: [
        { key: 'xc', label: 'x̄' }, { key: 'yc', label: 'ȳ' },
        { key: 'mu20', label: 'μ₂₀' }, { key: 'mu02', label: 'μ₀₂' }, { key: 'mu11', label: 'μ₁₁' },
        { key: 'th', label: 'θ (degrees)', tol: 0.1 },
      ],
      solve: () => { const r = L.moments(m3, 1); return { xc: r.xc, yc: r.yc, mu20: r.mu['20'], mu02: r.mu['02'], mu11: r.mu['11'], th: r.theta }; },
      hints: ['m₀₀ = 10, Σx = 35, Σy = 20.', 'μ₁₁ > 0 and μ₂₀ > μ₀₂ → 2θ is in the first quadrant.'],
      explain: 'x̄ = 35/10 = **3.5**, ȳ = 20/10 = **2**. Σx² = 145 → μ₂₀ = 145 − 122.5 = **22.5**; Σy² = 46 → μ₀₂ = 46 − 40 = **6**; Σxy = 79 → μ₁₁ = 79 − 70 = **9**.\n\ntan 2θ = 18 / 16.5 = 1.0909 → 2θ = 47.49° → **θ ≈ 23.7°**: the axis runs from the top-left to the bottom-right, as the picture shows.\n\nThe derivation minimises E = Σ r²·B(x, y), the sum of squared distances from a line through the centroid; the orientation is reliable only for elongated objects (μ₂₀ ≈ μ₀₂ and μ₁₁ ≈ 0 → undefined).',
      wrong: [{ th: '-23.74' }],
    },
    {
      id: 'shp-8', type: 'calc', title: 'Perimeter, compactness and Euler number',
      prompt: '**(a)** For the left object: the **area** A, the **perimeter** P as the number of **boundary pixels** (object pixels with at least one 4-neighbour in the background; outside the image counts as background) and the **compactness** C = P² / (4πA).\n\n**(b)** For the right image: the number of 8-connected objects C, the number of holes H and the **Euler number** E = C − H.',
      grids: [{ title: '(a) B(x, y)', data: disk, image: true }, { title: '(b) B(x, y)', data: euler, image: true }],
      fields: [
        { key: 'A', label: '(a) A', int: true }, { key: 'P', label: '(a) P', int: true }, { key: 'C', label: '(a) P²/(4πA)' },
        { key: 'nc', label: '(b) C', int: true }, { key: 'nh', label: '(b) H', int: true }, { key: 'E', label: '(b) E', int: true },
      ],
      solve: () => {
        const P = L.sum(L.boundaryPixels(disk)); const A = L.sum(disk); const e = L.eulerNumber(euler);
        return { A, P, C: L.compactness(P, A), nc: e.C, nh: e.H, E: e.E };
      },
      hints: ['Only the outermost ring of the disk touches the background; the inner 3×3 block and the four "shoulder" pixels such as (2, 2) do not.', 'The 3×3 ring and the second ring each have one hole.'],
      explain: '**(a)** A = 21. The boundary pixels are the 3 + 3 pixels of the top and bottom rows and the 3 + 3 edge pixels of the left and right columns → P = **12**. C = 144/(4π·21) = **0.546**. (With a pixel-count perimeter the value is not comparable with the ideal 1 of a continuous circle; only compare compactness values computed the same way.)\n\n**(b)** Objects: the left ring, the right ring and the bar at the bottom → C = **3**; holes: one in each ring → H = **2**; E = 3 − 2 = **1**. The Euler number is invariant to translation, rotation and scaling.',
      wrong: [{ P: '16' }, { E: '3' }],
    },
    {
      id: 'shp-9', type: 'code', title: 'Centroid and second-order central moments',
      prompt: 'Write `centralMoments(bin)` for a binary image (`bin[y][x]`, any non-zero value is object with weight 1). Use **1-based** coordinates like the ZH: the pixel `bin[y][x]` has x = x + 1 (column), y = y + 1 (row).\n\nReturn the array `[x̄, ȳ, μ20, μ02, μ11]`.',
      fn: 'centralMoments',
      starter: 'function centralMoments(bin) {\n  let A = 0;\n  // TODO: centroid, then the central moments\n  return [0, 0, 0, 0, 0];\n}',
      solution: cmSolution,
      tests: [[m1], [band], [m3], ['@img:blob'], [disk]],
      display: 'auto',
      hints: ['Two passes: first the centroid, then Σ(x − x̄)², Σ(y − ȳ)², Σ(x − x̄)(y − ȳ).', 'Do not forget the +1 on both indices.'],
      explain: 'The central moments do not change if the whole image is shifted, so only x̄ and ȳ depend on the 0- or 1-based convention. `lib.moments(bin, 1)` in the Image lab returns the same values (`.xc, .yc, .mu["20"], …`).',
      wrong: [cmSolution.replace(/x \+ 1/g, 'x').replace(/y \+ 1/g, 'y')],
    },
    q('shp-10', 'Fourier descriptors', 'The boundary points are written as complex numbers s(k) = x_k + j·y_k and transformed with the DFT into a(u). Which statement is **true**?',
      ['The descriptors a(u) are invariant to translation without any change.',
        'The magnitudes |a(u)| are invariant to rotation; a(0) = 0 gives translation invariance; a(u)/|a(1)| gives scale invariance.',
        'Dropping the high-frequency descriptors removes the coarse shape and keeps only the corners.',
        'Fourier descriptors only work for convex boundaries.'], 1,
      'Rotation multiplies every s(k) by e^{jθ} → only the phase of a(u) changes. A translation only changes a(0) (the mean point) → set it to 0. Scaling multiplies every a(u) by the same factor → divide by |a(1)|. Keeping only P < N low-frequency terms approximates the shape with less data (the corners – high frequencies – are lost).'),
    q('shp-11', 'Signature', 'The signature r(θ) – distance of the boundary from the centroid as a function of the angle – is…',
      ['invariant to translation; rotation- and scale-invariant only after choosing a fixed start point and normalising the values',
        'invariant to translation, rotation and scaling without any extra step',
        'dependent on translation, but invariant to rotation',
        'a 2-D descriptor of the region\'s interior'], 0,
      'The signature is a 1-D functional description of the boundary. Measured from the centroid it is translation-invariant. Rotation shifts it along θ → start always at the same point (e.g. the farthest from the centre). Scaling multiplies it → normalise, e.g. x\' = (x − x_min)/(x_max − x_min).'),
    c('shp-12', 'n-th order shapes (ZH theory 7)', 'What are **n-th order shapes**, and what are they used for? (2 + 2 points)',
      '**What:** the order n of a shape number is the **number of digits** of the chain code (= of the difference code and the shape number). The *n-th order shapes* are all the possible **closed shapes that can be described by an n-element chain code** on the grid. With 4 directions n is even: order 4 → only the 1×1 square (shape number 3333), order 6 → the 2×1 rectangle (033033), order 8 → three shapes: 2×2 square (03030303), 3×1 rectangle (00330033) and the L of three cells (03033133).\n\n**Used for:** describing and **comparing boundaries** independently of the start point and of rotation (multiples of 90°/45°): two shapes are compared by their shape numbers **of the same order**. To get a shape number of a prescribed order n for any object: fix n, determine the major/minor axis ratio (eccentricity), take the basic rectangle of order n with that ratio, resample the boundary on this grid and compute the shape number there. The similarity of two shapes can be measured by the highest order for which their shape numbers still coincide.'),
    c('shp-13', 'Central moments (ZH theory 8)', 'How are the **central moments** computed, and to which transformation(s) are they invariant?',
      '**Raw moments:** m_pq = Σ_x Σ_y x^p·y^q·B(x, y); area = m₀₀, centroid x̄ = m₁₀/m₀₀, ȳ = m₀₁/m₀₀.\n\n**Central moments** – the same sums around the centroid:\n\nμ_pq = Σ_x Σ_y (x − x̄)^p·(y − ȳ)^q·B(x, y)\n\nμ₀₀ = m₀₀, μ₁₀ = μ₀₁ = 0, μ₂₀ = m₂₀ − m₀₀x̄², μ₀₂ = m₀₂ − m₀₀ȳ², μ₁₁ = m₁₁ − m₀₀x̄ȳ (and μ₃₀ = m₃₀ − 3m₂₀x̄ + 2m₀₀x̄³, …).\n\n**Invariance:** μ_pq are invariant to **translation** (the same region anywhere in the image gives the same values). They are **not** invariant to scaling and rotation:\n- **normalised** central moments η_pq = μ_pq / μ₀₀^γ, γ = (p + q)/2 + 1 → also **scale**-invariant;\n- the **Hu invariants** built from η (φ₁ = η₂₀ + η₀₂, φ₂ = (η₂₀ − η₀₂)² + 4η₁₁², …) → translation, scale **and rotation** invariant.'),
  ],
};
