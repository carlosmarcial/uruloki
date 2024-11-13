import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import TokenImage from './TokenImage';

interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

interface SolanaToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  tags?: string[];
  daily_volume?: number;
}

interface TokenSelectModalProps {
  tokens: Token[];
  onClose: () => void;
  onSelect: (token: Token) => void;
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
  const [displayedTokens, setDisplayedTokens] = useState<(Token | SolanaToken)[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<(Token | SolanaToken)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const ITEMS_PER_PAGE = 50;
  const [currentPage, setCurrentPage] = useState(1);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div className="bg-[#1a1b1f] rounded-2xl p-4 max-w-md w-full max-h-[80vh] overflow-hidden border border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Select Token</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <input
          type="text"
          placeholder="Search by name or paste address"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 mb-4 bg-[#2c2d33] rounded-xl text-white outline-none"
        />
        
        <div 
          ref={containerRef}
          className="overflow-y-auto max-h-[60vh] custom-scrollbar"
        >
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
                onClick={() => onSelect(token)}
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
      </div>
    </div>
  );
};

export default TokenSelectModal;
