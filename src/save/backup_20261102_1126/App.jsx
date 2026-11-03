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

// 🎥 Each circle now has its own independent duration, waveSize, and waveSpeed!
const INITIAL_CAMERA_PRESETS = {
  init:     { radius: 90.82,  height: -42.5,  targetY: -40, duration: 8.0,  waveSize: 5,  waveSpeed: 1.2 },
  playing:  { radius: 123.54, height: -25.6,  targetY: -40, duration: 10.0, waveSize: 12, waveSpeed: 1.5 },
  playing1: { radius: 186.22, height: 82.39,  targetY: -40, duration: 14.0, waveSize: 25, waveSpeed: 2.0 },
  playing2: { radius: 253.33, height: 164.21, targetY: -40, duration: 16.0, waveSize: 32, waveSpeed: 2.3 },
  playing3: { radius: 111.02, height: 180,    targetY: -40, duration: 12.0, waveSize: 18, waveSpeed: 1.8 },
  playing4: { radius: 10,     height: 180,    targetY: -40, duration: 8.0,  waveSize: 6,  waveSpeed: 1.0 },
};

export default function App() {
  const poseLandmarksRef = useRef(null)
  const audioRef = useRef(null)

  // Store all presets in state so each circle's settings can be customized independently
  const [presets, setPresets] = useState(INITIAL_CAMERA_PRESETS)
  const [activePreset, setActivePreset] = useState('init')
  const [isLoopingStates, setIsLoopingStates] = useState(true)
  const [copiedMsg, setCopiedMsg] = useState(false)

  const [presetName, setPresetName] = useState('')
  const captureFnRef = useRef(null)

  // Convert presets object into an ordered array for the controller loop
  const presetsList = useMemo(() => {
    return Object.entries(presets).map(([name, cfg]) => ({
      name,
      ...cfg
    }))
  }, [presets])

  // Helper to update a setting for ONLY the currently selected circle
  const updateActiveCircleSetting = (field, value) => {
    setPresets(prev => ({
      ...prev,
      [activePreset]: {
        ...prev[activePreset],
        [field]: value
      }
    }))
  }

  // Copy all customized per-circle configs to clipboard so you can paste into code
  const handleCopyConfigs = () => {
    const formatted = `const INITIAL_CAMERA_PRESETS = ${JSON.stringify(presets, null, 2)};`
    navigator.clipboard.writeText(formatted)
    console.log("📋 Copied Per-Circle Presets:\n", formatted)
    setCopiedMsg(true)
    setTimeout(() => setCopiedMsg(false), 2000)
  }

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
    const keyName = presetName.trim() || `custom_${Object.keys(presets).length + 1}`

    setPresets(prev => ({
      ...prev,
      [keyName]: data
    }))
    setActivePreset(keyName)
    setPresetName('')
  }

  const currentCamConfig = presets[activePreset]

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black', position: 'relative' }}>
      
      {/* 🎥 PER-CIRCLE CAMERA SETTINGS OVERLAY */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        backgroundColor: 'rgba(20, 20, 30, 0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '14px',
        borderRadius: '12px',
        color: 'white',
        width: '300px',
        fontFamily: 'sans-serif',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        maxHeight: '92vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: '#00ffd5' }}>🎥 Camera Circles</h3>
          <button
            onClick={handleCopyConfigs}
            style={{
              padding: '4px 8px',
              backgroundColor: copiedMsg ? '#4caf50' : 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            {copiedMsg ? '✅ Copied!' : '📋 Copy Config'}
          </button>
        </div>
        
        {/* Toggle Auto-Loop Button */}
        <button
          onClick={() => setIsLoopingStates(!isLoopingStates)}
          style={{
            width: '100%',
            padding: '8px 12px',
            marginBottom: '10px',
            backgroundColor: isLoopingStates ? '#00ffd5' : '#333',
            color: isLoopingStates ? '#000' : '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {isLoopingStates ? '🔄 Auto-Looping All Circles' : '⏸️ Loop Paused (Editing Single Circle)'}
        </button>

        {/* Circle State Selection Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
          {Object.keys(presets).map((key) => {
            const p = presets[key]
            const isSelected = activePreset === key
            return (
              <button
                key={key}
                onClick={() => {
                  setIsLoopingStates(false) // Pause loop so you can tune this circle easily
                  setActivePreset(key)
                }}
                style={{
                  padding: '7px 10px',
                  backgroundColor: isSelected ? '#00ffd5' : 'rgba(255,255,255,0.08)',
                  color: isSelected ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '11px',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{key.toUpperCase()}</span>
                <span style={{ opacity: 0.85, fontSize: '10px', fontWeight: 'normal' }}>
                  R:{p.radius} | {p.duration}s | W:{p.waveSize}/{p.waveSpeed}
                </span>
              </button>
            )
          })}
        </div>

        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />

        {/* 🌊 Per-Circle Sliders (Edits ONLY activePreset) */}
        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#00ffd5' }}>
          🌊 Settings for: <span style={{ color: '#ffcc55', textTransform: 'uppercase' }}>{activePreset}</span>
        </h4>
        
        <div style={{ marginBottom: '10px', fontSize: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Radius Transition Duration:</span>
            <strong style={{ color: '#ffcc55' }}>{currentCamConfig.duration}s</strong>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="0.5"
            value={currentCamConfig.duration}
            onChange={(e) => updateActiveCircleSetting('duration', parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

        <div style={{ marginBottom: '10px', fontSize: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Up/Down Wave Size:</span>
            <strong style={{ color: '#ffcc55' }}>{currentCamConfig.waveSize}</strong>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="1"
            value={currentCamConfig.waveSize}
            onChange={(e) => updateActiveCircleSetting('waveSize', parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

        <div style={{ marginBottom: '10px', fontSize: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Wave Speed:</span>
            <strong style={{ color: '#ffcc55' }}>{currentCamConfig.waveSpeed}</strong>
          </div>
          <input
            type="range"
            min="0.1"
            max="5.0"
            step="0.1"
            value={currentCamConfig.waveSpeed}
            onChange={(e) => updateActiveCircleSetting('waveSpeed', parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />

        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#ffcc55' }}>Add New Circle State</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="New circle name..." 
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
            Add
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

      <Canvas 
        dpr={[1, 1.5]} 
        gl={{ powerPreference: 'high-performance', antialias: false }}
        camera={{ position: [0, -0.03, 0.1] }}
      >
        <Suspense fallback={null}>
          
          <CameraOrbitController 
            isAutoMode={true}
            poseLandmarksRef={poseLandmarksRef}
            currentPreset={currentCamConfig}
            presetsList={presetsList}
            isLoopingStates={isLoopingStates}
            baseSpeed={0.3}
            onActiveStateChange={(stateName) => setActivePreset(stateName)}
            onRegisterCapture={(fn) => { captureFnRef.current = fn; }}
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