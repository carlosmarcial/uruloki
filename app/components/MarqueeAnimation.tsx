'use client';

import React, { ReactNode, useRef, useEffect, useState } from "react";

interface MarqueeProps {
  children: ReactNode;
  speed?: number;
  direction?: "left" | "right";
}

const Marquee: React.FC<MarqueeProps> = ({
  children,
  speed = 20,
  direction = "left",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const updateMeasurements = () => {
      if (contentRef.current && containerRef.current) {
        const cWidth = containerRef.current.offsetWidth;
        const singleContentWidth = contentRef.current.offsetWidth;
        setContentWidth(singleContentWidth);
        setContainerWidth(cWidth);
      }
    };

    updateMeasurements();
    window.addEventListener('resize', updateMeasurements);
    return () => window.removeEventListener('resize', updateMeasurements);
  }, [children]);

  const animationDuration = `${(contentWidth + containerWidth) / speed}s`;

  return (
    <div className="relative overflow-hidden">
      {/* Main Color Gradient */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-mask"
        style={{
          background: `linear-gradient(90deg, 
            #77be44 0%,
            #efb71b 100%
          )`,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 1250ms ease-in'
        }}
      />

      {/* Marquee Content */}
      <div className="relative z-10">
        <div ref={containerRef} className="whitespace-nowrap opacity-mask">
          <div 
            className="inline-block animate-marquee"
            style={{
              animationDuration,
              animationDirection: direction === "left" ? "normal" : "reverse",
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              opacity: isVisible ? 1 : 0,
              transition: 'opacity 1s ease-in'
            }}
          >
            <div ref={contentRef} className="inline-block">
              <div className="bg-[#1a1b1f] text-transparent bg-clip-text font-bold py-2">
                {children}
              </div>
            </div>
            <div className="inline-block">
              <div className="bg-[#1a1b1f] text-transparent bg-clip-text font-bold py-2">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation-name: marquee;
          will-change: transform;
        }
        .opacity-mask {
          -webkit-mask-image: linear-gradient(90deg, transparent, white 15%, white 85%, transparent);
          mask-image: linear-gradient(90deg, transparent, white 15%, white 85%, transparent);
        }
      `}</style>
    </div>
  );
};

export default Marquee;