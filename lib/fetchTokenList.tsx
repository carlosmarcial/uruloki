import axios from 'axios';
import { ETH_ADDRESS, AVALANCHE_TOKENS } from '../app/constants';

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
    
    // Determine which manual tokens to include based on chainId
    let manualTokens: Token[] = [];
    
    if (chainId === 1) { // Ethereum Mainnet
      manualTokens = [{
        address: ETH_ADDRESS,
        chainId: chainId,
        decimals: 18,
        name: "Ethereum",
        symbol: "ETH",
        logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
      }];
    } else if (chainId === 43114) { // Avalanche C-Chain
      manualTokens = AVALANCHE_TOKENS;
    }
    
    let allTokens: Token[] = [...manualTokens];

    // If on Avalanche, fetch Trader Joe tokens
    if (chainId === 43114) {
      try {
        const traderJoeResponse = await axios.get(
          'https://raw.githubusercontent.com/traderjoe-xyz/joe-tokenlists/main/mc.tokenlist.json'
        );
        const traderJoeTokens = traderJoeResponse.data.tokens.filter(
          (token: Token) => token.chainId === 43114
        );
        console.log(`Fetched ${traderJoeTokens.length} tokens from Trader Joe`);
        allTokens = [...allTokens, ...traderJoeTokens];
      } catch (error) {
        console.error('Error fetching Trader Joe tokens:', error);
      }
    }

    // Fetch tokens from CoinGecko based on chainId
    try {
      const coingeckoResponse = await axios.get('https://tokens.coingecko.com/uniswap/all.json');
      const coingeckoTokens = coingeckoResponse.data.tokens.filter(
        (token: Token) => token.chainId === chainId
      );
      console.log(`Fetched ${coingeckoTokens.length} tokens from CoinGecko`);

      // Add CoinGecko tokens that don't already exist in our list
      coingeckoTokens.forEach((token: Token) => {
        const tokenExists = allTokens.some(
          existingToken => 
            existingToken.address.toLowerCase() === token.address.toLowerCase()
        );
        if (!tokenExists) {
          allTokens.push(token);
        }
      });
    } catch (error) {
      console.error('Error fetching CoinGecko tokens:', error);
    }

    // Remove duplicates based on address
    const uniqueTokens = Array.from(
      new Map(
        allTokens.map(token => [token.address.toLowerCase(), token])
      ).values()
    );

    console.log(`Total unique tokens: ${uniqueTokens.length}`);
    return uniqueTokens;
  } catch (error) {
    console.error('Error in fetchTokenList:', error);
    // Return manual tokens as fallback based on chainId
    if (chainId === 43114) {
      return AVALANCHE_TOKENS;
    }
    return [];
  }
};
