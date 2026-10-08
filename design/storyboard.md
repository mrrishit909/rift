# Storyboard

Frame-by-frame, matching `apps/web/src/ui/Intro.tsx`'s GSAP timeline. Times are wall-clock seconds (`gsap.ticker.lagSmoothing(0)`).

| t | Frame | Shared element carried to the next beat |
|---|---|---|
| 0.0 | Pure black, caption "Silence. A fault, waiting." | - |
| 1.6 | A thin horizontal line begins to vibrate into a seismic waveform (SVG polyline, low amplitude) | the waveform polyline itself |
| 4.2 | The waveform spikes (amplitude jumps); `live.fracture` animates 0 to 1, the fault plane's crack shader brightens | `live.fracture`, read by `FaultPlane` and `CoreColumn` |
| 5.6 | Camera drop begins: `live.introDepth` animates 0 to 1,800 m over 10s, passing the soil/sediment/rock/bedrock boundaries (depth meter ticks each) | the depth-driven camera rig in `Scene.tsx`'s `Rig` |
| 13.0 | Caption: "Pipelines and tunnels, embedded in the rock" - the infrastructure shafts and pipes are already in frame (they do not fade in separately) | the same `Infrastructure` meshes used post-intro |
| 15.4 | The rupture starts: `state.t` animates -2 to 9s, the fault plane fractures further, the energy-wave ring begins expanding from the epicenter | `state.t`, read by `EnergyWave`, `Buildings`, `Infrastructure` |
| 18.6 | Caption: "The wave reaches the city" - buildings at street level begin tinting by risk as the wave front passes under them | building instance colors |
| 20.4 | Light mask (`--mask` CSS var) expands from the fault epicenter to reveal the full street-level HUD | the same `--mask` radial-gradient mechanism, centered on the same screen point the fault sat at |

The hand-off at 20.4s is the book's required "shared camera move/geometry/material/mask": the light mask's origin point is the same screen-space position the fault plane occupied through the whole descent, so the reveal reads as the fault opening into the operational map rather than a cut to a new screen.

**Skip intro** jumps straight to t=20.4 in the timeline (not an instant unmount), so the mask animation still plays; a second skip press (if the timeline is already past 20.4) force-finishes instantly.

**Reduced motion** replaces the above with four static captioned frames and a single "Enter the operational map" button; no camera movement, no fracture, no wave animation plays, but every narrative beat is still described in text.
