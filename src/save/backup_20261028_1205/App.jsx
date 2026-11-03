import React, { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

import ChristmasBackground from './components/ChristmasBackground'
import SantaSparks from './components/SantaSparks'
import CameraOrbitController from './components/CameraController'
import StarburstTopper from './components/StarburstTopper'
import PoseMotionValueDetector from './components/PoseMotionValueDetector'
import CircularGifts from './components/CircularGifts'
import SkatingPenguins from './components/SkatingPenguins'

// 🎥 Define your 5 camera presets
const CAMERA_PRESETS = {
  init:     { radius: 90.82,  height: -42.5,  targetY: -40 },
  playing:  { radius: 123.54, height: -25.6,  targetY: -40 },
  playing1: { radius: 186.22, height: 82.39,  targetY: -40 },
  playing2: { radius: 253.33, height: 164.21, targetY: -40 },
  playing3: { radius: 111.02, height: 162.63, targetY: -40 },
};

export default function App() {
  const poseLandmarksRef = useRef(null)
  const audioRef = useRef(null)

  // State to track current active camera mode (defaults to 'init')
  const [activePreset, setActivePreset] = useState('init')

  const [presetName, setPresetName] = useState('')
  const [savedPresets, setSavedPresets] = useState([])
  const captureFnRef = useRef(null)

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

  const handleSaveView = () => {
    if (!captureFnRef.current) return
    const data = captureFnRef.current()
    const name = presetName.trim() || `View ${savedPresets.length + 1}`

    const newPreset = { name, ...data }
    setSavedPresets(prev => [...prev, newPreset])
    setPresetName('')
  }

  const currentCamConfig = CAMERA_PRESETS[activePreset]

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black', position: 'relative' }}>
      
      {/* 🎥 CAMERA PRESET & RECORDER UI OVERLAY */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        backgroundColor: 'rgba(20, 20, 30, 0.9)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '16px',
        borderRadius: '12px',
        color: 'white',
        width: '280px',
        fontFamily: 'sans-serif',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#00ffd5' }}>🎥 Camera States</h3>
        
        {/* Preset Selection Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
          {Object.keys(CAMERA_PRESETS).map((key) => (
            <button
              key={key}
              onClick={() => setActivePreset(key)}
              style={{
                padding: '8px 12px',
                backgroundColor: activePreset === key ? '#00ffd5' : 'rgba(255,255,255,0.1)',
                color: activePreset === key ? '#000' : '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                transition: 'background 0.2s'
              }}
            >
              <span>{key.toUpperCase()}</span>
              <span style={{ opacity: 0.7, fontSize: '10px' }}>R: {CAMERA_PRESETS[key].radius}</span>
            </button>
          ))}
        </div>

        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />

        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#ffcc55' }}>Custom Recorder</h4>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <input 
            type="text" 
            placeholder="View name..." 
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid #444',
              backgroundColor: '#111',
              color: 'white',
              fontSize: '12px'
            }}
          />
          <button 
            onClick={handleSaveView}
            style={{
              padding: '6px 10px',
              backgroundColor: '#ffcc55',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Save
          </button>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        src={`${import.meta.env.BASE_URL}sound/Happy Christmas Background Music For Videos.mp3`} 
        loop={true} 
        preload="auto" 
      />

      <PoseMotionValueDetector onPoseUpdate={handlePoseUpdate} debug={true} />

      <Canvas camera={{ position: [0, -0.03, 0.1] }}>
        <Suspense fallback={null}>
          
          <CameraOrbitController 
            isAutoMode={true} // Set to true so it actively circles around the target
            radius={currentCamConfig.radius} 
            height={currentCamConfig.height}
            targetY={currentCamConfig.targetY} 
            baseSpeed={0.3}
            onRegisterCapture={(fn) => { captureFnRef.current = fn; }}
          />
          
          <ChristmasBackground />
          <CircularGifts />
          <SkatingPenguins />
          <StarburstTopper position={[0, 10, 0]} />

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