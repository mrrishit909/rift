---
name: visual-regression
description: Playwright screenshot baselines that don't flake on a software renderer.
---

Freeze or explicitly seek the GSAP timeline to a fixed time before toHaveScreenshot, disable CSS animations you don't control, and set maxDiffPixelRatio generously for SwiftShader noise. toBeVisible ignores opacity and clip-path, assert computed style directly when a fade matters.
