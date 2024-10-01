import { LineData } from 'lightweight-charts';

export async function fetchChartData(symbol: string, interval: string): Promise<LineData[]> {
  const apiKey = process.env.NEXT_PUBLIC_COINMARKETCAP_API_KEY;
  const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${symbol}`;

  try {
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

    // CoinMarketCap doesn't provide historical data in this endpoint,
    // so we'll create a single data point for the current price
    return [{
      time: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
      value: quote.price,
    }];
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return []; // Return empty array in case of error
  }
}