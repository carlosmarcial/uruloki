'use client';

import React from 'react';
import { Chain } from 'wagmi';
import { Token } from '../../types/token';

interface TokenSelectorProps {
  label: string;
  selectedTokenSymbol: string;
  onSelectToken: (token: string) => void;
  amount: string;
  onAmountChange?: (amount: string) => void;
  readOnly?: boolean;
  tokens: Token[];
  onClose: () => void;
  chains: Chain[];
  selectedChain: Chain | null;
  onChainChange: (chainId: number) => void;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({
  tokens,
  onSelect,
  onClose,
  chains,
  selectedChain,
  onChainChange,
}) => {
  return (
    <div className="token-selector-modal">
      <div className="chain-selector">
        <select
          value={selectedChain?.id || ''}
          onChange={(e) => onChainChange(Number(e.target.value))}
        >
          {chains.map((chain) => (
            <option key={chain.id} value={chain.id}>
              {chain.name}
            </option>
          ))}
        </select>
      </div>
      <div className="token-list">
        {tokens.map((token) => (
          <div key={token.address} className="token-item" onClick={() => onSelect(token)}>
            {token.symbol}
          </div>
        ))}
      </div>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default TokenSelector;