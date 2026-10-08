---
name: scroll-choreography
description: Map scroll position to world or system state, not to copy sliding upward.
---

Define the scroll-to-state function in design/motion-bible.md: what changes at each scroll milestone (camera, material, data layer, simulation time). Every transition should visually explain the relationship between where the user was and where they land. Use a single GSAP ScrollTrigger-driven progress value as the source of truth, not duplicated scroll listeners.
