import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three' 

const VERTICAL_SPEED = 0.01; 
const MANUAL_SPIN_SPEED = 0.02; 
const JUMP_SCALE = 0.2; 

export default function CameraOrbitController({ 
  isAutoMode = true,
  poseLandmarksRef, 
  radius = 150,      
  height = 5,       
  targetY = 0,    // NEW: Controls where the camera is looking on the Y axis
  baseSpeed = 0.5   
}) {
  const { camera, gl } = useThree()
  const controlsRef = useRef()
  const keys = useRef({ ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false })

  const prevNoseY = useRef(null)
  const currentSpinSpeed = useRef(baseSpeed)
  const angleRef = useRef(0) 

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

      camera.position.x = radius * Math.cos(angleRef.current);
      camera.position.z = radius * Math.sin(angleRef.current);
      camera.position.y = height;

      // UPDATED: Now looks at your custom targetY instead of a hardcoded 0
      camera.lookAt(0, targetY, 0);

    } else {
      controls.enabled = true;

      if (keys.current.ArrowUp) controls.target.y += VERTICAL_SPEED
      if (keys.current.ArrowDown) controls.target.y -= VERTICAL_SPEED
      
      const offset = new THREE.Vector3().copy(camera.position).sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);

      if (keys.current.ArrowLeft) spherical.theta += MANUAL_SPIN_SPEED
      if (keys.current.ArrowRight) spherical.theta -= MANUAL_SPIN_SPEED

      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
      
      controls.update()
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enableZoom={true}
      enablePan={false}
      // UPDATED: Keeps manual mode's center point synced with auto mode
      target={[0, targetY, 0]}
    />
  )
}