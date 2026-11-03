import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three' 

const VERTICAL_SPEED = 0.01; 
const MANUAL_SPIN_SPEED = 0.02; 
const JUMP_SCALE = 0.2; 

const tempOffset = new THREE.Vector3()
const tempSpherical = new THREE.Spherical()

export default function CameraOrbitController({ 
  isAutoMode = true,
  poseLandmarksRef, 
  currentPreset,              // Active single preset object
  presetsList = [],           // Array of all presets with individual duration, waveSize, waveSpeed
  isLoopingStates = true,     
  baseSpeed = 0.3,
  onActiveStateChange,        
  onRegisterCapture 
}) {
  const { camera, gl } = useThree()
  const controlsRef = useRef()
  const keys = useRef({ ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false })

  const prevNoseY = useRef(null)
  const currentSpinSpeed = useRef(baseSpeed)
  const angleRef = useRef(0) 

  // Track current state index & local timer for variable-duration looping
  const stateIdxRef = useRef(0)
  const stateTimerRef = useRef(0)
  const wavePhaseRef = useRef(0)

  // Smoothed camera properties
  const smoothRadius = useRef(currentPreset?.radius ?? 90.82)
  const smoothHeight = useRef(currentPreset?.height ?? -42.5)
  const smoothTargetY = useRef(currentPreset?.targetY ?? -40)
  const smoothWaveSize = useRef(currentPreset?.waveSize ?? 12)
  const smoothWaveSpeed = useRef(currentPreset?.waveSpeed ?? 1.5)

  useEffect(() => {
    if (onRegisterCapture && controlsRef.current) {
      onRegisterCapture(() => {
        const controls = controlsRef.current;
        const currentRadius = camera.position.distanceTo(controls.target);
        const currentHeight = camera.position.y;
        const currentTargetY = controls.target.y;

        const snapshotData = {
          radius: parseFloat(currentRadius.toFixed(2)),
          height: parseFloat(currentHeight.toFixed(2)),
          targetY: parseFloat(currentTargetY.toFixed(2)),
          duration: currentPreset?.duration ?? 8.0,
          waveSize: currentPreset?.waveSize ?? 12.0,
          waveSpeed: currentPreset?.waveSpeed ?? 1.5,
        };
        
        console.log("📸 Camera Snapshot Captured:", snapshotData);
        return snapshotData;
      });
    }
  }, [onRegisterCapture, camera, controlsRef, currentPreset]);

  useEffect(() => {
    const handleKeyDown = (e) => { if (keys.current.hasOwnProperty(e.code)) keys.current[e.code] = true }
    const handleKeyUp = (e) => { if (keys.current.hasOwnProperty(e.code)) keys.current[e.code] = false }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((state, delta) => {
    const controls = controlsRef.current
    if (!controls) return

    if (isAutoMode) {
      controls.enabled = false;

      // 1. MediaPipe Jump Speed Bonus
      let jumpBonus = 0;
      if (poseLandmarksRef && poseLandmarksRef.current) {
        const nose = poseLandmarksRef.current[0]; 
        if (nose && nose.visibility > 0.5) {
          if (prevNoseY.current !== null) {
            const velocity = (prevNoseY.current - nose.y) / delta;
            if (velocity > 0) {
              jumpBonus = velocity * JUMP_SCALE;
            }
          }
          prevNoseY.current = nose.y; 
        } else {
          prevNoseY.current = null; 
        }
      }

      const targetSpeed = baseSpeed + jumpBonus;
      currentSpinSpeed.current = THREE.MathUtils.lerp(currentSpinSpeed.current, targetSpeed, 0.1);
      angleRef.current -= currentSpinSpeed.current * delta;

      // 2. Per-Circle State Loop (Each circle uses its own duration, waveSize, waveSpeed)
      if (isLoopingStates && presetsList.length > 1) {
        const totalStates = presetsList.length;
        const currIdx = stateIdxRef.current % totalStates;
        const nextIdx = (currIdx + 1) % totalStates;

        const currState = presetsList[currIdx];
        const nextState = presetsList[nextIdx];

        const segDuration = Math.max(0.5, currState.duration ?? 8.0);
        stateTimerRef.current += delta;

        // Advance to next circle state when this circle's custom duration finishes
        if (stateTimerRef.current >= segDuration) {
          stateTimerRef.current = 0;
          stateIdxRef.current = nextIdx;
          if (onActiveStateChange) {
            onActiveStateChange(presetsList[nextIdx].name);
          }
        }

        const activeCurr = presetsList[stateIdxRef.current];
        const activeNext = presetsList[(stateIdxRef.current + 1) % totalStates];
        const activeDur = Math.max(0.5, activeCurr.duration ?? 8.0);

        const rawProgress = Math.min(1, stateTimerRef.current / activeDur);
        const t = rawProgress * rawProgress * (3 - 2 * rawProgress); // Smoothstep

        smoothRadius.current = THREE.MathUtils.lerp(activeCurr.radius, activeNext.radius, t);
        smoothHeight.current = THREE.MathUtils.lerp(activeCurr.height, activeNext.height, t);
        smoothTargetY.current = THREE.MathUtils.lerp(activeCurr.targetY, activeNext.targetY, t);
        smoothWaveSize.current = THREE.MathUtils.lerp(activeCurr.waveSize ?? 0, activeNext.waveSize ?? 0, t);
        smoothWaveSpeed.current = THREE.MathUtils.lerp(activeCurr.waveSpeed ?? 1, activeNext.waveSpeed ?? 1, t);

      } else if (currentPreset) {
        // Paused on a single circle: use that specific circle's settings
        const lerpFactor = Math.min(1, delta * (2.5 / Math.max(0.5, currentPreset.duration ?? 5.0)));
        smoothRadius.current = THREE.MathUtils.lerp(smoothRadius.current, currentPreset.radius, lerpFactor);
        smoothHeight.current = THREE.MathUtils.lerp(smoothHeight.current, currentPreset.height, lerpFactor);
        smoothTargetY.current = THREE.MathUtils.lerp(smoothTargetY.current, currentPreset.targetY, lerpFactor);
        smoothWaveSize.current = THREE.MathUtils.lerp(smoothWaveSize.current, currentPreset.waveSize ?? 0, 0.1);
        smoothWaveSpeed.current = THREE.MathUtils.lerp(smoothWaveSpeed.current, currentPreset.waveSpeed ?? 1, 0.1);
      }

      // 3. Accumulate wave phase smoothly so changing waveSpeed never causes a jump
      wavePhaseRef.current += delta * smoothWaveSpeed.current;
      const verticalWaveOffset = Math.sin(wavePhaseRef.current) * smoothWaveSize.current;

      // 4. Apply Final Orbit Position + Wave
      camera.position.x = smoothRadius.current * Math.cos(angleRef.current);
      camera.position.z = smoothRadius.current * Math.sin(angleRef.current);
      camera.position.y = smoothHeight.current + verticalWaveOffset;

      camera.lookAt(0, smoothTargetY.current, 0);

    } else {
      controls.enabled = true;

      if (keys.current.ArrowUp) controls.target.y += VERTICAL_SPEED
      if (keys.current.ArrowDown) controls.target.y -= VERTICAL_SPEED
      
      tempOffset.copy(camera.position).sub(controls.target);
      tempSpherical.setFromVector3(tempOffset);

      if (keys.current.ArrowLeft) tempSpherical.theta += MANUAL_SPIN_SPEED
      if (keys.current.ArrowRight) tempSpherical.theta -= MANUAL_SPIN_SPEED

      tempOffset.setFromSpherical(tempSpherical);
      camera.position.copy(controls.target).add(tempOffset);
      
      controls.update()
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enableZoom={true}
      enablePan={false}
      target={[0, currentPreset?.targetY ?? -40, 0]}
    />
  )
}