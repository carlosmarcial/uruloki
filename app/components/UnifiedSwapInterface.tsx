'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronDown, ArrowUpDown, Search, X, Wallet, ArrowUp } from "lucide-react";
import Image from "next/image";
import { useAccount, useBalance, useChainId, useConnect, useDisconnect, useContractRead, useWaitForTransactionReceipt, useConfig, useWriteContract, useEstimateGas, useSignTypedData, useSendTransaction, usePublicClient } from 'wagmi';
import { useSimulateContract } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatUnits, parseUnits } from "viem";
import { erc20Abi } from '@app/abis/erc20Abi';
import { Address } from 'viem';
import { MAINNET_TOKENS, MAX_ALLOWANCE, MAINNET_EXCHANGE_PROXY } from "../../src/constants";
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import TokenChart, { TokenChartRef } from './TokenChart';
import TokenSelector from '../token-list/TokenSelector';
import { fetchTokenList, Token } from '@/lib/fetchTokenList';
import { fetchTokenPrice } from '../utils/priceUtils';
import { EXCHANGE_PROXY_ABI, EXCHANGE_PROXY_ADDRESSES, ERC20_ABI } from '@app/constants';
import TokenSelectModal from '@/app/components/TokenSelectModal';
import { simulateContract, waitForTransactionReceipt } from 'wagmi/actions';
import ChainToggle from './ChainToggle';
import MainTrading from './ChainToggle';
import { WalletButton } from './WalletButton';
import TokenImage from './TokenImage';
import { mainnet, polygon, optimism, arbitrum, base, avalanche, bsc, linea, mantle, scroll } from 'wagmi/chains';
import { fetchJupiterQuote, getSwapInstructions, NATIVE_SOL_MINT, WRAPPED_SOL_MINT, fetchSwapInstructions } from '@/app/utils/jupiterApi';
import { Connection, sendAndConfirmTransaction, PublicKey, Transaction, VersionedTransaction, TransactionInstruction, Commitment, AddressLookupTableProgram, TransactionMessage, AddressLookupTableAccount, ConnectionConfig, VersionedMessage } from '@solana/web3.js';
import { getConnection, getLatestBlockhashWithRetry, sendAndConfirmTransactionWithRetry, getWebSocketConnection } from '../utils/solanaUtils';
import { SOLANA_RPC_ENDPOINT } from '../constants';
import { Token, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BigNumber from 'bignumber.js';
import { SOLANA_TOKENS_BY_SYMBOL } from '../constants';
import { retry } from '@/app/utils/retry';
import TokenInput from './TokenInput';
import { formatDisplayAmount } from '../utils/formatAmount';
import { formatTokenAmount } from '@/app/utils/formatAmount';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { DEFAULT_SLIPPAGE_BPS } from '../constants';
import { debounce } from 'lodash';
import SwapConfirmationModal from './SwapConfirmationModal';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { ComputeBudgetProgram } from '@solana/web3.js';
import fetch from 'cross-fetch';
import { solanaWebSocket } from '../utils/solanaWebSocket';

// Add these animation variants
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

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

interface SolanaToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  tags: string[];
  daily_volume: number;
}

const checkBalance = async (solanaWallet: any) => {
  const connection = getConnection();
  const balance = await connection.getBalance(solanaWallet.publicKey);
  const minimumBalance = 0.01 * LAMPORTS_PER_SOL; // 0.01 SOL for fees
  if (balance < minimumBalance) {
    throw new Error('Insufficient SOL balance for transaction fees');
  }
};

// Add this function at the top of your component
const isTransactionValid = (transaction: VersionedTransaction) => {
  if (!transaction.message || !transaction.message.recentBlockhash) {
    console.error('Invalid transaction: missing message or recentBlockhash');
    return false;
  }
  if (transaction.message.compiledInstructions.length === 0) {
    console.error('Invalid transaction: no instructions');
    return false;
  }
  return true;
};

export default function UnifiedSwapInterface({ activeChain, setActiveChain }: {
  activeChain: 'ethereum' | 'solana';
  setActiveChain: (chain: 'ethereum' | 'solana') => void;
}) {
  // Use the regular HTTP connection
  const connection = getConnection();

  // State declarations
  const [tokens, setTokens] = useState<Token[]>([]);
  const [solanaTokens, setSolanaTokens] = useState<SolanaToken[]>([]);
  const [sellToken, setSellToken] = useState<Token | SolanaToken | null>(null);
  const [buyToken, setBuyToken] = useState<Token | SolanaToken | null>(null);
  const [sellAmount, setSellAmount] = useState<string>('');
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [isTokenSelectModalOpen, setIsTokenSelectModalOpen] = useState(false);
  const [selectingTokenFor, setSelectingTokenFor] = useState<'sell' | 'buy' | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"sell" | "buy">("sell");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('swap');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  
  const [approvalState, setApprovalState] = useState<'idle' | 'needed' | 'approving' | 'approved'>('idle');
  const [approveRequest, setApproveRequest] = useState<any>(null);
  
  const chartRef = useRef<TokenChartRef>(null);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const publicClient = usePublicClient();
  const { signTypedDataAsync } = useSignTypedData();
  const { sendTransactionAsync } = useSendTransaction();
  const { waitForTransactionReceipt } = useWaitForTransactionReceipt();

  // Solana wallet
  const solanaWallet = useWallet();

  // Move checkWalletReady inside the component
  const checkWalletReady = () => {
    if (!solanaWallet.connected) {
      throw new Error('Wallet is not connected');
    }
    if (!solanaWallet.publicKey) {
      throw new Error('Wallet public key is not available');
    }
    if (!solanaWallet.signTransaction) {
      throw new Error('Wallet does not support transaction signing');
    }
  };

  const exchangeProxyAddress = EXCHANGE_PROXY_ADDRESSES[chainId];

  const { data: allowance, refetch: refetchAllowance } = useContractRead({
    address: sellToken?.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address, exchangeProxyAddress],
    watch: true,
    enabled: !!sellToken && !!address && !!chainId && !!exchangeProxyAddress && activeChain === 'ethereum',
  });

  const { writeContract: approveToken, data: approveData } = useWriteContract();

  const { isLoading: isApproving, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveData?.hash,
  });

  const { writeContract, data: swapData, isLoading: isSwapPending, isError: isSwapError } = useWriteContract();

  const { isLoading: isSwapLoading, isSuccess: isSwapSuccess } = useWaitForTransactionReceipt({
    hash: swapData?.hash,
  });

  const { estimateGas } = useEstimateGas();

  // Check if approval is needed and prepare approval request
  useEffect(() => {
    if (sellToken && sellAmount && allowance !== undefined && exchangeProxyAddress) {
      const sellAmountBigInt = parseUnits(sellAmount, sellToken.decimals);
      if (sellAmountBigInt > allowance) {
        setApprovalState('needed');
        setApproveRequest({
          address: sellToken.address,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [exchangeProxyAddress, sellAmountBigInt],
        });
      } else {
        setApprovalState('approved');
        setApproveRequest(null);
      }
    }
  }, [sellToken, sellAmount, allowance, exchangeProxyAddress]);

  // Handle approval success
  useEffect(() => {
    if (isApproveSuccess) {
      setApprovalState('approved');
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  const handleApprove = useCallback(() => {
    if (approveRequest) {
      approveToken(approveRequest);
      setApprovalState('approving');
    }
  }, [approveRequest, approveToken]);

  const [swapError, setSwapError] = useState<string | null>(null);

  const handleSwap = async () => {
    console.log('handleSwap function called');
    if (!isConnected || !sellToken || !buyToken || !sellAmount || !address || !chainId) {
      console.log('Missing required data for swap');
      return;
    }

    try {
      console.log('Fetching swap quote with params:', {
        chainId,
        sellToken: sellToken.address,
        buyToken: buyToken.address,
        sellAmount: parseUnits(sellAmount, sellToken.decimals).toString(),
        takerAddress: address,
      });

      const response = await axios.get('/api/swap-price', {
        params: {
          chainId,
          sellToken: sellToken.address,
          buyToken: buyToken.address,
          sellAmount: parseUnits(sellAmount, sellToken.decimals).toString(),
          takerAddress: address,
          affiliateAddress: '0x765d4129bbe4C9b134f307E2B10c6CF75Fe0e2f6',
          affiliateFee: '0.01', // 1% fee
        }
      });

      console.log('Swap quote received:', response.data);

      const quote = response.data;

      // Update the UI with the buy amount
      setBuyAmount(quote.buyAmount);

      let signature: string | undefined;
      if (quote.permit2 && quote.permit2.eip712) {
        // Sign the permit2 message
        signature = await signTypedDataAsync(quote.permit2.eip712);
        console.log('Signature:', signature);
      } else {
        console.log('No permit2 data in the quote, proceeding without signature');
      }

      // Prepare transaction data
      let txData = quote.data;
      if (signature) {
        const MAGIC_CALLDATA_STRING = "f".repeat(130);
        txData = quote.data.replace(MAGIC_CALLDATA_STRING, signature.slice(2)) as `0x${string}`;
      }

      // Send the transaction
      const { hash } = await sendTransactionAsync({
        to: quote.to as `0x${string}`,
        data: txData,
        value: BigInt(quote.value || 0),
        gas: BigInt(quote.gas || 0),
      });

      console.log('Transaction sent:', hash);

      // Wait for the transaction to be mined
      const receipt = await waitForTransactionReceipt({ hash });
      console.log('Transaction mined:', receipt);

      // Update UI or state to reflect successful swap
      // ...

    } catch (error) {
      console.error('Swap failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      }
      setSwapError(error.response?.data?.error || error.message || 'An unknown error occurred');
    }
  };

  const swapTokens = () => {
    setSellToken(buyToken);
    setBuyToken(sellToken);
    setSellAmount(buyAmount);
    setBuyAmount(sellAmount);
  };

  const fetchTokens = useCallback(async () => {
    const fetchedTokens = await fetchTokenList(chainId);
    setTokens(fetchedTokens);
  }, [chainId]);

  const fetchSolanaTokens = useCallback(async () => {
    const response = await fetch('https://token.jup.ag/strict');
    const tokens = await response.json();
    
    // Add native SOL to the list
    tokens.unshift({
      address: '11111111111111111111111111111111',
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
    });

    setSolanaTokens(tokens);
  }, []);

  useEffect(() => {
    if (activeChain === 'ethereum') {
      fetchTokens();
    } else {
      fetchSolanaTokens();
    }
  }, [activeChain, fetchTokens, fetchSolanaTokens]);

  const openTokenSelectModal = (type: 'sell' | 'buy') => {
    setSelectingTokenFor(type);
    setIsTokenSelectModalOpen(true);
  };

  const closeTokenSelectModal = () => {
    setIsTokenSelectModalOpen(false);
    setSelectingTokenFor(null);
  };

  const handleTokenSelect = (token: Token | SolanaToken) => {
    if (selectingTokenFor === 'sell') {
      setSellToken(token);
    } else if (selectingTokenFor === 'buy') {
      setBuyToken(token);
    }
    closeTokenSelectModal();
  };

  const renderTokenSelector = (token: Token | SolanaToken | null, onClick: () => void) => (
    <div className="flex items-center justify-between bg-gray-800 rounded-full px-4 py-2 cursor-pointer" onClick={onClick}>
      {token ? (
        <>
          <div className="flex items-center">
            <TokenImage
              src={token.logoURI}
              alt={token.name}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="text-white font-semibold">{token.symbol}</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </>
      ) : (
        <span className="text-gray-400">Select token</span>
      )}
    </div>
  );

  const chainOptions = [
    { id: mainnet.id, name: 'Ethereum' },
    { id: polygon.id, name: 'Polygon' },
    { id: optimism.id, name: 'Optimism' },
    { id: arbitrum.id, name: 'Arbitrum' },
    { id: base.id, name: 'Base' },
    { id: avalanche.id, name: 'Avalanche' },
    { id: bsc.id, name: 'BSC' },
    { id: linea.id, name: 'Linea' },
    { id: mantle.id, name: 'Mantle' },
    { id: scroll.id, name: 'Scroll' },
  ];

  const renderChainSelector = () => (
    <select
      value={chainId}
      onChange={(e) => setChainId(Number(e.target.value))}
      className="bg-gray-800 text-white rounded-md p-2"
    >
      {chainOptions.map((chain) => (
        <option key={chain.id} value={chain.id}>
          {chain.name}
        </option>
      ))}
    </select>
  );

  const DEFAULT_SLIPPAGE_BPS = 100; // 1% slippage
  const [slippageTolerance, setSlippageTolerance] = useState(DEFAULT_SLIPPAGE_BPS);

  // Add this function to update slippage tolerance
  const updateSlippageTolerance = (newSlippage: number) => {
    setSlippageTolerance(newSlippage);
  };

  const [swapStatus, setSwapStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [swapMessage, setSwapMessage] = useState<string>('');
  const [inputToken, setInputToken] = useState<string>('');
  const [outputToken, setOutputToken] = useState<string>('');
  const [inputAmount, setInputAmount] = useState<string>('');
  const [quoteResponse, setQuoteResponse] = useState<any>(null);

  const fetchQuote = async () => {
    if (!sellToken || !buyToken || !sellAmount || parseFloat(sellAmount) <= 0) {
      console.log('Skipping quote fetch: Invalid input');
      setBuyAmount('');
      setQuoteResponse(null);
      return;
    }

    try {
      const inputAmount = parseUnits(sellAmount, sellToken.decimals).toString();
      console.log('Fetching quote with params:', {
        inputMint: sellToken.address,
        outputMint: buyToken.address,
        amount: inputAmount,
        slippageBps: slippageTolerance
      });
      const response = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${sellToken.address}&outputMint=${buyToken.address}&amount=${inputAmount}&slippageBps=${slippageTolerance}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Quote data:', data);
      const outAmount = formatUnits(BigInt(data.outAmount), buyToken.decimals);
      setBuyAmount(outAmount);
      setQuoteResponse(data);
    } catch (error) {
      console.error('Error fetching quote:', error);
      setBuyAmount('');
      setQuoteResponse(null);
    }
  };

  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  const updateBuyAmount = useCallback(async () => {
    if (sellToken && buyToken && sellAmount && parseFloat(sellAmount) > 0) {
      setIsLoadingPrice(true);
      try {
        console.log('Fetching quote with params:', {
          inputMint: sellToken.address,
          outputMint: buyToken.address,
          amount: parseFloat(sellAmount) * Math.pow(10, sellToken.decimals),
          slippageBps: DEFAULT_SLIPPAGE_BPS,
        });
        
        const quoteResponse = await fetchJupiterQuote({
          inputMint: sellToken.address,
          outputMint: buyToken.address,
          amount: parseFloat(sellAmount) * Math.pow(10, sellToken.decimals),
          slippageBps: DEFAULT_SLIPPAGE_BPS,
        });
        
        console.log('Quote response:', quoteResponse);
        
        if (quoteResponse.outAmount) {
          setBuyAmount(formatTokenAmount(quoteResponse.outAmount, buyToken.decimals));
        } else if (quoteResponse.error) {
          console.error('Jupiter API error:', quoteResponse.error);
          setBuyAmount('');
          setSwapMessage(`Swap not available: ${quoteResponse.error}`);
        } else {
          console.error('Invalid quote response:', quoteResponse);
          setBuyAmount('');
          setSwapMessage('Error fetching price. Invalid response from API.');
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
        setBuyAmount('');
        setSwapMessage(`Error fetching price: ${error.message}`);
      } finally {
        setIsLoadingPrice(false);
      }
    } else {
      setBuyAmount('');
    }
  }, [sellToken, buyToken, sellAmount]);

  const debouncedUpdateBuyAmount = useCallback(debounce(updateBuyAmount, 500), [updateBuyAmount]);

  useEffect(() => {
    debouncedUpdateBuyAmount();
    return () => debouncedUpdateBuyAmount.cancel();
  }, [sellToken, buyToken, sellAmount, debouncedUpdateBuyAmount]);

  const fetchSwapTransaction = async (quoteResponse: any) => {
    const response = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: solanaWallet.publicKey.toString(),
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto",
      })
    });
    return await response.json();
  };

  const sendTransactionWithRetry = async (connection: Connection, transaction: Transaction, signers: Keypair[], commitment: Commitment = 'confirmed') => {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;

    const signedTransaction = await solanaWallet.signTransaction(transaction);

    return await connection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: true,
      maxRetries: 3,
    });
  };

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  const handleSwapClick = () => {
    setIsConfirmationModalOpen(true);
  };

  const handleConfirmSwap = async () => {
    setIsConfirmationModalOpen(false);
    try {
      await executeSolanaSwap();
    } catch (error: any) {
      console.error('Swap execution failed:', error);
      setSwapStatus('error');
      setSwapMessage(`Swap failed: ${error.message || 'Unknown error'}`);
    }
  };

  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);

  const executeSolanaSwap = async () => {
    console.group('Solana Swap Execution');
    try {
      console.log('Starting swap execution');
      checkWalletReady();

      console.log('Fetching Jupiter quote');
      const quoteResponse = await fetchJupiterQuote({
        inputMint: sellToken?.address || '',
        outputMint: buyToken?.address || '',
        amount: sellAmount ? (parseFloat(sellAmount) * Math.pow(10, sellToken?.decimals || 9)).toString() : '0',
        slippageBps: DEFAULT_SLIPPAGE_BPS,
      });
      console.log('Jupiter quote received:', quoteResponse);

      console.log('Fetching swap instructions');
      const swapInstructions = await fetchSwapInstructions({
        quoteResponse,
        userPublicKey: solanaWallet.publicKey?.toString() || '',
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto",
      });
      console.log('Swap instructions received:', swapInstructions);

      if (!swapInstructions.swapTransaction) {
        throw new Error('Swap transaction is undefined');
      }

      console.log('Creating versioned transaction');
      const versionedTransaction = VersionedTransaction.deserialize(Buffer.from(swapInstructions.swapTransaction, 'base64'));

      console.log('Transaction details:', {
        recentBlockhash: versionedTransaction.message.recentBlockhash,
        instructions: versionedTransaction.message.compiledInstructions.length,
        signers: versionedTransaction.message.header.numRequiredSignatures
      });

      console.log('Signing transaction');
      try {
        if (!solanaWallet.signTransaction) {
          throw new Error('Wallet does not support transaction signing');
        }
        console.log('Wallet publicKey:', solanaWallet.publicKey?.toString());
        
        // Sign the VersionedTransaction directly
        const signedTransaction = await solanaWallet.signTransaction(versionedTransaction);
        console.log('Transaction signed successfully');

        console.log('Sending transaction');
        const connection = getConnection();
        const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: true,
          maxRetries: 3,
          preflightCommitment: 'confirmed',
        });
        console.log('Transaction sent, signature:', signature);

        setTransactionSignature(signature);

        console.log('Confirming transaction');
        const status = await confirmTransaction(connection, signature, 60000); // 60 seconds timeout
        console.log('Transaction status:', status);

        if (status === 'success') {
          console.log('Swap transaction confirmed:', signature);
          setSwapStatus('success');
          setSwapMessage(`Swap successful! Transaction signature: ${signature}`);
        } else if (status === 'timeout') {
          throw new Error(`Transaction confirmation timed out. Please check the transaction manually: ${signature}`);
        } else {
          throw new Error(`Transaction failed with status: ${status}. Please check the transaction manually: ${signature}`);
        }

      } catch (error: any) {
        console.error('Error signing or sending transaction:', error);
        if (error instanceof Error) {
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        } else {
          console.error('Unknown error type:', typeof error);
        }
        throw new Error(`Failed to sign or send transaction: ${error.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Solana swap failed:', error);
      setSwapStatus('error');
      setSwapMessage(`Swap failed: ${error.message}. If a signature was generated, please check it manually: ${error.signature || 'N/A'}`);
    } finally {
      console.groupEnd();
    }
  };

  const confirmTransaction = async (connection: Connection, signature: string, timeout = 60000): Promise<'success' | 'timeout' | 'error'> => {
    const start = Date.now();
    let status: 'success' | 'timeout' | 'error' = 'error';

    while (Date.now() - start < timeout) {
      const signatureStatus = await connection.getSignatureStatus(signature);
      const confirmationStatus = signatureStatus.value?.confirmationStatus;

      if (confirmationStatus === 'confirmed' || confirmationStatus === 'finalized') {
        status = 'success';
        break;
      } else if (signatureStatus.value?.err) {
        status = 'error';
        break;
      }

      // Wait for 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (status === 'error') {
      const tx = await connection.getTransaction(signature, { maxSupportedTransactionVersion: 0 });
      console.log('Transaction details:', tx);
    }

    return status === 'error' && Date.now() - start >= timeout ? 'timeout' : status;
  };

  const verifySolscanTransaction = async (signature: string) => {
    const solscanUrl = `https://api.solscan.io/transaction?tx=${signature}`;
    try {
      const response = await fetch(solscanUrl);
      const data = await response.json();
      if (data.status === 'Success') {
        console.log('Transaction verified on Solscan:', solscanUrl);
        return true;
      } else {
        console.log('Transaction not found on Solscan:', solscanUrl);
        return false;
      }
    } catch (error) {
      console.error('Error verifying transaction on Solscan:', error);
      return false;
    }
  };

  const wallet = useWallet();

  // Make sure the wallet is connected before allowing the swap
  const isWalletConnected = wallet.connected && wallet.publicKey;

  // You might want to add a useEffect to check the wallet connection status
  useEffect(() => {
    if (wallet.connected) {
      console.log('Wallet connected:', wallet.publicKey?.toBase58());
    } else {
      console.log('Wallet not connected');
    }
  }, [wallet.connected, wallet.publicKey]);

  const renderEthereumSwapInterface = () => {
    const isSwapDisabled = !isConnected || !sellToken || !buyToken || !sellAmount || isSwapPending || isSwapLoading;
    console.log('Swap button disabled:', isSwapDisabled);

    return (
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="mb-4">
          <ConnectButton />
        </div>
        <div className="mb-4">
          {renderChainSelector()}
        </div>

        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Sell</span>
          </div>
          <div className="flex items-center bg-gray-800 rounded-lg p-3">
            <input
              type="number"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              className="bg-transparent text-white text-2xl w-full outline-none"
              placeholder="0"
            />
            {renderTokenSelector(sellToken, () => openTokenSelectModal('sell'))}
          </div>
        </div>
        <div className="flex justify-center mb-4">
          <div className="bg-gray-800 p-2 rounded-full cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Buy</span>
          </div>
          <div className="flex items-center bg-gray-800 rounded-lg p-3">
            <input
              type="number"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              className="bg-transparent text-white text-2xl w-full outline-none"
              placeholder="0"
              readOnly
            />
            {renderTokenSelector(buyToken, () => openTokenSelectModal('buy'))}
          </div>
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleSwap}
            disabled={isSwapDisabled}
            className="py-3 px-4 bg-pink-500 text-white rounded-lg font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed w-2/3"
          >
            {!isConnected ? 'Connect Wallet' : isSwapPending ? 'Confirm in Wallet...' : isSwapLoading ? 'Swapping...' : 'Swap'}
          </button>
        </div>
        {isSwapSuccess && <div className="mt-2 text-center text-green-500">Swap successful!</div>}
        {swapError && <div className="mt-2 text-center text-red-500">Swap failed: {swapError}</div>}
      </div>
    );
  };

  const renderSolanaSwapInterface = () => {
    const isSolanaSwapDisabled = !solanaWallet.connected || !sellToken || !buyToken || !sellAmount;

    return (
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="mb-4">
          <WalletButton />
        </div>

        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Sell</span>
          </div>
          <div className="flex items-center bg-gray-800 rounded-lg p-3">
            <input
              type="number"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              className="bg-transparent text-white text-2xl w-full outline-none"
              placeholder="0"
            />
            {renderTokenSelector(sellToken, () => openTokenSelectModal('sell'))}
          </div>
        </div>
        <div className="flex justify-center mb-4">
          <div className="bg-gray-800 p-2 rounded-full cursor-pointer" onClick={swapTokens}>
            <ArrowUpDown className="h-6 w-6 text-gray-400" />
          </div>
        </div>
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Buy</span>
          </div>
          <div className="flex items-center bg-gray-800 rounded-lg p-3">
            <input
              type="text"
              value={formatDisplayAmount(buyAmount, buyToken?.decimals || 6)}
              readOnly
              className="bg-transparent text-white text-2xl w-full outline-none"
              placeholder="0"
            />
            {renderTokenSelector(buyToken, () => openTokenSelectModal('buy'))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400">Slippage Tolerance (%)</label>
          <input
            type="number"
            value={slippageTolerance / 100} // Convert basis points to percentage
            onChange={(e) => setSlippageTolerance(Math.max(0, Math.min(100, parseFloat(e.target.value))) * 100)} // Convert percentage to basis points
            className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white"
            placeholder="0.5"
            min="0"
            max="100"
            step="0.1"
          />
        </div>
        <div className="flex justify-center">
          <button 
            onClick={handleSwapClick} 
            disabled={!sellToken || !buyToken || !sellAmount || parseFloat(sellAmount) <= 0 || !buyAmount || parseFloat(buyAmount) <= 0 || swapStatus === 'pending'}
            className={`w-full py-3 rounded-lg font-semibold ${
              (!sellToken || !buyToken || !sellAmount || parseFloat(sellAmount) <= 0 || !buyAmount || parseFloat(buyAmount) <= 0 || swapStatus === 'pending')
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {swapStatus === 'pending' ? 'Swapping...' : 'Swap'}
          </button>
        </div>
        {swapError && <div className="mt-2 text-center text-red-500">{swapError}</div>}
        {swapStatus === 'error' && <p className="error-message">{swapMessage}</p>}
      </div>
    );
  };

  useEffect(() => {
    console.log('Sell Token:', sellToken);
    console.log('Buy Token:', buyToken);
    console.log('Sell Amount:', sellAmount);
  }, [sellToken, buyToken, sellAmount]);

  return (
    <div className="flex flex-col w-full max-w-[1400px] mx-auto justify-center">
      <div className="w-full mb-4">
        <ChainToggle activeChain={activeChain} setActiveChain={setActiveChain} />
      </div>
      <div className="flex flex-col xl:flex-row gap-2 w-full">
        <div className="w-full xl:w-[58%] bg-gray-800 rounded-lg overflow-hidden" style={{ height: '550px' }}>
          <TokenChart ref={chartRef} />
        </div>
        <div className="w-full xl:w-[42%] flex flex-col">
          {activeChain === 'ethereum' ? (
            <div className="flex-grow bg-gray-900 rounded-lg">
              {renderEthereumSwapInterface()}
            </div>
          ) : (
            <div className="flex-grow bg-gray-900 rounded-lg">
              {renderSolanaSwapInterface()}
            </div>
          )}
        </div>
        {isTokenSelectModalOpen && (
          <TokenSelectModal
            tokens={activeChain === 'ethereum' ? tokens : solanaTokens}
            onClose={closeTokenSelectModal}
            onSelect={handleTokenSelect}
          />
        )}
      </div>
      <SwapConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={handleConfirmSwap}
        sellAmount={sellAmount}
        buyAmount={buyAmount}
        sellToken={sellToken?.symbol || ''}
        buyToken={buyToken?.symbol || ''}
        slippage={DEFAULT_SLIPPAGE_BPS / 100}
        transactionSignature={transactionSignature}
      />
    </div>
  );
}

async function retryTransaction(
  connection: Connection,
  signedTransaction: VersionedTransaction,
  maxRetries = 3,
  initialBackoff = 1000
): Promise<string> {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: true,
        maxRetries: 1,
        preflightCommitment: 'confirmed',
      });
      console.log('Transaction sent, signature:', signature);
      return signature;
    } catch (error) {
      console.error(`Transaction failed (attempt ${retries + 1}):`, error);
      retries++;
      if (retries >= maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, initialBackoff * Math.pow(2, retries - 1)));
    }
  }
  throw new Error('Max retries reached');
}

async function confirmTransaction(connection: Connection, signature: string, timeout = 30000) {
  const start = Date.now();
  let status = await connection.getSignatureStatus(signature);
  
  while (Date.now() - start < timeout) {
    if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') {
      return status;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    status = await connection.getSignatureStatus(signature);
  }
  
  throw new Error(`Transaction was not confirmed in ${timeout / 1000} seconds`);
}