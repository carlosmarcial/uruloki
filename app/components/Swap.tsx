import React, { useState } from 'react';

interface SwapProps {
  network: string;
}

const Swap: React.FC<SwapProps> = ({ network }) => {
  const [sellAmount, setSellAmount] = useState<string>('');
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [sellToken, setSellToken] = useState<string>('ETH');
  const [buyToken, setBuyToken] = useState<string>('DAI');

  const handleSwap = () => {
    console.log('Swap initiated');
  };

  return (
    <div className="bg-white rounded-lg shadow-md w-full h-full flex flex-col p-2">
      <h2 className="text-lg font-semibold mb-2">{network} Swap</h2>
      
      <div className="flex-grow flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex flex-col">
            <label htmlFor="sellAmount" className="text-xs font-medium mb-1">Sell</label>
            <div className="flex items-center">
              <input
                type="number"
                id="sellAmount"
                className="border rounded-l p-1 text-sm flex-grow"
                placeholder="0.00"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
              />
              <div className="border border-l-0 rounded-r p-1 flex items-center justify-center w-8">
                <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                <select 
                  className="absolute opacity-0 w-8 h-8"
                  value={sellToken}
                  onChange={(e) => setSellToken(e.target.value)}
                >
                  <option value="ETH"></option>
                  <option value="BTC"></option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <label htmlFor="buyAmount" className="text-xs font-medium mb-1">Buy</label>
            <div className="flex items-center">
              <input
                type="number"
                id="buyAmount"
                className="border rounded-l p-1 text-sm flex-grow"
                placeholder="0.00"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
              />
              <div className="border border-l-0 rounded-r p-1 flex items-center justify-center w-8">
                <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                <select 
                  className="absolute opacity-0 w-8 h-8"
                  value={buyToken}
                  onChange={(e) => setBuyToken(e.target.value)}
                >
                  <option value="DAI"></option>
                  <option value="USDC"></option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <button 
          className="bg-blue-500 text-white rounded-lg py-1 px-4 mt-2 w-full hover:bg-blue-600 transition-colors text-sm"
          onClick={handleSwap}
        >
          SWAP
        </button>
      </div>
    </div>
  );
};

export default Swap;