import { Connection } from '@solana/web3.js';
import { SOLANA_RPC_ENDPOINTS } from '../constants';

let currentRpcIndex = 0;

export function getNextRpcConnection(): string {
  return 'https://lb.drpc.org/ogrpc?network=solana&dkey=Aur7gfv8L0dekgJlSoIvRq7y9gw0iwIR77gKTgFkVp5jy';
}

// Create an array of endpoints
const rpcEndpoints = [
  SOLANA_RPC_ENDPOINTS.http,
  // Add any additional endpoints here if needed
];

export function getAllConnections(): Connection[] {
  return rpcEndpoints.map((endpoint: string) => 
    new Connection(endpoint, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
      disableRetryOnRateLimit: false,
      httpHeaders: {
        'Content-Type': 'application/json',
      },
    })
  );
}
