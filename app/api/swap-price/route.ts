import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const ZEROX_API_URL = 'https://api.0x.org/swap/v1/quote';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chainId = searchParams.get('chainId');
    const sellToken = searchParams.get('sellToken');
    const buyToken = searchParams.get('buyToken');
    const sellAmount = searchParams.get('sellAmount');
    const takerAddress = searchParams.get('takerAddress');

    if (!chainId || !sellToken || !buyToken || !sellAmount || !takerAddress) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Handle ETH address properly
    const formattedSellToken = sellToken === 'ETH' ? 
      'ETH' : sellToken;
    const formattedBuyToken = buyToken === 'ETH' ? 
      'ETH' : buyToken;

    console.log('Requesting quote with params:', {
      chainId,
      sellToken: formattedSellToken,
      buyToken: formattedBuyToken,
      sellAmount,
      takerAddress
    });

    const response = await axios.get(ZEROX_API_URL, {
      params: {
        chainId,
        sellToken: formattedSellToken,
        buyToken: formattedBuyToken,
        sellAmount,
        takerAddress,
        slippagePercentage: '0.01', // 1% slippage
        affiliateAddress: process.env.AFFILIATE_ADDRESS,
        skipValidation: true
      },
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY
      }
    });

    // Validate response
    if (!response.data?.to || !response.data?.data) {
      console.error('Invalid response from 0x API:', response.data);
      return NextResponse.json({ error: 'Invalid quote response from 0x API' }, { status: 500 });
    }

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching swap price:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        error: 'Failed to fetch swap price',
        details: error.response?.data || error.message 
      }, 
      { status: error.response?.status || 500 }
    );
  }
}
