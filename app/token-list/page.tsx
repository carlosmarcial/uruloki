import React, { useState } from 'react';
import UnifiedSwapInterface from '../components/UnifiedSwapInterface';

const TokenListPage: React.FC = () => {
  const [activeChain, setActiveChain] = useState<'ethereum' | 'solana'>('ethereum');

  return (
    <div>
      <h1>Token List and Swap</h1>
      <UnifiedSwapInterface activeChain={activeChain} setActiveChain={setActiveChain} />
    </div>
  );
};

export default TokenListPage;