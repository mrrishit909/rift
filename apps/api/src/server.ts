// RIFT API: the book's section 7 contract over the generated dataset. Plain node:http + ws, no framework.
// A live socket replays the rupture at an accelerated clock, sending one Frame (shake per building + failed edges) per tick.
import { createServer, type IncomingMessage, type ServerResponse, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { WebSocketServer } from "ws";
import { buildingRiskAt, edgeFailedAt } from "../../../packages/domain/src/index.ts";
import type { Building, InfraEdge, InfraNode, SeismicEvent } from "../../../packages/schemas/src/index.ts";

const load = <T,>(n: string) => JSON.parse(readFileSync(new URL(`../../../data/generated/${n}.json`, import.meta.url), "utf8")) as T;
export const openapi = {
  openapi: "3.1.0", info: { title: "RIFT API", version: "1.0.0", description: "Synthetic seismic risk and subsurface infrastructure demo data." },
  paths: {
    "/v1/event": { get: { summary: "The seismic event" } },
    "/v1/buildings": { get: { summary: "List buildings with current risk at ?t=" } },
    "/v1/infrastructure": { get: { summary: "Infrastructure nodes and edges with failure state at ?t=" } },
    "/v1/buildings/{id}/notes": { post: { summary: "Add an inspection note; requires Idempotency-Key" } },
    "/v1/event/live": { get: { summary: "WebSocket: replays the rupture as Frame messages (query speed=1..60)" } },
  },
};

export function build(opts: { port?: number } = {}) {
  const event = load<SeismicEvent>("event"), buildings = load<Building[]>("buildings"), nodes = load<InfraNode[]>("infra-nodes"), edges = load<InfraEdge[]>("infra-edges");
  const notes = new Map<string, { id: string; buildingId: string; text: string }>();
  const send = (res: ServerResponse, code: number, body: unknown) => { res.writeHead(code, { "content-type": "application/json", "access-control-allow-origin": "*", "access-control-allow-headers": "content-type,idempotency-key" }); res.end(JSON.stringify(body)); };
  const err = (res: ServerResponse, code: number, message: string) => send(res, code, { error: message });
  async function body(req: IncomingMessage) { let s = ""; for await (const c of req) { s += c; if (s.length > 10_000) throw new RangeError("body too large"); } return s ? JSON.parse(s) : {}; }

  const server: Server = createServer(async (req, res) => {
    try {
      const u = new URL(req.url ?? "/", "http://x"), p = u.pathname.replace(/\/+$/, "") || "/", m = req.method ?? "GET";
      if (m === "OPTIONS") return send(res, 204, {});
      if (p === "/openapi.json") return send(res, 200, openapi);
      if (p === "/healthz") return send(res, 200, { ok: true });
      if (p === "/v1/event" && m === "GET") return send(res, 200, event);
      if (p === "/v1/buildings" && m === "GET") {
        const t = Number(u.searchParams.get("t") ?? 0);
        return send(res, 200, buildings.map((b) => ({ ...b, risk: buildingRiskAt(b, event, t) })));
      }
      if (p === "/v1/infrastructure" && m === "GET") {
        const t = Number(u.searchParams.get("t") ?? 0);
        return send(res, 200, { nodes, edges: edges.map((e) => ({ ...e, failed: edgeFailedAt(e, event, t) })) });
      }
      let g: RegExpMatchArray | null;
      if ((g = p.match(/^\/v1\/buildings\/([\w-]+)\/notes$/)) && m === "POST") {
        const key = req.headers["idempotency-key"]; if (typeof key !== "string" || !key) return err(res, 400, "Idempotency-Key header required");
        if (!buildings.some((b) => b.id === g![1])) return err(res, 404, "no such building");
        const b = await body(req); if (typeof b.text !== "string" || !b.text.trim() || b.text.length > 500) return err(res, 422, "text must be 1..500 characters");
        const prior = notes.get(key); if (prior) return send(res, 200, prior);
        const note = { id: `note-${notes.size + 1}`, buildingId: g[1], text: b.text.trim() }; notes.set(key, note);
        return send(res, 201, note);
      }
      return err(res, 404, "not found");
    } catch (e) { return err(res, e instanceof SyntaxError || e instanceof RangeError ? 400 : 500, e instanceof Error ? e.message : "error"); }
  });

  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (req, socket, head) => {
    const u = new URL(req.url ?? "/", "http://x");
    if (u.pathname !== "/v1/event/live") { socket.destroy(); return; }
    const speed = Math.min(60, Math.max(1, Number(u.searchParams.get("speed") ?? 4)));
    wss.handleUpgrade(req, socket, head, (ws) => {
      let t = -2;
      const tick = setInterval(() => {
        if (t > 60) { ws.send(JSON.stringify({ done: true })); ws.close(); return; }
        ws.send(JSON.stringify({ t, shake: buildings.map((b) => ({ buildingId: b.id, intensity: buildingRiskAt(b, event, t) })), failedEdges: edges.filter((e) => edgeFailedAt(e, event, t)).map((e) => e.id) }));
        t += 0.5;
      }, Math.max(16, 1000 / speed));
      ws.on("close", () => clearInterval(tick));
    });
  });
  return { server, listen: (port = opts.port ?? 8730) => new Promise<number>((r) => server.listen(port, () => r((server.address() as { port: number }).port))), close: () => { wss.close(); return new Promise<void>((r) => { server.closeAllConnections(); server.close(() => r()); }); } };
}
if (import.meta.url === `file://${process.argv[1]}`) build().listen().then((p) => console.log(`RIFT API on :${p}`));
