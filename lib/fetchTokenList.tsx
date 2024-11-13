import axios from 'axios';
import { 
  ETH_ADDRESS, 
  AVALANCHE_TOKENS, 
  TOKEN_LIST_URLS,
  ETHEREUM_CHAIN_ID,
  ARBITRUM_CHAIN_ID,
  POLYGON_CHAIN_ID,
  OPTIMISM_CHAIN_ID,
  AVALANCHE_CHAIN_ID,
  BASE_CHAIN_ID
} from '../app/constants';

// Add Solana constants without modifying existing ones
const SOLANA_CHAIN_ID = 101;
const WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112';

export interface Token {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI: string;
}

export const fetchTokenList = async (chainId: number): Promise<Token[]> => {
  try {
    console.log(`Fetching token list for chain ID: ${chainId}`);
    
    let allTokens: Token[] = [];

    // Special handling for Solana
    if (chainId === SOLANA_CHAIN_ID) {
      try {
        const response = await axios.get('https://token.jup.ag/strict');
        const tokens = response.data.tokens;
        console.log(`Fetched ${tokens.length} Solana tokens from Jupiter`);
        allTokens = tokens;
      } catch (error) {
        console.error('Error fetching Solana tokens:', error);
      }
    } else {
      // Existing flow for other chains remains unchanged
      const nativeToken = getNativeToken(chainId);
      if (nativeToken) {
        allTokens.push(nativeToken);
      }

      const tokenListUrl = TOKEN_LIST_URLS[chainId];
      
      if (tokenListUrl) {
        try {
          const response = await axios.get(tokenListUrl);
          const chainTokens = response.data.tokens.filter(
            (token: Token) => token.chainId === chainId
          );
          console.log(`Fetched ${chainTokens.length} tokens from main list`);
          allTokens = [...allTokens, ...chainTokens];
        } catch (error) {
          console.error(`Error fetching main token list:`, error);
        }
      }

      // Existing chain-specific cases
      switch (chainId) {
        case AVALANCHE_CHAIN_ID:
          try {
            const traderJoeResponse = await axios.get(
              'https://raw.githubusercontent.com/traderjoe-xyz/joe-tokenlists/main/mc.tokenlist.json'
            );
            const traderJoeTokens = traderJoeResponse.data.tokens.filter(
              (token: Token) => token.chainId === AVALANCHE_CHAIN_ID
            );
            allTokens = [...allTokens, ...traderJoeTokens];
          } catch (error) {
            console.error('Error fetching Trader Joe tokens:', error);
          }
          break;

        case ARBITRUM_CHAIN_ID:
          try {
            const arbitrumResponse = await axios.get(
              'https://raw.githubusercontent.com/sushiswap/list/master/lists/token-lists/default-token-list/tokens/arbitrum.json'
            );
            allTokens = [...allTokens, ...arbitrumResponse.data];
          } catch (error) {
            console.error('Error fetching Arbitrum tokens:', error);
          }
          break;
      }
    }

    // Remove duplicates based on address
    const uniqueTokens = Array.from(
      new Map(
        allTokens.map(token => [token.address.toLowerCase(), token])
      ).values()
    );

    console.log(`Total unique tokens for chain ${chainId}: ${uniqueTokens.length}`);
    return uniqueTokens;
  } catch (error) {
    console.error('Error in fetchTokenList:', error);
    return [];
  }
};

// Helper function to get native token for each chain
const getNativeToken = (chainId: number): Token | null => {
  switch (chainId) {
    case ETHEREUM_CHAIN_ID:
      return {
        address: ETH_ADDRESS,
        chainId: chainId,
        decimals: 18,
        name: "Ethereum",
        symbol: "ETH",
        logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
      };
    case AVALANCHE_CHAIN_ID:
      return {
        address: ETH_ADDRESS, // Using same address format for consistency
        chainId: chainId,
        decimals: 18,
        name: "Avalanche",
        symbol: "AVAX",
        logoURI: "https://raw.githubusercontent.com/traderjoe-xyz/joe-tokenlists/main/logos/0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7/logo.png"
      };
    case ARBITRUM_CHAIN_ID:
      return {
        address: ETH_ADDRESS,
        chainId: chainId,
        decimals: 18,
        name: "Ethereum",
        symbol: "ETH",
        logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
      };
    // Add more chains as needed
    default:
      return null;
  }
};
