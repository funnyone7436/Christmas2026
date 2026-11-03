import React from 'react'
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'

export default function ChristmasBackground() {
  
const layers = [
    // 1. GROUND (Absolute background)
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Ground_1200.png`, radius: 200, visible: true },
    
// 2. RINGS (Ordered from back to front)
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Rolling_Ring_5.png`, radius: 218, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Rolling_Ring_4.png`, radius: 216, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Rolling_Ring_3.png`, radius: 214, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Rolling_Ring_2.png`, radius: 212, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Rolling_Ring_1.png`, radius: 210, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Train_1200.png`, radius: 209, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Moon_1200.png`, radius: 209.5, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Stars_1200.png`, radius: 218.2, visible: true },

    // 3. FORESTS (Paints on top of the rings)
    // Forest 3 is below Ring 1, meaning it will paint OVER Ring 1
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Forest3_1200.png`, radius: 190, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_House4_1200.png`,  radius: 189.5, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Forest2_1200.png`, radius: 189, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_Forest1_1200.png`, radius: 188, visible: true },
    
    // 4. HOUSES (Paints on top of everything else)
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_House3_1200.png`, radius: 196, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_House2_1200.png`, radius: 193, visible: true },
    { path: `${import.meta.env.BASE_URL}images/frame_8k_Christmas_House1_1200.png`, radius: 190, visible: true },
  ]

  // 2. Extract just the paths so Three.js can load them all at once
  const imagePaths = layers.map(layer => layer.path)
  const textures = useLoader(THREE.TextureLoader, imagePaths)
  
  // 3. Ensure colors display correctly
  textures.forEach(texture => {
    texture.colorSpace = THREE.SRGBColorSpace 
  })

  return (
    <group>
      <ambientLight intensity={2} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} />

      {textures.map((texture, index) => {
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
    </group>
  )
}