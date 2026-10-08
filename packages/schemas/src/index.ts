// RIFT: shared types + runtime validators. One definition for the generator, the API and the web app.
export type SeismicEvent = { id: string; name: string; x: number; z: number; magnitude: number; depthKm: number; ruptureDurationS: number; startedAt: string };
export type Building = { id: string; name: string; x: number; z: number; heightM: number; kind: "residential" | "commercial" | "hospital" | "school"; vulnerability: number };
export type InfraNode = { id: string; kind: "pipe-junction" | "substation" | "tunnel-shaft"; x: number; z: number; depthM: number };
export type InfraEdge = { id: string; kind: "gas" | "water" | "power" | "transit"; fromId: string; toId: string; path: [number, number, number][] };
export type Frame = { t: number; shake: { buildingId: string; intensity: number }[]; failedEdges: string[] };

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
export function validateBuilding(r: unknown): r is Building {
  const o = r as Building;
  return !!o && typeof o.id === "string" && [o.x, o.z, o.heightM, o.vulnerability].every(isNum) && o.vulnerability >= 0 && o.vulnerability <= 1;
}
export function validateFrame(r: unknown): r is Frame {
  const o = r as Frame;
  return !!o && isNum(o.t) && Array.isArray(o.shake) && Array.isArray(o.failedEdges);
}
