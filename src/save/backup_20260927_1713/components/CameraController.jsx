import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three' // 🚨 NEW: Needed for smooth speed transitions

const AUTO_SPIN_SPEED = 0.005;
const VERTICAL_SPEED = 0.01; 
const MANUAL_SPIN_SPEED = 0.06; 

// 🚨 NEW: Adjust this to make the jump spin faster or slower!
const JUMP_SCALE = 0.2; 

export default function CameraOrbitController({ 
  initialAngle = 0.2 * Math.PI, 
  isAutoMode = true,
  poseLandmarksRef // 🚨 NEW: Accept the skeleton data
}) {
  const { camera, gl } = useThree()
  const controlsRef = useRef()
  const keys = useRef({ ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false })

  // 🚨 NEW: Track the nose position and current speed
  const prevNoseY = useRef(null)
  const currentSpinSpeed = useRef(AUTO_SPIN_SPEED)

  // 1. Setup keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (keys.current.hasOwnProperty(e.code)) keys.current[e.code] = true
    }
    const handleKeyUp = (e) => {
      if (keys.current.hasOwnProperty(e.code)) keys.current[e.code] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // 2. Initial Setup
  useEffect(() => {
    const timer = setTimeout(() => {
      if (controlsRef.current) {
        controlsRef.current.setAzimuthalAngle(initialAngle)
        controlsRef.current.update()
      }
    }, 10)
    
    return () => clearTimeout(timer)
  }, [initialAngle])


  // 3. Standard Frame Loop (Keyboard & Auto with Jump!)
  useFrame((state, delta) => {
    const controls = controlsRef.current
    if (!controls) return

    if (isAutoMode) {
      let jumpBonus = 0;

      // --- CALCULATE NOSE JUMP VELOCITY ---
      if (poseLandmarksRef && poseLandmarksRef.current) {
        const lm = poseLandmarksRef.current;
        const nose = lm[0]; // Landmark 0 is the Nose

        if (nose && nose.visibility > 0.5) {
          if (prevNoseY.current !== null) {
            // MediaPipe Y goes from 0 (top) to 1 (bottom). 
            // So if prevY > currentY, we are moving UP.
            // Dividing by 'delta' gives us frame-rate independent velocity.
            const velocity = (prevNoseY.current - nose.y) / delta;

            // Only apply the bonus if we are jumping UP (velocity > 0)
            if (velocity > 0) {
              jumpBonus = velocity * JUMP_SCALE;
            }
          }
          prevNoseY.current = nose.y; // Save current position for the next frame
        } else {
          prevNoseY.current = null; // Lost tracking of the nose
        }
      }

      // --- SMOOTH THE SPEED ---
      // Instead of instantly snapping to the fast speed, we smoothly glide toward it.
      // This makes the camera feel heavy and cinematic.
      const targetSpeed = AUTO_SPIN_SPEED + jumpBonus;
      currentSpinSpeed.current = THREE.MathUtils.lerp(currentSpinSpeed.current, targetSpeed, 0.1);

      // --- APPLY THE SPEED ---
      controls.setAzimuthalAngle(controls.getAzimuthalAngle() + currentSpinSpeed.current);

    } else {
      // Manual Mode
      if (keys.current.ArrowUp) controls.target.y += VERTICAL_SPEED
      if (keys.current.ArrowDown) controls.target.y -= VERTICAL_SPEED
      if (keys.current.ArrowLeft) controls.setAzimuthalAngle(controls.getAzimuthalAngle() + MANUAL_SPIN_SPEED)
      if (keys.current.ArrowRight) controls.setAzimuthalAngle(controls.getAzimuthalAngle() - MANUAL_SPIN_SPEED)
    }

    controls.update()
  })

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enableZoom={true}
      enablePan={false}
      target={[0, 0, 0]}
    />
  )
}