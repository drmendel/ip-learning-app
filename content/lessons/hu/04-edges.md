# Éldetektálás

Az **élek** olyan pixelek, ahol (vagy amelyek körül) a kép intenzitásértékei erőteljesen megváltoznak. Okozhatja hirtelen mélységi változás, a felületi normális változása, a megvilágítás (árnyékok) és a visszaverődés változása. Az élek megtalálásával általában az objektumok alakját és helyét is meg tudjuk határozni.

Tipikus élprofilok: **ugrás (lépcső)**, **rámpa**, **gerinc/tető**, **vonal**. A szokásos lépések: zajcsökkentés → élkiemelés → éldetektálás (küszöbölés) → éllokalizálás.

Definíciók:

- **él-normális** – a maximális intenzitásváltozás iránya (a gradiens iránya);
- **él-irány** – merőleges a normálisra (az él erre fut);
- **él-pozíció** – ahol az él a képen elhelyezkedik;
- **élerősség** – mennyire „jó” az él (nagy változás → nagy erősség).

## Deriváltak és differenciák

1D-ben: előrehaladó differencia [−1 1], hátrafelé [1 −1], központi [−1 0 1]. Az első deriváltnak az élnél **maximuma**, a második deriváltnak **nulla átmenete** van.

```grid
# f, x = 1…9 – a másodrendű differencia nulla átmenete x = 5-nél van
10 10 10 20 50* 80 90 90 90
```

d = f(x+1) − f(x) = [0 0 10 30 30 10 0 0], d₂ = f(x+1) − 2f(x) + f(x−1) = [0 10 20 0 −20 −10 0] (x = 2 … 8).

2D-ben a **gradiens** ∇f = (fx, fy). A kurzus jelölései: a maszkokat **korrelációként** alkalmazzuk, **fx = jobb − bal**, **fy = alsó − felső** (y lefelé nő).

- nagyság: euklideszi √(fx² + fy²) vagy Manhattan |fx| + |fy|;
- irány: θ = atan2(fy, fx) (fokban).

## Gradiens operátorok

Az x0 x1 x2 / x3 x4 x5 / x6 x7 x8 pixelszámozással:

| operátor | fx | fy |
| --- | --- | --- |
| központi differencia | x5 − x3 | x7 − x1 |
| **Prewitt** | (x2 + x5 + x8) − (x0 + x3 + x6) | (x6 + x7 + x8) − (x0 + x1 + x2) |
| **Sobel** | (x2 + 2x5 + x8) − (x0 + 2x3 + x6) | (x6 + 2x7 + x8) − (x0 + 2x1 + x2) |
| **Roberts-kereszt** | [1 0; 0 −1] | [0 1; −1 0] |

Sobel = [1 2 1]ᵀ simítás az éllel **párhuzamosan** × rá merőleges [−1 0 1] differencia → szeparálható és kevésbé zajérzékeny; az ára, hogy a meredek élek 2 pixel szélesek lesznek. **Sobel éldetektor**: szűrés, gradiensnagyság, küszöbölés.

```js
const g = lib.sobel(IMG.shapes);
show(g.mag, 'Sobel gradiensnagyság');
show(lib.threshold(g.mag, 150, 255), 'küszöb: 150');
```

## Iránytű maszkok

Nyolc maszk, mindegyik az előző külső gyűrűjének 45°-os elforgatásával adódik (N, NE, E, SE, S, SW, W, NW, azaz É, ÉK, K, DK, D, DNy, Ny, ÉNy). A **maximális** válasz az élerősség, a hozzá tartozó maszk az irány.

- **Robinson**: N = [1 2 1; 0 0 0; −1 −2 −1], NE = [0 1 2; −1 0 1; −2 −1 0], … (az ellentétes maszkok egymás negatívjai, így 4 konvolúció elég).
- **Kirsch**: N = [5 5 5; −3 0 −3; −3 −3 −3], NE = [−3 5 5; −3 0 5; −3 −3 −3], …

## Laplace és LoG (Marr–Hildreth)

∇²f = ∂²f/∂x² + ∂²f/∂y², maszk: [0 1 0; 1 −4 1; 0 1 0]. Ahol a gradiens maximális, ott a második derivált előjelet vált → a **nulla átmenetek** az élek ({+,−}, {+,0,−}, {−,+}, {−,0,+}). Csak az él helyét kapjuk meg, az irányát nem; izotróp; nagyon zajérzékeny → előtte simítani kell.

**LoG** – a Gauss-szűrő Laplace-a: ∇²(f ∗ g) = (∇²g) ∗ f, ∇²g ∝ (r² − 2σ²)/σ⁴ · exp(−r²/2σ²), a „mexikói kalap”. Stabil nulla átmenetek elmosódott éleknél is; nagyobb σ → kevesebb, durvább él.

## Canny éldetektor

Feltételezés: lépcsős élek, Gauss-zaj; cél: minden valódi élt detektáljon és hamisat ne, pontosan lokalizáljon, minden élt pontosan egyszer jelezzen.

1. **Gauss-simítás**: J = I ∗ G.
2. **Gradiens**: E_s = √(Jx² + Jy²) (élerősség), E_o = arctan(Jy/Jx) (élnormális).
3. **Nem-maximumok elnyomása**: E_o kvantálása 0°, 45°, 90°, 135°-ra; ha E_s kisebb a két ilyen irányú szomszéd valamelyikénél → 0. Az élek egy pixel vastagok lesznek.
4. **Hiszterézises küszöbölés** l < h küszöbökkel: ≥ h → él; < l → nem él; a kettő között → csak akkor él, ha élpixelhez kapcsolódik.

Figyelj a szomszédokra, mert y **lefelé** mutat: 45°-nál a **jobb alsó és a bal felső**, 135°-nál a bal alsó és a jobb felső szomszéddal hasonlítunk.

```grid
# I_N a nem-maximumok elnyomása után; l = 40, h = 100: a 120–60–70–50–110–55–90 lánc megmarad, a 45 és a 80 nem
0 0 120* 0 0 0
0 60* 0 0 45 0
0 70* 0 0 0 30
0 0 50* 110* 0 0
80 0 0 0 55* 90*
```

```js
const img = lib.correlate(IMG.noisy, lib.gaussKernel(5, 1.2), 'replicate');
const g = lib.sobel(img, 'replicate');
const thin = lib.nonMaxSuppression(g.mag, g.dir);
show(thin, 'nem-maximumok elnyomása után');
show(lib.hysteresis(thin, 60, 160), 'hiszterézis 60 / 160');
```

## SUSAN

Nem differenciáló él- és sarokpont-detektor (Smith és Brady). Minden pixel (a **nucleus**, középpont) körül megszámoljuk a maszk azon pixeleit, amelyek intenzitása hasonló hozzá:

C(r, r₀) = 1, ha |I(r) − I(r₀)| ≤ t, egyébként 0;  n(r₀) = Σ C(r, r₀) (az **USAN** terület)

Élválasz: R(r₀) = g − n(r₀), ha n(r₀) < g, egyébként 0, a g = ¾ n_max geometriai küszöbbel (sarokpontokhoz kisebb g). A *legkisebb* USAN jelöli az élt. Sima változat (LUT-tal): C = exp(−((I(r) − I(r₀))/t)⁶).

## Elvárt helyzetű élszakaszok detektálása

Ha nagyjából tudjuk, hol és milyen irányban van az él (pl. ipari ellenőrzés), az élszakaszt egy **adott futamra merőleges** irányban keressük:

1. **Levetítés a futam irányára**: az intenzitásokat **az elvárt él mentén** összegezzük (függőleges élnél oszlopösszegek; egyenlő magas oszlopoknál nem osztunk).
2. **Élerősség tömb** a futam mentén differenciáló szűrővel (pl. [−1 0 1]; nagyobb maszk simít).
3. **Élszakasz meghatározása**: |e| lokális maximumai egy minimális küszöb felett.
4. **Élfeltételek vizsgálata**: minimális élerősség, elvárt élpozíció, élpárnál az elvárt távolság, polaritás (világosból sötétbe vagy fordítva), esetleg súlyozott élkiértékelési függvény.

**45°-os élnél** az x + y = k mellékátlók mentén összegzünk. Olyan sávot használunk, amelyben minden mellékátlón **ugyanannyi cella** van, így az összegek összehasonlíthatók maradnak:

```grid
# sáv: 4 ≤ x+y ≤ 12, −2 ≤ x−y ≤ 3: minden mellékátlón 3 cella; az él x + y = 8-nál
28 30 32* 29* 31 38 80
31 28* 30* 32* 39* 81 113
29* 31* 28* 40* 82* 114* 121
32 29* 41* 78* 115* 122* 119*
30 42 79* 116* 118* 120* 122*
38 80 117 119* 121* 118* 120
81 113 120 122 119* 121 118
```

S(k) = [89 90 89 120 239 345 359 360 359] (k = 4 … 12), e(k) = S(k+1) − S(k−1) = [0 30 150 225 120 15 0] → az él az **x + y = 8** egyenesen van.
