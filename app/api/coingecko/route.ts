import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  const endpoint = request.nextUrl.searchParams.get('endpoint');
  const contract_addresses = request.nextUrl.searchParams.get('contract_addresses');
  const vs_currencies = request.nextUrl.searchParams.get('vs_currencies');

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
  }

  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const response = await axios.get(`${COINGECKO_API_URL}/${endpoint}`, {
        params: {
          contract_addresses,
          vs_currencies,
        },
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      return NextResponse.json(response.data);
    } catch (error: any) {
      if (error.response?.status === 429) {
        // Rate limit hit - wait and retry
        retries++;
        if (retries < MAX_RETRIES) {
          await sleep(RETRY_DELAY * retries);
          continue;
        }
      }
      console.error('Error fetching data from CoinGecko:', error);
      return NextResponse.json(
        { error: 'Error fetching data from CoinGecko' }, 
        { status: error.response?.status || 500 }
      );
    }
  }

  return NextResponse.json(
    { error: 'Max retries reached for CoinGecko API' }, 
    { status: 429 }
  );
}