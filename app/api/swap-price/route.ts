import { NextResponse } from 'next/server';
import axios from 'axios';
import { ZEROX_BASE_URLS, FEE_RECIPIENT, AFFILIATE_FEE, AVALANCHE_CHAIN_ID } from '@/app/constants';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId');
  const sellToken = searchParams.get('sellToken');
  const buyToken = searchParams.get('buyToken');
  const sellAmount = searchParams.get('sellAmount');
  const takerAddress = searchParams.get('takerAddress');

  if (!chainId || !sellToken || !buyToken || !sellAmount || !takerAddress) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  try {
    const baseUrl = ZEROX_BASE_URLS[parseInt(chainId)] || ZEROX_BASE_URLS[1];
    console.log('Using 0x API URL:', baseUrl);

    const response = await axios.get(`${baseUrl}/swap/v1/quote`, {
      params: {
        sellToken,
        buyToken,
        sellAmount,
        takerAddress,
        affiliateAddress: FEE_RECIPIENT,
        affiliateFee: AFFILIATE_FEE,
        skipValidation: false, // Changed to false
        slippagePercentage: '0.01',
      },
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY,
      },
    });

    console.log('0x API Response:', response.data);

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('0x API Error:', error.response?.data || error);
    return NextResponse.json(
      { 
        error: error.response?.data?.values?.message || error.message,
        details: error.response?.data 
      },
      { status: error.response?.status || 500 }
    );
  }
}
