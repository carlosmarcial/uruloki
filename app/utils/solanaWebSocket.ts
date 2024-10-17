import { SOLANA_RPC_ENDPOINTS } from '../constants';

class SolanaWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 seconds

  connect() {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(SOLANA_RPC_ENDPOINTS.ws);

    this.ws.onopen = () => {
      console.log('WebSocket connection opened');
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);
      // Handle incoming messages here
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket connection closed', event.reason);
      this.attemptReconnect();
    };
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
}

export const solanaWebSocket = new SolanaWebSocket();
