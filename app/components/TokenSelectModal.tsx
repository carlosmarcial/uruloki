import React, { useState } from 'react';
import { Token } from '@/lib/fetchTokenList';

interface TokenSelectModalProps {
  tokens: Token[];
  onClose: () => void;
  onSelect: (token: Token) => void;
}

const TokenSelectModal: React.FC<TokenSelectModalProps> = ({ tokens, onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTokens = tokens.filter(token => 
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Select a token</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Search tokens"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-full py-2 pl-10 pr-4 focus:outline-none"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="mb-4">
          <h3 className="text-gray-400 text-sm font-semibold">Your tokens</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filteredTokens.map(token => (
            <div
              key={token.address}
              className="flex items-center justify-between p-2 hover:bg-gray-800 cursor-pointer"
              onClick={() => onSelect(token)}
            >
              <div className="flex items-center">
                <img src={token.logoURI} alt={token.symbol} className="w-8 h-8 mr-3 rounded-full" />
                <div>
                  <div className="text-white font-semibold">{token.name}</div>
                  <div className="text-gray-400 text-sm">{token.symbol}</div>
                </div>
              </div>
              {/* Add balance display here if available */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TokenSelectModal;
