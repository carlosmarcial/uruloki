import { DrpcProvider } from '@drpcorg/drpc-sdk/dist/esm/providers/web3';

type TransactionCallback = (data: any) => void;

export class SolanaWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private subscriptions: Map<string, TransactionCallback> = new Map();
  private nextSubscriptionId = 1;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : process.env.NEXT_PUBLIC_BASE_URL || '';

    // Bind methods to preserve 'this' context
    this.handleMessage = this.handleMessage.bind(this);
    this.connect = this.connect.bind(this);
    this.resubscribeAll = this.resubscribeAll.bind(this);
    this.attemptReconnect = this.attemptReconnect.bind(this);
  }

  async connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/ws-auth`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const { url } = await response.json();
      if (!url) {
        throw new Error('No WebSocket URL received');
      }

      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
        this.resubscribeAll();
      };

      this.ws.onclose = (event) => {
        console.log(`WebSocket closed with code: ${event.code}`);
        if (!event.wasClean) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onmessage = this.handleMessage;

    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    await new Promise(resolve => setTimeout(resolve, this.reconnectInterval));
    await this.connect();
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      
      // Handle subscription responses
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
      // Resubscribe to signature updates
      for (const [id, callback] of this.subscriptions) {
        await this.subscribeToSignature(id, callback);
      }
    } catch (error) {
      console.error('Error resubscribing:', error);
    }
  }

  async subscribeToSignature(signature: string, callback: TransactionCallback): Promise<string> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const subscriptionId = this.nextSubscriptionId++;
    
    // Subscribe to signature updates using dRPC WebSocket protocol
    const subscribeMessage = {
      jsonrpc: '2.0',
      id: subscriptionId,
      method: 'signatureSubscribe',
      params: [
        signature,
        {
          commitment: 'confirmed'
        }
      ]
    };

    this.ws.send(JSON.stringify(subscribeMessage));
    this.subscriptions.set(subscriptionId.toString(), callback);
    
    return subscriptionId.toString();
  }

  async unsubscribeFromSignature(subscriptionId: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const unsubscribeMessage = {
      jsonrpc: '2.0',
      id: parseInt(subscriptionId),
      method: 'signatureUnsubscribe',
      params: [parseInt(subscriptionId)]
    };

    this.ws.send(JSON.stringify(unsubscribeMessage));
    this.subscriptions.delete(subscriptionId);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.reconnectAttempts = 0;
  }
}

// Export a singleton instance
export const solanaWebSocket = new SolanaWebSocket();
