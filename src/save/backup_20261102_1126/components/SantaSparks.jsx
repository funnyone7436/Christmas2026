import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Helper function to generate a soft glowing dot for the sparks
function createGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const context = canvas.getContext('2d')
  
  // Create a radial gradient (white center, fading to yellow, then transparent)
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.3, 'rgba(255, 220, 100, 0.8)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  
  context.fillStyle = gradient
  context.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
}

export default function SantaSparks({ 
  radius = 15,       // How wide the circle is around the sleigh
  swoopHeight = 8,   // How high and low the trail dips
  spread = 2,        // How thick/scattered the dust cloud is
  count = 8000       // Number of sparks
}) {
  const pointsRef = useRef()

  // Generate the swirling path of particles once
  const [positions, colors, glowTexture] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    
    // Colors matching the reference image
    const colorWhite = new THREE.Color('#ffffff')
    const colorGold = new THREE.Color('#ffcc55')

    for (let i = 0; i < count; i++) {
      const t = i / count
      
      // Multiply by Math.PI * 2 * loops to make it wrap around multiple times
      const angle = t * Math.PI * 2 * 3 

      // Create the base swirling shape with random scattering
      const currentRadius = radius + (Math.random() - 0.5) * spread
      
      // X and Z create the flat circle, Y creates the dipping/rising motion
      const x = Math.cos(angle) * currentRadius
      const z = Math.sin(angle) * currentRadius * 0.4 // Squished depth so it looks better on camera
      const y = Math.sin(angle) * swoopHeight + (Math.random() - 0.5) * spread

      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z

      // Randomly mix white and yellow for each spark
      const mixedColor = colorWhite.clone().lerp(colorGold, Math.random())
      col[i * 3] = mixedColor.r
      col[i * 3 + 1] = mixedColor.g
      col[i * 3 + 2] = mixedColor.b
    }
    
    return [pos, col, createGlowTexture()]
  }, [count, radius, swoopHeight, spread])

  // Animate the entire swirl group to make the dust feel alive
  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y -= delta * 0.4
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.6}
        vertexColors={true}
        transparent={true}
        opacity={0.8}
        map={glowTexture}
        blending={THREE.AdditiveBlending} // This makes overlapping points glow intensely
        depthWrite={false} // Prevents the transparent edges from hiding objects behind them
      />
    </points>
  )
}