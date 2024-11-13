import React, { useState } from 'react';
import { SolanaModal } from './SolanaModal';

interface SwapConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  sellAmount: string;
  buyAmount: string;
  sellToken: string;
  buyToken: string;
  slippage: number;
  transactionSignature: string | null;
  isLoading?: boolean;
  error?: string | null;
}

export default function SwapConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  sellAmount,
  buyAmount,
  sellToken,
  buyToken,
  slippage,
  transactionSignature,
  isLoading,
  error
}: SwapConfirmationModalProps) {
  return (
    <SolanaModal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Confirm Swap</h2>
        
        <div className="space-y-4">
          <div>
            <p>Selling: {sellAmount} {sellToken}</p>
            <p>Buying: {buyAmount} {buyToken}</p>
            <p>Slippage Tolerance: {slippage}%</p>
          </div>

          {error && (
            <div className="text-red-500 p-2 rounded bg-red-100">
              {error}
            </div>
          )}

          {transactionSignature && (
            <div className="text-green-500">
              <p>Transaction successful!</p>
              <a 
                href={`https://solscan.io/tx/${transactionSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View on Solscan
              </a>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
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
