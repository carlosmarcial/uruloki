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
    const endpoint = '/swap/v1/quote';

    const params = {
      sellToken,
      buyToken,
      sellAmount,
      takerAddress,
      skipValidation: false,
      feeRecipient: FEE_RECIPIENT,
      buyTokenPercentageFee: AFFILIATE_FEE,
      ...(parseInt(chainId) === AVALANCHE_CHAIN_ID && {
        enableSlippageProtection: true,
        slippagePercentage: '0.01',
        intentOnFilling: true,
      }),
    };

    const response = await axios.get(`${baseUrl}${endpoint}`, {
      params,
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY,
      },
    });

    // Validate and format the response
    if (!response.data) {
      throw new Error('Invalid response from 0x API');
    }

    const formattedResponse = {
      ...response.data,
      value: response.data.value || '0',
      gas: response.data.gas || '300000',
      gasPrice: response.data.gasPrice || null,
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error('Error fetching quote:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }
}
