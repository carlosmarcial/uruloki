import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const jupiterPath = pathname.replace('/api/jupiter', '');
  const jupiterUrl = `https://quote-api.jup.ag/v6${jupiterPath}${search}`;

  try {
    const response = await fetch(jupiterUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to Jupiter:', error);
    return NextResponse.json({ error: 'Failed to fetch from Jupiter API' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const jupiterPath = pathname.replace('/api/jupiter', '');
  const jupiterUrl = `https://quote-api.jup.ag/v6${jupiterPath}`;

  try {
    const body = await request.json();
    const response = await fetch(jupiterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to Jupiter:', error);
    return NextResponse.json({ error: 'Failed to fetch from Jupiter API' }, { status: 500 });
  }
}
