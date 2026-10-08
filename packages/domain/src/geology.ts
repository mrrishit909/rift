// RIFT: deterministic synthetic stratigraphy. Units: metres, x/z east/north from the site centre.
import { mulberry32 } from "./rng.ts";
const N = 64;
function lattice(seed: number) {
  const r = mulberry32(seed);
  return Float64Array.from({ length: N * N }, () => r());
}
const L = lattice(1908);
const sm = (t: number) => t * t * (3 - 2 * t);
function noise(x: number, z: number) {
  const xi = Math.floor(x), zi = Math.floor(z), fx = sm(x - xi), fz = sm(z - zi);
  const g = (i: number, j: number) => L[(((j % N) + N) % N) * N + (((i % N) + N) % N)];
  const a = g(xi, zi) + (g(xi + 1, zi) - g(xi, zi)) * fx;
  const b = g(xi, zi + 1) + (g(xi + 1, zi + 1) - g(xi, zi + 1)) * fx;
  return a + (b - a) * fz;
}
export type Strata = { soil: number; sediment: number; rock: number; bedrock: number; fault: number };
/** Boundary depth (m, positive down) of each layer base at (x, z); gently undulating, not flat slabs. */
export function strataAt(x: number, z: number): Strata {
  const s = 1 / 300, r = (k: number) => noise(x * s * k, z * s * k);
  const soil = 18 + r(1) * 8;
  const sediment = soil + 90 + r(1.6) * 30;
  const rock = sediment + 480 + r(0.8) * 90;
  const bedrock = rock + 1400 + r(0.5) * 150;
  return { soil, sediment, rock, bedrock, fault: faultDepthAt(x, z) };
}
/** The fault plane dips west to east at ~60 degrees, offset by gentle noise so it reads as geology, not a flat ramp. */
export function faultDepthAt(x: number, z: number): number {
  return 900 + x * 1.15 + noise(x / 500, z / 500) * 220;
}
export function layerAtDepth(x: number, z: number, depthM: number): keyof Strata {
  const s = strataAt(x, z);
  if (depthM < s.soil) return "soil";
  if (depthM < s.sediment) return "sediment";
  if (depthM < s.rock) return "rock";
  if (depthM < s.bedrock) return "bedrock";
  return "fault";
}
/** Grid of soil-surface elevations for rendering: n x n samples over [-half, half], metres of relief above datum. */
export function surfaceGrid(n: number, half: number): Float32Array {
  const out = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = -half + (2 * half * i) / (n - 1), z = -half + (2 * half * j) / (n - 1);
    out[j * n + i] = noise(x / 220, z / 220) * 6;
  }
  return out;
}
