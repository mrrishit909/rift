"use client";
import { useEffect, useState } from "react";
import { loadData, type Data } from "./data";
import { CHAPTERS, set, state, useStore } from "./store";
import Intro from "./ui/Intro";
import Panels from "./ui/Panels";
import Scene from "./scene/Scene";
import { base } from "./data";

function webglOk() { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } }

export default function App() {
  const s = useStore(); const [data, setData] = useState<Data | null>(null); const [err, setErr] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(location.search), rm = matchMedia("(prefers-reduced-motion: reduce)").matches || q.get("motion") === "reduced";
    const gfx = q.get("gfx") === "off" || !webglOk() ? "poster" : "webgl";
    const chapter = CHAPTERS.find((c) => c.id === q.get("chapter"))?.id;
    set({ reduced: rm, pauseMotion: rm, gfx, ...(chapter ? { chapter } : {}), ...(q.get("mode") ? { mode: q.get("mode") as never } : {}), ...(q.get("t") ? { t: Number(q.get("t")) } : {}), ...(q.get("skip") === "1" || chapter ? { introDone: true, introStep: 99 } : {}) });
    if (q.get("skip") === "1" || chapter) document.documentElement.style.setProperty("--mask", "200%");
    loadData().then(setData).catch((e) => setErr(String(e)));
  }, []);
  useEffect(() => {
    const onHash = () => { const c = CHAPTERS.find((x) => x.id === location.hash.slice(1)); if (c && c.id !== state.chapter) set({ prevChapter: state.chapter, chapter: c.id }); };
    addEventListener("hashchange", onHash); onHash(); return () => removeEventListener("hashchange", onHash);
  }, []);
  // Simulation clock, runs only in street/simulate mode.
  useEffect(() => {
    let raf = 0, last = performance.now();
    const tick = (n: number) => { const dt = (n - last) / 1000; last = n; if (state.playing && !document.hidden) { const t = Math.min(60, state.t + dt * state.speed); set({ t, playing: t < 60 }); } raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, []);
  if (err) return <div className="boot" role="alert">Could not load data: {err}</div>;
  if (!data) return <div className="boot" role="status">Booting the seismic twin...</div>;
  return (
    <div className="app" data-chapter={s.chapter} data-intro={s.introDone ? "done" : "running"} data-gfx={s.gfx}>
      {s.gfx === "webgl" ? <Scene data={data} /> : <div className="poster" style={{ backgroundImage: `url(${base}/posters/building-kit.png)` }} role="img" aria-label="Still of a RIFT street-level building and infrastructure shaft" data-testid="poster" />}
      <div className="vignette" aria-hidden />
      <Panels data={data} />
      {!s.introDone && <Intro onDone={() => {}} />}
    </div>
  );
}
