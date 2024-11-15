type TransactionCallback = (data: any) => void;

export class SolanaWebSocket {
  private ws: WebSocket | null = null;
  private backupWs: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private subscriptions: Map<string, TransactionCallback> = new Map();
  private nextSubscriptionId = 1;

  constructor() {
    // Bind methods
    this.handleMessage = this.handleMessage.bind(this);
    this.connect = this.connect.bind(this);
    this.connectBackup = this.connectBackup.bind(this);
  }

  async connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      const response = await fetch('/api/ws-auth');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const { url } = await response.json();
      if (!url) throw new Error('No WebSocket URL received');

      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('dRPC WebSocket connected');
        this.reconnectAttempts = 0;
        this.resubscribeAll();
      };

      this.ws.onclose = () => {
        console.log('dRPC WebSocket closed, trying backup');
        this.connectBackup();
      };

      this.ws.onerror = (error) => {
        console.error('dRPC WebSocket error:', error);
        this.connectBackup();
      };

      this.ws.onmessage = this.handleMessage;

    } catch (error) {
      console.error('Failed to connect to dRPC WebSocket:', error);
      this.connectBackup();
    }
  }

  private async connectBackup() {
    try {
      const backupWsUrl = process.env.NEXT_PUBLIC_BACKUP_WS_URL;
      if (!backupWsUrl) throw new Error('No backup WebSocket URL configured');

      this.backupWs = new WebSocket(backupWsUrl);
      
      this.backupWs.onopen = () => {
        console.log('Backup WebSocket connected');
        this.resubscribeAll();
      };

      this.backupWs.onmessage = this.handleMessage;
      
    } catch (error) {
      console.error('Failed to connect to backup WebSocket:', error);
    }
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
      for (const [id, callback] of this.subscriptions) {
        await this.subscribeToSignature(id, callback);
      }
    } catch (error) {
      console.error('Error resubscribing:', error);
    }
  }

  async subscribeToSignature(signature: string, callback: TransactionCallback): Promise<string> {
    const activeWs = this.ws?.readyState === WebSocket.OPEN ? this.ws : this.backupWs;
    
    if (!activeWs || activeWs.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const subscriptionId = this.nextSubscriptionId++;
    
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

    activeWs.send(JSON.stringify(subscribeMessage));
    this.subscriptions.set(subscriptionId.toString(), callback);
    
    return subscriptionId.toString();
  }

  async unsubscribeFromSignature(subscriptionId: string): Promise<void> {
    const activeWs = this.ws?.readyState === WebSocket.OPEN ? this.ws : this.backupWs;
    
    if (!activeWs || activeWs.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const unsubscribeMessage = {
      jsonrpc: '2.0',
      id: parseInt(subscriptionId),
      method: 'signatureUnsubscribe',
      params: [parseInt(subscriptionId)]
    };

    activeWs.send(JSON.stringify(unsubscribeMessage));
    this.subscriptions.delete(subscriptionId);
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
  }
}

export const solanaWebSocket = new SolanaWebSocket();
