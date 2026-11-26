# Homogeneous transformations & modelling

Images often have to be **mapped onto each other** (warping, mosaics). Coordinate systems must be matched: camera ↔ image, camera ↔ world, robot base ↔ gripper. Objects must be **moved** in a modelled workspace. All of this is done with **homogeneous transformations**. The ZH always has a task where an object is moved step by step.

## Homogeneous coordinates

A 2-D point (x, y) becomes [x, y, 1]ᵀ, and a 3-D point (x, y, z) becomes [x, y, z, 1]ᵀ. In general [sx, sy, s]ᵀ ~ (x, y): homogeneous vectors are defined only **up to a scale factor**, so divide by the last coordinate to get the ordinary point. A last coordinate of **0** denotes a **direction** (a point at infinity).

Why bother? A 2 × 2 matrix can **rotate** and **scale**, but it cannot **add** a translation. With the extra coordinate, translation is also a matrix product:

| 2-D | matrix | DOF |
| --- | --- | --- |
| translation | [1 0 x0; 0 1 y0; 0 0 1] | 2 |
| rotation | [cosθ −sinθ 0; sinθ cosθ 0; 0 0 1] | 1 |
| Euclidean (rotation + translation) | [R t; 0 1] | 3 |
| similarity (+ uniform scale) | [sR t; 0 1] | 4 |
| affine (+ shear, non-uniform scale) | [a11 a12 a13; a21 a22 a23; 0 0 1] | 6 |
| projective (homography) | any 3 × 3 matrix up to scale | 8 |

## 3-D elementary transformations (lecture notes 2.14–2.15)

```text
Tran(v) = | 1 0 0 vx |   Rot(x,θ) = | 1  0     0    0 |
          | 0 1 0 vy |              | 0  cosθ −sinθ 0 |
          | 0 0 1 vz |              | 0  sinθ  cosθ 0 |
          | 0 0 0 1  |              | 0  0     0    1 |

Rot(y,θ) = |  cosθ 0 sinθ 0 |   Rot(z,θ) = | cosθ −sinθ 0 0 |
           |  0    1 0    0 |              | sinθ  cosθ 0 0 |
           | −sinθ 0 cosθ 0 |              | 0     0    1 0 |
           |  0    0 0    1 |              | 0     0    0 1 |
```

The axis we rotate about keeps its unit column. The other 2 × 2 block has cos on its diagonal and ±sin off it. **Rot(y)** is the odd one out (+sin in the top right), because the cyclic order is x → y → z → x. A positive angle rotates counter-clockwise when you look **from the positive end of the axis**: Ry(+90°) turns the z axis into the x axis.

The general T = [R v; perspᵀ n]: R is the 3 × 3 orientation, v the translation, persp ≈ 0 except for projections, n = 1.

## Composite transformations – active and passive view

Start with **T = I**, then for every elementary step M:

- the step is about/along an axis of the **fixed base frame** (*active* view, describing motion) → **T ← M · T** (multiply from the **left**);
- the step is about/along an axis of the **moving local frame** (*passive* view, changing the reference) → **T ← T · M** (from the **right**).

So a sequence in the base frame M₁, M₂, …, Mₙ gives **T = Mₙ · … · M₂ · M₁**. Matrix multiplication is not commutative, so the order matters.

Rotation about an axis **parallel to y** through v = (vx, 0, vz), formula 2.16:

T = Tran(v) · Rot(y, θ) · Tran(−v)

Read it right to left: move the axis into the origin, rotate, move back. This is the key trick for **tipping an object over an edge** without it going below the ground.

## Inverse and Rodrigues

For a rigid T = [R v; 0 1] the inverse is cheap: **T⁻¹ = [Rᵀ −Rᵀv; 0 1]**, because R is orthonormal (Rᵀ = R⁻¹).

Any rotation is a single rotation about some unit axis u by an angle θ (**Rodrigues**). Back from a matrix:

- Sp(T) = 2 + 2cosθ (trace of the 4 × 4 matrix), so θ = arccos((Sp − 2)/2);
- u = (R32 − R23, R13 − R31, R21 − R12) / (2 sinθ). This is only defined for 0 < θ < π.

## Modelling objects (2.34–2.35)

Approximate the object by planar faces, number its vertices, and collect their homogeneous coordinates as the **columns** of a **4 × n descriptor matrix**:

```text
          v1  v2 … vn
Object = | x1  x2 … xn |
         | y1  y2 … yn |
         | z1  z2 … zn |
         | 1   1  … 1  |
```

Moving the object is then a single product: **new position = T · old descriptor**. In the ZH you usually have to:

1. write the descriptor matrix (watch the vertex order!),
2. give the elementary steps, e.g. "never below z = 0" → rotate about an edge that touches the ground,
3. compute the position after **every** step (multiply the current descriptor by the next M).

```js
// tip a 1×1×2 box over its edge at x = 1, then push it along x
const box = [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,2],[1,0,2],[1,1,2],[0,1,2]];
let D = lib.descriptor(box);
const steps = [lib.Tran(-1,0,0), lib.RotY(90), lib.Tran(1,0,0), lib.Tran(3,0,0)];
for (const M of steps) { D = lib.cleanZero(lib.matmul(M, D)); print(JSON.stringify(D.slice(0, 3))); }
print('T =', JSON.stringify(lib.cleanZero(lib.composeActive(steps))));
```

## Transformation tasks in this app

Write one step per line:

- `Tran(x, y, z)`
- `Rx(a)`, `Ry(a)`, `Rz(a)` (degrees)
- `Ry(a) about (px, py, pz)` – rotation about the axis parallel to y through a point

Arguments may be expressions such as `-sqrt(2)`. **Run** shows the vertex matrix after every step, the lowest z reached **during** each motion, and the composite T. Use it to check the positions you calculated by hand.
