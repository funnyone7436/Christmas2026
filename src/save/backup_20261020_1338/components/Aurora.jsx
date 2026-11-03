import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  varying vec2 vUv;
  uniform float uTime;

  #define PI 3.14159265359

  // Compact 3D Hash & Noise to guarantee seamless wrapping
  float hash(vec3 p) {
      p  = fract(p * vec3(0.1031, 0.1030, 0.0973));
      p += dot(p, p.yxz + 33.33);
      return fract((p.x + p.y) * p.z);
  }

  float noise(vec3 x) {
      vec3 p = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(hash(p + vec3(0,0,0)), hash(p + vec3(1,0,0)), f.x),
                     mix(hash(p + vec3(0,1,0)), hash(p + vec3(1,1,0)), f.x), f.y),
                 mix(mix(hash(p + vec3(0,0,1)), hash(p + vec3(1,0,1)), f.x),
                     mix(hash(p + vec3(0,1,1)), hash(p + vec3(1,1,1)), f.x), f.y), f.z);
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.1; 
    
    // 1. Create seamless wavy distortion
    float noiseDist = noise(vec3(uv.y * 2.0, t, 0.0)) * 0.2;
    float ribbonDistortion = sin(uv.y * 6.0 - t) * 0.15 + noiseDist;
    
    // 2. Map the X coordinate to a perfect 3D circle
    float distortedAngle = (uv.x + ribbonDistortion) * PI * 2.0;
    vec2 circlePos = vec2(cos(distortedAngle), sin(distortedAngle));

    // 3. Generate vertical brush-stroke striations
    float striations = noise(vec3(circlePos * 6.36, uv.y * 2.0 - t * 3.0));
    
    // 4. Cluster the light into distinct bands
    float largeBands = smoothstep(0.3, 0.7, noise(vec3(circlePos * 0.95, t * -0.5)));
    
    // 5. Color Palette
    vec3 colorBottom = vec3(0.0, 0.8, 0.8); 
    vec3 colorTop = vec3(0.0, 0.1, 0.4);    
    vec3 finalColor = mix(colorBottom, colorTop, uv.y);

    // 🚨 HARD CUTOFF MASK: 
    // Anything below 0.5 (the lower half of the cylinder) is now strictly forced to 0.0 opacity.
    // This guarantees the aurora can never overlap the lower background landscape.
    float mask = smoothstep(0.5, 0.7, uv.y) * smoothstep(1.0, 0.6, uv.y);
    
    float intensity = striations * largeBands * mask;

    gl_FragColor = vec4(finalColor * intensity * 2.0, intensity);
  }
`

export default function Aurora() {
  const materialRef = useRef()

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    // renderOrder={-5} forces the aurora to render BEFORE the background spheres, 
    // ensuring it never cuts over the top of them.
    <mesh position={[0, 45, 0]} renderOrder={-5}>
      <cylinderGeometry args={[220, 220, 70, 64, 1, true]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending} 
        side={THREE.BackSide} 
      />
    </mesh>
  )
}