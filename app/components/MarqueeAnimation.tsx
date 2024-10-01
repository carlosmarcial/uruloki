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
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div className="marquee-wrapper">
      <div ref={containerRef} className="marquee-container">
        <div 
          className="marquee-content"
          style={{
            animationDuration,
            animationDirection: direction === "left" ? "normal" : "reverse"
          }}
        >
          <div ref={contentRef} className="marquee-item">{children}</div>
          <div className="marquee-item">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Marquee;