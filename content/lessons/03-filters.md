# Filtering & convolution

Point operations (lecture 4) look at one pixel. **Neighbourhood (mask/window) operations** compute every output pixel from the pixel **and its neighbours**: g(x, y) = T[f(x, y)], where T works on a small window around (x, y). The output has the same size as the input and is written into a **new** image – never back into the one you are reading.

## Masks

A **mask** (kernel) is a small matrix of weights with an **origin** – for odd sizes n×n (n = 3, 5, 7 …) the centre. Lay the origin on the pixel, multiply the pixels under the mask by the weights, sum, and maybe scale:

g(x, y) = Σₖ Σₗ w(k, l) · f(x + l, y + k)

If the output is a **linear combination** of the inputs, the filter is **linear** and **shift-invariant**; it is (somewhat loosely) called a *convolution mask*. Non-linear filters (median, min, max) cannot be written as masks.

## Convolution vs correlation

| | formula | mask |
| --- | --- | --- |
| **Correlation** | g(i, j) = Σ w(k, l) · f(i + k, j + l) | used as printed |
| **Convolution** | y(i, j) = Σ h(k, l) · x(i − k, j − l) | **rotated by 180°** (mirrored) |

For a **point-symmetric** mask (box, Gauss, binomial, Laplace) the two are equal. Convolution is commutative and associative (f ∗ g = g ∗ f), which is why separable filters work.

1-D example, f = [2 0 1 3], g = [1 2 −1], "full" output of length 4 + 3 − 1:

- convolution: mirror g → [−1 2 1] and slide: **[2 4 −1 5 5 −3]**
- correlation: slide g itself: **[−2 4 1 −1 7 3]**

```js
print('conv', lib.convolve1D([2, 0, 1, 3], [1, 2, -1]));
print('corr', lib.correlate1D([2, 0, 1, 3], [1, 2, -1]));
const w = [[1, 2, 0], [0, 1, 0], [0, 0, -1]];   // non-symmetric
const f = [[3, 5, 1], [0, 2, 4], [1, 7, 9]];
print('correlation', lib.correlate(f, w, 'valid'), 'convolution', lib.convolve(f, w, 'valid'));
```

## Mask weights and borders

- **Sum = 1** (smoothing, sharpening): the mean brightness is kept, flat regions are unchanged. That is why low-pass masks carry a factor 1/Σw (1/9, 1/16, 1/256).
- **Sum = 0** (derivatives, Laplace): flat regions → 0, negative results are possible → normalise linearly or take |·| before display.
- **Borders**: the mask sticks out of the image. Either pad (zeros, replicated or mirrored pixels) or leave the border rows/columns out / unchanged. Always say which one you use – the ZH usually computes only the inner pixels.

## Smoothing (low-pass) filters

**Box (averaging) filter** – (1/9)·[1 1 1; 1 1 1; 1 1 1]. Larger masks smooth more, but the sharp cut at the mask edge causes **ringing** and edges are blurred.

```grid
# 3×3 box on the highlighted window: (12+15+14+10+13+16+11+90+15)/9 = 196/9 ≈ 22
12* 15* 14* 60 62
10* 13* 16* 64 61
11* 90* 15* 63 65
13 12 14 66 60
```

**Gaussian filter** – w(x, y) ∝ exp(−(x² + y²) / (2σ²)). Weighted average, isotropic, no ringing (small weights at the border). σ sets the amount of smoothing; the mask must grow with σ: **height = width ≈ 5σ** (covers 98.76 % of the area). σ = 1 → 3×3 mask [0.075 0.124 0.075; 0.124 0.204 0.124; 0.075 0.124 0.075].

**Binomial filter** – the integer approximation of the Gaussian. Rows of Pascal's triangle, or repeated convolution with [1 1]:

[1 1] ∗ [1 1] = [1 2 1],  [1 2 1] ∗ [1 1] = [1 3 3 1],  … n = 5: [1 4 6 4 1]

2-D mask = outer product of the row with itself, divided by 2^(2p) (p = n − 1): 1/16 for 3×3, **1/256 for 5×5**.

### Separability

Box, Gauss and binomial masks are **separable**: h(x, y) = h_x(x) · h_y(y), so the 2-D filter is a row pass followed by a column pass.

| n×n mask | multiplications | additions |
| --- | --- | --- |
| direct 2-D | n² | n² − 1 |
| two 1-D passes | 2n | 2(n − 1) |

For n = 5: 25 + 24 versus 10 + 8 operations per pixel. The box filter can even be computed recursively with ~4 operations per pixel.

## Median filter (non-linear)

Replace the pixel by the **median** of its window (sort, take the middle: the 5th of 9 values). It is a **rank-order** filter:

- median{f₁ + f₂} ≠ median{f₁} + median{f₂}, but median{c·f} = c·median{f} and median{c + f} = c + median{f};
- very effective against **impulse (salt-and-pepper) noise**, keeps step edges;
- not effective for large or Gaussian noise; deletes points, 1-pixel lines and corners;
- slower (sorting): bubble sort up to the 5th element = 8 + 7 + 6 + 5 + 4 = 30 steps per pixel.

```grid
# 255 in the middle of the window: 20 21 21 22 22 22 23 24 255 → median 22
20* 22* 21* 23 25
21* 255* 22* 0 24
22* 23* 24* 22 255
```

```js
const noisy = IMG.saltpepper;
show(noisy, 'salt & pepper');
show(lib.correlate(noisy, lib.boxKernel(3), 'keep'), '3×3 box');
show(lib.median(noisy, 3), '3×3 median');
```

## Sharpening (high-pass) filters

Sharpening emphasises fine detail using local **differences**: the weights are positive and negative, the response is ≈ 0 over flat areas and large at abrupt changes.

- First derivative (gradient): ∂f/∂x ≈ f(x+1, y) − f(x, y). First differences give thicker edges.
- Second derivative – **Laplace**: ∇²f = f(x+1, y) + f(x−1, y) + f(x, y+1) + f(x, y−1) − 4f(x, y). Isotropic; strong response to thin lines and points, double response (+/−) at a step.

**Laplace sharpening** adds the detail back to the original: g = f − ∇²f (centre of the Laplace mask negative), i.e. the mask

[0 −1 0; −1 5 −1; 0 −1 0]  → g(x, y) = 5f(x, y) − (sum of the 4 neighbours)

Results may leave 0…255 → clip (or normalise).

**Unsharp masking and high-boost**

- g_s = f − f̄ (original − blurred) – the detail;
- g_hb = A·f − f̄ = (A − 1)·f + g_s, A ≥ 1 – high-boost keeps part of the original (A = 1 is plain unsharp masking).

Example f = [20 20 20 50 50 50], f̄ (3-mean, positions 2…5) = [20 30 40 50]: g_s = [0 −10 10 0], g_hb (A = 1.5) = [10 0 35 25].

```js
const f = IMG.shapes;
const blur = lib.correlate(f, lib.gaussKernel(5, 1.2), 'replicate');
const A = 1.5;
show(lib.map(f, (v, y, x) => lib.clamp(A * v - blur[y][x])), 'high-boost A = 1.5');
show(lib.map(lib.correlate(f, lib.K.laplaceSharpen, 'replicate'), (v) => lib.clamp(v)), 'Laplace sharpening');
```

## Checklist for the ZH

1. Convolution → rotate the mask by 180° first; correlation → as printed.
2. State the border handling; compute only the pixels asked for.
3. Low-pass: divide by the sum of the weights. Round only at the end.
4. Median: sort all 9 values, take the 5th; the border stays.
