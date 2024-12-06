import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import TokenImage from './TokenImage';
import { motion, AnimatePresence } from 'framer-motion';
import { TokenData, SolanaToken } from '@/app/types/token';

interface RecentToken extends TokenData {
  timestamp: number;
}

interface TokenSelectModalProps {
  tokens: TokenData[];
  onClose: () => void;
  onSelect: (token: TokenData) => void;
  chainId: number | 'solana';
  activeChain: 'ethereum' | 'solana';
  isLoading: boolean;
  setShowTokenSelect: (show: boolean) => void;
}

const TokenSelectModal: React.FC<TokenSelectModalProps> = ({ 
  tokens = [],
  onClose, 
  onSelect, 
  chainId,
  activeChain,
  isLoading = false,
  setShowTokenSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedTokens, setDisplayedTokens] = useState<(TokenData | SolanaToken)[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<(TokenData | SolanaToken)[]>([]);
  const [recentTokens, setRecentTokens] = useState<RecentToken[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const ITEMS_PER_PAGE = 50;
  const MAX_RECENT_TOKENS = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [isVisible, setIsVisible] = useState(true);

  // Load recent tokens from localStorage on mount
  useEffect(() => {
    const loadRecentTokens = () => {
      const storageKey = `recentTokens-${activeChain}-${chainId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as RecentToken[];
          // Sort by timestamp descending (most recent first)
          const sorted = parsed.sort((a, b) => b.timestamp - a.timestamp);
          setRecentTokens(sorted.slice(0, MAX_RECENT_TOKENS));
        } catch (error) {
          console.error('Error parsing recent tokens:', error);
          setRecentTokens([]);
        }
      }
    };

    loadRecentTokens();
  }, [activeChain, chainId]);

  // Save token to recent tokens
  const saveToRecentTokens = (token: TokenData) => {
    const storageKey = `recentTokens-${activeChain}-${chainId}`;
    const recentToken: RecentToken = {
      ...token,
      timestamp: Date.now()
    };

    const newRecentTokens = [
      recentToken,
      ...recentTokens.filter(t => t.address.toLowerCase() !== token.address.toLowerCase())
    ].slice(0, MAX_RECENT_TOKENS);

    setRecentTokens(newRecentTokens);
    localStorage.setItem(storageKey, JSON.stringify(newRecentTokens));
  };

  // Modified onSelect handler
  const handleTokenSelect = (token: TokenData) => {
    saveToRecentTokens(token);
    onSelect(token);
  };

  // Handle clicks outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Initialize tokens only when they change
  useEffect(() => {
    if (!isLoading && tokens.length > 0) {
      const initialTokens = tokens.slice(0, ITEMS_PER_PAGE);
      setDisplayedTokens(initialTokens);
      setFilteredTokens(tokens);
    }
  }, [tokens, isLoading]);

  // Handle search separately
  useEffect(() => {
    if (tokens.length > 0) {
      const filtered = tokens.filter((token) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          token.symbol.toLowerCase().includes(searchLower) ||
          token.name.toLowerCase().includes(searchLower) ||
          token.address.toLowerCase().includes(searchLower)
        );
      });
      setFilteredTokens(filtered);
      setDisplayedTokens(filtered.slice(0, ITEMS_PER_PAGE * currentPage));
    }
  }, [searchQuery, tokens, currentPage]);

  // Handle scroll-based pagination
  const handleScroll = useCallback(() => {
    if (!containerRef.current || isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      setCurrentPage(prev => prev + 1);
    }
  }, [isLoading]);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (currentContainer) {
      currentContainer.addEventListener('scroll', handleScroll);
      return () => currentContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Match this with animation duration
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        key="modal-backdrop"
      >
        <div className="fixed inset-0 bg-black bg-opacity-80" />
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ 
            type: "spring", 
            duration: 0.3,
            bounce: 0
          }}
          ref={modalRef} 
          className="bg-[#1a1b1f] rounded-2xl p-4 max-w-md w-full max-h-[80vh] overflow-hidden border border-gray-800"
          key="modal-content"
        >
          <div className="flex justify-end items-center mb-4">
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <input
            type="text"
            placeholder="Search token by name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 mb-4 bg-[#2c2d33] rounded-xl text-white outline-none"
          />
          
          <div 
            ref={containerRef}
            className="overflow-y-auto max-h-[60vh] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#2c2d33] [&::-webkit-scrollbar-thumb]:bg-[#4a4b50] [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {/* Recent Tokens Section */}
            {!searchQuery && recentTokens.length > 0 && (
              <div className="mb-4">
                <div className="px-3 py-2 text-sm text-gray-400">Recent searches</div>
                {recentTokens.map((token) => (
                  <div
                    key={`recent-${token.address}-${token.timestamp}`}
                    onClick={() => handleTokenSelect(token)}
                    className="flex items-center p-3 hover:bg-[#2c2d33] cursor-pointer rounded-xl"
                  >
                    <div className="w-8 h-8 mr-3 rounded-full overflow-hidden">
                      <TokenImage
                        src={token.logoURI}
                        alt={token.symbol}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-white">{token.symbol}</div>
                      <div className="text-sm text-gray-400">{token.name}</div>
                    </div>
                  </div>
                ))}
                <div className="border-b border-gray-700 my-2"></div>
              </div>
            )}

            {/* Main Token List */}
            {isLoading ? (
              <div className="text-center py-4 text-gray-400">
                Loading tokens...
              </div>
            ) : displayedTokens.length === 0 ? (
              <div className="text-center py-4 text-gray-400">
                No tokens available
              </div>
            ) : (
              displayedTokens.map((token) => (
                <div
                  key={`${token.address}-${chainId}`}
                  onClick={() => handleTokenSelect(token)}
                  className="flex items-center p-3 hover:bg-[#2c2d33] cursor-pointer rounded-xl"
                >
                  <div className="w-8 h-8 mr-3 rounded-full overflow-hidden">
                    <TokenImage
                      src={token.logoURI}
                      alt={token.symbol}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-white">{token.symbol}</div>
                    <div className="text-sm text-gray-400">{token.name}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TokenSelectModal;
