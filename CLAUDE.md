# RIFT

Real-time seismic risk and subsurface infrastructure digital twin (blueprint 01, Advanced Engineering Build Book Vol. VIII). Geological brutalism. The public site is static; the Blender asset is scripted.

- Build the asset: `npm run model` (needs Blender 4.5 at ~/Applications). Then `node scripts/copy-assets.ts`.
- Data: `npm run seed` (deterministic, synthetic). Tests: `npm test` (domain + API), `npm run e2e` after `npm run build`.
- Worlds: 1 scene unit = 100 m of depth. Camera drops along -y through soil/sediment/rock/bedrock/fault layers, then rises to street level.
- Multi-agent is the DEVELOPMENT process (see .claude/agents); the product contains no agents.
- Everything in the UI is synthetic seismic/infrastructure data. Do not present it as a real survey.
