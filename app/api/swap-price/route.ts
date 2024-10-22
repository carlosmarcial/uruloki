import { NextResponse } from 'next/server';
import axios from 'axios';
import { ETH_ADDRESS, WETH_ADDRESS } from '@app/constants';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let sellToken = searchParams.get('sellToken');
    let buyToken = searchParams.get('buyToken');
    const sellAmount = searchParams.get('sellAmount');
    const takerAddress = searchParams.get('takerAddress');
    const slippagePercentage = searchParams.get('slippagePercentage');

    if (!sellToken || !buyToken || !sellAmount || !takerAddress) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Replace WETH with ETH for the API request
    if (sellToken === WETH_ADDRESS) sellToken = ETH_ADDRESS;
    if (buyToken === WETH_ADDRESS) buyToken = ETH_ADDRESS;

    const apiUrl = `https://api.0x.org/swap/v1/quote`;

    const response = await axios.get(apiUrl, {
      params: {
        sellToken,
        buyToken,
        sellAmount,
        takerAddress,
        slippagePercentage,
        affiliateAddress: process.env.AFFILIATE_ADDRESS,
        skipValidation: true,
      },
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY,
      },
    });

    // Forward all fields from the 0x API response
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching quote:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Error fetching quote', details: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }
}
