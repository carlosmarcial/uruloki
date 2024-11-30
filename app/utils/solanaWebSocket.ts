import { Connection, PublicKey } from '@solana/web3.js';
import { getConnection } from './solanaUtils';

type TransactionCallback = (data: any) => void;

export class SolanaWebSocket {
  private ws: WebSocket | null = null;
  private backupWs: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private subscriptions: Map<string, TransactionCallback> = new Map();
  private nextSubscriptionId = 1;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.handleMessage = this.handleMessage.bind(this);
    this.connect = this.connect.bind(this);
    this.connectBackup = this.connectBackup.bind(this);
  }

  async connect() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise(async (resolve, reject) => {
      if (this.isConnecting) {
        resolve();
        return;
      }

      if (this.ws?.readyState === WebSocket.OPEN || this.backupWs?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isConnecting = true;

      try {
        const response = await fetch('/api/ws-auth');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const { url } = await response.json();
        if (!url) throw new Error('No WebSocket URL received');

        if (this.ws) this.ws.close();
        if (this.backupWs) this.backupWs.close();

        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          console.log('dRPC WebSocket connected');
          this.reconnectAttempts = 0;
          this.resubscribeAll();
          resolve();
        };

        this.ws.onclose = () => {
          console.log('dRPC WebSocket closed, trying backup');
          this.connectBackup().then(resolve).catch(reject);
        };

        this.ws.onerror = (error) => {
          console.error('dRPC WebSocket error:', error);
          this.connectBackup().then(resolve).catch(reject);
        };

        this.ws.onmessage = this.handleMessage;

        // Set timeout for initial connection
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.connectBackup().then(resolve).catch(reject);
          }
        }, 5000);

      } catch (error) {
        console.error('Failed to connect to dRPC WebSocket:', error);
        try {
          await this.connectBackup();
          resolve();
        } catch (backupError) {
          reject(backupError);
        }
      } finally {
        this.isConnecting = false;
        this.connectionPromise = null;
      }
    });

    return this.connectionPromise;
  }

  private async connectBackup(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const backupWsUrl = process.env.NEXT_PUBLIC_BACKUP_WS_URL;
        if (!backupWsUrl) throw new Error('No backup WebSocket URL configured');

        if (this.backupWs) this.backupWs.close();

        this.backupWs = new WebSocket(backupWsUrl);
        
        this.backupWs.onopen = () => {
          console.log('Backup WebSocket connected');
          this.resubscribeAll();
          resolve();
        };

        this.backupWs.onclose = () => {
          console.log('Backup WebSocket closed, retrying primary');
          setTimeout(() => this.connect(), this.reconnectInterval);
        };

        this.backupWs.onerror = (error) => {
          console.error('Backup WebSocket error:', error);
          reject(error);
        };

        this.backupWs.onmessage = this.handleMessage;
        
      } catch (error) {
        console.error('Failed to connect to backup WebSocket:', error);
        reject(error);
      }
    });
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      
      if (data.method === 'subscription') {
        const subscription = this.subscriptions.get(data.params.subscription);
        if (subscription) {
          subscription(data.params.result);
        }
      }
      
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private async resubscribeAll() {
    try {
      const activeSubscriptions = new Map(this.subscriptions);
      this.subscriptions.clear();
      
      for (const [id, callback] of activeSubscriptions) {
        await this.subscribeToTransaction(id, {
          onStatusChange: (status) => callback({ status }),
          onFinality: (success) => callback({ success })
        });
      }
    } catch (error) {
      console.error('Error resubscribing:', error);
    }
  }

  async subscribeToTransaction(signature: string, callbacks: {
    onStatusChange: (status: 'pending' | 'success' | 'error') => void;
    onFinality: (success: boolean) => void;
  }) {
    try {
      if (!this.ws && !this.backupWs) {
        await this.connect();
      }

      const activeWs = this.ws?.readyState === WebSocket.OPEN ? this.ws : this.backupWs;
      if (!activeWs || activeWs.readyState !== WebSocket.OPEN) {
        throw new Error('No active WebSocket connection');
      }

      const subscriptionId = this.nextSubscriptionId++;
      
      const subscribeMessage = {
        jsonrpc: '2.0',
        id: subscriptionId,
        method: 'signatureSubscribe',
        params: [
          signature,
          {
            commitment: 'confirmed',
            enableReceivedNotification: true
          }
        ]
      };

      console.log('Setting up WebSocket subscription for:', signature);
      activeWs.send(JSON.stringify(subscribeMessage));

      // Set up subscription callback
      this.subscriptions.set(subscriptionId.toString(), (result) => {
        console.log('WebSocket received update for', signature, ':', result);
        
        if (result.err) {
          console.log('Transaction error detected:', result.err);
          callbacks.onStatusChange('error');
          callbacks.onFinality(false);
          this.unsubscribeFromSignature(subscriptionId.toString());
        } else if (result.value?.confirmationStatus === 'confirmed' || 
                   result.value?.confirmationStatus === 'finalized') {
          console.log('Transaction confirmed:', result.value.confirmationStatus);
          callbacks.onStatusChange('success');
          callbacks.onFinality(true);
          this.unsubscribeFromSignature(subscriptionId.toString());
        } else {
          console.log('Transaction still pending');
          callbacks.onStatusChange('pending');
        }
      });

      return subscriptionId.toString();
    } catch (error) {
      console.error('Error in subscribeToTransaction:', error);
      callbacks.onStatusChange('error');
      callbacks.onFinality(false);
      return 'error';
    }
  }

  async unsubscribeFromSignature(subscriptionId: string) {
    if (subscriptionId.startsWith('fallback-')) return;
    
    try {
      const activeWs = this.ws?.readyState === WebSocket.OPEN ? this.ws : this.backupWs;
      if (!activeWs || activeWs.readyState !== WebSocket.OPEN) return;

      const unsubscribeMessage = {
        jsonrpc: '2.0',
        id: parseInt(subscriptionId),
        method: 'signatureUnsubscribe',
        params: [parseInt(subscriptionId)]
      };

      activeWs.send(JSON.stringify(unsubscribeMessage));
      this.subscriptions.delete(subscriptionId);
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.backupWs) {
      this.backupWs.close();
      this.backupWs = null;
    }
    this.subscriptions.clear();
    this.reconnectAttempts = 0;
    this.connectionPromise = null;
  }
}

// Create a single instance
const solanaWebSocket = new SolanaWebSocket();

// Helper function for transaction subscription
const subscribeToTransaction = async (signature: string, callbacks: {
  onStatusChange?: (status: 'pending' | 'success' | 'error') => void;
  onFinality?: (success: boolean) => void;
}) => {
  try {
    // First check if transaction is already confirmed
    const connection = getConnection();
    const status = await connection.getSignatureStatus(signature, {
      searchTransactionHistory: true
    });

    if (status.value?.confirmationStatus === 'confirmed' || 
        status.value?.confirmationStatus === 'finalized') {
      callbacks.onStatusChange?.('success');
      callbacks.onFinality?.(true);
      return;
    }

    // If not confirmed, set up WebSocket subscription
    await solanaWebSocket.connect();
    
    // Set up polling as backup
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds
    const pollInterval = setInterval(async () => {
      try {
        attempts++;
        const status = await connection.getSignatureStatus(signature);
        console.log(`Polling status for ${signature}:`, status.value?.confirmationStatus);
        
        if (status.value?.err) {
          clearInterval(pollInterval);
          callbacks.onStatusChange?.('error');
          callbacks.onFinality?.(false);
        } else if (status.value?.confirmationStatus === 'confirmed' || 
                   status.value?.confirmationStatus === 'finalized') {
          clearInterval(pollInterval);
          callbacks.onStatusChange?.('success');
          callbacks.onFinality?.(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          callbacks.onStatusChange?.('error');
          callbacks.onFinality?.(false);
        }
      } catch (error) {
        console.error('Error polling transaction status:', error);
      }
    }, 1000);

    // WebSocket subscription
    const subscriptionId = await solanaWebSocket.subscribeToTransaction(signature, {
      onStatusChange: (status) => {
        console.log(`WebSocket status for ${signature}:`, status);
        callbacks.onStatusChange?.(status);
        if (status === 'success' || status === 'error') {
          clearInterval(pollInterval);
        }
      },
      onFinality: (success) => {
        console.log(`WebSocket finality for ${signature}:`, success);
        callbacks.onFinality?.(success);
        clearInterval(pollInterval);
      }
    });

    return subscriptionId;
  } catch (error) {
    console.error('Error subscribing to transaction:', error);
    callbacks.onStatusChange?.('error');
    callbacks.onFinality?.(false);
    return 'error';
  }
};

// Single export statement for all items
export { solanaWebSocket, subscribeToTransaction };
