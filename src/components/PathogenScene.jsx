import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

// ==========================================
// PHYSICS WRAPPER (Movement & Collisions)
// ==========================================
const PathogenPhysics = ({ children, startAngle = 0, radius = 2.5, speed = 0.5, allNodesRef }) => {
  const groupRef = useRef();
  const mouseVec = useMemo(() => new THREE.Vector3(), []);
  const timeOffset = useMemo(() => Math.random() * 100, []);

  // Register this node in the shared array so others can detect it
  useEffect(() => {
    if (groupRef.current && allNodesRef) {
      allNodesRef.current.push(groupRef.current);
    }
    return () => {
      if (groupRef.current && allNodesRef) {
        allNodesRef.current = allNodesRef.current.filter(n => n !== groupRef.current);
      }
    };
  }, [allNodesRef]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Cut the overall speed in half to make them drift slower
    const t = (state.clock.getElapsedTime() + timeOffset) * (speed * 0.5);

    // 1. Base orbit (slower rotation multiplier)
    const currentAngle = startAngle + t * 0.1; 
    const currentRadius = radius + Math.sin(t * 0.4) * 0.5;
    
    const intendedPos = new THREE.Vector3(
      Math.cos(currentAngle) * currentRadius * 1.3, 
      Math.sin(currentAngle) * currentRadius * 0.8, 
      Math.sin(t * 0.3) * 1.0 - 0.5
    );

    // 2. Mouse evasion (Gently nudge instead of run)
    mouseVec.set(
      (state.pointer.x * state.viewport.width) / 2,
      (state.pointer.y * state.viewport.height) / 2,
      intendedPos.z
    );

    const mouseDist = intendedPos.distanceTo(mouseVec);
    const dodgeRadius = 2.8; // Reduced radius so they let the mouse get closer

    if (mouseDist < dodgeRadius) {
      const dirAway = intendedPos.clone().sub(mouseVec).normalize();
      // Significantly reduced the push strength (from 1.8 down to 0.5)
      const force = (dodgeRadius - mouseDist) * 0.5; 
      intendedPos.add(dirAway.multiplyScalar(force));
    }

    // 3. Pathogen collision avoidance (repulsion)
    if (allNodesRef) {
      const separationRadius = 2.4; 
      allNodesRef.current.forEach((otherNode) => {
        if (otherNode !== groupRef.current) {
           const dist = intendedPos.distanceTo(otherNode.position);
           if (dist < separationRadius && dist > 0.01) {
             const dirAway = intendedPos.clone().sub(otherNode.position).normalize();
             const force = (separationRadius - dist) * 0.6;
             intendedPos.add(dirAway.multiplyScalar(force));
           }
        }
      });
    }

    // 4. Smoothly interpolate (lowered from 3.0 to 1.2 for a lazier, heavy-fluid feel)
    groupRef.current.position.lerp(intendedPos, delta * 1.2);
  });

  return <group ref={groupRef}>{children}</group>;
};

// ==========================================
// 3D MODELS
// ==========================================
function VirusNode({ scale = 1 }) {
  const groupRef = useRef(null);
  const timeOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime + timeOffset;
    groupRef.current.rotation.x = Math.sin(t * 0.15) * 0.3;
    groupRef.current.rotation.y = t * 0.08;
    groupRef.current.rotation.z = Math.cos(t * 0.12) * 0.2;
  });

  const spikePositions = useMemo(() => {
    const positions = [];
    const count = 120;
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 0.52 * scale;
      positions.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ]);
    }
    return positions;
  }, [scale]);

  return (
    <Float speed={0.8} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[0.5 * scale, 64, 64]} />
          <meshPhysicalMaterial
            color="#0a3d2a"
            roughness={0.3}
            metalness={0.1}
            transmission={0.15}
            thickness={1.5}
            clearcoat={0.8}
            clearcoatRoughness={0.2}
            envMapIntensity={0.5}
          />
        </mesh>
        {spikePositions.map((pos, i) => {
          const dir = new THREE.Vector3(...pos).normalize();
          const quat = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            dir
          );
          return (
            <group key={i} position={pos} quaternion={quat}>
              <mesh>
                <cylinderGeometry args={[0.008 * scale, 0.025 * scale, 0.18 * scale, 6]} />
                <meshPhysicalMaterial color="#0d5e3f" roughness={0.4} metalness={0.05} />
              </mesh>
              <mesh position={[0, 0.1 * scale, 0]}>
                <sphereGeometry args={[0.03 * scale, 8, 8]} />
                <meshPhysicalMaterial color="#15a06a" roughness={0.3} emissive="#0a5e3a" emissiveIntensity={0.3} />
              </mesh>
            </group>
          );
        })}
      </group>
    </Float>
  );
}

function BacteriaNode({ scale = 1 }) {
  const groupRef = useRef(null);
  const timeOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime + timeOffset;
    groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.4;
    groupRef.current.rotation.z = t * 0.06;
  });

  const flagella = useMemo(() => {
    const curves = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const points = [];
      for (let j = 0; j < 12; j++) {
        const t = j / 11;
        points.push(
          new THREE.Vector3(
            Math.cos(angle) * (0.15 + t * 0.6) * scale,
            (Math.random() - 0.5) * 0.1 * scale + Math.sin(t * 4) * 0.08 * scale,
            Math.sin(angle) * (0.15 + t * 0.6) * scale
          )
        );
      }
      curves.push(new THREE.CatmullRomCurve3(points));
    }
    return curves;
  }, [scale]);

  return (
    <Float speed={0.6} rotationIntensity={0.3} floatIntensity={0.4}>
      <group ref={groupRef}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.2 * scale, 0.6 * scale, 32, 64]} />
          <meshPhysicalMaterial
            color="#0b4430"
            roughness={0.35}
            metalness={0.05}
            transmission={0.1}
            thickness={2}
            clearcoat={1}
            clearcoatRoughness={0.15}
          />
        </mesh>
        {flagella.map((curve, i) => (
          <mesh key={i}>
            <tubeGeometry args={[curve, 30, 0.008 * scale, 5, false]} />
            <meshPhysicalMaterial color="#0d5e3f" roughness={0.5} transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function Particles() {
  const count = 200;
  const ref = useRef(null);

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      sz[i] = Math.random() * 0.03 + 0.005;
    }
    return [pos, sz];
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.01;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#1a7a52" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

function MouseLight() {
  const lightRef = useRef(null);
  const { viewport } = useThree();

  useFrame((state) => {
    if (!lightRef.current) return;
    const x = (state.pointer.x * viewport.width) / 2;
    const y = (state.pointer.y * viewport.height) / 2;
    lightRef.current.position.set(x, y, 3);
  });

  return <pointLight ref={lightRef} intensity={2} color="#15a06a" distance={10} />;
}

// ==========================================
// MAIN SCENE
// ==========================================
export default function PathogenScene() {
  const allNodesRef = useRef([]);

  return (
    <div className="absolute inset-0 z-0 bg-[#010805]">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#010805']} />
        <fog attach="fog" args={['#010805', 5, 18]} />

        <ambientLight intensity={0.15} color="#0a3d2a" />
        <directionalLight position={[5, 5, 5]} intensity={0.6} color="#1a8a5a" />
        <directionalLight position={[-5, -3, 3]} intensity={0.3} color="#0d5040" />
        <MouseLight />

        {/* Viruses */}
        <PathogenPhysics startAngle={0} radius={2.8} speed={0.4} allNodesRef={allNodesRef}>
          <VirusNode scale={1.2} />
        </PathogenPhysics>
        
        <PathogenPhysics startAngle={Math.PI * 0.7} radius={2.5} speed={0.5} allNodesRef={allNodesRef}>
          <VirusNode scale={0.9} />
        </PathogenPhysics>
        
        <PathogenPhysics startAngle={Math.PI * 1.3} radius={2.9} speed={0.35} allNodesRef={allNodesRef}>
          <VirusNode scale={1.0} />
        </PathogenPhysics>

        {/* Bacteria */}
        <PathogenPhysics startAngle={Math.PI * 0.35} radius={2.6} speed={0.45} allNodesRef={allNodesRef}>
          <BacteriaNode scale={1.1} />
        </PathogenPhysics>
        
        <PathogenPhysics startAngle={Math.PI * 1.0} radius={2.4} speed={0.3} allNodesRef={allNodesRef}>
          <BacteriaNode scale={0.8} />
        </PathogenPhysics>
        
        <PathogenPhysics startAngle={Math.PI * 1.7} radius={3.1} speed={0.55} allNodesRef={allNodesRef}>
          <BacteriaNode scale={0.9} />
        </PathogenPhysics>

        <Particles />
      </Canvas>
    </div>
  );
}