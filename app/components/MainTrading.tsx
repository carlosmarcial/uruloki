'use client';

import { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import dynamic from 'next/dynamic';

const DragonHead = dynamic(() => import('./DragonHead'), { ssr: false });
const UnifiedSwapInterface = dynamic(() => import('./UnifiedSwapInterface'), { 
  ssr: false,
  loading: () => <LoadingSpinner />
});

function Scene({ mousePosition }: { mousePosition: { x: number; y: number } }) {
  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 5]} zoom={70} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1.6} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.7} />
      <spotLight position={[0, 5, 0]} intensity={0.7} angle={0.6} penumbra={1} castShadow />
      <Suspense fallback={null}>
        <DragonHead mousePosition={mousePosition} scale={0.5} position={[0, -0.1, 0]} />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={0.8} />
        <ChromaticAberration offset={new THREE.Vector2(0.0005, 0.0005)} radialModulation={false} modulationOffset={0} />
      </EffectComposer>
    </>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-32">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#77be44]"></div>
    </div>
  );
}

export default function MainTrading() {
  const [activeChain, setActiveChain] = useState<'ethereum' | 'solana'>('ethereum');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <main className="flex-grow relative z-10 bg-transparent">
      <div className="max-w-[1400px] mx-auto px-4 relative">
        <div className="mb-0 flex justify-center items-center">
          <div className="flex space-x-4 items-center">
            <button
              onClick={() => setActiveChain('ethereum')}
              className={`py-2 px-4 rounded-md font-semibold text-sm transition-colors w-28 ${
                activeChain === 'ethereum'
                  ? 'bg-[#77be44] text-black'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Ethereum
            </button>
            <div className="w-40 h-40 overflow-hidden">
              <Canvas shadows>
                <Scene mousePosition={mousePosition} />
              </Canvas>
            </div>
            <button
              onClick={() => setActiveChain('solana')}
              className={`py-2 px-4 rounded-md font-semibold text-sm transition-colors w-28 ${
                activeChain === 'solana'
                  ? 'bg-[#77be44] text-black'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Solana
            </button>
          </div>
        </div>
        <div className="mt-0">
          <UnifiedSwapInterface activeChain={activeChain} setActiveChain={setActiveChain} />
        </div>
      </div>
    </main>
  );
}