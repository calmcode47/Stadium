import React, { useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Edges, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { StandSection } from '@/types/operations'

interface StadiumInteractive3DProps {
  sections: StandSection[]
  selectedSectionId: string | null
  onSelectSection: (section: StandSection) => void
  cameraPreset: 'overview' | 'pitch' | 'north'
}

// Camera Tween sub-component to smoothly interpolate position and lookAt target
const CameraTween: React.FC<{
  preset: 'overview' | 'pitch' | 'north'
}> = ({ preset }) => {
  const { camera } = useThree()

  // Target vectors for different presets
  const presets = {
    overview: {
      position: new THREE.Vector3(0, 7, 9),
      lookAt: new THREE.Vector3(0, 0, 0)
    },
    pitch: {
      position: new THREE.Vector3(0, 0.4, 3.2),
      lookAt: new THREE.Vector3(0, 0.8, -3.0)
    },
    north: {
      position: new THREE.Vector3(0, 3.5, -6.5),
      lookAt: new THREE.Vector3(0, 0, -2.0)
    }
  }

  useFrame((state, delta) => {
    const target = presets[preset]
    const speed = 5.0 * delta // Smooth damping speed

    // Lerp camera position
    camera.position.lerp(target.position, speed)

    // Lerp controls target (where the camera looks)
    const controls = state.controls as any
    if (controls) {
      const currentTarget = new THREE.Vector3().copy(controls.target)
      currentTarget.lerp(target.lookAt, speed)
      controls.target.copy(currentTarget)
      controls.update()
    }
  })

  return null
}

// Custom interactive stand sector component
const InteractiveStand: React.FC<{
  section: StandSection
  position: [number, number, number]
  size: [number, number, number]
  rotation?: [number, number, number]
  isSelected: boolean
  onClick: () => void
}> = ({ section, position, size, rotation = [0, 0, 0], isSelected, onClick }) => {
  const [hovered, setHovered] = useState(false)
  const percent = Math.min(100, Math.round((section.occupancy / section.maxCapacity) * 100))

  return (
    <mesh
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHovered(false)
      }}
    >
      <boxGeometry args={size} />
      {/* Mesh faces styled to fit digital wireframe console */}
      <meshBasicMaterial 
        color={isSelected ? '#00D9FF' : hovered ? '#00D9FF' : '#12181F'} 
        transparent 
        opacity={isSelected ? 0.35 : hovered ? 0.22 : 0.08} 
      />
      {/* Emissive cyan borders */}
      <Edges 
        color="#00D9FF" 
        threshold={15} 
        opacity={isSelected ? 1.0 : hovered ? 0.95 : 0.28}
      />

      {/* HTML tooltip rendered on hover */}
      {hovered && (
        <Html distanceFactor={8} position={[0, size[1] / 2 + 0.3, 0]} center>
          <div className="bg-surface border border-cyan text-cyan font-mono text-[9px] px-2 py-1.5 whitespace-nowrap rounded-[2px] pointer-events-none select-none shadow-[0_0_15px_rgba(0,217,255,0.25)] flex flex-col gap-0.5">
            <span className="font-semibold text-text-primary text-[10px]">{section.name}</span>
            <span>CAPACITY: {percent}%</span>
            <span>GATE: {section.gateStatus.toUpperCase()}</span>
          </div>
        </Html>
      )}
    </mesh>
  )
}

// Shared geometries and materials for structural floodlights to optimize rendering calls
const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2.5, 4)
const lampGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15)
const poleMaterial = new THREE.MeshBasicMaterial({ 
  color: 0x00D9FF, 
  transparent: true, 
  opacity: 0.15 
})
const lampMaterial = new THREE.MeshBasicMaterial({ 
  color: 0x00D9FF, 
  toneMapped: false 
})

export const StadiumInteractive3D: React.FC<StadiumInteractive3DProps> = ({
  sections,
  selectedSectionId,
  onSelectSection,
  cameraPreset
}) => {
  // Map sections by their ID for easy access
  const standMap = sections.reduce((acc, curr) => {
    acc[curr.id] = curr
    return acc
  }, {} as Record<string, StandSection>)

  return (
    <div className="w-full h-full relative bg-base/20 border border-cyan/20 rounded-[4px] overflow-hidden select-none">
      <Canvas
        camera={{ position: [0, 7, 9], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Lights */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />

        {/* Dynamic camera preset tweener */}
        <CameraTween preset={cameraPreset} />

        {/* Stadium playing field */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
          <planeGeometry args={[6.5, 4.0]} />
          <meshBasicMaterial color="#12181F" />
          <Edges color="#00D9FF" opacity={0.2} />
        </mesh>
        
        {/* Pitch grid lines */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.59, 0]}>
          <planeGeometry args={[6.5, 4.0, 4, 3]} />
          <meshBasicMaterial color="#00D9FF" wireframe transparent opacity={0.12} />
        </mesh>

        {/* 4 Clickable Seating Sectors */}
        {standMap['sect-north'] && (
          <InteractiveStand
            section={standMap['sect-north']}
            position={[0, 0, -2.7]}
            size={[4.8, 0.9, 0.9]}
            isSelected={selectedSectionId === 'sect-north'}
            onClick={() => onSelectSection(standMap['sect-north'])}
          />
        )}
        
        {/* Curved upper tier representation for North */}
        {standMap['sect-north'] && (
          <mesh position={[0, 0.7, -3.3]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[4.8, 0.5, 0.6]} />
            <meshBasicMaterial color="#12181F" transparent opacity={0.05} />
            <Edges color="#00D9FF" opacity={0.15} />
          </mesh>
        )}

        {standMap['sect-south'] && (
          <InteractiveStand
            section={standMap['sect-south']}
            position={[0, 0, 2.7]}
            size={[4.8, 0.9, 0.9]}
            isSelected={selectedSectionId === 'sect-south'}
            onClick={() => onSelectSection(standMap['sect-south'])}
          />
        )}
        
        {/* Curved upper tier representation for South */}
        {standMap['sect-south'] && (
          <mesh position={[0, 0.7, 3.3]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[4.8, 0.5, 0.6]} />
            <meshBasicMaterial color="#12181F" transparent opacity={0.05} />
            <Edges color="#00D9FF" opacity={0.15} />
          </mesh>
        )}

        {standMap['sect-east'] && (
          <InteractiveStand
            section={standMap['sect-east']}
            position={[3.8, 0, 0]}
            size={[0.9, 0.9, 4.4]}
            isSelected={selectedSectionId === 'sect-east'}
            onClick={() => onSelectSection(standMap['sect-east'])}
          />
        )}

        {standMap['sect-west'] && (
          <InteractiveStand
            section={standMap['sect-west']}
            position={[-3.8, 0, 0]}
            size={[0.9, 0.9, 4.4]}
            isSelected={selectedSectionId === 'sect-west'}
            onClick={() => onSelectSection(standMap['sect-west'])}
          />
        )}

        {/* 4 Corner Floodlights */}
        {[
          [-3.3, -0.6, -2.1],
          [3.3, -0.6, -2.1],
          [-3.3, -0.6, 2.1],
          [3.3, -0.6, 2.1]
        ].map((pos, idx) => (
          <group key={idx} position={pos as [number, number, number]}>
            {/* Pole */}
            <mesh position={[0, 1.25, 0]} geometry={poleGeometry} material={poleMaterial} />
            {/* Lamp Tip */}
            <mesh position={[0, 2.5, 0]} geometry={lampGeometry} material={lampMaterial} />
          </group>
        ))}

        {/* Orbit Controls (damped, clamped angles) */}
        <OrbitControls
          makeDefault
          enableZoom={true}
          minDistance={4}
          maxDistance={14}
          enablePan={false}
          enableRotate={true}
          dampingFactor={0.05}
          enableDamping
          maxPolarAngle={Math.PI / 2 - 0.05} // prevent going underground
        />
      </Canvas>

      {/* Control Instruction Overlay */}
      <div className="absolute bottom-2 left-2 pointer-events-none font-mono text-[9px] text-cyan/60 uppercase">
        DRAG TO ROTATE // DOUBLE CLICK TO FOCUS // ORBIT CONTROLS CALIBRATED
      </div>
    </div>
  )
}

export default StadiumInteractive3D
