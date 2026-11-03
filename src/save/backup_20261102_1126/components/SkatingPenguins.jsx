import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// --- 1. PRELOAD ASSETS ---
const PENGUIN_PATHS = [
  `${import.meta.env.BASE_URL}glb/True_3D_Penguin_Root.glb`,
  `${import.meta.env.BASE_URL}glb/True_3D_Penguin_Root.001.glb`,
  `${import.meta.env.BASE_URL}glb/True_3D_Penguin_Root.002.glb`,
  `${import.meta.env.BASE_URL}glb/True_3D_Penguin_Root.003.glb`
]

PENGUIN_PATHS.forEach(path => useGLTF.preload(path))

// --- 2. SINGLE SKATER LOGIC ---
function SingleSkater({ 
  path, baseRadius, orbitalSpeed, waveSpeed, waveAmplitude, 
  startAngle, groundHeight, scale, 
  canJump, jumpInterval, jumpOffset, jumpHeight, jumpDuration 
}) {
  const groupRef = useRef()
  const { scene } = useGLTF(path)
  
  const clonedScene = useMemo(() => scene.clone(), [scene])

  useFrame((state) => {
    if (!groupRef.current) return
    
    const t = state.clock.getElapsedTime()

    // 1. Calculate X and Z (Skating Path)
    const currentAngle = startAngle + (t * orbitalSpeed)
    const currentRadius = baseRadius + Math.sin(t * waveSpeed) * waveAmplitude

    const x = Math.cos(currentAngle) * currentRadius
    const z = Math.sin(currentAngle) * currentRadius

    // 2. Calculate Y (Jumping Logic)
    let y = groundHeight
    if (canJump) {
      // Create a repeating loop based on this penguin's unique jump interval
      const cycleTime = (t + jumpOffset) % jumpInterval
      
      // If we are within the jump duration window, calculate the height
      if (cycleTime < jumpDuration) {
        // Use a half sine-wave (0 to PI) to create a perfectly smooth up-and-down jump
        const jumpProgress = cycleTime / jumpDuration
        y = groundHeight + Math.sin(jumpProgress * Math.PI) * jumpHeight
      }
    }

    // 3. Calculate Future Position for Steering
    const futureAngle = startAngle + ((t + 0.05) * orbitalSpeed)
    const futureRadius = baseRadius + Math.sin((t + 0.05) * waveSpeed) * waveAmplitude

    const nextX = Math.cos(futureAngle) * futureRadius
    const nextZ = Math.sin(futureAngle) * futureRadius

    // Apply Position and Rotation
    groupRef.current.position.set(x, y, z)
    // We use 'y' for the lookAt height so the penguin stays level and doesn't tilt downward while in the air
    groupRef.current.lookAt(nextX, y, nextZ)
  })

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  )
}

// --- 3. MAIN COMPONENT ---
export default function SkatingPenguins() {
  const TOTAL_PENGUINS = 18     
  const groundHeight = -76.0    
  
  const minRadius = 40.0        
  const maxRadius = 100.0       
  const baseScale = 1.5         

  const skaterConfigs = useMemo(() => {
    return Array.from({ length: TOTAL_PENGUINS }).map(() => {
      
      const randomPath = PENGUIN_PATHS[Math.floor(Math.random() * PENGUIN_PATHS.length)]
      const randomSize = baseScale * (0.7 + Math.random() * 0.6)
      const randomRadius = minRadius + Math.random() * (maxRadius - minRadius)
      
      // DECREASED SPEEDS: Much slower and more relaxed skating
      const randomOrbitalSpeed = 0.15 + Math.random() * 0.25 
      const randomWaveSpeed = 1.6 + Math.random() * 1.5     
      const randomWaveAmplitude = 1.0 + Math.random() * 2.5 
      const randomStartAngle = Math.random() * Math.PI * 2
      
      // JUMP SETTINGS
      // Roughly 50% of the penguins will be "jumpers"
      const isJumper = Math.random() > 0.8 
      const randomJumpInterval = 8.0 + Math.random() * 5.0 // Jumps every 5 to 10 seconds
      const randomJumpOffset = Math.random() * 10.0        // Staggers when they jump so it isn't simultaneous
      const randomJumpHeight = 10.0 + Math.random() * 15.0 // How high they pop up
      const randomJumpDuration = 1.2 + Math.random() * 0.6 // Jump floatiness (1.2 to 1.8 seconds long)

      return {
        path: randomPath,
        scale: randomSize,
        baseRadius: randomRadius,
        orbitalSpeed: randomOrbitalSpeed, 
        waveSpeed: randomWaveSpeed,
        waveAmplitude: randomWaveAmplitude,
        startAngle: randomStartAngle,
        // Passing the new jump props
        canJump: isJumper,
        jumpInterval: randomJumpInterval,
        jumpOffset: randomJumpOffset,
        jumpHeight: randomJumpHeight,
        jumpDuration: randomJumpDuration
      }
    })
  }, [TOTAL_PENGUINS, baseScale]) 

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