const q = (title, prompt, options, explain) => ({ title, prompt, options, explain });
const c = (title, prompt, answerText) => ({ title, prompt, answerText });

export default {
  title: 'Éldetektálás',
  lab: '6. előadás',
  exercises: {
    'edg-1': {
      title: '1D differenciák és a nulla átmenet',
      prompt: 'Vízszintes intenzitásprofil (x = 1 … 9):\n\n**f = [10 10 10 20 50 80 90 90 90]**\n\n1. Előrehaladó differencia: **d(x) = f(x+1) − f(x)**, x = 1 … 8.\n2. Másodrendű differencia: **d₂(x) = f(x+1) − 2f(x) + f(x−1)**, x = 2 … 8.\n3. Melyik x-nél van a másodrendű differencia **nulla átmenete** (az él helye)?',
      labels: { d: 'd(x), x = 1…8', d2: 'd₂(x), x = 2…8', x0: 'nulla átmenet: x =' },
      hints: ['d = [0 0 10 30 30 10 0 0].', 'd₂ +-ból −-ba vált előjelet, és pontosan egy mintánál 0.'],
      explain: 'd = [0 0 10 30 30 10 0 0] – az első derivált az egész rámpán nagy (vastag él).\n\nd₂ = [0 10 20 0 −20 −10 0] (x = 2 … 8): a rámpa alján pozitív, a tetején negatív, és **x = 5-nél 0** a +20 és −20 között (az előadás {+, 0, −} esete). A nulla átmenet az él közepét jelöli, ahol az első derivált maximális (f(5) = 50, az f(6) − f(4) = 60 központi differencia a legnagyobb).',
    },
    'edg-2': {
      title: 'Sobel, Prewitt és Roberts egy pixelben',
      prompt: 'Számítsd ki a gradienst a 3×3-as környezet **középső pixelében** (a maszkokat **korrelációként** alkalmazzuk; fx = jobb − bal, fy = alsó − felső, y lefelé nő).\n\n- **Sobel**: fx, fy, a gradiens nagysága **euklideszi** √(fx² + fy²) és **Manhattan** |fx| + |fy| normával, valamint az irány θ = atan2(fy, fx) fokban.\n- **Prewitt**: fx, fy.\n- **Roberts-kereszt** azon a 2×2-es ablakon, amelynek bal felső pixele a középső pixel: r₁ = f(x, y) − f(x+1, y+1), r₂ = f(x+1, y) − f(x, y+1).',
      grids: ['f (3×3-as környezet)'],
      labels: {
        sx: 'Sobel fx', sy: 'Sobel fy', mag: '√(fx² + fy²)', mag1: '|fx| + |fy|', dir: 'θ (fok)',
        px: 'Prewitt fx', py: 'Prewitt fy', r1: 'Roberts r₁', r2: 'Roberts r₂',
      },
      hints: [
        'Sobel fx = (x2 + 2·x5 + x8) − (x0 + 2·x3 + x6) = (60 + 180 + 100) − (10 + 40 + 40).',
        'A Roberts-ablak: [50 90; 80 100].',
      ],
      explain: 'Pixelszámozás x0 … x8 soronként: 10 20 60 / 20 50 90 / 40 80 100.\n\n- Sobel fx = (60 + 2·90 + 100) − (10 + 2·20 + 40) = 340 − 90 = **250**; fy = (40 + 2·80 + 100) − (10 + 2·20 + 60) = 300 − 110 = **190**.\n- Euklideszi nagyság √(250² + 190²) = √98600 ≈ **314,0**; Manhattan 250 + 190 = **440**.\n- θ = atan2(190, 250) ≈ **37,2°** – a gradiens jobbra-lefelé mutat (a világos jobb alsó sarok felé); maga az él erre merőleges.\n- Prewitt (1 1 1 súlyok): fx = (60 + 90 + 100) − (10 + 20 + 40) = **180**, fy = (40 + 80 + 100) − (10 + 20 + 60) = **130**.\n- Roberts: r₁ = 50 − 100 = **−50**, r₂ = 90 − 80 = **10** (|r₁| + |r₂| = 60).',
    },
    'edg-3': {
      title: 'Sobel egy világos négyzeten',
      prompt: 'A 7×7-es kép 0, kivéve egy 10 értékű 3×3-as négyzetet (x, y = 3 … 5). Alkalmazd a Sobel maszkokat (korreláció, fx = jobb − bal, fy = alsó − felső), és add meg **fx**-et és **fy**-t a **belső 5×5 pixelre** (x, y = 2 … 6). Ezután add meg a Manhattan-nagyságot (|fx| + |fy|) a **(3, 3)** sarokpixelben.',
      grids: ['f'],
      labels: { gx: 'fx (x, y = 2…6)', gy: 'fy (x, y = 2…6)', m: '|fx| + |fy| a (3, 3)-ban' },
      hints: [
        'A (2, 4)-ben (a négyzettől balra, középső sor) csak a maszk jobb oszlopa látja a négyzetet: fx = 10 + 2·10 + 10 = 40.',
        'fy az fx transzponáltja: a négyzet szimmetrikus.',
      ],
      explain: 'fx (y = 2 … 6 sorok):\n\n| 10 | 10 | 0 | −10 | −10 |\n| --- | --- | --- | --- | --- |\n| 30 | 30 | 0 | −30 | −30 |\n| 40 | 40 | 0 | −40 | −40 |\n| 30 | 30 | 0 | −30 | −30 |\n| 10 | 10 | 0 | −10 | −10 |\n\nfy ennek transzponáltja (a négyzet fölött pozitív, alatta negatív). A válasz mindkét oldalon **két pixel széles** (a 2. és 3. oszlop is 40-et ad) – a 3×3-as maszk simít, de rosszabbul lokalizál. A középső oszlop 0, mert a bal és jobb oldal kiejti egymást. A (3, 3) sarokban fx = 30, fy = 30 → |fx| + |fy| = **60**.',
    },
    'edg-4': {
      title: 'Robinson és Kirsch iránytű maszkok',
      prompt: 'Az iránytű maszkok 8 irányban mérik az élt; a legerősebb válasz adja a nagyságot, a hozzá tartozó maszk az irányt.\n\n- **Robinson** É (N) maszk: [1 2 1; 0 0 0; −1 −2 −1]. **Kirsch** É (N) maszk: [5 5 5; −3 0 −3; −3 −3 −3].\n- A többi maszkot a külső súlygyűrű **egy cellával (45°-kal) az óramutató járásával megegyező** elforgatásával kapjuk: N, NE, E, SE, S, SW, W, NW (É, ÉK, K, DK, D, DNy, Ny, ÉNy) – arról az oldalról elnevezve, ahol a nagy pozitív súlyok vannak (Robinson NE = [0 1 2; −1 0 1; −2 −1 0], Kirsch NE = [−3 5 5; −3 0 5; −3 −3 −3]).\n\nAlkalmazd mind a 16 maszkot (korreláció) a középső pixelben. Add meg a válaszokat N, NE, E, SE, S, SW, W, NW sorrendben, és mindkét operátorra a maximális válasz irányának angol rövidítését (pl. SW).',
      grids: ['f (3×3-as környezet)'],
      labels: { r: 'Robinson N … NW', k: 'Kirsch N … NW', dr: 'Robinson max. iránya (pl. SW)', dk: 'Kirsch max. iránya' },
      hints: [
        'Robinson N = (90 + 2·100 + 100) − (10 + 2·20 + 60) = 280.',
        'Az ellentétes maszk a negatív: S = −N, SW = −NE, … így a 8-ból elég 4-et kiszámolni.',
      ],
      explain: 'Robinson: N 280, NE 330, E 200, SE −70, S −280, SW −330, W −200, NW 70 → maximum **330, NE (ÉK)**.\n\nKirsch: N 790, NE 870, E 550, SE −90, S −810, SW −1050, W −490, NW 230 → maximum **870, NE (ÉK)**.\n\nA világos terület a jobb felső sarok, ezért az NE maszkok válaszolnak a legerősebben. Robinsonnál az ellentétes maszk pontosan a negatív (S = −N); Kirschnél nem (N = 790, de S = −810), mert a gyűrűjében három 5-ös és öt −3-as van. A minimum (SW) is az élt jelezné ellentétes polaritással – az iránytű operátorok a **maximumot** veszik, ami a világosabb oldal irányát kódolja.',
    },
    'edg-5': {
      title: 'Nem-maximumok elnyomása',
      prompt: 'A Canny 2. lépése: adott a belső 3×3 pixel E_s gradiensnagysága és **kvantált gradiensiránya** (0°, 45°, 90°, 135°). Egy pixelt csak akkor tartunk meg, ha nagysága **≥ mindkét szomszédjáé a gradiens irányában**, különben 0 lesz.\n\nMivel y **lefelé** nő: 0° → bal/jobb, 90° → fel/le, **45° → jobb alsó és bal felső**, **135° → bal alsó és jobb felső** szomszéd. Add meg az eredményt a belső 3×3 pixelre (x, y = 2 … 4).',
      grids: ['E_s (nagyság)', 'irány (belső 3×3, °)'],
      labels: { n: 'I_N (x, y = 2…4)' },
      hints: [
        '(2, 2) = 45, irány 0°: szomszédok 12 és 95 → elnyomva.',
        '(4, 2) = 60, irány 45°: jobb alsó (5, 3) = 20, bal felső (3, 1) = 90 → elnyomva.',
      ],
      explain: '- (2, 2) 45, 0°: 12 / 95 → 0. (3, 2) 95, 0°: 45 / 60 → **95**. (4, 2) 60, 45°: 20 / 90 → 0.\n- (2, 3) 50, 0°: 8 / 85 → 0. (3, 3) 85, 45°: 92 / 45 → 0. (4, 3) 88, 0°: 85 / 20 → **88**.\n- (2, 4) 30, 135°: bal alsó 5 / jobb felső 85 → 0. (3, 4) 70, 90°: 40 / 85 → 0. (4, 4) 92, 45°: 75 / 85 → **92**.\n\nCsak a nagyság gerince marad meg, így az él **egy pixel vastag** lesz. Ha összekevernénk az y irányt (a 45°-ot jobb felső / bal alsó szomszédnak vennénk), tévesen a (3, 3) = 85 is megmaradna.',
    },
    'edg-6': {
      title: 'Hiszterézises küszöbölés',
      prompt: 'A Canny 3. lépése a nem-maximumok elnyomásának eredményén, **alsó küszöb l = 40**, **felső küszöb h = 100**:\n\n- érték ≥ h → él (erős);\n- érték < l → nem él;\n- l ≤ érték < h → **csak akkor él, ha** élpontokon keresztül erős pixelhez kapcsolódik (8-szomszédság, gyenge pixelek láncolata is megengedett).\n\nAdd meg a bináris éltérképet (1 = él).',
      grids: ['I_N'],
      labels: { e: 'éltérkép' },
      hints: [
        'Erős pixelek: 120 a (3, 1)-ben és 110 a (4, 4)-ben. Indulj ki belőlük, és kövesd a ≥ 40 értékű szomszédokat.',
        'Az (1, 5)-beli 80 l felett van, de nincs él-szomszédja.',
      ],
      explain: 'A (3, 1)-beli 120-tól: 60 (2, 2) → 70 (2, 3) → 50 (3, 4) → 110 (4, 4, amúgy is erős) → 55 (5, 5) → 90 (6, 5). Ezek egyetlen hosszú kontúrt alkotnak.\n\nElvetve: a (5, 2)-beli 45 – szomszédai 0 vagy 30 (< l); a (6, 3)-beli 30 – l alatt van; az (1, 5)-beli 80 – gyenge pixel él-szomszéd nélkül, pedig több elfogadottnál is nagyobb.\n\nEgyetlen 40-es küszöb megtartaná az elszigetelt 45-öt és 80-at (zaj), egyetlen 100-as küszöb pedig két pontra szakítaná a kontúrt – ezért használ a Canny **két küszöböt**.',
    },
    'edg-7': {
      title: 'SUSAN élválasz',
      prompt: 'SUSAN **3×3-as maszkkal (a középponttal együtt, n_max = 9)**, **t = 10** intenzitásküszöbbel és **g = ¾ · n_max = 6,75** geometriai küszöbbel:\n\n- C(r, r₀) = 1, ha |I(r) − I(r₀)| ≤ t, egyébként 0 (a középpont – nucleus – önmagát is számolja);\n- USAN terület: n(r₀) = Σ C(r, r₀);\n- élválasz: R(r₀) = g − n(r₀), ha n(r₀) < g, egyébként 0.\n\nSzámítsd ki n-et és R-t a belső 3×3 pixelre (x, y = 2 … 4).',
      grids: ['I'],
      labels: { n: 'n (USAN terület)', R: 'R (élválasz)' },
      hints: [
        'A (3, 3) közép = 15: hasonló (legfeljebb 10-zel eltérő) a 10, 13, 14, 15, 11 → n = 5.',
        'R = 6,75 − n csak ott, ahol n < 6,75, azaz n ≤ 6.',
      ],
      explain: 'n = [9 6 6; 8 5 7; 7 5 8], így R = [0 **0,75** **0,75**; 0 **1,75** 0; 0 **1,75** 0].\n\nA sötét terület belsejében (2, 2) mind a 9 pixel hasonló → n = n_max, nincs él. A sötét (≈ 10–15) és a világos (≈ 47–55) terület határa mellett az USAN kb. a maszk felére zsugorodik, és minél **kisebb** az USAN, annál nagyobb R. A SUSAN-nak **nincs szüksége deriváltakra**, ezért kevésbé zajérzékeny. (Sarokpontokhoz kisebb geometriai küszöböt, g = n_max/2-t használnak.)',
    },
    'edg-8': {
      title: 'Elvárt helyzetű élszakaszok (függőleges)',
      prompt: '**Függőleges élpárt** (világos csíkot) keresünk egy 5×10-es ablakban; a futam (a keresés iránya) vízszintes, merőleges az elvárt élekre.\n\n1. **Levetítés a futam irányára**: minden **oszlopot** összegzünk (az elvárt éllel párhuzamosan; az előadás szerint egyenlő magas oszlopoknál nem osztunk) → S(x), x = 1 … 10.\n2. **Élerősség tömb** a futam mentén, [−1 0 1] differenciáló szűrővel: e(x) = S(x+1) − S(x−1), x = 2 … 9.\n3. **Élszakaszok helye**: |e| lokális maximumai (mindkét szomszédjánál nagyobb), ahol **|e| ≥ 200**.\n4. **Feltételek vizsgálata**: polaritás (sötétből világosba vagy fordítva) és a két él távolsága.\n\nAdd meg S-t, e-t, a sötét → világos és a világos → sötét él helyét, valamint a távolságukat.',
      grids: ['f'],
      labels: { s: 'S(x), x = 1…10', e: 'e(x), x = 2…9', xr: 'sötét → világos él: x =', xf: 'világos → sötét él: x =', w: 'az élek távolsága' },
      hints: [
        'S = [100 110 200 550 600 590 560 225 110 100].',
        'e(3) = S(4) − S(2) = 440 és e(4) = 400: a csúcs x = 3-nál van.',
      ],
      explain: 'S = [100 110 200 550 600 590 560 225 110 100].\n\ne = [100 **440** 400 40 −40 −365 **−450** −125] (x = 2 … 9).\n\n- |e| 200 feletti lokális maximumai: x = 3 (440 > 100, 400) és x = 8 (|−450| > 365, 125). Az x = 4 (400) nem maximum – ugyanahhoz a rámpához tartozik.\n- Pozitív e → **sötét → világos x = 3-nál**, negatív e → **világos → sötét x = 8-nál**; a távolság **5** pixel.\n\nAz él menti összegzés kiátlagolja az egyes sorok zaját, a feltételek (minimális élerősség, elvárt élpozíció, polaritás, élpárnál az elvárt távolság) pedig eldöntik, hogy a keresett élpárt találtuk-e meg.',
    },
    'edg-9': {
      title: 'Elvárt helyzetű élszakaszok (45°)',
      prompt: 'Most az elvárt él **45°-os** (balra lentről jobbra fel fut), vagyis az **x + y = k** mellékátlók mentén halad (x = oszlop, y = sor, 1-től indexelve). Csak a **kiemelt sávot** használjuk: minden k = 4 … 12 mellékátlón pontosan **3** kiemelt cella van.\n\n1. Összegezd minden mellékátló kiemelt celláit (az elvárt él mentén): S(k), k = 4 … 12.\n2. Élerősség az átlókra merőlegesen: e(k) = S(k+1) − S(k−1), k = 5 … 11.\n3. Az él |e| lokális maximumánál van, ahol **|e| ≥ 100**. Add meg a k értékét és e(k)-t.',
      grids: ['f (kiemelt sáv)'],
      labels: { s: 'S(k), k = 4…12', e: 'e(k), k = 5…11', k: 'él helye: x + y =', ek: 'e az élnél' },
      hints: [
        'k = 4: az (x, y) = (1, 3), (2, 2), (3, 1) cellák → 29 + 28 + 32 = 89.',
        'S = [89 90 89 120 239 345 359 360 359].',
      ],
      explain: 'S(4 … 12) = [89 90 89 120 239 345 359 360 359] (pl. k = 8: f(3, 5) + f(4, 4) + f(5, 3) = 79 + 78 + 82 = 239).\n\ne(5 … 11) = [0 30 150 **225** 120 15 0]. Az egyetlen 100 feletti lokális maximum: **k = 8, e = 225** (pozitív: x + y növekedtével sötétből világosba). Az él az x + y = 8 egyenes, pl. a (4, 4), (3, 5), (5, 3) pixelek.\n\nEz a ZH módszere: a sáv miatt minden átlóösszegben ugyanannyi pixel van, így az összegek osztás nélkül is összehasonlíthatók.',
    },
    'edg-10': {
      title: 'Sobel gradiensnagyság',
      prompt: 'Írd meg a `sobelMag(img)` függvényt, amely minden belső pixelre az **euklideszi Sobel gradiensnagyságot**, √(fx² + fy²)-t adja (a maszkok korrelációként: fx = [−1 0 1; −2 0 2; −1 0 1], fy = [−1 −2 −1; 0 0 0; 1 2 1]). **A szélső pixelek 0-k.** Nincs kerekítés.',
      hints: ['Egy `f(dy, dx)` segédfüggvény, amely `img[y + dy][x + dx]`-et olvassa, rövidebbé teszi a képleteket.', 'A Manhattan-norma (|fx| + |fy|) vagy a Prewitt-súlyok (1 1 1) nem mennek át.'],
      explain: 'Ennek a nagyságnak a küszöbölése adja a klasszikus Sobel éldetektort (bemenet: kép + küszöb → szűrés, gradiensnagyság, küszöbölés). A Sobel maszk szeparálható: egy [1 2 1] simítás az éllel **párhuzamosan**, szorozva egy rá merőleges [−1 0 1] differenciával – ezért kevésbé zajérzékeny a sima differenciánál.',
    },
    'edg-11': {
      title: 'Egy futam élerősség tömbje',
      prompt: 'Írd meg a `rowStrength(img)` függvényt az elvárt helyzetű élek kereséséhez, vízszintes futammal (függőleges élek):\n\n1. S[x] = az x. oszlop összege (minden sor, osztás nélkül);\n2. add vissza a w hosszú e tömböt, ahol **e[x] = S[x+1] − S[x−1]**, ha 1 ≤ x ≤ w − 2, és **e[0] = e[w−1] = 0**.\n\nEgyszerű 1D tömböt adj vissza (0-tól indexelve).',
      hints: ['Az **oszlopokat** (x index) összegezd, ne a sorokat.', 'Az előző feladat 5×10-es képére az eredmény [0, 100, 440, 400, 40, −40, −365, −450, −125, 0].'],
      explain: '|e| csúcsai (egy minimális erősség felett) az él-jelöltek; előjelük a polaritás. Szélesebb differenciáló maszk (pl. [−1 −1 0 1 1]) jobban simít a futam mentén, de rosszabbul lokalizál.',
    },
    'edg-12': q('Nulla átmenetek', 'Melyik éldetektor jelöli az éleket a válaszának **nulla átmeneteinél** ({+,−}, {+,0,−}, {−,+}, {−,0,+} esetek)?',
      ['Sobel', 'Gauss-szűrt kép Laplace-a, LoG (Marr–Hildreth)', 'Robinson iránytű', 'Roberts-kereszt'],
      'A LoG („mexikói kalap”) a Gauss-szal simított kép második deriváltját közelíti; ahol a gradiens maximális, ott a második derivált előjelet vált. Az él helyét adja meg, az irányát nem, izotróp, és a simítás miatt zajjal szemben robusztus. A Sobel, a Robinson és a Roberts elsőrendű (gradiens) operátorok – náluk ott van él, ahol a gradiens nagysága nagy.'),
    'edg-13': q('Miért kell a nem-maximumok elnyomása?', 'Mi a célja a Canny éldetektor nem-maximumok elnyomása (non-maximum suppression) lépésének?',
      ['A zaj eltávolítása a gradiens kiszámítása előtt', 'Az élek egy pixel vastagra vékonyítása: csak a gradiensnagyság gradiensirány menti lokális maximumai maradnak meg', 'A szakadozott élszakaszok összekötése két küszöbbel', 'A gradiens irányának 8 iránytű-irányra kvantálása'],
      'A gradiens operátorok vastag (több pixel széles) élválaszt adnak. Az NMS minden pixelt összevet a 0°/45°/90°/135°-ra kvantált gradiens- (normális) irány menti két szomszédjával, és nullázza, ha nem ő a maximum. A zajcsökkentés a Gauss-simítás (1. lépés), a két küszöbös összekötés a hiszterézises küszöbölés (4. lépés).'),
    'edg-14': c('A Canny éldetektor fő lépései', 'Sorold fel a **Canny éldetektor fő lépéseit** (a ZH-n 4 pont), és röviden mondd meg, mit csinál mindegyik.',
      '1. **Gauss-simítás**: J = I ∗ G – zajcsökkentés (nagyobb σ: kevesebb zaj, de rosszabb lokalizálás és lassabb).\n2. **Gradiens számolás** – Jx, Jy (pl. differenciákkal/Sobellel); élerősség E_s = √(Jx² + Jy²) és élnormális (orientáció) E_o = arctan(Jy / Jx).\n3. **Nem-maximumok elnyomása** – E_o kvantálása 0°, 45°, 90°, 135°-ra; E_s csak ott marad meg, ahol ≥ mindkét szomszédjánál ebben az irányban, egyébként 0 → egy pixel vastag élek.\n4. **Hiszterézises küszöbölés** **két küszöbbel** (l < h) – a ≥ h pixelek élek; az l és h közöttiek csak akkor, ha élpixelhez kapcsolódnak (a lokális maximumok láncát követve); a < l pixeleket elvetjük → hosszú, szakadásmentes kontúrok kevés hamis éllel.\n\nFeltételezések: elsősorban lépcsős élek, Gauss-zaj. Kimenet: kontúrok listái. Az „optimális” éldetektor kritériumai: megbízható detektálás, pontos lokalizálás, minden élre egyetlen válasz.'),
  },
};
