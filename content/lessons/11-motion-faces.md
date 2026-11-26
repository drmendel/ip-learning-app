# Optical flow & face detection

## Motion in images

A 3-D motion projected to the image plane gives 2-D motion – some information is lost. At least **two frames** are needed. Applications: motion detection (frame difference ≈ 0 where nothing moves), object tracking, camera stabilisation, mosaicking / panoramas, segmentation of moving objects, structure from motion (3-D shape), video compression.

- **Motion field:** the 2-D projection of the real 3-D velocities of the scene points.
- **Optical flow:** the apparent motion of the **brightness pattern**. The two terms "optical flow" and "pixel flow" are synonyms.
- They differ: a uniform rotating sphere has a motion field but no optical flow; a moving light source creates optical flow without a motion field; TV relies on illusory motion; the rotating barber pole shows the aperture effect.

## Assumptions and the flow equation

1. **Brightness constancy:** I(x, y, t) = I(x + δx, y + δy, t + δt).
2. **Spatial coherence:** neighbouring pixels belong to the same surface and move similarly.
3. **Temporal coherence:** motion changes gradually.

First-order Taylor expansion of the right-hand side, divided by δt, with u = δx/δt, v = δy/δt:

**Ix·u + Iy·v + It = 0**

Ix, Iy: spatial gradient; It: difference of two consecutive frames. One equation, two unknowns → the solution is somewhere on a **line in the (u, v) plane**: v = −(Ix/Iy)·u − It/Iy.

### Aperture problem

Only the component of the flow **along the gradient** (normal to the edge) can be measured:

**normal flow = −It / |∇I|**, direction ∇I / |∇I|, |∇I| = √(Ix² + Iy²)

The parallel component (along the edge) is unknown. Example: Ix = 3, Iy = 4, It = −10 → normal flow 2, vector (1.2, 1.6); (2, 1) and (0, 2.5) satisfy the equation equally well.

## Lucas–Kanade

Assume the same (u, v) in a small window and minimise Σ(Ix·u + Iy·v + It)²:

| ΣIx²  ΣIxIy | · | u | = − | ΣIxIt |
| --- | --- | --- | --- | --- |
| ΣIxIy  ΣIy² | | v | | ΣIyIt |

A·u = B → u = A⁻¹B. With det = ΣIx²·ΣIy² − (ΣIxIy)²:

- u = (ΣIy²·(−ΣIxIt) − ΣIxIy·(−ΣIyIt)) / det
- v = (ΣIx²·(−ΣIyIt) − ΣIxIy·(−ΣIxIt)) / det

A is the structure tensor (Harris!). On a straight edge det A = 0 → aperture problem; in homogeneous areas A ≈ 0. Reliable only for corners / textured windows.

```grid
# Ix in a 3×3 window (with Iy and It → u = 1, v = −1)
1 2 1
2 3 2
1 2 0
```

## Horn–Schunck

Brightness constancy **plus smoothness** of the flow. Minimise

E = Σ (Ix·u + Iy·v + It)² + λ·(u_x² + u_y² + v_x² + v_y²)

The Laplacian is approximated by ∇²u ≈ ū − u (ū = average of the 4 neighbours). Solving the two linear equations gives the iteration

- P = Ix·ū + Iy·v̄ + It, D = λ + Ix² + Iy²
- **u = ū − Ix·P/D,  v = v̄ − Iy·P/D**

Compute the derivatives once, start with u = v = 0, recompute ū, v̄ from the neighbours in every iteration. (Schunck's method intersects the constraint lines of 8 neighbours and takes the largest cluster.)

## Large motions: pyramids

Both methods work only for **small motions** (the Taylor approximation breaks down, the derivatives are no longer valid) and fail on homogeneous regions. For large motions build **Gaussian pyramids** of both frames: on the coarsest level the motion is small (10 px → 5 → 2.5 → 1.25 px), compute the flow there, double it and use it as the starting guess on the next finer level.

```js
// Lucas–Kanade on the moving spot: frame2 = frame1 shifted 1 px to the right
const a = IMG.frame1, b = IMG.frame2;
const Ix = [], Iy = [], It = [];
for (let y = 9; y <= 15; y++) for (let x = 5; x <= 9; x++) {   // window left of the spot centre
  Ix.push((a[y][x + 1] - a[y][x - 1]) / 2);
  Iy.push((a[y + 1][x] - a[y - 1][x]) / 2);
  It.push(b[y][x] - a[y][x]);
}
const r = lib.lucasKanade(Ix, Iy, It);
print('u =', r.u.toFixed(2), 'v =', r.v.toFixed(2), 'det =', r.det.toFixed(0));
show(a, 'frame 1'); show(b, 'frame 2');
```

## Viola–Jones face detection

- **Haar-like features:** Σ(white rectangle) − Σ(black rectangle) inside a 24×24 sub-window (white +1, black −1).
- **Integral image:** ii(x, y) = Σ_{x'≤x, y'≤y} i(x', y'), in one pass: s(x, y) = s(x, y−1) + i(x, y), ii(x, y) = ii(x−1, y) + s(x, y). Rectangle D = ii(4) − ii(3) − ii(2) + ii(1); 1 rectangle = 4 references, 2 = 6, 3 = 8, 4 = 9.

```grid
# i(x, y) → ii; rectangle x = 2…4, y = 2…3: 20 − 6 − 5 + 1 = 10
1 2 0 3
4 1* 2* 1*
0 3* 1* 2*
2 1 4 1
```

- **AdaBoost** ("team of weak experts"): start with equal weights; each round choose the weak classifier (feature + threshold + polarity) with the smallest weighted error ε; **α = ½·ln((1 − ε)/ε)**; w_i ← w_i·e^(−α·y_i·h_i), normalise – misclassified samples get heavier. Final classifier H(x) = sign(Σ α_t·h_t(x)). An expert worse than 50 % is inverted; exactly 50 % is useless.
- **Cascade:** simple, fast stages first reject most non-face windows; only candidates reach the complex stages. 38 stages, 6061 features, real time.
- Limits: expensive sliding window (positions × orientations × scales), fixed viewpoint, non-rigid objects, occlusion, needs huge training sets.

## Face recognition

- **Identification (1:N):** "who is this?" – compare with every enrolled person. **Verification (1:1):** "is this really X?" – compare with one template.
- Biometric pipeline: sensor → feature extraction → enrolment into a database / matching.
- **Face detection approaches:** knowledge-based (top-down rules, e.g. horizontal/vertical projections), feature-based (bottom-up: eyes, nose, mouth, edges, skin colour, ellipse fitting), template matching, appearance-based (trained classifiers: Viola–Jones, colour in YCrCb, …).
- **Recognition:** holistic (whole face: **eigenfaces / PCA**), feature-based (Gabor wavelets + elastic graph matching), hybrid.
- **Eigenfaces:** subtract the mean face ψ, compute the eigenvectors of the covariance (largest eigenvalues) → face space; describe a face by ω_k = u_kᵀ(x − ψ); recognise by the nearest stored ω.

```js
// PCA of four 4-pixel "faces"
const faces = [[130, 110, 110, 90], [90, 130, 70, 110], [120, 100, 100, 80], [60, 140, 40, 120]];
const p = lib.pca(faces, 2);
print('mean face', p.mean);
print('eigenvalues', p.values.map((v) => v.toFixed(1)));
print('1st eigenface', p.components[0].map((v) => v.toFixed(3)));
```
