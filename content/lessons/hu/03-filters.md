# Szűrés és konvolúció

A pont alapú műveletek (4. előadás) egyetlen pixelt néznek. A **maszk (ablak) alapú műveletek** minden kimeneti pixelt a pixelből **és a szomszédaiból** számolnak: g(x, y) = T[f(x, y)], ahol T egy (x, y) körüli kis ablakon dolgozik (lokális művelet). A kimenet mérete megegyezik a bemenetével, és **új** képbe írjuk – sosem önmagába.

## Maszkok

A **maszk** (kernel) súlyokból álló kis mátrix, **origóval** – páratlan n×n méretnél (n = 3, 5, 7 …) ez a középső elem. Az origót a pixelre helyezzük, a maszk alatti pixeleket megszorozzuk a súlyokkal, összegzünk, és esetleg skálázunk:

g(x, y) = Σₖ Σₗ w(k, l) · f(x + l, y + k)

Ha a kimenet a bemenetek **lineáris kombinációja**, a szűrő **lineáris** és **eltolás invariáns**; ezt – némileg tévesen – *konvolúciós maszknak* is nevezik. A nem lineáris szűrők (medián, minimum, maximum) maszkkal nem írhatók fel.

## Konvolúció és korreláció

| | képlet | maszk |
| --- | --- | --- |
| **Korreláció** | g(i, j) = Σ w(k, l) · f(i + k, j + l) | ahogy le van írva |
| **Konvolúció** | y(i, j) = Σ h(k, l) · x(i − k, j − l) | **180°-kal elforgatva** (tükrözve) |

**Középpontosan szimmetrikus** maszknál (átlagoló, Gauss, binomiális, Laplace) a kettő egyenlő. A konvolúció kommutatív és asszociatív (f ∗ g = g ∗ f), ezért működnek a szeparálható szűrők.

1D példa, f = [2 0 1 3], g = [1 2 −1], 4 + 3 − 1 hosszú „kibővített” eredmény:

- konvolúció: g tükrözése → [−1 2 1], majd eltolás: **[2 4 −1 5 5 −3]**
- korreláció: magát g-t toljuk: **[−2 4 1 −1 7 3]**

```js
print('konvolúció', lib.convolve1D([2, 0, 1, 3], [1, 2, -1]));
print('korreláció', lib.correlate1D([2, 0, 1, 3], [1, 2, -1]));
const w = [[1, 2, 0], [0, 1, 0], [0, 0, -1]];   // nem szimmetrikus
const f = [[3, 5, 1], [0, 2, 4], [1, 7, 9]];
print('korreláció', lib.correlate(f, w, 'valid'), 'konvolúció', lib.convolve(f, w, 'valid'));
```

## Maszksúlyok és a kép széle

- **Összeg = 1** (simítás, élesítés): az átlagos intenzitás megmarad, a homogén részek nem változnak. Ezért van az aluláteresztő maszkok előtt 1/Σw szorzó (1/9, 1/16, 1/256).
- **Összeg = 0** (deriváltak, Laplace): homogén rész → 0, negatív eredmény is lehet → megjelenítés előtt lineáris normalizálás vagy |·|.
- **Kép széle**: a maszk kilóg a képből. Vagy kiegészítjük (nullákkal, ismételt vagy tükrözött pixelekkel), vagy a szélső sorokat/oszlopokat elhagyjuk / változatlanul hagyjuk. Mindig mondd meg, melyiket használod – a ZH általában csak a belső pixeleket kéri.

## Simítás (aluláteresztő szűrők)

**Átlagoló (box) szűrő** – (1/9)·[1 1 1; 1 1 1; 1 1 1]. Nagyobb maszk jobban simít, de a maszk szélén lévő hirtelen váltás **begyűrűzést** okoz, és az élek elmosódnak.

```grid
# 3×3 átlagoló a kiemelt ablakon: (12+15+14+10+13+16+11+90+15)/9 = 196/9 ≈ 22
12* 15* 14* 60 62
10* 13* 16* 64 61
11* 90* 15* 63 65
13 12 14 66 60
```

**Gauss-szűrő** – w(x, y) ∝ exp(−(x² + y²) / (2σ²)). Súlyozott átlag, izotróp, nincs begyűrűzés (a szélén kicsik a súlyok). σ a simítás mértéke; a maszknak σ-val együtt nőnie kell: **magasság = szélesség ≈ 5σ** (a terület 98,76 %-át fedi le). σ = 1 → 3×3-as maszk [0,075 0,124 0,075; 0,124 0,204 0,124; 0,075 0,124 0,075].

**Binomiális szűrő** – a Gauss egész együtthatós közelítése. A Pascal-háromszög sorai, vagy ismételt konvolúció [1 1]-gyel:

[1 1] ∗ [1 1] = [1 2 1],  [1 2 1] ∗ [1 1] = [1 3 3 1],  … n = 5: [1 4 6 4 1]

A 2D maszk a sor önmagával vett külső szorzata, osztva 2^(2p)-vel (p = n − 1): 3×3-asnál 1/16, **5×5-ösnél 1/256**.

### Szeparálhatóság

Az átlagoló, a Gauss és a binomiális maszk **szeparálható**: h(x, y) = h_x(x) · h_y(y), így a 2D szűrés egy soronkénti és egy oszloponkénti 1D menet.

| n×n maszk | szorzás | összeadás |
| --- | --- | --- |
| közvetlen 2D | n² | n² − 1 |
| két 1D menet | 2n | 2(n − 1) |

n = 5 esetén pixelenként 25 + 24 kontra 10 + 8 művelet. Az átlagoló szűrő rekurzívan, pixelenként kb. 4 művelettel is számolható.

## Medián szűrő (nem lineáris)

A pixelt az ablak **mediánjával** helyettesítjük (rendezés, középső elem: 9 értékből az 5.). **Sorbarendezésen alapuló (rank order)** szűrő:

- median{f₁ + f₂} ≠ median{f₁} + median{f₂}, de median{c·f} = c·median{f} és median{c + f} = c + median{f};
- nagyon hatékony **impulzus- (só-bors) zaj** ellen, megtartja a lépcsős éleket;
- nagy zajnál és Gauss-zajnál nem hatékony; törli a pontokat, az 1 pixel széles vonalakat és a sarkokat;
- lassabb (rendezés): buborékrendezéssel az 5. elemig 8 + 7 + 6 + 5 + 4 = 30 lépés pixelenként.

```grid
# 255 az ablak közepén: 20 21 21 22 22 22 23 24 255 → medián 22
20* 22* 21* 23 25
21* 255* 22* 0 24
22* 23* 24* 22 255
```

```js
const noisy = IMG.saltpepper;
show(noisy, 'só-bors zaj');
show(lib.correlate(noisy, lib.boxKernel(3), 'keep'), '3×3 átlagoló');
show(lib.median(noisy, 3), '3×3 medián');
```

## Élesítés (felüláteresztő szűrők)

Az élesítés a finom részleteket emeli ki lokális **differenciák** segítségével: a súlyok pozitívak és negatívak, homogén terület felett a válasz ≈ 0, hirtelen változásnál nagy.

- Elsőrendű derivált (gradiens): ∂f/∂x ≈ f(x+1, y) − f(x, y). Az elsőrendű differenciák vastagabb éleket adnak.
- Másodrendű derivált – **Laplace**: ∇²f = f(x+1, y) + f(x−1, y) + f(x, y+1) + f(x, y−1) − 4f(x, y). Izotróp; erős válasz vékony vonalakra és pontokra, lépcsőnél dupla (+/−) válasz.

A **Laplace-élesítés** a részletet visszaadja az eredetihez: g = f − ∇²f (ha a Laplace-maszk középső eleme negatív), vagyis a maszk

[0 −1 0; −1 5 −1; 0 −1 0]  → g(x, y) = 5f(x, y) − (a 4 szomszéd összege)

Az eredmény kiléphet a 0…255 tartományból → vágás (vagy normalizálás).

**Életlenítő maszkolás (unsharp masking) és felül erősítés**

- g_s = f − f̄ (eredeti − elmosott) – a részlet;
- g_hb = A·f − f̄ = (A − 1)·f + g_s, A ≥ 1 – a felül erősítés megtartja az eredeti egy részét (A = 1 a sima életlenítő maszkolás).

Példa: f = [20 20 20 50 50 50], f̄ (3 elemű átlag, 2…5. pozíció) = [20 30 40 50]: g_s = [0 −10 10 0], g_hb (A = 1,5) = [10 0 35 25].

```js
const f = IMG.shapes;
const blur = lib.correlate(f, lib.gaussKernel(5, 1.2), 'replicate');
const A = 1.5;
show(lib.map(f, (v, y, x) => lib.clamp(A * v - blur[y][x])), 'felül erősítés, A = 1,5');
show(lib.map(lib.correlate(f, lib.K.laplaceSharpen, 'replicate'), (v) => lib.clamp(v)), 'Laplace-élesítés');
```

## Ellenőrzőlista a ZH-hoz

1. Konvolúció → előbb forgasd el a maszkot 180°-kal; korreláció → ahogy le van írva.
2. Mondd meg, hogyan kezeled a szélt; csak a kért pixeleket számold.
3. Aluláteresztő szűrő: oszd el a súlyok összegével. Csak a végén kerekíts.
4. Medián: mind a 9 értéket rendezd, vedd az 5.-et; a szél változatlan.
