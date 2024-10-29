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
  tags: string[];
  daily_volume: number;
}

interface TokenSelectModalProps {
  tokens: Token[];
  onClose: () => void;
  onSelect: (token: Token) => void;
  chainId: number;
}

const TokenSelectModal: React.FC<TokenSelectModalProps> = ({ tokens, onClose, onSelect, chainId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedTokens, setDisplayedTokens] = useState<Token[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const ITEMS_PER_PAGE = 50;
  const [currentPage, setCurrentPage] = useState(1);

  // Filter tokens based on search query
  const filterTokens = useCallback((query: string, tokenList: Token[]) => {
    if (!query.trim()) {
      return tokenList;
    }

    const searchLower = query.toLowerCase();
    return tokenList.filter(token => 
      token.symbol?.toLowerCase().includes(searchLower) ||
      token.name?.toLowerCase().includes(searchLower) ||
      token.address?.toLowerCase() === searchLower
    );
  }, []);

  // Initialize with first batch of tokens
  useEffect(() => {
    const initialTokens = tokens.slice(0, ITEMS_PER_PAGE);
    setDisplayedTokens(initialTokens);
    setFilteredTokens(tokens);
    setCurrentPage(1);
  }, [tokens, chainId]);

  // Handle search
  useEffect(() => {
    setIsLoading(true);
    const filtered = filterTokens(searchQuery, tokens);
    setFilteredTokens(filtered);
    setDisplayedTokens(filtered.slice(0, ITEMS_PER_PAGE));
    setCurrentPage(1);
    setIsLoading(false);
  }, [searchQuery, tokens, filterTokens]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!containerRef.current || isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      const nextPage = currentPage + 1;
      const start = (nextPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      
      setIsLoading(true);
      setTimeout(() => {
        setDisplayedTokens(prev => [
          ...prev,
          ...filteredTokens.slice(start, end)
        ]);
        setCurrentPage(nextPage);
        setIsLoading(false);
      }, 100);
    }
  }, [currentPage, filteredTokens, isLoading]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div className="bg-[#1a1b1f] rounded-2xl p-4 max-w-md w-full max-h-[80vh] overflow-hidden border border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Select Token</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            ×
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by name or paste address"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 bg-[#2c2d33] border border-gray-700 rounded-xl mb-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />

        <div 
          ref={containerRef}
          className="overflow-y-auto max-h-[60vh] custom-scrollbar"
        >
          {displayedTokens.map((token) => (
            <div
              key={`${token.address}-${chainId}`}
              onClick={() => onSelect(token)}
              className="flex items-center p-3 hover:bg-[#2c2d33] cursor-pointer rounded-xl transition-colors"
            >
              {token.logoURI && (
                <img 
                  src={token.logoURI} 
                  alt={token.symbol} 
                  className="w-8 h-8 mr-3 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div>
                <div className="font-medium text-white">{token.symbol}</div>
                <div className="text-sm text-gray-400">{token.name}</div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="text-center py-4 text-gray-400">
              Loading more tokens...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenSelectModal;
