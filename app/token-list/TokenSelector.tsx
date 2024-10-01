'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Token } from '../../types/token';
import { fetchTokenList } from '../../lib/fetchTokenList';

export default function TokenSelector() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  useEffect(() => {
    const loadTokens = async () => {
      const fetchedTokens = await fetchTokenList();
      setTokens(fetchedTokens);
    };

    loadTokens();
  }, []);

  return (
    <div>
      <h2>Select a Token</h2>
      <select onChange={(e) => setSelectedToken(e.target.value)}>
        <option value="">--Select a Token--</option>
        {tokens.map((token) => (
          <option key={token.address} value={token.address}>
            {token.name} ({token.symbol})
          </option>
        ))}
      </select>

      <div className="mt-4 space-y-2">
        {tokens.map((token) => (
          <div key={token.address} className="flex items-center space-x-2">
            <Image
              src={token.logoURI}
              alt={token.name}
              width={30}
              height={30}
              className="rounded-full"
            />
            <span>{token.name} ({token.symbol})</span>
          </div>
        ))}
      </div>

      {selectedToken && <p>Selected Token Address: {selectedToken}</p>}
    </div>
  );
}