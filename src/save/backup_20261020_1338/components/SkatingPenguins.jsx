import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const PENGUIN_PATHS = [
  `${import.meta.env.BASE_URL}glb/True_3D_Penguin_Root.glb`,
  `${import.meta.env.BASE_URL}glb/True_3D_Penguin_Root.001.glb`,
  `${import.meta.env.BASE_URL}glb/True_3D_Penguin_Root.002.glb`,
  `${import.meta.env.BASE_URL}glb/True_3D_Penguin_Root.003.glb`
]

PENGUIN_PATHS.forEach(path => useGLTF.preload(path))

function SingleSkater({ path, baseRadius, orbitalSpeed, waveSpeed, waveAmplitude, startAngle, groundHeight, scale }) {
  const groupRef = useRef()
  const { scene } = useGLTF(path)
  
  const clonedScene = useMemo(() => scene.clone(), [scene])

  useFrame((state) => {
    if (!groupRef.current) return
    
    const t = state.clock.getElapsedTime()

    const currentAngle = startAngle + (t * orbitalSpeed)
    const currentRadius = baseRadius + Math.sin(t * waveSpeed) * waveAmplitude

    const x = Math.cos(currentAngle) * currentRadius
    const z = Math.sin(currentAngle) * currentRadius

    const futureAngle = startAngle + ((t + 0.05) * orbitalSpeed)
    const futureRadius = baseRadius + Math.sin((t + 0.05) * waveSpeed) * waveAmplitude

    const nextX = Math.cos(futureAngle) * futureRadius
    const nextZ = Math.sin(futureAngle) * futureRadius

    groupRef.current.position.set(x, groundHeight, z)
    groupRef.current.lookAt(nextX, groundHeight, nextZ)
  })

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  )
}

export default function SkatingPenguins() {
  // --- ADJUSTED TUNING ---
  // Pushed much further down to counteract the GLB origin offset
  const groundHeight = -70.0 
  
  // Increased size to make them clearly visible on the ice
  const penguinScale = 1.5   

  const skaterConfigs = [
    { 
      path: PENGUIN_PATHS[0], 
      baseRadius: 58.0,     
      orbitalSpeed: 1.,   
      waveSpeed: 4.5,      
      waveAmplitude: 1.2,  
      startAngle: 0 
    },
    { 
      path: PENGUIN_PATHS[1], 
      baseRadius: 54.0,    
      orbitalSpeed: 1.2, 
      waveSpeed: 3.6, 
      waveAmplitude: 3, 
      startAngle: Math.PI / 2 
    },
    { 
      path: PENGUIN_PATHS[2], 
      baseRadius: 42.0,    
      orbitalSpeed: 1.1,  
      waveSpeed: 6.0, 
      waveAmplitude: 1.2, 
      startAngle: Math.PI 
    },
    { 
      path: PENGUIN_PATHS[3], 
      baseRadius: 48,    
      orbitalSpeed: 0.9,  
      waveSpeed: 2.4, 
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
          scale={penguinScale}
        />
      ))}
    </group>
  )
}