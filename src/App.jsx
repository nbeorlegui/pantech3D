import React, { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Html, MeshTransmissionMaterial, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

function useGlobalStyles() {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      :root {
        --bg: #040816;
        --line: rgba(255,255,255,.12);
        --glass: rgba(255,255,255,.06);
        --text: rgba(255,255,255,.94);
        --muted: rgba(255,255,255,.72);
        --blue: #2ea7ff;
        --cyan: #7de7ff;
        --violet: #8c63ff;
      }
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body { margin: 0; background:
        radial-gradient(circle at 15% 20%, rgba(46,167,255,.14), transparent 28%),
        radial-gradient(circle at 82% 24%, rgba(140,99,255,.12), transparent 30%),
        linear-gradient(180deg, #030612 0%, #050816 38%, #040816 100%);
        color: var(--text); font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
      .shell { position: relative; min-height: 100vh; overflow-x: hidden; }
      .canvas-wrap { position: fixed; inset: 0; z-index: 0; }
      .topbar { position: fixed; top: 18px; left: 18px; right: 18px; z-index: 20; display:flex; align-items:center; justify-content:space-between; padding: 14px 18px; border:1px solid var(--line); border-radius: 24px; background: rgba(5,10,26,.42); backdrop-filter: blur(14px); box-shadow: 0 18px 55px rgba(0,0,0,.22); }
      .brand { display:flex; align-items:center; gap: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
      .brand-badge { width: 40px; height: 40px; border-radius: 14px; display:grid; place-items:center; font-weight:900; background: linear-gradient(135deg, var(--blue), var(--violet)); box-shadow: 0 0 30px rgba(46,167,255,.35); }
      .nav { display:flex; gap: 26px; color: rgba(255,255,255,.72); font-size: 14px; }
      .nav a { color: inherit; text-decoration:none; }
      .btn { display:inline-flex; align-items:center; justify-content:center; min-height: 50px; padding: 0 20px; border-radius: 16px; border:1px solid var(--line); text-decoration:none; color:white; background: rgba(255,255,255,.05); backdrop-filter: blur(10px); transition: transform .25s ease, background .25s ease; }
      .btn:hover { transform: translateY(-2px); }
      .btn.primary { background: linear-gradient(135deg, rgba(46,167,255,.95), rgba(140,99,255,.95)); border-color: transparent; box-shadow: 0 12px 30px rgba(46,167,255,.2), 0 10px 24px rgba(140,99,255,.12); }
      .content { position: relative; z-index: 3; }
      .panel { min-height: 100vh; display:flex; align-items:center; padding: 132px min(8vw,92px) 72px; background: transparent; }
      .panel.right { justify-content:flex-end; }
      .copy { max-width: 720px; opacity: 0; transform: translateY(36px); }
      .right .copy { text-align: right; }
      .eyebrow { display:inline-flex; align-items:center; gap: 10px; color: var(--cyan); font-size: 12px; letter-spacing:.28em; font-weight:700; text-transform: uppercase; margin-bottom: 16px; }
      .title { margin:0; font-size: clamp(42px, 7vw, 86px); line-height: .95; letter-spacing:-.05em; max-width: 14ch; }
      .title.md { font-size: clamp(34px, 5vw, 60px); max-width: 12ch; }
      .grad { background: linear-gradient(90deg, var(--blue), var(--cyan), var(--violet)); -webkit-background-clip:text; background-clip:text; color:transparent; }
      .lead { color: var(--muted); margin: 24px 0 0; line-height: 1.65; font-size: clamp(16px, 2vw, 22px); max-width: 56ch; }
      .actions { display:flex; flex-wrap: wrap; gap: 14px; margin-top: 28px; }
      .chips { display:flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
      .chip { padding: 10px 14px; border-radius: 999px; border:1px solid var(--line); background: rgba(255,255,255,.04); color: rgba(255,255,255,.82); font-size: 13px; }
      .grid { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 16px; margin-top: 28px; max-width: 980px; }
      .card { padding: 22px; border-radius: 24px; border:1px solid rgba(255,255,255,.12); background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03)); backdrop-filter: blur(14px); box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 14px 40px rgba(0,0,0,.18); }
      .card h3 { margin: 0 0 10px; font-size: 18px; }
      .card p { margin: 0; color: rgba(255,255,255,.72); line-height: 1.6; }
      .spacer { height: 35vh; }
      .note { margin-top: 18px; color: rgba(255,255,255,.58); font-size: 14px; }
      @media (max-width: 980px) {
        .nav { display:none; }
        .panel, .panel.right { padding: 112px 22px 70px; justify-content:flex-start; }
        .right .copy { text-align:left; }
        .grid { grid-template-columns: 1fr; }
        .actions { flex-direction:column; }
        .btn { width:100%; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
}

function CameraRig() {
  const { camera } = useThree();
  const state = useRef({
    x: 0,
    y: 0.25,
    z: 10,
    tx: 0,
    ty: 0,
    tz: 0,
  });

  useEffect(() => {
    const s = state.current;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
      },
    });

    tl.to(s, { x: 0.8, y: 0.2, z: 7.2, tx: 1.7, ty: 0.6, tz: -6.5, duration: 1 }, 0)
      .to(s, { x: 1.6, y: 0.05, z: 4.2, tx: 1.7, ty: 0.8, tz: -7.5, duration: 1 }, 1)
      .to(s, { x: 1.55, y: 0.18, z: -7, tx: 1.3, ty: 1.2, tz: -11.5, duration: 1 }, 2)
      .to(s, { x: -1.35, y: 0.35, z: -13.2, tx: -1.45, ty: 1.5, tz: -16.4, duration: 1 }, 3)
      .to(s, { x: 0.55, y: 0.3, z: -20.2, tx: 1.2, ty: 0.95, tz: -24.4, duration: 1 }, 4)
      .to(s, { x: 1.2, y: 0.2, z: -22.1, tx: 1.45, ty: 0.9, tz: -26.3, duration: 1 }, 5)
      .to(s, { x: 0, y: 0.45, z: -31.5, tx: 0, ty: 0.5, tz: -36, duration: 1 }, 6);

    return () => tl.kill();
  }, []);

  useFrame(() => {
    const s = state.current;
    camera.position.set(s.x, s.y, s.z);
    camera.lookAt(s.tx, s.ty, s.tz);
  });

  return null;
}

function StarsField() {
  const pointsRef = useRef();
  const positions = useMemo(() => {
    const count = 2200;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 26;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 2] = -Math.random() * 52 + 10;
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    if (pointsRef.current) pointsRef.current.rotation.y += dt * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#6ccfff" size={0.03} transparent opacity={0.78} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function GlowRing({ radius = 1.4, tube = 0.03, color = "#2ea7ff", ...props }) {
  return (
    <mesh rotation-x={Math.PI / 2} {...props}>
      <torusGeometry args={[radius, tube, 16, 120]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.4} metalness={0.4} roughness={0.2} />
    </mesh>
  );
}

function FloatingPanel({ position, rotation = [0, 0, 0], title, value, accent = "#7de7ff" }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[1.65, 1.02]} />
        <meshBasicMaterial color="#0b1735" transparent opacity={0.78} />
      </mesh>
      <Html transform occlude distanceFactor={1.3} style={{ width: 180 }}>
        <div style={{
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 18,
          padding: '14px 14px 16px',
          background: 'linear-gradient(180deg, rgba(8,16,34,.84), rgba(7,20,54,.66))',
          backdropFilter: 'blur(12px)',
          color: 'white',
          boxShadow: '0 12px 34px rgba(0,0,0,.24)'
        }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', marginBottom: 10 }}>{title}</div>
          <div style={{ fontWeight: 800, fontSize: 28, color: accent, marginBottom: 10 }}>{value}</div>
          <div style={{ height: 54, borderRadius: 12, background: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02))', position: 'relative', overflow: 'hidden' }}>
            <svg viewBox="0 0 160 54" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
              <path d="M8 42 C28 38, 36 10, 58 18 S96 46, 118 26 S144 8, 152 14" fill="none" stroke={accent} strokeWidth="3" />
            </svg>
          </div>
        </div>
      </Html>
    </group>
  );
}

function LaptopScene() {
  const group = useRef();
  const screen = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.position.y = 0.1 + Math.sin(t * 1.15) * 0.08;
      group.current.rotation.y = Math.sin(t * 0.55) * 0.08;
    }
    if (screen.current) {
      screen.current.material.emissiveIntensity = 0.2 + (Math.sin(t * 2.2) + 1) * 0.05;
    }
  });

  return (
    <group ref={group} position={[1.65, 0.08, -7.3]}>
      <GlowRing radius={1.65} tube={0.035} color="#2ea7ff" position={[0, -0.82, 0]} />
      <GlowRing radius={1.95} tube={0.018} color="#8c63ff" position={[0, -0.82, 0]} scale={1.15} />

      <mesh position={[0, -0.62, 0]}>
        <boxGeometry args={[3.4, 0.18, 2.3]} />
        <meshStandardMaterial color="#101a34" metalness={0.85} roughness={0.24} />
      </mesh>
      <mesh position={[0, -0.49, 0.12]}>
        <boxGeometry args={[2.46, 0.04, 1.34]} />
        <MeshTransmissionMaterial color="#12234a" transmission={0.2} roughness={0.15} thickness={0.18} transparent opacity={0.62} />
      </mesh>
      <mesh position={[0, -0.46, 0.66]}>
        <boxGeometry args={[0.62, 0.015, 0.42]} />
        <meshStandardMaterial color="#304670" metalness={0.5} roughness={0.32} />
      </mesh>

      <group position={[0, -0.54, -0.96]} rotation={[-0.23, 0, 0]}>
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[3.0, 1.9, 0.08]} />
          <meshStandardMaterial color="#111b38" metalness={0.8} roughness={0.22} />
        </mesh>
        <mesh ref={screen} position={[0, 1, 0.05]}>
          <planeGeometry args={[2.72, 1.58]} />
          <meshStandardMaterial color="#0b1735" emissive="#2ea7ff" emissiveIntensity={0.2} />
        </mesh>
        <Html transform position={[0, 1, 0.07]} distanceFactor={1.2}>
          <div style={{ width: 410, height: 238, borderRadius: 18, background: 'linear-gradient(180deg, rgba(8,18,38,.96), rgba(10,30,70,.92))', border: '1px solid rgba(255,255,255,.1)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,.3)' }}>
            <div style={{ height: 36, display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: 'rgba(255,255,255,.22)' }} />
              <span style={{ width: 10, height: 10, borderRadius: 999, background: 'rgba(255,255,255,.18)' }} />
              <span style={{ width: 10, height: 10, borderRadius: 999, background: 'rgba(255,255,255,.14)' }} />
              <div style={{ marginLeft: 10, color: 'rgba(255,255,255,.56)', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase' }}>Pantech OS</div>
            </div>
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {['Ventas', 'Leads', 'Bots'].map((label, i) => (
                <div key={label} style={{ border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: 12 }}>
                  <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 12, marginBottom: 8 }}>{label}</div>
                  <div style={{ color: i === 0 ? '#7de7ff' : i === 1 ? '#8c63ff' : '#ffffff', fontSize: 24, fontWeight: 800 }}>{i === 0 ? '$248k' : i === 1 ? '1.246' : '32'}</div>
                </div>
              ))}
              <div style={{ gridColumn: 'span 2', border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', borderRadius: 14, height: 120, position: 'relative', overflow: 'hidden' }}>
                <svg viewBox="0 0 240 120" width="100%" height="100%">
                  <path d="M10 92 C36 84, 42 58, 70 64 S108 100, 132 70 S172 32, 198 42 S222 54, 230 18" fill="none" stroke="#7de7ff" strokeWidth="3" />
                </svg>
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', borderRadius: 14, height: 120, display: 'flex', alignItems: 'flex-end', gap: 8, padding: 14 }}>
                {[38, 56, 72, 48, 88].map((h, idx) => <span key={idx} style={{ width: 16, height: h, borderRadius: 8, background: idx % 2 ? '#8c63ff' : '#2ea7ff' }} />)}
              </div>
            </div>
          </div>
        </Html>
      </group>

      <Float speed={1.1} rotationIntensity={0.35} floatIntensity={0.55}>
        <FloatingPanel position={[-2.1, 1.3, 0.35]} rotation={[0, 0.22, 0]} title="Crecimiento" value="+24,8%" accent="#7de7ff" />
      </Float>
      <Float speed={1.3} rotationIntensity={0.25} floatIntensity={0.65}>
        <FloatingPanel position={[2.18, 0.75, -0.08]} rotation={[0, -0.35, 0]} title="Automatización" value="Flujo activo" accent="#8c63ff" />
      </Float>
    </group>
  );
}

function RobotScene() {
  const ref = useRef();
  const eyeL = useRef();
  const eyeR = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.position.y = -0.1 + Math.sin(t * 1.35) * 0.11;
    }
    const s1 = 1 + Math.sin(t * 3.5) * 0.08;
    const s2 = 1 + Math.sin(t * 3.5 + 0.35) * 0.08;
    if (eyeL.current) eyeL.current.scale.setScalar(s1);
    if (eyeR.current) eyeR.current.scale.setScalar(s2);
  });

  return (
    <group ref={ref} position={[-1.45, -0.15, -16.4]}>
      <GlowRing radius={1.75} tube={0.028} color="#8c63ff" position={[0, 0.2, 0]} rotation={[Math.PI / 2.45, 0, 0]} />
      <GlowRing radius={1.55} tube={0.024} color="#2ea7ff" position={[0, -1.05, 0]} />

      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.82, 32, 32]} />
        <MeshTransmissionMaterial color="#131e47" transmission={0.22} roughness={0.14} thickness={0.45} transparent opacity={0.72} />
      </mesh>
      <mesh position={[0, 2.0, 0]} scale={[1, 0.92, 1]}>
        <sphereGeometry args={[1.04, 32, 32]} />
        <MeshTransmissionMaterial color="#131e47" transmission={0.24} roughness={0.14} thickness={0.45} transparent opacity={0.72} />
      </mesh>
      <mesh position={[0, 1.98, 0.82]}>
        <planeGeometry args={[1.28, 0.76]} />
        <meshBasicMaterial color="#081226" transparent opacity={0.84} />
      </mesh>
      <mesh ref={eyeL} position={[-0.28, 2.03, 0.9]}>
        <sphereGeometry args={[0.11, 20, 20]} />
        <meshStandardMaterial color="#7de7ff" emissive="#7de7ff" emissiveIntensity={3.2} />
      </mesh>
      <mesh ref={eyeR} position={[0.28, 2.03, 0.9]}>
        <sphereGeometry args={[0.11, 20, 20]} />
        <meshStandardMaterial color="#7de7ff" emissive="#7de7ff" emissiveIntensity={3.2} />
      </mesh>
      <mesh position={[0, 1.8, 0.88]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.18, 0.03, 12, 48, Math.PI]} />
        <meshStandardMaterial color="#8c63ff" emissive="#8c63ff" emissiveIntensity={2.5} />
      </mesh>

      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.25, 24]} />
        <meshStandardMaterial color="#24385f" metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={[-0.95, 0.7, 0]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.08, 0.08, 0.95, 24]} />
        <meshStandardMaterial color="#24385f" metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={[0.95, 0.7, 0]} rotation={[0, 0, 0.4]}>
        <cylinderGeometry args={[0.08, 0.08, 0.95, 24]} />
        <meshStandardMaterial color="#24385f" metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={[-1.16, 0.28, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#8c63ff" emissive="#8c63ff" emissiveIntensity={2.4} />
      </mesh>
      <mesh position={[1.16, 0.28, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#8c63ff" emissive="#8c63ff" emissiveIntensity={2.4} />
      </mesh>
      <mesh position={[-0.3, -0.48, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.8, 24]} />
        <meshStandardMaterial color="#24385f" metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={[0.3, -0.48, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.8, 24]} />
        <meshStandardMaterial color="#24385f" metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={[-0.3, -0.98, 0.12]} scale={[1.2, 0.6, 1.6]}>
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshStandardMaterial color="#2ea7ff" emissive="#2ea7ff" emissiveIntensity={1.8} />
      </mesh>
      <mesh position={[0.3, -0.98, 0.12]} scale={[1.2, 0.6, 1.6]}>
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshStandardMaterial color="#2ea7ff" emissive="#2ea7ff" emissiveIntensity={1.8} />
      </mesh>

      <Float speed={1.15} rotationIntensity={0.2} floatIntensity={0.55}>
        <FloatingPanel position={[2.18, 1.25, 0.2]} rotation={[0, -0.4, 0]} title="IA" value="Lead scoring" accent="#8c63ff" />
      </Float>
    </group>
  );
}

function DataVizScene() {
  const bars = useRef([]);
  const states = useMemo(() => Array.from({ length: 8 }, () => ({ value: 0.6 + Math.random() * 1.5 })), []);

  useEffect(() => {
    const anims = states.map((s, i) => gsap.to(s, { value: 0.45 + Math.random() * 2.2, duration: 1.25 + i * 0.1, repeat: -1, yoyo: true, ease: 'sine.inOut', repeatRefresh: true }));
    return () => anims.forEach((a) => a.kill());
  }, [states]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    bars.current.forEach((mesh, i) => {
      if (!mesh) return;
      const val = states[i].value;
      mesh.scale.y = val;
      mesh.position.y = -0.15 + val / 2;
    });
  });

  return (
    <group position={[1.45, -0.3, -26.2]}>
      <GlowRing radius={2.9} tube={0.026} color="#2ea7ff" position={[0, -0.78, 0]} />
      <GlowRing radius={3.18} tube={0.016} color="#8c63ff" position={[0, -0.78, 0]} />

      <mesh position={[0, 1.18, 0]}>
        <boxGeometry args={[5.9, 3.55, 0.12]} />
        <MeshTransmissionMaterial color="#0c1836" transmission={0.18} roughness={0.12} thickness={0.45} transparent opacity={0.58} />
      </mesh>
      <Html transform position={[0, 1.18, 0.08]} distanceFactor={1.4}>
        <div style={{ width: 720, height: 420, borderRadius: 26, background: 'linear-gradient(180deg, rgba(8,18,38,.95), rgba(10,24,60,.88))', border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 20px 48px rgba(0,0,0,.28)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, padding: 18 }}>
            {['Ingresos', 'Conversión', 'Campañas'].map((label, i) => (
              <div key={label} style={{ border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', borderRadius: 16, padding: 14 }}>
                <div style={{ color: 'rgba(255,255,255,.62)', fontSize: 12, marginBottom: 8 }}>{label}</div>
                <div style={{ fontWeight: 800, fontSize: 26, color: i === 0 ? '#7de7ff' : i === 1 ? '#ffffff' : '#8c63ff' }}>{i === 0 ? '$248.450' : i === 1 ? '4,7%' : '12'}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, padding: '0 18px 18px' }}>
            <div style={{ border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', borderRadius: 18, padding: 14, height: 256 }}>
              <div style={{ color: 'rgba(255,255,255,.65)', marginBottom: 12 }}>Performance</div>
              <div style={{ display:'flex', alignItems:'end', gap: 12, height: 190 }}>
                {[64, 96, 122, 88, 154, 132, 172].map((h, i) => <span key={i} style={{ width: 26, height: h, borderRadius: 12, background: i % 2 ? '#8c63ff' : '#2ea7ff', boxShadow: '0 0 18px rgba(46,167,255,.25)' }} />)}
              </div>
            </div>
            <div style={{ border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', borderRadius: 18, padding: 14, height: 256 }}>
              <div style={{ color: 'rgba(255,255,255,.65)', marginBottom: 12 }}>Tendencia</div>
              <svg viewBox="0 0 220 180" width="100%" height="180">
                <path d="M10 150 C30 148, 44 92, 68 104 S102 156, 128 92 S156 46, 182 62 S198 44, 210 18" fill="none" stroke="#7de7ff" strokeWidth="4" />
                {[ [10,150], [68,104], [128,92], [182,62], [210,18] ].map(([x,y], i) => <circle key={i} cx={x} cy={y} r="6" fill={i % 2 ? '#8c63ff' : '#7de7ff'} />)}
              </svg>
            </div>
          </div>
        </div>
      </Html>

      <group position={[-1.75, -0.1, 0.22]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} ref={(el) => (bars.current[i] = el)} position={[i * 0.42, 0.4, 0]}>
            <boxGeometry args={[0.28, 1, 0.28]} />
            <meshStandardMaterial color="#2ea7ff" emissive={i % 2 ? '#8c63ff' : '#2ea7ff'} emissiveIntensity={2.2} metalness={0.3} roughness={0.18} />
          </mesh>
        ))}
      </group>

      {[ [0.9,0.65],[1.35,0.95],[1.78,0.82],[2.18,1.25],[2.58,1.18],[2.98,1.55],[3.38,1.92] ].map((p, i) => (
        <mesh key={i} position={[p[0], p[1], 0.16]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color={i % 2 ? '#8c63ff' : '#7de7ff'} emissive={i % 2 ? '#8c63ff' : '#7de7ff'} emissiveIntensity={2.8} />
        </mesh>
      ))}
      <line>
        <bufferGeometry attach="geometry" setFromPoints={[
          new THREE.Vector3(0.9,0.65,0.15),
          new THREE.Vector3(1.35,0.95,0.15),
          new THREE.Vector3(1.78,0.82,0.15),
          new THREE.Vector3(2.18,1.25,0.15),
          new THREE.Vector3(2.58,1.18,0.15),
          new THREE.Vector3(2.98,1.55,0.15),
          new THREE.Vector3(3.38,1.92,0.15),
        ]} />
        <lineBasicMaterial color="#7de7ff" transparent opacity={0.95} />
      </line>
    </group>
  );
}

function FinalTotem() {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.y = t * 0.25;
      ref.current.position.y = 0.35 + Math.sin(t * 1.25) * 0.12;
    }
  });
  return (
    <group ref={ref} position={[0, 0.35, -36]}>
      <mesh>
        <icosahedronGeometry args={[1.2, 0]} />
        <MeshTransmissionMaterial color="#16275b" transmission={0.26} roughness={0.12} thickness={0.45} transparent opacity={0.55} />
      </mesh>
      <GlowRing radius={1.8} tube={0.03} color="#7de7ff" />
      <GlowRing radius={2.18} tube={0.016} color="#8c63ff" rotation={[Math.PI / 2.8, 0, 0]} />
    </group>
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={["#040816"]} />
      <fog attach="fog" args={["#040816", 12, 48]} />
      <ambientLight intensity={0.8} color="#bfd8ff" />
      <directionalLight position={[4, 6, 4]} intensity={1.35} color="#a7c7ff" />
      <pointLight position={[2.4, 2, 2]} intensity={18} distance={20} color="#2ea7ff" />
      <pointLight position={[-2.2, 3, -10]} intensity={16} distance={24} color="#8c63ff" />
      <pointLight position={[1.6, 2, -22]} intensity={12} distance={24} color="#7de7ff" />
      <Suspense fallback={null}>
        <StarsField />
        <LaptopScene />
        <RobotScene />
        <DataVizScene />
        <FinalTotem />
        <Environment preset="night" />
      </Suspense>
      <CameraRig />
      <EffectComposer>
        <Bloom luminanceThreshold={0.35} intensity={1.15} mipmapBlur />
        <Vignette eskil={false} offset={0.14} darkness={0.65} />
      </EffectComposer>
    </>
  );
}

function Overlay() {
  useEffect(() => {
    const elements = document.querySelectorAll('.copy');
    const anims = Array.from(elements).map((el) => gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el.parentElement,
        start: 'top 68%',
        end: 'top 35%',
        toggleActions: 'play none none reverse'
      }
    }));
    return () => anims.forEach((a) => a.kill());
  }, []);

  return (
    <div className="content">
      <header className="topbar">
        <div className="brand"><div className="brand-badge">P</div><span>Pantech</span></div>
        <nav className="nav">
          <a href="#hero">Inicio</a>
          <a href="#software">Software</a>
          <a href="#ia">IA</a>
          <a href="#data">Data</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <a className="btn" href="#contacto">Agendar reunión</a>
      </header>

      <section className="panel" id="hero">
        <div className="copy">
          <div className="eyebrow">Software Factory</div>
          <h1 className="title">Creamos experiencias digitales, software y automatizaciones que <span className="grad">hacen crecer negocios.</span></h1>
          <p className="lead">Este prototipo cuenta una historia con scroll: notebook 3D, entrada a pantalla, robot de IA, dashboards animados y un lenguaje visual continuo tipo premium WebGL.</p>
          <div className="actions">
            <a className="btn primary" href="#software">Ver transición</a>
            <a className="btn" href="#ia">Explorar IA</a>
          </div>
          <div className="chips">
            {['Three.js look', 'Scroll storytelling', 'Software a medida', 'Bots & IA', 'Dashboards', 'GLB ready'].map((item) => <span key={item} className="chip">{item}</span>)}
          </div>
          <div className="note">En esta demo los objetos son paramétricos. Luego podés reemplazarlos por GLB reales con useGLTF().</div>
        </div>
      </section>

      <section className="panel" id="software">
        <div className="copy">
          <div className="eyebrow">Sección 01</div>
          <h2 className="title md">Notebook 3D y entrada cinematográfica a la pantalla</h2>
          <p className="lead">La cámara se acerca a una notebook flotante, toma protagonismo la interfaz y el scroll empuja la escena hacia adentro para conectar orgánicamente con la siguiente sección.</p>
          <div className="grid">
            <article className="card"><h3>Software a medida</h3><p>CRMs, paneles, automatizaciones y plataformas operativas orientadas a negocio.</p></article>
            <article className="card"><h3>Webs & Apps</h3><p>Sitios premium, experiencias comerciales y frontends modernos con identidad propia.</p></article>
            <article className="card"><h3>Integraciones</h3><p>APIs, bots, Google Sheets, plataformas externas y automatización entre sistemas.</p></article>
          </div>
        </div>
      </section>

      <section className="panel right" id="ia">
        <div className="copy">
          <div className="eyebrow">Sección 02</div>
          <h2 className="title md">Un robot de IA grande, luminoso y protagonista</h2>
          <p className="lead">En este bloque entra una presencia 3D más fuerte. La composición se abre, la cámara cambia de peso y el robot presenta asistentes, automatizaciones e inteligencia aplicada al negocio.</p>
          <div className="grid">
            <article className="card"><h3>Asistentes inteligentes</h3><p>WhatsApp, web, omnicanal y flujos de atención automatizada.</p></article>
            <article className="card"><h3>RPA & automatización</h3><p>Tareas repetitivas, disparadores, clasificación y derivaciones automáticas.</p></article>
            <article className="card"><h3>IA conectada</h3><p>Modelos vinculados a tu CRM, tus procesos y tus fuentes de datos reales.</p></article>
          </div>
        </div>
      </section>

      <section className="panel" id="data">
        <div className="copy">
          <div className="eyebrow">Sección 03</div>
          <h2 className="title md">Análisis de datos con gráficos vivos y paneles en tiempo real</h2>
          <p className="lead">El sistema muestra barras que suben y bajan, nodos que titilan y paneles con profundidad para reforzar la idea de monitoreo, rendimiento y toma de decisiones.</p>
          <div className="grid">
            <article className="card"><h3>Dashboards</h3><p>KPIs y métricas legibles en una visual potente y comercial.</p></article>
            <article className="card"><h3>Business Intelligence</h3><p>Unificación de información, visualización operativa y seguimiento comercial.</p></article>
            <article className="card"><h3>Storytelling con datos</h3><p>La escena también vende: no solo informa, guía la mirada y genera impacto.</p></article>
          </div>
        </div>
      </section>

      <section className="panel right" id="contacto">
        <div className="copy">
          <div className="eyebrow">Cierre</div>
          <h2 className="title md">Una web que se recorre como una experiencia 3D</h2>
          <p className="lead">Esta base ya sirve para validar dirección artística, ritmo de scroll y narrativa visual. El siguiente paso natural es cargar GLB reales para notebook, robot y assets de data con materiales y texturas definitivas.</p>
          <div className="actions">
            <a className="btn primary" href="#hero">Reiniciar demo</a>
            <a className="btn" href="#software">Agregar GLB reales</a>
          </div>
        </div>
      </section>
      <div className="spacer" />
    </div>
  );
}

export default function PantechThreeJsStorytellingPro() {
  useGlobalStyles();

  return (
    <div className="shell">
      <div className="canvas-wrap">
        <Canvas camera={{ position: [0, 0.25, 10], fov: 40 }} gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
          <Scene />
        </Canvas>
      </div>
      <Overlay />
    </div>
  );
}
