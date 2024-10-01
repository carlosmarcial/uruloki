'use client'

import { useState, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import * as THREE from 'three'

const DragonHead = dynamic(() => import('./DragonHead'), { ssr: false })

function Scene({ mousePosition }: { mousePosition: { x: number; y: number } }) {
  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 5]} zoom={50} />
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.4}
        castShadow
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} />
      <spotLight
        position={[0, 5, 0]}
        intensity={0.7}
        angle={0.6}
        penumbra={1}
        castShadow
      />
      <Suspense fallback={null}>
        <DragonHead mousePosition={mousePosition} />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.2} 
          luminanceSmoothing={0.9} 
          height={300}
          intensity={0.8}
        />
        <ChromaticAberration 
          offset={new THREE.Vector2(0.0005, 0.0005)}
          radialModulation={false}
          modulationOffset={0}
        />
      </EffectComposer>
    </>
  )
}

export default function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div className="relative w-full h-72 pt-8 pb-8 bg-background text-foreground flex items-center justify-center overflow-hidden">
      <motion.div 
        className="absolute inset-0"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <Canvas shadows>
          <Scene mousePosition={mousePosition} />
        </Canvas>
      </motion.div>
      <div className="relative z-10 w-full max-w-4xl px-8">
        <div className="text-left">
          <h1 className="text-4xl md:text-6xl font-bold">
            Your one-stop
          </h1>
          <h1 className="text-4xl md:text-6xl font-bold mt-2">
            AI-powered
          </h1>
          <h1 className="text-4xl md:text-6xl font-bold mt-2">
            trading platform
          </h1>
        </div>
      </div>
    </div>
  )
}