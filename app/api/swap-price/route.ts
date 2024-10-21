import { NextResponse } from 'next/server';
import axios from 'axios';
import { ETH_ADDRESS } from '@app/constants';

const ZEROX_BASE_URLS: { [chainId: number]: string } = {
  1: 'https://api.0x.org', // Ethereum Mainnet
  137: 'https://polygon.api.0x.org', // Polygon
  10: 'https://optimism.api.0x.org', // Optimism
  42161: 'https://arbitrum.api.0x.org', // Arbitrum
  8453: 'https://base.api.0x.org', // Base
  43114: 'https://avalanche.api.0x.org', // Avalanche
  56: 'https://bsc.api.0x.org', // BSC
  59144: 'https://linea.api.0x.org', // Linea
  5000: 'https://mantle.api.0x.org', // Mantle
  534352: 'https://scroll.api.0x.org', // Scroll
};

export const ETH_DEFAULT_SLIPPAGE_PERCENTAGE = 5; // 5% slippage for Ethereum

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chainIdStr = searchParams.get('chainId');
  const chainId = chainIdStr ? parseInt(chainIdStr, 10) : null;
  const sellToken = searchParams.get('sellToken');
  const buyToken = searchParams.get('buyToken');
  const sellAmount = searchParams.get('sellAmount');
  const takerAddress = searchParams.get('takerAddress');
  const affiliateAddress = searchParams.get('affiliateAddress');
  const affiliateFee = searchParams.get('affiliateFee');
  const ethSlippagePercentage = searchParams.get('ethSlippagePercentage') || '0.01'; // Default to 1% if not provided

  if (!chainId || !sellToken || !buyToken || !sellAmount || !takerAddress) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const baseUrl = ZEROX_BASE_URLS[chainId];
  if (!baseUrl) {
    return NextResponse.json({ error: 'Unsupported chainId' }, { status: 400 });
  }

  if (!process.env.ZEROX_API_KEY) {
    console.error('ZEROX_API_KEY is not set in environment variables');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    console.log('Fetching swap quote with params:', {
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      takerAddress,
      affiliateAddress,
      affiliateFee,
    });

    const response = await axios.get(`${baseUrl}/swap/v1/quote`, {
      params: {
        sellToken: sellToken === ETH_ADDRESS ? 'ETH' : sellToken,
        buyToken: buyToken === ETH_ADDRESS ? 'ETH' : buyToken,
        sellAmount,
        takerAddress,
        affiliateAddress,
        affiliateFee,
        skipValidation: false,
        slippagePercentage: parseFloat(ethSlippagePercentage),
        enableSlippageProtection: true,
      },
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY
      }
    });

    console.log('Swap quote response:', response.data);

    // Add some basic validation
    if (response.data.estimatedGas > 1000000) {
      return NextResponse.json({ error: 'Estimated gas is too high' }, { status: 400 });
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching quote:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      return NextResponse.json({ error: 'Error fetching swap quote', details: error.response.data }, { status: error.response.status });
    }
    return NextResponse.json({ error: 'Error fetching swap quote', message: error.message }, { status: 500 });
  }
}
