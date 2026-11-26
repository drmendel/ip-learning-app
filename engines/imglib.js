// imglib – the image-processing toolbox of the course.
//
// Pure functions, no dependencies. Used for three things:
//   1. computing the reference answers of every exercise (content/*.js),
//   2. the `lib` object in the playground,
//   3. the self-test (test/verify.js).
//
// Conventions (the same as in the lessons):
//   * an image is an array of rows: img[y][x]; y = row index (grows DOWNWARDS), x = column index;
//   * indices are 0-based in code (the ZH tables are 1-based – the exercises say which one they use);
//   * kernels are written the way they are printed: k[0] is the top row.

// ---------------------------------------------------------------- basics
export const shape = (img) => [img.length, img[0]?.length ?? 0];
export const zeros = (h, w, v = 0) => Array.from({ length: h }, () => new Array(w).fill(v));
export const fromFn = (h, w, f) => Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => f(y, x)));
export const clone = (img) => img.map((r) => r.slice());
export const map = (img, f) => img.map((r, y) => r.map((v, x) => f(v, y, x)));
export const zip = (a, b, f) => a.map((r, y) => r.map((v, x) => f(v, b[y][x], y, x)));
export const flat = (img) => img.flat();
export const sum = (arr) => (Array.isArray(arr[0]) ? arr.flat() : arr).reduce((s, v) => s + v, 0);
export const mean = (arr) => { const f = Array.isArray(arr[0]) ? arr.flat() : arr; return sum(f) / f.length; };
export const clamp = (v, lo = 0, hi = 255) => Math.min(hi, Math.max(lo, v));
export const round = (v, d = 0) => { const p = 10 ** d; return Math.round((v + Number.EPSILON) * p) / p; };
export const roundAll = (m, d = 0) => (Array.isArray(m) ? m.map((r) => roundAll(r, d)) : typeof m === 'number' ? round(m, d) : m);
export const transpose = (m) => m[0].map((_, j) => m.map((r) => r[j]));
export const sub = (img, y0, x0, h, w) => img.slice(y0, y0 + h).map((r) => r.slice(x0, x0 + w));
export const deg = (rad) => (rad * 180) / Math.PI;
export const rad = (d) => (d * Math.PI) / 180;
/** Round-half-up, the way it is done by hand in the ZH (2.5 → 3). */
export const roundHalfUp = (v) => Math.floor(v + 0.5 + 1e-9);
/** Parse a whitespace/“|”-separated block of numbers into a matrix. */
export function parseGrid(text) {
  return text.trim().split('\n').map((l) => l.trim().replace(/\|/g, ' ').split(/[\s,;]+/).filter(Boolean).map(Number));
}

// ---------------------------------------------------------------- histograms
export function histogram(img, L = 256) {
  const h = new Array(L).fill(0);
  for (const r of img) for (const v of r) h[v]++;
  return h;
}
export const normalizedHistogram = (img, L = 256) => { const n = img.length * img[0].length; return histogram(img, L).map((c) => c / n); };
export const cumulative = (h) => { let s = 0; return h.map((v) => (s += v)); };
/** Histogram equalisation: s = round((L-1) * cdf(r)). Returns { map, out, hist, cdf }. */
export function histEq(img, L = 256, rounding = roundHalfUp) {
  const n = img.length * img[0].length;
  const hist = histogram(img, L);
  const cdf = cumulative(hist).map((c) => c / n);
  const lut = cdf.map((c) => rounding((L - 1) * c));
  return { hist, cdf, map: lut, out: map(img, (v) => lut[v]) };
}
/** Linear stretch of [lo, hi] to [0, L-1] (lo/hi default to min/max = histogram stretching). */
export function stretch(img, L = 256, lo = null, hi = null, rounding = roundHalfUp) {
  const f = img.flat();
  const a = lo ?? Math.min(...f), b = hi ?? Math.max(...f);
  return map(img, (v) => clamp(rounding(((L - 1) * (v - a)) / (b - a)), 0, L - 1));
}
export const negate = (img, L = 256) => map(img, (v) => L - 1 - v);
export const threshold = (img, T, hi = 1, lo = 0) => map(img, (v) => (v < T ? lo : hi));
export const gammaT = (img, gamma, c = 1, L = 256) => map(img, (v) => c * (L - 1) * (v / (L - 1)) ** gamma);
export const logT = (img, c = 1) => map(img, (v) => c * Math.log(1 + v));
export const bitPlane = (img, k) => map(img, (v) => (v >> k) & 1);

// ---------------------------------------------------------------- integral image (Viola–Jones)
/** ii(y, x) = sum of img over rows <= y and columns <= x (inclusive). */
export function integralImage(img) {
  const [h, w] = shape(img);
  const ii = zeros(h, w);
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    for (let x = 0; x < w; x++) { rowSum += img[y][x]; ii[y][x] = rowSum + (y > 0 ? ii[y - 1][x] : 0); }
  }
  return ii;
}
/** Sum of the rectangle rows y0..y1, columns x0..x1 (inclusive) using 4 look-ups. */
export function rectSum(ii, y0, x0, y1, x1) {
  const at = (y, x) => (y < 0 || x < 0 ? 0 : ii[y][x]);
  return at(y1, x1) - at(y0 - 1, x1) - at(y1, x0 - 1) + at(y0 - 1, x0 - 1);
}

// ---------------------------------------------------------------- error diffusion (Floyd–Steinberg)
/** Binarise with error diffusion; output values are 0 or `max`. Returns { out, work } (work = values incl. received error). */
export function floydSteinberg(img, max = 255, thr = 128) {
  const [h, w] = shape(img);
  const work = clone(img);
  const out = zeros(h, w);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const old = work[y][x];
    const nw = old >= thr ? max : 0;
    out[y][x] = nw;
    const e = old - nw;
    if (x + 1 < w) work[y][x + 1] += (7 / 16) * e;
    if (y + 1 < h) {
      if (x > 0) work[y + 1][x - 1] += (3 / 16) * e;
      work[y + 1][x] += (5 / 16) * e;
      if (x + 1 < w) work[y + 1][x + 1] += (1 / 16) * e;
    }
  }
  return { out, work };
}

// ---------------------------------------------------------------- neighbourhood filters
function pixel(img, y, x, border) {
  const [h, w] = shape(img);
  if (y >= 0 && y < h && x >= 0 && x < w) return img[y][x];
  if (border === 'zero') return 0;
  if (border === 'replicate') return img[clamp(y, 0, h - 1)][clamp(x, 0, w - 1)];
  if (border === 'mirror') { const ry = y < 0 ? -y : y >= h ? 2 * h - 2 - y : y; const rx = x < 0 ? -x : x >= w ? 2 * w - 2 - x : x; return img[ry][rx]; }
  return NaN;
}
/**
 * Correlation (the mask is NOT flipped): g(y,x) = Σ w(k,l) f(y+k, x+l).
 * border: 'zero' | 'replicate' | 'mirror' | 'keep' (border pixels copied unchanged) | 'valid' (smaller output).
 */
export function correlate(img, k, border = 'zero') {
  const [h, w] = shape(img);
  const ry = (k.length - 1) / 2, rx = (k[0].length - 1) / 2;
  const inner = (y, x) => y >= ry && y < h - ry && x >= rx && x < w - rx;
  const at = (y, x) => {
    let s = 0;
    for (let i = 0; i < k.length; i++) for (let j = 0; j < k[0].length; j++) s += k[i][j] * pixel(img, y + i - ry, x + j - rx, border);
    return s;
  };
  if (border === 'valid') return fromFn(h - 2 * ry, w - 2 * rx, (y, x) => at(y + ry, x + rx));
  return fromFn(h, w, (y, x) => (border === 'keep' && !inner(y, x) ? img[y][x] : at(y, x)));
}
export const flipKernel = (k) => k.slice().reverse().map((r) => r.slice().reverse());
/** Convolution = correlation with the mask rotated by 180°: y(i,j) = Σ h(k,l) x(i-k, j-l). */
export const convolve = (img, k, border = 'zero') => correlate(img, flipKernel(k), border);
/** 1-D convolution, 'full' output (length n+m-1), as in the lecture example. */
export function convolve1D(f, g) {
  const out = new Array(f.length + g.length - 1).fill(0);
  for (let i = 0; i < f.length; i++) for (let j = 0; j < g.length; j++) out[i + j] += f[i] * g[j];
  return out;
}
/** 1-D correlation, 'full' output. */
export const correlate1D = (f, g) => convolve1D(f, g.slice().reverse());
export const boxKernel = (n = 3) => zeros(n, n, 1 / (n * n));
export function gaussKernel(n = 3, sigma = 1, normalize = true) {
  const r = (n - 1) / 2;
  const k = fromFn(n, n, (y, x) => Math.exp(-((x - r) ** 2 + (y - r) ** 2) / (2 * sigma * sigma)));
  if (!normalize) return k;
  const s = sum(k);
  return map(k, (v) => v / s);
}
/** Binomial coefficients row of length n: n=3 → [1,2,1]. */
export function binomialRow(n) { let r = [1]; for (let i = 1; i < n; i++) r = convolve1D(r, [1, 1]); return r; }
/** Binomial (approximate Gaussian) n×n mask, normalised (1/16 [1 2 1; 2 4 2; 1 2 1] for n = 3). */
export function binomialKernel(n = 3, normalize = true) {
  const r = binomialRow(n);
  const k = r.map((a) => r.map((b) => a * b));
  return normalize ? map(k, (v) => v / sum(k)) : k;
}
export const outer = (a, b) => a.map((x) => b.map((y) => x * y));
/** Median filter (n×n). border: 'keep' (border pixels unchanged, as in the course) | 'replicate' | 'zero'. */
export function median(img, n = 3, border = 'keep') {
  const [h, w] = shape(img);
  const r = (n - 1) / 2;
  return fromFn(h, w, (y, x) => {
    if (border === 'keep' && (y < r || y >= h - r || x < r || x >= w - r)) return img[y][x];
    const vals = [];
    for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) vals.push(pixel(img, y + i, x + j, border));
    vals.sort((a, b) => a - b);
    return vals[(vals.length - 1) / 2];
  });
}
export const rankFilter = (img, n, pick, border = 'keep') => {
  const [h, w] = shape(img); const r = (n - 1) / 2;
  return fromFn(h, w, (y, x) => {
    if (border === 'keep' && (y < r || y >= h - r || x < r || x >= w - r)) return img[y][x];
    const vals = []; for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) vals.push(pixel(img, y + i, x + j, border));
    return pick(vals);
  });
};
export const minFilter = (img, n = 3, border = 'keep') => rankFilter(img, n, (v) => Math.min(...v), border);
export const maxFilter = (img, n = 3, border = 'keep') => rankFilter(img, n, (v) => Math.max(...v), border);

// ---------------------------------------------------------------- derivative masks
// Pixel numbering of the lecture:  x0 x1 x2 / x3 x4 x5 / x6 x7 x8 ;  fx = right − left, fy = bottom − top (y grows downwards)
export const K = {
  diffX: [[-1, 1]], diffCentralX: [[-1, 0, 1]], diffCentralY: [[-1], [0], [1]],
  prewittX: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]],
  prewittY: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]],
  sobelX: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
  sobelY: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]],
  robertsA: [[1, 0], [0, -1]], robertsB: [[0, 1], [-1, 0]],
  laplace4: [[0, 1, 0], [1, -4, 1], [0, 1, 0]],
  laplace8: [[1, 1, 1], [1, -8, 1], [1, 1, 1]],
  laplaceSharpen: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
  box3: [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
  binomial3: [[1, 2, 1], [2, 4, 2], [1, 2, 1]],
  // line detectors (Gonzalez–Woods), +45° = the line runs from bottom-left to top-right
  lineH: [[-1, -1, -1], [2, 2, 2], [-1, -1, -1]],
  lineV: [[-1, 2, -1], [-1, 2, -1], [-1, 2, -1]],
  lineP45: [[-1, -1, 2], [-1, 2, -1], [2, -1, -1]],
  lineM45: [[2, -1, -1], [-1, 2, -1], [-1, -1, 2]],
};
/** Robinson compass masks, 8 directions generated by rotating the border ring clockwise: N, NE, E, SE, S, SW, W, NW
 *  (named after where the +2 weight sits; mask 0 has +2 in the top-middle cell). */
export function robinsonMasks() {
  const ring = [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0], [1, 0]];
  const base = [1, 2, 1, 0, -1, -2, -1, 0];
  return Array.from({ length: 8 }, (_, r) => { const k = zeros(3, 3); ring.forEach(([y, x], i) => { k[y][x] = base[(i - r + 8) % 8]; }); return k; });
}
/** Gradient with a pair of masks (correlation). Returns gx, gy, magnitude (Euclidean & Manhattan & max) and direction (deg, atan2(gy, gx)). */
export function gradient(img, kx = K.sobelX, ky = K.sobelY, border = 'zero') {
  const gx = correlate(img, kx, border), gy = correlate(img, ky, border);
  return {
    gx, gy,
    mag: zip(gx, gy, (a, b) => Math.hypot(a, b)),
    mag1: zip(gx, gy, (a, b) => Math.abs(a) + Math.abs(b)),
    magMax: zip(gx, gy, (a, b) => Math.max(Math.abs(a), Math.abs(b))),
    dir: zip(gx, gy, (a, b) => (a === 0 && b === 0 ? 0 : deg(Math.atan2(b, a)))),
  };
}
export const sobel = (img, border = 'zero') => gradient(img, K.sobelX, K.sobelY, border);
export const prewitt = (img, border = 'zero') => gradient(img, K.prewittX, K.prewittY, border);
/** Quantise a direction (deg) to 0, 45, 90, 135 as in Canny's non-maximum suppression. */
export function quantizeDir(d) { const a = ((d % 180) + 180) % 180; return [0, 45, 90, 135, 180][Math.round(a / 45)] % 180; }
/** Non-maximum suppression: keep a pixel only if it is >= both neighbours along the (quantised) gradient direction. */
export function nonMaxSuppression(mag, dir) {
  const [h, w] = shape(mag);
  const off = { 0: [0, 1], 45: [1, 1], 90: [1, 0], 135: [1, -1] }; // [dy, dx] along the gradient (y down)
  return fromFn(h, w, (y, x) => {
    const [dy, dx] = off[quantizeDir(dir[y][x])];
    const a = pixel(mag, y + dy, x + dx, 'zero'), b = pixel(mag, y - dy, x - dx, 'zero');
    return mag[y][x] >= a && mag[y][x] >= b ? mag[y][x] : 0;
  });
}
/** Hysteresis thresholding: strong (>= hi) pixels are edges; weak (>= lo) ones if 8-connected to an edge. Returns 0/1 image. */
export function hysteresis(img, lo, hi) {
  const [h, w] = shape(img);
  const out = zeros(h, w);
  const stack = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (img[y][x] >= hi) { out[y][x] = 1; stack.push([y, x]); }
  while (stack.length) {
    const [y, x] = stack.pop();
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const yy = y + dy, xx = x + dx;
      if (yy >= 0 && yy < h && xx >= 0 && xx < w && !out[yy][xx] && img[yy][xx] >= lo) { out[yy][xx] = 1; stack.push([yy, xx]); }
    }
  }
  return out;
}
/** Zero crossings of a LoG/Laplace response: 1 where the sign changes towards the right or the lower neighbour. */
export function zeroCrossings(resp) {
  const [h, w] = shape(resp);
  return fromFn(h, w, (y, x) => {
    const v = resp[y][x];
    const r = x + 1 < w ? resp[y][x + 1] : v, d = y + 1 < h ? resp[y + 1][x] : v;
    return (v * r < 0 || v * d < 0) ? 1 : 0;
  });
}
/** LoG kernel (unnormalised, as in the lecture: (r² − 2σ²)/σ⁴ · exp(−r²/2σ²)), made zero-sum. */
export function logKernel(n = 5, sigma = 1) {
  const r = (n - 1) / 2;
  const k = fromFn(n, n, (y, x) => { const q = (x - r) ** 2 + (y - r) ** 2; return ((q - 2 * sigma * sigma) / sigma ** 4) * Math.exp(-q / (2 * sigma * sigma)); });
  const m = mean(k);
  return map(k, (v) => v - m);
}
/** SUSAN: USAN area n(r0) in a mask (radius in pixels) and the edge response R = g − n if n < g. */
export function susan(img, t = 27, radius = 1, gFactor = 3 / 4) {
  const [h, w] = shape(img);
  const offs = [];
  for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) if (dx * dx + dy * dy <= radius * radius + radius) offs.push([dy, dx]);
  const g = gFactor * offs.length;
  const n = fromFn(h, w, (y, x) => offs.reduce((s, [dy, dx]) => { const v = pixel(img, y + dy, x + dx, 'replicate'); return s + (Math.abs(v - img[y][x]) <= t ? 1 : 0); }, 0));
  return { n, g, R: map(n, (v) => (v < g ? g - v : 0)), nMax: offs.length };
}

// ---------------------------------------------------------------- feature points
/**
 * Structure tensor / H matrix of every pixel.
 *   grad: 'central' ([-1 0 1], no division), 'sobel', 'forward' ([-1 1]) or 'central2' ([-1 0 1]/2)
 *   win:  window size (2n+1), avg: true → divide the sums by the number of pixels (the "averaged" version)
 * Pixels where the gradient or the window would need values outside the image are NaN.
 */
export function structureTensor(img, { grad = 'central', win = 3, avg = true } = {}) {
  const [h, w] = shape(img);
  const kx = { central: [[-1, 0, 1]], central2: [[-0.5, 0, 0.5]], forward: [[0, -1, 1]], sobel: K.sobelX }[grad];
  const ky = { central: [[-1], [0], [1]], central2: [[-0.5], [0], [0.5]], forward: [[0], [-1], [1]], sobel: K.sobelY }[grad];
  const Ix = correlate(img, kx, 'none'), Iy = correlate(img, ky, 'none');
  const r = (win - 1) / 2;
  const A = zeros(h, w, NaN), B = zeros(h, w, NaN), C = zeros(h, w, NaN);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let a = 0, b = 0, c = 0, ok = true;
    for (let i = -r; i <= r && ok; i++) for (let j = -r; j <= r; j++) {
      const gx = Ix[y + i]?.[x + j], gy = Iy[y + i]?.[x + j];
      if (gx === undefined || gy === undefined || Number.isNaN(gx) || Number.isNaN(gy)) { ok = false; break; }
      a += gx * gx; b += gx * gy; c += gy * gy;
    }
    if (!ok) continue;
    const n = avg ? win * win : 1;
    A[y][x] = a / n; B[y][x] = b / n; C[y][x] = c / n;
  }
  return { Ix, Iy, A, B, C };
}
/** Eigenvalues of [[a, b], [b, c]] (λ+ ≥ λ−). */
export function eig2(a, b, c) {
  const tr = a + c, d = Math.sqrt(((a - c) / 2) ** 2 + b * b);
  return { lmax: tr / 2 + d, lmin: tr / 2 - d };
}
/** Shi–Tomasi (λ−) and Harris (det − k·trace²) responses. */
export function cornerResponse(img, opts = {}) {
  const k = opts.k ?? 0.04;
  const st = structureTensor(img, opts);
  const lmin = zip(st.A, st.B, (a, b, y, x) => (Number.isNaN(a) ? NaN : eig2(a, b, st.C[y][x]).lmin));
  const harris = zip(st.A, st.B, (a, b, y, x) => (Number.isNaN(a) ? NaN : a * st.C[y][x] - b * b - k * (a + st.C[y][x]) ** 2));
  return { ...st, lmin, harris };
}
/** Moravec: minimum over 4 directions of the sum of squared differences of a window shifted by one pixel. */
export function moravec(img, win = 3) {
  const [h, w] = shape(img); const r = (win - 1) / 2;
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  return fromFn(h, w, (y, x) => {
    if (y - r - 1 < 0 || y + r + 1 >= h || x - r - 1 < 0 || x + r + 1 >= w) return NaN;
    return Math.min(...dirs.map(([dy, dx]) => { let s = 0; for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) s += (img[y + i + dy][x + j + dx] - img[y + i][x + j]) ** 2; return s; }));
  });
}

// ---------------------------------------------------------------- template matching
/** Slides template t over img (valid positions only). Returns maps of SSD, SAD, CC and NCC indexed by the top-left corner. */
export function matchTemplate(img, t) {
  const [h, w] = shape(img), [th, tw] = shape(t);
  const tm = mean(t);
  const res = { ssd: [], sad: [], cc: [], ncc: [] };
  for (let y = 0; y + th <= h; y++) {
    const r = { ssd: [], sad: [], cc: [], ncc: [] };
    for (let x = 0; x + tw <= w; x++) {
      let ssd = 0, sad = 0, cc = 0;
      const patch = sub(img, y, x, th, tw); const pm = mean(patch);
      let num = 0, da = 0, db = 0;
      for (let i = 0; i < th; i++) for (let j = 0; j < tw; j++) {
        const a = patch[i][j], b = t[i][j];
        ssd += (a - b) ** 2; sad += Math.abs(a - b); cc += a * b;
        num += (a - pm) * (b - tm); da += (a - pm) ** 2; db += (b - tm) ** 2;
      }
      r.ssd.push(ssd); r.sad.push(sad); r.cc.push(cc); r.ncc.push(da && db ? num / Math.sqrt(da * db) : 0);
    }
    for (const k of Object.keys(res)) res[k].push(r[k]);
  }
  return res;
}
export function argmin2(m) { let best = [0, 0]; m.forEach((r, y) => r.forEach((v, x) => { if (v < m[best[0]][best[1]]) best = [y, x]; })); return best; }
export function argmax2(m) { let best = null; m.forEach((r, y) => r.forEach((v, x) => { if (!Number.isNaN(v) && (best === null || v > m[best[0]][best[1]])) best = [y, x]; })); return best; }

// ---------------------------------------------------------------- Hough transform & curve fitting
/**
 * Line Hough transform in normal form  x·cosθ + y·sinθ = ρ  (x = column, y = row, origin = top-left pixel).
 * thetas in degrees; ρ is rounded to the nearest integer bin. Returns { thetas, rhos, acc[thetaIdx][rhoIdx], lines(sorted by votes) }.
 */
export function houghLines(bin, thetas = [0, 45, 90, 135], { origin = [0, 0] } = {}) {
  const pts = [];
  bin.forEach((r, y) => r.forEach((v, x) => { if (v) pts.push([x - origin[0], y - origin[1]]); }));
  const votes = new Map();
  for (const t of thetas) {
    const c = Math.cos(rad(t)), s = Math.sin(rad(t));
    for (const [x, y] of pts) {
      const rho = Math.round(x * c + y * s + 1e-9) + 0; // +0 turns -0 into 0
      const key = `${t}|${rho}`;
      votes.set(key, (votes.get(key) || 0) + 1);
    }
  }
  const lines = [...votes.entries()].map(([k, v]) => { const [t, r] = k.split('|').map(Number); return { theta: t, rho: r, votes: v }; })
    .sort((a, b) => b.votes - a.votes || a.theta - b.theta || a.rho - b.rho);
  const rhos = [...new Set(lines.map((l) => l.rho))].sort((a, b) => a - b);
  const acc = thetas.map((t) => rhos.map((r) => votes.get(`${t}|${r}`) || 0));
  return { thetas, rhos, acc, lines, points: pts };
}
/** Least-squares line y = m·x + b through points [[x, y], ...]. */
export function fitLine(points) {
  const n = points.length;
  const sx = sum(points.map((p) => p[0])), sy = sum(points.map((p) => p[1]));
  const sxx = sum(points.map((p) => p[0] * p[0])), sxy = sum(points.map((p) => p[0] * p[1]));
  const m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const b = (sy - m * sx) / n;
  const sse = sum(points.map(([x, y]) => (y - (m * x + b)) ** 2));
  return { m, b, sse, sx, sy, sxx, sxy, n };
}
/** Least-squares parabola y = a·x² + b·x + c (normal equations solved directly). */
export function fitParabola(points) {
  const S = (p, q) => sum(points.map(([x, y]) => x ** p * y ** q));
  const M = [[S(4, 0), S(3, 0), S(2, 0)], [S(3, 0), S(2, 0), S(1, 0)], [S(2, 0), S(1, 0), points.length]];
  const v = [S(2, 1), S(1, 1), S(0, 1)];
  const [a, b, c] = solve(M, v);
  return { a, b, c };
}
/** Distance of a point from the line through p and q (used by split & merge). */
export function pointLineDistance([x, y], [x1, y1], [x2, y2]) {
  return Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / Math.hypot(x2 - x1, y2 - y1);
}
/** Recursive split (Ramer–Douglas–Peucker style): returns indices of the break points. */
export function splitPolyline(points, emax) {
  const keep = new Set([0, points.length - 1]);
  (function rec(i, j) {
    let best = -1, d = -1;
    for (let k = i + 1; k < j; k++) { const dk = pointLineDistance(points[k], points[i], points[j]); if (dk > d) { d = dk; best = k; } }
    if (d > emax) { keep.add(best); rec(i, best); rec(best, j); }
  })(0, points.length - 1);
  return [...keep].sort((a, b) => a - b);
}

// ---------------------------------------------------------------- pyramids
/** 5-tap generating kernel  [c, b, a, b, c],  b = 1/4,  c = 1/4 − a/2. a = 0.4 Gauss-like, 0.5 triangle, 3/8 easy. */
export const pyramidKernel = (a = 0.4) => [0.25 - a / 2, 0.25, a, 0.25, 0.25 - a / 2];
/** REDUCE in 1-D: g_l(i) = Σ w(m) g_{l-1}(2i + m), m = −2..2 (border: replicate). */
export function reduce1D(g, a = 0.4) {
  const w = pyramidKernel(a);
  const n = Math.ceil(g.length / 2);
  return Array.from({ length: n }, (_, i) => w.reduce((s, wm, k) => s + wm * g[clamp(2 * i + k - 2, 0, g.length - 1)], 0));
}
/** EXPAND in 1-D: e(i) = 2 Σ w(m) g((i − m)/2) over the m where (i − m) is even. */
export function expand1D(g, len = g.length * 2, a = 0.4) {
  const w = pyramidKernel(a);
  return Array.from({ length: len }, (_, i) => {
    let s = 0;
    for (let m = -2; m <= 2; m++) { const j = i - m; if (j % 2 === 0) s += w[m + 2] * g[clamp(j / 2, 0, g.length - 1)]; }
    return 2 * s;
  });
}
export const reduce2D = (img, a = 0.4) => transpose(transpose(img.map((r) => reduce1D(r, a))).map((c) => reduce1D(c, a)));
export const expand2D = (img, h, w, a = 0.4) => transpose(transpose(img.map((r) => expand1D(r, w, a))).map((c) => expand1D(c, h, a)));
/** Gaussian pyramid [g0 (largest), g1, ...] and Laplacian pyramid [L0, ..., L_top = g_top]. */
export function pyramids(img, levels = 3, a = 0.4) {
  const g = [img];
  for (let i = 1; i < levels; i++) g.push(reduce2D(g[i - 1], a));
  const L = g.map((gi, i) => (i === g.length - 1 ? clone(gi) : zip(gi, expand2D(g[i + 1], gi.length, gi[0].length, a), (u, v) => u - v)));
  return { gauss: g, laplace: L };
}
export const downsample = (img, f = 2) => img.filter((_, y) => y % f === 0).map((r) => r.filter((_, x) => x % f === 0));

// ---------------------------------------------------------------- linear algebra & homogeneous transformations
export const matmul = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
export const matvec = (A, v) => A.map((r) => r.reduce((s, a, k) => s + a * v[k], 0));
export const identity = (n) => fromFn(n, n, (i, j) => (i === j ? 1 : 0));
export function det(M) {
  const n = M.length;
  if (n === 1) return M[0][0];
  if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
  return M[0].reduce((s, v, j) => s + (j % 2 ? -1 : 1) * v * det(M.slice(1).map((r) => r.filter((_, k) => k !== j))), 0);
}
/** Solve M x = v (Gaussian elimination with partial pivoting). */
export function solve(M, v) {
  const n = M.length; const A = M.map((r, i) => [...r, v[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; }
  }
  return A.map((r, i) => r[n] / r[i]);
}
export function inverse(M) { const n = M.length; const I = identity(n); const cols = I.map((e) => solve(M, e)); return transpose(cols); }
const C = (d) => { const v = Math.cos(rad(d)); return Math.abs(v) < 1e-12 ? 0 : v; };
const S = (d) => { const v = Math.sin(rad(d)); return Math.abs(v) < 1e-12 ? 0 : v; };
/** 3-D elementary homogeneous matrices (angles in degrees), as in the lecture notes (2.14), (2.15). */
export const Tran = (x, y, z) => [[1, 0, 0, x], [0, 1, 0, y], [0, 0, 1, z], [0, 0, 0, 1]];
export const RotX = (a) => [[1, 0, 0, 0], [0, C(a), -S(a), 0], [0, S(a), C(a), 0], [0, 0, 0, 1]];
export const RotY = (a) => [[C(a), 0, S(a), 0], [0, 1, 0, 0], [-S(a), 0, C(a), 0], [0, 0, 0, 1]];
export const RotZ = (a) => [[C(a), -S(a), 0, 0], [S(a), C(a), 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
export const Scale = (sx, sy, sz) => [[sx, 0, 0, 0], [0, sy, 0, 0], [0, 0, sz, 0], [0, 0, 0, 1]];
/** 2-D homogeneous (3×3). */
export const Tran2 = (x, y) => [[1, 0, x], [0, 1, y], [0, 0, 1]];
export const Rot2 = (a) => [[C(a), -S(a), 0], [S(a), C(a), 0], [0, 0, 1]];
export const Scale2 = (sx, sy = sx) => [[sx, 0, 0], [0, sy, 0], [0, 0, 1]];
export const Shear2 = (kx, ky = 0) => [[1, kx, 0], [ky, 1, 0], [0, 0, 1]];
/** Rodrigues rotation about the unit vector u by angle a (deg), formula (2.18). */
export function Rodrigues(u, a) {
  const n = Math.hypot(...u); const [x, y, z] = u.map((v) => v / n); const c = C(a), s = S(a), t = 1 - c;
  return [[x * x * t + c, x * y * t - z * s, x * z * t + y * s, 0], [x * y * t + z * s, y * y * t + c, y * z * t - x * s, 0], [x * z * t - y * s, y * z * t + x * s, z * z * t + c, 0], [0, 0, 0, 1]];
}
/** Rotation angle and axis of a rotation matrix: θ = acos((Sp − 2)/2) for 4×4 homogeneous, u from the antisymmetric part (2.30–2.31). */
export function rotationAxisAngle(T) {
  const sp = T[0][0] + T[1][1] + T[2][2] + (T.length === 4 ? T[3][3] : 1);
  const th = Math.acos(clamp((sp - 2) / 2, -1, 1));
  const s = 2 * Math.sin(th);
  return { angle: deg(th), axis: s ? [(T[2][1] - T[1][2]) / s, (T[0][2] - T[2][0]) / s, (T[1][0] - T[0][1]) / s] : [0, 0, 0] };
}
/** Inverse of a rigid homogeneous transform: [Rᵀ, −Rᵀv; 0 0 0 1]. */
export function invRigid(T) {
  const n = T.length - 1;
  const R = T.slice(0, n).map((r) => r.slice(0, n)); const v = T.slice(0, n).map((r) => r[n]);
  const Rt = transpose(R); const mv = matvec(Rt, v).map((x) => -x);
  return [...Rt.map((r, i) => [...r, mv[i]]), [...new Array(n).fill(0), 1]];
}
/** Compose a list of matrices that are applied one after the other in the BASE frame (active view: left multiplication). */
export const composeActive = (list) => list.reduce((T, M) => matmul(M, T), identity(list[0].length));
/** Compose in the LOCAL frame (passive view: right multiplication). */
export const composePassive = (list) => list.reduce((T, M) => matmul(T, M), identity(list[0].length));
/** Homogeneous descriptor matrix (4×n) of a list of points [[x,y,z], ...]. */
export const descriptor = (pts) => [0, 1, 2].map((i) => pts.map((p) => p[i])).concat([pts.map(() => 1)]);
export const cleanZero = (m, eps = 1e-9) => (Array.isArray(m) ? m.map((r) => cleanZero(r, eps)) : Math.abs(m) < eps ? 0 : m);
/** Backward-mapped rotation of an image about (cy, cx) by angle a (deg); interpolation 'nearest' | 'bilinear'. */
export function rotateImage(img, a, interp = 'nearest', center = null, fill = 0) {
  const [h, w] = shape(img);
  const [cy, cx] = center ?? [(h - 1) / 2, (w - 1) / 2];
  const c = Math.cos(rad(a)), s = Math.sin(rad(a));
  return fromFn(h, w, (y, x) => {
    // Lecture 4 forward rotation (r = row, c = column):  r' = r0 + Δr·cosβ − Δc·sinβ,  c' = c0 + Δr·sinβ + Δc·cosβ.
    // Backward mapping uses its inverse:                 r = r0 + Δr'·cosβ + Δc'·sinβ,  c = c0 − Δr'·sinβ + Δc'·cosβ.
    const dx = x - cx, dy = y - cy;
    const sy = cy + c * dy + s * dx, sx = cx - s * dy + c * dx;
    return interp === 'bilinear' ? bilinear(img, sy, sx, fill) : nearest(img, sy, sx, fill);
  });
}
export function nearest(img, y, x, fill = 0) { const yy = Math.round(y), xx = Math.round(x); return img[yy]?.[xx] ?? fill; }
export function bilinear(img, y, x, fill = 0) {
  const y0 = Math.floor(y), x0 = Math.floor(x), dy = y - y0, dx = x - x0;
  const g = (yy, xx) => img[yy]?.[xx] ?? fill;
  return (1 - dy) * ((1 - dx) * g(y0, x0) + dx * g(y0, x0 + 1)) + dy * ((1 - dx) * g(y0 + 1, x0) + dx * g(y0 + 1, x0 + 1));
}

// ---------------------------------------------------------------- thresholding & segmentation
/** Isodata (Ridler–Calvard): T0 = mean (or given); T = (μ_low + μ_high) / 2 until it stops changing. "low" = values <= T. */
export function isodata(img, T0 = null, eps = 0.5) {
  const f = img.flat();
  let T = T0 ?? (Math.min(...f) + Math.max(...f)) / 2;
  const steps = [];
  for (let it = 0; it < 100; it++) {
    const lo = f.filter((v) => v <= T), hi = f.filter((v) => v > T);
    const mLo = lo.length ? mean(lo) : 0, mHi = hi.length ? mean(hi) : 0;
    const Tn = (mLo + mHi) / 2;
    steps.push({ T, mLo, mHi, Tn });
    if (Math.abs(Tn - T) < eps) { T = Tn; break; }
    T = Tn;
  }
  return { T, steps };
}
/** Otsu on a histogram: pixels <= T are class B (background/dark). Returns best T and the between-class variance per T. */
export function otsu(hist) {
  const n = sum(hist); const p = hist.map((c) => c / n);
  const mu = sum(p.map((pi, i) => i * pi));
  let qB = 0, muT = 0, best = 0, bestV = -1; const sigma = [];
  for (let T = 0; T < p.length; T++) {
    qB += p[T]; muT += T * p[T];
    const qO = 1 - qB;
    const v = qB > 0 && qO > 0 ? (mu * qB - muT) ** 2 / (qB * qO) : 0;
    sigma.push(v);
    if (v > bestV + 1e-12) { bestV = v; best = T; }
  }
  return { T: best, sigmaB: sigma, mu };
}
/** Niblack local threshold T = μ + k·σ in a win×win window (population σ). Window is clipped at the borders. */
export function niblack(img, win = 3, k = -0.2) {
  const [h, w] = shape(img); const r = Math.floor(win / 2);
  return fromFn(h, w, (y, x) => {
    const v = [];
    for (let i = y - r; i <= y + r; i++) for (let j = x - r; j <= x + r; j++) if (i >= 0 && i < h && j >= 0 && j < w) v.push(img[i][j]);
    const m = mean(v); const s = Math.sqrt(mean(v.map((q) => (q - m) ** 2)));
    return m + k * s;
  });
}
/** Connected component labelling (labels 1..n in raster order of first appearance). conn = 4 | 8. */
export function labelComponents(bin, conn = 8) {
  const [h, w] = shape(bin); const lab = zeros(h, w); let n = 0;
  const nb = conn === 4 ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!bin[y][x] || lab[y][x]) continue;
    n++; const st = [[y, x]]; lab[y][x] = n;
    while (st.length) { const [cy, cx] = st.pop(); for (const [dy, dx] of nb) { const yy = cy + dy, xx = cx + dx; if (yy >= 0 && yy < h && xx >= 0 && xx < w && bin[yy][xx] && !lab[yy][xx]) { lab[yy][xx] = n; st.push([yy, xx]); } } }
  }
  return { labels: lab, count: n };
}
/** Region growing from a seed: 4-neighbours whose |I − I(seed)| <= tol. */
export function regionGrow(img, [sy, sx], tol) {
  const [h, w] = shape(img); const out = zeros(h, w); const s = img[sy][sx]; const st = [[sy, sx]]; out[sy][sx] = 1;
  while (st.length) { const [y, x] = st.pop(); for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < h && xx >= 0 && xx < w && !out[yy][xx] && Math.abs(img[yy][xx] - s) <= tol) { out[yy][xx] = 1; st.push([yy, xx]); } } }
  return out;
}

// ---------------------------------------------------------------- shape descriptors
/** Circular first difference of a chain code: d_i = (c_i − c_{i−1}) mod N, with c_{−1} = the last element. */
export function chainDiff(code, N = 8) {
  const c = typeof code === 'string' ? [...code].map(Number) : code;
  return c.map((v, i) => (((v - c[(i - 1 + c.length) % c.length]) % N) + N) % N);
}
/** Shape number: the circular rotation of the difference code that is the smallest number. */
export function shapeNumber(code, N = 8) {
  const d = chainDiff(code, N);
  let best = null;
  for (let i = 0; i < d.length; i++) { const r = d.slice(i).concat(d.slice(0, i)).join(''); if (best === null || r < best) best = r; }
  return best;
}
/** Freeman chain code of the outer boundary of a single 8-connected object (start: top-left pixel, clockwise in the image). */
export function chainCode(bin) {
  const [h, w] = shape(bin);
  const D = [[0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1]]; // [dy, dx]; 0=E, 1=NE, 2=N, … (counter-clockwise on screen)
  let start = null;
  for (let y = 0; y < h && !start; y++) for (let x = 0; x < w; x++) if (bin[y][x]) { start = [y, x]; break; }
  if (!start) return '';
  const on = (y, x) => y >= 0 && y < h && x >= 0 && x < w && !!bin[y][x];
  const code = []; let cur = start; let d = 1;
  // Left-hand rule: background on the left, object on the right → the boundary is walked clockwise on the screen.
  // Try the most-left direction first (d+2) and turn right step by step.
  for (let guard = 0; guard < 8 * h * w + 8; guard++) {
    let nd = -1;
    for (let k = 0; k < 8; k++) { const c = (d + 2 - k + 16) % 8; if (on(cur[0] + D[c][0], cur[1] + D[c][1])) { nd = c; break; } }
    if (nd < 0) break; // single pixel
    if (code.length && cur[0] === start[0] && cur[1] === start[1] && nd === code[0]) break; // Jacob's stopping criterion
    code.push(nd); cur = [cur[0] + D[nd][0], cur[1] + D[nd][1]]; d = nd;
  }
  return code.join('');
}
/** Perimeter estimate from an 8-direction chain code: (#even) + √2·(#odd). */
export function chainPerimeter(code) { const c = [...String(code)].map(Number); const e = c.filter((v) => v % 2 === 0).length; return e + Math.SQRT2 * (c.length - e); }
/**
 * Moments of a binary/grey image. x = column, y = row, `base` = index of the first row/column (0 or 1).
 * Returns raw m_pq, centroid, central μ_pq (p+q <= 3), normalised η_pq, Hu φ1..φ7 and the orientation.
 */
export function moments(img, base = 0) {
  const m = (p, q) => { let s = 0; img.forEach((r, y) => r.forEach((v, x) => { if (v) s += (x + base) ** p * (y + base) ** q * v; })); return s; };
  const m00 = m(0, 0), m10 = m(1, 0), m01 = m(0, 1);
  const xc = m10 / m00, yc = m01 / m00;
  const mu = (p, q) => { let s = 0; img.forEach((r, y) => r.forEach((v, x) => { if (v) s += (x + base - xc) ** p * (y + base - yc) ** q * v; })); return s; };
  const M = {}; const MU = {}; const ETA = {};
  for (let p = 0; p <= 3; p++) for (let q = 0; q <= 3 - p; q++) {
    M[`${p}${q}`] = m(p, q); MU[`${p}${q}`] = mu(p, q);
    ETA[`${p}${q}`] = MU[`${p}${q}`] / m00 ** ((p + q) / 2 + 1);
  }
  const e = ETA;
  const hu = [
    e['20'] + e['02'],
    (e['20'] - e['02']) ** 2 + 4 * e['11'] ** 2,
    (e['30'] - 3 * e['12']) ** 2 + (3 * e['21'] - e['03']) ** 2,
    (e['30'] + e['12']) ** 2 + (e['21'] + e['03']) ** 2,
  ];
  // principal axis: tan 2θ = 2μ11 / (μ20 − μ02); θ measured from +x towards +y (i.e. clockwise on the screen, because y points down)
  const theta = 0.5 * deg(Math.atan2(2 * MU['11'], MU['20'] - MU['02']));
  return { m: M, mu: MU, eta: ETA, hu, area: m00, xc, yc, theta };
}
/** Number of boundary pixels (object pixels with at least one 4-neighbour in the background). */
export function boundaryPixels(bin) {
  const [h, w] = shape(bin);
  return fromFn(h, w, (y, x) => (bin[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dy, dx]) => !bin[y + dy]?.[x + dx]) ? 1 : 0));
}
/** Compactness P² / (4πA). */
export const compactness = (P, A) => (P * P) / (4 * Math.PI * A);
/** Euler number E = C − H (objects 8-connected, holes = 4-connected background components not touching the border). */
export function eulerNumber(bin) {
  const C1 = labelComponents(bin, 8).count;
  const [h, w] = shape(bin);
  const bg = map(bin, (v) => (v ? 0 : 1));
  const { labels, count } = labelComponents(bg, 4);
  const border = new Set();
  for (let y = 0; y < h; y++) { border.add(labels[y][0]); border.add(labels[y][w - 1]); }
  for (let x = 0; x < w; x++) { border.add(labels[0][x]); border.add(labels[h - 1][x]); }
  let H = 0; for (let l = 1; l <= count; l++) if (!border.has(l)) H++;
  return { C: C1, H, E: C1 - H };
}

// ---------------------------------------------------------------- motion
/** Lucas–Kanade for one window: solve [ΣIx² ΣIxIy; ΣIxIy ΣIy²][u v]ᵀ = −[ΣIxIt; ΣIyIt]. Inputs are equal-size matrices or flat arrays. */
export function lucasKanade(Ix, Iy, It) {
  const a = Ix.flat(), b = Iy.flat(), t = It.flat();
  const sxx = sum(a.map((v) => v * v)), sxy = sum(a.map((v, i) => v * b[i])), syy = sum(b.map((v) => v * v));
  const sxt = sum(a.map((v, i) => v * t[i])), syt = sum(b.map((v, i) => v * t[i]));
  const D = sxx * syy - sxy * sxy;
  return { u: (-syy * sxt + sxy * syt) / D, v: (sxy * sxt - sxx * syt) / D, A: [[sxx, sxy], [sxy, syy]], B: [-sxt, -syt], det: D };
}
/** Normal flow (the only component measurable from one equation): magnitude −It/|∇I| along the gradient. */
export const normalFlow = (Ix, Iy, It) => -It / Math.hypot(Ix, Iy);
/** One Horn–Schunck update for a pixel given the neighbourhood averages. */
export function hornSchunckStep(Ix, Iy, It, uAvg, vAvg, lambda) {
  const k = (Ix * uAvg + Iy * vAvg + It) / (lambda + Ix * Ix + Iy * Iy);
  return { u: uAvg - Ix * k, v: vAvg - Iy * k };
}

// ---------------------------------------------------------------- Haar features & AdaBoost helpers
/** Two-rectangle Haar feature value (dark − light) from the integral image; rect = [y0, x0, y1, x1]. */
export const haar2 = (ii, dark, light) => rectSum(ii, ...dark) - rectSum(ii, ...light);
/** Best decision stump threshold for 1-D feature values with labels ±1 and weights (returns the error, threshold, polarity). */
export function bestStump(values, labels, weights = null) {
  const n = values.length; const w = weights ?? new Array(n).fill(1 / n);
  const cands = [...new Set(values)].sort((a, b) => a - b);
  const ths = [cands[0] - 1, ...cands.map((v, i) => (i + 1 < cands.length ? (v + cands[i + 1]) / 2 : v + 1))];
  let best = { err: Infinity };
  for (const th of ths) for (const pol of [1, -1]) {
    let err = 0; for (let i = 0; i < n; i++) { const pred = pol * (values[i] - th) > 0 ? 1 : -1; if (pred !== labels[i]) err += w[i]; }
    if (err < best.err - 1e-12) best = { err, th, pol };
  }
  return best;
}
/** One AdaBoost round: α = ½ ln((1−ε)/ε), w ← w·e^(−α y h), normalised. */
export function adaboostRound(weights, labels, preds) {
  const eps = sum(weights.map((w, i) => (preds[i] !== labels[i] ? w : 0)));
  const alpha = 0.5 * Math.log((1 - eps) / eps);
  const nw = weights.map((w, i) => w * Math.exp(-alpha * labels[i] * preds[i]));
  const s = sum(nw);
  return { eps, alpha, weights: nw.map((w) => w / s) };
}
/** PCA of row vectors (data[n][d]) via the n×n "snapshot" trick; returns the mean, eigenvalues and eigenvectors (unit, length d). */
export function pca(data, k = data.length) {
  const n = data.length, d = data[0].length;
  const mu = Array.from({ length: d }, (_, j) => mean(data.map((r) => r[j])));
  const X = data.map((r) => r.map((v, j) => v - mu[j]));
  const G = fromFn(n, n, (i, j) => sum(X[i].map((v, t) => v * X[j][t])));
  const { values, vectors } = jacobiEigen(G);
  const order = values.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, k);
  const comps = order.map(([, i]) => { const c = new Array(d).fill(0); for (let s = 0; s < n; s++) for (let t = 0; t < d; t++) c[t] += vectors[s][i] * X[s][t]; const nn = Math.hypot(...c) || 1; return c.map((v) => v / nn); });
  return { mean: mu, values: order.map(([v]) => v / (n - 1)), components: comps };
}
/** Symmetric eigen-decomposition (Jacobi). vectors[:, i] belongs to values[i]. */
export function jacobiEigen(Sym) {
  const n = Sym.length; const A = clone(Sym); const V = identity(n);
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] ** 2;
    if (off < 1e-20) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-15) continue;
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
    }
  }
  return { values: A.map((r, i) => r[i]), vectors: V };
}
