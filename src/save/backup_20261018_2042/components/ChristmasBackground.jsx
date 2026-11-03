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
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Ground_1200.png`, radius: 200, visible: true },
    
    // 2. RINGS (Ordered from back to front)
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Rolling_Ring_5.png`, radius: 218, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Rolling_Ring_4.png`, radius: 216, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Rolling_Ring_3.png`, radius: 214, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Rolling_Ring_2.png`, radius: 212, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Rolling_Ring_1.png`, radius: 210, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Moon_1200.png`, radius: 209.5, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Stars_1200.png`, radius: 218.2, visible: true },
    // 3. FORESTS 
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Forest3_1200.png`, radius: 190, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_House4_1200.png`,  radius: 189.5, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Forest2_1200.png`, radius: 189, visible: true },	
	

    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_House3_1200.png`, radius: 196, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_House2_1200.png`, radius: 193, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_House1_1200.png`, radius: 190, visible: true },

    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Forest1_1200.png`, radius: 188, visible: true },
    
    // 4. HOUSES

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