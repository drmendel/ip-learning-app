// Procedural sample images (deterministic, no files needed).
// Every image is an array of rows with integer grey values 0..255 (binary images: 0/1).
import { fromFn, map, clamp, parseGrid } from './imglib.js';

function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function gauss(r) { const u = Math.max(r(), 1e-12), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

const N = 64;
const shapes = fromFn(N, N, (y, x) => {
  if (x >= 8 && x < 28 && y >= 10 && y < 30) return 200;                       // square
  if ((x - 44) ** 2 + (y - 20) ** 2 <= 100) return 150;                         // disc
  if (y >= 38 && y < 56 && x >= 10 + (56 - y) * 0 && x - 10 <= (y - 38) * 1.2) return 100; // triangle
  if (x >= 36 && x < 58 && y >= 42 && y < 50) return 230;                       // bar
  return 40;
});

function noisy(img, sigma, seed) { const r = rng(seed); return map(img, (v) => clamp(Math.round(v + sigma * gauss(r)))); }
function saltPepper(img, p, seed) { const r = rng(seed); return map(img, (v) => { const q = r(); return q < p / 2 ? 0 : q < p ? 255 : v; }); }

const lines = fromFn(32, 32, (y, x) => ((y === 8 && x >= 3 && x < 29) || (x === 20 && y >= 2 && y < 30) || (x === y && x >= 4 && x < 28) ? 1 : 0));
const blob = fromFn(32, 32, (y, x) => {
  const c = Math.cos(Math.PI / 6), s = Math.sin(Math.PI / 6);
  const dx = x - 15.5, dy = y - 15.5; const u = c * dx + s * dy, v = -s * dx + c * dy;
  return (u / 11) ** 2 + (v / 5) ** 2 <= 1 ? 1 : 0;
});
const frame = (sx, sy) => fromFn(24, 24, (y, x) => Math.round(60 + 150 * Math.exp(-((x - 10 - sx) ** 2 + (y - 12 - sy) ** 2) / 18)));

export const IMAGES = {
  shapes,
  noisy: noisy(shapes, 18, 7),
  saltpepper: saltPepper(shapes, 0.08, 11),
  lowcontrast: map(shapes, (v) => Math.round(100 + (v - 40) * 0.25)),
  dark: map(shapes, (v) => Math.round(v * 0.3)),
  gradient: fromFn(N, N, (y, x) => Math.round((x * 255) / (N - 1))),
  checker: fromFn(N, N, (y, x) => ((Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? 210 : 50)),
  step: fromFn(16, 16, (y, x) => (x + y >= 16 ? 180 : 60)),
  lines,
  blob,
  frame1: frame(0, 0),
  frame2: frame(1, 0),
  zh: parseGrid(`64 67 83 123 146 140 142 142
66 73 96 129 146 141 139 143
68 82 101 137 147 190 147 139
70 91 135 147 175 156 151 140
70 95 137 175 156 151 140 143
69 83 151 156 160 156 146 150
68 87 126 153 163 158 152 155
68 88 126 153 164 158 155 155`),
};
export const IMAGE_INFO = {
  shapes: '64×64, square/disc/triangle/bar on a dark background',
  noisy: 'shapes + Gaussian noise (σ = 18)',
  saltpepper: 'shapes + 8 % salt-and-pepper noise',
  lowcontrast: 'shapes squeezed into 100…148',
  dark: 'shapes, very dark (×0.3)',
  gradient: 'horizontal ramp 0…255',
  checker: '8×8-pixel checkerboard',
  step: '16×16 diagonal step edge (60 / 180)',
  lines: '32×32 binary: a horizontal, a vertical and a 45° line',
  blob: '32×32 binary ellipse tilted by 30°',
  frame1: '24×24 bright Gaussian spot', frame2: 'frame1 moved 1 pixel to the right',
  zh: 'the 8×8 intensity table of the sample ZH',
};
