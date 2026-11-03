import React from 'react'
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'

export default function ChristmasBackground() {
  // Load the single background texture based on your file explorer path
  const texture = useLoader(
    THREE.TextureLoader, 
    `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Ground_1200.png`
  )
  
  // Ensure colors display correctly
  texture.colorSpace = THREE.SRGBColorSpace 

  return (
    <group>
      <ambientLight intensity={2} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} />

      {/* Single background sphere surrounding the camera */}
      <mesh scale={[-1, 1, 1]} rotation={[0, Math.PI / 2, 0]}>
        <sphereGeometry args={[200, 32, 32]} />
        <meshBasicMaterial 
          map={texture} 
          side={THREE.BackSide} 
          toneMapped={false} 
        />
      </mesh>
    </group>
  )
}