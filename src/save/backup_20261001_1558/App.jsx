import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
// 1. Import the post-processing components
import { EffectComposer, Bloom } from '@react-three/postprocessing'

import ChristmasBackground from './components/ChristmasBackground'
import CameraOrbitController from './components/CameraController'
import StarburstTopper from './components/StarburstTopper'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black' }}>
      <Canvas camera={{ position: [0, -0.03, 0.1] }}>
        <Suspense fallback={null}>
          
          <CameraOrbitController 
            isAutoMode={true} 
            radius={200} 
            height={-16}  
            targetY={-20} 
          />
          
          <ChristmasBackground />
          <StarburstTopper position={[0, 10, 0]} />

          {/* 2. Add the Bloom effect to your scene */}
          <EffectComposer disableNormalPass>
            <Bloom 
              luminanceThreshold={1.0} // Only glow objects with emission > 1
              mipmapBlur={true}        // Gives that soft, Eevee-style warm spread
              intensity={.6}          // Adjust this to make the glow stronger/weaker
            />
          </EffectComposer>

        </Suspense>
      </Canvas>
    </div>
  )
}