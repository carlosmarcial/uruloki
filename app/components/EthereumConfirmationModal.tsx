import React from 'react';
import { SolanaModal } from './SolanaModal';
import { XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { formatUnits } from 'viem';
import { ETH_DEFAULT_SLIPPAGE_PERCENTAGE, JUPITER_FEE_BPS } from '@/app/constants';
import { formatDisplayAmount } from '../utils/formatAmount';

interface EthereumConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  sellAmount: string;
  buyAmount: string;
  sellToken: any;
  buyToken: any;
  slippage?: number;
  transactionHash: string | null;
  isLoading?: boolean;
  error?: string | null;
  containerRef?: React.RefObject<HTMLDivElement>;
  transactionStatus?: 'idle' | 'pending' | 'success' | 'rejected' | 'error';
  estimatedGas?: bigint;
  gasPrice?: bigint;
  chainId: number;
}

const getExplorerUrl = (chainId: number, hash: string) => {
  const explorers: { [key: number]: string } = {
    1: 'https://etherscan.io',
    137: 'https://polygonscan.com',
    42161: 'https://arbiscan.io',
    10: 'https://optimistic.etherscan.io',
    43114: 'https://snowtrace.io'
  };
  return `${explorers[chainId] || explorers[1]}/tx/${hash}`;
};

export default function EthereumConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  sellAmount,
  buyAmount,
  sellToken,
  buyToken,
  slippage = ETH_DEFAULT_SLIPPAGE_PERCENTAGE,
  transactionHash,
  isLoading,
  error,
  containerRef,
  transactionStatus = 'idle',
  estimatedGas,
  gasPrice,
  chainId
}: EthereumConfirmationModalProps) {
  
  const renderTransactionStatus = () => {
    switch (transactionStatus) {
      case 'pending':
        return (
          <div className="bg-[#77be44]/20 border border-[#77be44] text-[#77be44] p-4 rounded-lg flex items-center space-x-3">
            <Loader2 className="h-6 w-6 text-[#77be44] animate-spin" />
            <div>
              <p className="font-semibold">Transaction Pending</p>
              <p className="text-sm opacity-80">Waiting for confirmation...</p>
            </div>
          </div>
        );
      case 'rejected':
        return (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg flex items-center space-x-3">
            <XCircle className="h-6 w-6 text-red-500" />
            <div>
              <p className="font-semibold">Transaction Rejected</p>
              <p className="text-sm opacity-80">The transaction was rejected in your wallet</p>
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg">
            <p className="font-semibold">Transaction Failed</p>
            <p className="text-sm opacity-80">{error || 'An error occurred while processing the transaction'}</p>
          </div>
        );
      case 'success':
        return (
          <div className="bg-green-900/50 border border-green-500 text-green-200 p-4 rounded-lg">
            <p className="font-semibold mb-2">Transaction Successful!</p>
            {transactionHash && (
              <a 
                href={getExplorerUrl(chainId, transactionHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline text-sm"
              >
                View on Explorer ↗
              </a>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderGasEstimate = () => {
    if (!estimatedGas || !gasPrice) return null;

    const gasCost = (estimatedGas * gasPrice);
    const gasCostEth = formatUnits(gasCost, 18);

    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Estimated Gas Fee</span>
          <span className="text-white">{Number(gasCostEth).toFixed(6)} ETH</span>
        </div>
      </div>
    );
  };

  return (
    <SolanaModal 
      isOpen={isOpen} 
      onClose={onClose}
      containerRef={containerRef}
      borderColor="#77be44"
    >
      <div className="flex flex-col h-full">
        <div className="flex-none">
          <h2 className="text-xl font-bold mb-6 text-white pt-2">Confirm Swap</h2>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">You Receive</p>
            <p className="text-white text-lg font-semibold">
              {formatDisplayAmount(buyAmount)} {buyToken?.symbol}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">You Pay</p>
            <p className="text-white text-lg font-semibold">
              {formatDisplayAmount(sellAmount)} {sellToken?.symbol}
            </p>
          </div>

          {renderGasEstimate()}

          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Slippage Tolerance</span>
              <span className="text-white">{slippage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Network</span>
              <span className="text-white">Ethereum</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Uruloki Fee</span>
              <span className="text-white">{JUPITER_FEE_BPS / 100}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              A {JUPITER_FEE_BPS / 100}% fee is applied to help maintain and improve our services. 
              These fees are used to buy and burn $TSUKA tokens, reducing the total supply.
            </p>
          </div>

          {renderTransactionStatus()}
        </div>

        <div className="mt-auto pt-4">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading || transactionStatus === 'rejected'}
              className={`flex-1 px-4 py-3 bg-[#77be44] text-white rounded-lg
                ${(isLoading || transactionStatus === 'rejected')
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-[#69aa3b] transition-colors'
                }`}
            >
              {isLoading ? 'Confirming...' : 'Confirm Swap'}
            </button>
          </div>
        </div>
      </div>
    </SolanaModal>
  );
} 