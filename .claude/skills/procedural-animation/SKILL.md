---
name: procedural-animation
description: Timeline choreography: GSAP, ScrollTrigger, FLIP, Lenis for smooth scroll and sequenced motion.
---

One GSAP timeline per major sequence, labeled sections, easing chosen for the domain (not a default ease-out everywhere). gsap.ticker.lagSmoothing(0) for wall-clock-driven intros so a slow first paint doesn't desync the timeline. Clean up ScrollTriggers on unmount.
