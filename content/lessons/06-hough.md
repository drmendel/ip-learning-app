# Hough transform & curve fitting

Edge detectors give a set S of edge pixels. Next we must find which subsets of S lie on the **same line or curve**, and the **equation** of that curve. Testing every pair of points is O(N²) per point set – far too slow. The Hough transform turns the problem into **finding local maxima in a parameter space**.

## Lines in the (m, b) space

A line is y = m·x + b. Fix an edge point (xᵢ, yᵢ): every line through it satisfies

b = yᵢ − m·xᵢ

– a **line in the (m, b) plane**. Collinear image points give parameter-space lines that meet in one point (m, b).

Algorithm: divide the (m, b) plane into a grid of counters c(m, b) = 0; for every edge pixel and every quantised m compute b and increment c(m, b); the local maxima are the lines.

| point | m = 0 | m = 1 | m = 2 | m = 3 |
| --- | --- | --- | --- | --- |
| (1, 3) | 3 | 2 | **1** | 0 |
| (2, 5) | 5 | 3 | **1** | −1 |
| (3, 7) | 7 | 4 | **1** | −2 |

Three votes for (m, b) = (2, 1): the line y = 2x + 1.

**Problem:** vertical lines have m = ∞ (and b = ∞) – the parameters are unbounded.

## Normal (polar) form

x·cos θ + y·sin θ = ρ

θ is the direction of the line's normal, ρ the (signed) distance of the line from the origin. θ ∈ [0°, 180°), |ρ| ≤ image diagonal: bounded and numerically stable for every direction. A vertical line x = 5 is simply θ = 0°, ρ = 5; a horizontal line y = 2 is θ = 90°, ρ = 2. Each image point now votes along a **sinusoid** ρ(θ).

Conventions in this course's tasks: x = column, y = row, **0-based, origin at the top-left pixel**, y grows downwards, ρ rounded to the nearest integer.

```grid
# edge image, 0-based coordinates
0 0 0 1* 0
1* 0 0 1* 0
0 1* 0 1* 0
0 0 1* 1* 0
0 0 0 1* 0
```

| θ | ρ formula | strongest cell |
| --- | --- | --- |
| 0° | ρ = x | ρ = 3: 5 votes (the column x = 3) |
| 45° | ρ = 0.707(x + y) | ρ = 4: 3 votes (rounding artefact) |
| 90° | ρ = y | 2 votes |
| 135° | ρ = 0.707(y − x) | ρ = 1: 4 votes (the line y = x + 1) |

## Algorithm

1. Create a 2-D accumulator for (θ, ρ), θ from 0° to 180° (e.g. 10° steps), ρ up to the diagonal; set it to 0.
2. For every edge point and every θ compute ρ and increment A(θ, ρ).
3. Find the local maxima above a threshold.
4. Convert (θ, ρ) back to lines in the image.

Difficulties: the cell size (too large: lines merge; too small: noise scatters the votes), how many lines there are, which point belongs to which line, noise.

## Circles and general curves

(x − x₀)² + (y − y₀)² = r² has **three** unknowns → 3-D accumulator A(x₀, y₀, r). Fix one parameter, vary the others, increment, find local maxima. In practice use the **gradient direction** θ at the edge point:

x₀ = x − r·cos θ,  y₀ = y − r·sin θ

so each point votes only once per radius. A general curve y = f(x, a) with p parameters needs a p-dimensional accumulator A(s₁, …, s_p); the output is a list of parameter vectors.

## Curve fitting: least squares

Once we know which points belong together, fit the curve. The **method of least squares** minimises Σ (yᵢ − m·xᵢ − b)². Setting the derivatives to zero (normal equations):

m = (n·Σxy − Σx·Σy) / (n·Σx² − (Σx)²),  b = (Σy − m·Σx) / n

Example: (1, 2), (2, 3), (3, 5), (4, 6): Σx = 10, Σy = 16, Σx² = 30, Σxy = 47 → m = 28/20 = 1.4, b = 0.5.

This minimises **vertical** distances – bad for steep lines (fit x = m′y + b′, or minimise perpendicular distances instead).

**Parabola** y = a·x² + b·x + c: same idea, 3 normal equations with Σx⁴, Σx³, Σx², Σx, n on the left and Σx²y, Σxy, Σy on the right. Any model linear in its parameters, y = Σ αᵢ·φᵢ(x) (polynomial, trigonometric, exponential), is fitted the same way.

## Split and merge on contours

S = ordered boundary points, E_max = allowed error.

- **Split:** if the error of a segment exceeds E_max, cut it in two – typically at the point farthest from the chord (iterative end-point fit).
- **Merge:** join neighbouring segments if the union still keeps E < E_max (choose the pair whose merge increases the error least).
- **Adjust:** with the number of segments fixed, move each break point one step left or right if that lowers the sum of the two errors; repeat until nothing changes.

Distance of (x, y) from the line through (x₁, y₁), (x₂, y₂): d = |(y₂ − y₁)x − (x₂ − x₁)y + x₂y₁ − y₂x₁| / √((x₂ − x₁)² + (y₂ − y₁)²).

## Try it

```js
const bin = IMG.lines;                    // 32×32 binary: a horizontal, a vertical and a diagonal line
const thetas = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165];
const h = lib.houghLines(bin, thetas);
print('strongest lines (θ, ρ, votes):', h.lines.slice(0, 4).map(l => [l.theta, l.rho, l.votes]));
show(bin, 'edge pixels');
show(h.acc, 'accumulator (rows: θ, columns: ρ)');
```

```js
const pts = [[1, 2], [2, 3], [3, 5], [4, 6]];
print(lib.fitLine(pts));                                      // m, b, sse, sums
print(lib.fitParabola([[-2, 5], [-1, 2], [0, 1], [1, 2], [2, 6]]));
print(lib.splitPolyline([[0, 0], [2, 1], [3, 4], [6, 2], [8, 0]], 0.8)); // 0-based break points
```
