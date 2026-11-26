# Kezdés

Ez az alkalmazás a **Képfeldolgozás** tárgyat azonnal értékelt feladatokká alakítja. Témáról témára követi az előadásokat (Vámossy Zoltán diái), a végén pedig a **gyakorló feladatsorok** és a két minta ZH-ból összeállított, időre menő **minta ZH** következik.

## Négyféle feladat

| Címke | Mit csinálsz | Hogyan értékeljük |
| --- | --- | --- |
| **Számolás** | Kézzel számolsz (mint a ZH-n), és számokat vagy egész mátrixokat írsz egy rácsba | Minden cellát összevetünk a helyes értékkel; a hibás cellák pirosak lesznek |
| **Kód · JavaScript** | Az algoritmust JavaScript függvényként írod meg | A függvényed és a mintamegoldás több tesztképen fut, az eredményeket összehasonlítjuk |
| **Transzformációk** | `Tran` / `Rx` / `Ry` / `Rz` lépések sorozatát írod, amely egy 3D testet mozgat | Ellenőrizzük a végső helyzetet és a feltételeket (pl. sosem kerül z = 0 alá); minden lépés utáni helyzetet látsz |
| **Kvíz / Kártya** | Elmélet, mint a ZH második része | A kvízt azonnal ellenőrizzük, a kártyákat te értékeled |

Billentyűk: **Ctrl+Enter** futtatja a kódot (vagy ellenőrzi a számolást), **Ctrl+Shift+Enter** ellenőriz.

## Mindenhol használt jelölések

A kép egy **f(x, y)** függvény: **x = oszlop** (jobbra), **y = sor** (lefelé). A ZH táblázatai **1-től** számolnak:

```grid
# f(x, y), 1-től indexelve, mint a ZH-n
12 40 40 200 210
15 45 180 220* 230
10 170 190 225 240
160 175 200 230 250
```

A kiemelt pixel **f(4, 2) = 220** (4. oszlop, 2. sor).

**Kódban** a kép sorok tömbje, **0-tól** indexelve: ugyanez a pixel `img[1][3]` – a sor van elöl.

```js
const img = IMG.shapes;            // egy 64×64-es mintakép
print(img.length, img[0].length);  // sorok, oszlopok
print(img[20][15]);                // 20. sor, 15. oszlop
show(img, 'shapes');
```

Egy kódblokk **▶ Try** gombja megnyitja azt a **Képlaborban**. A laborban a kurzus eszköztárának minden függvénye elérhető (`lib.sobel`, `lib.histEq`, `lib.moments`, …). Használd számológépként a kézi számolásaid ellenőrzéséhez.

## A válaszok beírása

- Törtek és kifejezések is jók: `3/4`, `sqrt(2)/2`, `2^3`, `pi/4`.
- A szögfüggvények **fokban** számolnak: `cos(60)` = 0,5, `atan(1)` = 45.
- A tizedesvessző is működik: `0,25`.
- Az eredményeket kb. ±0,01 (nagy értékeknél 0,5 %) tűréssel fogadjuk el, kivéve, ha a feladat pontos egész számot kér.

## A haladásod

A haladásod, a piszkozataid és a vizsgaeredményeid **csak ebben a böngészőben** tárolódnak. Semmi sem megy máshová, csak a helyi gyakorló szerverhez az értékeléshez.

## Javasolt sorrend

1. Az 1–11. modul az előadásokat követi. Olvasd el a leckét, aztán oldd meg a feladatokat.
2. A 12. modul a ZH második részének elméleti kérdéseit gyakoroltatja.
3. A 13. modulban minden **gyakorló feladatsor** összes feladata megtalálható az eredeti pontszámokkal.
4. A 14. modul a **minta ZH**: a két minta ZH-lap időre menő mása (28 gyakorlati + 21 elméleti pont).
