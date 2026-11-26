# Alakleírók és nyomatékok

A szegmentálás után minden régiót **tömören** szeretnénk leírni, lehetőleg **eltolásra, forgatásra és skálázásra** invariáns jellemzőkkel.

- **Külső (határ) leírók** – ha az alakon van a hangsúly: lánckód, alakszám, szignatúra, Fourier-leírók, átmérő.
- **Belső (régió) leírók** – terület, súlypont, nyomatékok, kompaktság, orientáció, topológia; textúra vagy szín, ha az a fontos.
- Egyszerű leírók: átlagos, minimális, maximális intenzitás – csak korlátozott körülmények között alkalmazhatók.

## Freeman-lánckód

A határt az **óramutató járásával megegyezően** követjük, és a szomszédos határpixelek közötti minden lépéshez iránykódot rendelünk. Az irányokat **keletről indulva, az óramutatóval ellentétesen** számozzuk:

| 8 irány | | | | 4 irány | | |
| --- | --- | --- | --- | --- | --- | --- |
| 3 | 2 | 1 | | | 1 | |
| 4 | · | 0 | | 2 | · | 0 |
| 5 | 6 | 7 | | | 3 | |

(8 irányú követésnél a következő pixel keresése az előző d irányhoz képest (d + 5) mod 8-nál kezdődik.)

```grid image
# kezdés a bal felső (2, 1) pixelben: lánckód 007553412
0 1* 1 1 0
0 1 1 1 1
1 1 1 1 0
0 0 1 0 0
```

Problémák: a lánckód függ a **startponttól**, változik az objektum **orientációjával** és a **mintavételezéssel**, nagyon hosszú lehet, és zajra érzékeny (megoldás: nagyobb rács; a gyakorlatban jobb a poligonokkal való közelítés).

**Kerület** 8-irányú kódból: **P ≈ a + b·√2**, a = a páros kódok száma, b = a páratlanoké. Fent: 4 + 5√2 ≈ 11,07.

## Differenciált lánckód és alakszám

- **Differenciált lánckód:** a kódot **körkörös** sorozatnak tekintjük: d_i = (c_i − c_{i−1}) mod N (N = 4 vagy 8), d₀ az utolsó elemet használja. Nem változik, ha minden kódot ugyanannyival forgatunk → **forgatásra invariáns** (90° / 45° többszöröseire).
- **Alakszám:** a differenciák körkörös sorozatának az az elforgatása, amely a **legkisebb szám** → független a kezdőponttól.
- **Rend (n)** = a számjegyek száma.

| Előadás példája | 4 irány |
| --- | --- |
| lánckód | 10103322 |
| differencia | 33133030 |
| | |
| lánckód | 003221 |
| differencia | 303303 |
| alakszám (6-od rendű) | 033033 |

**n-ed rendű alakok:** az n elemű lánckóddal leírható zárt alakok lehetséges formái. 4 iránnyal: 4-ed rend → 3333 (négyzet), 6-od rend → 033033 (2×1-es téglalap), 8-ad rend → 03030303, 00330033, 03033133. Határok összehasonlítására használjuk: **azonos rendű** alakszámokat hasonlítunk össze. Rögzített n rendhez (módosított alakszám): meghatározzuk a fő- és melléktengely arányát (excentricitás), vesszük az ilyen arányú n rendű alaptéglalapot, ezen a rácson újramintavételezzük a határt, és kiszámítjuk az alakszámot.

A **láncsimítás** (Zamperoni) az egymás utáni irányok párjait cserélve rövidíti a láncot.

## Szignatúra és más határleírók

- **Szignatúra:** a határ 1D függvényszerű leírása, pl. a súlyponttól mért távolság a szög függvényében, r(θ). Eltolásra invariáns; forgatásra invariáns, ha mindig ugyanazt a kezdőpontot választjuk (pl. a legtávolabbit); skálázásra invariáns normalizálás után: x' = (x − x_min)/(x_max − x_min). További szignatúrák: az érintő iránya az út függvényében, meredekség-sűrűség (az érintőfüggvény hisztogramja – az egyenes szakaszok csúcsok lesznek).
- **Átmérő:** a két legtávolabbi határpont távolsága. A főtengelyekkel egyező állású befoglaló téglalap oldalainak aránya invariáns.
- **Fourier-leírók:** s(k) = x_k + j·y_k, a(u) = s DFT-je. P < N alacsony frekvenciás tag megtartásával közelítjük az alakot. Az |a(u)| **forgatásra** invariáns, a(0) = 0 **eltolásra**, a(u)/|a(1)| **skálázásra** invariánssá tesz.

## Terület, súlypont, nyomatékok

1-től induló koordinátákkal (x = oszlop →, y = sor ↓, mint a ZH-n):

- **Nyomatékok:** m_pq = Σ_x Σ_y x^p·y^q·B(x, y); **terület**: A = m₀₀.
- **Súlypont:** x̄ = m₁₀ / m₀₀, ȳ = m₀₁ / m₀₀.
- **Centrális nyomatékok** (eltolásinvariánsak): μ_pq = Σ (x − x̄)^p·(y − ȳ)^q·B(x, y)
  - μ₀₀ = m₀₀, μ₁₀ = μ₀₁ = 0
  - μ₂₀ = m₂₀ − m₀₀·x̄², μ₀₂ = m₀₂ − m₀₀·ȳ², μ₁₁ = m₁₁ − m₀₀·x̄·ȳ
  - μ₃₀ = m₃₀ − 3m₂₀x̄ + 2m₀₀x̄³, μ₂₁ = m₂₁ − m₂₀ȳ − 2m₁₁x̄ + 2m₀₀x̄²ȳ, …
- **Normalizált** (skálázásinvariáns): η_pq = μ_pq / μ₀₀^γ, γ = (p + q)/2 + 1 (p + q ≥ 2).
- **Hu-féle invariánsok** (eltolás, skálázás, forgatás): φ₁ = η₂₀ + η₀₂, φ₂ = (η₂₀ − η₀₂)² + 4η₁₁², φ₃ = (η₃₀ − 3η₁₂)² + (3η₂₁ − η₀₃)², φ₄ = (η₃₀ + η₁₂)² + (η₂₁ + η₀₃)², …
- Egyértelműség tétele: az {m_pq} nyomatékok egyértelműen meghatározzák B(x, y)-t, és fordítva.

```grid image
# m₀₀ = 9, x̄ = 3,333, ȳ = 2,889, μ₂₀ = 8, μ₀₂ = 4,889, μ₁₁ = 1,333
0 0 0 0 0
0 1 1 1 0
0 1 1 1 1
0 0 1 1 0
```

Kézi számolási rutin a ZH-hoz: sorról sorra írd ki a pixelkoordinátákat, add össze x-et, y-t, x²-et, y²-et, xy-t, majd használd a fenti rövidített képleteket. 3–4 tizedesjegyet tarts meg.

## Orientáció: nyomatéki főtengely

Minimalizáljuk az E = Σ r²·B(x, y) mennyiséget, a pixelek súlyponton átmenő egyenestől mért négyzetes távolságát. a = μ₂₀, b = 2μ₁₁, c = μ₀₂ jelöléssel:

**tan 2θ = 2μ₁₁ / (μ₂₀ − μ₀₂)**

θ-t a +x tengelytől **a +y felé** mérjük; mivel a képen y **lefelé** mutat, θ > 0 esetén a tengely jobbra lefelé halad. A helyes negyedet az előjelek (atan2) adják. Csak hosszúkás objektumra van értelme.

```js
const r = lib.moments(IMG.blob, 1);   // 1-től induló koordináták
print('terület', r.area, 'súlypont', r.xc.toFixed(2), r.yc.toFixed(2));
print('mu20, mu02, mu11', r.mu['20'].toFixed(1), r.mu['02'].toFixed(1), r.mu['11'].toFixed(1));
print('theta (fok, +y felé)', r.theta.toFixed(1), ' Hu:', r.hu[0].toFixed(4), r.hu[1].toFixed(5));
show(IMG.blob, '30°-kal döntött ellipszis');
```

## Kerület, kompaktság, topológia

- **Kerület:** a határpixelek száma (olyan objektumpixelek, amelyeknek legalább egy szomszédja háttér); néha az 1 és √2 hosszú lépések összege.
- **Kompaktság:** C = P² / (4πA) – a kör a legkompaktabb.
- **Euler-szám:** E = C − H (C = összefüggő komponensek, H = lyukak); eltolásra, forgatásra, skálázásra invariáns.

```js
const bin = lib.threshold(IMG.shapes, 128);
const P = lib.sum(lib.boundaryPixels(bin)), A = lib.sum(bin);
print('A =', A, 'P =', P, 'kompaktság =', lib.compactness(P, A).toFixed(3));
print(lib.eulerNumber(bin));
print('a folt lánckódja:', lib.chainCode(IMG.blob).slice(0, 30), '…');
```
