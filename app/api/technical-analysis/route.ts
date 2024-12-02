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
- Total Liquidity: ${formatLargeNumber(marketData.liquidity.total)}

Please provide a comprehensive technical analysis focusing on:
1. Price Action Analysis (using price changes across timeframes)
2. Volume Analysis & Trading Activity
3. RSI Interpretation & Market Momentum (including detailed RSI analysis)
4. Market Structure (liquidity, market cap, trading patterns)
5. Short-term Technical Outlook (24-48h)

Important formatting instructions:
1. Provide your analysis in plain text without any markdown formatting, asterisks, or special characters.
2. Use simple numbered sections without any text styling or emphasis markers.
3. Always begin the Price Action Analysis section by stating the current price (${marketData.price.usd}).

Include specific numbers and percentages where relevant. Focus on technical aspects and market structure, with particular attention to the RSI indicators and what they suggest about market momentum.`;

    console.log('Starting streaming analysis for:', token.symbol);

    // Create a new ReadableStream for streaming the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4-1106-preview",
            temperature: 0.7,
            max_tokens: 1000,
            stream: true // Enable streaming
          });

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              // Encode the content as UTF-8 and send it
              const encoder = new TextEncoder();
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      }
    });

    // Return the stream with the appropriate headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
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
