---
name: sound-design-web
description: Optional Web Audio / spatial sound tied to interaction, never decorative background music by default.
---

Gate all audio behind an explicit user opt-in (autoplay audio is both a browser policy problem and bad UX). Tie sound events to state changes the user caused (a transition, a toggle), not to idle loops.
