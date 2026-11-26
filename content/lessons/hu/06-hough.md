# Hough transzformáció és görbeillesztés

Az éldetektorok az élpontok egy S halmazát adják. Ezután meg kell találni S azon részhalmazait, amelyek **ugyanazon a vonalon vagy görbén** fekszenek, és meg kell határozni a görbe **egyenletét**. Minden pontpár kipróbálása túl lassú. A Hough transzformáció a feladatot a **paramétertérbeli lokális maximumok keresésévé** alakítja.

## Egyenesek az (m, b) térben

Az egyenes: y = m·x + b. Rögzítsünk egy (xᵢ, yᵢ) élpontot: minden rajta átmenő egyenesre

b = yᵢ − m·xᵢ

– ez egy **egyenes az (m, b) síkon**. Egy egyenesre eső képpontok paramétertérbeli egyenesei egy (m, b) pontban metszik egymást.

Algoritmus: osszuk fel az (m, b) teret egy ráccsal, minden cellához egy c(m, b) = 0 számláló; minden élpontra és minden kvantált m-re számoljuk ki b-t, és növeljük c(m, b)-t eggyel; a lokális maximumok az egyenesek.

| pont | m = 0 | m = 1 | m = 2 | m = 3 |
| --- | --- | --- | --- | --- |
| (1, 3) | 3 | 2 | **1** | 0 |
| (2, 5) | 5 | 3 | **1** | −1 |
| (3, 7) | 7 | 4 | **1** | −2 |

Három szavazat az (m, b) = (2, 1) cellára: az y = 2x + 1 egyenes.

**Probléma:** függőleges egyenesekre m = ∞ (és b = ∞) – a paraméterek nem korlátosak.

## Normál (polárkoordinátás) alak

x·cos θ + y·sin θ = ρ

θ az egyenes normálisának iránya, ρ az egyenes (előjeles) távolsága az origótól. θ ∈ [0°, 180°), |ρ| ≤ képátló: korlátos, és bármely irányban numerikusan stabil. Az x = 5 függőleges egyenes egyszerűen θ = 0°, ρ = 5; az y = 2 vízszintes egyenes θ = 90°, ρ = 2. Minden képpont most egy **szinuszgörbe** ρ(θ) mentén szavaz.

A feladatok jelölései: x = oszlop, y = sor, **0-tól indexelve, az origó a bal felső pixel**, y lefelé nő, ρ a legközelebbi egészre kerekítve.

```grid
# élkép, 0-tól indexelt koordináták
0 0 0 1* 0
1* 0 0 1* 0
0 1* 0 1* 0
0 0 1* 1* 0
0 0 0 1* 0
```

| θ | ρ képlete | legerősebb cella |
| --- | --- | --- |
| 0° | ρ = x | ρ = 3: 5 szavazat (az x = 3 oszlop) |
| 45° | ρ = 0,707(x + y) | ρ = 4: 3 szavazat (kerekítési mellékhatás) |
| 90° | ρ = y | 2 szavazat |
| 135° | ρ = 0,707(y − x) | ρ = 1: 4 szavazat (az y = x + 1 egyenes) |

## Algoritmus

1. Készítsünk egy 2D (θ, ρ) számlálótömböt, a szög 0 és 180 fok között (pl. 10°-os lépésekkel), a távolság legfeljebb a képátló; nullázzuk ki.
2. Minden élpontra és minden θ-ra számoljuk ki ρ-t, és növeljük A(θ, ρ)-t.
3. Keressük meg a küszöb feletti lokális maximumokat.
4. A (θ, ρ) párokat konvertáljuk vissza egyenesekké a képen.

Nehézségek: a cellaméret (túl nagy: nem tudunk különbséget tenni vonalak között; túl kicsi: a zaj szétszórja a szavazatokat), hány vonalat találunk, melyik élpont melyik vonalhoz tartozik, zaj.

## Körök és általános görbék

Az (x − x₀)² + (y − y₀)² = r² egyenletben **három** ismeretlen van → 3D számlálótömb: A(x₀, y₀, r). Egyik paramétert rögzítjük, a másik kettőt változtatjuk, növeljük a cellát, lokális maximumot keresünk. A gyakorlatban az élpont **gradiensirányát** (θ) használjuk:

x₀ = x − r·cos θ,  y₀ = y − r·sin θ

így minden pont sugaranként csak egyszer szavaz. Egy p paraméteres y = f(x, a) általános görbéhez p dimenziós A(s₁, …, s_p) számlálótömb kell; a kimenet a görbéket leíró paramétervektorok listája.

## Görbeillesztés: legkisebb négyzetek módszere

Ha már tudjuk, mely pontok tartoznak össze, illesszük a görbét. A **legkisebb négyzetek módszere** a Σ (yᵢ − m·xᵢ − b)² összeget minimalizálja. A deriváltakat nullává téve (normálegyenletek):

m = (n·Σxy − Σx·Σy) / (n·Σx² − (Σx)²),  b = (Σy − m·Σx) / n

Példa: (1, 2), (2, 3), (3, 5), (4, 6): Σx = 10, Σy = 16, Σx² = 30, Σxy = 47 → m = 28/20 = 1,4, b = 0,5.

Ez a **függőleges** távolságokat minimalizálja – meredek egyenesekre rossz (illesszünk x = m′y + b′-t, vagy minimalizáljuk a merőleges távolságokat).

**Parabola** y = a·x² + b·x + c: ugyanez az ötlet, 3 normálegyenlet, bal oldalon Σx⁴, Σx³, Σx², Σx, n, jobb oldalon Σx²y, Σxy, Σy. Minden, a paramétereiben lineáris modell (y = Σ αᵢ·φᵢ(x): polinom-, trigonometrikus, exponenciális interpoláció) ugyanígy illeszthető.

## Split and merge kontúrokra

S = rendezett határpontok, E_max = át nem léphető hibaküszöb.

- **Split (vágás):** ha egy szakasz hibája nagyobb E_max-nál, vágjuk két részre – tipikusan a húrtól legtávolabbi pontnál.
- **Merge (összeolvasztás):** két szomszédos szakaszt egyesítünk, ha az unió hibája is E_max alatt marad (azt a párt választjuk, amely a legkisebb hibanövekedést adja).
- **Igazítás:** rögzített számú szakasz mellett a töréspontokat egy lépéssel balra vagy jobbra toljuk, ha ez csökkenti a két hiba összegét; ismételjük, amíg nincs változás.

Az (x, y) pont távolsága az (x₁, y₁), (x₂, y₂) pontokon átmenő egyenestől: d = |(y₂ − y₁)x − (x₂ − x₁)y + x₂y₁ − y₂x₁| / √((x₂ − x₁)² + (y₂ − y₁)²).

## Próbáld ki

```js
const bin = IMG.lines;                    // 32×32 bináris: egy vízszintes, egy függőleges és egy átlós vonal
const thetas = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165];
const h = lib.houghLines(bin, thetas);
print('legerősebb egyenesek (θ, ρ, szavazat):', h.lines.slice(0, 4).map(l => [l.theta, l.rho, l.votes]));
show(bin, 'élpontok');
show(h.acc, 'számlálótömb (sorok: θ, oszlopok: ρ)');
```

```js
const pts = [[1, 2], [2, 3], [3, 5], [4, 6]];
print(lib.fitLine(pts));                                      // m, b, sse, összegek
print(lib.fitParabola([[-2, 5], [-1, 2], [0, 1], [1, 2], [2, 6]]));
print(lib.splitPolyline([[0, 0], [2, 1], [3, 4], [6, 2], [8, 0]], 0.8)); // töréspontok 0-tól indexelve
```
