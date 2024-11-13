import React from 'react';
import { X } from 'lucide-react';

interface SolanaModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function SolanaModal({ isOpen, onClose, children }: SolanaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className="relative z-50 bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>
        {children}
      </div>
    </div>
  );
} 