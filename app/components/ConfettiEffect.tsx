import React, { forwardRef, useImperativeHandle } from 'react';
import ReactCanvasConfetti from 'react-canvas-confetti';

const canvasStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  zIndex: 9999999
} as const;

export interface ConfettiEffectRef {
  fire: () => void;
}

const confettiConfig = {
  angle: 90,
  spread: 360,
  startVelocity: 45,
  elementCount: 200,
  dragFriction: 0.1,
  duration: 4000,
  stagger: 0,
  width: '15px',
  height: '15px',
  colors: ['#9333ea', '#a855f7', '#c084fc', '#e9d5ff', '#ffffff'],
  origin: { x: 0.5, y: 0.5 }
};

const ConfettiEffect = forwardRef<ConfettiEffectRef>((_, ref) => {
  const [confettiInstance, setConfettiInstance] = React.useState<any>(null);

  useImperativeHandle(ref, () => ({
    fire: () => {
      if (confettiInstance?.confetti) {
        // Center burst
        confettiInstance.confetti({
          ...confettiConfig,
          origin: { y: 0.5, x: 0.5 },
          spread: 360
        });

        // Left side burst
        setTimeout(() => {
          confettiInstance.confetti({
            ...confettiConfig,
            origin: { y: 0.7, x: 0.2 },
            spread: 180
          });
        }, 250);

        // Right side burst
        setTimeout(() => {
          confettiInstance.confetti({
            ...confettiConfig,
            origin: { y: 0.7, x: 0.8 },
            spread: 180
          });
        }, 400);
      }
    }
  }));

  const getInstance = React.useCallback((instance: any) => {
    setConfettiInstance(instance);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999999 }}>
      <ReactCanvasConfetti
        onInit={getInstance}
        style={canvasStyles}
        className="pointer-events-none"
      />
    </div>
  );
});

ConfettiEffect.displayName = 'ConfettiEffect';

export default ConfettiEffect; 