"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { live, set, state, useStore } from "../store";

// Steps follow blueprint section 2: 0 black+rumble, 1 waveform, 2 fracture, 3 descent through layers, 4 infrastructure appears, 5 energy wave, 6 waves reach city, 7 light mask to street.
const CHECKS = [20, 110, 600, 1800];
export default function Intro({ onDone }: { onDone: () => void }) {
  const s = useStore();
  const [depth, setDepth] = useState(0), [caption, setCaption] = useState(""), [wave, setWave] = useState(0);
  const mask = useRef<HTMLDivElement>(null), root = useRef<HTMLDivElement>(null), tl = useRef<gsap.core.Timeline | null>(null);

  const finish = (instant: boolean) => {
    tl.current?.kill(); document.documentElement.style.setProperty("--mask", "200%"); live.introDepth = 0; live.fracture = 1;
    set({ introDone: true, introStep: 99, t: 8 });
    if (instant && root.current) root.current.style.display = "none";
    onDone();
  };

  useEffect(() => {
    if (s.reduced) return;
    gsap.ticker.lagSmoothing(0);
    const t = gsap.timeline({ defaults: { ease: "power1.inOut" }, onComplete: () => finish(false) });
    tl.current = t;
    const obj = { d: 0 }, f = { v: 0 };
    t.call(() => { set({ introStep: 0 }); setCaption("Silence. A fault, waiting."); }, [], 0)
      .call(() => { set({ introStep: 1 }); setCaption("A waveform begins."); setWave(1); }, [], 1.6)
      .call(() => { set({ introStep: 2 }); setCaption("It spikes. The surface fractures."); }, [], 4.2)
      .to(f, { v: 1, duration: 1.2, onUpdate: () => { live.fracture = f.v; } }, 4.2)
      .call(() => { set({ introStep: 3 }); setCaption("Descending through soil, sediment, rock, bedrock."); }, [], 5.6)
      .to(obj, { d: 1800, duration: 10, ease: "power2.in", onUpdate: () => { live.introDepth = obj.d; setDepth(Math.round(obj.d)); } }, 5.6)
      .call(() => { set({ introStep: 4 }); setCaption("Pipelines and tunnels, embedded in the rock."); }, [], 13)
      .call(() => { set({ introStep: 5, t: -2 }); setCaption("The fault releases its energy."); }, [], 15.4)
      .to({ t: -2 }, { t: 9, duration: 3.6, ease: "none", onUpdate: function () { set({ t: this.targets()[0].t }); } }, 15.4)
      .call(() => { set({ introStep: 6 }); setCaption("The wave reaches the city."); }, [], 18.6)
      .call(() => { set({ introStep: 7 }); setCaption(""); }, [], 20.4)
      .to({ v: 0 }, { v: 160, duration: 1.8, ease: "power2.inOut", onUpdate: function () { document.documentElement.style.setProperty("--mask", `${this.targets()[0].v}%`); } }, 20.4);
    return () => { t.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.reduced]);

  if (s.introDone && !s.reduced) return null;
  if (s.reduced) {
    const frames = [["0 m", "A waveform spikes; the surface fractures."], ["1,800 m", "The descent passes soil, sediment, rock and bedrock, past the buried pipe and tunnel network."], ["Rupture", "The fault releases its energy; the wave reaches the city above."], ["Street level", "The city becomes the operational map."]];
    return (
      <div className="intro intro-static" ref={root} role="dialog" aria-label="Opening story" data-testid="intro">
        <ol>{frames.map(([d, c], i) => <li key={i}><b>{d}</b> {c}</li>)}</ol>
        <button className="btn primary" onClick={() => finish(true)} data-testid="skip-intro">Enter the operational map</button>
      </div>
    );
  }
  return (
    <div className="intro" ref={root} data-testid="intro" data-step={s.introStep}>
      <div className="intro-dark" style={{ opacity: s.introStep === 0 ? 1 : 0 }} />
      {wave > 0 && s.introStep <= 2 && <svg className="waveform" viewBox="0 0 400 80" aria-hidden style={{ position: "absolute", left: "50%", top: "40%", transform: "translate(-50%,-50%)", width: 400 }}>
        <polyline points={Array.from({ length: 60 }, (_, i) => `${i * 6.8},${40 + Math.sin(i * (s.introStep === 2 ? 1.4 : 0.35)) * (s.introStep === 2 ? 30 : 6)}`).join(" ")} fill="none" stroke="var(--magma)" strokeWidth="2" />
      </svg>}
      <div className="depth-meter" aria-live="off"><span>{depth.toLocaleString("en-US")}</span> m
        <div className="checks">{CHECKS.map((c) => <i key={c} className={depth >= c ? "hit" : ""}>{c.toLocaleString("en-US")} m</i>)}</div></div>
      <p className="caption" role="status">{caption}</p>
      <button className="btn skip" onClick={() => { const t = tl.current; if (t && t.time() < 20.4) { live.introDepth = 1800; live.fracture = 1; t.seek(20.4); } else finish(false); }} data-testid="skip-intro" autoFocus>Skip intro</button>
      <div className="light-mask" ref={mask} aria-hidden />
    </div>
  );
}
