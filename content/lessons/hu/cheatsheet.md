## Jelölések
f(x, y): x = oszlop →, y = sor ↓. A ZH táblázatai 1-től indexelnek, a kód 0-tól: `img[y][x]`.

## Hisztogram
- h(r_k) = n_k · normalizált p(r_k) = n_k / n (Σ = 1)
- cdf(r) = Σ_{i≤r} p(i)
- Kiegyenlítés: s = round((L − 1) · cdf(r))
- Széthúzás: s = (L − 1)(r − min)/(max − min)

## Integrál kép
- s(x, y) = s(x, y−1) + i(x, y), ii(x, y) = ii(x−1, y) + s(x, y)
- D téglalap = ii(4) − ii(3) − ii(2) + ii(1). Hivatkozások: 1 téglalap 4, 2 téglalap 6, 3 téglalap 8, 4 téglalap 9.

## Szűrés
- Konvolúció y(i,j) = Σ h(k,l) x(i−k, j−l) (tükrözött maszk); korreláció g = Σ w(k,l) f(i+k, j+l).
- Átlagoló 1/9·1₃ₓ₃ · binomiális 1/16 [1 2 1; 2 4 2; 1 2 1] · Gauss mérete ≈ 5σ
- Aluláteresztő: osztás a súlyok összegével → az átlagos világosság megmarad.
- Medián: sorbarendezés; az impulzuszajt eltünteti, az éleket megtartja, a pontokat/vékony vonalakat/sarkokat törli.
- Laplace [0 1 0; 1 −4 1; 0 1 0]; élesítés g = f − ∇²f = [0 −1 0; −1 5 −1; 0 −1 0]
- Felül erősítés: (A − 1)·f + (f − elmosott), A ≥ 1

## Élek
```text
Sobel x: −1 0 1   Sobel y: −1 −2 −1   Prewitt x: −1 0 1
         −2 0 2             0  0  0               −1 0 1
         −1 0 1             1  2  1               −1 0 1
```
- fx = jobb − bal, fy = alsó − felső
- |∇f|₂ = √(fx² + fy²), |∇f|₁ = |fx| + |fy|, irány = atan2(fy, fx)
- Canny: Gauss → gradiens → nem-maximumok elnyomása (0/45/90/135°) → hiszterézis (2 küszöb)
- LoG: nulla átmenetek. SUSAN: n(r0) = a hasonlók száma, R = g − n, ha n < g (g = ¾ n_max).
- Elvárt helyzetű él: összegzés a futam mentén → differencia keresztben → lokális max > küszöb.

## Jellemzők és illesztés
- H = Σ_W [Ix² IxIy; IxIy Iy²] = [A B; B C]
- λ± = (A+C)/2 ± √(((A−C)/2)² + B²)
- Sarok: λ− nagy. Harris R = det H − k·(nyom H)², k ≈ 0,04–0,06.
- SSD = Σ(I₁−I₂)², SAD = Σ|I₁−I₂| (legjobb = min) · CC = ΣI₁I₂ (legjobb = max) · NCC normalizált.

## Hough és illesztés
- x cosθ + y sinθ = ρ; minden pixel szavaz a (θ, ρ)-ra; a csúcsok az egyenesek.
- Kör: x0 = x − r cosθ, y0 = y − r sinθ.
- Legkisebb négyzetek, y = mx + b: m = (nΣxy − ΣxΣy)/(nΣx² − (Σx)²), b = (Σy − mΣx)/n

## Piramisok
- w = [c b a b c], b = ¼, c = ¼ − a/2 (a = 0,4 Gauss, 0,5 háromszög, 3/8)
- g_l(i) = Σ w(m) g_{l−1}(2i + m) · L_k = g_k − EXPAND(g_{k+1})
- A legfelső Laplace-szint = a legfelső Gauss-szint.

## Homogén transzformációk
- Tran(v) = [I v; 0 1] · Rot(z,θ) = [c −s 0; s c 0; 0 0 1]
- Rot(y,θ) = [c 0 s; 0 1 0; −s 0 c] · Rot(x,θ) = [1 0 0; 0 c −s; 0 s c]
- Bázishoz (aktív) → balról szorzás: T = Mₙ…M₁. Lokálishoz (passzív) → jobbról.
- Párhuzamos tengely körül, v ponton át: Tran(v)·Rot·Tran(−v)
- T⁻¹ = [Rᵀ −Rᵀv; 0 1]. Rodrigues: Sp(T) = 2 + 2cosθ.
- Új objektum = T · leírómátrix (4 × n).

## Szegmentálás
- Isodata: T ← (μ_alsó + μ_felső)/2, amíg stabil
- Otsu: max σ_B² = (μ·q_B − μ_T)²/(q_B q_O)
- Niblack: T = μ + kσ lokálisan
- 4- és 8-szomszédság; vágás és egyesítés (quadtree); régió növelés.

## Alak
- Lánckód: 0 = K, az óramutatóval ellentétesen (8 vagy 4 irány). Differencia d_i = (c_i − c_{i−1}) mod N.
- Alakszám = a differencia minimális elforgatása; rend n = a lánc hossza.
- Kerület ≈ #páros + √2·#páratlan (8 irány)
- m_pq = ΣΣ xᵖ y^q B · x̄ = m10/m00, ȳ = m01/m00
- μ_pq = ΣΣ (x−x̄)ᵖ (y−ȳ)^q B (eltolásinvariáns)
- η_pq = μ_pq / μ00^((p+q)/2+1) (+ skálázás)
- φ1 = η20 + η02, φ2 = (η20 − η02)² + 4η11² (+ forgatás)
- tan 2θ = 2μ11/(μ20 − μ02) · kompaktság P²/(4πA) · Euler-szám E = C − H

## Mozgás és arcok
- Ix u + Iy v + It = 0; normál folyam −It/|∇I| (apertúra probléma)
- LK: [ΣIx² ΣIxIy; ΣIxIy ΣIy²][u; v] = −[ΣIxIt; ΣIyIt]
- AdaBoost α = ½ ln((1−ε)/ε); a tévesen osztályozottak súlya ↑; a kaszkád korán elvet.
