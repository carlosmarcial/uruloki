'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ChainToggleProps {
  activeChain: 'ethereum' | 'solana';
  setActiveChain: (chain: 'ethereum' | 'solana') => void;
}

const ChainToggle: React.FC<ChainToggleProps> = ({ activeChain, setActiveChain }) => {
  return (
    <div className="flex justify-center items-center h-16 mb-4">
      <div className="flex bg-gray-800 rounded-full p-1">
        <motion.button
          whileHover={activeChain !== 'ethereum' ? { scale: 1.05 } : {}}
          whileTap={activeChain !== 'ethereum' ? { scale: 0.95 } : {}}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors w-24 ${
            activeChain === 'ethereum' ? 'bg-[#77be44] text-white' : 'text-gray-400'
          }`}
          onClick={() => setActiveChain('ethereum')}
        >
          Ethereum
        </motion.button>
        <motion.button
          whileHover={activeChain !== 'solana' ? { scale: 1.05 } : {}}
          whileTap={activeChain !== 'solana' ? { scale: 0.95 } : {}}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors w-24 ${
            activeChain === 'solana' ? 'bg-purple-500 text-white' : 'text-gray-400'
          }`}
          onClick={() => setActiveChain('solana')}
        >
          Solana
        </motion.button>
      </div>
    </div>
  );
};

export default ChainToggle;
