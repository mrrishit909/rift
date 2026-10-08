// Synthetic RIFT event, buildings and buried infrastructure. Deterministic (seeded). Not a real hazard, survey or utility record.
import { mkdirSync, writeFileSync } from "node:fs";
import { mulberry32, strataAt } from "../../packages/domain/src/index.ts";
import type { SeismicEvent, Building, InfraNode, InfraEdge } from "../../packages/schemas/src/index.ts";

const r = mulberry32(1908);
const event: SeismicEvent = { id: "ev-01", name: "Harrow Fault rupture", x: 0, z: 0, magnitude: 6.1, depthKm: 3.2, ruptureDurationS: 7, startedAt: "2026-10-08T05:12:00Z" };

const BKIND = ["residential", "residential", "commercial", "commercial", "hospital", "school"] as const;
const buildings: Building[] = Array.from({ length: 36 }, (_, i) => {
  const ang = (i / 36) * Math.PI * 2 + r() * 0.3, rad = 150 + r() * 1400;
  const kind = BKIND[Math.floor(r() * BKIND.length)];
  return { id: `bld-${i + 1}`, name: `${kind === "hospital" ? "St. Averil Medical" : kind === "school" ? "Fenwick School" : kind === "commercial" ? "Lattice Tower" : "Birch Row Housing"} ${i + 1}`, x: Math.cos(ang) * rad, z: Math.sin(ang) * rad, heightM: kind === "commercial" ? 40 + r() * 140 : kind === "residential" ? 8 + r() * 24 : 12 + r() * 10, kind, vulnerability: Math.min(1, 0.15 + r() * 0.75) };
});

const nodes: InfraNode[] = [];
const push = (id: string, kind: InfraNode["kind"], x: number, z: number, depthM: number) => { nodes.push({ id, kind, x, z, depthM }); return id; };
const junctionIds: string[] = [];
for (let i = 0; i < 14; i++) {
  const ang = (i / 14) * Math.PI * 2, rad = 300 + (i % 3) * 400;
  junctionIds.push(push(`jn-${i + 1}`, i % 4 === 0 ? "substation" : i % 5 === 0 ? "tunnel-shaft" : "pipe-junction", Math.cos(ang) * rad, Math.sin(ang) * rad, 6 + (strataAt(Math.cos(ang) * rad, Math.sin(ang) * rad).soil - 6)));
}
const edges: InfraEdge[] = [];
const kinds: InfraEdge["kind"][] = ["gas", "water", "power", "transit"];
for (let i = 0; i < junctionIds.length; i++) {
  const a = junctionIds[i], b = junctionIds[(i + 1) % junctionIds.length];
  const na = nodes.find((n) => n.id === a)!, nb = nodes.find((n) => n.id === b)!;
  const kind = kinds[i % kinds.length];
  const depth = kind === "transit" ? 22 : kind === "power" ? 3 : 5 + r() * 4;
  edges.push({ id: `eg-${i + 1}`, kind, fromId: a, toId: b, path: [[na.x, na.z, depth], [(na.x + nb.x) / 2 + (r() - 0.5) * 40, (na.z + nb.z) / 2 + (r() - 0.5) * 40, depth], [nb.x, nb.z, depth]] });
}

mkdirSync(new URL("../generated", import.meta.url), { recursive: true });
const out = (n: string, v: unknown) => writeFileSync(new URL(`../generated/${n}.json`, import.meta.url), JSON.stringify(v));
out("event", event); out("buildings", buildings); out("infra-nodes", nodes); out("infra-edges", edges);
console.log(`RIFT seeded: ${buildings.length} buildings, ${nodes.length} infra nodes, ${edges.length} infra edges`);
