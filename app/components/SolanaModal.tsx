import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface SolanaModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export function SolanaModal({ isOpen, onClose, children, containerRef }: SolanaModalProps) {
  const [modalStyle, setModalStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const updateModalPosition = () => {
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setModalStyle({
          position: 'fixed',
          top: rect.top,
          left: rect.left,
          width: rect.width,
          minHeight: rect.height,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
        });
      }
    };

    if (isOpen) {
      updateModalPosition();
      window.addEventListener('resize', updateModalPosition);
    }

    return () => {
      window.removeEventListener('resize', updateModalPosition);
    };
  }, [isOpen, containerRef]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div 
        style={modalStyle} 
        className="bg-gray-900/95 rounded-lg backdrop-blur-sm shadow-xl border border-purple-500/20"
      >
        <div className="h-full p-4 flex flex-col relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
} 