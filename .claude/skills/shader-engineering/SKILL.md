---
name: shader-engineering
description: GLSL/WGSL for procedural material and simulation effects.
---

Feature-detect WebGPU; fall back to a WebGL2/GLSL path and say so in docs/architecture.md rather than claiming WebGPU everywhere. smoothstep(edge0, edge1, x) is undefined when edge0 > edge1; write 1.0 - smoothstep(lo, hi, x) instead of swapping arguments. Keep uniform counts and shader variants within the project's performance budget.
