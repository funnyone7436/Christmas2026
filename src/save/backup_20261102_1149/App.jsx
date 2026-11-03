import React, { Suspense, useRef, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

import ChristmasBackground from './components/ChristmasBackground'
import SantaSparks from './components/SantaSparks'
import CameraOrbitController from './components/CameraController'
import StarburstTopper from './components/StarburstTopper'
import PoseMotionValueDetector from './components/PoseMotionValueDetector'
import CircularGifts from './components/CircularGifts'
import SkatingPenguins from './components/SkatingPenguins'

// 🎥 Updated camera presets based on your screenshot settings
const CAMERA_PRESETS = {
  init:     { radius: 90.82,  height: -42.5,  targetY: -40, duration: 12.0, waveSize: 16, waveSpeed: 1.6 },
  playing:  { radius: 123.54, height: -25.6,  targetY: -40, duration: 10.0, waveSize: 24, waveSpeed: 1.0 },
  playing1: { radius: 186.22, height: 82.39,  targetY: -40, duration: 14.0, waveSize: 46, waveSpeed: 0.5 },
  playing2: { radius: 253.33, height: 164.21, targetY: -40, duration: 16.0, waveSize: 40, waveSpeed: 1.0 },
  playing3: { radius: 111.02, height: 180,    targetY: -40, duration: 12.0, waveSize: 25, waveSpeed: 0.6 },
  playing4: { radius: 10.0,   height: 180,    targetY: -40, duration: 17.0, waveSize: 8,  waveSpeed: 0.4 },
};

export default function App() {
  const poseLandmarksRef = useRef(null)
  const audioRef = useRef(null)

  // Convert presets object into an ordered array for the controller loop
  const presetsList = useMemo(() => {
    return Object.entries(CAMERA_PRESETS).map(([name, cfg]) => ({
      name,
      ...cfg
    }))
  }, [])

  const handlePoseUpdate = (riggedPose) => {
    if (riggedPose && riggedPose.raw2DLandmarks) {
      poseLandmarksRef.current = riggedPose.raw2DLandmarks
    }
  }

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5
      audioRef.current.play().catch(error => {
        console.log("Audio autoplay blocked by browser policy. Click anywhere to play.", error)
      })
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black', position: 'relative' }}>
      
      <audio 
        ref={audioRef} 
        src={`${import.meta.env.BASE_URL}sound/Happy Christmas Background Music For Videos.mp3`} 
        loop={true} 
        preload="auto" 
      />

      {/* Hidden Pose Detector updating the shared ref */}
      <PoseMotionValueDetector onPoseUpdate={handlePoseUpdate} debug={false} />

      <Canvas 
        dpr={[1, 1.5]} 
        gl={{ powerPreference: 'high-performance', antialias: false }}
        camera={{ position: [0, -0.03, 0.1] }}
      >
        <Suspense fallback={null}>
          
          <CameraOrbitController 
            isAutoMode={true}
            poseLandmarksRef={poseLandmarksRef}
            presetsList={presetsList}
            isLoopingStates={true}
            baseSpeed={0.3}
          />
          
          <ChristmasBackground />
          <CircularGifts />
          <SkatingPenguins />
          <StarburstTopper position={[0, 10, 0]} />

          <EffectComposer disableNormalPass multisampling={0}>
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