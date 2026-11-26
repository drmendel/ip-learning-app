# Image pyramids

## Why several resolutions?

Small or low-contrast objects need a **fine** resolution; large or high-contrast objects are visible at a **coarse** one. If both occur in the same image, it pays to look at it at several resolutions. An **image pyramid** (resolution hierarchy) stores the image at a series of decreasing resolutions – a compact representation that makes many algorithms faster:

- **coarse-to-fine search**: find similar parts (template matching) at a coarse level, then refine at higher resolution,
- edge tracking, motion analysis (large motions become small at coarse levels),
- finding stripes / textures of a given size,
- compression (Laplacian pyramid), image blending.

## Sub-sampling and aliasing

The obvious way to halve an image is to drop every second row and column (**sub-sampling**). Enlarged again, the result looks strange: thin lines break up or vanish, stripes turn into false patterns (moiré). This is **aliasing** – high-frequency details (edges) cannot be represented at the lower sampling rate.

```grid
# g₀: the finest possible detail
0 100 0 100 0 100 0 100
```

Sub-sampled: 0 0 0 0 – the bright samples are gone. Smoothed first ([¼ ½ ¼]) and then sub-sampled: 25 50 50 50 – the correct average.

**Solution:** low-pass filter (average or Gaussian, σ ≈ 1–1.4 pixels) **before** sub-sampling.

## Levels

Every level has half the width and height, i.e. **¼ of the pixels** of the level below. A 2^J × 2^J image gives J + 1 levels: 2^J × 2^J, …, 2 × 2, 1 × 1. The whole pyramid has

1 + ¼ + 1/16 + … < 4/3

times as many pixels as the original – only one third extra memory.

> **Numbering:** here (and in `lib.pyramids`) **g₀ is the original, largest image** and g₁, g₂, … get smaller. The lecture numbers the other way: its level 0 is 1 × 1, level J is the original, and in the Laplacian formulas its g₁ is the **smallest** image (so it writes L₁ = g₁). Always say which end you count from.

## The REDUCE function

g_l = REDUCE(g_{l−1}):  g_l(i) = Σ_{m=−2..2} w(m) · g_{l−1}(2i + m)

e.g. g_l(2) = w(−2)g_{l−1}(2) + w(−1)g_{l−1}(3) + w(0)g_{l−1}(4) + w(1)g_{l−1}(5) + w(2)g_{l−1}(6).

The generating kernel is symmetric: **w = [c, b, a, b, c]** with

- sum 1: a + 2b + 2c = 1,
- equal contribution (every node gives the same total weight to the next level): a + 2c = 2b,

so **b = 1/4, c = 1/4 − a/2**:

| a | kernel | name |
| --- | --- | --- |
| 0.4 | [0.05 0.25 0.4 0.25 0.05] | Gaussian-like |
| 0.5 | [0 ¼ ½ ¼ 0] | triangle |
| 3/8 | [1 4 6 4 1] / 16 | easy to compute (binomial) |

In the tasks the samples outside the signal are the **nearest border sample (replicate)**. The Gaussian is separable, so in 2-D apply the 1-D kernel to every row, then to every column.

```grid
# g₀ (a = 3/8) → g₁ = [9 25 44 25]
8 8 24 40 56 40 24 8
```

g₁(1) = (1·8 + 4·8 + 6·24 + 4·40 + 1·56)/16 = 400/16 = 25.

## EXPAND

The reverse: up-sample by 2 and interpolate with the same kernel:

EXPAND(g)(i) = 2 · Σ_m w(m) · g((i − m)/2)  (only where (i − m)/2 is an integer)

With a = 0.5 this is linear interpolation: even samples copy g, odd samples are the average of their two neighbours.

## Laplacian pyramid

Each level stores what the coarser level cannot represent (a residual or "difference" image):

L_k = g_k − EXPAND(g_{k+1}),  and on the top level L_N = g_N

Most pixels of L_k are near 0 (like an edge-filtered, band-pass image, orientation independent) → it compresses well. **The top level of the Gaussian and the Laplacian pyramid is the same**, since there is no coarser level to subtract – and it is needed to reconstruct the image.

**Reconstruction** from the top down: g_k = L_k + EXPAND(g_{k+1}) – exact, whatever the kernel.

Each iteration of building the pyramid: (1) filter and down-sample → approximation, (2) up-sample and interpolate → prediction at the input resolution, (3) input − prediction = residual.

## Blending (apple + orange)

1. Build the Laplacian pyramids L_A and L_B of the two images.
2. On every level copy the left half from L_A and the right half from L_B (or use a mask pyramid for any shape).
3. Reconstruct the combined pyramid. The seam is blended over a wide band at coarse levels and a narrow band at fine levels – no visible edge.

## Try it

```js
const { gauss, laplace } = lib.pyramids(IMG.shapes, 4, 0.4);
gauss.forEach((g, i) => show(g, `g${i}: ${g.length}×${g[0].length}`));
const top = laplace.length - 1;   // the top Laplacian level is the top Gaussian level
laplace.forEach((l, i) => show(i === top ? l : l.map(r => r.map(v => 128 + v)), i === top ? `L${i} = g${i}` : `L${i} (+128)`));
```

```js
// 1-D REDUCE and EXPAND by hand
const g0 = [10, 20, 40, 40, 30, 10, 10, 20];
const g1 = lib.reduce1D(g0, 0.5);
const e = lib.expand1D(g1, 8, 0.5);
print('g1 =', g1);
print('EXPAND(g1) =', e);
print('L0 =', g0.map((v, i) => v - e[i]));
```
