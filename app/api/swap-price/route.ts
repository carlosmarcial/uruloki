import { NextResponse } from 'next/server';
import axios from 'axios';
import { ZEROX_API_URL } from '@/app/constants';

const headers = {
  '0x-api-key': process.env.ZEROX_API_KEY || '',
  '0x-version': 'v2'
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get required parameters
    const chainId = searchParams.get('chainId');
    let sellToken = searchParams.get('sellToken');
    let buyToken = searchParams.get('buyToken');
    const sellAmount = searchParams.get('sellAmount');
    const taker = searchParams.get('takerAddress');
    const affiliateAddress = searchParams.get('affiliateAddress');
    const affiliateFee = searchParams.get('affiliateFee');

    if (!chainId || !sellToken || !buyToken || !sellAmount || !taker) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    // Handle native token addresses
    if (buyToken === '0x0000000000000000000000000000000000001010') {
      buyToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
    }
    if (sellToken === '0x0000000000000000000000000000000000001010') {
      sellToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
    }

    // Build 0x API v2 parameters
    const params = {
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      taker,
      ...(affiliateAddress && affiliateFee ? {
        swapFeeRecipient: affiliateAddress,
        swapFeeBps: Math.floor(parseFloat(affiliateFee) * 100).toString(),
        swapFeeToken: buyToken
      } : {}),
      slippageBps: '100' // 1% default slippage
    };

    // Call 0x API v2 endpoint
    const response = await axios.get(`${ZEROX_API_URL}/swap/permit2/quote`, {
      params,
      headers
    });

    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error('Error in swap-price route:', error.response?.data || error);
    return NextResponse.json({ 
      error: error.response?.data?.reason || 'Failed to fetch quote',
      details: error.response?.data || error.message
    }, { status: error.response?.status || 500 });
  }
}
