# Asset contract

## infra-shaft.glb
Root empty `InfraShaft` at the node origin, Y-up after export.
- `ShaftRing` - the surface collar.
- `ShaftCollar` - the vertical concrete bore. The browser instances this single mesh's geometry (one `THREE.InstancedMesh`) at every `InfraNode`, driving per-instance color (iron when healthy, magma when an adjoining edge has failed) via an instance color attribute.
- `Rung0..Rung5`, `ShaftGlow` - present in the asset for future higher-fidelity passes; not instanced at runtime to keep the node layer to one draw call.

Positioned at `(x, z, -depthM)` in scene units per the coordinate convention in `docs/architecture.md`.

## building-kit.glb
Root empty `BuildingKit`. Five named variants, `Building1..Building5`, each a paired `BuildingN` (concrete mass) and `BuildingNWindows` (glass panel) sharing one pivot at the building's ground-floor center.

The browser instances `Building1`'s mass geometry alone (one `THREE.InstancedMesh` for all buildings, one draw call), with a non-uniform per-instance scale giving each building its real footprint and `heightM`, and a per-instance color attribute for risk (risk mode), infrastructure-neutral gray (infra mode), or a risk-tinted red during a running simulation. The other four variants and the window sub-meshes are kept in the asset for a future higher-fidelity pass; the runtime trades their silhouette variety for a single draw call, which is documented in `docs/performance-report.md`.

Neither asset is hand-authored geometry beyond primitive composition; both are procedural, deterministic, and re-buildable from `model/build.py`.
