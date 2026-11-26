# Küszöbölés és szegmentálás

A szegmentálás a képet értelmes részekre bontja. A legegyszerűbb eszköz a **küszöbölés**, egy hisztogramra épülő pont alapú művelet; a régió alapú módszerek (címkézés, régió növelés, split and merge) a környezetet is felhasználják.

## Hisztogram – ismétlés

- **h(r_k) = n_k** – az r_k szürkeárnyalatú pixelek száma, k = 0 … L−1.
- **Normalizált hisztogram:** p(r_k) = n_k / n – az r_k szint valószínűsége; Σ p = 1.
- A homogén régiók **erős csúcsokat** adnak; az objektumokat a **völgyeknél** lehet szétválasztani. A valós hisztogram zajos → előbb simítsuk (1D átlagoló vagy Gauss-szűrő).

## Küszöbölés

Alapfeltevések: az objektum és a háttér **eltérő, homogén** intenzitású (nagy kontraszt); a két halmaz átlagos intenzitásának eltérése legyen a lehető legnagyobb.

Sötét objektum világos háttéren (az előadás jelölése):

- f(x, y) ≤ T → t(x, y) = 1 (objektum)
- f(x, y) > T → t(x, y) = 0 (háttér)

| Típus | A küszöb függ | Példa |
| --- | --- | --- |
| Globális | T = T{I(x, y)} | rögzített T, Otsu, Isodata |
| Lokális | T = T{A(x, y), I(x, y)} | A = lokális tulajdonság (átlag, σ) |
| Dinamikus | T = T{x, y, A(x, y), I(x, y)} | ablakátlag − C, Niblack |

**Többszintű:** f < T₁ → 255, T₁ ≤ f < T₂ → 128, egyébként 0 – könnyű, ha a hisztogramnak erős csúcsai és mély völgyei vannak.

**Küszöbölés p-ed résznél (p-tile):** ha tudjuk, hogy az objektum a kép p %-át fedi, azt a legkisebb T-t választjuk, amelynél a kumulatív hisztogram eléri a p·N értéket.

**Hiszterézises küszöbölés** (nincs „tiszta” völgy): két küszöb a völgy két szélénél. T_felső felett → objektum, T_alsó alatt → háttér, a kettő között → objektum, ha kapcsolódik objektumpixelhez.

```grid image
# T_alsó = 100, T_felső = 180: a sarokban lévő 110 elszigetelt
20 120 130 30 20
40 190* 110 20 140
30 150 60 20 150
20 40 130 40 160
110 20 30 200* 30
```

## Isodata (idén opcionális)

1. T₀ = felezőpont (pl. 128, vagy (min + max)/2).
2. μ_alsó = a ≤ T értékek átlaga, μ_felső = a > T értékek átlaga.
3. T_{k+1} = (μ_alsó + μ_felső)/2; vége, ha T_{k+1} = T_k.

Jól használható, ha az előtér és a háttér kb. ugyanannyi pixelből áll.

## Otsu-algoritmus

Azt a T-t választjuk, amely **maximalizálja az osztályok közötti varianciát** (ekvivalensen minimalizálja az osztályon belülit – összegük, a teljes variancia, nem függ T-től). p_i = n_i / N mellett:

- q_B(T) = Σ_{i≤T} p_i,  q_O(T) = 1 − q_B(T)
- μ(T) = Σ_{i≤T} i·p_i,  μ = Σ_i i·p_i (globális átlag)
- μ_B = μ(T)/q_B,  μ_O = (μ − μ(T))/q_O
- **σ_B²(T) = q_B·(μ_B − μ)² + q_O·(μ_O − μ)² = (μ·q_B(T) − μ(T))² / (q_B(T)·q_O(T))**

Kézi számolás: T-t a hisztogram elejéről indítjuk, q_B és μ(T) halmozott összegét visszük tovább; a legjobb T ott van, ahol σ_B² maximális. **Bimodális** hisztogramot feltételez; nem jó nagyon eltérő méretű osztályoknál és változó megvilágításnál.

| T | q_B | μ(T) | σ_B² |
| --- | --- | --- | --- |
| 2 | 0,6 | 0,65 | 4,420 |
| 3 | 0,65 | 0,8 | **4,573** |
| 4 | 0,675 | 0,9 | 4,468 |

(hisztogram: 6, 10, 8, 2, 1, 4, 7, 2 → μ = 2,8, Otsu-küszöb T = 3)

## Lokális / dinamikus küszöbök (a Niblack opcionális)

- **Átlag − C:** T(x, y) = a k×k-s ablak átlaga − C.
- **Niblack:** T(x, y) = μ(x, y) + k·σ(x, y); sötét objektumra k < 0, világosra k > 0, |k| ≈ 0,2 … 0,5; ablak ≈ 15×15 – elég kicsi a részletekhez, elég nagy a zaj ellen.
- Utófeldolgozás: a kis átlagos élgradiensű „ghost” objektumok törlése.
- Egyenetlen megvilágításnál a kép egyszerű függvénnyel (pl. ferde síkkal) is modellezhető, és a sík feletti/alatti intenzitás szerint küszöbölünk.

```js
const T = lib.otsu(lib.histogram(IMG.noisy)).T;
show(IMG.noisy, 'bemenet');
show(lib.threshold(IMG.noisy, T + 1, 255, 0), 'Otsu, T = ' + T);
const nb = lib.niblack(IMG.noisy, 15, 0.2);
show(IMG.noisy.map((r, y) => r.map((v, x) => (v > nb[y][x] ? 255 : 0))), 'Niblack 15×15');
```

## Régió szegmentálás

Olyan R₁ … Rₙ összefüggő régiókat keresünk, hogy **∪ Rᵢ = I**, **Rᵢ ∩ Rⱼ = ∅**, és teljesüljön egy hasonlósági feltétel: **P(Rᵢ) = 1** (azonos intenzitás, max − min ≤ küszöb, kis szórás, …). Sikeres a szegmentálás, ha a régiók homogének, lyukmentesek, a szomszédok jelentősen eltérnek, a határok egyszerűek és pontosak.

Módszerek: küszöböléses, él-alapú, régió-alapú, illesztésen alapuló.

### Kapcsolódó komponensek címkézése

- **Rekurzív:** bejárjuk a képet; egy címkézetlen 1-esnél új címkét kezdünk, és rekurzívan minden kapcsolódó 1-es szomszédnak odaadjuk.
- **Soros (kétmenetes):** az 1. menet a már bejárt szomszédokból (8-szomszédságnál bal, bal felső, felső, jobb felső) ad ideiglenes címkét, és feljegyzi az **ekvivalenciákat**, ahol két címke találkozik; a 2. menet minden címkét az ekvivalenciaosztálya képviselőjére cseréli.
- A **4- és 8-szomszédság** eltérő darabszámot ad: az átlós érintkezés csak 8-szomszédsággal köt össze.

```grid image
# 4-szomszédság: 7 komponens, 8-szomszédság: 5
1 1 0 0 1 0 1
0 1 0 1 1 0 1
0 0 1* 0 0 0 1
1 0 0 0 1 1 1
1 1 0 0 0 0 0
0 0 0 1 0 1 0
```

### Régió növelés, split and merge, fagocita

- **Seed segmentation:** a hisztogram simítása, jó csúcsok (peakiness teszt) és völgyek keresése, küszöbölés, majd a kapcsolódó komponensek címkézése.
- **Régió növelés:** a magpontból hozzáadjuk a feltételt teljesítő szomszédokat (pl. |f − f(mag)| ≤ tol). Mindig összefüggő.
- **Split and merge:** a nem homogén régiót 4 részre vágjuk (quad tree: szürke/fekete/fehér csomópontok), a hasonló szomszédokat összeragasztjuk, megállunk, ha egyik sem lehetséges. A **régió szomszédsági gráf** tartja nyilván a szomszédokat.
- **Fagocita:** a **gyenge határokat** szünteti meg. Egy „crack edge” határpont gyenge, ha |I(x_R1) − I(x_R2)| < T; összeolvasztunk, ha W / min(P₁, P₂) ≥ T₂ vagy W / |határ| ≥ T₃.
- **Valószínűségi arány teszt:** H₁ egy régió vs H₂ két régió Gauss-eloszlású intenzitással; összeragasztunk, ha az arány a küszöb alatt van.

```js
const lab = lib.labelComponents(lib.threshold(IMG.shapes, 128), 8);
print('objektumok:', lab.count);
show(lab.labels.map((r) => r.map((v) => v * 50)), 'címkék');
show(lib.regionGrow(IMG.noisy, [20, 20], 40).map((r) => r.map((v) => v * 255)), 'régió a (20, 20) pontból');
```

## Régió- vs él-alapú

| | Éldetektálás | Régiószegmentálás |
| --- | --- | --- |
| Határ | általában nem zárt | zárt |
| Művelet | lokális | globális |
| Több jellemző (mozgás, textúra) | keveset segít | sokat segít |
| Határpontok helyzete | pontos | nem pontos |

Él-alapú szegmentálás: simítás → lokális élkiemelés → él-korrekció (hiszterézis, nem-maximális élek elnyomása, **él-relaxáció**, **él-kapcsolás** hasonló gradiens nagyság és irány alapján) → csoportosítás.
