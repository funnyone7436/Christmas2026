import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// --- 1. FILE PATH SETUP ---
const START_INDEX = 189
const END_INDEX = 242

const GIFT_PATHS = Array.from(
  { length: (END_INDEX - START_INDEX) + 1 }, 
  (_, i) => `${import.meta.env.BASE_URL}glb/gifts/Tmpl_Round_Root_${START_INDEX + i}.glb`
)
// Preload all models into browser cache
GIFT_PATHS.forEach(path => useGLTF.preload(path))

// --- 2. SINGLE FALLING GIFT LOGIC ---
function FallingGift({ index, trainRadius, trainSpeed, angleOffset, direction }) {
  const groupRef = useRef()
  const giftPath = GIFT_PATHS[index % GIFT_PATHS.length]
  const { scene } = useGLTF(giftPath)

  // OPTIMIZATION 1: Clone the scene ONCE on mount, preventing expensive re-clones during re-renders
  const clonedScene = useMemo(() => scene.clone(), [scene])

  const cycleDuration = 6.0
  
  // Create unique, randomized physics
  const physics = useMemo(() => {
    const burstIndex = Math.floor(index / 4)
    const isSecondPoint = burstIndex % 2 !== 0
    const carAngleOffset = isSecondPoint ? -0.25 : 0 

    return {
      phaseOffset: burstIndex * 1.5 + (Math.random() * 0.3),
      carAngleOffset: carAngleOffset,
      
      upVelocity: 25 + Math.random() * 35,      
      xVelocity: (Math.random() - 0.5) * 25,    
      zVelocity: (Math.random() - 0.5) * 25,    
      
      initialRotX: Math.random() * Math.PI * 2,
      initialRotY: Math.random() * Math.PI * 2,
      initialRotZ: Math.random() * Math.PI * 2,
      spinSpeedX: (Math.random() - 0.5) * 6,
      spinSpeedY: (Math.random() - 0.5) * 6,
      spinSpeedZ: (Math.random() - 0.5) * 6,
    }
  }, [index])
  
  useFrame((state) => {
    if (!groupRef.current) return

    const elapsedTime = state.clock.getElapsedTime()
    const localTime = elapsedTime + physics.phaseOffset
    const cycleNumber = Math.floor(localTime / cycleDuration)
    const spawnTime = (cycleNumber * cycleDuration) - physics.phaseOffset
    
    const trainAngleAtSpawn = (spawnTime * trainSpeed * direction) + angleOffset + physics.carAngleOffset
    const trainBaseX = -Math.cos(trainAngleAtSpawn) * trainRadius
    const trainBaseZ = Math.sin(trainAngleAtSpawn) * trainRadius
    const trainY = 70.0 
    
    const currentCycleTime = localTime % cycleDuration
    const t = currentCycleTime

    // Using highly optimized stack-allocated variables for math (no "new THREE.Vector3()" in the loop)
    if (t < 4.0) {
      // Falling and tumbling state
      const y = trainY + (physics.upVelocity * t) - (0.5 * 60 * t * t)
      const x = trainBaseX + (physics.xVelocity * t)
      const z = trainBaseZ + (physics.zVelocity * t)

      groupRef.current.position.set(x, y, z)
      groupRef.current.rotation.set(
        physics.initialRotX + (physics.spinSpeedX * t),
        physics.initialRotY + (physics.spinSpeedY * t),
        physics.initialRotZ + (physics.spinSpeedZ * t)
      )
      
      // OPTIMIZATION 2: Re-enable visibility and maintain scale
      groupRef.current.scale.setScalar(8)
      if (!groupRef.current.visible) groupRef.current.visible = true

    } else {
      // OPTIMIZATION 2: Instead of setting scale to 0, completely cull it from the GPU render step
      if (groupRef.current.visible) {
        groupRef.current.visible = false
      }
    }
  })

  return (
    <group 
      ref={groupRef} 
      onClick={(e) => {
        e.stopPropagation()
        console.log("Clicked box file:", giftPath)
      }}
    >
      <primitive object={clonedScene} />
    </group>
  )
}

// --- 3. MAIN COMPONENT ---
export default function CircularGifts() {
  const trainRadius = 209   
  const trainSpeed = 0.15   
  const ACTIVE_GIFTS = 24   

  const DIRECTION = 1.0 
  const ANGLE_OFFSET = Math.PI / 2 - 0.14

  return (
    <group>
      {Array.from({ length: ACTIVE_GIFTS }).map((_, i) => (
        <FallingGift 
          key={i} 
          index={i} 
          trainRadius={trainRadius} 
          trainSpeed={trainSpeed} 
          angleOffset={ANGLE_OFFSET}
          direction={DIRECTION}
        />
      ))}
    </group>
  )
}