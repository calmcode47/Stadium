import React, { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Edges } from '@react-three/drei'
import * as THREE from 'three'

// Check if WebGL is available in the current browser session
const isWebGLAvailable = (): boolean => {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

// Shared instanced geometries and materials to avoid repeated draw call overhead
const pillarGeometry = new THREE.CylinderGeometry(0.03, 0.03, 2.0, 5)
const pillarMaterial = new THREE.MeshBasicMaterial({ 
  color: 0x00D9FF, 
  transparent: true, 
  opacity: 0.35 
})

// Procedural Stadium Elements component
const StadiumScene: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null)

  // Auto-rotate the stadium slowly
  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.15 * delta // rotation rate
    }
  })

  // Generate 16 outer structural pillars arranged in a circle
  const numPillars = 16
  const pillarsRadius = 5.2
  const pillars = Array.from({ length: numPillars }).map((_, idx) => {
    const angle = (idx / numPillars) * Math.PI * 2
    const x = Math.cos(angle) * pillarsRadius
    const z = Math.sin(angle) * pillarsRadius
    return (
      <mesh key={idx} position={[x, 0.2, z]} geometry={pillarGeometry} material={pillarMaterial}>
        <Edges color="#00D9FF" />
      </mesh>
    )
  })

  return (
    <group ref={groupRef}>
      {/* 1. Playing Field Pitch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
        <planeGeometry args={[6.5, 4.0]} />
        <meshBasicMaterial color="#12181F" />
        <Edges color="#00D9FF" />
      </mesh>
      
      {/* Pitch Grid Lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.79, 0]}>
        <planeGeometry args={[6.5, 4.0, 4, 3]} />
        <meshBasicMaterial color="#00D9FF" wireframe transparent opacity={0.2} />
      </mesh>

      {/* 2. Lower Seating Bowl Tier */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[3.8, 3.4, 0.6, 24, 2, true]} />
        <meshBasicMaterial color="#12181F" transparent opacity={0.4} />
        <Edges color="#00D9FF" />
      </mesh>

      {/* 3. Middle Seating Bowl Tier */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[4.4, 4.0, 0.8, 24, 2, true]} />
        <meshBasicMaterial color="#12181F" transparent opacity={0.4} />
        <Edges color="#00D9FF" />
      </mesh>

      {/* 4. Upper Seating Bowl Tier */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[5.0, 4.6, 1.0, 24, 2, true]} />
        <meshBasicMaterial color="#12181F" transparent opacity={0.4} />
        <Edges color="#00D9FF" />
      </mesh>

      {/* 5. Structural Pillars */}
      {pillars}

      {/* 6. Roof Ring Structure */}
      <mesh position={[0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5.1, 0.05, 8, 32]} />
        <meshBasicMaterial color="#00D9FF" />
      </mesh>
    </group>
  )
}

// Fallback static vector SVG stadium illustration
const StaticSvgStadium: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 border border-cyan/15 bg-surface/50 rounded-[4px]">
      <svg
        viewBox="0 0 400 240"
        className="w-full max-w-sm text-cyan opacity-40 hover:opacity-60 transition-opacity duration-300"
        stroke="currentColor"
        fill="none"
        strokeWidth="1.2"
      >
        {/* Field Oval */}
        <ellipse cx="200" cy="140" rx="90" ry="36" strokeDasharray="3 3" />
        <ellipse cx="200" cy="140" rx="60" ry="24" />
        
        {/* Seating Tiers */}
        <ellipse cx="200" cy="140" rx="120" ry="48" />
        <ellipse cx="200" cy="140" rx="145" ry="58" />
        <ellipse cx="200" cy="140" rx="170" ry="68" />
        
        {/* Roof Structure */}
        <ellipse cx="200" cy="70" rx="160" ry="30" />
        
        {/* Structural Pillars */}
        <line x1="30" y1="140" x2="30" y2="70" />
        <line x1="60" y1="165" x2="60" y2="85" />
        <line x1="100" y1="180" x2="100" y2="95" />
        <line x1="370" y1="140" x2="370" y2="70" />
        <line x1="340" y1="165" x2="340" y2="85" />
        <line x1="300" y1="180" x2="300" y2="95" />
      </svg>
    </div>
  )
}

// Skeleton loading frame
const LoadingSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col justify-between p-4 bg-surface border border-cyan/10 rounded-[4px] animate-pulse">
      <div className="flex justify-between items-center border-b border-cyan/5 pb-2">
        <div className="h-2 w-24 bg-cyan/20 rounded" />
        <div className="h-4 w-12 bg-cyan/20 rounded" />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-48 h-48 border border-dashed border-cyan/10 rounded-full flex items-center justify-center">
          <div className="w-32 h-32 border border-dashed border-cyan/10 rounded-full" />
        </div>
      </div>
      <div className="h-2 w-32 bg-cyan/10 rounded self-center" />
    </div>
  )
}

export const Stadium3D: React.FC = () => {
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null)

  useEffect(() => {
    setHasWebGL(isWebGLAvailable())
  }, [])

  if (hasWebGL === null) {
    return <LoadingSkeleton />
  }

  if (!hasWebGL) {
    return <StaticSvgStadium />
  }

  return (
    <div className="w-full h-full relative border border-cyan/25 bg-surface/40 rounded-[4px] overflow-hidden select-none">
      {/* 3D Canvas Context */}
      <Suspense fallback={<LoadingSkeleton />}>
        <Canvas
          camera={{ position: [0, 5, 8], fov: 45 }}
          style={{ background: 'transparent' }}
          gl={{ antialias: true, alpha: true }}
        >
          {/* Ambient Lighting for technical scans */}
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={0.5} />

          {/* Procedural Stadium */}
          <StadiumScene />

          {/* Orbit Controls (damped, rotate-only) */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={true}
            autoRotate={false}
            dampingFactor={0.06}
            enableDamping
          />
        </Canvas>
      </Suspense>

      {/* Floating telemetry label overlay */}
      <div className="absolute bottom-2 left-2 pointer-events-none font-mono text-[9px] text-cyan/60 uppercase">
        MODEL: STADIUM-V1-LOD0 // VERTICES: ~2.1K // ORBIT CONTROL ENABLED
      </div>
    </div>
  )
}

export default Stadium3D
