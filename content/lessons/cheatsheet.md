## Conventions
f(x, y): x = column →, y = row ↓. ZH tables are 1-based; code is 0-based `img[y][x]`.

## Histogram
- h(r_k) = n_k · normalised p(r_k) = n_k / n (Σ = 1)
- cdf(r) = Σ_{i≤r} p(i)
- Equalisation: s = round((L − 1) · cdf(r))
- Stretch: s = (L − 1)(r − min)/(max − min)

## Integral image
- s(x, y) = s(x, y−1) + i(x, y), ii(x, y) = ii(x−1, y) + s(x, y)
- Rectangle D = ii(4) − ii(3) − ii(2) + ii(1). Look-ups: 1 rect 4, 2 rects 6, 3 rects 8, 4 rects 9.

## Filtering
- Convolution y(i,j) = Σ h(k,l) x(i−k, j−l) (mask flipped); correlation g = Σ w(k,l) f(i+k, j+l).
- Box 1/9·1₃ₓ₃ · binomial 1/16 [1 2 1; 2 4 2; 1 2 1] · Gauss size ≈ 5σ
- Low-pass: divide by Σ weights → mean brightness kept.
- Median: rank order; kills impulse noise, keeps edges, deletes points/thin lines/corners.
- Laplace [0 1 0; 1 −4 1; 0 1 0]; sharpen g = f − ∇²f = [0 −1 0; −1 5 −1; 0 −1 0]
- High-boost: (A − 1)·f + (f − blurred), A ≥ 1

## Edges
```text
Sobel x: −1 0 1   Sobel y: −1 −2 −1   Prewitt x: −1 0 1
         −2 0 2             0  0  0               −1 0 1
         −1 0 1             1  2  1               −1 0 1
```
- fx = right − left, fy = bottom − top
- |∇f|₂ = √(fx² + fy²), |∇f|₁ = |fx| + |fy|, direction = atan2(fy, fx)
- Canny: Gauss → gradient → non-max suppression (0/45/90/135°) → hysteresis (2 thresholds)
- LoG: zero crossings. SUSAN: n(r0) = #similar, R = g − n if n < g (g = ¾ n_max).
- Expected-position edge: sum along the run → difference across → local max > threshold.

## Features & matching
- H = Σ_W [Ix² IxIy; IxIy Iy²] = [A B; B C]
- λ± = (A+C)/2 ± √(((A−C)/2)² + B²)
- Corner: λ− large. Harris R = det H − k·(trace H)², k ≈ 0.04–0.06.
- SSD = Σ(I₁−I₂)², SAD = Σ|I₁−I₂| (best = min) · CC = ΣI₁I₂ (best = max) · NCC normalised.

## Hough & fitting
- x cosθ + y sinθ = ρ; each pixel votes for (θ, ρ); peaks = lines.
- Circle: x0 = x − r cosθ, y0 = y − r sinθ.
- Least squares y = mx + b: m = (nΣxy − ΣxΣy)/(nΣx² − (Σx)²), b = (Σy − mΣx)/n

## Pyramids
- w = [c b a b c], b = ¼, c = ¼ − a/2 (a = 0.4 Gauss, 0.5 triangle, 3/8)
- g_l(i) = Σ w(m) g_{l−1}(2i + m) · L_k = g_k − EXPAND(g_{k+1})
- Top Laplacian level = top Gaussian level.

## Homogeneous transformations
- Tran(v) = [I v; 0 1] · Rot(z,θ) = [c −s 0; s c 0; 0 0 1]
- Rot(y,θ) = [c 0 s; 0 1 0; −s 0 c] · Rot(x,θ) = [1 0 0; 0 c −s; 0 s c]
- Base frame (active) → left multiply: T = Mₙ…M₁. Local frame (passive) → right multiply.
- About a parallel axis through v: Tran(v)·Rot·Tran(−v)
- T⁻¹ = [Rᵀ −Rᵀv; 0 1]. Rodrigues: Sp(T) = 2 + 2cosθ.
- New object = T · descriptor (4 × n).

## Segmentation
- Isodata: T ← (μ_low + μ_high)/2 until stable
- Otsu: max σ_B² = (μ·q_B − μ_T)²/(q_B q_O)
- Niblack: T = μ + kσ locally
- 4- vs 8-connectivity; split & merge (quadtree); region growing.

## Shape
- Chain code 0 = E, counter-clockwise (8 or 4 dirs). Difference d_i = (c_i − c_{i−1}) mod N.
- Shape number = minimal rotation of the difference; order n = chain length.
- Perimeter ≈ #even + √2·#odd (8-dir)
- m_pq = ΣΣ xᵖ y^q B · x̄ = m10/m00, ȳ = m01/m00
- μ_pq = ΣΣ (x−x̄)ᵖ (y−ȳ)^q B (translation inv.)
- η_pq = μ_pq / μ00^((p+q)/2+1) (+ scale)
- φ1 = η20 + η02, φ2 = (η20 − η02)² + 4η11² (+ rotation)
- tan 2θ = 2μ11/(μ20 − μ02) · compactness P²/(4πA) · Euler E = C − H

## Motion & faces
- Ix u + Iy v + It = 0; normal flow −It/|∇I| (aperture problem)
- LK: [ΣIx² ΣIxIy; ΣIxIy ΣIy²][u; v] = −[ΣIxIt; ΣIyIt]
- AdaBoost α = ½ ln((1−ε)/ε); misclassified weights ↑; cascade rejects early.
