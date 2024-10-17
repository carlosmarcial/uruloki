import React from 'react';

interface SwapConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sellAmount: string;
  buyAmount: string;
  sellToken: string;
  buyToken: string;
  slippage: number;
  transactionSignature?: string;
}

const SwapConfirmationModal: React.FC<SwapConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sellAmount,
  buyAmount,
  sellToken,
  buyToken,
  slippage,
  transactionSignature
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Confirm Swap</h2>
        <p>You are about to swap:</p>
        <p className="font-bold">{sellAmount} {sellToken}</p>
        <p>for approximately:</p>
        <p className="font-bold">{buyAmount} {buyToken}</p>
        <p className="mt-2">Slippage tolerance: {slippage}%</p>
        {transactionSignature && (
          <p className="mt-2 text-sm text-gray-500">
            Transaction Signature: {transactionSignature}
          </p>
        )}
        <div className="mt-4 flex justify-end">
          <button
            className="px-4 py-2 bg-gray-200 rounded mr-2"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={onConfirm}
          >
            Confirm Swap
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwapConfirmationModal;
