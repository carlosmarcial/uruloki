import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
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
  getChartData: () => Promise<any>;
}

const TokenChart = forwardRef<TokenChartRef, TokenChartProps>(({ token, onScreenshot }, ref) => {
  const chartRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    getChartData: async () => {
      // Implement getChartData logic here
      return null;
    }
  }));

  const [chartSymbol, setChartSymbol] = useState('');
  const [chartKey, setChartKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    const updateChartSymbol = async () => {
      if (token.symbol === 'TSUKA') {
        setChartSymbol('GECKOTERMINAL:TSUKAUSD');
      } else {
        const geckoTerminalSymbol = await getGeckoTerminalSymbol(token.symbol);
        setChartSymbol(geckoTerminalSymbol);
      }
      setChartKey(prevKey => prevKey + 1);
    };

    updateChartSymbol();
  }, [token]);

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
          interval="30"
          timezone="Etc/UTC"
          style="1"
          locale="en"
          toolbar_bg="#f1f3f6"
          enable_publishing={false}
          allow_symbol_change={false}
          container_id={`tradingview_chart_${chartKey}`}
          hide_side_toolbar={false}
          hide_legend={false}
          withdateranges={true}
          range="1M"
          studies={[
            "MASimple@tv-basicstudies",
            "RSI@tv-basicstudies",
            "Volume@tv-basicstudies"
          ]}
          ref={widgetRef as any}
        />
      </div>
    </div>
  );
});

TokenChart.displayName = 'TokenChart';

export default TokenChart;

// Helper function to check if a symbol is valid (you need to implement this)
async function isSymbolValid(symbol: string): Promise<boolean> {
  // Implement logic to check if the symbol is valid
  // This might involve making an API call to TradingView or the respective exchange
  // Return true if the symbol is valid, false otherwise
  return true; // Placeholder implementation
}

async function getGeckoTerminalSymbol(tokenSymbol: string): Promise<string> {
  // Implement logic to fetch the correct symbol from GeckoTerminal API
  // This is a placeholder implementation
  return `GECKOTERMINAL:${tokenSymbol}USD`;
}

