import axios from 'axios';
import { ETH_ADDRESS, WETH_ADDRESS } from '../app/constants';

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
    const response = await axios.get(`https://tokens.coingecko.com/uniswap/all.json`);
    const coingeckoTokens = response.data.tokens.filter((token: Token) => token.chainId === chainId);
    console.log(`Fetched ${coingeckoTokens.length} tokens from CoinGecko`);

    // Manually add ETH and WETH at the top of the list
    const manualTokens: Token[] = [
      {
        address: ETH_ADDRESS,
        chainId: chainId,
        decimals: 18,
        name: "Ethereum",
        symbol: "ETH",
        logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
      },
      {
        address: WETH_ADDRESS,
        chainId: chainId,
        decimals: 18,
        name: "Wrapped Ether",
        symbol: "WETH",
        logoURI: "https://assets.coingecko.com/coins/images/2518/small/weth.png"
      }
    ];

    // Combine manual tokens with fetched tokens, ensuring no duplicates
    const combinedTokens = [
      ...manualTokens,
      ...coingeckoTokens.filter(token => 
        !manualTokens.some(manualToken => manualToken.address.toLowerCase() === token.address.toLowerCase())
      )
    ];

    console.log(`Total tokens after combining: ${combinedTokens.length}`);
    return combinedTokens;
  } catch (error) {
    console.error('Error fetching token list:', error);
    return [];
  }
};
