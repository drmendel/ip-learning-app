# Intensity transformations

Lecture 4 groups image operations by **what an output pixel depends on**:

| Class | Output pixel depends on | Examples |
| --- | --- | --- |
| **Point operations** | the same pixel of the input | negative, threshold, stretching, gamma, histogram equalisation |
| **Whole-image operations** | the same pixel of two or more images | averaging, difference, AND/OR |
| **Geometric transformations** | a pixel at another position | translation, scaling, rotation, affine |
| Mask (window) operations | a neighbourhood | filters – next modules |

Operations in the frequency domain (Fourier transform) form a separate group.

## Point operations: s = T(r)

r is the input intensity, s the output intensity, L the number of levels. Every pixel is processed independently, so point operations are trivially **data-parallel** and can be stored as a look-up table of L entries.

- **Identity**: s = r.
- **Negative**: s = (L − 1) − r – brings out grey or white details on a dark background.
- **Thresholding**: s = 0 if r < T, otherwise s = L − 1. Double thresholding keeps a band [T₁, T₂].
- **Intensity-level slicing**: highlight a range [a, b] (set it to L − 1), and either keep the rest or set it to 0.
- **Contrast stretching**: darken below m, brighten above m; slope > 1 increases contrast.
- **Grey-level reduction**: drop the least significant bits, e.g. r AND 224 keeps 3 bits.
- **Log**: s = c · log(1 + r) – expands dark values, compresses bright ones (e.g. Fourier spectra); the result usually has to be normalised.
- **Power law (gamma)**: s = c · rᵞ – γ < 1 brightens (like log), γ > 1 darkens; **gamma correction** matches different displays.

```grid
# r (L = 16)
0 3 7
12 5 9
15 10 4
```

Negative: 15 − r → 15 12 8 / 3 10 6 / 0 5 11. Threshold T = 8 → 0 0 0 / 15 0 15 / 15 15 0.

### Bit planes

An 8-bit value has 8 bit planes. **Plane 7** (most significant) is simply r ≥ 128 – a threshold; the high planes carry most of the visual information. **Plane 0** looks like noise, which is why low bits can hide foreign data (**steganography**).

## Error diffusion (Floyd–Steinberg, 1975)

How do we show an 8-bit image on a device with only black and white (a printer – "dithering", "halftone")? Quantise each pixel and **push the rounding error to the unprocessed neighbours**:

1. scan top → bottom, left → right;
2. new = 0 if the current value is in [0, 127], otherwise 1 (represented by **255**);
3. error = old − new (e.g. 168 → 1, error 168 − 255 = −87);
4. distribute: 7/16 → right, 3/16 → bottom-left, 5/16 → bottom, 1/16 → bottom-right.

The local average brightness is preserved. The algorithm is sequential, but it can be parallelised: a pixel needs the errors of 3 pixels of the previous row and 1 of its own row, so rows can run in parallel threads with a **two-pixel delay**.

## Histogram operations

The histogram tells about contrast: dark and bright images are crowded at one end, low-contrast images use a narrow band, good-contrast images use a wide range without a dominant level.

**Histogram stretching** maps the image's [min, max] linearly onto [0, L − 1]:

s = (L − 1)(r − min) / (max − min)

**Contrast stretching** does the same with a chosen window [low, high] instead of [min, max]; values outside are clipped to 0 or L − 1.

**Histogram equalisation** aims at a (nearly) uniform histogram. The mapping is the scaled cumulative histogram:

s = T(r) = (L − 1) · Σ_{j=0}^{r} p(j), rounded (in this course: **half up**)

| r | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| h(r) | 2 | 6 | 10 | 8 | 4 | 2 | 0 | 0 |
| cumulative | 2 | 8 | 18 | 26 | 30 | 32 | 32 | 32 |
| 7 · cdf | 0.44 | 1.75 | 3.94 | 5.69 | 6.56 | 7 | 7 | 7 |
| T(r) | 0 | 2 | 4 | 6 | 7 | 7 | 7 | 7 |

Stretching is linear and keeps the shape of the histogram; equalisation is non-linear – frequent levels are pulled apart, rare ones merged. In the discrete case the result is only approximately flat: levels can be merged but never split.

```js
const img = IMG.lowcontrast;
const st = lib.stretch(img);                 // min–max → 0…255
const eq = lib.histEq(img).out;              // equalisation
print('range before:', Math.min(...img.flat()), Math.max(...img.flat()));
show(img, 'original'); show(st, 'stretched'); show(eq, 'equalised');
```

## Whole-image operations

The output pixel stays in place; it combines the same position of several images:

- **weighted addition**: O = a · I₁ + (1 − a) · I₂ (blending);
- **averaging** n noisy images of a static scene: with zero-mean additive noise the noise averages out (its standard deviation drops by √n);
- **difference** for change detection: O = |I₁ − I₂|, followed by a **threshold** (and often a mask of the region of interest);
- **AND / OR**: AND masks out a part of an image, OR adds a part of another image.

## Geometric transformations

They change the row r and column c of the pixels:

- translation: r′ = r + t_r, c′ = c + t_c
- scaling: r′ = s_r · r, c′ = s_c · c
- rotation by β about (r₀, c₀): r′ = r₀ + (r − r₀)cos β − (c − c₀)sin β, c′ = c₀ + (r − r₀)sin β + (c − c₀)cos β
- affine: r′ = a₁₁r + a₁₂c + b₁, c′ = a₂₁r + a₂₂c + b₂

Three problems appear: (1) results may fall **outside** the image, (2) input and output pixels do **not correspond one-to-one** – forward mapping leaves **holes** and creates overlaps, (3) the coordinates are **not integers**.

**Backward mapping** solves (2): loop over the **output** pixels, compute the source with the **inverse** transformation, read the value there. For rotation:

r = r₀ + Δr′ cos β + Δc′ sin β,  c = c₀ − Δr′ sin β + Δc′ cos β

Problem (3) is handled by **interpolation**: nearest neighbour (0th order), bilinear (weighted average of the 4 surrounding pixels), bicubic, spline.

```grid
# f(r, c) – source of output (3, 3) for β = 30° about (2, 2) is (3.37, 2.37)
10 20 30 40 50
20 60 90 70 40
30 80* 150* 120 60
40 70* 200* 180 90
50 60 100 110 80
```

Nearest neighbour gives f(3, 2) = 80; bilinear interpolation of the four highlighted pixels gives ≈ 110.

```js
const img = IMG.shapes;
show(lib.rotateImage(img, 30, 'nearest'), 'nearest, backward');
show(lib.rotateImage(img, 30, 'bilinear'), 'bilinear, backward');
```
