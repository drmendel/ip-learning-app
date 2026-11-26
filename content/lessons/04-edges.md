# Edge detection

**Edges** are pixels where (or around which) the intensity changes strongly. They are caused by depth discontinuities, changes of the surface normal, illumination (shadows) and reflectance. Finding them usually gives the shape and position of the objects.

Typical edge profiles: **step**, **ramp**, **ridge/roof**, **line**. The usual pipeline: noise reduction → edge enhancement → edge detection (threshold) → edge localisation.

Definitions:

- **edge normal** – direction of the largest intensity change (the gradient direction);
- **edge direction** – perpendicular to the normal (the edge runs that way);
- **edge position** – where the edge is;
- **edge strength** – how "good" the edge is (large change → large strength).

## Derivatives and differences

In 1-D: forward difference [−1 1], backward [1 −1], central [−1 0 1]. The first derivative has a **maximum** at the edge, the second derivative a **zero crossing**.

```grid
# f, x = 1…9 – the zero crossing of the second difference is at x = 5
10 10 10 20 50* 80 90 90 90
```

d = f(x+1) − f(x) = [0 0 10 30 30 10 0 0], d₂ = f(x+1) − 2f(x) + f(x−1) = [0 10 20 0 −20 −10 0] (x = 2 … 8).

In 2-D the **gradient** ∇f = (fx, fy). Conventions in this course: masks as **correlation**, **fx = right − left**, **fy = bottom − top** (y grows downwards).

- magnitude: Euclidean √(fx² + fy²) or Manhattan |fx| + |fy|;
- direction: θ = atan2(fy, fx) (degrees).

## Gradient operators

With the pixel numbering x0 x1 x2 / x3 x4 x5 / x6 x7 x8:

| operator | fx | fy |
| --- | --- | --- |
| central difference | x5 − x3 | x7 − x1 |
| **Prewitt** | (x2 + x5 + x8) − (x0 + x3 + x6) | (x6 + x7 + x8) − (x0 + x1 + x2) |
| **Sobel** | (x2 + 2x5 + x8) − (x0 + 2x3 + x6) | (x6 + 2x7 + x8) − (x0 + 2x1 + x2) |
| **Roberts cross** | [1 0; 0 −1] | [0 1; −1 0] |

Sobel = [1 2 1]ᵀ smoothing **parallel** to the edge × [−1 0 1] difference across it → separable and less noise-sensitive; the price is that steep edges become 2 pixels wide. **Sobel edge detector**: filter, gradient magnitude, threshold.

```js
const g = lib.sobel(IMG.shapes);
show(g.mag, 'Sobel magnitude');
show(lib.threshold(g.mag, 150, 255), 'threshold 150');
```

## Compass masks

Eight masks, each obtained by rotating the outer ring of the previous one by 45° (N, NE, E, SE, S, SW, W, NW). The **maximum** response is the edge strength, its mask the direction.

- **Robinson**: N = [1 2 1; 0 0 0; −1 −2 −1], NE = [0 1 2; −1 0 1; −2 −1 0], … (opposite masks are negatives, so 4 convolutions suffice).
- **Kirsch**: N = [5 5 5; −3 0 −3; −3 −3 −3], NE = [−3 5 5; −3 0 5; −3 −3 −3], …

## Laplace and LoG (Marr–Hildreth)

∇²f = ∂²f/∂x² + ∂²f/∂y², mask [0 1 0; 1 −4 1; 0 1 0]. Where the gradient is maximal the second derivative changes sign → the **zero crossings** are the edges ({+,−}, {+,0,−}, {−,+}, {−,0,+}). Only the position is found, not the direction; isotropic; very noise-sensitive → smooth first.

**LoG** – Laplacian of Gaussian: ∇²(f ∗ g) = (∇²g) ∗ f, ∇²g ∝ (r² − 2σ²)/σ⁴ · exp(−r²/2σ²), the "Mexican hat". Stable zero crossings even at blurred edges; larger σ → fewer, coarser edges.

## Canny edge detector

Assumes step edges with Gaussian noise; goals: detect every real edge and no false one, localise precisely, respond once per edge.

1. **Gaussian smoothing** J = I ∗ G.
2. **Gradient**: E_s = √(Jx² + Jy²) (strength), E_o = arctan(Jy/Jx) (normal).
3. **Non-maximum suppression**: quantise E_o to 0°, 45°, 90°, 135°; if E_s is smaller than one of its two neighbours in that direction → 0. Edges become one pixel wide.
4. **Hysteresis thresholding** with l < h: ≥ h → edge; < l → not an edge; in between → edge only if connected to an edge pixel.

Careful with the neighbours when y points **down**: 45° compares the **lower-right and upper-left** neighbours, 135° the lower-left and upper-right.

```grid
# I_N after NMS; l = 40, h = 100: the chain 120–60–70–50–110–55–90 survives, 45 and 80 do not
0 0 120* 0 0 0
0 60* 0 0 45 0
0 70* 0 0 0 30
0 0 50* 110* 0 0
80 0 0 0 55* 90*
```

```js
const img = lib.correlate(IMG.noisy, lib.gaussKernel(5, 1.2), 'replicate');
const g = lib.sobel(img, 'replicate');
const thin = lib.nonMaxSuppression(g.mag, g.dir);
show(thin, 'after NMS');
show(lib.hysteresis(thin, 60, 160), 'hysteresis 60 / 160');
```

## SUSAN

A non-differential edge/corner detector (Smith & Brady). Around every pixel (the **nucleus**) count the pixels of the mask whose intensity is similar to it:

C(r, r₀) = 1 if |I(r) − I(r₀)| ≤ t, else 0;  n(r₀) = Σ C(r, r₀) (the **USAN** area)

Edge response R(r₀) = g − n(r₀) if n(r₀) < g, else 0, with the geometric threshold g = ¾ n_max (corners: smaller g). The *smallest* USAN marks the edge. A smooth variant: C = exp(−((I(r) − I(r₀))/t)⁶).

## Edges at expected positions

When we know roughly where and in which orientation the edge is (e.g. inspection), we search **across a run** perpendicular to the expected edge:

1. **Project onto the run**: sum the intensities **along the expected edge** (for a vertical edge: column sums; equal column heights → no division).
2. **Edge-strength array** along the run with a difference filter (e.g. [−1 0 1]; a larger mask smooths).
3. **Edge positions**: local maxima of |e| above a minimal threshold.
4. **Condition checks**: minimal strength, expected position, expected distance of an edge pair, polarity (dark → bright or bright → dark), possibly a weighted evaluation function.

For a **45° edge** sum along the anti-diagonals x + y = k. Use a band in which every anti-diagonal has the **same number of cells**, so the sums stay comparable:

```grid
# band 4 ≤ x+y ≤ 12, −2 ≤ x−y ≤ 3: 3 cells on every anti-diagonal; edge at x + y = 8
28 30 32* 29* 31 38 80
31 28* 30* 32* 39* 81 113
29* 31* 28* 40* 82* 114* 121
32 29* 41* 78* 115* 122* 119*
30 42 79* 116* 118* 120* 122*
38 80 117 119* 121* 118* 120
81 113 120 122 119* 121 118
```

S(k) = [89 90 89 120 239 345 359 360 359] (k = 4 … 12), e(k) = S(k+1) − S(k−1) = [0 30 150 225 120 15 0] → the edge is at **x + y = 8**.
