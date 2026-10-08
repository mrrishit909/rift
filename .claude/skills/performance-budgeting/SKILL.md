---
name: performance-budgeting
description: Explicit per-project ceilings for GLB size, texture memory, JS bundle, draw calls, shader count, GPU memory, and a measured 60fps/30fps degraded-path target.
---

Record the ceilings and the measured results in docs/performance-report.md with the actual test machine and browser named (SwiftShader/headless numbers are not a GPU claim, label them as such). Pause or throttle the render loop when document.hidden is true.
