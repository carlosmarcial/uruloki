import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellToken = searchParams.get('sellToken');
    const buyToken = searchParams.get('buyToken');
    const sellAmount = searchParams.get('sellAmount');
    const taker = searchParams.get('taker');
    const chainId = searchParams.get('chainId');
    const slippageBps = searchParams.get('slippageBps');

    console.log('Quote API called with params:', { 
      sellToken, 
      buyToken, 
      sellAmount, 
      taker,
      chainId,
      slippageBps
    });

    if (!sellToken || !buyToken || !sellAmount || !taker || !chainId) {
      return NextResponse.json({ 
        error: 'Invalid or missing parameters',
        details: { sellToken, buyToken, sellAmount, taker, chainId }
      }, { status: 400 });
    }

    // Format tokens - use WETH for ETH
    const formattedSellToken = sellToken === 'ETH' ? 'WETH' : sellToken;
    const formattedBuyToken = buyToken === 'ETH' ? 'WETH' : buyToken;

    const response = await axios.get(`https://api.0x.org/swap/permit2/quote`, {
      params: {
        sellToken: formattedSellToken,
        buyToken: formattedBuyToken,
        sellAmount,
        taker,
        chainId: Number(chainId),
        slippageBps: Number(slippageBps)
      },
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY,
        '0x-version': 'v2'
      }
    });

    console.log('0x API quote response:', response.data);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching quote:', error);
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data;
      if (errorData.code === 111 && errorData.reason === "Gas estimation failed") {
        return NextResponse.json({ 
          error: 'Gas estimation failed',
          details: 'The transaction might fail. Please check your balance and try again with a smaller amount.',
          originalError: errorData
        }, { status: 400 });
      }
      return NextResponse.json({ 
        error: 'Error from 0x API',
        details: errorData
      }, { status: error.response.status });
    }
    return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
  }
}
