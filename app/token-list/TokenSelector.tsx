'use client';

import React, { useState } from 'react';
import { Token } from '../../lib/fetchTokenList';
import TokenImage from '../components/TokenImage';

interface TokenSelectorProps {
  tokens: Token[];
  onSelect: (token: Token) => void;
  selectedToken: Token | null;
  label: string;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({
  tokens = [],  // Provide a default empty array
  onSelect,
  selectedToken,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = tokens.filter((token) =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <label>{label}</label>
      <div onClick={() => setIsOpen(!isOpen)}>
        {selectedToken ? (
          <div className="flex items-center gap-2">
            <TokenImage src={selectedToken.logoURI} alt={selectedToken.symbol} width={24} height={24} />
            <span>{selectedToken.symbol}</span>
          </div>
        ) : (
          <span>Select a token</span>
        )}
      </div>
      {isOpen && (
        <div>
          <input
            type="text"
            placeholder="Search tokens"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <ul>
            {filteredTokens.map((token) => (
              <li key={token.address} onClick={() => {
                onSelect(token);
                setIsOpen(false);
              }}
              className="flex items-center gap-2">
                <TokenImage src={token.logoURI} alt={token.symbol} width={24} height={24} />
                <span>{token.symbol}</span>
                <span>{token.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TokenSelector;