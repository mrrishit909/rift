---
name: blender-to-browser
description: Build the minimum procedural asset in Blender via build.py, validate the export, and document the contract the browser code relies on.
---

model/source.blend (or a build.py-only procedural asset when no hand-authored source is needed) plus build.py and validate.py. validate.py checks a fresh GLB import: object names, triangle budget, no orphaned materials. docs/asset-contract.md records object names, pivots, transforms, which parts the browser drives, and texture/material expectations. Keep triangle counts in the low thousands; this is a procedural prop, not a hero asset.
