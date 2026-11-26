// Grader feedback in every UI language. English is the fallback.
export const LANGS = ['en', 'hu'];
export const normLang = (l) => (LANGS.includes(l) ? l : 'en');

const M = {
  en: {
    allCorrect: 'Correct – every value matches.',
    partsCorrect: (a, n) => `${a} of ${n} parts are correct.`,
    fieldOk: (l) => `✓ ${l}`,
    fieldEmpty: (l) => `• ${l}: not filled in`,
    fieldBadNum: (l, where) => `• ${l}: cannot read the number${where}`,
    fieldWrongCells: (l, k, n) => `• ${l}: ${k} of ${n} values are wrong (marked red)`,
    fieldWrong: (l) => `• ${l}: not correct`,
    fieldWrongStr: (l) => `• ${l}: not correct (spaces don't matter)`,
    at: (r, c) => ` (row ${r}, column ${c})`,
    unorderedNote: 'The order of the rows does not matter here.',
    codeMissing: (fn) => `Define a function called ${fn}(…).`,
    codeError: (e) => `Your code threw an error: ${e}`,
    codeTestError: (i, e) => `Test ${i}: your function threw an error: ${e}`,
    codeOk: (n) => `Correct – all ${n} tests pass.`,
    codeWrong: (i, n) => `Test ${i} of ${n} gives a different result.`,
    codeShape: (got, want) => `Your result has shape ${got}, expected ${want}.`,
    codeCell: (path, got, want) => `First difference at ${path}: yours = ${got}, expected = ${want}.`,
    codeType: (got, want) => `Your function returned ${got}, expected ${want}.`,
    required: 'Requirement not met.',
    forbidden: 'This is not allowed in this task.',
    stepsParse: (line, e) => `Line ${line}: ${e}`,
    stepsEmpty: 'Write at least one transformation (one per line).',
    stepsNotTarget: 'After the last step the object is not in the target position.',
    stepsNotTargetOrdered: 'After the last step the vertices are not where the target puts them (check the vertex numbers, not only the shape).',
    stepsBelow: (line, z) => `Step in line ${line} takes the object below z = 0 (lowest z ≈ ${z}).`,
    stepsScale: (line) => `Line ${line}: the object must not be resized.`,
    stepsGate: (line) => `Step in line ${line} pushes the object through the gate while it does not fit through the opening.`,
    stepsOk: (n) => `Correct – the object reaches the target in ${n} step(s) and never goes below z = 0.`,
    stepsOkFree: (n) => `Correct – the object reaches the target in ${n} step(s).`,
    rigidNotOrtho: 'The upper-left 3×3 part is not a rotation (columns must be orthonormal, det = +1).',
    rigidBottom: 'The last row of a homogeneous transformation must be 0 0 0 1.',
    rigidMaps: 'This matrix does not move the start position onto the target position.',
  },
  hu: {
    allCorrect: 'Helyes – minden érték stimmel.',
    partsCorrect: (a, n) => `${n} részből ${a} helyes.`,
    fieldOk: (l) => `✓ ${l}`,
    fieldEmpty: (l) => `• ${l}: nincs kitöltve`,
    fieldBadNum: (l, where) => `• ${l}: nem értelmezhető szám${where}`,
    fieldWrongCells: (l, k, n) => `• ${l}: ${n} értékből ${k} hibás (pirossal jelölve)`,
    fieldWrong: (l) => `• ${l}: nem helyes`,
    fieldWrongStr: (l) => `• ${l}: nem helyes (a szóközök nem számítanak)`,
    at: (r, c) => ` (${r}. sor, ${c}. oszlop)`,
    unorderedNote: 'Itt a sorok sorrendje nem számít.',
    codeMissing: (fn) => `Definiálj egy ${fn}(…) nevű függvényt.`,
    codeError: (e) => `A kódod hibát dobott: ${e}`,
    codeTestError: (i, e) => `${i}. teszt: a függvényed hibát dobott: ${e}`,
    codeOk: (n) => `Helyes – mind a(z) ${n} teszt sikeres.`,
    codeWrong: (i, n) => `A(z) ${n} tesztből a(z) ${i}. más eredményt ad.`,
    codeShape: (got, want) => `Az eredményed mérete ${got}, a várt méret ${want}.`,
    codeCell: (path, got, want) => `Első eltérés itt: ${path}: a tiéd = ${got}, várt = ${want}.`,
    codeType: (got, want) => `A függvényed ezt adta vissza: ${got}, várt: ${want}.`,
    required: 'Nem teljesül a feladat egy követelménye.',
    forbidden: 'Ez ebben a feladatban nem megengedett.',
    stepsParse: (line, e) => `${line}. sor: ${e}`,
    stepsEmpty: 'Írj legalább egy transzformációt (soronként egyet).',
    stepsNotTarget: 'Az utolsó lépés után a test nincs a célhelyzetben.',
    stepsNotTargetOrdered: 'Az utolsó lépés után a csúcsok nem ott vannak, ahová a célhelyzet teszi őket (a csúcsok számozását is nézd, ne csak az alakot).',
    stepsBelow: (line, z) => `A(z) ${line}. sor lépése z = 0 alá viszi a testet (legkisebb z ≈ ${z}).`,
    stepsScale: (line) => `${line}. sor: a testet nem szabad átméretezni.`,
    stepsGate: (line) => `A(z) ${line}. sor lépése úgy tolja át a testet a kapun, hogy az nem fér át a nyíláson.`,
    stepsOk: (n) => `Helyes – a test ${n} lépésben eléri a célhelyzetet, és sosem kerül z = 0 alá.`,
    stepsOkFree: (n) => `Helyes – a test ${n} lépésben eléri a célhelyzetet.`,
    rigidNotOrtho: 'A bal felső 3×3-as rész nem forgatás (az oszlopoknak ortonormáltnak kell lenniük, det = +1).',
    rigidBottom: 'A homogén transzformáció utolsó sora 0 0 0 1 kell legyen.',
    rigidMaps: 'Ez a mátrix nem viszi át a kezdőhelyzetet a célhelyzetbe.',
  },
};

/** Message lookup: msg(lang, key, ...args) */
export function msg(lang, key, ...args) {
  const v = M[normLang(lang)][key] ?? M.en[key];
  return typeof v === 'function' ? v(...args) : v;
}
export const MESSAGE_KEYS = Object.keys(M.en);
export const MESSAGES = M;
