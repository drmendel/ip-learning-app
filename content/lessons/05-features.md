# Corners, feature points & template matching

## Why local features?

To stitch a panorama, track an object, match a stereo pair or recognise a building, we need points that can be **found again** in another image. Good feature points are

- **distinctive** – a small neighbourhood identifies them unambiguously,
- **repeatable / robust** – they survive translation, rotation, scaling, brightness change and noise,
- **numerous and cheap** – hundreds per image, computable in real time.

Applications: image alignment (mosaics), 3-D reconstruction, motion tracking, stereo matching, object recognition, content-based image retrieval (CBIR), robot navigation.

## Flat, edge, corner: shift a window

Put a small window W on the image and shift it by (u, v):

| Region | What happens when W is shifted |
| --- | --- |
| **flat** | no change in any direction |
| **edge** | no change **along** the edge, big change across it |
| **corner** | significant change in **every** direction |

The change is measured by the **SSD error** (sum of squared differences):

E(u, v) = Σ_(x,y)∈W ( I(x + u, y + v) − I(x, y) )²

For a small shift, Taylor expansion gives I(x + u, y + v) ≈ I(x, y) + Ix·u + Iy·v, so

E(u, v) ≈ Σ_W (Ix·u + Iy·v)² = [u v] · H · [u v]ᵀ,   H = Σ_W [ Ix²  IxIy ; IxIy  Iy² ] = [A B; B C]

H (structure tensor, "gradient moment matrix") is symmetric and positive semi-definite. Its eigenvectors give the directions of the largest and smallest change of E, its eigenvalues the amount:

λ± = (A + C)/2 ± √( ((A − C)/2)² + B² )

| λ+ | λ− | Region |
| --- | --- | --- |
| small | small | flat |
| large | ≈ 0 | edge |
| large | large | **corner** |

## Computing it by hand

In this course the derivatives are central differences **without** dividing by 2: Ix(x, y) = f(x+1, y) − f(x−1, y), Iy(x, y) = f(x, y+1) − f(x, y−1) (y grows downwards). Then A, B, C are summed over the (2n+1)×(2n+1) window (sometimes averaged – divide by the number of pixels; the eigenvalues scale the same way).

```grid
# f: the 3×3 window of a corner is marked
0 0 0 0 0
0 0* 0* 0* 0
0 0* 4* 4* 4
0 0* 4* 4* 4
0 0 4 4 4
```

At the centre (3, 3): Ix = [0 0 0; 4 4 0; 4 4 0], Iy = [0 4 4; 0 4 4; 0 0 0] → A = 64, C = 64, B = 16 → λ+ = 80, λ− = 48: a corner.

## Two corner measures – and a naming quirk

1. **Smaller eigenvalue:** R = min(λ+, λ−) = λ− > Th. The threshold may come from the histogram of R (first valley). Then take the largest values first and delete the other candidates near an accepted corner (non-maximum suppression).
2. **det − k·trace²:** R = det H − k·(trace H)² = AC − B² − k(A + C)², with 0 ≤ k ≤ 0.25 (typically 0.04–0.06). No square root is needed. R > 0 large: corner, R < 0: edge, |R| small: flat. Increasing k makes the detector **less sensitive**.

> **Watch out:** lecture 6 calls method 1 the *Harris corner detector* and method 2 *Kanade–Lucas–Tomasi*. The literature (and most software) does the opposite: **Harris–Stephens** = det − k·trace², **Shi–Tomasi / KLT** = min eigenvalue. Lecture 7 calls f = det H / trace H = λ₁λ₂/(λ₁ + λ₂) the *Harris operator*. In the ZH, write the formula next to the name.

Steps of the detector: gradient at every pixel → H from the gradients (summed/smoothed over the window) → response (λ− or R) → threshold → local maxima.

## Moravec operator

The ancestor of all this: shift the window by one pixel in **4 directions** (horizontal, vertical, two diagonals), compute the SSD for each, and take the **minimum** V = min(Vh, Vv, Vd, Va). A pixel is interesting if V is a local maximum in its neighbourhood. On an edge, the shift along the edge gives V ≈ 0. Weaknesses: only 4 directions (anisotropic), noisy, binary window.

## Template matching

Compare a template t with every image part of the same size (slide it, the position = top-left corner or centre):

| Measure | Formula | Best |
| --- | --- | --- |
| SSD | Σ (I₁ − I₂)² | min |
| SAD | Σ abs(I₁ − I₂) | min |
| CC | Σ I₁·I₂ | max |
| NCC | Σ (I₁ − Ī₁)(I₂ − Ī₂) / √(Σ(I₁ − Ī₁)² Σ(I₂ − Ī₂)²) | max (≤ 1) |

SSD = Σ I₁² − 2 Σ I₁I₂ + Σ I₂²: the middle term is the cross-correlation. Plain CC is fooled by bright regions; **NCC** removes mean and contrast, so it is invariant to brightness offset and gain. SSD/SAD are also used for **block matching** in motion estimation and **stereo** correspondence.

```grid
# I – template t = [6 4; 9 8] matches best at top-left (3, 2)
3 1 4 1 5
9 2 6* 5* 3
5 8 9* 7* 9
3 2 3 8 4
```

## Try it

```js
const img = IMG.shapes;
const r = lib.cornerResponse(img, { k: 0.04, avg: true });
// keep strong responses only
const max = Math.max(...r.harris.flat().filter(v => !Number.isNaN(v)));
const R = r.harris.map(row => row.map(v => (v > 0.1 * max ? 255 : 0)));
show(img, 'image');
show(R, 'R > 10 % of its maximum');
```

```js
// template matching: cut a patch and find it again
const img = IMG.shapes;
const t = lib.sub(img, 10, 40, 10, 10);   // rows 10…19, columns 40…49
const m = lib.matchTemplate(img, t);
print('best SSD at [row, col] =', lib.argmin2(m.ssd));
print('best NCC at [row, col] =', lib.argmax2(m.ncc));
```
