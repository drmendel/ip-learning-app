const q = (title, prompt, options, explain) => ({ title, prompt, options, explain });
const c = (title, prompt, answerText) => ({ title, prompt, answerText });

export default {
  title: 'Szűrés és konvolúció',
  lab: '5. előadás',
  exercises: {
    'flt-1': {
      title: '1D konvolúció és korreláció',
      prompt: 'Jel: **f = [2 0 1 3]**, maszk: **g = [1 2 −1]**.\n\nSzámítsd ki a **teljes (kibővített)** 1D **konvolúciót** (f ∗ g) és f és g **teljes korrelációját** (hossz 4 + 3 − 1 = 6; f-en kívül a jel 0).\n\n- Konvolúció: (f ∗ g)(n) = Σ f(i) · g(n − i) – a maszkot **tükrözzük**, majd végigtoljuk f-en.\n- Korreláció: a maszkot **tükrözés nélkül** toljuk végig. Az első kimeneti érték ahhoz a helyzethez tartozik, ahol csak a maszk **utolsó** eleme fedi f(1)-et; az utolsó ahhoz, ahol csak a maszk **első** eleme fedi f(4)-et.',
      labels: { conv: 'f ∗ g (konvolúció)', corr: 'korreláció' },
      hints: [
        'Konvolúció: tükrözd g-t → [−1 2 1], és told végig f-en. Első érték: csak 1·2 fed át → 2.',
        'Korreláció: magát az [1 2 −1]-et told. Első érték: csak az utolsó elem (−1) fedi f(1) = 2-t → −2.',
      ],
      explain: 'Konvolúció (a tükrözött [−1 2 1] maszk balról jobbra halad):\n\n- 2·1 = **2**\n- 2·2 + 0·1 = **4**\n- 2·(−1) + 0·2 + 1·1 = **−1**\n- 0·(−1) + 1·2 + 3·1 = **5**\n- 1·(−1) + 3·2 = **5**\n- 3·(−1) = **−3**\n\n→ f ∗ g = [2 4 −1 5 5 −3].\n\nKorreláció (tükrözetlen [1 2 −1]): −2, 2·2 + 0·(−1) = 4, 2·1 + 0·2 + 1·(−1) = 1, 0·1 + 1·2 + 3·(−1) = −1, 1·1 + 3·2 = 7, 3·1 = 3 → [−2 4 1 −1 7 3].\n\nA korreláció a tükrözött maszkkal vett konvolúció – a kettő azért tér el, mert g **nem szimmetrikus**.',
    },
    'flt-2': {
      title: '2D konvolúció és korreláció',
      prompt: 'Számítsd ki a **nem szimmetrikus** w maszk válaszát az **x = 2, y = 3** pixelben (2. oszlop, 3. sor, 1-től indexelve; a kiemelt cella a maszk origója).\n\n1. **korrelációként**: g(x, y) = Σ w(k, l) · f(x + l, y + k), a maszkot úgy tesszük a képre, ahogy le van írva;\n2. **konvolúcióként** (az előadás definíciója: y(i, j) = Σ h(k, l) · x(i − k, j − l)): a maszkot előbb **180°-kal elforgatjuk**.',
      grids: ['f', 'w (origó = közép)'],
      labels: { corr: 'korreláció (2, 3)-ban', conv: 'konvolúció (2, 3)-ban' },
      hints: [
        'A (2, 3) pixel 3×3-as környezete a 2–4. sor, 1–3. oszlop: [3 5 1; 0 2 4; 1 7 9].',
        'Az elforgatott maszk: [−1 0 0; 0 1 0; 0 2 1].',
      ],
      explain: 'A környezet N = [3 5 1; 0 2 4; 1 7 9].\n\n- Korreláció: 1·3 + 2·5 + 1·2 + (−1)·9 = **6**.\n- Konvolúció: w 180°-os elforgatása → [−1 0 0; 0 1 0; 0 2 1]; (−1)·3 + 1·2 + 2·7 + 1·9 = **22**.\n\nSzimmetrikus maszknál (átlagoló, Gauss, Laplace) a forgatás semmit sem változtat, így a két művelet egybeesik – ezért könnyű elfelejteni a különbséget.',
    },
    'flt-3': {
      title: '3×3-as átlagoló szűrő kézzel',
      prompt: 'Simítsd az 5×5-ös képet a **3×3-as átlagoló (box) szűrővel**: (1/9)·[1 1 1; 1 1 1; 1 1 1]. Csak a **belső 3×3 pixelt** (x, y = 2…4) számold ki, és **kerekíts egészre** (fél felfelé).',
      grids: ['f'],
      labels: { g: 'g (belső 3×3, y = 2…4 sorok)' },
      hints: [
        'g(2, 2) = (12 + 15 + 14 + 10 + 13 + 16 + 11 + 90 + 15) / 9 = 196 / 9.',
        'Jobbra lépve az összeg újrahasznosítható: a bal oszlopot kivonod, az új jobb oszlopot hozzáadod.',
      ],
      explain: 'Ablakösszegek (÷ 9):\n\n| y \\ x | 2 | 3 | 4 |\n| --- | --- | --- | --- |\n| 2 | 196 → 21,8 | 350 → 38,9 | 420 → 46,7 |\n| 3 | 194 → 21,6 | 353 → 39,2 | 424 → 47,1 |\n| 4 | 192 → 21,3 | 349 → 38,8 | 422 → 46,9 |\n\nKerekítve: [22 39 47; 22 39 47; 21 39 47].\n\nMegfigyelhető: a (2, 3)-beli 90-es impulzus nem tűnik el, hanem szétkenődik a környezetében, a 3. és 4. oszlop közti él pedig rámpává válik (39 → 47) – az átlagoló szűrő elmossa az éleket.',
    },
    'flt-4': {
      title: 'Binomiális 5×5-ös szűrő és szeparálhatóság',
      prompt: 'A binomiális szűrő a Gauss-szűrő közelítése. Az n hosszú 1D sor a **Pascal-háromszögből** (vagy [1 1]-gyel vett ismételt konvolúcióval) adódik; a 2D maszk a sor önmagával vett külső szorzata, osztva az összes súly összegével (1/2^(2p), p = n − 1).\n\n**n = 5** esetén add meg:\n\n1. az 1D sort (egészek),\n2. a 2D maszk normáló osztóját,\n3. a **normálatlan** 2D maszk középső súlyát,\n4. pixelenként a szorzások és összeadások számát, ha az 5×5-ös maszkot közvetlenül, 2D-ben alkalmazzuk,\n5. ugyanezt **szeparált** megvalósításnál (egy 1D soronkénti, majd egy 1D oszloponkénti menet).',
      labels: {
        row: '1D sor', div: 'osztó', cw: 'középső súly (normálatlan)',
        m2: '2D: szorzások', a2: '2D: összeadások', m1: 'szeparált: szorzások', a1: 'szeparált: összeadások',
      },
      hints: [
        'Pascal: 1 / 1 1 / 1 2 1 / 1 3 3 1 / 1 4 6 4 1.',
        'Osztó = (a sor összege)² = 16². Egy n elemű 1D menet n szorzás és n − 1 összeadás.',
      ],
      explain: 'Sor: **[1 4 6 4 1]** (összeg 16 = 2⁴). A 2D maszk a külső szorzat, összege 16² = **256**, középső súlya 6·6 = **36** (normálva 36/256 ≈ 0,14).\n\n- Közvetlen 2D: n² = **25** szorzás, n² − 1 = **24** összeadás pixelenként.\n- Szeparált: két 1D menet, 2n = **10** szorzás, 2(n − 1) = **8** összeadás.\n\nA megtakarítás n-nel nő (n² vs 2n). Mivel a súlyok egészek, az előadás szerint a szorzások akár [1 1]-es menetekkel (összeadásokkal) és shiftekkel is kiválthatók.',
    },
    'flt-5': {
      title: 'Gauss-maszk súlyai',
      prompt: 'A Gauss simító maszk arányos a w(x, y) = exp(−(x² + y²) / (2σ²)) függvénnyel, ahol (x, y)-t a maszk közepétől mérjük.\n\n1. **σ = 1** esetén add meg egy sarokcella (x = ±1, y = ±1) **normálatlan** súlyát.\n2. Add meg a teljes **normált** 3×3-as maszkot (a súlyok osztva az összegükkel; 4 tizedes elég).\n3. Az előadás ökölszabálya: maszkmagasság = szélesség ≈ **5σ** (páratlan egészre kerekítve). Mekkora maszk (n×n-es maszk n értéke) tartozik **σ = 1,4**-hez?',
      labels: { corner: 'sarok súlya (σ = 1, normálatlan)', k: 'normált 3×3 maszk (σ = 1)', n: 'n σ = 1,4 esetén' },
      hints: [
        'Közép: e⁰ = 1, élszomszédok: e^(−1/2) ≈ 0,6065, sarkok: e^(−2/2) = e⁻¹ ≈ 0,3679.',
        'Összeg = 1 + 4·0,6065 + 4·0,3679 ≈ 4,8976; minden súlyt ezzel ossz el.',
      ],
      explain: 'Normálatlanul: közép 1, élszomszéd e^(−0,5) ≈ 0,6065, sarok **e⁻¹ ≈ 0,3679**. Az összeg ≈ 4,8976, így a normált maszk\n\n| 0,0751 | 0,1238 | 0,0751 |\n| --- | --- | --- |\n| 0,1238 | 0,2042 | 0,1238 |\n| 0,0751 | 0,1238 | 0,0751 |\n\n(Összege 1, így az átlagos intenzitás megmarad.) σ = 1,4 esetén 5 · 1,4 = 7 → **7×7-es** maszk; nagyobb σ-hoz nagyobb maszk kell, különben a Gauss-függvényt levágjuk, és a szűrő az átlagolóhoz kezd hasonlítani (begyűrűzés).',
    },
    'flt-6': {
      title: 'Medián szűrő impulzuszajon',
      prompt: 'Alkalmazz **3×3-as medián szűrőt** a képre (só-bors zaj: 0 és 255). **A szélső pixelek változatlanok maradnak.** Add meg a teljes 5×5-ös eredményt.',
      grids: ['f'],
      labels: { g: 'medián szűrt kép' },
      hints: [
        'Rendezd sorba az ablak 9 értékét, és vedd az 5.-et.',
        'A (2, 2) ablaka: 20 21 21 22 22 22 23 24 255 → 22.',
      ],
      explain: 'Belső pixelek (rendezett ablak → 5. érték):\n\n- (2, 2): 20 21 21 22 22 22 23 24 255 → **22**\n- (3, 2): 0 21 22 22 22 23 23 24 255 → **22**\n- (4, 2): 0 21 22 22 23 24 24 25 255 → **23**\n- (2, 3) … (4, 4) hasonlóan → 22, 23, 23 / 22, 23, 23.\n\nA belső 0/255 impulzusok mind eltűnnek, a szélsők (0 az (1, 4)-ben, 255 az (5, 3)-ban) megmaradnak, mert a szélt nem dolgozzuk fel. Egy átlagoló szűrő ehelyett minden impulzust 9 pixelre kenne szét.',
    },
    'flt-7': {
      title: 'A medián nem lineáris',
      prompt: 'Adott két 3×3-as ablak. Számítsd ki a mediánokat, és ellenőrizd az előadás állításait: általában median{f₁ + f₂} ≠ median{f₁} + median{f₂}, de median{c · f} = c · median{f}.',
      grids: ['f₁', 'f₂'],
      labels: { m1: 'median{f₁}', m2: 'median{f₂}', m12: 'median{f₁ + f₂}', m3: 'median{3 · f₁}' },
      hints: ['f₁ + f₂ = [10 2 3; 4 5 6; 7 8 18].'],
      explain: 'median{f₁} = **5**, median{f₂} = **0** (hét nulla). f₁ + f₂ = [10 2 3; 4 5 6; 7 8 18], rendezve 2 3 4 5 **6** 7 8 10 18 → **6** ≠ 5 + 0. A skálázás nem változtat a sorrenden, így median{3f₁} = **15** = 3 · 5.\n\nA medián **sorbarendezésen alapuló (rank order), nem lineáris** szűrő: nem írható fel maszkkal (súlyozott összeggel), és **nem** konvolúció.',
    },
    'flt-8': {
      title: 'Laplace-élesítés',
      prompt: 'Élesítsd a képet a Laplace élesítő maszkkal:\n\ng(x, y) = 5·f(x, y) − [f(x+1, y) + f(x−1, y) + f(x, y+1) + f(x, y−1)]  (maszk: [0 −1 0; −1 5 −1; 0 −1 0]).\n\nA **belső 3×3** pixelt számold ki, és az eredményt **vágd** a 0…255 tartományba.',
      grids: ['f', 'maszk'],
      labels: { g: 'g (belső 3×3, vágva)' },
      hints: ['g(3, 2) = 5·40 − (40 + 90 + 40 + 90) = −60 → vágás után 0.'],
      explain: 'Nyers válaszok: [40 −60 190; −60 190 90; 190 90 90]. Vágás után: **[40 0 190; 0 190 90; 190 90 90]**.\n\nHomogén részeken (40 vagy 90) g = f, mert a súlyok összege 1 (5 − 4). A lépcsőnél a sötét oldal sötétebb (alullövés), a világos oldal világosabb (túllövés) lesz: nő az él kontrasztja. A maszk f − ∇²f, ahol ∇²f az előadás 4-szomszédos Laplace-a: f(x+1,y) + f(x−1,y) + f(x,y+1) + f(x,y−1) − 4f(x,y).',
    },
    'flt-9': {
      title: 'Életlenítő maszkolás és felül erősítés',
      prompt: '1D jel: **f = [20 20 20 50 50 50]**. Mosd el a 3 elemű átlagolóval, (1/3)·[1 1 1] (csak a 2…5. pozícióban).\n\nEzután számítsd ki a 2…5. pozícióra:\n\n- az **életlenítő maszkolással** élesített jelet: g_s = f − f̄ (eredeti − elmosott),\n- a **felül erősített** jelet: g_hb = A·f − f̄, **A = 1,5** mellett (= (A − 1)·f + g_s).',
      labels: { b: 'f̄ (2…5. pozíció)', gs: 'g_s', ghb: 'g_hb (A = 1,5)' },
      hints: ['f̄ = [20 30 40 50].', 'g_hb = 0,5·f + g_s.'],
      explain: 'f̄ = [(20+20+20)/3, (20+20+50)/3, (20+50+50)/3, (50+50+50)/3] = **[20 30 40 50]**.\n\ng_s = f − f̄ = [20−20, 20−30, 50−40, 50−50] = **[0 −10 10 0]**: homogén részen nulla, a lépcsőnél negatív/pozitív pár (a nagyfrekvenciás részlet).\n\ng_hb = 1,5·f − f̄ = [30−20, 30−30, 75−40, 75−50] = **[10 0 35 25]** = 0,5·f + g_s: a részletet az eredeti (skálázott) másolatához adjuk, így az alacsony frekvenciák is megmaradnak. A = 1 a sima életlenítő maszkolás.',
    },
    'flt-10': {
      title: 'Korreláció 3×3-as maszkkal',
      prompt: 'Írd meg a `correlate3x3(img, k)` függvényt, amely a 3×3-as `k` maszkot **korrelációként** (tükrözés nélkül) alkalmazza:\n\ng(y, x) = Σ_{i=−1..1} Σ_{j=−1..1} k[i+1][j+1] · img[y+i][x+j]\n\n**A szélső pixeleket változatlanul átmásoljuk.** Nincs kerekítés, nincs vágás. A tesztek élesítő, átlagoló és egy nem szimmetrikus maszkot használnak (így a konvolúció nem megy át).',
      hints: ['Két ciklus a belső pixeleken (1 … h−2, 1 … w−2), kettő a maszk −1 … 1 eltolásain.', 'Az `img`-ből olvass, az `out`-ba írj – az eredményt sose írd vissza abba a képbe, amelyből olvasol.'],
      explain: 'Lényeges, hogy külön kimeneti képbe írjunk („nem önmagába írjuk az eredményt”), különben már szűrt értékeket használnánk fel újra. A konvolúció `k[1 - i][1 - j]` indexeléssel venné a maszkot; a szimmetrikus élesítő és átlagoló maszknál ez ugyanazt adja, a nem szimmetrikus tesztmaszknál viszont nem.',
    },
    'flt-11': {
      title: '3×3-as medián szűrő',
      prompt: 'Írd meg a `median3(img)` függvényt: minden belső pixel helyére a **3×3-as környezetének mediánja** kerül (a 9 értéket rendezd, vedd az 5.-et). **A szélső pixeleket változatlanul átmásoljuk.**',
      hints: ['A `v.sort()` összehasonlító függvény nélkül **szövegként** rendez (100 < 20!). Használd: `v.sort((a, b) => a - b)`.'],
      explain: 'A medián teljesen eltávolítja az elszigetelt 0/255 impulzusokat, és élesen tartja a lépcsős éleket, de törli az 1 pixel széles vonalakat, az egyedi pontokat és a sarkokat. Pixelenként 9 érték rendezése lassabb egy 3×3-as maszknál (buborékrendezéssel csak az 5. elemig: 8 + 7 + 6 + 5 + 4 = 30 lépés).',
    },
    'flt-12': q('Só-bors zaj', 'A képet elszigetelt fekete és fehér pixelek (impulzus- / só-bors zaj) terhelik. Melyik szűrő távolítja el ezeket a legjobban úgy, hogy az élek élesek maradjanak?',
      ['3×3-as átlagoló (box) szűrő', '3×3-as medián szűrő', 'Laplace-élesítés', 'Gauss-szűrő σ = 0,5-tel'],
      'A medián figyelmen kívül hagyja az ablak szélsőértékeit, így egyetlen 0 vagy 255 sosem lesz a kimenet, a lépcsős él pedig megmarad. Az átlagoló szűrők (box, Gauss) szétkenik az impulzust a környezetében és elmossák az éleket; az élesítés pedig még fel is erősíti a zajt.'),
    'flt-13': q('Mikor egyezik a konvolúció és a korreláció?', 'Milyen maszkok esetén ad a konvolúció és a korreláció minden képen pontosan ugyanazt az eredményt?',
      ['Ha a maszk 180°-os elforgatás után változatlan (középpontosan szimmetrikus)', 'Ha a maszk súlyainak összege 1', 'Ha a maszk súlyainak összege 0', 'Soha – a konvolúció mindig tükrözi a képet'],
      'A konvolúció a 180°-kal elforgatott maszkkal vett korreláció. Ha a forgatás nem változtat a maszkon (átlagoló, Gauss, binomiális, Laplace), a kettő azonos. A súlyok összege csak az összfényességet határozza meg (1: az átlag megmarad, 0: homogén rész → 0). A Sobel x maszk nem középpontosan szimmetrikus (előjelet vált), ezért a konvolúciója a korreláció ellentettje.'),
    'flt-14': c('Az aluláteresztő maszkok skálafaktora', 'Miért használunk aluláteresztő (simító) szűrőknél **a maszk súlyainak összegével egyenlő skálafaktort** (pl. 1/9, 1/16, 1/256)?',
      'Az összeggel osztva a **normált súlyok összege 1** lesz (egységnyi DC-erősítés):\n\n- **Megmarad a kép átlagos intenzitása** – a szűrő csak átrendezi az intenzitást, nem világosítja és nem sötétíti a képet.\n- **A konstans terület változatlan marad**: ha a maszk alatt minden pixel c, a kimenet c · Σw / Σw = c.\n- A kimenet a **bemenet tartományában** marad (0…255 közötti értékek súlyozott átlaga is 0…255 közé esik) → nincs túlcsordulás, nem kell utólagos normalizálás.\n\nA faktor nélkül pl. a 3×3-as átlagoló maszk minden homogén területet 9-szeresére növelne. (Élesítő/éldetektáló maszkoknál a súlyok összege ehelyett 1 vagy 0.)'),
  },
};
