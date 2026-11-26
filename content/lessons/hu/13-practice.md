# Gyakorló feladatsorok

Ez a modul a félév során kiadott **négy gyakorló feladatsor összes feladatát** tartalmazza, az eredeti pontszámokkal. Ezek állnak a legközelebb a ZH gyakorlati részéhez, ezért **előbb papíron oldd meg** őket, és csak utána írd be az eredményeket ellenőrzésre.

| Feladatsor | Téma | Feladatok | Pont |
| --- | --- | --- | --- |
| 1. *Gyakorló feladat az eddigi témakörökből* (5. téma) | hisztogram, kiegyenlítés, Sobel, medián | 1a, 1b, 2a–c, 3 | 8 + 12 + 3 |
| 2. *Korábbi képfeldolgozás témákhoz gyakorló feladat* (8. téma) | Hough transzformáció, jellemző pont (H mátrix) | 1, 2 | 10 + 12 |
| 3. *Objektum leírása és mozgatása transzformációk használatával* (9. téma) | leírómátrix, transzformáció sorozat | 1a, 1b | 10 |
| 4. *Gyakorló feladatok* (11. téma) | alakszám, Isodata (opcionális), Hu-invariánsok, szignatúra | 1–4 | 6 + 6 + 12 + 8 |

## Itt rögzített konvenciók

A feladatlapok néhány részletet nyitva hagynak. Hogy a válaszok ellenőrizhetők legyenek, a feladatok ezeket rögzítik. A ZH-n is mondd ki őket:

- **Koordináták**: x = oszlop (→), y = sor (↓), 1-től, mint a ZH-n. A Hough- és az |i − j| feladat 0-tól indexel, ahogy a lapon.
- **Sobel** (1. lap 2.): a maszkokat korrelációként alkalmazzuk, fx = jobb − bal, fy = alsó − felső, a képen kívül nulla. A „két távolságfogalom” az **euklideszi** √(fx² + fy²) és a **Manhattan** |fx| + |fy| norma.
- **Medián** (1. lap 3.): a határpixeleket változatlanul átmásoljuk, ahogy a lap kéri.
- **Hough** (2. lap 1.): x·cosθ + y·sinθ = ρ, θ ∈ {0°, 45°, 90°, 135°}, ρ egészre kerekítve.
- **H mátrix** (2. lap 2.): a lapról elveszett a kiemelés, ezért a „jelzett terület” itt a középső 2 × 2-es blokk. A deriváltak központi differenciával számolódnak, [−1 0 1] (2-vel osztás nélkül). H a 3 × 3-as ablakon átlagolva.
- **Félkocka** (3. lap): a csúcsok számozását és a célhelyzetet a feladat megadja. A célhelyzet a lap második ábráját követi: a hasáb az átlós lapján fekszik.
- **Isodata** (4. lap 2.): a lap szerint ez a feladat *nem része az idei anyagnak*. Opcionálisként benne hagytuk; a Niblack részt kihagytuk.

## Módszer-emlékeztető

**Hisztogram kiegyenlítés.** s = round((L − 1) · cdf(r)), ahol cdf(r) = (az r-nél nem nagyobb pixelek száma) / n.

```grid
# az 1. lap képe (L = 8)
0 1 5 5 5 5 5 0
1 1 1 4 5 5 5 4
1 0 0 1 6 6 6 4
1 0 0 3 6 6 6 4
1 0 3 3 6 4 4 7
0 0 3 2 6 4 4 4
0 2 2 2 6 4 4 4
0 2 2 2 4 6 4 0
```

**A H mátrix kisebbik sajátértéke.** H = [A B; B C] esetén:

λ± = (A + C)/2 ± √(((A − C)/2)² + B²)

- Homogén terület: mindkét sajátérték kicsi.
- Él: az egyik nagy, a másik kicsi.
- Sarok (jellemző pont): mindkettő nagy, ezért a **kisebbik** (λ−) dönt.

**Transzformáció sorozatok.** Írd fel a leírómátrixot (4 × n, csúcsonként egy oszlop). Minden elemi transzformáció **balról** szorozza (aktív szemlélet, bázishoz képest), így az eredő T = Mₙ · … · M₁. Hogy a test a talaj fölött maradjon, **a talajjal érintkező él körül** forgass: told az élt a tengelyre, forgass, majd told vissza.

**Lánckód → alakszám.** Számold ki a differenciát: dᵢ = (cᵢ − cᵢ₋₁) mod 8, körkörösen (d₀ az utolsó elemet használja). Az alakszám a differencia kód azon elforgatása, amely a legkisebb számot adja.

**Nyomatékok.** Terület μ00, súlypont x̄ = m10/m00, ȳ = m01/m00.

- Centrális nyomatékok: μ_pq = Σ (x − x̄)ᵖ (y − ȳ)^q.
- Normalizált: η_pq = μ_pq / μ00^((p+q)/2+1).
- Hu-invariánsok: φ1 = η20 + η02, φ2 = (η20 − η02)² + 4η11².
- Főtengely: tan 2θ = 2μ11 / (μ20 − μ02).

Bármelyiket ellenőrizheted a Képlaborban:

```js
const B = lib.parseGrid(`0 0 1 1 1 0 1 1 0 0
0 0 0 1 1 1 1 0 0 0
0 0 0 1 1 1 1 0 0 0
0 0 0 0 0 1 1 0 0 0`);
const m = lib.moments(B, 1);
print('terület', m.area, 'súlypont', m.xc, m.yc);
print('mu20, mu02, mu11', m.mu['20'], m.mu['02'], m.mu['11']);
print('Hu', m.hu[0], m.hu[1], 'theta', m.theta);
```

(A fenti sorok csak az objektum sorai. A súlypont ezért eltolódik a teljes laphoz képest, de a centrális nyomatékok és a Hu-invariánsok ugyanazok, mert eltolásra invariánsak.)
