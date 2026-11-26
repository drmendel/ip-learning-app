# Thresholding & segmentation

Segmentation splits the image into meaningful parts. The simplest tool is **thresholding**, a point operation on the histogram; the region-based methods (labelling, region growing, split and merge) also use the neighbourhood.

## Histogram recap

- **h(r_k) = n_k** – number of pixels with grey level r_k, k = 0 … L−1.
- **Normalised histogram** p(r_k) = n_k / n – the probability of level r_k; Σ p = 1.
- Homogeneous regions give **strong peaks**; objects can be separated at the **valleys**. Real histograms are noisy → smooth them first (1-D mean or Gauss filter).

## Thresholding

Assumptions: object and background have **different, homogeneous** intensities (high contrast); the means of the two classes should differ as much as possible.

Dark object on a bright background (lecture convention):

- f(x, y) ≤ T → t(x, y) = 1 (object)
- f(x, y) > T → t(x, y) = 0 (background)

| Type | Threshold depends on | Example |
| --- | --- | --- |
| Global | T = T{I(x, y)} | fixed T, Otsu, ISODATA |
| Local | T = T{A(x, y), I(x, y)} | A = local property (mean, σ) |
| Dynamic | T = T{x, y, A(x, y), I(x, y)} | window mean − C, Niblack |

**Multi-level:** f < T₁ → 255, T₁ ≤ f < T₂ → 128, otherwise 0 – easy if the histogram has strong peaks with deep valleys.

**p-tile:** if the object is known to cover p % of the image, choose the smallest T for which the cumulative histogram reaches p·N.

**Hysteresis** (no clean valley): two thresholds at the two sides of the valley. Above T_high → object, below T_low → background, in between → object only if connected to an object pixel.

```grid image
# T_low = 100, T_high = 180: the 110 in the corner is isolated
20 120 130 30 20
40 190* 110 20 140
30 150 60 20 150
20 40 130 40 160
110 20 30 200* 30
```

## ISODATA (optional this year)

1. T₀ = midpoint (e.g. 128, or (min + max)/2).
2. μ_low = mean of the values ≤ T, μ_high = mean of the values > T.
3. T_{k+1} = (μ_low + μ_high)/2; stop when T_{k+1} = T_k.

Works well when object and background have about the same number of pixels.

## Otsu

Choose T that **maximises the between-class variance** (equivalently minimises the within-class variance – their sum, the total variance, does not depend on T). With p_i = n_i / N:

- q_B(T) = Σ_{i≤T} p_i,  q_O(T) = 1 − q_B(T)
- μ(T) = Σ_{i≤T} i·p_i,  μ = Σ_i i·p_i (global mean)
- μ_B = μ(T)/q_B,  μ_O = (μ − μ(T))/q_O
- **σ_B²(T) = q_B·(μ_B − μ)² + q_O·(μ_O − μ)² = (μ·q_B(T) − μ(T))² / (q_B(T)·q_O(T))**

Hand calculation: run T from the start of the histogram; keep the cumulative sums q_B and μ(T); the best T is where σ_B² is maximal. Assumes a **bimodal** histogram; fails with very different class sizes or uneven illumination.

| T | q_B | μ(T) | σ_B² |
| --- | --- | --- | --- |
| 2 | 0.6 | 0.65 | 4.420 |
| 3 | 0.65 | 0.8 | **4.573** |
| 4 | 0.675 | 0.9 | 4.468 |

(histogram 6, 10, 8, 2, 1, 4, 7, 2 → μ = 2.8, Otsu T = 3)

## Local / dynamic thresholds (Niblack: optional)

- **Mean − C:** T(x, y) = mean of the k×k window − C.
- **Niblack:** T(x, y) = μ(x, y) + k·σ(x, y); k < 0 for dark objects, k > 0 for bright ones, |k| ≈ 0.2 … 0.5; window ≈ 15×15 – small enough for details, large enough against noise.
- Post-processing removes "ghost" objects whose mean edge gradient is low.
- Uneven illumination can also be modelled by a simple surface (e.g. a tilted plane) and thresholding above/below it.

```js
const T = lib.otsu(lib.histogram(IMG.noisy)).T;
show(IMG.noisy, 'input');
show(lib.threshold(IMG.noisy, T + 1, 255, 0), 'Otsu, T = ' + T);
const nb = lib.niblack(IMG.noisy, 15, 0.2);
show(IMG.noisy.map((r, y) => r.map((v, x) => (v > nb[y][x] ? 255 : 0))), 'Niblack 15×15');
```

## Region segmentation

Find connected regions R₁ … Rₙ with **∪ Rᵢ = I**, **Rᵢ ∩ Rⱼ = ∅** and a similarity predicate **P(Rᵢ) = 1** (same intensity, max − min ≤ threshold, small variance, …). Good result: homogeneous regions without holes, clearly different neighbours, simple and accurate boundaries.

Methods: thresholding, edge-based, region-based, matching-based.

### Connected-component labelling

- **Recursive:** scan the image; at an unlabelled 1 start a new label and recursively give it to all connected 1-neighbours.
- **Sequential (two-pass):** pass 1 gives provisional labels from the already visited neighbours (left, top-left, top, top-right for 8-neighbourhood) and records **equivalences** where two labels meet; pass 2 replaces every label by its class representative.
- **4- vs 8-neighbourhood** gives different counts: diagonal contacts connect only with 8.

```grid image
# 4-neighbourhood: 7 components, 8-neighbourhood: 5
1 1 0 0 1 0 1
0 1 0 1 1 0 1
0 0 1* 0 0 0 1
1 0 0 0 1 1 1
1 1 0 0 0 0 0
0 0 0 1 0 1 0
```

### Region growing, split and merge, phagocyte

- **Seed segmentation:** smooth the histogram, find good peaks (peakiness test) and valleys, threshold, then label the connected components.
- **Region growing:** from a seed add the neighbours that satisfy the predicate (e.g. |f − f(seed)| ≤ tol). Always connected.
- **Split and merge:** split non-uniform regions into 4 (quadtree: grey/black/white nodes), merge similar neighbours, stop when neither is possible. A **region adjacency graph** keeps track of the neighbours.
- **Phagocyte:** remove **weak boundaries**. A crack-edge point is weak if |I(x_R1) − I(x_R2)| < T; merge if W / min(P₁, P₂) ≥ T₂ or W / |boundary| ≥ T₃.
- **Likelihood-ratio test:** H₁ one region vs H₂ two regions with Gaussian intensities; merge if the ratio is below a threshold.

```js
const lab = lib.labelComponents(lib.threshold(IMG.shapes, 128), 8);
print('objects:', lab.count);
show(lab.labels.map((r) => r.map((v) => v * 50)), 'labels');
show(lib.regionGrow(IMG.noisy, [20, 20], 40).map((r) => r.map((v) => v * 255)), 'region from (20, 20)');
```

## Region vs edge based

| | Edge detection | Region segmentation |
| --- | --- | --- |
| Boundary | usually not closed | closed |
| Operation | local | global |
| More features (motion, texture) | little help | helps a lot |
| Boundary position | precise | not precise |

Edge-based segmentation: smoothing → edge enhancement → edge correction (hysteresis, non-max suppression, **edge relaxation**, **edge linking** by similar gradient magnitude and direction) → grouping.
