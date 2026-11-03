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
GIFT_PATHS.forEach(path => useGLTF.preload(path))

// --- 2. SINGLE FALLING GIFT LOGIC ---
function FallingGift({ index, trainRadius, trainSpeed, angleOffset, direction }) {
  const groupRef = useRef()
  const giftPath = GIFT_PATHS[index % GIFT_PATHS.length]
  const { scene } = useGLTF(giftPath)

  const cycleDuration = 6.0
  
  // Create unique, randomized physics for every single gift
  const physics = useMemo(() => ({
    // Group gifts into bursts of 4 by clustering their spawn times, adding a tiny random jitter
    phaseOffset: Math.floor(index / 4) * 1.5 + (Math.random() * 0.3),
    
    // Jump and Explosion physics
    upVelocity: 25 + Math.random() * 35,      // How high it pops up into the air
    xVelocity: (Math.random() - 0.5) * 25,    // Explodes left/right from the train
    zVelocity: (Math.random() - 0.5) * 25,    // Explodes forward/backward
    
    // Tumbling rotation
    initialRotX: Math.random() * Math.PI * 2,
    initialRotY: Math.random() * Math.PI * 2,
    initialRotZ: Math.random() * Math.PI * 2,
    spinSpeedX: (Math.random() - 0.5) * 6,
    spinSpeedY: (Math.random() - 0.5) * 6,
    spinSpeedZ: (Math.random() - 0.5) * 6,
  }), [index])
  
  useFrame((state) => {
    const elapsedTime = state.clock.getElapsedTime()
    
    // Find the exact moment this burst spawned
    const localTime = elapsedTime + physics.phaseOffset
    const cycleNumber = Math.floor(localTime / cycleDuration)
    const spawnTime = (cycleNumber * cycleDuration) - physics.phaseOffset
    
    // Lock base coordinates to the train's position at spawn
    const trainAngleAtSpawn = (spawnTime * trainSpeed * direction) + angleOffset
    const trainBaseX = -Math.cos(trainAngleAtSpawn) * trainRadius
    const trainBaseZ = Math.sin(trainAngleAtSpawn) * trainRadius
    const trainY = 70.0 
    
    const currentCycleTime = localTime % cycleDuration
    
    let x = trainBaseX
    let y = trainY
    let z = trainBaseZ
    let scaleFactor = 8

    // Time variable for physics equation
    const t = currentCycleTime

    if (t < 4.0) {
      // 1. DYNAMIC JUMP & FALL (Parabolic Gravity Curve)
      // y = Starting Height + (Upward Pop * time) - (Gravity * time^2)
      y = trainY + (physics.upVelocity * t) - (0.5 * 60 * t * t)
      
      // Drift outward based on explosion velocity
      x = trainBaseX + (physics.xVelocity * t)
      z = trainBaseZ + (physics.zVelocity * t)

      // Apply wild tumbling rotation while falling
      if (groupRef.current) {
        groupRef.current.rotation.x = physics.initialRotX + (physics.spinSpeedX * t)
        groupRef.current.rotation.y = physics.initialRotY + (physics.spinSpeedY * t)
        groupRef.current.rotation.z = physics.initialRotZ + (physics.spinSpeedZ * t)
      }
    } else {
      // 2. DISAPPEAR
      scaleFactor = 0.0
    }

    if (groupRef.current) {
      groupRef.current.position.set(x, y, z)
      groupRef.current.scale.setScalar(scaleFactor)
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
      <primitive object={scene.clone()} />
    </group>
  )
}

// --- 3. MAIN COMPONENT ---
export default function CircularGifts() {
  const trainRadius = 209   
  const trainSpeed = 0.15   
  
  // Increased total gifts so the bursts feel dense and chaotic
  const ACTIVE_GIFTS = 12   

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