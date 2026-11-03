import React, { useRef } from 'react'
import { useLoader, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function ChristmasBackground() {
  // 1. Reference for the train mesh so we can rotate it every frame
  const trainRef = useRef()

  // Spin speed (adjust positive or negative to change direction/speed)
  const trainSpeed = 0.15 

  useFrame((state, delta) => {
    if (trainRef.current) {
      trainRef.current.rotation.y += trainSpeed * delta
    }
  })

  // Static background layers (Train, Moon, and Stars separated out)
  const layers = [
    // 1. GROUND (Absolute background)
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_BG_1200.png`, radius: 219, visible: true },
    
  ]

  // Train texture loaded alongside the others
  const allPaths = [
    ...layers.map(l => l.path),
    `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Train_1200.png`
  ]

  const textures = useLoader(THREE.TextureLoader, allPaths)
  
  textures.forEach(texture => {
    texture.colorSpace = THREE.SRGBColorSpace 
  })

  // Separate the textures based on index
  const trainTexture = textures[textures.length - 1]
  const backgroundTextures = textures.slice(0, textures.length - 1)

  return (
    <group>
      <ambientLight intensity={2} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} />

      {/* Render all static background layers */}
      {backgroundTextures.map((texture, index) => {
        return (
          <mesh 
            key={index} 
            scale={[-1, 1, 1]} 
            rotation={[0, Math.PI / 2, 0]}
            renderOrder={index} 
            visible={layers[index].visible} 
          >
            <sphereGeometry args={[layers[index].radius, 32, 32]} />
            <meshBasicMaterial 
              map={texture} 
              side={THREE.BackSide} 
              toneMapped={false} 
              transparent={true} 
              depthWrite={false} 
            />
          </mesh>
        )
      })}

      {/* Render the spinning train layer separately */}
      <mesh 
        ref={trainRef}
        scale={[-1, 1, 1]} 
        rotation={[0, Math.PI / 2, 0]}
        renderOrder={99} 
      >
        <sphereGeometry args={[209, 32, 32]} />
        <meshBasicMaterial 
          map={trainTexture} 
          side={THREE.BackSide} 
          toneMapped={false} 
          transparent={true} 
          depthWrite={false} 
        />
      </mesh>
    </group>
  )
}