/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useEffect, useRef, useCallback } from 'react'
import { useTheme } from '@/providers/theme-provider'

declare global {
  interface Window {
    THREE: any
  }
}

// Theme color mappings for the 3D scene
const themeColors = {
  wiederland: {
    fog: 0x0a1a27,
    bgMountains: 0x5d2042,
    terrain: [0x879759, 0x648459, 0x7d8f57, 0x748857],
    water: [0x142c4c, 0x132a49, 0x1a3a65, 0x112541],
    trees: [0x6a7749, 0x48604a, 0x3a5449, 0x344847],
    clouds: 0xd5d6e2,
    mountainColors: [0xceced8, 0xaeacb9, 0xffffed],
    sky: { r: 0.04, g: 0.1, b: 0.15 },
  },
  neilson: {
    fog: 0x4a4035,
    bgMountains: 0x443053,
    terrain: [0x2c1914, 0x231410, 0x341e18, 0x39201a],
    water: [0x142c4c, 0x132a49, 0x1a3a65, 0x112541],
    trees: [0x22520a, 0x2b4509],
    clouds: 0x7e559f,
    mountainColors: [0xcdced7, 0x8d8c9e, 0xaaa8be],
    sky: { r: 0.1, g: 0.0, b: 0.1 },
  },
  dark: {
    fog: 0x1a1a2e,
    bgMountains: 0x16213e,
    terrain: [0x0d0d15, 0x0a0a10, 0x12121c, 0x151520],
    water: [0x0a1520, 0x08121a, 0x0c1825, 0x061015],
    trees: [0x0a2505, 0x0c2008],
    clouds: 0x3a4a6b,
    mountainColors: [0x9090a0, 0x505060, 0x606070],
    sky: { r: 0.03, g: 0.03, b: 0.08 },
  },
  confesh: {
    fog: 0x2a5a4a,
    bgMountains: 0x1e4a3a,
    terrain: [0x1a3a2a, 0x153020, 0x204535, 0x254030],
    water: [0x1a4060, 0x183858, 0x1e4a70, 0x143050],
    trees: [0x1a5a1a, 0x205018],
    clouds: 0x2386c9,
    mountainColors: [0xc0d0c0, 0x708070, 0x809080],
    sky: { r: 0.08, g: 0.15, b: 0.1 },
  },
  skunks: {
    fog: 0x1a2c57,
    bgMountains: 0x152445,
    terrain: [0x0d1528, 0x0a1220, 0x121a35, 0x151d40],
    water: [0x0a1530, 0x08122a, 0x0c1835, 0x061025],
    trees: [0x0a3505, 0x0c3008],
    clouds: 0xfcb715,
    mountainColors: [0xb0c0d0, 0x607080, 0x708090],
    sky: { r: 0.03, g: 0.05, b: 0.12 },
  },
  light: {
    fog: 0xb0b8c0,
    bgMountains: 0x9098a0,
    terrain: [0x606870, 0x505860, 0x707880, 0x656d75],
    water: [0x5080a0, 0x487090, 0x5890b0, 0x406080],
    trees: [0x305020, 0x284518],
    clouds: 0x606060,
    mountainColors: [0xe8e8f0, 0xa0a0b0, 0xb0b0c0],
    sky: { r: 0.6, g: 0.65, b: 0.75 },
  },
  system: {
    fog: 0x1a2c57,
    bgMountains: 0x152445,
    terrain: [0x0d1528, 0x0a1220, 0x121a35, 0x151d40],
    water: [0x0a1530, 0x08122a, 0x0c1835, 0x061025],
    trees: [0x0a3505, 0x0c3008],
    clouds: 0xfcb715,
    mountainColors: [0xb0c0d0, 0x607080, 0x708090],
    sky: { r: 0.03, g: 0.05, b: 0.12 },
  },
}

interface TheGreatFallBackgroundProps {
  className?: string
}

export default function TheGreatFallBackground({ className = '' }: TheGreatFallBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const sceneRef = useRef<any>(null)
  const { theme } = useTheme()

  const getThemeColors = useCallback(() => {
    const effectiveTheme = theme === 'system' 
      ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'neilson')
      : theme
    return themeColors[effectiveTheme] || themeColors.skunks
  }, [theme])

  useEffect(() => {
    if (!canvasRef.current) return

    // Load Three.js r128 (stable modern version)
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
    script.async = true

    script.onload = () => {
      initScene()
    }

    document.head.appendChild(script)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      script.remove()
    }
  }, [])

  // Update colors when theme changes
  useEffect(() => {
    if (sceneRef.current) {
      updateSceneColors()
    }
  }, [theme])

  const updateSceneColors = () => {
    const THREE = window.THREE
    if (!THREE || !sceneRef.current) return

    const colors = getThemeColors()
    const { scene, clouds } = sceneRef.current

    // Update fog
    if (scene && scene.fog) {
      scene.fog.color.setHex(colors.fog)
    }

    // Update cloud colors
    if (clouds && Array.isArray(clouds)) {
      clouds.forEach((cloud: any) => {
        if (cloud && cloud.material) {
          cloud.material.color.setHex(colors.clouds)
        }
      })
    }
  }

  const initScene = () => {
    const THREE = window.THREE
    if (!THREE || !canvasRef.current) return

    const colors = getThemeColors()
    
    let width = window.innerWidth
    let height = window.innerHeight
    const animationTime = 0
    const worldCenter = { y: -3500 + width / 2 }

    // Scene setup
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(colors.fog, 3000, 6000)
    scene.add(new THREE.AmbientLight(0xcccccc))

    // Spotlight with modern shadow properties
    const spotLight = new THREE.SpotLight(0xcccccc, 3, 10000)
    spotLight.position.set(width, 0, 2000)
    spotLight.castShadow = true
    spotLight.shadow.mapSize.width = 1024
    spotLight.shadow.mapSize.height = 1024
    spotLight.shadow.camera.near = 2
    spotLight.shadow.camera.far = 20000
    spotLight.shadow.camera.fov = 35
    scene.add(spotLight)

    // Sky shader
    const skyUniforms = {
      delta: { value: 1.0 },
      skyR: { value: colors.sky.r },
      skyG: { value: colors.sky.g },
      skyB: { value: colors.sky.b }
    }

    const skyGeometry = new THREE.PlaneGeometry(30000, 20000, 10, 10)
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float delta;
        uniform float skyR;
        uniform float skyG;
        uniform float skyB;
        varying vec2 vUv;
        void main() {
          float red = skyR;
          float green = skyG;
          float blue = skyB;
          
          if (vUv.y < 0.85) {
            float offset = 0.1 + (0.85 - vUv.y) * (1.0 + sin(delta * 0.1) * 1.0);
            blue = offset;
            red = offset;
            blue *= 1.0 + cos(vUv.x + delta * 0.3) * 0.05;
          }
          
          if (vUv.y < 0.8) {
            blue += cos(vUv.x + delta * 0.2) * 0.01;
          }

          gl_FragColor = vec4(red, green, blue, 1.0);
        }
      `
    })
    const sky = new THREE.Mesh(skyGeometry, skyMaterial)
    sky.position.set(0, -5000, -5000)
    scene.add(sky)

    // Helper function to add random vertex colors to a geometry
    const addVertexColors = (geometry: any, colorArray: number[]) => {
      const count = geometry.attributes.position.count
      const colors = new Float32Array(count * 3)
      
      for (let i = 0; i < count; i++) {
        const colorHex = colorArray[Math.floor(Math.random() * colorArray.length)]
        colors[i * 3] = ((colorHex >> 16) & 255) / 255
        colors[i * 3 + 1] = ((colorHex >> 8) & 255) / 255
        colors[i * 3 + 2] = (colorHex & 255) / 255
      }
      
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    }

    // Helper to add noise to geometry vertices
    const addVertexNoise = (geometry: any, noiseAmount: number, filter?: (x: number, y: number, z: number) => boolean) => {
      const positions = geometry.attributes.position.array
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i]
        const y = positions[i + 1]
        const z = positions[i + 2]
        
        if (!filter || filter(x, y, z)) {
          positions[i] += (Math.random() - 0.5) * noiseAmount
          positions[i + 1] += (Math.random() - 0.5) * noiseAmount
          positions[i + 2] += (Math.random() - 0.5) * noiseAmount
        }
      }
      geometry.attributes.position.needsUpdate = true
      geometry.computeVertexNormals()
    }

    // Background mountains
    const bgGeometry = new THREE.BoxGeometry(14000, 120, 2000, 10, 10, 10)
    addVertexNoise(bgGeometry, 200)
    
    const bgMaterial = new THREE.MeshLambertMaterial({
      color: colors.bgMountains,
      flatShading: true
    })
    const bgMountains = new THREE.Mesh(bgGeometry, bgMaterial)
    bgMountains.position.set(0, worldCenter.y + 3500, -4000)
    scene.add(bgMountains)

    // Terrain (canyon walls) - using BoxGeometry for the wrap-around effect
    const terrainGeometry = new THREE.BoxGeometry(14000, 7000, 3000, 80, 40, 40)
    addVertexColors(terrainGeometry, colors.terrain)
    addVertexNoise(terrainGeometry, 50, (x) => x < -500 || x > 500)
    
    const terrainMaterial = new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true
    })
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial)
    terrain.position.y = worldCenter.y
    terrain.position.z = -1500
    scene.add(terrain)

    // Water
    const waterGeometry = new THREE.BoxGeometry(3010, 7010, 1000, 10, 50, 10)
    addVertexColors(waterGeometry, colors.water)
    
    // Store original positions for wave animation
    const waterPositions = waterGeometry.attributes.position.array.slice()
    
    const waterMaterial = new THREE.MeshPhongMaterial({
      vertexColors: true,
      emissive: 0x222233,
      specular: 0x666688,
      shininess: 30,
      opacity: 0.85,
      transparent: true,
      flatShading: true
    })
    const water = new THREE.Mesh(waterGeometry, waterMaterial)
    water.position.x = 40
    water.position.y = worldCenter.y
    water.position.z = -1500
    water.rotation.y = -Math.PI / 2
    scene.add(water)

    // Low-poly mountains using IcosahedronGeometry
    const createMountain = (x: number, y: number, z: number, scale: number) => {
      const mountainGeometry = new THREE.IcosahedronGeometry(1, 1)
      addVertexColors(mountainGeometry, colors.mountainColors)
      
      const mountainMaterial = new THREE.MeshLambertMaterial({
        vertexColors: true,
        flatShading: true
      })
      const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial)
      mountain.position.set(x, y, z)
      mountain.scale.set(scale * 400, scale * 600, scale * 400)
      scene.add(mountain)
    }

    createMountain(2300, worldCenter.y + 3800, -2000, 1.2)
    createMountain(1900, worldCenter.y + 3600, -2500, 1.0)
    createMountain(1000, worldCenter.y + 3700, -2200, 0.9)
    createMountain(-2000, worldCenter.y + 3650, -2100, 1.1)
    createMountain(-2900, worldCenter.y + 3500, -2800, 0.8)
    createMountain(-3000, worldCenter.y + 3750, -1800, 1.0)

    // Clouds
    const cloudArray: any[] = []
    const createCloud = (x: number, y: number, z: number) => {
      const cloudGeometry = new THREE.IcosahedronGeometry(1, 1)
      const cloudMaterial = new THREE.MeshLambertMaterial({
        color: colors.clouds,
        opacity: 0.25,
        transparent: true,
        flatShading: true
      })
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial)
      cloud.position.set(x, y, z)
      cloud.scale.set(
        500 * (1 + Math.random()),
        300 * (0.5 + Math.random() * 0.5),
        400
      )
      cloudArray.push(cloud)
      scene.add(cloud)
    }

    for (let i = 0; i < 5; i++) {
      createCloud(
        -5000 + Math.random() * 10000,
        1300 + Math.random() * 500,
        -3500 + Math.random() * -500
      )
    }

    // Trees using ConeGeometry
    const createTree = (x: number, y: number, z: number) => {
      const scale = 0.8 + Math.random() * 0.6
      
      // Tree foliage (cone)
      const treeGeometry = new THREE.ConeGeometry(60 * scale, 250 * scale, 4)
      const treeMaterial = new THREE.MeshLambertMaterial({
        color: colors.trees[Math.floor(Math.random() * colors.trees.length)],
        flatShading: true
      })
      const tree = new THREE.Mesh(treeGeometry, treeMaterial)
      tree.position.set(x, y + 100 * scale, z)
      tree.rotation.y = Math.random() * Math.PI * 2
      scene.add(tree)
      
      // Tree trunk
      const trunkGeometry = new THREE.CylinderGeometry(10 * scale, 15 * scale, 80 * scale, 4)
      const trunkMaterial = new THREE.MeshLambertMaterial({
        color: 0x3d2817,
        flatShading: true
      })
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
      trunk.position.set(x, y - 10 * scale, z)
      scene.add(trunk)
    }

    // Add many trees
    for (let i = 0; i < 100; i++) {
      let x = -3000 + Math.random() * 6000
      const y = worldCenter.y + 3500
      const z = -3000 + Math.random() * 2500
      // Avoid center area (where water is)
      x = x > 600 || x < -600 ? x : (x > 0 ? x + 1200 : x - 1200)
      createTree(x, y, z)
    }

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Camera
    const camera = new THREE.PerspectiveCamera(35, width / height * 2, 2, 10000)
    camera.position.set(0, 850, 2000)

    // Store refs
    sceneRef.current = {
      scene,
      terrain,
      water,
      waterPositions,
      clouds: cloudArray,
      renderer,
      camera,
      spotLight,
      skyUniforms,
      worldCenter,
      animationTime
    }

    // Animation loop
    const animate = () => {
      if (!sceneRef.current) return
      
      const { water, waterPositions, clouds, renderer, camera, spotLight, skyUniforms } = sceneRef.current
      sceneRef.current.animationTime += 0.05

      // Update sky shader
      if (skyUniforms) {
        skyUniforms.delta.value += 0.1
      }

      // Water wave animation
      if (water && waterPositions) {
        const positions = water.geometry.attributes.position.array
        const time = sceneRef.current.animationTime
        
        for (let i = 0; i < positions.length; i += 3) {
          const originalY = waterPositions[i + 1]
          // Add wave effect to top surface
          if (originalY > 3400) {
            positions[i + 1] = originalY + Math.sin(time + waterPositions[i] * 0.01) * 15
          }
        }
        water.geometry.attributes.position.needsUpdate = true
      }

      // Cloud drift animation
      if (clouds && Array.isArray(clouds)) {
        clouds.forEach((cloud: any) => {
          if (cloud) {
            cloud.position.x += 1
            if (cloud.position.x > 6000) {
              cloud.position.x = -6000
            }
          }
        })
      }

      // Scroll-based camera movement
      const scrollPercent = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      const scrollPos = -6661 * Math.min(scrollPercent, 1)
      
      if (camera) {
        camera.position.y = 850 + scrollPos
      }
      if (spotLight) {
        spotLight.position.y = scrollPos + 2000
      }

      renderer.render(scene, camera)
      animationRef.current = requestAnimationFrame(animate)
    }

    // Handle resize
    const handleResize = () => {
      if (!sceneRef.current) return
      
      width = window.innerWidth
      height = window.innerHeight
      
      const { renderer, camera } = sceneRef.current
      if (renderer) {
        renderer.setSize(width, height)
      }
      if (camera) {
        camera.aspect = width / height * 2
        camera.updateProjectionMatrix()
      }
    }

    window.addEventListener('resize', handleResize)
    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (renderer) {
        renderer.dispose()
      }
    }
  }

  return (
    <div ref={containerRef} className={`fixed inset-0 z-0 ${className}`}>
      <canvas
        ref={canvasRef}
        id="ground"
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  )
}
