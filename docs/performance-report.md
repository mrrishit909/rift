# Performance report

Hardware: Apple M3 Pro laptop, Chrome stable, **software WebGL (SwiftShader)**, 1280 x 800. No physical GPU was exercised, so this is a bound, not a 60 fps claim on real hardware (though the bound itself already clears 60 fps). Command: `node scripts/measure.mjs` after `npm run build` and `node scripts/serve.ts`.

| Measure | Value | Budget |
|---|---|---|
| Transfer, street/simulate view (20 requests, uncompressed local server) | 255 KB | n/a |
| JS gzipped (all chunks) | 568 KB | 750 KB |
| infra-shaft GLB / building-kit GLB | 25 KB / 15 KB | 80 / 80 KB |
| Draw calls / triangles / geometries / textures | 20 / 16,314 / 20 / 1 | 40 / 30,000 |
| LCP | 3.8 s (shader compilation on the CPU rasteriser) | none set |
| CLS | 0 | 0.1 |
| Long-task total during load | 2.0 s | none set |
| Median / p95 frame time | 16.7 / 16.8 ms (60 fps, software) | none set |

What this does and does not say: draw calls and triangles are renderer-reported and device independent, so they are real bounds. LCP, long tasks and frame time are dominated by software rasterisation and would be lower still on a GPU; the 3.8 s LCP is the cost of compiling the column/fault/wave shaders on SwiftShader, not a GPU number.

Degradation: the frame loop stops when the tab is hidden (`document.hidden` toggles `setFrameloop`); `?gfx=off` and WebGL context loss both swap the canvas for the static poster; reduced motion drops the intro timeline and ambient camera drift. There is no automatic quality ladder (dpr capped at 1.5): the scene is light enough at this instance count that one was not needed, revisit if the building/edge counts grow an order of magnitude.
