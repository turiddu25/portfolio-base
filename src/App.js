import { useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { shaderMaterial, useTrailTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useSliderBlade, useTweakpane } from 'react-tweakpane'

// Custom shader material
const DotMaterial = shaderMaterial(
  {
    resolution: new THREE.Vector2(),
    mouseTrail: null,
    gridSize: 40
  },
  `
    varying vec2 vUv;

    void main() {
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  `
    uniform vec2 resolution;
    uniform sampler2D mouseTrail;
    uniform float gridSize;

    vec2 coverUv(vec2 uv) {
      vec2 s = resolution.xy / max(resolution.x, resolution.y);
      vec2 newUv = (uv - 0.5) * s + 0.5;
      return clamp(newUv, 0.0, 1.0);
    }

    /* SDF Shapes */
    float sdfCircle(vec2 p, float r) {
        return length(p - 0.5) - r;
    }

    void main() {
      float aspect = resolution.x / resolution.y;
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

function Scene() {
  const size = useThree((s) => s.size)
  const viewport = useThree((s) => s.viewport)
  const pane = useTweakpane()

  const [gridSize] = useSliderBlade(pane, {
    label: 'Cells',
    min: 10,
    max: 100,
    value: 80
  })

  const dotMaterial = useMemo(() => {
    return new DotMaterial()
  }, [])

  const [trail, onMove] = useTrailTexture({
    size: 512,
    radius: 0.1,
    maxAge: 400,
    interpolate: 1,
    ease: function easeInOutCirc(x) {
      return x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2
    }
  })

  const scale = Math.max(viewport.width, viewport.height) / 2

  return (
    <mesh scale={[scale, scale, 1]} onPointerMove={onMove}>
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

export default function CodropsDemo() {
  return (
    <Canvas
      gl={{
        antialias: true,
        powerPreference: 'high-performance'
      }}>
      <Scene />
    </Canvas>
  )
}
