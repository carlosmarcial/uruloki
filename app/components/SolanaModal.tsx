import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import ConfettiEffect, { ConfettiEffectRef } from './ConfettiEffect';
import { AnimatePresence, motion } from 'framer-motion';

interface SolanaModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement>;
  showConfetti?: boolean;
  borderColor?: string;
}

export function SolanaModal({ 
  isOpen, 
  onClose, 
  children, 
  containerRef,
  showConfetti = false,
  borderColor = '#9333ea'
}: SolanaModalProps) {
  const [modalStyle, setModalStyle] = useState<React.CSSProperties>({});
  const confettiRef = useRef<ConfettiEffectRef>(null);

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

  useEffect(() => {
    if (showConfetti && confettiRef.current) {
      confettiRef.current.fire();
    }
  }, [showConfetti]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
          >
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={onClose}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                duration: 0.2,
                ease: "easeOut"
              }}
              style={{
                ...modalStyle,
                borderColor: `${borderColor}33`
              }} 
              className="bg-gray-900/95 rounded-lg backdrop-blur-sm shadow-xl border"
            >
              <div className="h-full p-4 flex flex-col relative">
                <ConfettiEffect ref={confettiRef} />
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
                {children}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}