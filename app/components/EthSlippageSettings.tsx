import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { ETH_MIN_SLIPPAGE_PERCENTAGE, ETH_MAX_SLIPPAGE_PERCENTAGE } from '@app/constants';

interface EthSlippageSettingsProps {
  slippage: number;
  onSlippageChange: (value: number) => void;
}

const PRESET_SLIPPAGES = [0.5, 1, 2, 3, 4, 5];

const EthSlippageSettings: React.FC<EthSlippageSettingsProps> = ({
  slippage,
  onSlippageChange,
}) => {
  const [customSlippage, setCustomSlippage] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = (value: number) => {
    console.log('Preset slippage button clicked:', value, '%');
    setIsCustom(false);
    setCustomSlippage('');
    onSlippageChange(value);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (!/^\d*\.?\d*$/.test(value)) return;
    
    setCustomSlippage(value);
    setIsCustom(true);
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      console.log('Setting custom slippage:', numValue, '%');
      onSlippageChange(numValue);
    }
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button 
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Slippage settings"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm">Slippage Tolerance {slippage}%</span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="
            bg-[#1a1b1f] rounded-lg p-4 shadow-lg border border-gray-800 w-[280px] z-[9999]
            data-[state=open]:animate-in
            data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0
            data-[state=open]:fade-in-0
            data-[state=closed]:translate-y-2
            data-[state=open]:translate-y-0
            data-[side=bottom]:slide-in-from-top-4
            duration-500
            ease-bounce
          "
          sideOffset={5}
          side="bottom"
          align="start"
          style={{
            zIndex: 9999,
            position: 'relative',
            animation: 'dropIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <style jsx global>{`
            @keyframes dropIn {
              0% {
                opacity: 0;
                transform: translateY(-12px) scale(0.95);
              }
              60% {
                opacity: 0.8;
                transform: translateY(3px) scale(1.01);
              }
              80% {
                opacity: 0.9;
                transform: translateY(-2px) scale(1);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>

          <div 
            className="flex flex-col space-y-4 animate-in fade-in duration-500"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Slippage Tolerance</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {PRESET_SLIPPAGES.map((value) => (
                <button
                  key={value}
                  onClick={() => handlePresetClick(value)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200 ease-in-out
                    ${!isCustom && slippage === value
                      ? 'bg-[#77be44] text-white scale-105'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-102'
                    }
                  `}
                >
                  {value}%
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                value={isCustom ? customSlippage : ''}
                onChange={handleCustomChange}
                placeholder="Custom"
                className="
                  w-full px-3 py-2 
                  bg-gray-800 
                  rounded-lg 
                  text-sm 
                  text-white 
                  placeholder-gray-500
                  focus:outline-none 
                  focus:ring-1 
                  focus:ring-[#77be44]
                  transition-all
                  duration-200
                "
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                %
              </span>
            </div>

            {parseFloat(customSlippage) > ETH_MAX_SLIPPAGE_PERCENTAGE && (
              <p className="text-red-500 text-xs animate-in fade-in duration-200">
                High slippage tolerance. Transaction may be frontrun.
              </p>
            )}
            {parseFloat(customSlippage) < ETH_MIN_SLIPPAGE_PERCENTAGE && customSlippage !== '' && (
              <p className="text-yellow-500 text-xs animate-in fade-in duration-200">
                Your transaction may fail due to low slippage tolerance.
              </p>
            )}
          </div>

          <Popover.Arrow 
            className="fill-[#1a1b1f]"
            width={12}
            height={6}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default EthSlippageSettings;
