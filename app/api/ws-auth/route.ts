import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const wsUrl = `${process.env.NEXT_PUBLIC_SOLANA_WS_BASE}&dkey=${process.env.DRPC_API_KEY}`;
    new URL(wsUrl);
    return NextResponse.json({ url: wsUrl });
  } catch (error) {
    console.error('WS Auth error:', error);
    return NextResponse.json(
      { error: 'Failed to generate WebSocket URL' }, 
      { status: 500 }
    );
  }
} 