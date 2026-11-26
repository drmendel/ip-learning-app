# Mock ZH

This is a replica of the two **sample ZH sheets** of the course:

| Part | Source | Tasks | Points |
| --- | --- | --- | --- |
| I. Practical | `minta_zh_1` | 1) position of a 45° edge · 2) centroid + central moments · 3) moving a box through a gate | 8 + 8 + 12 = **28** |
| II. Theory | `minta_zh_2` | 8 short questions | **21** |

**90 minutes**, 49 points in total. When you start, a timer appears at the top. Hints and solutions are hidden, and transformation tasks don't show intermediate positions.

- Calculation tasks are graded automatically and earn **partial points** per sub-answer.
- Theory answers are written into the text boxes. After you finish, compare them with the model answers and **score yourself** (0, half or full points).

The grade uses an estimated scale: 85 % → 5, 70 % → 4, 55 % → 3, 40 % → 2. The official limits may differ.

## Before you start

Have paper and a calculator ready, like in the real ZH. Methods you will need:

- **Expected-position edge segment detection** (Edge detection module): sum the intensities along the known edge direction, then differentiate across it.
- **Moments** (Shape descriptors module): x̄ = m10/m00, ȳ = m01/m00, μ_pq = Σ (x − x̄)ᵖ (y − ȳ)^q.
- **Homogeneous transformations** (Homogeneous transformations module): the descriptor matrix, rotating about an edge to stay above z = 0, and composing in the base frame (T = Mₙ · … · M₁).
- Theory from all lectures (Theory drill module).

Concrete values the sheet leaves open (here x\* = 3, the vertex order, the target pose) are stated in each task.

## Coverage of the sample ZH

| Sample ZH question | Practised in |
| --- | --- |
| 45° edge in the highlighted region | Edge detection → expected-position edges |
| centroid + first three central moments | Shape descriptors & moments |
| box through the gate (descriptor, sequence, every step) | Homogeneous transformations · practice sheet 3 |
| normalised histogram | Digital images & data structures |
| SSD / SAD | Corners, feature points & template matching |
| backward mapping for rotation | Intensity transformations |
| mask weight normalisation | Filtering & convolution |
| Gaussian vs Laplacian pyramid level | Image pyramids |
| Canny steps | Edge detection |
| n-th order shapes | Shape descriptors & moments |
| central moments + invariance | Shape descriptors & moments |

Outside the exam you can open every task in practice mode (with hints and solutions) from the list on the left.
