import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { JUPITER_QUOTE_API_URL } from '@/app/constants';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jupiterUrl = `${JUPITER_QUOTE_API_URL}?${searchParams.toString()}`;

  try {
    const response = await axios.get(jupiterUrl);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error proxying to Jupiter:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json({ error: error.response?.data || 'Failed to fetch from Jupiter API' }, { status: error.response?.status || 500 });
    }
    return NextResponse.json({ error: 'Failed to fetch from Jupiter API' }, { status: 500 });
  }
}
