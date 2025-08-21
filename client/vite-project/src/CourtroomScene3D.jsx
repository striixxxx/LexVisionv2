import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Environment, Float, Sparkles, Text, ContactShadows } from "@react-three/drei";
import { motion } from "framer-motion";

function Ground() {
  return (
    <group position={[0, -0.01, 0]}>
      <mesh receiveShadow rotation-x={-Math.PI / 2}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#262a3b" roughness={0.9} metalness={0.1} />
      </mesh>
      <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={20} blur={2} far={5} />
    </group>
  );
}

function JudgeBench() {
  return (
    <group position={[0, 0.75, -3]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[8, 1.5, 1.5]} />
        <meshStandardMaterial color="#6b4b3e" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.9, 0.76]}>
        <boxGeometry args={[6, 0.3, 0.02]} />
        <meshStandardMaterial color="#c9a15e" metalness={0.6} roughness={0.3} />
      </mesh>
      <group position={[1.6, 0.95, 0.2]}>
        <mesh castShadow position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.1, 16]} />
          <meshStandardMaterial color="#3b2c28" />
        </mesh>
        <mesh castShadow position={[0.2, 0.05, 0]} rotation={[0, 0, Math.PI / 10]}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 16]} />
          <meshStandardMaterial color="#3b2c28" />
        </mesh>
      </group>
    </group>
  );
}

function PublicBenches() {
  const rows = [-1.5, -0.5, 0.5, 1.5];
  return (
    <group position={[0, 0.35, 1.5]}>
      {rows.map((z, i) => (
        <mesh key={i} position={[0, 0, z]} receiveShadow castShadow>
          <boxGeometry args={[10, 0.7, 0.6]} />
          <meshStandardMaterial color="#4a3a33" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function ScalePan({ side = 1 }) {
  return (
    <group position={[0.7 * side, 0, 0]}>
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.5, 8]} />
        <meshStandardMaterial color="#d9bf77" />
      </mesh>
      <mesh castShadow position={[0, -0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.03, 16, 48]} />
        <meshStandardMaterial color="#e1c580" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh castShadow position={[0, -0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 32]} />
        <meshStandardMaterial color="#b48f54" metalness={0.6} roughness={0.5} />
      </mesh>
    </group>
  );
}

function ScalesOfJustice({ tilt = 0 }) {
  const beam = useRef();
  useFrame(() => { if (beam.current) beam.current.rotation.z = tilt * 0.35; });
  return (
    <group position={[0, 1.8, -1]}>
      <mesh castShadow position={[0, -0.8, 0]}>
        <cylinderGeometry args={[0.4, 0.6, 0.2, 32]} />
        <meshStandardMaterial color="#c9a15e" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.8, 24]} />
        <meshStandardMaterial color="#d9bf77" metalness={0.7} roughness={0.35} />
      </mesh>
      <group ref={beam} position={[0, 0.6, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.6, 0.06, 0.06]} />
          <meshStandardMaterial color="#d9bf77" />
        </mesh>
        <ScalePan side={-1} />
        <ScalePan side={+1} />
      </group>
    </group>
  );
}

function ParticlesBurst({ active }) {
  const ref = useRef();
  const positions = useMemo(() => new Float32Array(300 * 3), []);
  useEffect(() => {
    for (let i = 0; i < 300; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 1] = Math.random() * 0.2 + 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    if (ref.current) ref.current.geometry.attributes.position.needsUpdate = true;
  }, [positions]);
  useFrame((_, delta) => {
    if (!active) return;
    const p = ref.current?.geometry?.attributes?.position;
    if (!p) return;
    for (let i = 0; i < p.count; i++) {
      const ix = i * 3;
      p.array[ix + 0] *= 1 + delta * 8;
      p.array[ix + 1] *= 1 + delta * 10;
      p.array[ix + 2] *= 1 + delta * 8;
    }
    p.needsUpdate = true;
  });
  return (
    <points ref={ref} position={[0, 0.8, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={300} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} sizeAttenuation transparent opacity={active ? 0.9 : 0} />
    </points>
  );
}

function Gauge({ label, value = 0 }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums">{v}%</span>
      </div>
      <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${v}%`, background: "linear-gradient(90deg,#7c5cff,#46e1ff)" }} />
      </div>
    </div>
  );
}

function HUDPanel({ mode, lang, setLang, summary, fav, compare }) {
  return (
    <Html fullscreen>
      <div className="pointer-events-none absolute inset-0 p-4 md:p-6">
        <div className="pointer-events-auto max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            className="w-full rounded-2xl bg-white/90 backdrop-blur shadow-xl p-4 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-bold">LexVision Courtroom</h1>
              <div className="flex items-center gap-2">
                <select value={mode} disabled className="border rounded-lg px-3 py-1.5 text-sm bg-gray-100">
                  <option value="summarize">Summarize</option>
                  <option value="compare">Compare</option>
                </select>
                <select value={lang} onChange={(e) => setLang(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                  <option value="hn">Hinglish</option>
                </select>
              </div>
            </div>

            {mode === "summarize" ? (
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <div className="md:col-span-2">
                  <h2 className="font-semibold mb-2">Summary</h2>
                  <p className="text-sm leading-6 text-gray-800">
                    {summary || "Drop a legal PDF on the glowing pedestal to generate a real AI summary here."}
                  </p>
                </div>
                <div className="md:col-span-1">
                  <h2 className="font-semibold mb-2">Favourability</h2>
                  <Gauge label="Plaintiff" value={fav?.plaintiff ?? 0} />
                  <div className="h-2" />
                  <Gauge label="Defendant" value={fav?.defendant ?? 0} />
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <h2 className="font-semibold mb-2">Comparison (A vs B)</h2>
                <div className="text-sm leading-6 text-gray-800 space-y-2">
                  {compare?.high_level_diff?.map((d, i) => (
                    <div key={i}>• {d}</div>
                  )) || <div>Drop two contracts (A and B) to see differences.</div>}
                </div>
                {compare?.clause_map?.length ? (
                  <div className="mt-3 max-h-48 overflow-auto text-sm bg-white/60 rounded-lg p-3">
                    {compare.clause_map.map((c, i) => (
                      <div key={i} className="mb-3">
                        <div className="font-semibold">{c.topic}</div>
                        <div className="text-gray-700"><b>A:</b> {c.A}</div>
                        <div className="text-gray-700"><b>B:</b> {c.B}</div>
                        <div className="text-gray-700"><b>Impact:</b> {c.impact}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Html>
  );
}

function Pedestal({ onFileDrop, processing, label = "Drop your legal PDF here" }) {
  const [hover, setHover] = useState(false);
  return (
    <group position={[0, 0.4, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[1.25, 1.25, 0.4, 64]} />
        <meshStandardMaterial color={hover ? "#7c5cff" : "#5b4bff"} emissive={hover ? "#6a58ff" : "#3025a1"} emissiveIntensity={0.4} />
      </mesh>
      <Sparkles count={60} speed={0.5} size={2} opacity={0.8} scale={[2.5, 0.6, 2.5]} />
      <Html center transform position={[0, 0.4, 0]}>
        <div
          onDragOver={(e) => { e.preventDefault(); setHover(true); }}
          onDragLeave={() => setHover(false)}
          onDrop={(e) => {
            e.preventDefault(); setHover(false);
            const file = e.dataTransfer.files?.[0];
            if (file && onFileDrop) onFileDrop(file);
          }}
          className="px-6 py-3 rounded-xl shadow-xl bg-white/90 backdrop-blur text-sm font-medium text-gray-800 border border-white/60 cursor-pointer select-none"
        >
          {processing ? "Processing…" : label}
        </div>
      </Html>
    </group>
  );
}

export default function CourtroomScene3D({ apiBase = "http://127.0.0.1:8000" }) {
  const [processing, setProcessing] = useState(false);
  const [burst, setBurst] = useState(false);
  const [lang, setLang] = useState("en");
  const [mode, setMode] = useState("summarize");

  const [summary, setSummary] = useState("");
  const [fav, setFav] = useState({ plaintiff: 0, defendant: 0 });

  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [compare, setCompare] = useState(null);

  const summarizeFile = useCallback(async (file) => {
    setProcessing(true); setBurst(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("lang", lang);
    const res = await fetch(`${apiBase}/summarize`, { method: "POST", body: fd });
    const data = await res.json();
    setSummary(data?.summary || "");
    if (data?.fav_scores) setFav({ plaintiff: data.fav_scores.plaintiff, defendant: data.fav_scores.defendant });
    setProcessing(false); setTimeout(() => setBurst(false), 700);
  }, [apiBase, lang]);

  const tryCompare = useCallback(async () => {
    if (!fileA || !fileB) return;
    setProcessing(true); setBurst(true);
    const fd = new FormData();
    fd.append("file_a", fileA);
    fd.append("file_b", fileB);
    fd.append("lang", lang);
    const res = await fetch(`${apiBase}/compare`, { method: "POST", body: fd });
    const data = await res.json();
    setSummary(""); setFav({ plaintiff: 0, defendant: 0 });
    setCompare(data?.comparison || null);
    setProcessing(false); setTimeout(() => setBurst(false), 700);
  }, [apiBase, lang, fileA, fileB]);

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-[#0b1020] border border-white/10">
      <div className="flex flex-wrap items-center gap-3 justify-between p-4">
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1.5 rounded-lg border ${mode === "summarize" ? "bg-white text-black" : "bg-transparent text-white border-white/30"}`}
            onClick={() => setMode("summarize")}
          >
            Summarize
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg border ${mode === "compare" ? "bg-white text-black" : "bg-transparent text-white border-white/30"}`}
            onClick={() => setMode("compare")}
          >
            Compare
          </button>
        </div>
        <select value={lang} onChange={(e) => setLang(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-white/90 text-gray-800">
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="hn">Hinglish</option>
        </select>
      </div>

      <div className="w-full h-[78vh] relative">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2.2, 7], fov: 50 }}>
          <color attach="background" args={["#0b1020"]} />
          <hemisphereLight intensity={0.35} groundColor={"#0b1020"} />
          <directionalLight castShadow position={[5, 8, 3]} intensity={1.2} shadow-mapSize={[1024, 1024]} />
          <Environment preset="city" />
          <Ground />
          <PublicBenches />
          <JudgeBench />
          <ScalesOfJustice tilt={(fav.plaintiff - fav.defendant) / 100} />

          {mode === "summarize" ? (
            <Pedestal onFileDrop={summarizeFile} processing={processing} label="Drop your legal PDF here (Summarize)" />
          ) : (
            <>
              <group position={[-2, 0, 0]}>
                <Pedestal onFileDrop={(f) => setFileA(f)} processing={processing} label={`Contract A${fileA ? `: ${fileA.name}` : ""}`} />
              </group>
              <group position={[2, 0, 0]}>
                <Pedestal onFileDrop={(f) => setFileB(f)} processing={processing} label={`Contract B${fileB ? `: ${fileB.name}` : ""}`} />
              </group>
              <Html center position={[0, 0.9, 0]}>
                <button
                  className="px-4 py-2 rounded-xl bg-white/90 text-black font-semibold border border-white/60 shadow"
                  onClick={tryCompare}
                  disabled={!fileA || !fileB || processing}
                >
                  {processing ? "Comparing…" : "Compare A vs B"}
                </button>
              </Html>
            </>
          )}

          <ParticlesBurst active={burst} />
          <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
            <Text position={[0, 3.2, -1.5]} fontSize={0.6} color="#ffffff" anchorX="center" anchorY="middle">
              LexVision – 3D Courtroom
            </Text>
          </Float>

          <HUDPanel
            mode={mode}
            lang={lang}
            setLang={setLang}
            summary={summary}
            fav={fav}
            compare={mode === "compare" ? compare : null}
          />

          <OrbitControls enablePan enableZoom minDistance={4} maxDistance={16} target={[0, 1, 0]} />
        </Canvas>
      </div>
    </div>
  );
}
