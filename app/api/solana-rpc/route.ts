import { NextRequest, NextResponse } from 'next/server';

// Enable Edge Runtime (optional, but recommended for better performance)
export const runtime = 'edge';

// Configure dynamic setting to ensure our API route isn't cached
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get the RPC request body
    const body = await request.json();
    
    // Try dRPC first
    const drpcUrl = `${process.env.NEXT_PUBLIC_SOLANA_RPC_BASE}&dkey=${process.env.DRPC_API_KEY}`;
    
    try {
      const drpcResponse = await fetch(drpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Drpc-Key': process.env.DRPC_API_KEY || ''
        },
        body: JSON.stringify(body),
      });
      
      if (!drpcResponse.ok) throw new Error(`dRPC error: ${drpcResponse.status}`);
      
      const data = await drpcResponse.json();
      return NextResponse.json(data);
      
    } catch (drpcError) {
      console.error('dRPC request failed, trying backup:', drpcError);
      
      // Fall back to EXTRNODE
      const backupUrl = process.env.NEXT_PUBLIC_BACKUP_RPC_URL;
      const backupResponse = await fetch(backupUrl as string, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await backupResponse.json();
      return NextResponse.json(data);
    }
    
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
