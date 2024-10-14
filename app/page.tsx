'use client';

import { useState } from 'react';
import WebGLBackground from './components/WebGLBackground';
import ModelPreloader from '@app/components/ModelPreloader';
import Header from '@app/components/Header';
import MainTrading from './components/ChainToggle';
import UnifiedSwapInterface from './components/UnifiedSwapInterface';

export default function Home() {
  const [activeChain, setActiveChain] = useState<'ethereum' | 'solana'>('ethereum');

  return (
    <>
      <WebGLBackground />
      <div className="content-wrapper flex flex-col min-h-screen">
        <ModelPreloader />
        <Header />
        <UnifiedSwapInterface
          activeChain={activeChain}
          setActiveChain={setActiveChain}
        />
      </div>
    </>
  );
}
