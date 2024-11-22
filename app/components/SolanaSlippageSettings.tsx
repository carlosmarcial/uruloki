import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { SOLANA_MIN_SLIPPAGE_BPS, SOLANA_MAX_SLIPPAGE_BPS } from '@app/constants';

interface SolanaSlippageSettingsProps {
  slippage: number;
  onSlippageChange: (value: number) => void;
}

const PRESET_SLIPPAGES = [0.5, 1, 2, 3, 4, 5];

const SolanaSlippageSettings: React.FC<SolanaSlippageSettingsProps> = ({
  slippage,
  onSlippageChange,
}) => {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handleCustomValueChange = (value: string) => {
    setCustomValue(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && 
        numValue >= (SOLANA_MIN_SLIPPAGE_BPS / 100) && 
        numValue <= (SOLANA_MAX_SLIPPAGE_BPS / 100)) {
      onSlippageChange(numValue);
    }
  };

  return (
    <Popover.Root>
      <div className="flex items-center justify-end mb-4">
        <Popover.Trigger asChild>
          <button className="flex items-center text-gray-400 hover:text-white transition-colors">
            <span className="mr-2">Slippage Tolerance {slippage.toFixed(1)}%</span>
            <Settings className="h-4 w-4" />
          </button>
        </Popover.Trigger>
      </div>

      <Popover.Portal>
        <Popover.Content
          className="bg-gray-800 rounded-lg p-4 shadow-lg w-[280px] z-50"
          sideOffset={5}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {PRESET_SLIPPAGES.map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    setIsCustom(false);
                    setCustomValue('');
                    onSlippageChange(value);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${slippage === value && !isCustom
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                  {value}%
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsCustom(true)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isCustom
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
              >
                Custom
              </button>
              {isCustom && (
                <input
                  type="number"
                  value={customValue}
                  onChange={(e) => handleCustomValueChange(e.target.value)}
                  placeholder="0.0"
                  min={SOLANA_MIN_SLIPPAGE_BPS / 100}
                  max={SOLANA_MAX_SLIPPAGE_BPS / 100}
                  step="0.1"
                  className="bg-gray-700 text-white rounded-lg px-3 py-2 w-24 text-sm"
                />
              )}
            </div>

            {isCustom && (
              <p className="text-xs text-gray-400">
                Enter a value between {(SOLANA_MIN_SLIPPAGE_BPS / 100).toFixed(1)}% and {(SOLANA_MAX_SLIPPAGE_BPS / 100).toFixed(1)}%
              </p>
            )}
          </div>

          <Popover.Arrow className="fill-gray-800" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default SolanaSlippageSettings; 