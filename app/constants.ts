import { mainnet, polygon, optimism, arbitrum, base, avalanche, bsc, linea, mantle, scroll } from 'wagmi/chains';
import { Address } from 'viem';
import { PublicKey } from '@solana/web3.js';

export const MAGIC_CALLDATA_STRING = "f".repeat(130); // used when signing the eip712 message

export const AFFILIATE_FEE = '0.01'; // 1% affiliate fee
export const FEE_RECIPIENT = '0x765d4129bbe4C9b134f307E2B10c6CF75Fe0e2f6';

export const MAINNET_EXCHANGE_PROXY = "0xdef1c0ded9bec7f1a1670819833240f027b25eff";

export const MAX_ALLOWANCE = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935");

interface Token {
  name: string;
  address: Address;
  symbol: string;
  decimals: number;
  chainId: number;
  logoURI: string;
}

export const MAINNET_TOKENS: Token[] = [
  {
    chainId: 1,
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
    address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    logoURI: "https://raw.githubusercontent.com/maticnetwork/polygon-token-assets/main/assets/tokenAssets/weth.svg",
  },
  {
    chainId: 1,
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    logoURI: "https://raw.githubusercontent.com/maticnetwork/polygon-token-assets/main/assets/tokenAssets/usdc.svg",
  },
  {
    chainId: 1,
    name: "Dai - PoS",
    symbol: "DAI",
    decimals: 18,
    address: "0x6b175474e89094c44da98b954eedeac495271d0f",
    logoURI: "https://raw.githubusercontent.com/maticnetwork/polygon-token-assets/main/assets/tokenAssets/dai.svg",
  },
  {
    chainId: 1,
    name: "FLOKI",
    symbol: "FLOKI",
    decimals: 9,
    address: "0xcf0c122c6b73ff809c693db761e7baebe62b6a2e",
    logoURI: "https://raw.githubusercontent.com/trustwallet/assets/c37119334a24f9933f373c6cc028a5bdbad2ecb4/blockchains/ethereum/assets/0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E/logo.png",
  },
];

export const MAINNET_TOKENS_BY_SYMBOL: { [symbol: string]: { address: `0x${string}`; decimals: number; symbol: string } } = {
  WETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, symbol: 'WETH' },
  USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, symbol: 'USDC' },
  // Add other tokens as needed
};

export const MAINNET_TOKENS_BY_ADDRESS: Record<string, Token> = MAINNET_TOKENS.reduce((acc, token) => {
  acc[token.address.toLowerCase()] = token;
  return acc;
}, {} as Record<string, Token>);

export const SUPPORTED_CHAINS = [
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  avalanche,
  bsc,
  linea,
  mantle,
  scroll
];

export const TOKEN_LIST_URL = 'https://tokens.coingecko.com/uniswap/all.json';

export const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

export const GAS_LIMIT_BUFFER = 1.1; // 10% buffer

export const DEFAULT_DEADLINE = Math.floor(Date.now() / 1000) + 20 * 60; // 20 minutes from now

export const API_PRICE_URL = '/api/price';
export const API_QUOTE_URL = '/api/quote';

export const EXCHANGE_PROXY_ADDRESSES: { [chainId: number]: string } = {
  1: '0xdef1c0ded9bec7f1a1670819833240f027b25eff', // Mainnet
  137: '0xdef1c0ded9bec7f1a1670819833240f027b25eff', // Polygon
  10: '0xdef1abe32c034e558cdd535791643c58a13acc10', // Optimism
  42161: '0xdef1c0ded9bec7f1a1670819833240f027b25eff', // Arbitrum
  8453: '0xdef1c0ded9bec7f1a1670819833240f027b25eff', // Base
  43114: '0xdef1c0ded9bec7f1a1670819833240f027b25eff', // Avalanche
  56: '0xdef1c0ded9bec7f1a1670819833240f027b25eff', // BSC
  59144: '0xdef1c0ded9bec7f1a1670819833240f027b25eff', // Linea
  5000: '0xdef1c0ded9bec7f1a1670819833240f027b25eff', // Mantle
  534352: '0xdef1c0ded9bec7f1a1670819833240f027b25eff', // Scroll
};

export const EXCHANGE_PROXY_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "address", "name": "maker", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "nonce", "type": "uint256" }
    ],
    "name": "ERC1155OrderCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "enum LibNFTOrder.TradeDirection", "name": "direction", "type": "uint8" },
      { "indexed": false, "internalType": "address", "name": "maker", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "taker", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "nonce", "type": "uint256" },
      { "indexed": false, "internalType": "contract IERC20Token", "name": "erc20Token", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "erc20FillAmount", "type": "uint256" },
      { "indexed": false, "internalType": "contract IERC1155Token", "name": "erc1155Token", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "erc1155TokenId", "type": "uint256" },
      { "indexed": false, "internalType": "uint128", "name": "erc1155FillAmount", "type": "uint128" },
      { "indexed": false, "internalType": "address", "name": "matcher", "type": "address" }
    ],
    "name": "ERC1155OrderFilled",
    "type": "event"
  },
  {
    "inputs": [
      {
        "components": [
          { "internalType": "contract IERC20Token", "name": "makerToken", "type": "address" },
          { "internalType": "contract IERC20Token", "name": "takerToken", "type": "address" },
          { "internalType": "uint128", "name": "makerAmount", "type": "uint128" },
          { "internalType": "uint128", "name": "takerAmount", "type": "uint128" },
          { "internalType": "uint128", "name": "takerTokenFeeAmount", "type": "uint128" },
          { "internalType": "address", "name": "maker", "type": "address" },
          { "internalType": "address", "name": "taker", "type": "address" },
          { "internalType": "address", "name": "sender", "type": "address" },
          { "internalType": "address", "name": "feeRecipient", "type": "address" },
          { "internalType": "bytes32", "name": "pool", "type": "bytes32" },
          { "internalType": "uint64", "name": "expiry", "type": "uint64" },
          { "internalType": "uint256", "name": "salt", "type": "uint256" }
        ],
        "internalType": "struct LibNativeOrder.LimitOrder",
        "name": "order",
        "type": "tuple"
      },
      {
        "components": [
          { "internalType": "enum LibSignature.SignatureType", "name": "signatureType", "type": "uint8" },
          { "internalType": "uint8", "name": "v", "type": "uint8" },
          { "internalType": "bytes32", "name": "r", "type": "bytes32" },
          { "internalType": "bytes32", "name": "s", "type": "bytes32" }
        ],
        "internalType": "struct LibSignature.Signature",
        "name": "signature",
        "type": "tuple"
      },
      { "internalType": "uint128", "name": "takerTokenFillAmount", "type": "uint128" },
      { "internalType": "address", "name": "taker", "type": "address" },
      { "internalType": "address", "name": "sender", "type": "address" }
    ],
    "name": "_fillLimitOrder",
    "outputs": [
      { "internalType": "uint128", "name": "takerTokenFilledAmount", "type": "uint128" },
      { "internalType": "uint128", "name": "makerTokenFilledAmount", "type": "uint128" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "inputToken", "type": "address" },
          { "internalType": "address", "name": "outputToken", "type": "address" },
          { "internalType": "uint256", "name": "inputAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "minOutputAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "expectedOutputAmount", "type": "uint256" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "bytes", "name": "swapCallData", "type": "bytes" },
          { "internalType": "address", "name": "swapTarget", "type": "address" }
        ],
        "internalType": "struct SwapParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "swap",
    "outputs": [
      { "internalType": "uint256", "name": "outputAmount", "type": "uint256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
];

export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  // ... you can add more functions if needed
];

// Add Solana token interface
export interface SolanaToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

// Add Solana tokens
export const SOLANA_TOKENS: SolanaToken[] = [
  {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  },
  {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'WSOL',
    name: 'Wrapped SOL',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  },
  // Add more Solana tokens as needed
];

export const SOLANA_TOKENS_BY_SYMBOL: { [symbol: string]: SolanaToken } = SOLANA_TOKENS.reduce((acc, token) => {
  acc[token.symbol] = token;
  return acc;
}, {} as { [symbol: string]: SolanaToken });

export const SOLANA_TOKENS_BY_ADDRESS: { [address: string]: SolanaToken } = SOLANA_TOKENS.reduce((acc, token) => {
  acc[token.address] = token;
  return acc;
}, {} as { [address: string]: SolanaToken });

export const NATIVE_SOL_MINT = 'So11111111111111111111111111111111111111112';

// Jupiter API endpoints
export const JUPITER_QUOTE_API_URL = 'https://quote-api.jup.ag/v6/quote';
export const JUPITER_SWAP_API_URL = 'https://quote-api.jup.ag/v6';
export const JUPITER_SWAP_INSTRUCTIONS_API_URL = 'https://quote-api.jup.ag/v6/swap-instructions';

// Solana RPC endpoint
export const SOLANA_RPC_ENDPOINT = 'https://rpc.ankr.com/solana/f869eb9b2994f58e19944ab4fed6cd256f108b14553dcbadca18f6b0b6b7cb5f';

// Remove or comment out the WebSocket endpoint
// export const SOLANA_WS_ENDPOINT = 'wss://...';

export const DEFAULT_SLIPPAGE_BPS = 100; // 1% slippage
