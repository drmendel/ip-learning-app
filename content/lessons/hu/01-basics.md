# Digitális képek és adatstruktúrák

A 2. és 3. előadás a kurzus alapfogalmait rakja le: mi a digitális kép, hol helyezkedik el a képfeldolgozás a rokon területek között, és melyik az a két egyszerű adatstruktúra, amely újra meg újra előkerül – a **hisztogram** és az **integrál kép**.

## Mi a digitális kép?

A kép egy kétdimenziós **f(x, y)** függvény: x és y a térbeli koordináták, f az adott pontbeli intenzitás (szürkeségi szint). A kép akkor **digitális**, ha x, y **és** f is diszkrét. Ezt két lépés biztosítja:

| Lépés | Mi lesz diszkrét | Eredmény |
| --- | --- | --- |
| **Mintavételezés** | az x, y koordináták – a képet csak rácspontokban mérjük | felbontás, pl. 1024 × 1024 pixel |
| **Kvantálás** | az f amplitúdó – L szint egyikére kerekítjük | szürkeségi szintek, pl. 8 biten L = 256 |

Pixelenként k biten **L = 2ᵏ** szint van, 0 … L − 1 számozással. Az alsó bitek elhagyása durvább kvantálás: 203 = 1100 1011₂ → 4 biten 1100₂ = 12 marad, ami 12 · 16 = 192-t képvisel.

A pixel (picture element, képelem) ennek a kétdimenziós tömbnek egy cellája. A kurzusban **x = oszlop** (jobbra) és **y = sor** (lefelé); a ZH táblázatai 1-től, a kód 0-tól indexel (`img[y][x]`).

## Rokon területek

A 2. előadás a területeket aszerint osztályozza, mi a bemenet és mi a kimenet:

| Bemenet ↓ / Kimenet → | Kép | Leírás |
| --- | --- | --- |
| **Kép** | képfeldolgozás (DIP) | gépi látás (CV) |
| **Leírás** | számítógépes grafika (CG) | mesterséges intelligencia |

- **Digitális képfeldolgozás**: képfokozás, helyreállítás, tömörítés – az eredmény általában másik kép (és valamilyen jellemzők).
- **Gépi látás**: az emberi látás emulációja – tanulás, következtetés, reagálás; hasznos információ kinyerése a 3D világról egy vagy több 2D kép alapján.
- **Számítógépes grafika**: képek készítése modellekből.

A képfeldolgozásnak **három szintje** van:

1. **Alacsony szint** – kép be, kép ki: zajszűrés, élesítés, kontrasztjavítás (adatvezérelt előfeldolgozás).
2. **Középső szint** – kép be, attribútumok ki: **szegmentálás**, reprezentáció és leírás; bizonyos mértékű mesterséges intelligencia kell.
3. **Magas szint** – a jelenet egészének felismerése és értelmezése; mesterséges intelligencia módszerek szükségesek.

Miért bonyolult a gépi látás? A 3D → 2D leképezés információt veszít (az inverz feladatnak nincs egyértelmű megoldása), a megvilágítás, az anyagok és a kitakarás rendkívül változatosak, és a számítás is intenzív.

## Mennyi számítás kell?

Egy 1024 × 1024-es, 8 bites kép 2²⁰ bájt = **1 MB**. Pixelenként egy művelet, 10⁻⁸ mp/művelet mellett 2²⁰ · 10⁻⁸ mp ≈ **10,5 ms**. Valós időben másodpercenként 25–30 képet kell feldolgozni, azaz képenként 33–40 ms áll rendelkezésre – a valódi algoritmusok pedig pixelenként sok műveletet végeznek. A színes (RGB) kép háromszoros adat: minden pixel egy (R, G, B) vektor, és minden színréteg önmagában egy intenzitáskép.

## Hisztogram

A **hisztogram** megszámolja, hogy az egyes intenzitásokból hány darab van a képen: h(rₖ) = nₖ, k = 0 … L − 1.

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

- **Halmozott hisztogram**: H(k) = a **legfeljebb k** értékű pixelek száma – futó összeg, monoton nem csökkenő, M·N-nél ér véget.
- **Normalizált hisztogram**: p(rₖ) = nₖ / (M·N). Összege 1, és az egyes intenzitások valószínűségét becsüli; halmozott változata, P(k), 1-nél ér véget.
- Az átlagos intenzitás μ = Σ rₖ · p(rₖ).

A hisztogram semmit sem mond arról, **hol** vannak a pixelek – csak a világosságot és a kontrasztot jellemzi. Egy menetben számolható (`hist[p[y][x]]++`), és jól párhuzamosítható: a képet részekre bontjuk, részhisztogramokat készítünk, majd összeadjuk őket.

```js
const img = IMG.lowcontrast;
const h = lib.histogram(img);              // 256 darabszám
const p = lib.normalizedHistogram(img);    // összege 1
print('nem üres rekeszek:', h.filter((v) => v > 0).length);
print('átlag =', p.reduce((s, v, k) => s + k * v, 0).toFixed(2));
show(img, 'alacsony kontrasztú kép');
```

## Integrál kép

Az **integrál kép** minden pontban a fölötte és tőle balra lévő összes pixel összegét tárolja (a pontot is beleértve):

ii(x, y) = Σ i(x′, y′), ahol x′ ≤ x, y′ ≤ y

**Egyetlen menetben** készül két rekurzióval – s a halmozott oszlopösszeg:

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

Az utolsó érték (27) az egész kép összege.

### Téglalap összege állandó időben

Számozzuk a D téglalap körüli sarkokat: 1 = bal felső (kívül), 2 = jobb felső, 3 = bal alsó, 4 = jobb alsó. Ekkor

Σ D = ii(4) − ii(3) − ii(2) + ii(1)

– négy tömbhivatkozás, a téglalap méretétől függetlenül. 1-től indexelt táblázatban az x = x₁…x₂, y = y₁…y₂ téglalap összege ii(x₂, y₂) − ii(x₂, y₁ − 1) − ii(x₁ − 1, y₂) + ii(x₁ − 1, y₁ − 1), ahol a 0 indexű értékek 0-k.

### Haar-szerű jellemzők

A Haar-szerű jellemző = Σ(a fekete terület pixelei) − Σ(a fehér terület pixelei). A szomszédos téglalapok sarkai közösek, így a tömbhivatkozások száma:

| Téglalapok | 1 | 2 | 3 | 4 (2 × 2) |
| --- | --- | --- | --- | --- |
| Tömbhivatkozás | 4 | 6 | 8 | 9 |

Ezek a durva, de olcsó jellemzők teszik valós idejűvé **Viola és Jones** arcdetektorát: több ezret futtat belőlük sok részablakon. Az integrál kép a SURF-ben és a tömörítésben is megjelenik.

```js
const img = IMG.shapes;
const ii = lib.integralImage(img);
// a 10..29. sor, 20..39. oszlop összege (0-tól, zárt határok) 4 kiolvasással
print('téglalap összege =', lib.rectSum(ii, 10, 20, 29, 39));
print('teljes összeg    =', ii[63][63]);
show(ii.map((r) => r.map((v) => (255 * v) / ii[63][63])), 'integrál kép (skálázva)');
```

## Ellenőrzőlista a ZH-ra

- Definiáld a digitális képet, a mintavételezést és a kvantálást; L = 2ᵏ.
- Ismerd a DIP, CV, CG bemenet/kimenet táblázatát és a feldolgozás három szintjét.
- Számold ki kézzel h, H, p, P értékeit, és mondd meg, mit jelent a normalizált hisztogram.
- Készítsd el s-t és ii-t, számolj téglalap-összeget 4, Haar-jellemzőt 6 tömbhivatkozással.
