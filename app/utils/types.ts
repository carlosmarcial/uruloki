// First, let's update our types to match v2 API
export interface PriceResponse {
  chainId: number;
  price: string;
  estimatedPriceImpact: string;
  value: string;
  gasPrice: string;
  gas: string;
  estimatedGas: string;
  sellToken: string;
  buyToken: string;
  buyAmount: string;
  sellAmount: string;
  sources: Array<{
    name: string;
    proportion: string;
  }>;
  allowanceTarget: string;
  permit2?: {
    eip712: {
      domain: Record<string, any>;
      types: Record<string, any>;
      value: Record<string, any>;
    };
  };
}

export interface QuoteResponse extends PriceResponse {
  transaction: {
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice: string;
  };
} 