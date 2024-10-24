import { mainnet, polygon, optimism, arbitrum, base, avalanche, bsc, linea, mantle, scroll } from 'wagmi/chains';
import { Address } from 'viem';
import { PublicKey } from '@solana/web3.js';

export const MAGIC_CALLDATA_STRING = "f".repeat(130); // used when signing the eip712 message

export const FEE_RECIPIENT = '0x765d4129bbe4C9b134f307E2B10c6CF75Fe0e2f6';
export const AFFILIATE_FEE = '0.01'; // 1% affiliate fee

export const MAINNET_EXCHANGE_PROXY = "0xdef1c0ded9bec7f1a1670819833240f027b25eff";

export const MAX_ALLOWANCE = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935");


// Add the 0x API base URLs for different networks
export const ZEROX_BASE_URLS: { [chainId: number]: string } = {
  1: 'https://api.0x.org', // Ethereum Mainnet
  56: 'https://bsc.api.0x.org', // Binance Smart Chain
  137: 'https://polygon.api.0x.org', // Polygon
  42161: 'https://arbitrum.api.0x.org', // Arbitrum
  10: 'https://optimism.api.0x.org', // Optimism
  43114: 'https://avalanche.api.0x.org', // Avalanche
  8453: 'https://base.api.0x.org', // Base
  59144: 'https://linea.api.0x.org', // Linea
  5000: 'https://mantle.api.0x.org', // Mantle
  534352: 'https://scroll.api.0x.org', // Scroll
};

interface Token {
  name: string;
  address: Address;
  symbol: string;
  decimals: number;
  chainId: number;
  logoURI: string;
}

// Add this near the top of the file
export const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // Ethereum Mainnet WETH address
export const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

// Update MAINNET_TOKENS to include ETH
export const MAINNET_TOKENS: Token[] = [
  {
    chainId: 1,
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
    address: ETH_ADDRESS,
    logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  },
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

// Update MAINNET_TOKENS_BY_SYMBOL
export const MAINNET_TOKENS_BY_SYMBOL: { [symbol: string]: { address: string; decimals: number } } = {
  ETH: { address: ETH_ADDRESS, decimals: 18 },
  WETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
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
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
    stateMutability: "nonpayable",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "remaining", type: "uint256" }],
    type: "function",
    stateMutability: "view",
  },
];

// Add Solana token interface
export interface SolanaToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

// Add this new constant
export const MANUAL_WETH_TOKEN = {
  address: WETH_ADDRESS,
  symbol: 'WETH',
  name: 'Wrapped Ether',
  decimals: 18,
  logoURI: 'https://ethereum-optimism.github.io/data/WETH/logo.png' // You can use a different logo URL if preferred
};

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

// Solana RPC endpoints
export const SOLANA_RPC_ENDPOINTS = {
  http: process.env.NEXT_PUBLIC_SOLANA_RPC_HTTP || 'https://solana-mainnet.rpc.extrnode.com/2cec358b-e391-4b82-837c-9c661504501f',
  ws: process.env.NEXT_PUBLIC_SOLANA_RPC_WS || 'wss://solana-mainnet.rpc.extrnode.com/2cec358b-e391-4b82-837c-9c661504501f'
};

export const DEFAULT_SLIPPAGE_BPS = 500; // 5% slippage

// Update or add this constant
export const API_SWAP_PRICE_URL = '/api/swap-price';

// Ethereum-specific constants
export const ETH_DEFAULT_SLIPPAGE_PERCENTAGE = 5; // 5% slippage for Ethereum
export const ETH_MIN_SLIPPAGE_PERCENTAGE = 0.1;
export const ETH_MAX_SLIPPAGE_PERCENTAGE = 50;

// Solana-specific constants (already present, but listed here for comparison)
export const SOLANA_MIN_SLIPPAGE_BPS = 10; // 0.1%
export const SOLANA_MAX_SLIPPAGE_BPS = 5000; // 50%

// Avalanche C-Chain Constants
export const AVALANCHE_CHAIN_ID = 43114;
export const AVALANCHE_RPC_URL = 'https://api.avax.network/ext/bc/C/rpc';
export const AVALANCHE_EXPLORER_URL = 'https://snowtrace.io';

// Update the ETH_ADDRESS constant to be used for all native tokens
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// Update AVALANCHE_TOKENS
export const AVALANCHE_TOKENS: Token[] = [
  {
    chainId: AVALANCHE_CHAIN_ID,
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS, // Use the native token address for AVAX
    logoURI: "https://raw.githubusercontent.com/traderjoe-xyz/joe-tokenlists/main/logos/0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7/logo.png",
  },
  {
    chainId: AVALANCHE_CHAIN_ID,
    name: "Wrapped AVAX",
    symbol: "WAVAX",
    decimals: 18,
    address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", // WAVAX contract address
    logoURI: "https://raw.githubusercontent.com/traderjoe-xyz/joe-tokenlists/main/logos/0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7/logo.png",
  },
  // Add more common Avalanche tokens like USDC.e, USDT.e, etc.
  {
    chainId: AVALANCHE_CHAIN_ID,
    name: "USD Coin",
    symbol: "USDC.e",
    decimals: 6,
    address: "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664",
    logoURI: "https://raw.githubusercontent.com/traderjoe-xyz/joe-tokenlists/main/logos/0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664/logo.png",
  },
  {
    chainId: AVALANCHE_CHAIN_ID,
    name: "Tether USD",
    symbol: "USDT.e",
    decimals: 6,
    address: "0xc7198437980c041c805A1EDcbA50c1Ce5db95118",
    logoURI: "https://raw.githubusercontent.com/traderjoe-xyz/joe-tokenlists/main/logos/0xc7198437980c041c805A1EDcbA50c1Ce5db95118/logo.png",
  },
];

// Add Avalanche token mapping
export const AVALANCHE_TOKENS_BY_SYMBOL: { [symbol: string]: Token } = 
  AVALANCHE_TOKENS.reduce((acc, token) => {
    acc[token.symbol] = token;
    return acc;
  }, {} as { [symbol: string]: Token });






