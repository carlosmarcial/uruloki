import { NextRequest, NextResponse } from 'next/server';

// Enable Edge Runtime (optional, but recommended for better performance)
export const runtime = 'edge';

// Configure dynamic setting to ensure our API route isn't cached
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get the RPC request body
    const body = await request.json();
    
    // Construct the RPC URL with the private API key
    const rpcUrl = `${process.env.NEXT_PUBLIC_SOLANA_RPC_BASE}&dkey=${process.env.DRPC_API_KEY}`;
    
    // Forward the request to the actual RPC endpoint
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // Get the response data
    const data = await response.json();
    
    // Return the response
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('RPC request failed:', error);
    return NextResponse.json(
      { error: 'RPC request failed' }, 
      { status: 500 }
    );
  }
}

// Handle GET requests with a proper error
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST for RPC requests.' }, 
    { status: 405 }
  );
}
