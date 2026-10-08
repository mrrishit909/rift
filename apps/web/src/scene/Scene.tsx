"use client";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { buildingRiskAt, edgeFailedAt, strataAt, surfaceGrid, waveRadiusAt } from "@rift/domain";
import type { Data } from "../data";
import { base } from "../data";
import { CHAPTERS, live, state, useStore } from "../store";

// 1 scene unit = 40 m, both horizontally and in depth, so the ~1,600 m site and the ~2,000 m rupture depth share one scale.
const U = 0.025, HALF = 1700, GRID = 64;
const toScene = (x: number, z: number, depthM: number) => new THREE.Vector3(x * U, -depthM * U, -z * U);

// Palette: Basalt #0A0908, Volcanic #1C1714, Magma #FF4A18, Sulfur #F2C94C, Fault White #E6DED2, Iron #6C5147, Deep Red #8E1C12.
const columnVert = /* glsl */ `
varying vec3 vW; varying float vDepth;
void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vDepth = -w.y / ${U.toFixed(4)}; gl_Position = projectionMatrix * viewMatrix * w; }`;
const columnFrag = /* glsl */ `
uniform float uSoil; uniform float uSediment; uniform float uRock; uniform float uBedrock; uniform float uFault; uniform float uFracture;
varying vec3 vW; varying float vDepth;
void main(){
  vec3 basalt = vec3(0.039,0.035,0.031), volcanic = vec3(0.11,0.09,0.078), iron = vec3(0.42,0.32,0.28), deepRed = vec3(0.557,0.11,0.07);
  vec3 col = vDepth < uSoil ? mix(volcanic, basalt, vDepth / max(uSoil,1.0))
    : vDepth < uSediment ? mix(basalt, volcanic, (vDepth-uSoil)/max(uSediment-uSoil,1.0))
    : vDepth < uRock ? mix(volcanic, iron, (vDepth-uSediment)/max(uRock-uSediment,1.0))
    : mix(iron, deepRed, clamp((vDepth-uRock)/max(uBedrock-uRock,1.0),0.0,1.0));
  float band = 1.0 - smoothstep(0.0, 140.0, abs(vDepth - uFault));
  col = mix(col, vec3(1.0,0.29,0.09), band * uFracture * 0.8);
  float contour = smoothstep(0.96, 1.0, abs(sin(vDepth * 0.045)));
  col += contour * 0.03;
  gl_FragColor = vec4(col, 1.0);
}`;

function CoreColumn() {
  const strata = useMemo(() => strataAt(0, 0), []);
  const geo = useMemo(() => new THREE.CylinderGeometry(30, 30, strata.bedrock * U + 2, 48, 1, true).translate(0, -(strata.bedrock * U) / 2, 0), [strata]);
  const mat = useMemo(() => new THREE.ShaderMaterial({ side: THREE.BackSide, vertexShader: columnVert, fragmentShader: columnFrag, uniforms: { uSoil: { value: strata.soil }, uSediment: { value: strata.sediment }, uRock: { value: strata.rock }, uBedrock: { value: strata.bedrock }, uFault: { value: strata.fault }, uFracture: { value: 0 } } }), [strata]);
  useFrame(() => { mat.uniforms.uFracture.value = live.fracture; });
  return <mesh geometry={geo} material={mat} />;
}

const faultVert = /* glsl */ `
uniform float uFracture; uniform float uTime;
varying vec2 vUv;
void main(){ vUv = uv; vec3 p = position; p.z += sin(p.x * 2.2 + uTime * 6.0) * uFracture * 0.5 + sin(p.y * 3.1 - uTime * 4.0) * uFracture * 0.3;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`;
const faultFrag = /* glsl */ `
uniform float uFracture;
varying vec2 vUv;
void main(){ float crack = 1.0 - smoothstep(0.0, 0.08, abs(fract(vUv.x * 6.0 + vUv.y * 3.0) - 0.5));
  vec3 base = vec3(0.904, 0.871, 0.824); vec3 magma = vec3(1.0, 0.29, 0.09);
  vec3 col = mix(base * 0.3, magma, crack * uFracture);
  gl_FragColor = vec4(col, 0.85); }`;

function FaultPlane() {
  const strata = useMemo(() => strataAt(0, 0), []);
  const geo = useMemo(() => new THREE.PlaneGeometry(56, 56, 24, 24), []);
  const mat = useMemo(() => new THREE.ShaderMaterial({ transparent: true, side: THREE.DoubleSide, vertexShader: faultVert, fragmentShader: faultFrag, uniforms: { uFracture: { value: 0 }, uTime: { value: 0 } } }), []);
  useFrame((st) => { mat.uniforms.uFracture.value = live.fracture; mat.uniforms.uTime.value = st.clock.elapsedTime; });
  return <mesh geometry={geo} material={mat} rotation={[0, Math.PI / 2.6, -1.0]} position={[0, -strata.fault * U, 0]} />;
}

const waveFrag = /* glsl */ `
uniform float uRadius; uniform float uWidth;
varying vec2 vUv;
void main(){ float r = length(vUv - 0.5) * 2.0; float ring = 1.0 - smoothstep(0.0, uWidth, abs(r - uRadius));
  gl_FragColor = vec4(vec3(1.0, 0.29, 0.09), ring * 0.9 * step(0.001, uRadius)); }`;

function EnergyWave() {
  const mat = useMemo(() => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }", fragmentShader: waveFrag, uniforms: { uRadius: { value: 0 }, uWidth: { value: 0.04 } } }), []);
  useFrame(() => { mat.uniforms.uRadius.value = Math.min(1, waveRadiusAt(state.t) * U / 42); });
  return <mesh material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}><planeGeometry args={[84, 84]} /></mesh>;
}

function GroundPlane() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(2 * HALF * U, 2 * HALF * U, GRID, GRID); g.rotateX(-Math.PI / 2);
    const h = surfaceGrid(GRID + 1, HALF), p = g.attributes.position;
    for (let k = 0; k < p.count; k++) p.setY(k, h[k] * U);
    g.computeVertexNormals();
    return g;
  }, []);
  return <mesh geometry={geo} receiveShadow><meshStandardMaterial color="#1C1714" roughness={0.95} /></mesh>;
}

function Infrastructure({ data }: { data: Data }) {
  const gltf = useLoader(GLTFLoader, `${base}/models/infra-shaft.glb`);
  const shaftGeo = useMemo(() => { let m: THREE.Mesh | null = null; gltf.scene.traverse((o) => { if (!m && o.name === "ShaftCollar" && (o as THREE.Mesh).isMesh) m = o as THREE.Mesh; }); return (m as unknown as THREE.Mesh).geometry; }, [gltf]);
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const im = ref.current; if (!im) return; const d = new THREE.Object3D(), col = new THREE.Color();
    data.nodes.forEach((n, i) => { d.position.set(n.x * U, -n.depthM * U, -n.z * U); d.scale.setScalar(1.2); d.updateMatrix(); im.setMatrixAt(i, d.matrix); im.setColorAt(i, col.set("#6C5147")); });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }, [data]);
  useFrame(() => {
    const im = ref.current; if (!im || !im.instanceColor) return; const col = new THREE.Color();
    data.nodes.forEach((n, i) => { const failing = data.edges.some((e) => (e.fromId === n.id || e.toId === n.id) && edgeFailedAt(e, data.event, state.t)); im.setColorAt(i, col.set(failing ? "#FF4A18" : "#6C5147")); });
    im.instanceColor.needsUpdate = true;
  });
  const tubes = useMemo(() => data.edges.map((e) => { const pts = e.path.map(([x, z, d]) => toScene(x, z, d)); const curve = new THREE.CatmullRomCurve3(pts); return { id: e.id, geo: new THREE.TubeGeometry(curve, 24, 0.35, 8, false), kind: e.kind }; }), [data]);
  const kindColor: Record<string, string> = { gas: "#F2C94C", water: "#2870FF", power: "#FF4A18", transit: "#E6DED2" };
  return (
    <>
      <instancedMesh ref={ref} args={[shaftGeo, new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.4 }), data.nodes.length]} />
      {tubes.map((t) => { const failed = data.edges.find((e) => e.id === t.id)!, isFailed = edgeFailedAt(failed, data.event, state.t); return <mesh key={t.id} geometry={t.geo}><meshStandardMaterial color={kindColor[t.kind]} emissive={isFailed ? "#8E1C12" : "#000000"} emissiveIntensity={isFailed ? 1.2 : 0} roughness={0.5} /></mesh>; })}
    </>
  );
}

function Buildings({ data }: { data: Data }) {
  const gltf = useLoader(GLTFLoader, `${base}/models/building-kit.glb`);
  const boxGeo = useMemo(() => { let m: THREE.Mesh | null = null; gltf.scene.traverse((o) => { if (!m && o.name === "Building1" && (o as THREE.Mesh).isMesh) m = o as THREE.Mesh; }); return (m as unknown as THREE.Mesh).geometry; }, [gltf]);
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const im = ref.current; if (!im) return; const d = new THREE.Object3D(), white = new THREE.Color(1, 1, 1);
    data.buildings.forEach((b, i) => { d.position.set(b.x * U, (b.heightM * U) / 2, -b.z * U); d.scale.set(1.4, b.heightM * U, 1.4); d.updateMatrix(); im.setMatrixAt(i, d.matrix); im.setColorAt(i, white); });
    im.instanceMatrix.needsUpdate = true;
  }, [data]);
  useFrame(() => {
    const im = ref.current; if (!im || !im.instanceColor) return; const col = new THREE.Color(); const mode = state.mode;
    data.buildings.forEach((b, i) => { const risk = buildingRiskAt(b, data.event, state.t); const c = mode === "risk" ? col.setHSL(0.08 - risk * 0.08, 0.75, 0.35 + risk * 0.25) : mode === "simulate" ? col.set("#6C5147").lerp(new THREE.Color("#FF4A18"), risk) : col.set("#6C5147"); im.setColorAt(i, c); });
    im.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[boxGeo, new THREE.MeshStandardMaterial({ roughness: 0.8 }), data.buildings.length]} frustumCulled={false} />;
}

function Rig() {
  const { camera, scene } = useThree(), want = useMemo(() => new THREE.Vector3(), []), tgt = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const s = state;
    if (!s.introDone) {
      const depth = live.introDepth, y = -depth * U, settle = THREE.MathUtils.clamp((live.introDepth - 1900) / 300, 0, 1);
      want.set(THREE.MathUtils.lerp(46, 70, settle), THREE.MathUtils.lerp(y + 18, 55, settle), THREE.MathUtils.lerp(10, 90, settle));
      tgt.set(0, THREE.MathUtils.lerp(y, 0, settle), 0);
      scene.fog = new THREE.FogExp2("#0A0908", 0.006 + (1 - settle) * 0.01);
    } else {
      const ch = CHAPTERS.find((c) => c.id === s.chapter)!, y = -ch.depthM * U;
      if (ch.id === "street") want.set(70, 62, 110), tgt.set(0, 0, 0);
      else want.set(50, y + 14, 60), tgt.set(0, y, 0);
      scene.fog = new THREE.FogExp2("#0A0908", 0.0045);
    }
    const k = s.reduced ? 1 : 1 - Math.exp(-dt * 2.4);
    camera.position.lerp(want, k); (camera as THREE.PerspectiveCamera).lookAt(tgt);
  });
  return null;
}

function Lifecycle() {
  const { setFrameloop, gl } = useThree();
  useEffect(() => {
    const vis = () => setFrameloop(document.hidden ? "never" : "always");
    const lost = (e: Event) => { e.preventDefault(); live.fracture = 0; };
    document.addEventListener("visibilitychange", vis); gl.domElement.addEventListener("webglcontextlost", lost);
    return () => { document.removeEventListener("visibilitychange", vis); gl.domElement.removeEventListener("webglcontextlost", lost); };
  }, [setFrameloop, gl]);
  return null;
}

declare global { interface Window { __riftData?: Data; __riftStats?: () => unknown } }
function Stats() {
  const gl = useThree((s) => s.gl);
  useEffect(() => { window.__riftStats = () => ({ calls: gl.info.render.calls, triangles: gl.info.render.triangles, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures }); }, [gl]);
  return null;
}

export default function Scene({ data }: { data: Data }) {
  useStore();
  window.__riftData = data;
  return (
    <Canvas className="stage" data-testid="stage" dpr={[1, 1.5]} camera={{ fov: 50, near: 0.5, far: 1200, position: [70, 62, 110] }} gl={{ antialias: false, powerPreference: "high-performance" }} onCreated={({ gl }) => gl.setClearColor("#0A0908")}>
      <ambientLight intensity={0.55} color="#6C5147" /><hemisphereLight args={["#F2C94C", "#0A0908", 0.3]} /><directionalLight position={[40, 90, 30]} intensity={2.4} color="#E6DED2" />
      <Rig /><CoreColumn /><FaultPlane /><EnergyWave /><GroundPlane /><Infrastructure data={data} /><Buildings data={data} /><Lifecycle /><Stats />
    </Canvas>
  );
}
