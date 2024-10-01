import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import dynamic from 'next/dynamic';

const AdvancedRealTimeChart = dynamic(
  () => import('react-ts-tradingview-widgets').then((w) => w.AdvancedRealTimeChart),
  { ssr: false }
);

interface Token {
  name: string;
  symbol: string;
  address: string;
}

interface TokenChartProps {
  token: Token;
  onScreenshot: (imageData: string) => void;
}

export interface TokenChartRef {
  takeScreenshot: () => void;
}

const TokenChart = forwardRef<TokenChartRef, TokenChartProps>(({ token, onScreenshot }, ref) => {
  const [chartSymbol, setChartSymbol] = useState('MEXC:TSUKAUSDT');
  const [chartKey, setChartKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    if (token.symbol === 'TSUKA') {
      setChartSymbol('MEXC:TSUKAUSDT');
    } else {
      setChartSymbol(`BINANCE:${token.symbol}USDT`);
    }
    setChartKey(prevKey => prevKey + 1);
  }, [token]);

  useImperativeHandle(ref, () => ({
    takeScreenshot: () => {
      if (containerRef.current) {
        const iframe = containerRef.current.querySelector('iframe');
        if (iframe) {
          // Send a message to the iframe to request a screenshot
          iframe.contentWindow?.postMessage({ action: 'takeScreenshot' }, '*');
        } else {
          console.error("Iframe not found");
        }
      } else {
        console.error("Container reference is not available");
      }
    },
    getChartData: () => {
      return new Promise((resolve) => {
        if (widgetRef.current) {
          const widget = widgetRef.current;
          widget.onChartReady(() => {
            const chart = widget.activeChart();
            const symbolInfo = chart.symbolInfo();
            const visibleRange = chart.getVisibleRange();
            const resolution = chart.resolution();
            
            chart.exportData({
              from: visibleRange.from,
              to: visibleRange.to,
              includeTime: true,
              includeSeries: true,
              includeStudies: true,
            }).then((data) => {
              resolve({
                symbol: symbolInfo.name,
                timeframe: resolution,
                data: data
              });
            });
          });
        } else {
          resolve(null);
        }
      });
    }
  }));

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.action === 'screenshotTaken') {
        onScreenshot(event.data.imageData);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onScreenshot]);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col">
      <div className="flex-grow chart-container">
        <AdvancedRealTimeChart
          key={chartKey}
          symbol={chartSymbol}
          theme="dark"
          autosize
          interval="D"
          timezone="Etc/UTC"
          style="1"
          locale="en"
          toolbar_bg="#f1f3f6"
          enable_publishing={false}
          allow_symbol_change={false}
          container_id={`tradingview_chart_${chartKey}`}
          hide_side_toolbar={false}
          hide_legend={false}
          withdateranges={false}
          range="1M"
          studies={[
            "MASimple@tv-basicstudies",
            "RSI@tv-basicstudies"
          ]}
        />
      </div>
    </div>
  );
});

TokenChart.displayName = 'TokenChart';

export default TokenChart;
