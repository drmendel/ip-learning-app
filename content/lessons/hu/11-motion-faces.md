# Optikai áramlás és arcdetektálás

## Mozgás a képeken

A valós (3D) mozgás képsíkra vetítése 2D mozgást ad – az információ redukálódik. Legalább **két kép** kell a meghatározásához. Alkalmazások: mozgásdetektálás (a két képkocka különbsége ≈ 0, ahol nincs mozgás), objektumkövetés, kameramozgás-korrekció (stabilizálás), mozaikozás / panorámakép, mozgó objektumok szegmentálása, struktúra meghatározása mozgás alapján (3D alak), videótömörítés.

- **Mozgásmező:** a jelenet pontjai valódi 3D sebességének 2D vetülete.
- **Optikai áramlás:** a **fényességminta** látszólagos mozgása. Az „optikai áramlás” és az „optikai folyam” szinonimák.
- A kettő eltérhet: az egyenletesen forgó gömbnek van mozgásmezője, de nincs optikai áramlása; a mozgó fényforrás mozgásmező nélkül okoz optikai áramlást; a TV illuzórikus mozgáson alapszik; a forgó rúd az apertúra-hatást mutatja.

## Kiinduló feltevések és az áramlási egyenlet

1. **Konstans fényesség (intenzitás-állandóság):** I(x, y, t) = I(x + δx, y + δy, t + δt).
2. **Térbeli összetartozás:** a szomszédos pixelek ugyanahhoz a felülethez tartoznak, és hasonlóan mozognak.
3. **Időbeli összetartozás:** a mozgás fokozatosan változik.

A jobb oldalt elsőrendű Taylor-sorba fejtjük, δt-vel osztunk, u = δx/δt, v = δy/δt:

**Ix·u + Iy·v + It = 0**

Ix, Iy: a térbeli gradiens; It: két egymás utáni kép különbsége. Egy egyenlet, két ismeretlen → a megoldás valahol egy **egyenesen van az (u, v) síkon**: v = −(Ix/Iy)·u − It/Iy.

### Apertúra probléma

Az áramlásnak csak a **gradiens irányú** (az élre merőleges) összetevője mérhető:

**normál folyam = −It / |∇I|**, iránya ∇I / |∇I|, |∇I| = √(Ix² + Iy²)

A párhuzamos (él menti) összetevő ismeretlen. Példa: Ix = 3, Iy = 4, It = −10 → normál folyam 2, vektora (1,2; 1,6); a (2; 1) és a (0; 2,5) ugyanúgy kielégíti az egyenletet.

## Lucas–Kanade-módszer

Egy kis ablakban ugyanazt az (u, v)-t feltételezzük, és a Σ(Ix·u + Iy·v + It)² összeget minimalizáljuk:

| ΣIx²  ΣIxIy | · | u | = − | ΣIxIt |
| --- | --- | --- | --- | --- |
| ΣIxIy  ΣIy² | | v | | ΣIyIt |

A·u = B → u = A⁻¹B. det = ΣIx²·ΣIy² − (ΣIxIy)² mellett:

- u = (ΣIy²·(−ΣIxIt) − ΣIxIy·(−ΣIyIt)) / det
- v = (ΣIx²·(−ΣIyIt) − ΣIxIy·(−ΣIxIt)) / det

A a struktúratenzor (Harris!). Egyenes élen det A = 0 → apertúra probléma; homogén részen A ≈ 0. Csak sarkokban / textúrált ablakokban megbízható.

```grid
# Ix egy 3×3-as ablakban (Iy-nal és It-vel → u = 1, v = −1)
1 2 1
2 3 2
1 2 0
```

## Horn–Schunck-módszer

Konstans intenzitás **és az áramlás simasága**. Minimalizáljuk:

E = Σ (Ix·u + Iy·v + It)² + λ·(u_x² + u_y² + v_x² + v_y²)

A Laplace-tagot ∇²u ≈ ū − u közelíti (ū = a 4 szomszéd átlaga). A két lineáris egyenletet megoldva az iteráció:

- P = Ix·ū + Iy·v̄ + It, D = λ + Ix² + Iy²
- **u = ū − Ix·P/D,  v = v̄ − Iy·P/D**

A deriváltakat egyszer előre kiszámoljuk, kezdetben u = v = 0, és minden iterációban a szomszédokból újraszámoljuk ū-t, v̄-t. (Schunck módszere 8 szomszéd feltételi egyeneseinek metszéspontjait keresi, és a legnagyobb klasztert veszi.)

## Nagy mozgások: piramisok

Mindkét módszer csak **kis mozgásokra** működik (a Taylor-közelítés és a deriváltak nem érvényesek), és homogén részeken nem alkalmazható. Nagy mozgásnál mindkét képből **Gauss-piramist** építünk: a legdurvább szinten a mozgás kicsi (10 px → 5 → 2,5 → 1,25 px), itt számítjuk az áramlást, majd megduplázva kiindulásként használjuk a következő finomabb szinten.

```js
// Lucas–Kanade a mozgó folton: frame2 = frame1 1 pixellel jobbra tolva
const a = IMG.frame1, b = IMG.frame2;
const Ix = [], Iy = [], It = [];
for (let y = 9; y <= 15; y++) for (let x = 5; x <= 9; x++) {   // ablak a folt középpontjától balra
  Ix.push((a[y][x + 1] - a[y][x - 1]) / 2);
  Iy.push((a[y + 1][x] - a[y - 1][x]) / 2);
  It.push(b[y][x] - a[y][x]);
}
const r = lib.lucasKanade(Ix, Iy, It);
print('u =', r.u.toFixed(2), 'v =', r.v.toFixed(2), 'det =', r.det.toFixed(0));
show(a, '1. képkocka'); show(b, '2. képkocka');
```

## Viola–Jones-arcdetektálás

- **Haar-szerű jellemzők:** Σ(fehér téglalap) − Σ(fekete téglalap) egy 24×24-es részablakban (fehér +1, fekete −1).
- **Integrálkép:** ii(x, y) = Σ_{x'≤x, y'≤y} i(x', y'), egy bejárással: s(x, y) = s(x, y−1) + i(x, y), ii(x, y) = ii(x−1, y) + s(x, y). A D téglalap: ii(4) − ii(3) − ii(2) + ii(1); 1 téglalap = 4 hivatkozás, 2 = 6, 3 = 8, 4 = 9.

```grid
# i(x, y) → ii; az x = 2…4, y = 2…3 téglalap: 20 − 6 − 5 + 1 = 10
1 2 0 3
4 1* 2* 1*
0 3* 1* 2*
2 1 4 1
```

- **AdaBoost** („gyenge szakértők csapata”): egyenlő súlyokkal indulunk; minden körben a legkisebb súlyozott hibájú (ε) gyenge osztályozót (jellemző + küszöb + polaritás) választjuk; **α = ½·ln((1 − ε)/ε)**; w_i ← w_i·e^(−α·y_i·h_i), normalizálás – a hibásan osztályozott minták nehezebbek lesznek. A végső osztályozó: H(x) = sign(Σ α_t·h_t(x)). Az 50 %-nál rosszabb szakértő válaszait megfordítjuk; a pontosan 50 %-os használhatatlan.
- **Kaszkád:** az egyszerű, gyors fokozatok a nem arc ablakok többségét elvetik; csak a jelöltek jutnak el az összetett fokozatokig. 38 szint, 6061 jellemző, valós idő.
- Korlátok: drága csúszó ablak (pozíciók × orientációk × skálák), rögzített nézőpont, nem merev objektumok, kitakarás, hatalmas tanítóhalmaz.

## Arcfelismerés

- **Azonosítás (1:N):** „ki ez?” – összevetés minden regisztrált személlyel. **Verifikálás (1:1):** „tényleg X ez?” – összevetés egyetlen mintával.
- Biometrikus folyamat: szenzor → jellemzőkiemelés → feltöltés az adatbázisba / illesztés.
- **Arcdetektálási módszerek:** ismeret alapú (top-down szabályok, pl. vízszintes/függőleges vetületek), jellemző alapú (bottom-up: szemek, orr, száj, élek, bőrszín, ellipszisillesztés), mintaillesztéses, megjelenés alapú (tanított osztályozók: Viola–Jones, szín YCrCb-ben, …).
- **Felismerés:** holisztikus (az egész arc: **sajátarcok / PCA**), jellemző alapú (Gábor-waveletek + elasztikus gráfillesztés), hibrid.
- **Sajátarcok:** kivonjuk a ψ átlagarcot, kiszámítjuk a kovarianciamátrix (legnagyobb sajátértékű) sajátvektorait → arctér; egy arcot az ω_k = u_kᵀ(x − ψ) súlyok írnak le; a legközelebbi tárolt ω alapján ismerünk fel.

```js
// Négy 4 pixeles „arc” PCA-ja
const faces = [[130, 110, 110, 90], [90, 130, 70, 110], [120, 100, 100, 80], [60, 140, 40, 120]];
const p = lib.pca(faces, 2);
print('átlagarc', p.mean);
print('sajátértékek', p.values.map((v) => v.toFixed(1)));
print('1. sajátarc', p.components[0].map((v) => v.toFixed(3)));
```
