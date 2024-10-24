import { NextResponse } from 'next/server';
import axios from 'axios';
import { ZEROX_BASE_URLS, FEE_RECIPIENT, AFFILIATE_FEE } from '@/app/constants';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId');
  const sellToken = searchParams.get('sellToken');
  const buyToken = searchParams.get('buyToken');
  const sellAmount = searchParams.get('sellAmount');

  try {
    // Use different endpoints based on chain
    const baseUrl = ZEROX_BASE_URLS[parseInt(chainId)] || ZEROX_BASE_URLS[1];
    const endpoint = '/swap/v1/quote'; // Use quote endpoint for all chains

    // Log the request parameters
    console.log('Requesting quote with params:', {
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      feeRecipient: FEE_RECIPIENT,
      buyTokenPercentageFee: AFFILIATE_FEE
    });

    const response = await axios.get(`${baseUrl}${endpoint}`, {
      params: {
        sellToken,
        buyToken,
        sellAmount,
        skipValidation: true,
        feeRecipient: FEE_RECIPIENT,
        buyTokenPercentageFee: AFFILIATE_FEE,
      },
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY,
      },
    });

    // Log the complete response for debugging
    console.log('0x API Response:', {
      to: response.data.to,
      data: response.data.data?.slice(0, 66) + '...',
      value: response.data.value,
      gas: response.data.gas,
      buyAmount: response.data.buyAmount,
      estimatedGas: response.data.estimatedGas,
      chainId: response.data.chainId,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching quote:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }
}
