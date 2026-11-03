import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three' 

const VERTICAL_SPEED = 0.01; 
const MANUAL_SPIN_SPEED = 0.02; 
const JUMP_SCALE = 0.2; 

// Reuse objects outside the frame loop to avoid garbage collection lag
const tempOffset = new THREE.Vector3()
const tempSpherical = new THREE.Spherical()

export default function CameraOrbitController({ 
  isAutoMode = true,
  poseLandmarksRef, 
  radius = 150,      
  height = 5,       
  targetY = 0,    
  baseSpeed = 0.5,
  // 🌊 NEW: Loop & Wave Props
  presetsList = [],           // Array of preset objects [{ radius, height, targetY }, ...]
  isLoopingStates = true,     // Whether to automatically loop init -> playing4 -> init
  transitionDuration = 6.0,   // Seconds to morph from one state to the next
  waveSize = 8.0,             // Amplitude of the up-and-down wave
  waveSpeed = 1.5,            // Speed of the up-and-down wave
  onActiveStateChange,        // Optional callback to highlight the current state in UI
  onRegisterCapture 
}) {
  const { camera, gl } = useThree()
  const controlsRef = useRef()
  const keys = useRef({ ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false })

  const prevNoseY = useRef(null)
  const currentSpinSpeed = useRef(baseSpeed)
  const angleRef = useRef(0) 

  // Track smoothed values and cycle progress
  const smoothRadius = useRef(radius)
  const smoothHeight = useRef(height)
  const smoothTargetY = useRef(targetY)
  const loopTimerRef = useRef(0)
  const lastReportedIdx = useRef(-1)

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
          position: [
            parseFloat(camera.position.x.toFixed(2)),
            parseFloat(camera.position.y.toFixed(2)),
            parseFloat(camera.position.z.toFixed(2))
          ]
        };
        
        console.log("📸 Camera Snapshot Captured:", snapshotData);
        return snapshotData;
      });
    }
  }, [onRegisterCapture, camera, controlsRef]);

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

      // 2. Smooth State Transition Logic (init -> playing4 -> init)
      if (isLoopingStates && presetsList.length > 1) {
        const safeDuration = Math.max(0.2, transitionDuration);
        loopTimerRef.current += delta;

        const totalStates = presetsList.length;
        const totalCycleTime = totalStates * safeDuration;
        const cycleTime = loopTimerRef.current % totalCycleTime;

        const currentIndex = Math.floor(cycleTime / safeDuration);
        const nextIndex = (currentIndex + 1) % totalStates; // Loops playing4 back to init (0)
        
        // Progress from 0.0 to 1.0 between current state and next state
        const rawProgress = (cycleTime % safeDuration) / safeDuration;
        // Smoothstep makes the start and end of each transition feel gentle and cinematic
        const t = rawProgress * rawProgress * (3 - 2 * rawProgress);

        const currentPreset = presetsList[currentIndex];
        const nextPreset = presetsList[nextIndex];

        smoothRadius.current = THREE.MathUtils.lerp(currentPreset.radius, nextPreset.radius, t);
        smoothHeight.current = THREE.MathUtils.lerp(currentPreset.height, nextPreset.height, t);
        smoothTargetY.current = THREE.MathUtils.lerp(currentPreset.targetY, nextPreset.targetY, t);

        // Update UI indicator if state index changed
        if (onActiveStateChange && lastReportedIdx.current !== currentIndex) {
          lastReportedIdx.current = currentIndex;
          onActiveStateChange(currentPreset.name);
        }
      } else {
        // Manual single-preset selection: smoothly glide toward the selected preset props
        const lerpSpeed = Math.min(1, delta * (2.5 / Math.max(0.2, transitionDuration)));
        smoothRadius.current = THREE.MathUtils.lerp(smoothRadius.current, radius, lerpSpeed);
        smoothHeight.current = THREE.MathUtils.lerp(smoothHeight.current, height, lerpSpeed);
        smoothTargetY.current = THREE.MathUtils.lerp(smoothTargetY.current, targetY, lerpSpeed);
      }

      // 3. Up-and-Down Wave Calculation
      const elapsed = state.clock.getElapsedTime();
      const verticalWaveOffset = Math.sin(elapsed * waveSpeed) * waveSize;

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
      target={[0, targetY, 0]}
    />
  )
}