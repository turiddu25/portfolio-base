// App.js

import React, { useMemo, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { shaderMaterial, useTrailTexture } from '@react-three/drei'
import * as THREE from 'three'

// Custom shader material
const DotMaterial = shaderMaterial(
  {
    resolution: new THREE.Vector2(),
    mouseTrail: null,
    gridSize: 40,
  },
  // Vertex Shader
  `
    varying vec2 vUv;

    void main() {
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform vec2 resolution;
    uniform sampler2D mouseTrail;
    uniform float gridSize;

    vec2 coverUv(vec2 uv) {
      vec2 s = resolution.xy / max(resolution.x, resolution.y);
      vec2 newUv = (uv - 0.5) * s + 0.5;
      return clamp(newUv, 0.0, 1.0);
    }

    void main() {
      vec2 screenUv = gl_FragCoord.xy / resolution;
      vec2 uv = coverUv(screenUv);

      // Create a grid
      vec2 gridUv = fract(uv * gridSize);
      vec2 gridUvCenter = (floor(uv * gridSize) + 0.5) / gridSize;

      // Sample mouse trail
      float trail = texture2D(mouseTrail, gridUvCenter).r;

      gl_FragColor = vec4(vec3(trail), 1.0);
    }
  `
)

// BentoBox Component
function BentoBox({ title, description, large }) {
  return (
    <div className={`bento-box ${large ? 'large' : ''}`}>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}

// BentoGrid Component
function BentoGrid() {
  return (
    <div className="bento-grid">
      <BentoBox
        large
        title="Featured Project"
        description="A stunning web application built with React and Three.js featuring interactive 3D animations"
      />
      <BentoBox
        title="About Me"
        description="Full-stack developer passionate about creating beautiful, interactive experiences"
      />
      <BentoBox
        title="Skills"
        description="React • Three.js • Node.js • Python • WebGL • TypeScript"
      />
      <BentoBox
        title="Contact"
        description="Get in touch: email@example.com • GitHub • LinkedIn"
      />
      <BentoBox
        large
        title="Latest Work"
        description="Exploring the intersection of web development and creative coding"
      />
      <BentoBox
        title="Blog"
        description="Thoughts on web development, design, and creative coding"
      />
    </div>
  )
}

// Scene Component
function Scene() {
  const { size, viewport, camera } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const pointer = new THREE.Vector2()
  const meshRef = useRef()

  const gridSize = 80

  const dotMaterial = useMemo(() => new DotMaterial(), [])

  const [trail, onMove] = useTrailTexture({
    size: 512,
    radius: 0.1,
    maxAge: 400,
    interpolate: 1,
    ease: function easeInOutCirc(x) {
      return x < 0.5
        ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
        : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2
    },
  })

  const scale = Math.max(viewport.width, viewport.height) / 2

  // Listen to global pointer move events
  useEffect(() => {
    const handlePointerMove = (event) => {
      // Calculate normalized device coordinates (NDC)
      pointer.x = (event.clientX / size.width) * 2 - 1
      pointer.y = -(event.clientY / size.height) * 2 + 1

      // Update the raycaster
      raycaster.setFromCamera(pointer, camera)

      // Intersect the mesh
      if (meshRef.current) {
        const intersects = raycaster.intersectObject(meshRef.current)
        if (intersects.length > 0) {
          const uv = intersects[0].uv

          // Create a synthetic event object with the required properties
          const syntheticEvent = {
            uv,
          }

          onMove(syntheticEvent)
        }
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [onMove, raycaster, camera, size.width, size.height])

  return (
    <mesh ref={meshRef} scale={[scale, scale, 1]}>
      <planeGeometry args={[2, 2]} />
      <primitive
        object={dotMaterial}
        gridSize={gridSize}
        resolution={[size.width * viewport.dpr, size.height * viewport.dpr]}
        mouseTrail={trail}
      />
    </mesh>
  )
}

// Styles
const styles = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  pointerEvents: 'none',
}

// **Exporting the App Component Correctly**
export default function App() {
  return (
    <>
      <div style={styles}>
        <Canvas
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
          }}
          camera={{ position: [0, 0, 1] }}
          style={{
            background: '#151515',
            pointerEvents: 'all',
          }}
        >
          <Scene />
        </Canvas>
      </div>
      <div className="content">
        <BentoGrid />
      </div>
      <style jsx global>{`
        /* Your global styles */
      `}</style>
    </>
  )
}
