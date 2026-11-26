# Digital images & data structures

Lectures 2 and 3 set the vocabulary of the whole course: what a digital image is, where image processing sits among its neighbouring fields, and the two simple data structures that keep coming back – the **histogram** and the **integral image**.

## What is a digital image?

An image is a 2-D function **f(x, y)**: x and y are spatial coordinates, f is the intensity (grey level) at that point. The image is **digital** when x, y **and** f are all discrete. Two steps make it so:

| Step | What becomes discrete | Result |
| --- | --- | --- |
| **Sampling** (mintavételezés) | the coordinates x, y – the image is measured only at grid points | resolution, e.g. 1024 × 1024 pixels |
| **Quantisation** (kvantálás) | the amplitude f – rounded to one of L levels | grey levels, e.g. L = 256 for 8 bits |

With k bits per pixel there are **L = 2ᵏ** levels, numbered 0 … L − 1. Dropping low bits is a coarser quantisation: 203 = 1100 1011₂ → 4 bits keep 1100₂ = 12, which stands for 12 · 16 = 192.

A pixel (picture element) is one cell of this 2-D array. In this course **x = column** (to the right) and **y = row** (downwards); ZH tables count from 1, code counts from 0 (`img[y][x]`).

## Neighbouring fields

Lecture 2 sorts the fields by what goes in and what comes out:

| Input ↓ / Output → | Image | Description |
| --- | --- | --- |
| **Image** | image processing (DIP) | computer vision (CV) |
| **Description** | computer graphics (CG) | artificial intelligence |

- **Digital image processing**: enhancement, restoration, compression – the result is usually another image (and some features).
- **Computer vision**: emulating human vision – learning, inference, reacting; extracting useful information about the 3-D world from one or more 2-D images.
- **Computer graphics**: producing images from models.

Image processing itself has **three levels**:

1. **Low level** – image in, image out: noise filtering, sharpening, contrast enhancement (data-driven pre-processing).
2. **Intermediate level** – image in, attributes out: **segmentation**, representation and description; some AI is needed.
3. **High level** – recognition and interpretation of the scene as a whole; AI methods are needed.

Why is computer vision hard? The 3-D → 2-D projection loses information (the inverse problem has no unique solution), lighting, materials and occlusion vary enormously, and the computation is heavy.

## How much computation?

A 1024 × 1024 image with 8-bit pixels needs 2²⁰ bytes = **1 MB**. One operation per pixel at 10⁻⁸ s/operation costs 2²⁰ · 10⁻⁸ s ≈ **10.5 ms**. Real-time processing means 25–30 frames per second, i.e. 33–40 ms per frame – and real algorithms do many operations per pixel. Colour (RGB) images triple the data: each pixel is a vector (R, G, B), each channel is an intensity image on its own.

## Histogram

The **histogram** counts how many pixels have each intensity: h(rₖ) = nₖ, k = 0 … L − 1.

```grid
# f(x, y), L = 8
0 2 2 3
1 2 3 3
2 3 5 6
2 2 3 7
```

| k | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| h(k) | 1 | 1 | 6 | 5 | 0 | 1 | 1 | 1 |
| H(k) | 1 | 2 | 8 | 13 | 13 | 14 | 15 | 16 |

- **Cumulative histogram** (halmozott): H(k) = number of pixels with value **≤ k** – a running sum, non-decreasing, ends at M·N.
- **Normalised histogram**: p(rₖ) = nₖ / (M·N). It sums to 1 and estimates the probability of each intensity; its cumulative version P(k) ends at 1.
- The mean intensity is μ = Σ rₖ · p(rₖ).

The histogram says nothing about **where** the pixels are – it only describes brightness and contrast. Computing it is one pass (`hist[p[y][x]]++`), and it parallelises well: split the image, build partial histograms, add them up.

```js
const img = IMG.lowcontrast;
const h = lib.histogram(img);              // 256 counts
const p = lib.normalizedHistogram(img);    // sums to 1
print('non-empty bins:', h.filter((v) => v > 0).length);
print('mean =', p.reduce((s, v, k) => s + k * v, 0).toFixed(2));
show(img, 'low-contrast image');
```

## Integral image

The **integral image** stores at every point the sum of all pixels above and to the left (inclusive):

ii(x, y) = Σ i(x′, y′) over x′ ≤ x, y′ ≤ y

It is built in **one pass** with two recurrences – s is the cumulative column sum:

- s(x, y) = s(x, y − 1) + i(x, y),  s(x, 0) = 0
- ii(x, y) = ii(x − 1, y) + s(x, y),  ii(0, y) = 0

```grid
# i(x, y)
1 2 0 3
2 1 4 1
0 3 2 2
1 0 1 4
```

```grid
# ii(x, y)
1 3 3 6
3 6 10 14
3 9 15 21
4 10 17 27*
```

The last value (27) is the sum of the whole image.

### Rectangle sums in constant time

Number the corners around rectangle D: 1 = outside top-left, 2 = top-right, 3 = bottom-left, 4 = bottom-right. Then

Σ D = ii(4) − ii(3) − ii(2) + ii(1)

– four look-ups, whatever the size of the rectangle. In 1-based table terms, the sum over x = x₁…x₂, y = y₁…y₂ is ii(x₂, y₂) − ii(x₂, y₁ − 1) − ii(x₁ − 1, y₂) + ii(x₁ − 1, y₁ − 1), where anything at index 0 is 0.

### Haar-like features

A Haar-like feature is Σ(pixels in the black area) − Σ(pixels in the white area). Adjacent rectangles share corners, so the look-up counts are:

| Rectangles | 1 | 2 | 3 | 4 (2 × 2) |
| --- | --- | --- | --- | --- |
| Look-ups | 4 | 6 | 8 | 9 |

These crude but cheap features are what make the **Viola–Jones** face detector real-time: it slides thousands of them over many sub-windows. Integral images also appear in SURF and in compression.

```js
const img = IMG.shapes;
const ii = lib.integralImage(img);
// sum of rows 10..29, columns 20..39 (0-based, inclusive) with 4 look-ups
print('rect sum =', lib.rectSum(ii, 10, 20, 29, 39));
print('total    =', ii[63][63]);
show(ii.map((r) => r.map((v) => (255 * v) / ii[63][63])), 'integral image (scaled)');
```

## Checklist for the ZH

- Define digital image, sampling, quantisation; L = 2ᵏ.
- Know the input/output table of DIP, CV, CG and the three processing levels.
- Compute h, H, p, P by hand and state what the normalised histogram means.
- Build s and ii, compute a rectangle sum with 4 look-ups and a Haar feature with 6.
