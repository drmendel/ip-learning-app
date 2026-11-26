# Homogén transzformációk és modellezés

Képeket gyakran kell **egymásba transzformálni** (warping, mozaikozás). Koordináta-rendszereket kell megfeleltetni: kamera ↔ kép, kamera ↔ világ, robotbázis ↔ megfogó. A modellezett munkatérben tárgyakat kell **mozgatni**. Mindezt **homogén transzformációkkal** végezzük. A ZH-ban mindig van olyan feladat, ahol egy testet lépésenként kell mozgatni.

## Homogén koordináták

Egy 2D pont (x, y) helyett [x, y, 1]ᵀ, egy 3D pont (x, y, z) helyett [x, y, z, 1]ᵀ. Általában [sx, sy, s]ᵀ ~ (x, y): a homogén vektorok csak **skálázó faktor erejéig** meghatározottak, a szokásos pontot az utolsó koordinátával osztva kapjuk. A **0** utolsó koordináta **irányt** (végtelen távoli pontot) jelöl.

Miért kell ez? Egy 2 × 2-es mátrix tud **forgatni** és **skálázni**, de eltolást **hozzáadni** nem. A plusz koordinátával az eltolás is mátrixszorzás lesz:

| 2D | mátrix | szabadsági fok |
| --- | --- | --- |
| eltolás | [1 0 x0; 0 1 y0; 0 0 1] | 2 |
| forgatás | [cosθ −sinθ 0; sinθ cosθ 0; 0 0 1] | 1 |
| euklideszi (forgatás + eltolás) | [R t; 0 1] | 3 |
| hasonlósági (+ egyenletes skálázás) | [sR t; 0 1] | 4 |
| affin (+ nyírás, nem egyenletes skálázás) | [a11 a12 a13; a21 a22 a23; 0 0 1] | 6 |
| projektív (homográfia) | tetszőleges 3 × 3, skálafaktor erejéig | 8 |

## 3D elemi transzformációk (jegyzet 2.14–2.15)

```text
Tran(v) = | 1 0 0 vx |   Rot(x,θ) = | 1  0     0    0 |
          | 0 1 0 vy |              | 0  cosθ −sinθ 0 |
          | 0 0 1 vz |              | 0  sinθ  cosθ 0 |
          | 0 0 0 1  |              | 0  0     0    1 |

Rot(y,θ) = |  cosθ 0 sinθ 0 |   Rot(z,θ) = | cosθ −sinθ 0 0 |
           |  0    1 0    0 |              | sinθ  cosθ 0 0 |
           | −sinθ 0 cosθ 0 |              | 0     0    1 0 |
           |  0    0 0    1 |              | 0     0    0 1 |
```

Annak a tengelynek, amely körül forgatunk, egységoszlopa marad. A maradék 2 × 2-es blokk főátlójában cos, azon kívül ±sin áll. A **Rot(y)** a kakukktojás (+sin a jobb felső sarokban), mert a ciklikus sorrend x → y → z → x. A pozitív szög **a tengely pozitív vége felől nézve** az óramutatóval ellentétes forgatás: Ry(+90°) a z tengelyt az x tengelybe viszi.

Az általános T = [R v; perspᵀ n]: R a 3 × 3-as orientáció, v az eltolás, persp ≈ 0 (kivéve vetítéseknél), n = 1.

## Összetett transzformációk – aktív és passzív szemlélet

Kezdetben **T = I**, majd minden M elemi lépésre:

- ha a lépés a **rögzített bázis** valamely tengelye körül/mentén történik (*aktív* szemlélet, mozgásleírás) → **T ← M · T** (szorzás **balról**);
- ha a **mozgó lokális rendszer** saját tengelye körül/mentén történik (*passzív* szemlélet, vonatkoztatási rendszer váltása) → **T ← T · M** (**jobbról**).

Tehát a bázishoz képest megadott M₁, M₂, …, Mₙ sorozat eredője **T = Mₙ · … · M₂ · M₁**. A mátrixszorzás nem kommutatív, ezért a sorrend számít.

Az y-nal **párhuzamos**, a v = (vx, 0, vz) ponton átmenő tengely körüli forgatás (2.16):

T = Tran(v) · Rot(y, θ) · Tran(−v)

Jobbról balra olvasva: a tengelyt az origóba toljuk, forgatunk, visszatoljuk. Ez a kulcs ahhoz, hogy egy testet **egy éle körül átbillentsünk** úgy, hogy közben ne kerüljön a talaj alá.

## Inverz és Rodrigues

Merev T = [R v; 0 1] inverze olcsó: **T⁻¹ = [Rᵀ −Rᵀv; 0 1]**, mert R ortonormált (Rᵀ = R⁻¹).

Minden forgatás felírható egyetlen, valamilyen u egységtengely körüli θ szögű forgatásként (**Rodrigues**). Mátrixból vissza:

- Sp(T) = 2 + 2cosθ (a 4 × 4-es mátrix nyoma), tehát θ = arccos((Sp − 2)/2);
- u = (R32 − R23, R13 − R31, R21 − R12) / (2 sinθ). Ez csak 0 < θ < π esetén meghatározott.

## Objektumok modellezése (2.34–2.35)

A testet síklapokkal közelítjük, megszámozzuk a csúcsait, és homogén koordinátáikat egy **4 × n-es leírómátrix oszlopaiba** gyűjtjük:

```text
          v1  v2 … vn
Objektum = | x1  x2 … xn |
           | y1  y2 … yn |
           | z1  z2 … zn |
           | 1   1  … 1  |
```

A mozgatás így egyetlen szorzat: **új helyzet = T · régi leíró**. A ZH-ban általában:

1. fel kell írni a leírómátrixot (figyelj a csúcsok sorrendjére!),
2. meg kell adni az elemi lépéseket, pl. „sosem z = 0 alá” → a talajt érintő él körül forgass,
3. ki kell számolni a helyzetet **minden** lépés után (az aktuális leírót szorozd a következő M-mel).

```js
// egy 1×1×2-es téglatest átbillentése az x = 1-es éle körül, majd eltolás x mentén
const box = [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,2],[1,0,2],[1,1,2],[0,1,2]];
let D = lib.descriptor(box);
const steps = [lib.Tran(-1,0,0), lib.RotY(90), lib.Tran(1,0,0), lib.Tran(3,0,0)];
for (const M of steps) { D = lib.cleanZero(lib.matmul(M, D)); print(JSON.stringify(D.slice(0, 3))); }
print('T =', JSON.stringify(lib.cleanZero(lib.composeActive(steps))));
```

## Transzformációs feladatok ebben az alkalmazásban

Soronként egy lépést írj:

- `Tran(x, y, z)`
- `Rx(a)`, `Ry(a)`, `Rz(a)` (fokban)
- `Ry(a) about (px, py, pz)` – forgatás az y-nal párhuzamos, egy ponton átmenő tengely körül

Az argumentumok kifejezések is lehetnek, pl. `-sqrt(2)`. A **Futtatás** megmutatja a csúcsmátrixot minden lépés után, a mozgás **közben** elért legkisebb z-t és az eredő T-t. Ezzel ellenőrizheted a kézzel számolt helyzeteket.
