"use client";
import { useEffect, useMemo, useRef } from "react";
import { buildingRiskAt, edgeFailedAt, waveRadiusAt } from "@rift/domain";
import type { Data } from "../data";
import { CHAPTERS, set, state, useStore, type Chapter, type Mode } from "../store";

const m = (n: number) => Math.round(n).toLocaleString("en-US");
const pct = (n: number) => `${Math.round(n * 100)}%`;
const go = (c: Chapter) => { if (c === state.chapter) return; set({ prevChapter: state.chapter, chapter: c }); history.replaceState(null, "", `#${c}`); };

function Strata({ data }: { data: Data }) {
  return (
    <section aria-labelledby="h-strata"><h2 id="h-strata">{CHAPTERS.find((c) => c.id === state.chapter)?.label}</h2>
      <p className="lede">The core column below shows the stratigraphy beneath the Harrow Fault site. A {data.event.magnitude.toFixed(1)}-magnitude rupture originates at {data.event.depthKm.toFixed(1)} km depth; this chapter is one layer in its path to the surface.</p>
      <dl className="readout"><div><dt>Event</dt><dd>{data.event.name}</dd></div><div><dt>Magnitude</dt><dd>{data.event.magnitude.toFixed(1)}</dd></div><div><dt>Rupture depth</dt><dd>{data.event.depthKm.toFixed(1)} km</dd></div></dl>
      <div className="cta"><button className="btn primary" data-testid="to-street" onClick={() => go("street")}>Rise to street level &rarr;</button></div>
    </section>
  );
}

function Risk({ data }: { data: Data }) {
  const s = useStore(), rows = useMemo(() => data.buildings.map((b) => ({ b, risk: buildingRiskAt(b, data.event, s.t) })).sort((a, b) => b.risk - a.risk), [data, s.t]);
  const sel = rows.find((r) => r.b.id === s.selBuilding);
  return (
    <section aria-labelledby="h-risk"><h2 id="h-risk">Risk</h2>
      <p className="lede">Per-building risk, synthetic, recomputed at the current simulation time.</p>
      <table className="obs" data-testid="risk-table"><thead><tr><th>Building</th><th>Kind</th><th>Risk</th></tr></thead>
        <tbody>{rows.slice(0, 12).map(({ b, risk }) => <tr key={b.id} className={b.id === s.selBuilding ? "on" : ""}><td><button className="link" onClick={() => set({ selBuilding: b.id })} data-testid={`bld-${b.id}`}>{b.name}</button></td><td>{b.kind}</td><td>{pct(risk)}</td></tr>)}</tbody></table>
      {sel && <aside className="note" data-testid="risk-detail"><h3>{sel.b.name}</h3><p className="faint">Vulnerability {pct(sel.b.vulnerability)} &middot; height {m(sel.b.heightM)} m &middot; risk now {pct(sel.risk)}</p></aside>}
    </section>
  );
}

function Infra({ data }: { data: Data }) {
  const s = useStore(), edges = useMemo(() => data.edges.map((e) => ({ e, failed: edgeFailedAt(e, data.event, s.t) })), [data, s.t]);
  const failedCount = edges.filter((x) => x.failed).length;
  return (
    <section aria-labelledby="h-infra"><h2 id="h-infra">Infrastructure</h2>
      <p className="lede">Gas, water, power and transit lines buried in the soil layer, spatially attached to the junctions below.</p>
      <dl className="readout"><div><dt>Lines failed</dt><dd data-testid="infra-failed">{failedCount} / {edges.length}</dd></div></dl>
      <ul>{edges.map(({ e, failed }) => <li key={e.id}><div className={`row ${failed ? "on" : ""}`} data-testid={`edge-${e.id}`}><b>{e.kind}</b><span>{failed ? "failed" : "nominal"}</span></div></li>)}</ul>
    </section>
  );
}

function Simulate({ data }: { data: Data }) {
  const s = useStore();
  return (
    <section aria-labelledby="h-sim"><h2 id="h-sim">Simulate</h2>
      <p className="lede">Run the rupture forward. Shaking ramps during the {data.event.ruptureDurationS}-second rupture, then decays; the wave radius below tracks the energy front.</p>
      <label className="scrub">Time <input type="range" min={-2} max={60} step={0.5} value={s.t} onChange={(e) => set({ t: Number(e.target.value), playing: false })} aria-valuetext={`${s.t.toFixed(1)} s`} data-testid="sim-scrub" /><output>{s.t.toFixed(1)} s</output></label>
      <div className="transport">
        <button className="btn" onClick={() => set({ playing: !s.playing, t: s.t >= 60 ? -2 : s.t })} data-testid="sim-play">{s.playing ? "Pause" : "Play"}</button>
        <label>Speed <select value={s.speed} onChange={(e) => set({ speed: Number(e.target.value) })}>{[1, 4, 10, 20].map((v) => <option key={v} value={v}>{v}&times;</option>)}</select></label>
        <button className="btn" onClick={() => set({ t: -2, playing: false })} data-testid="sim-reset">Reset to T&minus;2s</button>
      </div>
      <dl className="readout"><div><dt>Wave radius</dt><dd data-testid="wave-radius">{m(waveRadiusAt(s.t))} m</dd></div></dl>
    </section>
  );
}

const MODES: { id: Mode; label: string }[] = [{ id: "risk", label: "Risk" }, { id: "infra", label: "Infrastructure" }, { id: "simulate", label: "Simulate" }];

function Street({ data }: { data: Data }) {
  const s = useStore();
  return (
    <section aria-labelledby="h-street"><h2 id="h-street">Street Level</h2>
      <p className="lede">The operational map. Switch modes to see risk, buried infrastructure, or run the rupture.</p>
      <div className="transport">{MODES.map((md) => <button key={md.id} className={`btn ${s.mode === md.id ? "primary" : "ghost"}`} aria-pressed={s.mode === md.id} onClick={() => set({ mode: md.id })} data-testid={`mode-${md.id}`}>{md.label}</button>)}</div>
      {s.mode === "risk" && <Risk data={data} />}
      {s.mode === "infra" && <Infra data={data} />}
      {s.mode === "simulate" && <Simulate data={data} />}
    </section>
  );
}

export default function Panels({ data }: { data: Data }) {
  const s = useStore(), idx = CHAPTERS.findIndex((c) => c.id === s.chapter), prev = CHAPTERS.findIndex((c) => c.id === s.prevChapter), dir = idx >= prev ? "down" : "up";
  const lock = useRef(0);
  useEffect(() => {
    const onWheel = (e: WheelEvent) => { if ((e.target as Element).closest(".panel,.rail,.intro")) return; const n = performance.now(); if (n - lock.current < 700 || Math.abs(e.deltaY) < 20 || !state.introDone) return; lock.current = n; const i = CHAPTERS.findIndex((c) => c.id === state.chapter) + (e.deltaY > 0 ? 1 : -1); if (CHAPTERS[i]) go(CHAPTERS[i].id); };
    addEventListener("wheel", onWheel, { passive: true }); return () => removeEventListener("wheel", onWheel);
  }, []);
  return (
    <div className="hud" data-testid="hud">
      <header className="top"><span className="brand">RIFT</span><span className="gauge" data-testid="gauge">{CHAPTERS.find((c) => c.id === s.chapter)?.depthM ?? 0} m</span>
        <button className="btn ghost" aria-pressed={s.pauseMotion} onClick={() => set({ pauseMotion: !s.pauseMotion })} data-testid="pause-motion">{s.pauseMotion ? "Resume motion" : "Pause motion"}</button></header>
      <nav className="rail" aria-label="Layers">{CHAPTERS.map((c) => <button key={c.id} className={c.id === s.chapter ? "on" : ""} aria-current={c.id === s.chapter ? "page" : undefined} onClick={() => go(c.id)} data-testid={`nav-${c.id}`}><i>{c.depthM} m</i><b>{c.label}</b><small>{c.blurb}</small></button>)}</nav>
      <main className={`panel ${s.reduced ? "" : `slide-${dir}`}`} key={s.chapter} tabIndex={-1}>
        {s.chapter === "street" ? <Street data={data} /> : <Strata data={data} />}
      </main>
    </div>
  );
}
