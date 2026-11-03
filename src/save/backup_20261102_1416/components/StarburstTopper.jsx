// In StarburstTopper.jsx
import React from 'react'
import { useGLTF } from '@react-three/drei'

export default function StarburstTopper(props) {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}glb/Starburst_Topper.glb`)
  
  return (
    <primitive 
      object={scene} 
      scale={6} 
      {...props} 
    />
  )
}

useGLTF.preload(`${import.meta.env.BASE_URL}glb/Starburst_Topper.glb`)