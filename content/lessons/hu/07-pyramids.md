# Képpiramisok

## Miért több felbontás?

Ha az objektumok képe túl kicsi vagy nem elég kontrasztos, **nagyobb** felbontással vizsgáljuk őket; ha nagy méretűek vagy kontrasztosak, elegendő a **durva** felbontás. Ha mindkettő előfordul ugyanazon a képen, előnyös különböző felbontásokkal vizsgálni. A **képpiramis** (felbontás hierarchia, *resolution hierarchy*) a kép egyre kisebb felbontású másolatait tárolja – tömör reprezentáció, amellyel sok algoritmus gyorsabb lesz:

- **hasonló részek keresése**: durva skálán keresünk (mintaillesztés), majd nagyobb felbontásnál finomítunk,
- élkövetés, mozgások vizsgálata (a nagy elmozdulás durva szinten kicsi),
- adott méretű csíkok keresése – textúrák vizsgálatánál fontos,
- tömörítés (Laplace piramis), képek összeolvasztása.

## Sub-sampling és aliasing

A kép felezésének kézenfekvő módja minden második sor és oszlop elhagyása (**sub-sampling**). Visszanagyítva az eredmény különösen néz ki: a vékony vonalak szétesnek vagy eltűnnek, a csíkok hamis mintázattá (moiré) alakulnak. Ez az **aliasing** (rossz mintavételezés) – a magas frekvenciás jellemzők (élek) a kisebb mintavételi sűrűséggel nem ábrázolhatók.

```grid
# g₀: a lehető legfinomabb részlet
0 100 0 100 0 100 0 100
```

Sub-sampling után: 0 0 0 0 – a világos minták eltűntek. Előbb simítva ([¼ ½ ¼]), majd mintavételezve: 25 50 50 50 – a helyes átlag.

**Megoldás:** mintavételezés **előtt** „élelnyomás”, aluláteresztő szűrő (átlagoló vagy Gauss szűrő, σ ≈ 1–1,4 pixel).

## Szintek

Minden szint szélessége és magassága fele, azaz **pixelszáma ¼-e** az alatta lévőnek. Egy 2^J × 2^J-es kép J + 1 szintet ad: 2^J × 2^J, …, 2 × 2, 1 × 1. A teljes piramis pixelszáma az eredetinek

1 + ¼ + 1/16 + … < 4/3

-szorosa – csak egyharmadnyi többletmemória.

> **Számozás:** itt (és a `lib.pyramids`-ban) **g₀ az eredeti, legnagyobb kép**, és g₁, g₂, … egyre kisebb. Az előadás fordítva számoz: nála a 0. szint az 1 × 1-es, a J. szint az eredeti, és a Laplace képletekben a g₁ a **legkisebb** kép (ezért írja, hogy L₁ = g₁). Mindig mondd meg, melyik végéről számolsz.

## A redukáló (REDUCE) függvény

g_l = REDUCE(g_{l−1}):  g_l(i) = Σ_{m=−2..2} w(m) · g_{l−1}(2i + m)

pl. g_l(2) = w(−2)g_{l−1}(2) + w(−1)g_{l−1}(3) + w(0)g_{l−1}(4) + w(1)g_{l−1}(5) + w(2)g_{l−1}(6).

A generáló maszk szimmetrikus: **w = [c, b, a, b, c]**, ahol

- az elemek összege 1: a + 2b + 2c = 1,
- minden csomópont ugyanannyi összsúllyal járul hozzá a következő szinthez: a + 2c = 2b,

tehát **b = 1/4, c = 1/4 − a/2**:

| a | maszk | név |
| --- | --- | --- |
| 0,4 | [0,05 0,25 0,4 0,25 0,05] | Gauss maszk |
| 0,5 | [0 ¼ ½ ¼ 0] | háromszög maszk |
| 3/8 | [1 4 6 4 1] / 16 | könnyen számolható maszk (binomiális) |

A feladatokban a jelen kívüli minták helyén a **legközelebbi szélső minta áll (ismétlés)**. A Gauss szűrő szeparálható, így 2D-ben az 1D maszkot előbb a kép minden sorára, majd minden oszlopára alkalmazzuk.

```grid
# g₀ (a = 3/8) → g₁ = [9 25 44 25]
8 8 24 40 56 40 24 8
```

g₁(1) = (1·8 + 4·8 + 6·24 + 4·40 + 1·56)/16 = 400/16 = 25.

## EXPAND („visszahízlalás”)

A fordított irány: kétszeres felmintavételezés és interpoláció ugyanazzal a maszkkal:

EXPAND(g)(i) = 2 · Σ_m w(m) · g((i − m)/2)  (csak ahol (i − m)/2 egész)

a = 0,5 esetén ez lineáris interpoláció: a páros minták g-t másolják, a páratlanok a két szomszéd átlagai.

## Laplace piramis

Minden szint azt tárolja, amit a durvább szint nem tud ábrázolni (maradék, „különbség” kép):

L_k = g_k − EXPAND(g_{k+1}),  a legfelső szinten pedig L_N = g_N

L_k pixeleinek többsége 0 közeli (hasonló az élszűrt képekhez, orientációfüggetlen) → jól tömöríthető. **A Gauss és a Laplace piramis legfelső szintje azonos**, mert nincs durvább szint, amit kivonhatnánk – és erre szükség van a kép visszaállításához.

**Rekonstrukció** felülről lefelé: g_k = L_k + EXPAND(g_{k+1}) – pontos, bármilyen maszkkal.

A piramisépítés minden iterációja: (1) szűrés és leosztás (downsampling) → közelítés, (2) felszorzás (upsampling) és interpoláló szűrő → becslés az input felbontásán, (3) input − becslés = maradék.

## Összeolvasztás (alma + narancs)

1. Készítsük el a két kép L_A és L_B Laplace piramisát.
2. Minden szinten az L_A bal felét és az L_B jobb felét másoljuk egybe (vagy tetszőleges alakhoz maszkpiramist használunk).
3. Rekonstruáljuk a kombinált piramisból a képet. A varrat a durva szinteken széles, a finom szinteken keskeny sávban olvad össze – nem látszik él.

## Próbáld ki

```js
const { gauss, laplace } = lib.pyramids(IMG.shapes, 4, 0.4);
gauss.forEach((g, i) => show(g, `g${i}: ${g.length}×${g[0].length}`));
const top = laplace.length - 1;   // a legfelső Laplace szint a legfelső Gauss szint
laplace.forEach((l, i) => show(i === top ? l : l.map(r => r.map(v => 128 + v)), i === top ? `L${i} = g${i}` : `L${i} (+128)`));
```

```js
// 1D REDUCE és EXPAND kézzel
const g0 = [10, 20, 40, 40, 30, 10, 10, 20];
const g1 = lib.reduce1D(g0, 0.5);
const e = lib.expand1D(g1, 8, 0.5);
print('g1 =', g1);
print('EXPAND(g1) =', e);
print('L0 =', g0.map((v, i) => v - e[i]));
```
