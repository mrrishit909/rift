// Tiny external store. The render loop reads `live` (mutable, no React re-render per frame); the UI subscribes to `state`.
import { useSyncExternalStore } from "react";
import { Vector3 } from "three";
export type Chapter = "bedrock" | "fault" | "rock" | "sediment" | "soil" | "street";
export const CHAPTERS: { id: Chapter; label: string; depthM: number; blurb: string }[] = [
  { id: "bedrock", label: "Bedrock", depthM: 1800, blurb: "Where the rupture originates" },
  { id: "fault", label: "Fault Plane", depthM: 950, blurb: "The rupture surface itself" },
  { id: "rock", label: "Rock", depthM: 600, blurb: "Energy wave propagation" },
  { id: "sediment", label: "Sediment", depthM: 110, blurb: "Attenuation and amplification" },
  { id: "soil", label: "Soil", depthM: 15, blurb: "Buried infrastructure layer" },
  { id: "street", label: "Street Level", depthM: 0, blurb: "Risk, infrastructure and simulation" },
];
export type Mode = "risk" | "infra" | "simulate";
export type State = { chapter: Chapter; prevChapter: Chapter; mode: Mode; t: number; playing: boolean; speed: number; selBuilding: string | null; introDone: boolean; introStep: number; reduced: boolean; pauseMotion: boolean; gfx: "webgl" | "poster" };
export const state: State = { chapter: "street", prevChapter: "street", mode: "risk", t: -2, playing: false, speed: 4, selBuilding: null, introDone: false, introStep: 0, reduced: false, pauseMotion: false, gfx: "webgl" };
/** Mutable per-frame values for the canvas; not reactive. */
export const live = { introDepth: 0, waveK: 0, fracture: 0, cityLight: 0, campos: new Vector3(), camtgt: new Vector3() };
let snap = { ...state };
const subs = new Set<() => void>();
export function set(p: Partial<State>) { Object.assign(state, p); snap = { ...state }; subs.forEach((f) => f()); }
export const useStore = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => snap, () => snap);
