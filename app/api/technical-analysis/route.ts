import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function formatLargeNumber(value: string): string {
  // Remove any existing formatting first
  const numStr = value.replace(/[^0-9.-]/g, '');
  const num = parseFloat(numStr);
  
  // If it's not a valid number, return the original string
  if (isNaN(num)) return value;
  
  // Format with commas and no decimal places
  return `$${Math.round(num).toLocaleString('en-US')}`;
}

interface Pool {
  name: string;
  dex: string;
  liquidity: string;
}

// Add this timeout utility
const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const maxDuration = 60; // Set route handler timeout to 60 seconds

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, marketData } = body;

    // Validate required data
    if (!marketData?.price?.current || !marketData?.volume?.current24h) {
      throw new Error('Missing required market data');
    }

    // Format RSI data for the prompt
    const rsiSection = marketData.technical.rsi ? `
RSI Analysis:
- Current RSI (14): ${marketData.technical.rsi.value}
- Interpretation: ${marketData.technical.rsi.interpretation}
- Technical Details:
  • Average Gain: ${marketData.technical.rsi.details.averageGain}
  • Average Loss: ${marketData.technical.rsi.details.averageLoss}
  • Relative Strength: ${marketData.technical.rsi.details.relativeStrength}
- Period: ${marketData.technical.rsi.period}
- Data Points Used: ${marketData.technical.rsi.dataPoints}` : 'RSI data not available';

    const prompt = `Analyze the following cryptocurrency token:
Name: ${token.name} (${token.symbol})
Network: ${token.network}

Price Data:
- Current Price: ${marketData.price.usd}
- 24h Change: ${marketData.price.change24h}
- Price Changes:
  • 1h: ${marketData.price.changes['1h']}
  • 6h: ${marketData.price.changes['6h']}
  • 24h: ${marketData.price.changes['24h']}

${rsiSection}

Volume Analysis:
- 24h Volume: ${formatLargeNumber(marketData.volume.current24h)}
- Volume Change: ${marketData.volume.change24h}
- Volume Breakdown:
  • Last Hour: ${formatLargeNumber(marketData.volume.breakdown.last1h)}
  • Last 6 Hours: ${formatLargeNumber(marketData.volume.breakdown.last6h)}
  • Last 24 Hours: ${formatLargeNumber(marketData.volume.breakdown.last24h)}

Trading Activity:
- Transactions (24h): ${marketData.transactions.last24h.total} trades
- Buys: ${marketData.transactions.last24h.buys}
- Sells: ${marketData.transactions.last24h.sells}
- Buy/Sell Ratio: ${marketData.transactions.buyRatio}
- Unique Buyers: ${marketData.transactions.last24h.uniqueBuyers}
- Unique Sellers: ${marketData.transactions.last24h.uniqueSellers}

Market Metrics:
- Market Cap: ${formatLargeNumber(marketData.liquidity.marketCap)}
- FDV: ${formatLargeNumber(marketData.liquidity.fdv)}
- Total DEX Liquidity: ${formatLargeNumber(marketData.liquidity.total)}
- Liquidity/Market Cap Ratio: ${((Number(marketData.liquidity.total.replace(/[^0-9.-]/g, '')) / Number(marketData.liquidity.marketCap.replace(/[^0-9.-]/g, ''))) * 100).toFixed(2)}%
- Top Liquidity Pools:
${marketData.liquidity.topPools.map((pool: Pool) => `  • ${pool.name} (${pool.dex}): ${pool.liquidity}`).join('\n')}

Please provide a comprehensive technical analysis focusing on:
1. Price Action Analysis (using price changes across timeframes)
2. Volume Analysis & Trading Activity
3. RSI Interpretation & Market Momentum (including detailed RSI analysis)
4. Market Structure (focusing on market cap, liquidity ratios, and market efficiency)
5. Short-term Technical Outlook (24-48h)
6. Disclaimer

Important formatting instructions:
1. Each section MUST start with its number and title on a new line (e.g., "1. Price Action Analysis")
2. Add TWO line breaks after each section heading
3. Add ONE line break between paragraphs
4. Format bullet points with the "•" symbol, one per line
5. The Disclaimer section MUST follow this exact format:

6. Disclaimer

IMPORTANT: This analysis is based exclusively on decentralized exchange (DEX) data and does not include any data from centralized exchanges. All trading volumes, liquidity figures, and market metrics presented here reflect DEX activity only, which may differ significantly from the total market picture.

Additional disclaimers:
• This technical analysis is provided for informational purposes only and should not be considered as financial advice
• Cryptocurrency investments carry high market risk
• Past performance does not guarantee future results
• Always conduct your own research and consult with qualified financial advisors before making any investment decisions
• Uruloki DEX's AI analysis tool is designed to provide market insights but should not be the sole basis for any trading decisions

Please ensure each section follows this structure:

1. Section Title

Main paragraph with analysis.

• Key point one
• Key point two
• Key point three

Follow-up paragraph if needed.`;

    console.log('Starting streaming analysis for:', token.symbol);

    // Update the streaming implementation
    const stream = new ReadableStream({
      async start(controller) {
        let timeoutId: NodeJS.Timeout | undefined;

        try {
          // Increase the timeout for OpenAI
          const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4-1106-preview",
            temperature: 0.7,
            max_tokens: 2500,
            stream: true,
          }, {
            timeout: 50000, // 50 second timeout for OpenAI
          });

          let fullResponse = '';
          let chunkCount = 0;

          for await (const chunk of completion) {
            // Reset timeout on each chunk
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              controller.error(new Error('Stream timeout'));
            }, 10000); // 10 second timeout between chunks

            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              const encoder = new TextEncoder();
              controller.enqueue(encoder.encode(content));
              chunkCount++;

              // Every 10 chunks, verify we're getting a complete response
              if (chunkCount % 10 === 0) {
                const sections = fullResponse.split(/\d+\./);
                if (sections.length >= 6) {
                  // We have all sections, clear timeout
                  if (timeoutId) clearTimeout(timeoutId);
                }
              }
            }
          }

          if (timeoutId) clearTimeout(timeoutId);
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          if (timeoutId) clearTimeout(timeoutId);
          const errorMessage = error instanceof Error ? error.message : 'An error occurred';
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(`\n\nError: ${errorMessage}`));
          controller.close();
        }
      }
    });

    // Return with appropriate headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Transfer-Encoding': 'chunked'
      }
    });

  } catch (error) {
    console.error('Error generating analysis:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate analysis' },
      { status: 500 }
    );
  }
} 
