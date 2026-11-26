# Practice sheets (gyakorló)

This module contains **every task of the four practice sheets** published during the semester, with their original points. They are the closest thing to the ZH's practical part, so solve them **on paper first**, then type the results in to check them.

| Sheet | Topic | Tasks | Points |
| --- | --- | --- | --- |
| 1. *Gyakorló feladat az eddigi témakörökből* (topic 5) | histogram, equalisation, Sobel, median | 1a, 1b, 2a–c, 3 | 8 + 12 + 3 |
| 2. *Korábbi képfeldolgozás témákhoz gyakorló feladat* (topic 8) | Hough transform, feature point (H matrix) | 1, 2 | 10 + 12 |
| 3. *Objektum leírása és mozgatása transzformációk használatával* (topic 9) | descriptor matrix, transformation sequence | 1a, 1b | 10 |
| 4. *Gyakorló feladatok* (topic 11) | shape number, Isodata (optional), Hu invariants, signature | 1–4 | 6 + 6 + 12 + 8 |

## Conventions fixed here

The sheets leave some details open. To make the answers checkable, the tasks fix these. Say them explicitly in the ZH too:

- **Coordinates**: x = column (→), y = row (↓), 1-based, as in the ZH. The Hough task and the |i − j| task use 0-based indices, as on the sheet.
- **Sobel** (sheet 1/2): masks applied as correlation, fx = right − left, fy = bottom − top, zero outside the image. The "two distance notions" are the **Euclidean** √(fx² + fy²) and the **Manhattan** |fx| + |fy| norm.
- **Median** (sheet 1/3): border pixels are copied unchanged, as the sheet says.
- **Hough** (sheet 2/1): x·cosθ + y·sinθ = ρ with θ ∈ {0°, 45°, 90°, 135°}, ρ rounded to an integer.
- **H matrix** (sheet 2/2): the sheet's highlighting was lost, so the "marked area" is taken to be the central 2 × 2 block. Derivatives use the central difference [−1 0 1] (no division by 2). H is averaged over the 3 × 3 window.
- **Half cube** (sheet 3): the vertex numbering and the target pose are given in the task. The target follows the sheet's second figure: the prism lies on its diagonal face.
- **Isodata** (sheet 4/2): the sheet says this task is *not part of this year's material*. It is kept as optional; the Niblack part is skipped.

## Method reminders

**Histogram equalisation.** s = round((L − 1) · cdf(r)), with cdf(r) = (number of pixels ≤ r) / n.

```grid
# sheet 1 image (L = 8)
0 1 5 5 5 5 5 0
1 1 1 4 5 5 5 4
1 0 0 1 6 6 6 4
1 0 0 3 6 6 6 4
1 0 3 3 6 4 4 7
0 0 3 2 6 4 4 4
0 2 2 2 6 4 4 4
0 2 2 2 4 6 4 0
```

**Smaller eigenvalue of H.** For H = [A B; B C]:

λ± = (A + C)/2 ± √(((A − C)/2)² + B²)

- Flat region: both eigenvalues are small.
- Edge: one is large, one is small.
- Corner (feature point): both are large, so the **smaller** one (λ−) decides.

**Transformation sequences.** Write the descriptor matrix (4 × n, one column per vertex). Each elementary transformation multiplies it **from the left** (active view, base frame), so the composite is T = Mₙ · … · M₁. To stay above the ground, rotate about an **edge that touches the ground**: translate that edge onto the axis, rotate, translate back.

**Chain code → shape number.** Take the first difference dᵢ = (cᵢ − cᵢ₋₁) mod 8, circular (d₀ uses the last element). The shape number is the rotation of the difference code that reads as the smallest number.

**Moments.** Area μ00, centroid x̄ = m10/m00, ȳ = m01/m00.

- Central moments: μ_pq = Σ (x − x̄)ᵖ (y − ȳ)^q.
- Normalised: η_pq = μ_pq / μ00^((p+q)/2+1).
- Hu invariants: φ1 = η20 + η02, φ2 = (η20 − η02)² + 4η11².
- Principal axis: tan 2θ = 2μ11 / (μ20 − μ02).

Check any of these in the Image lab:

```js
const B = lib.parseGrid(`0 0 1 1 1 0 1 1 0 0
0 0 0 1 1 1 1 0 0 0
0 0 0 1 1 1 1 0 0 0
0 0 0 0 0 1 1 0 0 0`);
const m = lib.moments(B, 1);
print('area', m.area, 'centroid', m.xc, m.yc);
print('mu20, mu02, mu11', m.mu['20'], m.mu['02'], m.mu['11']);
print('Hu', m.hu[0], m.hu[1], 'theta', m.theta);
```

(The rows above are only the object's rows. The centroid is therefore shifted compared with the full sheet image, but the central moments and Hu invariants are the same, because they are translation invariant.)
