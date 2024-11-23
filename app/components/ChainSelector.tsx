'use client';

import { useChainId, useConfig } from 'wagmi';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mainnet, polygon, optimism, arbitrum, avalanche } from 'wagmi/chains';
import { switchNetwork } from 'wagmi/actions';

const chains = [
  mainnet,    // Ethereum mainnet
  polygon,    // Polygon
  optimism,   // Optimism
  arbitrum,   // Arbitrum
  avalanche,  // Avalanche
];

export default function ChainSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const chainId = useChainId();
  const config = useConfig();
  
  // Add ref for the dropdown container
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const currentChain = chains.find(c => c.id === chainId);

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    // Add event listener when dropdown is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSwitchNetwork = async (newChainId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      await switchNetwork(config, { chainId: newChainId });
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch network');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentChain) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          py-3 px-6 rounded-sm font-bold text-base w-[152px]
          ${isOpen ? 'bg-gray-800 text-gray-400' : 'bg-[#77be44] text-white hover:bg-[#69aa3b]'}
          transition-colors
        `}
      >
        {currentChain.name}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-[200px] bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50"
          >
            {chains.map((chain) => (
              <button
                key={chain.id}
                onClick={() => handleSwitchNetwork(chain.id)}
                disabled={isLoading || chain.id === chainId}
                className={`
                  w-full px-4 py-3 text-left
                  ${chain.id === chainId ? 'bg-gray-700 cursor-default' : 'hover:bg-gray-700'}
                  ${isLoading ? 'opacity-50' : ''}
                  disabled:opacity-50
                  text-white
                `}
              >
                {chain.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="absolute top-full mt-2 p-2 bg-red-500 text-white rounded text-sm">
          {error}
        </div>
      )}
    </div>
  );
} 