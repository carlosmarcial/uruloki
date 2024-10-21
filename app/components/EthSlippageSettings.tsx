import React from 'react';
import { ETH_MIN_SLIPPAGE_PERCENTAGE, ETH_MAX_SLIPPAGE_PERCENTAGE } from '@app/constants';

interface EthSlippageSettingsProps {
  slippage: number;
  setSlippage: (slippage: number) => void;
}

const EthSlippageSettings: React.FC<EthSlippageSettingsProps> = ({ slippage, setSlippage }) => {
  const handleSlippageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0.1 && value <= 50) {
      setSlippage(value);
    }
  };

  return (
    <div className="mt-4">
      <label htmlFor="ethSlippage" className="block text-sm font-medium text-gray-700">
        Ethereum Slippage Tolerance (%)
      </label>
      <input
        type="number"
        id="ethSlippage"
        name="ethSlippage"
        value={slippage}
        onChange={handleSlippageChange}
        min={ETH_MIN_SLIPPAGE_PERCENTAGE}
        max={ETH_MAX_SLIPPAGE_PERCENTAGE}
        step="0.1"
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      />
    </div>
  );
};

export default EthSlippageSettings;
