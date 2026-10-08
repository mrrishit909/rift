// RIFT: per-building risk and infrastructure cascade, derived from shake intensity. Synthetic, documented as such.
import type { Building, InfraEdge, SeismicEvent } from "@rift/schemas";
import { shakeIntensityAt } from "./seismic.ts";

export function buildingRiskAt(b: Building, ev: SeismicEvent, t: number): number {
  const shake = shakeIntensityAt(ev, b.x, b.z, t);
  return Math.min(1, shake * (0.4 + 0.6 * b.vulnerability));
}
/** An edge fails once shake intensity at its midpoint crosses a kind-specific threshold; transit tunnels are hardest, gas lines softest. */
const THRESHOLD: Record<InfraEdge["kind"], number> = { gas: 0.35, water: 0.5, power: 0.45, transit: 0.65 };
export function edgeFailedAt(e: InfraEdge, ev: SeismicEvent, t: number): boolean {
  const [mx, , mz] = e.path[Math.floor(e.path.length / 2)];
  return shakeIntensityAt(ev, mx, mz, t) >= THRESHOLD[e.kind];
}
/** A power or transit failure cascades: any edge sharing a node with an already-failed edge of the same kind fails one tick sooner (lower effective threshold). Caller re-evaluates frame by frame, so this just narrows the gate. */
export function cascadeThreshold(kind: InfraEdge["kind"], upstreamFailed: boolean): number {
  return upstreamFailed ? THRESHOLD[kind] * 0.75 : THRESHOLD[kind];
}
