# Shape descriptors & moments

After segmentation every region should be described **compactly**, ideally with features that are invariant to **translation, rotation and scaling**.

- **External (boundary) descriptors** – when the shape matters: chain code, shape number, signature, Fourier descriptors, diameter.
- **Internal (region) descriptors** – area, centroid, moments, compactness, orientation, topology; texture or colour when those matter.
- Simple ones: mean, minimum, maximum intensity – usable only under controlled conditions.

## Freeman chain code

The boundary is followed **clockwise** and every step between neighbouring boundary pixels gets a direction code. Directions are numbered **counter-clockwise from east**:

| 8 directions | | | | 4 directions | | |
| --- | --- | --- | --- | --- | --- | --- |
| 3 | 2 | 1 | | | 1 | |
| 4 | · | 0 | | 2 | · | 0 |
| 5 | 6 | 7 | | | 3 | |

(next pixel search when tracing with 8 directions: start at (d + 5) mod 8 from the previous direction d.)

```grid image
# start at the top-left pixel (2, 1): code 007553412
0 1* 1 1 0
0 1 1 1 1
1 1 1 1 0
0 0 1 0 0
```

Problems: the code depends on the **start point**, changes with **orientation** and with **sampling**, can be very long, and is sensitive to noise (fix: resample on a coarser grid; in practice polygon approximation is better).

**Perimeter** from an 8-direction code: **P ≈ a + b·√2**, a = number of even codes, b = number of odd codes. Above: 4 + 5√2 ≈ 11.07.

## First difference and shape number

- **First difference:** treat the code as **circular**: d_i = (c_i − c_{i−1}) mod N (N = 4 or 8), d₀ uses the last element. It does not change when every code is rotated by the same amount → **rotation invariant** (multiples of 90° / 45°).
- **Shape number:** the circular rotation of the difference code that is the **smallest number** → independent of the start point.
- **Order n** = number of digits.

| Lecture example | 4-direction |
| --- | --- |
| chain code | 10103322 |
| difference | 33133030 |
| | |
| chain code | 003221 |
| difference | 303303 |
| shape number (order 6) | 033033 |

**n-th order shapes:** all closed shapes that can be described with an n-element chain code. With 4 directions: order 4 → 3333 (square), order 6 → 033033 (2×1 rectangle), order 8 → 03030303, 00330033, 03033133. Used to compare boundaries: compare shape numbers **of the same order**. For a fixed order n (modified shape number): find the major/minor axis ratio (eccentricity), take the basic rectangle of order n with this ratio, resample the boundary on that grid, compute the shape number.

**Chain smoothing** (Zamperoni) shortens the chain by replacing pairs of successive directions.

## Signatures and other boundary descriptors

- **Signature:** a 1-D function of the boundary, e.g. distance from the centroid r(θ). Translation invariant; rotation invariant if the start point is fixed (e.g. the farthest point); scale invariant after normalising x' = (x − x_min)/(x_max − x_min). Other signatures: tangent angle along the arc length, slope density (histogram of tangent angles – straight segments give peaks).
- **Diameter:** the largest distance between two boundary points. The ratio of the sides of the bounding box aligned with the principal axes is invariant.
- **Fourier descriptors:** s(k) = x_k + j·y_k, a(u) = DFT of s. Keeping P < N low-frequency terms approximates the shape. |a(u)| is **rotation** invariant, a(0) = 0 gives **translation** invariance, a(u)/|a(1)| gives **scale** invariance.

## Area, centroid, moments

With 1-based coordinates (x = column →, y = row ↓, like in the ZH):

- **Moments:** m_pq = Σ_x Σ_y x^p·y^q·B(x, y); **area** A = m₀₀.
- **Centroid:** x̄ = m₁₀ / m₀₀, ȳ = m₀₁ / m₀₀.
- **Central moments** (translation invariant): μ_pq = Σ (x − x̄)^p·(y − ȳ)^q·B(x, y)
  - μ₀₀ = m₀₀, μ₁₀ = μ₀₁ = 0
  - μ₂₀ = m₂₀ − m₀₀·x̄², μ₀₂ = m₀₂ − m₀₀·ȳ², μ₁₁ = m₁₁ − m₀₀·x̄·ȳ
  - μ₃₀ = m₃₀ − 3m₂₀x̄ + 2m₀₀x̄³, μ₂₁ = m₂₁ − m₂₀ȳ − 2m₁₁x̄ + 2m₀₀x̄²ȳ, …
- **Normalised** (scale invariant): η_pq = μ_pq / μ₀₀^γ, γ = (p + q)/2 + 1 (p + q ≥ 2).
- **Hu invariants** (translation, scale, rotation): φ₁ = η₂₀ + η₀₂, φ₂ = (η₂₀ − η₀₂)² + 4η₁₁², φ₃ = (η₃₀ − 3η₁₂)² + (3η₂₁ − η₀₃)², φ₄ = (η₃₀ + η₁₂)² + (η₂₁ + η₀₃)², …
- Uniqueness theorem: the moments {m_pq} determine B(x, y) and vice versa.

```grid image
# m₀₀ = 9, x̄ = 3.333, ȳ = 2.889, μ₂₀ = 8, μ₀₂ = 4.889, μ₁₁ = 1.333
0 0 0 0 0
0 1 1 1 0
0 1 1 1 1
0 0 1 1 0
```

Hand-calculation routine for the ZH: list the pixel coordinates row by row, sum x, y, x², y², xy, then use the shortcut formulas above. Keep 3–4 decimals.

## Orientation: principal axis

Minimise E = Σ r²·B(x, y), the squared distance of the pixels from a line through the centroid. With a = μ₂₀, b = 2μ₁₁, c = μ₀₂:

**tan 2θ = 2μ₁₁ / (μ₂₀ − μ₀₂)**

θ is measured from the +x axis **towards +y**; since y points **down** in the image, θ > 0 means the axis goes down to the right. Use the signs (atan2) to choose the right quadrant. Meaningful only for elongated objects.

```js
const r = lib.moments(IMG.blob, 1);   // 1-based coordinates
print('area', r.area, 'centroid', r.xc.toFixed(2), r.yc.toFixed(2));
print('mu20, mu02, mu11', r.mu['20'].toFixed(1), r.mu['02'].toFixed(1), r.mu['11'].toFixed(1));
print('theta (deg, towards +y)', r.theta.toFixed(1), ' Hu:', r.hu[0].toFixed(4), r.hu[1].toFixed(5));
show(IMG.blob, 'ellipse tilted by 30°');
```

## Perimeter, compactness, topology

- **Perimeter:** number of boundary pixels (object pixels with at least one background neighbour); sometimes the sum of 1 and √2 steps.
- **Compactness:** C = P² / (4πA) – the circle is the most compact.
- **Euler number:** E = C − H (C = connected components, H = holes); invariant to translation, rotation, scaling.

```js
const bin = lib.threshold(IMG.shapes, 128);
const P = lib.sum(lib.boundaryPixels(bin)), A = lib.sum(bin);
print('A =', A, 'P =', P, 'compactness =', lib.compactness(P, A).toFixed(3));
print(lib.eulerNumber(bin));
print('chain code of the blob:', lib.chainCode(IMG.blob).slice(0, 30), '…');
```
