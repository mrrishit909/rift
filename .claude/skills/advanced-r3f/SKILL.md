---
name: advanced-r3f
description: Three.js / React Three Fiber runtime: cameras, raycasting, scene graph, state.
---

One shared R3F canvas per experience, scene state driven by a single store (not scattered useState). Dispose geometries/materials on unmount. GPU uniforms update through a ref (material.current.uniforms.x.value = ...), never by mutating a plain object passed as the uniforms prop, since R3F clones it on mount.
