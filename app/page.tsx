'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId, useContractRead, useContractWrite } from 'wagmi';
import { simulateContract } from 'wagmi/actions';
import { erc20Abi } from '@app/abis/erc20Abi';
import { useConfig } from 'wagmi';
import { MAINNET_EXCHANGE_PROXY, MAX_ALLOWANCE } from './constants';
import dynamic from 'next/dynamic';
import WebGLBackground from './components/WebGLBackground';
import ModelPreloader from '@app/components/ModelPreloader';
import Header from '@app/components/Header';
import UnifiedSwapInterface from './components/UnifiedSwapInterface';

const MainTrading = dynamic(() => import("./components/MainTrading"), { ssr: false });

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
