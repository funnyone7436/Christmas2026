import React, { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

import ChristmasBackground from './components/ChristmasBackground'
import Aurora from './components/Aurora'
import SantaSparks from './components/SantaSparks'
import CameraOrbitController from './components/CameraController'
import StarburstTopper from './components/StarburstTopper'
import PoseMotionValueDetector from './components/PoseMotionValueDetector'
import CircularGifts from './components/CircularGifts'
import SkatingPenguins from './components/SkatingPenguins'

export default function App() {
  const poseLandmarksRef = useRef(null)
  const audioRef = useRef(null)

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

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black', position: 'relative' }}>
      
      {/* 🎥 CAMERA POSITION RECORDER UI OVERLAY */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        backgroundColor: 'rgba(20, 20, 30, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '16px',
        borderRadius: '12px',
        color: 'white',
        width: '300px',
        fontFamily: 'sans-serif',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#00ffd5' }}>🎥 Camera Position Recorder</h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input 
            type="text" 
            placeholder="Enter view name..." 
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #444',
              backgroundColor: '#111',
              color: 'white',
              fontSize: '13px'
            }}
          />
          <button 
            onClick={handleSaveView}
            style={{
              padding: '6px 12px',
              backgroundColor: '#00ffd5',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Save
          </button>
        </div>

        <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
          {savedPresets.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>No saved views yet. Move around with mouse/arrows and save!</p>
          ) : (
            savedPresets.map((p, idx) => (
              <div key={idx} style={{ 
                backgroundColor: 'rgba(255,255,255,0.05)', 
                padding: '8px', 
                borderRadius: '6px', 
                marginBottom: '6px',
                fontSize: '11px'
              }}>
                <strong style={{ color: '#ffcc55' }}>{p.name}</strong>
                <div>radius={p.radius}, height={p.height}, targetY={p.targetY}</div>
              </div>
            ))
          )}
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
            isAutoMode={false} 
            radius={180} 
            height={-50}
            targetY={-40} 
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