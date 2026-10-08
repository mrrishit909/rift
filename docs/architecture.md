# Architecture

```
model/build.py ──Blender──> source.blend + exports/{infra-shaft,building-kit}.glb + renders/poster.png
model/validate.py ─fresh-scene re-import─> exports/validation.json (fails the build on any contract breach)
data/simulators/generate.ts ──> data/generated/{event,buildings,infra-nodes,infra-edges}.json (seeded, synthetic)
        │                              │
scripts/copy-assets.ts ──────────> apps/web/public/{data,models,posters}
                                       │
apps/web (Next.js 16 static export) ───┘      apps/api (node:http + ws) serves the same JSON on the book's /v1 contract
   App ─ store (external, useSyncExternalStore) ─ Panels (all DOM) + Scene (R3F canvas) + Intro (GSAP)
packages/domain: geology (stratigraphy), seismic (attenuation/envelope/wave radius), risk (building risk, edge failure/cascade) - pure, tested
packages/schemas: shared types + runtime validators
```

**Client/server boundary.** The public demo is static: no server is needed and the same JSON the API returns is fetched as files. `apps/api` implements the blueprint's section 7 contract (buildings and infrastructure recomputed per `?t=`, an idempotent inspection-note mutation, a WebSocket rupture replay) so the UI could be pointed at it; the static build fetches the generated files directly instead.

**State.** One external store holds product state (chapter, mode, simulation time, selection, flags). The render loop reads the mutable `live` object and `state` directly, so a playback tick never re-renders React. Panels subscribe through `useStore`.

**Units.** 1 scene unit = 40 m, both horizontally and in depth, so the ~1,600 m site radius and the ~2,000 m rupture-to-bedrock depth share one scale and the camera can move continuously between them without a unit switch.

**WebGPU.** The book's signature stack names WebGPU; this build ships WebGL2 (`three`'s `ShaderMaterial`/`WebGLRenderer`) because headless/CI Chromium and a meaningful share of real users have no WebGPU yet. There is no feature-detected WebGPU path in this slice; it is the honest substitution, not a silent downgrade.

**Stack substitutions.** The book's reference stack for this blueprint names Houdini (optional), PostGIS and FastAPI. This build uses Blender only (procedural, via `build.py`), the existing Node `apps/api` pattern in place of FastAPI, and in-memory synthetic GeoJSON-like arrays in place of PostGIS, since a ~1,600 m synthetic site has no need for a spatial database. These are documented substitutions, not omissions.

**Budgets** (asserted in `tests/e2e/performance.spec.ts`): infra-shaft GLB < 80 KB, building-kit GLB < 80 KB, gzipped JS < 750 KB, draw calls < 40, triangles < 30,000.

**Not built.** PostGIS/TimescaleDB (the demo reads JSON), FastAPI/Python scientific stack (the API is Node, the contract is the same), WebGPU compute, Houdini, Docker services beyond web and api, OpenTelemetry, auth.
