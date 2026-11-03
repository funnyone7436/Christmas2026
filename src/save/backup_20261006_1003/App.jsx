import React, { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

import ChristmasBackground from './components/ChristmasBackground'
import CameraOrbitController from './components/CameraController'
import StarburstTopper from './components/StarburstTopper'
// 1. Import the pose detector
import PoseMotionValueDetector from './components/PoseMotionValueDetector'

export default function App() {
  // 2. Create a reference to hold the current pose data without forcing React to re-render
  const poseLandmarksRef = useRef(null)

  // 3. Callback function that extracts the 2D landmarks whenever Kalidokit updates
  const handlePoseUpdate = (riggedPose) => {
    if (riggedPose && riggedPose.raw2DLandmarks) {
      poseLandmarksRef.current = riggedPose.raw2DLandmarks
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black' }}>
      
      {/* 4. Place the detector OUTSIDE the Canvas. Set debug={true} to see your webcam */}
      <PoseMotionValueDetector onPoseUpdate={handlePoseUpdate} debug={true} />

      <Canvas camera={{ position: [0, -0.03, 0.1] }}>
        <Suspense fallback={null}>
          
          <CameraOrbitController 
            isAutoMode={true} 
            radius={180} 
            height={-50}
            targetY={-40} 
            // 5. Pass the live data reference into the camera controller
            poseLandmarksRef={poseLandmarksRef} 
          />
		  
		  
          
          <ChristmasBackground />
          <StarburstTopper position={[0, 8, 0]} />

          <EffectComposer disableNormalPass>
            <Bloom 
              luminanceThreshold={1.0} 
              mipmapBlur={true}        
              intensity={0.6}          
            />
          </EffectComposer>

        </Suspense>
      </Canvas>
    </div>
  )
}