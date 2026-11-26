# Start here

This app turns the **Képfeldolgozás** (image processing) course into tasks you solve and get graded on immediately. It follows the lectures (Vámossy Zoltán's slides) topic by topic, then ends with the **gyakorló** (practice) sheets and a timed **mock ZH** built from the two sample ZH sheets.

## Four kinds of tasks

| Badge | What you do | How it is graded |
| --- | --- | --- |
| **Calculation** | Calculate by hand (like in the ZH) and type numbers or whole matrices into a grid | Every cell is compared with the reference value; wrong cells turn red |
| **Code · JavaScript** | Implement the algorithm as a JavaScript function | Your function and the reference run on several test images and the results are compared |
| **Transformations** | Write a sequence of `Tran` / `Rx` / `Ry` / `Rz` steps that moves a 3-D object | The final position and the constraints (e.g. never below z = 0) are checked; you see the position after every step |
| **Quiz / Flashcard** | Theory, as in the ZH's second part | Quizzes are checked at once, flashcards you rate yourself |

Shortcuts: **Ctrl+Enter** runs code (or checks a calculation), **Ctrl+Shift+Enter** checks.

## Conventions used everywhere

An image is a function **f(x, y)**: **x = column** (to the right), **y = row** (downwards). The ZH tables count from **1**:

```grid
# f(x, y), 1-based like in the ZH
12 40 40 200 210
15 45 180 220* 230
10 170 190 225 240
160 175 200 230 250
```

The highlighted pixel is **f(4, 2) = 220** (column 4, row 2).

In **code** the image is an array of rows, indexed from **0**: the same pixel is `img[1][3]` – row first.

```js
const img = IMG.shapes;            // a 64×64 sample image
print(img.length, img[0].length);  // rows, columns
print(img[20][15]);                // row 20, column 15
show(img, 'shapes');
```

Press **▶ Try** on a code block to open it in the **Image lab**. The lab gives you every function of the course toolbox (`lib.sobel`, `lib.histEq`, `lib.moments`, …). Use it as a calculator to check your hand calculations.

## Typing answers

- Fractions and expressions are fine: `3/4`, `sqrt(2)/2`, `2^3`, `pi/4`.
- Trigonometric functions use **degrees**: `cos(60)` = 0.5, `atan(1)` = 45.
- The decimal comma works too: `0,25`.
- Results are accepted within about ±0.01 (or 0.5 % for large values), unless a task says the answer must be an exact integer.

## Your progress

Progress, drafts and exam results are stored **in this browser only**. Nothing is sent anywhere except to the local practice server for grading.

## Suggested route

1. Modules 1–11 follow the lectures. Read the lesson, then do the tasks.
2. Module 12 drills the theory questions of the ZH's second part.
3. Module 13 contains every **gyakorló** sheet task with its original points.
4. Module 14 is the **mock ZH**: a timed replica of the two sample ZH sheets (28 practical + 21 theory points).
