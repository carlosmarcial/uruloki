import { NextResponse } from 'next/server';
import axios from 'axios';
import { ZEROX_API_URLS, ZEROX_API_VERSIONS } from '@/app/constants';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const chainId = Number(searchParams.get('chainId'));
    const sellToken = searchParams.get('sellToken');
    const buyToken = searchParams.get('buyToken');
    const sellAmount = searchParams.get('sellAmount');
    const takerAddress = searchParams.get('takerAddress');
    const affiliateAddress = searchParams.get('affiliateAddress');
    const affiliateFee = searchParams.get('affiliateFee');

    if (!chainId || !sellToken || !buyToken || !sellAmount || !takerAddress) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    const apiUrl = ZEROX_API_URLS[chainId];
    const apiVersion = ZEROX_API_VERSIONS[chainId];

    if (!apiUrl) {
      return NextResponse.json({ 
        error: `Unsupported chain ID: ${chainId}` 
      }, { status: 400 });
    }

    // Different endpoint and params based on API version
    const endpoint = apiVersion === 'v2' ? '/swap/v1/quote' : '/swap/v1/quote';
    
    const params = apiVersion === 'v2' ? {
      // v2 parameters
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      taker: takerAddress,
      affiliateAddress,
      affiliateFee,
      enableSlippageProtection: false
    } : {
      // v1 parameters
      sellToken,
      buyToken,
      sellAmount,
      takerAddress,
      affiliateAddress,
      affiliateFee,
      slippagePercentage: '0.01'
    };

    const headers = {
      '0x-api-key': process.env.ZEROX_API_KEY || '',
      Accept: 'application/json'
    };

    console.log('Sending request to 0x API:', {
      url: `${apiUrl}${endpoint}`,
      params,
      headers
    });

    const response = await axios.get(`${apiUrl}${endpoint}`, {
      params,
      headers
    });

    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error('Error in swap-price route:', error.response?.data || error);
    return NextResponse.json({ 
      error: error.response?.data?.reason || 'Failed to fetch quote',
      details: error.response?.data
    }, { status: error.response?.status || 500 });
  }
}
