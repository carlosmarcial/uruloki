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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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
          <div className="inline-flex marquee-container">
            <div className="animate-marquee flex">
              <div className="flex-shrink-0">
                <div className="bg-[#1a1b1f] text-transparent bg-clip-text font-bold py-2">
                  {children}
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-[#1a1b1f] text-transparent bg-clip-text font-bold py-2">
                  {children}
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-[#1a1b1f] text-transparent bg-clip-text font-bold py-2">
                  {children}
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-[#1a1b1f] text-transparent bg-clip-text font-bold py-2">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .marquee-container {
          width: 100%;
          display: inline-flex;
        }
        
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-25%);
          }
        }

        .animate-marquee {
          animation: marquee ${1000/speed}s linear infinite;
          will-change: transform;
        }

        .opacity-mask {
          -webkit-mask-image: linear-gradient(90deg, transparent, white 2%, white 98%, transparent);
          mask-image: linear-gradient(90deg, transparent, white 2%, white 98%, transparent);
        }
      `}</style>
    </div>
  );
};

export default Marquee;