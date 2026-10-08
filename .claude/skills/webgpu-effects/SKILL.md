---
name: webgpu-effects
description: Compute-shader and WebGPU-specific techniques where the budget and browser support allow.
---

Only reach for this when WebGPU is actually available (navigator.gpu); every effect needs a WebGL2 equivalent path, because headless/CI browsers and a meaningful slice of real users have no WebGPU yet. Document the fallback explicitly, don't silently degrade.
