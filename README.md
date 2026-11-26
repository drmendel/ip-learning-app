# ip-learning-app – learn image processing by doing

A self-contained practice app for **Képfeldolgozás** (image processing, Óbudai Egyetem MSc). Every lecture topic has a short lesson and hands-on tasks that are **graded on the spot**. The tasks include hand calculations like in the ZH, algorithms you implement in JavaScript, and 3-D homogeneous transformation sequences. The course ends with all **gyakorló** (practice) sheet tasks and a timed **mock ZH** built from the two sample ZH sheets.

Available in **English** and **Hungarian** (EN/HU selector in the top bar). No AI and no external services are involved, and there are **no npm dependencies**.

## Run it

```bash
npm start                 # Node ≥ 20
# or
deno run -A server.js     # Deno ≥ 2
# or
docker compose up -d --build
```

Open **http://localhost:8766**. Use another port with `PORT=9000 npm start`. The server listens on `127.0.0.1` by default; set `HOST=0.0.0.0` to expose it on your network.

## What's inside

| # | Module | Source |
| --- | --- | --- |
| 0 | Start here – how grading works, conventions | – |
| 1 | Digital images & data structures (histogram, normalised histogram, integral image, Haar features) | Lectures 2–3 |
| 2 | Intensity transformations (point operations, stretching, equalisation, error diffusion, backward mapping, interpolation) | Lecture 4 |
| 3 | Filtering & convolution (convolution vs correlation, box/Gauss/binomial, median, sharpening) | Lecture 5 |
| 4 | Edge detection (Sobel/Prewitt, compass masks, LoG, Canny steps, SUSAN, expected-position edges) | Lecture 6 |
| 5 | Corners, feature points & template matching (H matrix, λ−, Harris, SSD/SAD/CC) | Lectures 6–7 |
| 6 | Hough transform & curve fitting (least squares, split & merge) | Lecture 8 |
| 7 | Image pyramids (REDUCE/EXPAND, Gaussian & Laplacian) | Lecture 8 |
| 8 | Homogeneous transformations & modelling (active/passive, Rodrigues, descriptor matrices, moving objects) | Lecture 9 |
| 9 | Thresholding & segmentation (Isodata, Otsu, Niblack, connected components, region methods) | Lecture 10 |
| 10 | Shape descriptors & moments (chain code, shape number, signatures, central moments, Hu invariants) | Lecture 11 |
| 11 | Optical flow & face detection (Lucas–Kanade, Horn–Schunck, Viola–Jones, AdaBoost, eigenfaces) | Lectures 12–13 |
| 12 | Theory drill – quizzes + flashcards for ZH part II | Lectures |
| 13 | **Practice sheets** – every task of the 4 gyakorló sheets with the original points | Gyakorló |
| 14 | **Mock ZH** – 90 minutes, replica of `minta_zh_1` (28 p) + `minta_zh_2` (21 p), partial points, grade | ZH |

The **Image lab** (playground) runs JavaScript with the whole course toolbox (`lib.sobel`, `lib.histEq`, `lib.moments`, `lib.houghLines`, …) on sample images. Use it as a calculator to check hand calculations. The **cheat sheet** drawer collects the formulas.

## How tasks are graded

- **Calculation** tasks: each typed cell is compared with the reference value, computed with `engines/imglib.js`. The tolerance is ±0.011 or 0.5 % unless the task asks for exact integers. Answers may be expressions (`sqrt(2)/2`, `3/4`, `cos(45)` in degrees, decimal comma). Wrong cells are marked red. In the mock ZH every sub-answer earns its own points.
- **Code** tasks: your function and the reference run on several test images in a sandbox (`node:vm`, 1.5 s limit) and the results are compared.
- **Transformation** tasks: the steps (`Tran`, `Rx/Ry/Rz`, `… about (px,py,pz)`) are applied in the base frame. The app checks the final position, that the object never goes below z = 0 (also *during* rotations, sampled every degree), and, where relevant, that it fits through the gate.
- **Theory** flashcards are self-assessed against a model answer.

Conventions: x = column (→), y = row (↓); ZH tables are 1-based, code is 0-based (`img[y][x]`). Where a sheet leaves something open (e.g. the "marked area" of the Harris task, x\* = 3 in the box task), the task states the choice.

## Architecture

```text
browser (public/: vanilla JS, i18n.js, progress in localStorage)
   │  JSON API: /api/modules /api/run /api/check /api/reveal /api/images /api/cheatsheet /api/health
   ▼
server.js (Node or Deno, stateless, no dependencies)
   ├─ engines/imglib.js     the image-processing toolbox (reference answers, playground `lib`)
   ├─ engines/expr.js       safe evaluator for typed answers
   ├─ engines/sandbox.js    runs visitor JavaScript in node:vm with a time limit
   ├─ engines/transform.js  parser/simulator for transformation sequences
   ├─ engines/grade.js      calc / code / steps grading
   ├─ engines/images.js     procedural sample images
   └─ content/              modules (m*.js), lessons (lessons/*.md), Hungarian texts (i18n/hu, lessons/hu)
```

## Self-test

`npm test` (or `deno run -A test/verify.js [moduleId]`) checks:

- that every reference answer has the right shape and grades itself as correct,
- that every reference program passes and every starter fails,
- that the listed typical wrong answers are rejected,
- the expression parser,
- that every exercise, field label, lesson and grader message is translated.

## Adding content

See **CONTENT_GUIDE.md**. In short: add an exercise to `content/mNN-*.js` with a `solve()` (or `solution`), add its Hungarian texts to `content/i18n/hu/<module>.js`, and run `npm test`.

## Hosting for others: security

Visitors execute JavaScript on the server inside `node:vm`, which is **not a security sandbox**. The compose file locks the container down (non-root, read-only filesystem, no capabilities, memory and PID limits). That limits what a malicious visitor can do, but host it only for people you trust, or put it behind authentication.
