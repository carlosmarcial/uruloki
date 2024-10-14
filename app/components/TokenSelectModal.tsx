import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search } from 'lucide-react';
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
  tokens: (Token | SolanaToken)[];
  onClose: () => void;
  onSelect: (token: Token | SolanaToken) => void;
}

const TokenSelectModal: React.FC<TokenSelectModalProps> = ({ tokens, onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTokens, setFilteredTokens] = useState<(Token | SolanaToken)[]>([]);
  const [visibleTokens, setVisibleTokens] = useState<(Token | SolanaToken)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const INITIAL_LOAD = 15;
  const LOAD_MORE_COUNT = 10;

  const filterTokens = useCallback(() => {
    return tokens.filter(token => 
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tokens, searchTerm]);

  useEffect(() => {
    const filtered = filterTokens();
    setFilteredTokens(filtered);
    setVisibleTokens(filtered.slice(0, INITIAL_LOAD));
  }, [filterTokens]);

  const loadMoreTokens = useCallback(() => {
    setVisibleTokens(prevTokens => {
      const currentLength = prevTokens.length;
      const nextTokens = filteredTokens.slice(currentLength, currentLength + LOAD_MORE_COUNT);
      return [...prevTokens, ...nextTokens];
    });
  }, [filteredTokens]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (scrollHeight - scrollTop <= clientHeight * 1.5) {
        loadMoreTokens();
      }
    }
  }, [loadMoreTokens]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClickOutside}>
      <div className="bg-gray-800 rounded-lg p-4 w-96 max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Select a token</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Search tokens"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-md py-2 pl-10 pr-4"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
        <div ref={containerRef} className="space-y-2 overflow-y-auto max-h-[60vh]">
          {visibleTokens.map((token) => (
            <div
              key={token.address}
              className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer"
              onClick={() => onSelect(token)}
            >
              <TokenImage
                src={token.logoURI}
                alt={token.name}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="text-white">{token.symbol}</span>
              <span className="text-gray-400 text-sm">{token.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TokenSelectModal;
