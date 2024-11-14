import { SOLANA_RPC_ENDPOINTS } from '../constants';

interface TransactionCallback {
  onStatusChange?: (status: 'pending' | 'success' | 'error') => void;
  onFinality?: (success: boolean) => void;
}

class SolanaWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private subscriptions: Map<string, TransactionCallback> = new Map();
  private nextSubscriptionId = 1;

  connect() {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(SOLANA_RPC_ENDPOINTS.ws);

    this.ws.onopen = () => {
      console.log('WebSocket connection opened');
      this.reconnectAttempts = 0;
      
      // Resubscribe to all active transaction subscriptions
      this.subscriptions.forEach((callback, signature) => {
        this.subscribeToTransactionStatus(signature);
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      this.attemptReconnect();
    };
  }

  private handleWebSocketMessage(message: any) {
    try {
      if (message.method === 'signatureNotification') {
        const signature = message.params.result.value.signature;
        const callback = this.subscriptions.get(signature);
        
        if (callback) {
          if (message.params.result.value.err) {
            callback.onStatusChange?.('error');
            callback.onFinality?.(false);
          } else {
            callback.onStatusChange?.('success');
            callback.onFinality?.(true);
          }
          
          // Cleanup subscription after finality
          this.unsubscribeFromTransaction(signature);
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  subscribeToTransaction(signature: string, callbacks: TransactionCallback) {
    this.subscriptions.set(signature, callbacks);
    this.subscribeToTransactionStatus(signature);
  }

  private subscribeToTransactionStatus(signature: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const subscriptionId = this.nextSubscriptionId++;
      
      // Subscribe to both confirmation and signature notifications
      this.ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: subscriptionId,
        method: 'signatureSubscribe',
        params: [
          signature,
          {
            commitment: 'confirmed',
            enableReceivedNotification: true,
            encoding: 'jsonParsed'
          }
        ]
      }));

      // Also subscribe to slot notifications to track network progress
      this.ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: subscriptionId + 1,
        method: 'slotSubscribe'
      }));
    }
  }

  unsubscribeFromTransaction(signature: string) {
    this.subscriptions.delete(signature);
    // Note: The WebSocket subscription will auto-close when the transaction is finalized
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), this.reconnectInterval);
    } else {
      console.error('Max reconnect attempts reached. Please check your connection.');
    }
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected. Message not sent:', message);
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }

  subscribe(subscription: any) {
    const subStr = JSON.stringify(subscription);
    this.subscriptions.add(subStr);
    this.send(subscription);
  }

  unsubscribe(subscription: any) {
    const subStr = JSON.stringify(subscription);
    this.subscriptions.delete(subStr);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({
        jsonrpc: '2.0',
        id: subscription.id,
        method: 'unsubscribe',
        params: [subscription.params]
      });
    }
  }
}

export const solanaWebSocket = new SolanaWebSocket();

// Initialize the WebSocket connection
solanaWebSocket.connect();
