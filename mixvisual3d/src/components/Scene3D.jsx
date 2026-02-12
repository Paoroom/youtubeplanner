import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import { useMemo } from 'react'
import { freqToColor } from '../data'
import InstrumentMesh from './InstrumentMesh'

function GridFloor() {
  const lines = useMemo(() => {
    const arr = [];
    for (let i = -5; i <= 5; i++) {
      arr.push(
        <Line key={`x${i}`} points={[[-5, 0, i], [5, 0, i]]} color="#1a1a3a" lineWidth={0.5} />,
        <Line key={`z${i}`} points={[[i, 0, -5], [i, 0, 5]]} color="#1a1a3a" lineWidth={0.5} />
      );
    }
    return arr;
  }, []);

  return <group>{lines}</group>;
}

function AxisLabels() {
  return (
    <group>
      {/* X axis - Pan */}
      <Line points={[[-5.5, 0, 0], [5.5, 0, 0]]} color="#FF6B00" lineWidth={1.5} />
      <Text position={[-5.8, 0, 0]} fontSize={0.3} color="#FF6B00" anchorX="right">L</Text>
      <Text position={[5.8, 0, 0]} fontSize={0.3} color="#00F0FF" anchorX="left">R</Text>
      <Text position={[0, -0.4, 0]} fontSize={0.2} color="#6a6a8a" anchorY="top">PAN</Text>

      {/* Y axis - Frequency */}
      <Line points={[[0, 0, 0], [0, 6, 0]]} color="#B800FF" lineWidth={1.5} />
      <Text position={[0, -0.3, 0]} fontSize={0.2} color="#FF6B00">Grave</Text>
      <Text position={[0, 6.3, 0]} fontSize={0.2} color="#00F0FF">Aigu</Text>
      <Text position={[-0.5, 3, 0]} fontSize={0.18} color="#6a6a8a" rotation={[0, 0, Math.PI / 2]}>FRÉQUENCE</Text>

      {/* Z axis - Reverb/Depth */}
      <Line points={[[0, 0, -5.5], [0, 0, 5.5]]} color="#B800FF" lineWidth={1.5} />
      <Text position={[0, 0, -5.8]} fontSize={0.25} color="#00F0FF">Devant</Text>
      <Text position={[0, 0, 5.8]} fontSize={0.25} color="#B800FF">Arrière</Text>
    </group>
  );
}

function mapInstrumentToPosition(inst) {
  // Pan: -100..+100 => X: -5..+5
  const x = (inst.pan / 100) * 5;
  // Freq: 20..20000 (log) => Y: 0..6
  const logFreq = Math.log2(inst.freq / 20) / Math.log2(20000 / 20);
  const y = logFreq * 6;
  // Reverb: 0..500 => Z: -4..+4 (0=devant, 500=arrière)
  const z = (inst.reverb / 500) * 8 - 4;
  // Volume: -30..0 => scale 0.2..1
  const scale = 0.2 + ((inst.volume + 30) / 30) * 0.8;
  // Stereo width => widthScale 1..2.5
  const widthScale = 1 + (inst.stereo / 100) * 1.5;

  return { x, y, z, scale, widthScale, color: freqToColor(inst.freq) };
}

export default function Scene3D({ instruments, selectedId, onSelect }) {
  return (
    <Canvas
      camera={{ position: [8, 6, 8], fov: 55 }}
      style={{ background: '#0a0a12' }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#00F0FF" />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#B800FF" />
      <directionalLight position={[0, 10, 0]} intensity={0.4} />

      <fog attach="fog" args={['#0a0a12', 15, 30]} />

      <GridFloor />
      <AxisLabels />

      {instruments.map(inst => {
        const pos = mapInstrumentToPosition(inst);
        return (
          <InstrumentMesh
            key={inst.id}
            instrument={inst}
            position={[pos.x, pos.y, pos.z]}
            scale={pos.scale}
            widthScale={pos.widthScale}
            color={pos.color}
            selected={selectedId === inst.id}
            onClick={() => onSelect(inst.id)}
          />
        );
      })}

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={20}
        target={[0, 3, 0]}
      />
    </Canvas>
  );
}
