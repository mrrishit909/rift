import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import { build } from "../src/server.ts";

const api = build(); let base = "", port = 0;
beforeAll(async () => { port = await api.listen(0); base = `http://127.0.0.1:${port}`; });
afterAll(() => api.close());
const j = async (path: string, init?: RequestInit) => { const r = await fetch(base + path, init); return { status: r.status, body: await r.json() as any }; };

describe("contract", () => {
  it("publishes the event and OpenAPI 3.1", async () => {
    expect((await j("/v1/event")).body.id).toBe("ev-01");
    expect((await j("/openapi.json")).body.openapi).toBe("3.1.0");
    expect((await j("/healthz")).body.ok).toBe(true);
  });
  it("lists buildings with risk recomputed per ?t=", async () => {
    const early = (await j("/v1/buildings?t=-2")).body as any[], late = (await j("/v1/buildings?t=7")).body as any[];
    expect(early).toHaveLength(36);
    expect(late.reduce((a, b) => a + b.risk, 0)).toBeGreaterThan(early.reduce((a, b) => a + b.risk, 0));
  });
  it("lists infrastructure with failure state per ?t=", async () => {
    const r = (await j("/v1/infrastructure?t=7")).body;
    expect(r.nodes).toHaveLength(14); expect(r.edges).toHaveLength(14);
    expect(r.edges.every((e: any) => typeof e.failed === "boolean")).toBe(true);
  });
});
describe("idempotent notes", () => {
  const post = (key: string | null, text: unknown, id = "bld-1") => j(`/v1/buildings/${id}/notes`, { method: "POST", headers: { "content-type": "application/json", ...(key ? { "idempotency-key": key } : {}) }, body: JSON.stringify({ text }) });
  it("requires the key, validates text, replays safely, 404s unknown buildings", async () => {
    expect((await post(null, "hi")).status).toBe(400);
    expect((await post("k1", "")).status).toBe(422);
    expect((await post("k1", "x".repeat(501))).status).toBe(422);
    expect((await post("k1", "cracked facade", "nope")).status).toBe(404);
    const a = await post("k2", "cracked facade"), b = await post("k2", "cracked facade");
    expect(a.status).toBe(201); expect(b.status).toBe(200); expect(b.body.id).toBe(a.body.id);
  });
});
describe("live socket", () => {
  it("streams frames and rejects a bad path", async () => {
    const frames = await new Promise<any[]>((res) => { const got: any[] = [], ws = new WebSocket(`ws://127.0.0.1:${port}/v1/event/live?speed=60`); ws.on("message", (m) => { got.push(JSON.parse(String(m))); if (got.length === 3) { ws.close(); res(got); } }); });
    expect(frames.map((f) => f.t)).toEqual([-2, -1.5, -1]);
    await new Promise<void>((res) => { const ws = new WebSocket(`ws://127.0.0.1:${port}/v1/nope/live`); ws.on("error", () => res()); });
  });
});
