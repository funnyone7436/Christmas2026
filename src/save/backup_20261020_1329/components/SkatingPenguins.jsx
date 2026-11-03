import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// 1. Define exact paths from your public/glb/ folder[cite: 16]
const PENGUIN_PATHS = [
  `${import.meta.env.BASE_URL}glb/True_3D_Penguin_Root.glb`,
  `${import.meta.env.BASE_URL}glb/True_3D_Penguin_Root.001.glb`,
  `${import.meta.env.BASE_URL}glb/True_3D_Penguin_Root.002.glb`,
  `${import.meta.env.BASE_URL}glb/True_3D_Penguin_Root.003.glb`
]

// Preload models for performance
PENGUIN_PATHS.forEach(path => useGLTF.preload(path))

function SingleSkater({ path, baseRadius, orbitalSpeed, waveSpeed, waveAmplitude, startAngle, groundHeight }) {
  const groupRef = useRef()
  const { scene } = useGLTF(path)
  
  // Clone to safely reuse geometry without React recreating it every frame
  const clonedScene = useMemo(() => scene.clone(), [scene])

  useFrame((state) => {
    if (!groupRef.current) return
    
    const t = state.clock.getElapsedTime()

    // 1. Calculate Current Position
    const currentAngle = startAngle + (t * orbitalSpeed)
    // Sine wave applies to the radius to make them carve inward/outward
    const currentRadius = baseRadius + Math.sin(t * waveSpeed) * waveAmplitude

    const x = Math.cos(currentAngle) * currentRadius
    const z = Math.sin(currentAngle) * currentRadius

    // 2. Calculate Future Position (a tiny fraction of a second ahead)
    const futureAngle = startAngle + ((t + 0.05) * orbitalSpeed)
    const futureRadius = baseRadius + Math.sin((t + 0.05) * waveSpeed) * waveAmplitude

    const nextX = Math.cos(futureAngle) * futureRadius
    const nextZ = Math.sin(futureAngle) * futureRadius

    // 3. Apply coordinates and rotation
    groupRef.current.position.set(x, groundHeight, z)
    
    // lookAt forces the penguin to turn and face the direction of the wave curve
    groupRef.current.lookAt(nextX, groundHeight, nextZ)
  })

  return (
    <group ref={groupRef}>
      {/* If your penguins load too small or large, adjust scale here: scale={0.5} */}
      <primitive object={clonedScene} />
    </group>
  )
}

export default function SkatingPenguins() {
  const groundHeight = -1.5 // Adjust so their feet touch the ice perfectly[cite: 17]

  // Configured in 4 distinct lanes so they never touch, even with different speeds
  const skaterConfigs = [
    { 
      path: PENGUIN_PATHS[0], 
      baseRadius: 6.0,     // Inner lane
      orbitalSpeed: 0.6,   // Fastest speed
      waveSpeed: 1.5,      // Frequency of the carving wave
      waveAmplitude: 1.2,  // How wide they carve left/right
      startAngle: 0 
    },
    { 
      path: PENGUIN_PATHS[1], 
      baseRadius: 10.0,    // Mid-inner lane
      orbitalSpeed: 0.45, 
      waveSpeed: 1.2, 
      waveAmplitude: 1.5, 
      startAngle: Math.PI / 2 
    },
    { 
      path: PENGUIN_PATHS[2], 
      baseRadius: 14.0,    // Mid-outer lane
      orbitalSpeed: 0.35,  
      waveSpeed: 2.0, 
      waveAmplitude: 1.2, 
      startAngle: Math.PI 
    },
    { 
      path: PENGUIN_PATHS[3], 
      baseRadius: 17.5,    // Outer lane (just inside the 19.0 radius lamp posts)
      orbitalSpeed: 0.25,  // Slowest speed 
      waveSpeed: 0.8, 
      waveAmplitude: 1.0, 
      startAngle: Math.PI * 1.5 
    }
  ]

  return (
    <group>
      {skaterConfigs.map((config, i) => (
        <SingleSkater 
          key={i} 
          {...config} 
          groundHeight={groundHeight} 
        />
      ))}
    </group>
  )
}