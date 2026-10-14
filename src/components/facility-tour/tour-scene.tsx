"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, OrbitControls, RoundedBox } from "@react-three/drei";
import { CanvasTexture, Color, DoubleSide, Vector3, type Mesh } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { TourConfig } from "@/lib/facility-tour";
import { OVERVIEW, type PlacedStop, type Vec3 } from "./layout";

const H = 2.6; // wall height
const WOOD = "#d8c3a5";
const LEAF = "#8fbf9a";

const mix = (a: string, b: string, t: number) => `#${new Color(a).lerp(new Color(b), t).getHexString()}`;

interface Palette {
  accent: string;
  soft: string;
  wall: string;
  floor: string;
}

export interface TourSceneProps {
  config: TourConfig;
  stops: PlacedStop[];
  active: number;
  view: { position: Vec3; target: Vec3 };
  onSelect: (index: number) => void;
}

export default function TourScene({ config, stops, active, view, onSelect }: TourSceneProps) {
  const palette = useMemo<Palette>(
    () => ({
      accent: config.accentColor,
      soft: mix(config.accentColor, "#ffffff", 0.55),
      wall: config.wallColor,
      floor: config.floorColor,
    }),
    [config],
  );

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 2]}
      camera={{ position: OVERVIEW.position, fov: 38, near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: true }}
      fallback={
        <p className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
          3D tours need WebGL, which this browser has disabled. Use the stop list to read about each area.
        </p>
      }
    >
      <hemisphereLight args={["#ffffff", "#dce6f2", 1.1]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[12, 20, 10]}
        intensity={1.7}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[5, 2.2, -9]} intensity={6} distance={9} color="#fff1dc" />

      <Plinth />
      <Lobby p={palette} />
      <Corridor p={palette} />
      <PatientRoom p={palette} />

      {stops.map((stop, i) => (
        <Hotspot key={stop.id} stop={stop} index={i} active={i === active} accent={palette.accent} onSelect={onSelect} />
      ))}

      <OrbitControls
        makeDefault
        enableDamping
        target={OVERVIEW.target}
        minDistance={3}
        maxDistance={42}
        maxPolarAngle={Math.PI / 2.2}
      />
      <CameraRig view={view} />
    </Canvas>
  );
}

/** Glides camera + orbit target to the current view; any user drag hands control back. */
function CameraRig({ view }: { view: TourSceneProps["view"] }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const flying = useRef(true);
  const reduced = useRef(false);
  const goal = useMemo(
    () => ({ position: new Vector3(...view.position), target: new Vector3(...view.target) }),
    [view],
  );

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  useEffect(() => {
    flying.current = true;
  }, [goal]);
  useEffect(() => {
    if (!controls) return;
    const cancel = () => (flying.current = false);
    controls.addEventListener("start", cancel);
    return () => controls.removeEventListener("start", cancel);
  }, [controls]);

  useFrame((_, dt) => {
    if (!flying.current || !controls) return;
    const k = reduced.current ? 1 : 1 - Math.exp(-dt * 2.4);
    camera.position.lerp(goal.position, k);
    controls.target.lerp(goal.target, k);
    controls.update();
    if (camera.position.distanceTo(goal.position) < 0.01 && controls.target.distanceTo(goal.target) < 0.01) {
      flying.current = false;
    }
  });
  return null;
}

function Hotspot({
  stop,
  index,
  active,
  accent,
  onSelect,
}: {
  stop: PlacedStop;
  index: number;
  active: boolean;
  accent: string;
  onSelect: (index: number) => void;
}) {
  const ring = useRef<Mesh>(null);
  const labelTexture = useMemo(() => {
    const label = `${index + 1}. ${active ? stop.label : stop.label.split(" ").slice(0, 2).join(" ")}`;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    context.font = "26px sans-serif";
    canvas.width = Math.ceil(context.measureText(label).width) + 32;
    canvas.height = 56;
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.roundRect(0, 0, canvas.width, canvas.height, 20);
    context.fill();
    context.font = "26px sans-serif";
    context.textBaseline = "middle";
    context.fillStyle = accent;
    context.fillText(label, 16, 28);
    return new CanvasTexture(canvas);
  }, [index, active, stop.label, accent]);
  useEffect(() => () => labelTexture.dispose(), [labelTexture]);
  useFrame(({ clock }) => {
    ring.current?.scale.setScalar(1 + 0.3 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 2.2 + index)));
  });
  const select = () => onSelect(index);
  const [, y] = stop.anchor;

  return (
    <group position={stop.anchor}>
      <mesh position={[0, -y / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, y, 8]} />
        <meshBasicMaterial color={accent} transparent opacity={0.45} />
      </mesh>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          select();
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <sphereGeometry args={[active ? 0.2 : 0.15, 32, 32]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={active ? 0.9 : 0.35} />
      </mesh>
      <Billboard>
        <mesh ref={ring}>
          <ringGeometry args={[0.24, 0.29, 48]} />
          <meshBasicMaterial color={accent} transparent opacity={0.5} side={DoubleSide} />
        </mesh>
      </Billboard>
      {/* Canvas labels stay in the scene root and need no external font worker. Keyboard controls live in the stop list and floor plan. */}
      <Billboard position={[0, 0.5, 0]}>
        <mesh onClick={(e) => { e.stopPropagation(); select(); }}>
          <planeGeometry args={[labelTexture.image.width / 56 * 0.28, 0.28]} />
          <meshBasicMaterial map={labelTexture} transparent toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

// ── Architecture ──

function Wall({ from, to, height = H, color }: { from: [number, number]; to: [number, number]; height?: number; color: string }) {
  const [x1, z1] = from;
  const [x2, z2] = to;
  const length = Math.hypot(x2 - x1, z2 - z1);
  return (
    <mesh
      position={[(x1 + x2) / 2, height / 2, (z1 + z2) / 2]}
      rotation={[0, -Math.atan2(z2 - z1, x2 - x1), 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[length + 0.15, height, 0.15]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

function Floor({ x, z, color, y = 0.005 }: { x: [number, number]; z: [number, number]; color: string; y?: number }) {
  return (
    <mesh position={[(x[0] + x[1]) / 2, y, (z[0] + z[1]) / 2]} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[x[1] - x[0], z[1] - z[0]]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

function Plinth() {
  return (
    <RoundedBox args={[17, 0.4, 27.5]} radius={0.18} position={[1, -0.205, -1]} receiveShadow>
      <meshStandardMaterial color="#ffffff" roughness={1} />
    </RoundedBox>
  );
}

function Plant({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.24, 0.6, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={LEAF} roughness={0.9} />
      </mesh>
      <mesh position={[0.25, 1.4, 0.1]} castShadow>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial color={mix(LEAF, "#ffffff", 0.15)} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Sofa({ position, rotation = 0, color }: { position: Vec3; rotation?: number; color: string }) {
  return (
    <group position={position} rotation-y={rotation}>
      <RoundedBox args={[2.2, 0.42, 0.9]} radius={0.12} position={[0, 0.25, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[2.2, 0.62, 0.24]} radius={0.1} position={[0, 0.6, -0.36]} castShadow>
        <meshStandardMaterial color={color} roughness={0.95} />
      </RoundedBox>
    </group>
  );
}

function Lobby({ p }: { p: Palette }) {
  return (
    <group>
      <Floor x={[-6, 6]} z={[1, 11]} color={p.floor} />
      <Floor x={[0.6, 5.4]} z={[5, 9]} color={mix(p.floor, p.accent, 0.18)} y={0.01} />

      <Wall from={[-6, 1]} to={[-1.5, 1]} color={p.wall} />
      <Wall from={[1.5, 1]} to={[6, 1]} color={p.wall} />
      <mesh position={[0, H - 0.2, 1]} castShadow>
        <boxGeometry args={[3, 0.4, 0.15]} />
        <meshStandardMaterial color={p.wall} />
      </mesh>
      <Wall from={[-6, 1]} to={[-6, 11]} color={p.wall} />
      {/* Cutaway walls so the orbit camera can see in */}
      <Wall from={[6, 1]} to={[6, 11]} height={0.6} color={p.wall} />
      <Wall from={[-6, 11]} to={[-1.6, 11]} height={0.6} color={p.wall} />
      <Wall from={[1.6, 11]} to={[6, 11]} height={0.6} color={p.wall} />

      {/* Entrance: glass doors under an accent canopy */}
      <mesh position={[0, 1.1, 11]}>
        <boxGeometry args={[3.2, 2.2, 0.05]} />
        <meshStandardMaterial color="#cfe6f7" transparent opacity={0.35} roughness={0.1} />
      </mesh>
      <mesh position={[0, 2.35, 11.5]} castShadow>
        <boxGeometry args={[4, 0.12, 1.4]} />
        <meshStandardMaterial color={p.accent} />
      </mesh>

      {/* Reception desk + wall sign */}
      <group position={[-3.2, 0, 3.2]}>
        <RoundedBox args={[3.2, 1.1, 0.9]} radius={0.08} position={[0, 0.55, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </RoundedBox>
        <mesh position={[0, 0.7, 0.46]}>
          <boxGeometry args={[3, 0.22, 0.02]} />
          <meshStandardMaterial color={p.accent} />
        </mesh>
        <RoundedBox args={[3.4, 0.06, 1.05]} radius={0.02} position={[0, 1.13, 0]} castShadow>
          <meshStandardMaterial color={WOOD} roughness={0.7} />
        </RoundedBox>
        <mesh position={[0.6, 1.4, -0.15]} castShadow>
          <boxGeometry args={[0.55, 0.36, 0.04]} />
          <meshStandardMaterial color="#2b3440" roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.95, -2.1]}>
          <boxGeometry args={[1.8, 0.4, 0.05]} />
          <meshStandardMaterial color={p.accent} emissive={p.accent} emissiveIntensity={0.25} />
        </mesh>
      </group>

      {/* Waiting area */}
      <Sofa position={[3, 0, 5.6]} color={p.soft} />
      <Sofa position={[3, 0, 8.4]} rotation={Math.PI} color={p.soft} />
      <mesh position={[3, 0.2, 7]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.4, 48]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </mesh>

      <Plant position={[-5.2, 0, 10.2]} />
      <Plant position={[5.2, 0, 1.8]} scale={0.9} />
      <Plant position={[-5.2, 0, 1.8]} scale={0.8} />
    </group>
  );
}

function Corridor({ p }: { p: Palette }) {
  const sconces = [-1, -4, -7, -11];
  return (
    <group>
      <Floor x={[-1.5, 1.5]} z={[-13, 1]} color={p.floor} />
      <Floor x={[-0.55, 0.55]} z={[-12.6, 0.8]} color={mix(p.floor, p.accent, 0.22)} y={0.01} />

      <Wall from={[-1.5, 1]} to={[-1.5, -13]} height={1} color={p.wall} />
      <Wall from={[1.5, 1]} to={[1.5, -8.4]} color={p.wall} />
      <Wall from={[1.5, -9.6]} to={[1.5, -13]} color={p.wall} />
      <Wall from={[-1.5, -13]} to={[1.5, -13]} color={p.wall} />
      <mesh position={[1.5, H - 0.2, -9]}>
        <boxGeometry args={[0.15, 0.4, 1.2]} />
        <meshStandardMaterial color={p.wall} />
      </mesh>

      {/* Handrail along the full-height wall */}
      {[[0.8, -8.3], [-9.7, -12.8]].map(([a, b]) => (
        <mesh key={a} position={[1.36, 0.9, (a + b) / 2]}>
          <boxGeometry args={[0.06, 0.06, a - b]} />
          <meshStandardMaterial color={p.accent} roughness={0.4} />
        </mesh>
      ))}
      {/* Closed doors to neighbouring rooms */}
      {[-2.5, -5.8].map((z) => (
        <group key={z} position={[1.41, 1.05, z]}>
          <mesh>
            <boxGeometry args={[0.04, 2.1, 1.05]} />
            <meshStandardMaterial color={mix(p.wall, p.accent, 0.3)} roughness={0.7} />
          </mesh>
          <mesh position={[-0.04, 0, 0.36]}>
            <boxGeometry args={[0.04, 0.05, 0.16]} />
            <meshStandardMaterial color="#9aa6b2" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {sconces.map((z) => (
        <mesh key={z} position={[1.4, 2.05, z]}>
          <boxGeometry args={[0.05, 0.12, 0.5]} />
          <meshStandardMaterial color="#fff6e5" emissive="#fff1d6" emissiveIntensity={1.2} />
        </mesh>
      ))}
      {/* End-of-hall window */}
      <mesh position={[0, 1.5, -12.91]}>
        <planeGeometry args={[1.8, 1.3]} />
        <meshStandardMaterial color="#e3f2ff" emissive="#d6ecff" emissiveIntensity={0.6} />
      </mesh>
      <RoundedBox args={[0.45, 0.42, 1.5]} radius={0.06} position={[-1.1, 0.21, -4]} castShadow>
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </RoundedBox>
    </group>
  );
}

function PatientRoom({ p }: { p: Palette }) {
  return (
    <group>
      <Floor x={[1.5, 8]} z={[-13, -5]} color={mix(p.floor, WOOD, 0.35)} />
      <Wall from={[1.5, -5]} to={[8, -5]} height={0.6} color={p.wall} />
      <Wall from={[8, -5]} to={[8, -13]} color={p.wall} />
      <Wall from={[1.5, -13]} to={[8, -13]} color={p.wall} />

      {/* Open door leaf */}
      <mesh position={[2.05, 1.05, -8.47]} castShadow>
        <boxGeometry args={[1, 2.1, 0.04]} />
        <meshStandardMaterial color={mix(p.wall, p.accent, 0.3)} roughness={0.7} />
      </mesh>

      {/* Window with daylight */}
      <mesh position={[7.91, 1.6, -9.2]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[3.4, 1.4]} />
        <meshStandardMaterial color="#e3f2ff" emissive="#d6ecff" emissiveIntensity={0.7} />
      </mesh>
      {[-10.9, -9.2, -7.5].map((z) => (
        <mesh key={z} position={[7.88, 1.6, z]}>
          <boxGeometry args={[0.04, 1.44, 0.05]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      <mesh position={[7.84, 0.88, -9.2]} castShadow>
        <boxGeometry args={[0.16, 0.05, 3.5]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>

      {/* Bed */}
      <group position={[4.4, 0, -11.6]}>
        <RoundedBox args={[1.15, 0.45, 2.2]} radius={0.06} position={[0, 0.36, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#e9eef3" roughness={0.6} />
        </RoundedBox>
        <RoundedBox args={[1.05, 0.18, 2.1]} radius={0.07} position={[0, 0.66, 0]} castShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.95} />
        </RoundedBox>
        <RoundedBox args={[1.1, 0.07, 1.3]} radius={0.03} position={[0, 0.77, 0.42]} castShadow>
          <meshStandardMaterial color={p.soft} roughness={0.95} />
        </RoundedBox>
        <RoundedBox args={[0.72, 0.14, 0.4]} radius={0.06} position={[0, 0.82, -0.78]} castShadow>
          <meshStandardMaterial color="#ffffff" roughness={1} />
        </RoundedBox>
        <RoundedBox args={[1.25, 1.1, 0.1]} radius={0.04} position={[0, 0.7, -1.18]} castShadow>
          <meshStandardMaterial color={WOOD} roughness={0.7} />
        </RoundedBox>
        {/* Headwall: medical gas / call panel */}
        <mesh position={[0, 1.55, -1.3]}>
          <boxGeometry args={[1.6, 0.26, 0.06]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        {[-0.5, -0.2, 0.1].map((x) => (
          <mesh key={x} position={[x, 1.55, -1.26]}>
            <circleGeometry args={[0.04, 24]} />
            <meshStandardMaterial color={p.accent} emissive={p.accent} emissiveIntensity={0.5} />
          </mesh>
        ))}
      </group>

      {/* Nightstand, wardrobe, armchair */}
      <RoundedBox args={[0.5, 0.6, 0.45]} radius={0.04} position={[5.45, 0.3, -12.5]} castShadow>
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.6, 2, 1.3]} radius={0.04} position={[1.95, 1, -11.8]} castShadow>
        <meshStandardMaterial color={mix(WOOD, "#ffffff", 0.3)} roughness={0.7} />
      </RoundedBox>
      <group position={[6.8, 0, -6.4]} rotation-y={-Math.PI / 4}>
        <RoundedBox args={[0.95, 0.45, 0.9]} radius={0.12} position={[0, 0.3, 0]} castShadow>
          <meshStandardMaterial color={p.soft} roughness={0.95} />
        </RoundedBox>
        <RoundedBox args={[0.95, 0.65, 0.22]} radius={0.1} position={[0, 0.7, 0.36]} castShadow>
          <meshStandardMaterial color={p.soft} roughness={0.95} />
        </RoundedBox>
      </group>
      <Plant position={[7.4, 0, -12.4]} scale={0.6} />
    </group>
  );
}
