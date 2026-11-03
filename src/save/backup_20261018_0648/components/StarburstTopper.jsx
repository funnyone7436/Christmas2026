// In StarburstTopper.jsx
import React from 'react'
import { useGLTF } from '@react-three/drei'

export default function StarburstTopper(props) {
  const { scene } = useGLTF('/glb/Starburst_Topper.glb')
  
  return (
    <primitive 
      object={scene} 
      // Removed the hardcoded position from here!
      scale={6} 
      {...props} 
    />
  )
}

useGLTF.preload('/glb/Starburst_Topper.glb')