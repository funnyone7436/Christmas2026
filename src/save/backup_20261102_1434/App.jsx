import React, { Suspense, useRef, useEffect, useState, useMemo } from 'react'
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
  const [isPlaying, setIsPlaying] = useState(false)

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

  const handleStartMusic = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5
      audioRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(error => {
        console.log("Audio playback failed:", error)
      })
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black', position: 'relative' }}>
      
      {/* 🎵 Start Music & Experience Overlay Button */}
      {/* 🎵 Transparent Start Music Overlay */}
      {!isPlaying && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'transparent',
          zIndex: 99999,
          pointerEvents: 'auto',
          fontFamily: 'sans-serif'
        }}>
          {/* Christmas Title Above Center */}
          <div style={{
            position: 'absolute',
            top: '38%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'white'
          }}>
            <h1 style={{ 
              margin: 0,
              fontSize: '36px', 
              letterSpacing: '3px',
              color: '#00ffd5',
              textShadow: '0 0 20px rgba(0,255,213,0.8)' 
            }}>
              🎄 Christmas 🎄
            </h1>
            <p style={{ margin: '8px 0 0 0', color: '#ddd', fontSize: '13px', textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
              Click below to start background music and enter the 3D world
            </p>
          </div>

          {/* Small Button Below Center */}
          <button
            onClick={handleStartMusic}
            style={{
              position: 'absolute',
              top: '58%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              padding: '8px 20px',
              backgroundColor: '#00ffd5',
              color: '#000',
              border: 'none',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,255,213,0.4)',
              transition: 'transform 0.2s, background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translate(-50%, -50%) scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'translate(-50%, -50%) scale(1)'}
          >
            ▶ Play Music & Start
          </button>
        </div>
      )}

      <audio 
        ref={audioRef} 
        src={`${import.meta.env.BASE_URL}sound/christmas-music.mp3`} 
        loop={true} 
        preload="auto" 
      />

      {/* Hidden Pose Detector updating the shared ref */}
      <PoseMotionValueDetector onPoseUpdate={handlePoseUpdate} debug={false} />

      <Canvas 
        dpr={[1, 2]} 
        gl={{ 
          powerPreference: 'high-performance', 
          antialias: true 
        }}
        camera={{ position: [0, -0.03, 0.1], far: 2000 }}
      >
        <Suspense fallback={null}>
          
          <CameraOrbitController 
            isAutoMode={true}
            poseLandmarksRef={poseLandmarksRef}
            presetsList={presetsList}
            isLoopingStates={true}
            baseSpeed={0.3}
          />

          {/* Crisp lighting for 3D gifts & penguins without slowing down GPU */}
          <ambientLight intensity={0.7} />
          <directionalLight position={[50, 120, 60]} intensity={1.4} />
          
          <ChristmasBackground />
          <CircularGifts />
          <SkatingPenguins />
          <StarburstTopper position={[0, 10, 0]} />

          {/* Multisampling=4 fixes jagged edges; higher threshold stops snow/houses from blurring */}
          <EffectComposer disableNormalPass multisampling={4}>
            <Bloom 
              luminanceThreshold={1.25} 
              mipmapBlur={true}        
              intensity={0.4}          
            />
          </EffectComposer>

        </Suspense>
      </Canvas>
    </div>
  )
}