# Sarokpontok, jellemző pontok és mintaillesztés

## Miért lokális jellemzők?

Panorámakép összefűzéséhez, objektumkövetéshez, sztereó párosításhoz vagy egy épület felismeréséhez olyan pontok kellenek, amelyeket egy másik képen **újra megtalálunk**. A jó jellemző pont

- **egyértelmű** – kis környezete egyértelműen azonosítja,
- **ismételhető / robusztus** – túléli az eltolást, forgatást, skálázást, fényességváltozást és a zajt,
- **sok van belőle és olcsó** – képenként több száz, valós időben számolható.

Alkalmazások: képek igazítása (mozaikozás), 3D rekonstrukció, mozgáskövetés, sztereó illesztés, objektumfelismerés, tartalom alapú képkeresés (CBIR), robotnavigáció.

## Homogén, él, sarok: toljuk el az ablakot

Tegyünk egy kis W ablakot a képre, és toljuk el (u, v)-vel:

| Terület | Mi történik, ha W-t eltoljuk |
| --- | --- |
| **„sima” (homogén)** | egyik irányban sincs változás |
| **él** | az él **mentén** nincs változás, rá merőlegesen nagy |
| **sarok** | **minden** irányban szignifikáns változás |

A változást az **SSD hibával** (négyzetes differenciák összege) mérjük:

E(u, v) = Σ_(x,y)∈W ( I(x + u, y + v) − I(x, y) )²

Kis eltolásra a Taylor-sorfejtés: I(x + u, y + v) ≈ I(x, y) + Ix·u + Iy·v, így

E(u, v) ≈ Σ_W (Ix·u + Iy·v)² = [u v] · H · [u v]ᵀ,   H = Σ_W [ Ix²  IxIy ; IxIy  Iy² ] = [A B; B C]

A H (gradiens momentum) mátrix szimmetrikus és pozitív szemidefinit. Sajátvektorai adják E legnagyobb és legkisebb változásának irányát, sajátértékei a változás mértékét:

λ± = (A + C)/2 ± √( ((A − C)/2)² + B² )

| λ+ | λ− | Terület |
| --- | --- | --- |
| kicsi | kicsi | homogén |
| nagy | ≈ 0 | él |
| nagy | nagy | **sarok** |

## Kézi számolás

A kurzusban a deriváltak 2-vel **nem osztott** központi differenciák: Ix(x, y) = f(x+1, y) − f(x−1, y), Iy(x, y) = f(x, y+1) − f(x, y−1) (y lefelé nő). Az A, B, C értékeket a (2n+1)×(2n+1)-es ablakban összegezzük (néha átlagoljuk – osztunk a pixelek számával; a sajátértékek ugyanígy skálázódnak).

```grid
# f: egy sarok 3×3-as ablaka kiemelve
0 0 0 0 0
0 0* 0* 0* 0
0 0* 4* 4* 4
0 0* 4* 4* 4
0 0 4 4 4
```

A (3, 3) középpontban: Ix = [0 0 0; 4 4 0; 4 4 0], Iy = [0 4 4; 0 4 4; 0 0 0] → A = 64, C = 64, B = 16 → λ+ = 80, λ− = 48: sarokpont.

## Két sarokmérték – és egy elnevezési furcsaság

1. **Kisebbik sajátérték:** R = min(λ+, λ−) = λ− > Th. A küszöb az R hisztogramjából jöhet (első völgy). Ezután a legnagyobb értéktől indulva töröljük az elfogadott sarokpont közelében lévő többi jelöltet (nem-maximum elnyomás).
2. **det − k·trace²:** R = det H − k·(trace H)² = AC − B² − k(A + C)², ahol 0 ≤ k ≤ 0,25 (tipikusan 0,04–0,06). Nincs gyökvonás. R > 0 nagy: sarok, R < 0: él, |R| kicsi: homogén. k növelésével a módszer **érzéketlenebb**.

> **Figyelem:** a 6. előadás az 1. módszert *Harris sarokdetektálónak*, a 2.-at *Kanade–Lucas–Tomasi algoritmusnak* nevezi. A szakirodalom (és a legtöbb szoftver) fordítva: **Harris–Stephens** = det − k·trace², **Shi–Tomasi / KLT** = legkisebb sajátérték. A 7. előadás az f = det H / trace H = λ₁λ₂/(λ₁ + λ₂) kifejezést hívja *Harris operátornak*. A ZH-n írd a név mellé a képletet is.

A detektor lépései: gradiens minden pontban → H a gradiensekből (az ablakban összegezve/simítva) → válasz (λ− vagy R) → küszöbölés → lokális maximumok.

## Moravec operátor

Az egész ősatyja: az ablakot **4 irányba** (vízszintes, függőleges, két átló) toljuk el egy pixellel, mindegyikre kiszámítjuk az SSD-t, és a **minimumot** vesszük: V = min(Vh, Vv, Vd, Va). Egy pixel „érdekes”, ha V a környezetében lokális maximum. Élen az él menti eltolás V ≈ 0-t ad. Gyengeségei: csak 4 irány (anizotróp), zajérzékeny, bináris ablak.

## Mintaillesztés

A t mintát összehasonlítjuk a kép minden azonos méretű részletével (végigtoljuk; a helyzet a bal felső sarok vagy a középpont):

| Mérték | Képlet | Legjobb |
| --- | --- | --- |
| SSD | Σ (I₁ − I₂)² | min |
| SAD | Σ abs(I₁ − I₂) | min |
| CC | Σ I₁·I₂ | max |
| NCC | Σ (I₁ − Ī₁)(I₂ − Ī₂) / √(Σ(I₁ − Ī₁)² Σ(I₂ − Ī₂)²) | max (≤ 1) |

SSD = Σ I₁² − 2 Σ I₁I₂ + Σ I₂²: a középső tag a keresztkorreláció. A sima CC-t megtévesztik a világos területek; az **NCC** kivonja az átlagot és normalizál a kontraszttal, így invariáns a fényesség eltolására és erősítésére. Az SSD/SAD-ot **blokkillesztésre** is használjuk mozgásbecslésnél és **sztereó** párosításnál.

```grid
# I – a t = [6 4; 9 8] minta a (3, 2) bal felső saroknál illeszkedik legjobban
3 1 4 1 5
9 2 6* 5* 3
5 8 9* 7* 9
3 2 3 8 4
```

## Próbáld ki

```js
const img = IMG.shapes;
const r = lib.cornerResponse(img, { k: 0.04, avg: true });
// csak az erős válaszokat tartjuk meg
const max = Math.max(...r.harris.flat().filter(v => !Number.isNaN(v)));
const R = r.harris.map(row => row.map(v => (v > 0.1 * max ? 255 : 0)));
show(img, 'kép');
show(R, 'R > a maximum 10 %-a');
```

```js
// mintaillesztés: kivágunk egy részletet, és megkeressük újra
const img = IMG.shapes;
const t = lib.sub(img, 10, 40, 10, 10);   // 10…19. sor, 40…49. oszlop
const m = lib.matchTemplate(img, t);
print('legjobb SSD [sor, oszlop] =', lib.argmin2(m.ssd));
print('legjobb NCC [sor, oszlop] =', lib.argmax2(m.ncc));
```
