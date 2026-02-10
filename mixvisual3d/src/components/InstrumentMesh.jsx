import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'

function ShapeGeometry({ shape }) {
  switch (shape) {
    case 'sphere':
      return <sphereGeometry args={[0.4, 24, 24]} />;
    case 'smallsphere':
      return <sphereGeometry args={[0.25, 16, 16]} />;
    case 'cone':
      return <coneGeometry args={[0.3, 0.7, 16]} />;
    case 'cylinder':
      return <cylinderGeometry args={[0.3, 0.3, 0.5, 16]} />;
    case 'torus':
      return <torusGeometry args={[0.35, 0.12, 12, 24]} />;
    case 'box':
      return <boxGeometry args={[0.5, 0.5, 0.5]} />;
    case 'capsule':
      return <capsuleGeometry args={[0.2, 0.4, 8, 16]} />;
    default:
      return <boxGeometry args={[0.5, 0.5, 0.5]} />;
  }
}

export default function InstrumentMesh({ instrument, position, scale, widthScale, color, selected, onClick }) {
  const meshRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      if (selected) {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = selected
        ? 0.15 + Math.sin(state.clock.elapsedTime * 3) * 0.08
        : 0;
    }
  });

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Main shape */}
      <mesh ref={meshRef} scale={[scale * widthScale, scale, scale]} castShadow>
        <ShapeGeometry shape={instrument.shape} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.6 : 0.2}
          metalness={0.3}
          roughness={0.4}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Selection glow */}
      <mesh ref={glowRef} scale={[scale * widthScale * 1.8, scale * 1.8, scale * 1.8]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0} />
      </mesh>

      {/* Drop shadow on grid */}
      <mesh position={[0, -position[1] + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[scale * 0.3, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>

      {/* Vertical line to floor */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, -position[1], 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.2} />
      </line>

      {/* Label */}
      <Text
        position={[0, scale * 0.7, 0]}
        fontSize={0.22}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {instrument.name}
      </Text>
    </group>
  );
}
