import React, { useCallback, useRef, useEffect } from 'react';
import { SolanaModal } from './SolanaModal';
import { DEFAULT_SLIPPAGE_BPS, JUPITER_FEE_BPS } from '@/app/constants';
import { XCircle, CheckCircle, Loader2 } from 'lucide-react';

interface SwapConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  sellAmount: string;
  buyAmount: string;
  sellToken: string;
  buyToken: string;
  slippage?: number;
  transactionSignature: string | null;
  isLoading?: boolean;
  error?: string | null;
  containerRef?: React.RefObject<HTMLDivElement>;
  transactionStatus?: 'idle' | 'pending' | 'success' | 'rejected' | 'error';
}

// Helper function to format numbers with commas
const formatNumberWithCommas = (value: string) => {
  const [wholePart, decimalPart] = value.split('.');
  const formattedWholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimalPart ? `${formattedWholePart}.${decimalPart}` : formattedWholePart;
};

// Add these status-specific styles
const getStatusStyles = (status: string) => {
  switch (status) {
    case 'success':
      return 'text-green-500 font-bold';
    case 'error':
      return 'text-red-500 font-bold';
    case 'pending':
      return 'text-yellow-500 animate-pulse';
    default:
      return 'text-gray-400';
  }
};

export default function SwapConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  sellAmount,
  buyAmount,
  sellToken,
  buyToken,
  slippage = DEFAULT_SLIPPAGE_BPS / 100,
  transactionSignature,
  isLoading,
  error,
  containerRef,
  transactionStatus = 'idle'
}: SwapConfirmationModalProps) {
  const renderTransactionStatus = () => {
    switch (transactionStatus) {
      case 'pending':
        return (
          <div className="bg-purple-900/50 border border-purple-500 text-purple-200 p-4 rounded-lg flex items-center space-x-3">
            <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
            <div>
              <p className="font-semibold">Transaction Pending</p>
              <p className="text-sm opacity-80">Waiting for confirmation...</p>
            </div>
          </div>
        );
      case 'success':
        return (
          <div className="bg-purple-900/50 border border-purple-500 text-purple-200 p-4 rounded-lg flex items-center space-x-3 relative overflow-hidden">
            <div className="relative z-10 flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-purple-500" />
              <div>
                <p className="font-semibold mb-2">Transaction Successful! 🎉</p>
                {transactionSignature && (
                  <a 
                    href={`https://solscan.io/tx/${transactionSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline text-sm"
                  >
                    View on Solscan ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg flex items-center space-x-3">
            <XCircle className="h-6 w-6 text-red-500" />
            <div>
              <p className="font-semibold">Transaction Failed</p>
              <p className="text-sm opacity-80">{error || 'An error occurred while processing the transaction'}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <SolanaModal 
      isOpen={isOpen} 
      onClose={onClose}
      containerRef={containerRef}
      showConfetti={transactionStatus === 'success'}
    >
      <div className="h-full flex flex-col">
        <h2 className="text-xl font-bold mb-6 text-white pt-2">Confirm Swap</h2>
        
        <div className="flex-1 space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">You Receive</p>
            <p className="text-white text-lg font-semibold">
              {formatNumberWithCommas(buyAmount)} {buyToken}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">You Pay</p>
            <p className="text-white text-lg font-semibold">
              {formatNumberWithCommas(sellAmount)} {sellToken}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Slippage Tolerance</span>
              <span className="text-white">{slippage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Uruloki Fee</span>
              <span className="text-white">{JUPITER_FEE_BPS / 100}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Network</span>
              <span className="text-white">Solana</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              A {JUPITER_FEE_BPS / 100}% fee is applied to help maintain and improve our services
            </p>
          </div>

          {renderTransactionStatus()}
        </div>

        <div className="mt-auto pt-4">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              disabled={transactionStatus === 'pending'}
            >
              {transactionStatus === 'success' ? 'Close' : 'Cancel'}
            </button>
            {transactionStatus !== 'success' && (
              <button
                onClick={onConfirm}
                disabled={isLoading || transactionStatus === 'pending'}
                className={`flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg
                  ${(isLoading || transactionStatus === 'pending')
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-purple-600 transition-colors'
                  }`}
              >
                {transactionStatus === 'pending' ? 'Confirming...' : 'Confirm Swap'}
              </button>
            )}
          </div>
        </div>
      </div>
    </SolanaModal>
  );
}
