# Motion bible

## Easing and durations
- Camera moves: exponential smoothing per frame (`1 - exp(-dt * 2.4)`), not a fixed-duration tween, so chapter switches feel like a continuous descent/ascent regardless of how fast the user clicks through the rail.
- Intro beats: `power1.inOut` (GSAP default) for captions and light beats, `power2.in` for the depth descent (accelerating, like falling), `none` (linear) for the rupture clock so `state.t` reads as a real clock, not an eased animation.
- Panel transitions (chapter switch): CSS keyframe slide, 0.6s, `cubic-bezier(.2,.8,.2,1)`.

## Camera rules
- Never cut; every chapter change moves the same persistent camera to a new target, exponentially smoothed.
- The intro descent and the post-intro chapter camera share the same vertical axis (straight down through the core column at the epicenter), so jumping between "Watch the intro again" and "Use the rail" never looks like two different cameras.
- No camera acceleration spikes: the exponential-smoothing constant (2.4) was chosen by watching the chapter-to-chapter jump at the largest depth delta (bedrock 1,800 m to street 0 m) and confirming no single frame moves more than a few percent of the remaining distance.

## Scroll mapping
- Wheel over the 3D stage (not over a panel) steps one chapter per gesture, rate-limited to 700ms, matching the Volume VII pattern. This is a deliberate choice over continuous scroll-scrubbing: six chapters is small enough that discrete stations read better than a continuous 1,800 m scrub bar.
- Within the street chapter, the "Simulate" mode's time scrub is the one continuous drag surface in the product; everything else is discrete.

## Reduced-motion equivalents
- Intro: four static captioned frames replace the descent/fracture/wave timeline. No information is dropped, only the choreography.
- Post-intro: `state.pauseMotion` (toggle in the HUD) and `prefers-reduced-motion` both set `state.reduced`, which switches camera lerp from exponential smoothing to an instant snap (`k = 1`) and removes the panel slide-in animation's transform (kept as an opacity change only, handled by the global reduced-motion media query in `globals.css`).

## Purpose audit
Every animated value in this product maps to one of: simulation state (`state.t`, `live.waveK`/`fracture`), camera hierarchy (chapter depth), or direct user feedback (hover/active states). There is no animation in this product that exists only for decoration; the one candidate (the waveform SVG line in the intro) is removed in reduced motion specifically because it carries no information once the caption describes it.
