import { L, q, c } from './util.js';

const cube = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
const cubeEdges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
const bar = [[0, 0, 0], [2, 0, 0], [2, 1, 0], [0, 1, 0], [0, 0, 1], [2, 0, 1], [2, 1, 1], [0, 1, 1]];
const hom = (p) => [...p, 1];
const apply2 = (M, p) => L.matvec(M, [...p, 1]).slice(0, 2);
const T1 = L.composeActive([L.RotZ(90), L.Tran(1, 2, 0)]); // first Rz, then Tran (base frame)
const T1p = L.composePassive([L.RotZ(90), L.Tran(1, 2, 0)]); // same matrices, local frame
const rig = L.matmul(L.Tran(2, -1, 3), L.RotX(90));
const R120 = L.Rodrigues([1, 1, 1], 120);

export default {
  id: 'transforms',
  title: 'Homogeneous transformations & modelling',
  lab: 'Lecture 9',
  lesson: '08-transforms.md',
  exercises: [
    {
      id: 'trf-1', type: 'calc', title: '2-D basic transformations',
      prompt: 'Use 3 × 3 homogeneous matrices (points as columns [x, y, 1]ᵀ). Where does the point **P = (2, 1)** go under\n\n1. a translation by (4, −1),\n2. a scaling by sx = 3, sy = 2 (about the origin),\n3. a rotation by **90°** about the origin (counter-clockwise, x towards y)?',
      fields: [
        { key: 't', label: '1. translated (x, y)', shape: [1, 2], colLabels: ['x', 'y'], rowLabels: [''] },
        { key: 's', label: '2. scaled (x, y)', shape: [1, 2], colLabels: ['x', 'y'], rowLabels: [''] },
        { key: 'r', label: '3. rotated (x, y)', shape: [1, 2], colLabels: ['x', 'y'], rowLabels: [''] },
      ],
      solve: () => ({ t: [apply2(L.Tran2(4, -1), [2, 1])], s: [apply2(L.Scale2(3, 2), [2, 1])], r: [L.cleanZero(apply2(L.Rot2(90), [2, 1]))] }),
      hints: ['Rotation: x\' = x·cosθ − y·sinθ, y\' = x·sinθ + y·cosθ.'],
      explain: 'Translation (6, 0); scaling (6, 2); rotation by 90°: (2·0 − 1·1, 2·1 + 1·0) = (−1, 2). Only the translation needs the third homogeneous coordinate – that is why homogeneous coordinates are introduced.',
    },
    {
      id: 'trf-2', type: 'calc', title: 'Rotation about a point (2-D)',
      prompt: 'Rotate the point **P = (4, 2)** by **90°** about the centre **C = (3, 1)**. Build it from elementary steps (base frame, left multiplication): translate C to the origin, rotate, translate back: T = Tran(3, 1) · Rot(90°) · Tran(−3, −1). Give T (3 × 3) and the image of P.',
      fields: [
        { key: 'T', label: 'T', shape: [3, 3], rowLabels: ['', '', ''], colLabels: ['', '', ''] },
        { key: 'p', label: 'image of P (x, y)', shape: [1, 2], colLabels: ['x', 'y'], rowLabels: [''] },
      ],
      solve: () => { const T = L.cleanZero(L.matmul(L.Tran2(3, 1), L.matmul(L.Rot2(90), L.Tran2(-3, -1)))); return { T, p: [L.cleanZero(L.matvec(T, [4, 2, 1]).slice(0, 2))] }; },
      hints: ['P − C = (1, 1) → rotated (−1, 1) → + C = (2, 2).'],
      explain: 'T = [[0, −1, 4], [1, 0, −2], [0, 0, 1]]; P → (2, 2). The same idea in 3-D is the lecture\'s rotation about an axis parallel to y: T = Tran(v)·Rot(y, θ)·Tran(−v).',
    },
    {
      id: 'trf-3', type: 'calc', title: 'Elementary rotation matrices',
      prompt: 'Write the 4 × 4 homogeneous matrices **Rot(z, 90°)** and **Rot(y, 90°)** (lecture notes, formula 2.14: Rot(y, θ) has +sinθ in row 1, column 3).',
      fields: [
        { key: 'z', label: 'Rot(z, 90°)', shape: [4, 4], int: true, rowLabels: ['', '', '', ''], colLabels: ['', '', '', ''] },
        { key: 'y', label: 'Rot(y, 90°)', shape: [4, 4], int: true, rowLabels: ['', '', '', ''], colLabels: ['', '', '', ''] },
      ],
      solve: () => ({ z: L.RotZ(90), y: L.RotY(90) }),
      hints: ['The axis we rotate about keeps its unit column; cos on the diagonal of the remaining 2 × 2 block, ±sin off the diagonal.'],
      explain: 'Rot(z, 90°) = [[0, −1, 0, 0], [1, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]: x → y, y → −x. Rot(y, 90°) = [[0, 0, 1, 0], [0, 1, 0, 0], [−1, 0, 0, 0], [0, 0, 0, 1]]: z → x, x → −z. Watch the sign pattern of Rot(y): it is the "odd one out" because the cyclic order is x → y → z → x.',
      wrong: [{ y: [['0', '0', '-1', '0'], ['0', '1', '0', '0'], ['1', '0', '0', '0'], ['0', '0', '0', '1']] }],
    },
    {
      id: 'trf-4', type: 'calc', title: 'Order matters: active vs passive',
      prompt: 'Two elementary transformations: **Rot(z, 90°)** and **Tran(1, 2, 0)**.\n\n1. *Active view*: first rotate about the **base** z axis, then translate along the **base** axes → T = Tran · Rot (left multiplication). Where does the point (1, 0, 0) go?\n2. *Passive view*: first rotate, then translate along the **rotated (local)** axes → T = Rot · Tran (right multiplication). Where does (1, 0, 0) go now?',
      fields: [
        { key: 'a', label: '1. active (x, y, z)', shape: [1, 3], colLabels: ['x', 'y', 'z'], rowLabels: [''] },
        { key: 'p', label: '2. passive (x, y, z)', shape: [1, 3], colLabels: ['x', 'y', 'z'], rowLabels: [''] },
      ],
      solve: () => ({ a: [L.cleanZero(L.matvec(T1, hom([1, 0, 0])).slice(0, 3))], p: [L.cleanZero(L.matvec(T1p, hom([1, 0, 0])).slice(0, 3))] }),
      hints: ['Active: (1,0,0) → rotated (0,1,0) → + (1,2,0).', 'Passive: Rot·Tran·p – first the translation acts on the point, then the rotation.'],
      explain: 'Active: (0, 1, 0) + (1, 2, 0) = **(1, 3, 0)**. Passive: Rot(z,90°)·(2, 2, 0) = **(−2, 2, 0)** – translating along the rotated local x axis means moving along the base y axis. Same elementary matrices, different order, different result: matrix multiplication is not commutative.',
    },
    q('trf-5', 'Left or right?', 'Following the algorithm of the lecture notes, when do we multiply the composite matrix **from the right** by the next elementary transformation?',
      ['When the transformation is about/along an axis of the fixed base frame', 'When the transformation is about/along an axis of the moving local frame (passive view)', 'Always for translations, never for rotations', 'Only when computing the inverse'], 1,
      'Base frame (active view, describing motion) → left multiplication. Own (local) axes (passive view, changing the reference frame) → right multiplication. Start from T = I.'),
    {
      id: 'trf-6', type: 'calc', title: 'Rotation about an axis parallel to y',
      prompt: 'Lecture formula (2.16–2.17): rotation about the axis parallel to y through **v = (vx, 0, vz)** is T = Tran(v) · Rot(y, θ) · Tran(−v). Compute T for **v = (2, 0, 1)** and **θ = 90°**, and the image of the point **(3, 5, 1)**.',
      fields: [
        { key: 'T', label: 'T', shape: [4, 4], rowLabels: ['', '', '', ''], colLabels: ['', '', '', ''] },
        { key: 'p', label: 'image of (3, 5, 1)', shape: [1, 3], colLabels: ['x', 'y', 'z'], rowLabels: [''] },
      ],
      solve: () => { const T = L.cleanZero(L.matmul(L.Tran(2, 0, 1), L.matmul(L.RotY(90), L.Tran(-2, 0, -1)))); return { T, p: [L.cleanZero(L.matvec(T, [3, 5, 1, 1]).slice(0, 3))] }; },
      hints: ['Last column (2.17): vx(1 − cosθ) − vz·sinθ and vz(1 − cosθ) + vx·sinθ.'],
      explain: 'T = [[0, 0, 1, 1], [0, 1, 0, 0], [−1, 0, 0, 3], [0, 0, 0, 1]]. (3, 5, 1) − v = (1, 5, 0) → Rot(y, 90°) → (0, 5, −1) → + v = (2, 5, 0).',
    },
    {
      id: 'trf-7', type: 'calc', title: 'Inverse of a rigid transformation',
      prompt: 'T = Tran(2, −1, 3) · Rot(x, 90°). Give **T⁻¹** using the lecture\'s shortcut (2.32): T⁻¹ = [Rᵀ, −Rᵀv; 0 0 0 1] — no general matrix inversion needed.',
      fields: [{ key: 'Ti', label: 'T⁻¹', shape: [4, 4], rowLabels: ['', '', '', ''], colLabels: ['', '', '', ''] }],
      solve: () => ({ Ti: L.cleanZero(L.invRigid(rig)) }),
      hints: ['R = Rot(x, 90°) = [[1,0,0],[0,0,−1],[0,1,0]], v = (2, −1, 3). Rᵀ v = (2, 3, 1).'],
      explain: 'Rᵀ = [[1,0,0],[0,0,1],[0,−1,0]], −Rᵀv = (−2, −3, −1) → T⁻¹ = [[1, 0, 0, −2], [0, 0, 1, −3], [0, −1, 0, −1], [0, 0, 0, 1]]. It works because R is orthonormal (Rᵀ = R⁻¹) and the bottom row is 0 0 0 1.',
    },
    {
      id: 'trf-8', type: 'calc', title: 'Rodrigues: axis and angle',
      prompt: 'The rotation part of a homogeneous matrix is R = [[0, 0, 1], [1, 0, 0], [0, 1, 0]]. Using (2.29–2.31) – Sp(Rot) = 2 + 2cosθ for the 4 × 4 matrix, u = (R32 − R23, R13 − R31, R21 − R12) / (2 sinθ) – find the rotation angle θ and the unit axis u.',
      fields: [
        { key: 'th', label: 'θ [°]' },
        { key: 'u', label: 'u', shape: [1, 3], colLabels: ['u1', 'u2', 'u3'], rowLabels: [''] },
      ],
      solve: () => { const r = L.rotationAxisAngle(R120); return { th: r.angle, u: [r.axis] }; },
      hints: ['The 4 × 4 trace is 0 + 0 + 0 + 1 = 1 → cosθ = −1/2.'],
      explain: 'Sp = 1 → θ = arccos(−1/2) = **120°**; u = (1 − 0, 1 − 0, 1 − 0)/(2·sin120°) = (1, 1, 1)/√3 ≈ (0.577, 0.577, 0.577). This matrix cyclically permutes the axes x → y → z → x.',
    },
    {
      id: 'trf-9', type: 'calc', title: 'Descriptor matrix of a cube',
      prompt: 'Model the **unit cube** [0, 1]³ by its homogeneous descriptor matrix (2.34): 4 × 8, one column per vertex, in the order\n\n1 = (0,0,0), 2 = (1,0,0), 3 = (1,1,0), 4 = (0,1,0), 5 = (0,0,1), 6 = (1,0,1), 7 = (1,1,1), 8 = (0,1,1).\n\nThen give the descriptor after **Tran(2, 0, 0) · Rot(z, 90°)** (rotate first).',
      fields: [
        { key: 'D', label: 'descriptor', shape: [4, 8], int: true, rowLabels: ['x', 'y', 'z', '1'], colLabels: ['1', '2', '3', '4', '5', '6', '7', '8'] },
        { key: 'N', label: 'new descriptor', shape: [4, 8], int: true, rowLabels: ['x', 'y', 'z', '1'], colLabels: ['1', '2', '3', '4', '5', '6', '7', '8'] },
      ],
      solve: () => { const D = L.descriptor(cube); return { D, N: L.cleanZero(L.matmul(L.matmul(L.Tran(2, 0, 0), L.RotZ(90)), D)) }; },
      explain: 'New target position = T · old descriptor (2.35): one matrix product moves all 8 vertices. Rot(z, 90°) maps (x, y) → (−y, x), then x + 2: vertex 3 = (1, 1, 0) → (−1, 1, 0) → (1, 1, 0).',
    },
    {
      id: 'trf-10', type: 'steps', title: 'Tip the cube over',
      prompt: 'Tip the unit cube over its **bottom edge at x = 1** so that it lands on its side at **x ∈ [1, 2]** (same y, z ∈ [0, 1]). The cube may never go below the ground (z = 0), not even while rotating. The **vertex numbers** count here: the former top face (5–8) must end up facing +x, as after a real tip-over – sliding the cube is not accepted.',
      vertices: cube, edges: cubeEdges, target: cube.map(([x, y, z]) => [z + 1, y, 1 - x]),
      constraints: { minZ: 0, rigid: true, ordered: true },
      starter: '# rotate about the edge x = 1, z = 0 (parallel to y)\n',
      solution: 'Tran(-1, 0, 0)\nRy(90)\nTran(1, 0, 0)',
      hints: ['Ry(+90°) turns the z axis towards +x.', 'Shift the edge onto the y axis, rotate, shift back – or write `Ry(90) about (1, 0, 0)`.'],
      explain: 'T = Tran(1,0,0) · Ry(90°) · Tran(−1,0,0), i.e. (x, y, z) → (z + 1, y, 1 − x). After the first step the cube is at x ∈ [−1, 0]; rotating by +90° about y swings it up and over the edge and it stays in z ≥ 0 during the whole motion; the last step moves it back. As a point set the result equals the cube shifted by 1, but the vertex numbers differ – that is why only the real tip-over is accepted.',
      wrong: ['Ry(90)\nTran(1, 0, 1)', 'Tran(1, 0, 0)'],
    },
    {
      id: 'trf-11', type: 'steps', title: 'Turn a bar around',
      prompt: 'A 2 × 1 × 1 bar lies along x at the origin. Move it so that it lies **along y**, occupying **x ∈ [2, 3], y ∈ [0, 2]**, z ∈ [0, 1].',
      vertices: bar, edges: cubeEdges, target: [[3, 0, 0], [3, 2, 0], [2, 2, 0], [2, 0, 0], [3, 0, 1], [3, 2, 1], [2, 2, 1], [2, 0, 1]],
      constraints: { minZ: 0, rigid: true },
      starter: '',
      solution: 'Rz(90)\nTran(3, 0, 0)',
      hints: ['A rotation about the vertical z axis never changes z.', 'Rz(90): (x, y) → (−y, x). Where is the bar after that?'],
      explain: 'Rz(90°) turns the bar to x ∈ [−1, 0], y ∈ [0, 2]; Tran(3, 0, 0) places it. Composite T = Tran(3,0,0)·Rz(90°).',
    },
    {
      id: 'trf-12', type: 'code', title: 'Transform a descriptor matrix',
      prompt: 'Write `transform(T, D)` that returns **T · D**, the new descriptor matrix (T is 4 × 4, D is 4 × n). Then apply it to the unit cube in Run.',
      fn: 'transform',
      starter: 'function transform(T, D) {\n  // result[i][j] = Σ_k T[i][k] * D[k][j]\n  return D;\n}',
      solution: 'function transform(T, D) {\n  return T.map(row => D[0].map((_, j) => row.reduce((s, t, k) => s + t * D[k][j], 0)));\n}',
      tests: [
        [L.RotZ(90), L.descriptor(cube)],
        [L.Tran(1, 2, 3), [[0, 1], [0, 1], [0, 1], [1, 1]]],
        [L.matmul(L.Tran(1, 0, 0), L.RotY(90)), L.descriptor(bar)],
      ],
      hints: ['Three nested loops, or map/reduce.'],
      explain: 'Matrix product: every column (vertex) of D is multiplied by T. Because the 4th row of D is all ones, the 4th column of T adds the translation.',
    },
    q('trf-13', 'Degrees of freedom', 'How many parameters (degrees of freedom) does a **2-D affine** transformation have?',
      ['3', '4', '6', '8'], 2,
      'Euclidean (rotation + translation): 3; similarity (+ uniform scale): 4; affine (a11 a12 a13 / a21 a22 a23): 6; projective/homography (3 × 3 up to scale): 8.'),
    q('trf-14', 'Homogeneous points', 'Which statement about homogeneous coordinates is TRUE?',
      ['[2, 4, 6, 2]ᵀ and [1, 2, 3, 1]ᵀ are the same 3-D point', 'The 4th coordinate of a point must be 0', 'Translations cannot be written as matrix products', 'They are unique: every point has exactly one homogeneous vector'], 0,
      'Homogeneous vectors are defined up to the scale factor: divide by the 4th coordinate. A 4th coordinate of 0 denotes a direction (point at infinity). The whole point of them: translation becomes a matrix product.'),
    c('trf-15', 'Why homogeneous coordinates?', 'Why do we describe image/object transformations with **homogeneous coordinates** and 3 × 3 (4 × 4) matrices?',
      'Because then **every** basic transformation – translation, rotation, scaling, shear and also perspective projection – is a **single matrix product**. A 2 × 2 (3 × 3) matrix can only multiply coordinates, it cannot **add** a translation; with the extra coordinate (fixed to 1) the translation goes into the last column.\n\nConsequences: **composite** transformations are just products of the elementary matrices (in the right order: left = base frame/active, right = local frame/passive), a whole object is moved by **T · descriptor matrix**, the inverse of a rigid motion is cheap ([Rᵀ, −Rᵀv]), and points are defined up to the scale factor (divide by the last coordinate).'),
  ],
};
