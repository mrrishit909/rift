import { describe, expect, it } from "vitest";
import { strataAt, layerAtDepth, surfaceGrid, faultDepthAt, peakIntensityAt, shakeEnvelope, shakeIntensityAt, waveRadiusAt, buildingRiskAt, edgeFailedAt, mulberry32 } from "../src/index.ts";
import { validateBuilding, validateFrame, type Building, type SeismicEvent, type InfraEdge } from "@rift/schemas";

const ev: SeismicEvent = { id: "e", name: "test", x: 0, z: 0, magnitude: 6.1, depthKm: 3.2, ruptureDurationS: 7, startedAt: "2026-01-01T00:00:00Z" };

describe("geology", () => {
  it("is deterministic and layers stack in order", () => {
    const s = strataAt(100, -200);
    expect(strataAt(100, -200)).toEqual(s);
    expect(s.soil).toBeLessThan(s.sediment); expect(s.sediment).toBeLessThan(s.rock); expect(s.rock).toBeLessThan(s.bedrock);
  });
  it("layerAtDepth matches the boundaries", () => {
    const s = strataAt(0, 0);
    expect(layerAtDepth(0, 0, 1)).toBe("soil");
    expect(layerAtDepth(0, 0, s.soil + 1)).toBe("sediment");
    expect(layerAtDepth(0, 0, s.bedrock + 1)).toBe("fault");
  });
  it("the fault dips with x", () => expect(faultDepthAt(500, 0)).toBeGreaterThan(faultDepthAt(-500, 0)));
  it("surfaceGrid has n*n samples", () => expect(surfaceGrid(8, 1000)).toHaveLength(64));
});
describe("seismic", () => {
  it("peak intensity falls off with distance", () => expect(peakIntensityAt(ev, 50, 50)).toBeGreaterThan(peakIntensityAt(ev, 1600, 1600)));
  it("envelope ramps during rupture then decays", () => {
    expect(shakeEnvelope(ev, -1)).toBe(0);
    expect(shakeEnvelope(ev, ev.ruptureDurationS / 2)).toBeCloseTo(0.5);
    expect(shakeEnvelope(ev, ev.ruptureDurationS)).toBe(1);
    expect(shakeEnvelope(ev, ev.ruptureDurationS + 20)).toBeLessThan(shakeEnvelope(ev, ev.ruptureDurationS));
  });
  it("shake intensity is 0 before the wave arrives and bounded at 1", () => {
    expect(shakeIntensityAt(ev, 5000, 5000, 0)).toBe(0);
    expect(shakeIntensityAt(ev, 50, 50, ev.ruptureDurationS)).toBeLessThanOrEqual(1);
  });
  it("wave radius grows linearly with time and is 0 before rupture", () => {
    expect(waveRadiusAt(-1)).toBe(0); expect(waveRadiusAt(10)).toBe(35000);
  });
});
describe("risk", () => {
  const b: Building = { id: "b1", name: "Test Tower", x: 50, z: 50, heightM: 40, kind: "commercial", vulnerability: 0.8 };
  it("risk grows with vulnerability at fixed shake", () => {
    const low = buildingRiskAt({ ...b, vulnerability: 0.1 }, ev, ev.ruptureDurationS), high = buildingRiskAt({ ...b, vulnerability: 0.9 }, ev, ev.ruptureDurationS);
    expect(high).toBeGreaterThan(low);
  });
  it("transit edges fail no earlier than gas edges at the same point", () => {
    const path: [number, number, number][] = [[50, 0, 5], [50, 50, 5], [50, 100, 5]];
    const gas: InfraEdge = { id: "e1", kind: "gas", fromId: "a", toId: "b", path }, transit: InfraEdge = { ...gas, id: "e2", kind: "transit" };
    const firstFail = (e: InfraEdge) => { for (let t = -2; t < 60; t += 0.25) if (edgeFailedAt(e, ev, t)) return t; return Infinity; };
    expect(firstFail(transit)).toBeGreaterThanOrEqual(firstFail(gas));
  });
});
describe("schemas + rng", () => {
  it("validators reject bad records", () => {
    const b: Building = { id: "b1", name: "x", x: 0, z: 0, heightM: 10, kind: "residential", vulnerability: 0.5 };
    expect(validateBuilding(b)).toBe(true);
    expect(validateBuilding({ ...b, vulnerability: 2 })).toBe(false);
    expect(validateFrame({ t: 0, shake: [], failedEdges: [] })).toBe(true);
    expect(validateFrame({ t: "x" })).toBe(false);
  });
  it("rng repeats per seed", () => { const a = mulberry32(5), b = mulberry32(5); expect([a(), a()]).toEqual([b(), b()]); });
});
