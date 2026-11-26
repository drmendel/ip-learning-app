const q = (title, prompt, options, explain) => ({ title, prompt, options, explain });
const c = (title, prompt, answerText) => ({ title, prompt, answerText });

export default {
  title: 'Kezdés',
  lab: 'Bevezető',
  exercises: {
    'start-1': {
      title: 'Egy pixel kiolvasása',
      prompt: 'A kurzus (és a ZH) táblázataiban **x az oszlopindex, jobbra nő**, **y a sorindex, lefelé nő**, és mindkettő **1-től** indul.\n\nMennyi az intenzitás az **x = 4, y = 2** helyen? És az **x = 2, y = 4** helyen?',
      grids: ['f(x, y)'],
      labels: { a: 'f(4, 2)', b: 'f(2, 4)' },
      hints: ['Előbb menj a 4. oszlophoz, aztán le a 2. sorig.'],
      explain: 'f(4, 2) a 2. sor 4. oszlopában van → 220. f(2, 4) a 4. sor 2. oszlopában → 175. Kódban (0-tól indexelve) ugyanezek a pixelek `img[1][3]` és `img[3][1]` – **a sor van elöl**.',
    },
    'start-2': {
      title: 'Az első mátrixos válaszod',
      prompt: 'Az alábbi 3×3-as kép **L = 8** szürkeárnyalatú (0…7). Számítsd ki a **negatívját**: s = (L − 1) − r, és írd be az eredményt a rácsba.\n\nTipp: egy egész táblázatot (pl. táblázatkezelőből) beilleszthetsz az első cellába.',
      grids: ['r'],
      labels: { neg: 'negatív kép' },
      hints: ['7 − 0 = 7, 7 − 3 = 4, …'],
      explain: 'Minden pixel külön: s = 7 − r. A pont alapú művelet sosem nézi a szomszédokat.',
    },
    'start-3': {
      title: 'Kifejezést is írhatsz',
      prompt: 'A válaszcellák kifejezéseket is elfogadnak, így nem kell kézzel kerekítened: `sqrt(2)/2`, `3/4`, `cos(45)` (fokban!), `pi/4`, és a magyar tizedesvessző (`0,5`) is működik.\n\nÍrd be a **cos 45°** értékét bármilyen alakban.',
      labels: { v: 'cos 45°' },
      explain: 'cos 45° = √2 / 2 ≈ 0,7071. Kis tűréssel fogadjuk el az értékeket (kb. ±0,01 vagy 0,5 %).',
    },
    'start-4': {
      starter: 'function invert(img) {\n  // img.length = sorok száma, img[0].length = oszlopok száma\n  return img.map(row => row.map(v => v));\n}',
      title: 'Az első képfüggvényed',
      prompt: 'A kódfeladatokban egy **JavaScript** függvényt kell megírnod. A kép sorok tömbje: `img[y][x]`, értékei 0…255.\n\nÍrd meg az `invert(img)` függvényt, amely egy **új** képet ad vissza, ahol minden érték helyén **255 − érték** áll. A **Futtatás** képként mutatja a kimenetet, az **Ellenőrzés** több tesztképen értékel.',
      hints: ['Csak a belső nyílfüggvényt kell módosítani.'],
      explain: 'Minden kódfeladatban elérhető segédfüggvények: `zeros(h, w, v)`, `clone(img)`, `shape(img)` → [h, w], `clamp(v, lo, hi)`, `round(v, d)`, `print(...)`, `show(img, cím)`.',
    },
    'start-5': {
      starter: '# pl. Tran(1, 0, 0)\n',
      title: 'Egy test mozgatása',
      prompt: 'Transzformációs feladatok: **soronként egy elemi transzformációt** írj; mindegyik a **bázis (világ) koordináta-rendszerben** hajtódik végre – így az eredő mátrix T = Mₙ · … · M₂ · M₁.\n\nMozgasd az egységkockát úgy, hogy az **x ∈ [3, 4]** helyre kerüljön (y és z ne változzon). A **Futtatás** minden lépés utáni helyzetet megmutat.',
      hints: ['Egyetlen x irányú eltolás elég: `Tran(3, 0, 0)`.'],
      explain: 'Elérhető parancsok: `Tran(x, y, z)`, `Rx(a)`, `Ry(a)`, `Rz(a)` (fokban), valamint `Ry(a) about (px, py, pz)`: forgatás az y-nal párhuzamos, a (px, py, pz) ponton átmenő tengely körül.',
    },
    'start-6': q('Sor vagy oszlop?', 'Kódban az `img[i][j]` kifejezésben melyik index van elöl?',
      ['Az oszlop (x)', 'A sor (y)', 'A kép méretétől függ', 'A színcsatorna'],
      '`img[y][x]`: a külső tömb a sorok listája. A ZH táblázatai ugyanígy épülnek fel, csak 1-től indexelve.'),
    'start-7': c('Digitális kép', 'Mitől lesz egy kép **digitális**? Nevezd meg a két lépést.',
      'A digitális kép egy kétdimenziós f(x, y) függvény, ahol **x, y és f is diszkrét**.\n\n- **Mintavételezés** – a folytonos képet csak rácspontokban (pixelekben) mérjük → diszkrét x, y.\n- **Kvantálás** – a mért amplitúdót L szint egyikére kerekítjük (pl. 8 biten 256) → diszkrét f.'),
  },
};
