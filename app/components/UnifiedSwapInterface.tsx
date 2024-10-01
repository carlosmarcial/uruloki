'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, ArrowUpDown, Search, X, Wallet } from "lucide-react";
import Image from "next/image";
import { useAccount, useBalance, useChainId, useConnect, useDisconnect } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ConnectKitButton } from "connectkit";
import { formatUnits, parseUnits } from "ethers";
import { useReadContract, useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { erc20Abi, Address } from "viem";
import { MAINNET_TOKENS, MAINNET_TOKENS_BY_SYMBOL, MAX_ALLOWANCE, AFFILIATE_FEE, FEE_RECIPIENT } from "../../src/constants";
import qs from "qs";
import { motion, AnimatePresence } from 'framer-motion';
import TokenChart, { TokenChartRef } from './TokenChart';
import TokenSelector from '../token-list/TokenSelector';
import { fetchTokenList } from '../../lib/fetchTokenList';
import { Token } from '../../types/token';
import { isAddress } from 'ethers';

// Add this interface at the top of your file, after the imports
interface Token {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
}

// Define custom tokens
const TSUKA: Token = {
  name: "Dejitaru Tsuka",
  symbol: "TSUKA",
  address: "0xc5fb36dd2fb59d3b98deff88425a3f425ee469ed",
  decimals: 9,
  logoURI: "/tsuka-logo.png",
  chainId: 1
};

// Add these constants at the top of the file
const DEFAULT_SOLANA_SELL_TOKEN: Token = {
  name: "Solana",
  symbol: "SOL",
  address: "So11111111111111111111111111111111111111112",
  decimals: 9,
  logoURI: "/sol-logo.png",
  chainId: 101
};

const DEFAULT_SOLANA_BUY_TOKEN: Token = {
  name: "USD Coin",
  symbol: "USDC",
  address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  decimals: 6,
  logoURI: "/usdc-logo.png",
  chainId: 101
};

export default function UnifiedSwapInterface({ activeChain, setActiveChain }: {
  activeChain: 'ethereum' | 'solana';
  setActiveChain: (chain: 'ethereum' | 'solana') => void;
}) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [sellToken, setSellToken] = useState<Token | null>(null);
  const [buyToken, setBuyToken] = useState<Token | null>(null);
  const [sellAmount, setSellAmount] = useState("");  // Changed to empty string
  const [buyAmount, setBuyAmount] = useState("");    // Changed to empty string
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"sell" | "buy">("sell");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chartRef = useRef<TokenChartRef>(null);
  const [chartImage, setChartImage] = useState<string | null>(null);

  // Ethereum hooks
  const { address, isConnected: isEthereumConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Solana hooks
  const { publicKey, connected: isSolanaConnected, select, disconnect: disconnectSolana } = useWallet();

  useEffect(() => {
    const loadTokens = async () => {
      if (activeChain === 'ethereum') {
        const fetchedTokens = await fetchTokenList();
        const ethereumTokens = fetchedTokens.filter(token => token.chainId === 1);
        
        // Fetch prices for Ethereum tokens
        const tokensWithPrices = await Promise.all(ethereumTokens.map(async (token) => {
          const price = await fetchTokenPrice(token.address);
          return { ...token, price };
        }));

        const usdc = tokensWithPrices.find(token => token.symbol === 'USDC');
        
        const allTokens = [{ ...TSUKA, price: await fetchTokenPrice(TSUKA.address) }, ...tokensWithPrices];
        setTokens(allTokens);
        
        if (usdc) {
          setSellToken(usdc);
        }
        setBuyToken({ ...TSUKA, price: await fetchTokenPrice(TSUKA.address) });
      } else {
        // For Solana, you might need to implement a different price fetching mechanism
        const solanaTokens = [
          { ...DEFAULT_SOLANA_SELL_TOKEN, price: 1 }, // Placeholder price
          { ...DEFAULT_SOLANA_BUY_TOKEN, price: 1 }, // Placeholder price
        ];
        setTokens(solanaTokens);
        setSellToken(solanaTokens[0]);
        setBuyToken(solanaTokens[1]);
      }
    };

    loadTokens();
  }, [activeChain]);

  const modalRef = useRef<HTMLDivElement>(null);

  const openModal = (type: "sell" | "buy") => {
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSearchQuery("");
  };

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      closeModal();
    }
  };

  const selectToken = (token: Token) => {
    if (modalType === "sell") {
      setSellToken(token);
    } else {
      setBuyToken(token);
    }
    closeModal();
  };

  const swapTokens = () => {
    const tempToken = sellToken;
    setSellToken(buyToken);
    setBuyToken(tempToken);
    setSellAmount(buyAmount);
    setBuyAmount(sellAmount);
  };

  const handleSwap = async () => {
    if (activeChain === 'ethereum') {
      await handleEthereumSwap();
    } else {
      await handleSolanaSwap();
    }
  };

  const handleEthereumSwap = async () => {
    // Implement Ethereum swap logic using the existing price.tsx and quote.tsx
    // This is a simplified version, you'll need to adapt it to your specific needs
    const params = {
      sellToken: sellToken?.address,
      buyToken: buyToken?.address,
      sellAmount: parseUnits(sellAmount, sellToken?.decimals || 18).toString(),
      takerAddress: address,
      feeRecipient: FEE_RECIPIENT,
      buyTokenPercentageFee: AFFILIATE_FEE,
    };

    try {
      const response = await fetch(`/api/quote?${qs.stringify(params)}`);
      const quoteData = await response.json();

      // Here you would typically call a smart contract function to execute the swap
      // For simplicity, we're just logging the quote data
      console.log("Ethereum swap quote:", quoteData);
      // Implement the actual swap execution here
    } catch (error) {
      console.error("Error fetching Ethereum swap quote:", error);
    }
  };

  const handleSolanaSwap = async () => {
    console.log("Solana swap not implemented yet");
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: 50,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setIsAnalyzeModalOpen(true);
    try {
      if (chartRef.current) {
        const chartData = await chartRef.current.getChartData();
        if (chartData) {
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ chartData }),
          });
          const data = await response.json();
          setAnalysis(data.analysis);
        } else {
          setAnalysis("Failed to retrieve chart data. Please try again.");
        }
      } else {
        setAnalysis("Chart reference is not available. Please try again.");
      }
    } catch (error) {
      console.error('Error analyzing chart data:', error);
      setAnalysis("An error occurred while analyzing the chart data. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleScreenshot = async (imageData: string) => {
    console.log("Screenshot received, length:", imageData.length);
    setChartImage(imageData);
    try {
      console.log("Sending screenshot to API for analysis");
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });
      const data = await response.json();
      console.log("Analysis response:", data);
      setAnalysis(data.analysis || "No analysis provided");
    } catch (error) {
      console.error('Error analyzing chart image:', error);
      setAnalysis("An error occurred while analyzing the chart image. Please try again.");
    }
  };

  const fetchPrice = useCallback(async (amount: string) => {
    if (!sellToken || !buyToken || !amount || parseFloat(amount) === 0) {
      setBuyAmount("0");
      return;
    }

    const params = {
      sellToken: sellToken.address,
      buyToken: buyToken.address,
      sellAmount: parseUnits(amount, sellToken.decimals).toString(),
      // Add other necessary parameters like chainId, takerAddress, etc.
    };

    try {
      const response = await fetch(`/api/price?${qs.stringify(params)}`);
      const data = await response.json();

      if (data.buyAmount) {
        setBuyAmount(formatUnits(data.buyAmount, buyToken.decimals));
      }
    } catch (error) {
      console.error("Error fetching price:", error);
      setBuyAmount("0");
    }
  }, [sellToken, buyToken]);

  const handleSellAmountChange = (amount: string) => {
    // Allow empty string or valid numbers
    if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
      setSellAmount(amount);  // Set the amount as is, allowing empty string
      // Trigger price fetch only if amount is not empty and not zero
      if (amount !== '' && parseFloat(amount) > 0) {
        fetchPrice(amount);
      } else {
        setBuyAmount(''); // Reset buy amount to empty string if sell amount is empty or zero
      }
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-4 w-full pt-0 px-4 pb-6 max-w-[1400px] mx-auto justify-center">
      <div className="w-full xl:w-[58%] bg-gray-800 rounded-lg overflow-hidden" style={{ height: '500px' }}>
        <div className="p-3 text-white flex items-center justify-between">
          <button
            onClick={handleAnalyze}
            className="bg-[#77be44] hover:bg-[#69a93d] text-black font-semibold py-2 px-4 rounded text-sm transition-colors"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        <div className="h-[calc(100%-52px)]">
          {buyToken && <TokenChart ref={chartRef} key={buyToken.symbol} token={buyToken} onScreenshot={handleScreenshot} />}
        </div>
      </div>
      <div className="w-full xl:w-[32%] bg-gray-800 rounded-lg p-6 text-white" style={{ height: '500px' }}>
        <div className="h-full flex flex-col">
          <motion.div 
            variants={itemVariants} 
            initial="hidden"
            animate="visible"
            className="flex justify-end mb-6"
          >
            {activeChain === 'ethereum' ? (
              <ConnectKitButton.Custom>
                {({ isConnected, show, truncatedAddress, ensName }) => {
                  return (
                    <button
                      onClick={show}
                      className="bg-[#efb71b] hover:bg-[#d6a118] transition-colors rounded-md py-2 px-4 text-black font-semibold text-sm"
                    >
                      {isConnected ? (ensName ?? truncatedAddress) : 'Connect Wallet'}
                    </button>
                  );
                }}
              </ConnectKitButton.Custom>
            ) : (
              <WalletMultiButton className="!bg-[#efb71b] hover:!bg-[#d6a118] !text-black !py-2 !px-4 !rounded-md !font-semibold !text-sm" />
            )}
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeChain}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col flex-grow"
            >
              <motion.div variants={itemVariants} className="mb-4">
                <TokenInput
                  label="Sell"
                  amount={sellAmount}
                  setAmount={handleSellAmountChange}
                  token={sellToken}
                  openModal={() => openModal("sell")}
                />
              </motion.div>
              <motion.div variants={itemVariants} className="flex justify-center mb-4">
                <button 
                  onClick={swapTokens}
                  className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors"
                >
                  <ArrowUpDown className="text-[#77be44] w-6 h-6" />
                </button>
              </motion.div>
              <motion.div variants={itemVariants} className="mb-6">
                <TokenInput
                  label="Buy"
                  amount={buyAmount}
                  setAmount={() => {}} // This is read-only
                  token={buyToken}
                  openModal={() => openModal("buy")}
                  readOnly={true}
                />
              </motion.div>
              <motion.div variants={itemVariants} className="mt-auto">
                <button 
                  onClick={activeChain === 'ethereum' ? handleSwap : handleSolanaSwap}
                  disabled={!isEthereumConnected && !isSolanaConnected}
                  className="w-full py-4 px-6 bg-[#77be44] rounded-md text-xl font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Swap
                </button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleOutsideClick}>
            <TokenModal
              ref={modalRef}
              closeModal={closeModal}
              tokens={tokens}
              selectToken={selectToken}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>
        )}
      </div>
      {/* Analyze Modal */}
      {isAnalyzeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">AI Analysis</h2>
              <button
                onClick={() => setIsAnalyzeModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="text-white">
              {isAnalyzing ? (
                <p>Analyzing chart data...</p>
              ) : analysis ? (
                <p className="whitespace-pre-wrap">{analysis}</p>
              ) : (
                <p>No analysis available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TokenInput({ label, amount, setAmount, token, openModal, readOnly = false }: {
  label: string;
  amount: string;
  setAmount: (amount: string) => void;
  token: Token | null;
  openModal: () => void;
  readOnly?: boolean;
}) {
  const [usdValue, setUsdValue] = useState<string>("0.00");

  useEffect(() => {
    const calculateUsdValue = async () => {
      if (token && amount && parseFloat(amount) > 0) {
        try {
          const tokenPrice = await fetchTokenPrice(token.address);
          const calculatedValue = parseFloat(amount) * tokenPrice;
          setUsdValue(calculatedValue.toFixed(2));
        } catch (error) {
          console.error("Error calculating USD value:", error);
          setUsdValue("0.00");
        }
      } else {
        setUsdValue("0.00");
      }
    };

    calculateUsdValue();
  }, [token, amount]);

  return (
    <div className="p-4 rounded-md bg-gray-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <div className="flex justify-between items-center">
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-transparent text-2xl font-semibold outline-none w-1/2"
          readOnly={readOnly}
          placeholder="0"
        />
        <button
          onClick={openModal}
          className="flex items-center space-x-2 bg-gray-600 rounded-md py-2 px-4 hover:bg-gray-500 transition-colors"
        >
          {token?.logoURI && (
            <div className="w-6 h-6 relative">
              <Image
                src={token.logoURI}
                alt={token.name}
                layout="fill"
                objectFit="cover"
                className="rounded-full"
              />
            </div>
          )}
          <span className="text-sm font-medium">{token?.symbol}</span>
          <ChevronDown className="text-gray-400 w-4 h-4" />
        </button>
      </div>
      <div className="text-gray-400 text-sm mt-2">
        ${usdValue}
      </div>
    </div>
  );
}

const TokenModal = React.forwardRef<HTMLDivElement, {
  closeModal: () => void;
  tokens: Token[];
  selectToken: (token: Token) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}>(({ closeModal, tokens, selectToken, searchQuery, setSearchQuery }, ref) => {
  const [filteredTokens, setFilteredTokens] = useState<Token[]>(tokens);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const filterTokens = async () => {
      setIsSearching(true);
      setSearchError(null);

      if (searchQuery.trim() === '') {
        setFilteredTokens(tokens);
      } else if (isAddress(searchQuery)) {
        // Search by address
        try {
          const tokenInfo = await fetchTokenInfo(searchQuery);
          setFilteredTokens(tokenInfo ? [tokenInfo] : []);
        } catch (error) {
          setSearchError('Token not found');
          setFilteredTokens([]);
        }
      } else {
        // Search by name or symbol
        const filtered = tokens.filter((token) =>
          (token.name as string).toLowerCase().includes(searchQuery.toLowerCase()) ||
          (token.symbol as string).toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredTokens(filtered);
      }

      setIsSearching(false);
    };

    filterTokens();
  }, [searchQuery, tokens]);

  return (
    <div ref={ref} className="bg-gray-800 w-96 rounded-lg p-6 space-y-4 max-h-[80vh] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Select a token</h2>
        <button onClick={closeModal}>
          <X className="text-gray-400" />
        </button>
      </div>
      <div className="relative">
        <input
          type="text"
          placeholder="Search name or paste address"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-700 rounded-md py-2 px-4 pl-10 outline-none"
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" />
      </div>
      <div className="space-y-2 overflow-y-auto flex-grow">
        {isSearching ? (
          <div className="text-center py-4">Searching...</div>
        ) : searchError ? (
          <div className="text-center py-4 text-red-500">{searchError}</div>
        ) : (
          <>
            <h3 className="text-gray-400">Available tokens</h3>
            {filteredTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => selectToken(token)}
                className="flex items-center justify-between w-full p-2 hover:bg-gray-700 rounded-md transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {token.logoURI && (
                    <div className="w-8 h-8 relative">
                      <Image
                        src={token.logoURI}
                        alt={token.name}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-full"
                      />
                    </div>
                  )}
                  <div className="text-left">
                    <div>{token.name}</div>
                    <div className="text-gray-400">{token.symbol}</div>
                  </div>
                </div>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
});

TokenModal.displayName = 'TokenModal';

// Function to fetch token info by address
async function fetchTokenInfo(address: string): Promise<Token | null> {
  // Implement this function to fetch token info from an API or blockchain
  // Return null if token not found
  // This is a placeholder implementation
  return null;
}

// Add this function at the end of the file
async function fetchTokenPrice(tokenAddress: string): Promise<number> {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd`);
    const data = await response.json();
    return data[tokenAddress.toLowerCase()]?.usd || 0;
  } catch (error) {
    console.error("Error fetching token price:", error);
    return 0;
  }
}