import { LineData } from 'lightweight-charts';

export async function fetchChartData(
  symbol: string, 
  interval: string, 
  tokenAddress?: string, 
  chainId?: number | string
): Promise<LineData[]> {
  try {
    // If we have a token address and chainId, try GeckoTerminal first
    if (tokenAddress && chainId) {
      try {
        const geckoResponse = await fetch(`/api/gecko-terminal?token_address=${tokenAddress}&chainId=${chainId}`);
        const geckoData = await geckoResponse.json();

        if (geckoData?.data?.[0]?.attributes?.price_change_24h) {
          // Format GeckoTerminal data
          return [{
            time: new Date().toISOString().split('T')[0],
            value: parseFloat(geckoData.data[0].attributes.price_change_24h)
          }];
        }
      } catch (error) {
        console.warn('GeckoTerminal fetch failed, falling back to CoinMarketCap:', error);
      }
    }

    // Fallback to CoinMarketCap
    const apiKey = process.env.NEXT_PUBLIC_COINMARKETCAP_API_KEY;
    const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${symbol}`;

    const response = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey as string,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const quote = data.data[symbol][0].quote.USD;

    return [{
      time: new Date().toISOString().split('T')[0],
      value: quote.price,
    }];
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return []; // Return empty array in case of error
  }
}