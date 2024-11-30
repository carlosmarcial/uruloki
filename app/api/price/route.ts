import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellToken = searchParams.get('sellToken');
    const buyToken = searchParams.get('buyToken');
    const sellAmount = searchParams.get('sellAmount');
    const chainId = searchParams.get('chainId');
    const taker = searchParams.get('taker');
    const slippageBps = searchParams.get('slippageBps');

    console.log('Price API called with params:', { 
      sellToken, 
      buyToken, 
      sellAmount, 
      chainId, 
      taker,
      slippageBps
    });

    if (!sellToken || !buyToken || !sellAmount || !chainId || !taker) {
      return NextResponse.json({ 
        error: 'Invalid or missing parameters',
        details: { sellToken, buyToken, sellAmount, chainId, taker }
      }, { status: 400 });
    }

    // Determine if we're dealing with a native ETH trade
    const isEthTrade = sellToken.toLowerCase() === 'eth' || buyToken.toLowerCase() === 'eth';
    
    if (isEthTrade) {
      // Use v1 endpoint for ETH trades
      const response = await axios.get('https://api.0x.org/swap/v1/price', {
        params: {
          sellToken: sellToken,
          buyToken: buyToken,
          sellAmount,
          chainId: Number(chainId),
          takerAddress: taker,
          slippagePercentage: Number(slippageBps) / 10000,
          skipValidation: true
        },
        headers: {
          '0x-api-key': process.env.ZEROX_API_KEY
        }
      });

      if (sellToken.toLowerCase() === 'eth') {
        response.data.value = sellAmount;
      }

      return NextResponse.json(response.data);
    } else {
      // Use permit2 endpoint for ERC20-to-ERC20 trades
      const response = await axios.get('https://api.0x.org/swap/permit2/price', {
        params: {
          sellToken: sellToken,
          buyToken: buyToken,
          sellAmount,
          chainId: Number(chainId),
          taker,
          slippageBps: Number(slippageBps)
        },
        headers: {
          '0x-api-key': process.env.ZEROX_API_KEY,
          '0x-version': 'v2'
        }
      });

      return NextResponse.json(response.data);
    }

  } catch (error) {
    console.error('Error fetching price:', error);
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json({ 
        error: 'Error from 0x API',
        details: error.response.data,
        status: error.response.status
      }, { status: error.response.status });
    }
    return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 });
  }
}
