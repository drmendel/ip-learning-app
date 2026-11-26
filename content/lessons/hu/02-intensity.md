# Intenzitás transzformációk

A 4. előadás a képműveleteket aszerint csoportosítja, hogy **mitől függ egy kimeneti pixel**:

| Osztály | A kimeneti pixel függ | Példák |
| --- | --- | --- |
| **Pont alapú műveletek** | a bemenet ugyanazon pixelétől | negálás, küszöbölés, széthúzás, gamma, hisztogram kiegyenlítés |
| **Teljes képre vonatkozó műveletek** | két vagy több kép ugyanazon pixelétől | átlagolás, kivonás, AND/OR |
| **Geometriai transzformációk** | egy másik helyen lévő pixeltől | eltolás, skálázás, elforgatás, affin |
| Maszk (ablak) alapú műveletek | egy környezettől | szűrők – a következő modulokban |

A frekvenciatartományban végzett műveletek (Fourier-transzformáció) külön csoportot alkotnak.

## Pont alapú műveletek: s = T(r)

r a forrás, s a cél intenzitása, L a szintek száma. Minden pixel független a többitől, ezért a pont alapú műveletek triviálisan **adatpárhuzamosak**, és L elemű keresőtáblaként tárolhatók.

- **Identitás**: s = r.
- **Negálás**: s = (L − 1) − r – sötét háttérben szürke vagy fehér elemek kiemelésére.
- **Küszöbölés**: s = 0, ha r < T, egyébként s = L − 1. Dupla küszöböléssel egy [T₁, T₂] sávot tartunk meg.
- **Intenzitás szintre vágás**: egy [a, b] tartományt kiemelünk (L − 1-re állítjuk), a többit megtartjuk vagy 0-ra állítjuk.
- **Kontraszt nyújtás**: m alatt sötétítés, m fölött világosítás; 1-nél nagyobb meredekség növeli a kontrasztot.
- **Szürkeségi szint csökkentés**: a kevésbé szignifikáns biteket elhagyjuk, pl. r AND 224 3 bitet tart meg.
- **Logaritmus**: s = c · log(1 + r) – a sötét régiókat széthúzza, a világosakat tömöríti (pl. Fourier-spektrum); az eredményt általában normalizálni kell.
- **Hatványfüggvény (gamma)**: s = c · rᵞ – γ < 1 világosít (mint a log), γ > 1 sötétít; a **gamma korrekció** a különböző megjelenítőkhöz igazít.

```grid
# r (L = 16)
0 3 7
12 5 9
15 10 4
```

Negálás: 15 − r → 15 12 8 / 3 10 6 / 0 5 11. Küszöbölés T = 8-cal → 0 0 0 / 15 0 15 / 15 15 0.

### Bitsíkok

Egy 8 bites értéknek 8 bitsíkja van. A **7-es bitsík** (legszignifikánsabb) egyszerűen r ≥ 128 – egy küszöbölés; a magasabb bitsíkok hordozzák a lényegi információ javarészét. A **0-s bitsík** zajnak tűnik, ezért lehet az alacsonyabb bitekben idegen adatot tárolni (**szteganográfia**).

## Hibadiffúzió (Floyd–Steinberg, 1975)

Hogyan jelenítsünk meg egy 8 bites képet olyan eszközön, amely csak feketét és fehéret tud (nyomtató – „dithering”, „halftone”)? Kvantáljuk a pixelt, és **a kerekítési hibát toljuk tovább a még fel nem dolgozott szomszédokra**:

1. fentről lefelé, balról jobbra haladunk;
2. új érték = 0, ha az aktuális érték a [0, 127] tartományban van, egyébként 1 (ennek reprezentációja **255**);
3. hiba = régi − új (pl. 168 → 1, a hiba 168 − 255 = −87);
4. szétosztás: 7/16 → jobbra, 3/16 → balra le, 5/16 → le, 1/16 → jobbra le.

A lokális átlagos világosság megmarad. Az algoritmus szekvenciális, de párhuzamosítható: egy pixelhez az előző sor 3 és a saját sor 1 pixelének hibája kell, így a sorok párhuzamos szálakon futhatnak **két képpontnyi késleltetéssel**.

## Hisztogram műveletek

A hisztogram a kontrasztról ad információt: a sötét és a világos kép az egyik végén zsúfolódik, az alacsony kontrasztú kép keskeny sávot használ, a jó kontrasztú kép széles tartományt, domináns szint nélkül.

A **hisztogram széthúzás** a kép [min, max] intervallumát lineárisan a [0, L − 1] tartományra skálázza:

s = (L − 1)(r − min) / (max − min)

A **kontraszt széthúzás** ugyanezt egy választott [low, high] ablakkal teszi [min, max] helyett; a kívül eső értékek 0-ra vagy L − 1-re vágódnak.

A **hisztogram kiegyenlítés** (közel) egyenletes hisztogramra törekszik. A leképezés a skálázott halmozott hisztogram:

s = T(r) = (L − 1) · Σ_{j=0}^{r} p(j), kerekítve (a kurzusban: **felfelé a feleknél**)

| r | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| h(r) | 2 | 6 | 10 | 8 | 4 | 2 | 0 | 0 |
| halmozott | 2 | 8 | 18 | 26 | 30 | 32 | 32 | 32 |
| 7 · cdf | 0,44 | 1,75 | 3,94 | 5,69 | 6,56 | 7 | 7 | 7 |
| T(r) | 0 | 2 | 4 | 6 | 7 | 7 | 7 | 7 |

A széthúzás lineáris, és megtartja a hisztogram alakját; a kiegyenlítés nemlineáris – a gyakori szinteket széthúzza, a ritkákat összevonja. Diszkrét esetben az eredmény csak közelítőleg egyenletes: a szintek összevonhatók, de szét nem bonthatók.

```js
const img = IMG.lowcontrast;
const st = lib.stretch(img);                 // min–max → 0…255
const eq = lib.histEq(img).out;              // kiegyenlítés
print('tartomány előtte:', Math.min(...img.flat()), Math.max(...img.flat()));
show(img, 'eredeti'); show(st, 'széthúzva'); show(eq, 'kiegyenlítve');
```

## Teljes képre vonatkozó műveletek

A kimeneti pixel a helyén marad; több kép ugyanazon pozícióját kombinálja:

- **súlyozott összeadás**: O = a · I₁ + (1 − a) · I₂ (két kép információjának kombinálása);
- egy statikus jelenet n zajos képének **átlagolása**: nulla várható értékű additív zajnál a zaj kiátlagolódik (szórása √n-ed részére csökken);
- **kivonás** változásdetektáláshoz: O = |I₁ − I₂|, majd **küszöbölés** (és gyakran a vizsgált térrész maszkja);
- **AND / OR**: az AND a kép adott részét maszkolja ki, az OR egy másik kép adott részét adja hozzá.

## Geometriai transzformációk

A pixelek r sor- és c oszlopkoordinátáját változtatják meg:

- eltolás: r′ = r + t_r, c′ = c + t_c
- skálázás: r′ = s_r · r, c′ = s_c · c
- elforgatás β szöggel (r₀, c₀) körül: r′ = r₀ + (r − r₀)cos β − (c − c₀)sin β, c′ = c₀ + (r − r₀)sin β + (c − c₀)cos β
- affin: r′ = a₁₁r + a₁₂c + b₁, c′ = a₂₁r + a₂₂c + b₂

Három probléma jelentkezik: (1) az eredmény a képen **kívülre** eshet, (2) az input és output pixelei **nem felelnek meg kölcsönösen** egymásnak – az előre térképezés **lyukakat** és átfedéseket hagy, (3) a koordináták **nem egészek**.

A **visszafelé térképezés** a (2)-t oldja meg: a **kimeneti** pixeleken megyünk végig, az **inverz** transzformációval kiszámítjuk a forrást, és onnan olvassuk ki az értéket. Forgatásnál:

r = r₀ + Δr′ cos β + Δc′ sin β,  c = c₀ − Δr′ sin β + Δc′ cos β

A (3) problémát **interpolációval** kezeljük: legközelebbi szomszéd (0-ad rendű), bilineáris (a 4 környező pixel súlyozott átlaga), bikubikus, spline.

```grid
# f(r, c) – a (3, 3) kimenet forrása β = 30°, (2, 2) körül: (3,37; 2,37)
10 20 30 40 50
20 60 90 70 40
30 80* 150* 120 60
40 70* 200* 180 90
50 60 100 110 80
```

A legközelebbi szomszéd f(3, 2) = 80-at ad; a négy kiemelt pixel bilineáris interpolációja ≈ 110.

```js
const img = IMG.shapes;
show(lib.rotateImage(img, 30, 'nearest'), 'legközelebbi szomszéd, visszafelé');
show(lib.rotateImage(img, 30, 'bilinear'), 'bilineáris, visszafelé');
```
