import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'

// Import your components
import ChristmasBackground from './components/ChristmasBackground'
import CameraOrbitController from './components/CameraController'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black' }}>
      <Canvas camera={{ position: [0, -0.03, 0.1] }}>
        <Suspense fallback={null}>
          
          {/* We set isAutoMode to false so you can use your Arrow Keys and Mouse! */}
          <CameraOrbitController isAutoMode={false} />
          
          <ChristmasBackground />

        </Suspense>
      </Canvas>
    </div>
  )
}