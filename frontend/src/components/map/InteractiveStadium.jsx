/* eslint-disable react/no-unknown-property */
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useZoneStore } from '../../store/zoneStore.js';

function ZoneBlock({ position, size, label, pressureScore }) {
  const meshRef = useRef();

  // Color mapping based on pressure
  const color = useMemo(() => {
    if (pressureScore >= 90) return '#ef4444'; // Red
    if (pressureScore >= 70) return '#f59e0b'; // Orange
    if (pressureScore >= 40) return '#facc15'; // Yellow
    return '#10b981'; // Green
  }, [pressureScore]);
  
  // Height interpolation purely off physical pressure bounds
  const heightMultiplier = Math.max(1, pressureScore / 25);
  const targetHeight = size[1] * heightMultiplier;

  useFrame((state, delta) => {
    // Smoothly animate height changes
    meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetHeight, 0.1);
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} position={[0, size[1] / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[size[0], 1, size[2]]} />
        <meshPhysicalMaterial 
          color={color} 
          roughness={0.2} 
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.2}
          clearcoat={1}
        />
      </mesh>
      <Text
        position={[0, targetHeight + 1.5, 0]}
        fontSize={0.8}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="black"
      >
        {label}
      </Text>
    </group>
  );
}

function StadiumCore() {
  const coreRef = useRef();
  
  useFrame((state) => {
    coreRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
  });

  return (
    <mesh ref={coreRef} position={[0, -0.5, 0]} receiveShadow>
      <cylinderGeometry args={[8, 7, 1, 32]} />
      <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.7} />
    </mesh>
  );
}

function Scene() {
  const { zones } = useZoneStore();
  
  // Create an explicit array of dummy zones or fetch physical zones mapped sequentially around the cylinder
  const zoneArray = Object.values(zones).slice(0, 8); // Max 8 blocks for symmetry
  
  const blocks = zoneArray.map((zone, idx) => {
    const angle = (idx / zoneArray.length) * Math.PI * 2;
    const radius = 5;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    
    return (
      <ZoneBlock 
        key={zone.id}
        label={zone.label}
        position={[x, 0, z]}
        size={[2.5, 1, 2.5]}
        pressureScore={zone.pressureScore}
      />
    );
  });

  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} castShadow intensity={1.5} />
      
      <group position={[0, -2, 0]}>
        <StadiumCore />
        {blocks}
        <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.5} far={10} color="#000000" />
      </group>
      
      <OrbitControls 
        autoRotate 
        autoRotateSpeed={0.5} 
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={15}
        maxDistance={30}
      />
    </>
  );
}

export default function InteractiveStadium() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at center, #1a1a2e 0%, #000 100%)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <Canvas shadows camera={{ position: [20, 15, 20], fov: 45 }}>
        <Scene />
      </Canvas>
    </div>
  );
}
