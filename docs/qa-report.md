# QA report

Run on Apple M3 Pro, Chrome (stable), Playwright 1.63, WebGL through SwiftShader. Last full run: 17 e2e passed, 17 unit/API tests passed.

| Matrix row | Covered by | Result |
|---|---|---|
| Intro: first load, skip, reduced motion | demo walk, "reduced motion" test | pass |
| Input: click, keyboard | risk-table selection, "keyboard-only" nav test (focus + Enter) | pass |
| Input: range (simulate scrub) | "simulate" test (drag via fill), "out-of-range clamps natively" test | pass |
| Input: empty/invalid | the only form is the idempotent notes POST; covered in `apps/api/test/api.test.ts` (empty text, over-length text, missing building) | pass |
| Scroll: wheel changes world state | wheel-to-layer-change reuses the Volume VII pattern; not re-tested per blueprint, same code path | by design |
| Responsive | 375 px width: HUD and risk table visible, no horizontal scroll | pass (one size) |
| Motion: reduced | static keyframe list, same chapter navigation, no GSAP timeline mounted | pass |
| Graphics: success | all WebGL e2e tests | pass |
| Graphics: failure | `?gfx=off` swaps to the poster with zero canvas elements | pass |
| Graphics: slow GPU | SwiftShader is the slow GPU here: median frame 16.7 ms | pass as a bound |
| Lifecycle: tab hidden | frame loop pauses on `visibilitychange`; not automated (no reliable headless hidden-tab signal) | manual only |
| Infrastructure cascade | "infrastructure mode" test: failed-edge count changes between T-2s and T+10s | pass |
| Risk recompute | API test: aggregate risk at T+7s exceeds T-2s | pass |
| Visual regression | 6 chapters against the poster fallback (`tests/e2e/visual.spec.ts`) | pass |
| Performance | `tests/e2e/performance.spec.ts` | pass |

Mobile is an art-directed alternative, not a scaled-down desktop view: the HUD collapses to a horizontal top rail, the panel loses its right border and fills the width, and the 3D canvas keeps rendering live (no fallback to a static image at 375 px, that path is reserved for `?gfx=off` or a lost context).
