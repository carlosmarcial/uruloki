import { Connection, PublicKey, Transaction, TransactionSignature, Commitment, VersionedTransaction, BlockheightBasedTransactionConfirmationStrategy } from '@solana/web3.js';

// Create backup connection
const backupConnection = new Connection(process.env.NEXT_PUBLIC_BACKUP_RPC_URL as string);

export function getConnection(commitment: Commitment = 'confirmed'): Connection {
  try {
    // Primary dRPC connection
    return new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_BASE as string, {
      commitment,
      wsEndpoint: process.env.NEXT_PUBLIC_SOLANA_WS_BASE,
      fetch: async (url, options) => {
        try {
          const response = await fetch('/api/solana-rpc', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: options?.body,
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          return response;
        } catch (error) {
          console.error('dRPC request failed, falling back to backup:', error);
          // Fall back to backup RPC
          const backupResponse = await fetch(process.env.NEXT_PUBLIC_BACKUP_RPC_URL as string, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: options?.body,
          });
          return backupResponse;
        }
      },
    });
  } catch (error) {
    console.error('Failed to create dRPC connection, using backup:', error);
    return backupConnection;
  }
}

export function getWebSocketEndpoint(): string {
  try {
    return process.env.NEXT_PUBLIC_SOLANA_WS_BASE as string;
  } catch (error) {
    console.error('Failed to get dRPC WebSocket endpoint, using backup:', error);
    return process.env.NEXT_PUBLIC_BACKUP_WS_URL as string;
  }
}

export const sendAndConfirmTransactionWithRetry = async (
  connection: Connection,
  signedTransaction: VersionedTransaction,
  maxRetries = 3,
  commitment: Commitment = 'confirmed'
): Promise<TransactionSignature> => {
  let retries = 0;
  let lastError;
  
  while (retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1} to send and confirm transaction`);
      
      // Try primary dRPC first
      try {
        const rawTransaction = signedTransaction.serialize();
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        
        const signature = await connection.sendRawTransaction(rawTransaction, {
          skipPreflight: true,
          maxRetries: 2,
        });
        
        console.log(`Transaction sent with signature: ${signature}`);

        const confirmationStrategy: BlockheightBasedTransactionConfirmationStrategy = {
          blockhash,
          lastValidBlockHeight,
          signature
        };

        const confirmation = await connection.confirmTransaction(
          confirmationStrategy,
          commitment
        );

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
        }

        return signature;

      } catch (primaryError) {
        console.warn('Primary dRPC failed, trying backup:', primaryError);
        
        // Fall back to backup RPC
        const { blockhash, lastValidBlockHeight } = await backupConnection.getLatestBlockhash();
        
        const backupSignature = await backupConnection.sendRawTransaction(
          signedTransaction.serialize(),
          { skipPreflight: true }
        );

        const backupConfirmationStrategy: BlockheightBasedTransactionConfirmationStrategy = {
          blockhash,
          lastValidBlockHeight,
          signature: backupSignature
        };

        const backupConfirmation = await backupConnection.confirmTransaction(
          backupConfirmationStrategy,
          commitment
        );

        if (backupConfirmation.value.err) {
          throw new Error(`Backup transaction failed: ${backupConfirmation.value.err.toString()}`);
        }

        return backupSignature;
      }

    } catch (error) {
      console.error(`Error sending/confirming transaction (attempt ${retries + 1}):`, error);
      lastError = error;
      retries++;
      if (retries >= maxRetries) throw lastError;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }
  throw lastError || new Error('Failed to send and confirm transaction after max retries');
};
