import React, { useRef } from 'react'
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

  // Total time one gift lives before teleporting back to the train (shortened to 5 seconds)
  const cycleDuration = 5.0
  
  // Stagger each gift's spawn time so they drop one by one
  const phaseOffset = index * 1.5 
  
  useFrame((state) => {
    const elapsedTime = state.clock.getElapsedTime()
    
    // Find the exact moment this specific gift spawned
    const localTime = elapsedTime + phaseOffset
    const cycleNumber = Math.floor(localTime / cycleDuration)
    const spawnTime = (cycleNumber * cycleDuration) - phaseOffset
    
    // Calculate the train's angle at that exact frozen moment
    const trainAngleAtSpawn = (spawnTime * trainSpeed * direction) + angleOffset
    
    // Lock X and Z coordinates
    const fixedX = -Math.cos(trainAngleAtSpawn) * trainRadius
    const fixedZ = Math.sin(trainAngleAtSpawn) * trainRadius
    
    const trainY = 55.0 // Height of the train
    const bottomY = -30.0 // Far below the ground so they fall straight through
    
    const currentCycleTime = localTime % cycleDuration
    
    let y = trainY
    let scaleFactor = 8

    if (currentCycleTime < 3.0) {
      // 1. FALLING: Drops continuously past the ground for 3 seconds
      const progress = currentCycleTime / 3.0
      const dropProgress = progress * progress // Accelerates like real gravity
      y = THREE.MathUtils.lerp(trainY, bottomY, dropProgress)
    } else {
      // 2. DISAPPEARING/RECYCLING: Waits invisibly before respawning at the top
      scaleFactor = 0.0
    }

    if (groupRef.current) {
      groupRef.current.position.set(fixedX, y, fixedZ)
      groupRef.current.rotation.y = -trainAngleAtSpawn + Math.PI / 2
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
  const ACTIVE_GIFTS = 12   

  const DIRECTION = 1.0 
  const ANGLE_OFFSET = Math.PI / 2  - .3

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