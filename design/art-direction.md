# Art direction

## Concept: geological brutalism

Three candidate directions were weighed against the blueprint's palette and subtitle, per the five-tool-design-pipeline's Awesome Design step (type/spacing scale and component grammar only; the palette itself comes from the blueprint, not the style file).

1. **Chosen - Industrial core-sample.** Raw, sharp-edged panels (zero border-radius), heavy 1-2px borders standing in for excavation lines, bold uppercase condensed type for structure (the rail, headers), monospace for every number (depth, magnitude, risk percentage). Reference: core-sample diagrams and seismic instrumentation readouts, not software dashboards.
2. Rejected - "Scientific minimal": thin hairline borders, generous whitespace, light-on-dark serif headers. Felt closer to TESSERA's archival/material register than RIFT's geological brutalism.
3. Rejected - "Alarm console": heavy red/black with blinking states everywhere. Read as a disaster-movie UI rather than an operational twin; dialed back to the Deep Red accent being reserved for bedrock/high-risk only.

## Palette (from the blueprint, used verbatim)
Basalt `#0A0908`, Volcanic `#1C1714`, Magma `#FF4A18`, Sulfur `#F2C94C`, Fault White `#E6DED2`, Iron `#6C5147`, Deep Red `#8E1C12`.

## Typography
System sans (Helvetica Neue/Arial) at heavy weight, uppercase, wide letter-spacing for structural labels (brand, nav, section headers); `ui-monospace` for every measured quantity. No serif anywhere (the book reserves serif registers for EIDOLON/TESSERA, not RIFT).

## Component grammar
No rounded corners, no card shadows, no glassmorphism (`backdrop-filter` is not used anywhere in `globals.css`). Panels are solid Volcanic fills with a 2px Iron border. Active states use solid Magma fill, not a glow. This differentiates RIFT from AURELIA (plasma glow) and LUCENT (refraction) in the same volume: nothing in this UI simulates light passing through a surface.
