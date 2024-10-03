import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const response = await fetch(`https://api.0x.org/swap/v1/quote?${searchParams}`, {
    headers: {
      '0x-api-key': process.env.NEXT_PUBLIC_ZEROEX_API_KEY || '',
    },
  });

  const data = await response.json();
  return NextResponse.json(data);
}
