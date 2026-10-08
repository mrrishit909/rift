// RIFT: synthetic seismic propagation. Not a real hazard model; a plausible, deterministic, documented stand-in.
import type { SeismicEvent } from "@rift/schemas";

/** Simplified attenuation: intensity falls off with distance and grows with magnitude, roughly like a GMPE's shape without being one. Calibrated so peak sits near 1 close to the epicenter and tapers across a ~2 km site. */
export function peakIntensityAt(ev: SeismicEvent, x: number, z: number): number {
  const d = Math.hypot(x - ev.x, z - ev.z, ev.depthKm * 1000);
  const magK = Math.pow(1.6, ev.magnitude - 6);
  return magK * (ev.depthKm * 1000 + 300) / (d + 300);
}
/** Envelope of shaking at time t (seconds since rupture start): ramps up during rupture, decays after. */
export function shakeEnvelope(ev: SeismicEvent, t: number): number {
  if (t < 0) return 0;
  if (t <= ev.ruptureDurationS) return t / ev.ruptureDurationS;
  const decay = (t - ev.ruptureDurationS) / 18;
  return Math.exp(-decay);
}
/** Shake intensity (0..~1 scaled) at a point and time, accounting for wave travel delay (3.5 km/s). */
export function shakeIntensityAt(ev: SeismicEvent, x: number, z: number, t: number): number {
  const travelS = Math.hypot(x - ev.x, z - ev.z) / 3500;
  return Math.min(1, peakIntensityAt(ev, x, z) * shakeEnvelope(ev, t - travelS));
}
/** Radius (m) the wavefront has reached at time t. */
export function waveRadiusAt(t: number): number {
  return Math.max(0, t) * 3500;
}
