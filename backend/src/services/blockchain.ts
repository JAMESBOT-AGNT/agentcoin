import { ethers } from 'ethers';

// AgentCoin ERC-20 Token ABI (simplified)
const AGNT_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

export interface TransactionDetails {
  hash: string;
  blockNumber?: number;
  confirmations: number;
  gasUsed?: string;
  status?: number;
  timestamp?: number;
}

export class BlockchainService {
  private provider: ethers.Provider;
  private tokenContract: ethers.Contract;
  private signer?: ethers.Signer;

  constructor() {
    // Initialize provider (default to Ethereum mainnet or use env variable)
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // AgentCoin token contract address (replace with actual deployed address)
    const tokenAddress = process.env.AGNT_TOKEN_ADDRESS || '0x1234567890123456789012345678901234567890';
    this.tokenContract = new ethers.Contract(tokenAddress, AGNT_TOKEN_ABI, this.provider);

    // Initialize signer if private key is provided (for server-side transactions)
    if (process.env.ETHEREUM_PRIVATE_KEY) {
      this.signer = new ethers.Wallet(process.env.ETHEREUM_PRIVATE_KEY, this.provider);
      this.tokenContract = this.tokenContract.connect(this.signer) as ethers.Contract;
    }
  }

  /**
   * Get AGNT token balance for a wallet address
   */
  async getTokenBalance(walletAddress: string): Promise<number> {
    try {
      const balance = await this.tokenContract.balanceOf(walletAddress);
      const decimals = await this.tokenContract.decimals();
      
      // Convert from wei to human readable amount
      return parseFloat(ethers.formatUnits(balance, decimals));
    } catch (error) {
      console.error('Error getting token balance:', error);
      // Return 0 if there's an error (could be network issues, invalid address, etc.)
      return 0;
    }
  }

  /**
   * Get ETH balance for gas fees
   */
  async getEthBalance(walletAddress: string): Promise<number> {
    try {
      const balance = await this.provider.getBalance(walletAddress);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error getting ETH balance:', error);
      return 0;
    }
  }

  /**
   * Transfer AGNT tokens between addresses
   * Note: This requires the server to have signing capabilities
   */
  async transferTokens(fromAddress: string, toAddress: string, amount: number): Promise<string> {
    if (!this.signer) {
      throw new Error('No signer available. Set ETHEREUM_PRIVATE_KEY environment variable.');
    }

    try {
      const decimals = await this.tokenContract.decimals();
      const amountInWei = ethers.parseUnits(amount.toString(), decimals);

      // Estimate gas
      const gasEstimate = await this.tokenContract.transfer.estimateGas(toAddress, amountInWei);
      const gasPrice = await this.provider.getFeeData();

      // Send transaction
      const tx = await this.tokenContract.transfer(toAddress, amountInWei, {
        gasLimit: gasEstimate,
        gasPrice: gasPrice.gasPrice
      });

      console.log(`Transfer initiated: ${tx.hash}`);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log(`Transfer confirmed in block: ${receipt.blockNumber}`);

      return tx.hash;
    } catch (error) {
      console.error('Error transferring tokens:', error);
      throw new Error(`Token transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transaction details by hash
   */
  async getTransactionDetails(txHash: string): Promise<TransactionDetails> {
    try {
      const [tx, receipt] = await Promise.all([
        this.provider.getTransaction(txHash),
        this.provider.getTransactionReceipt(txHash)
      ]);

      if (!tx) {
        throw new Error('Transaction not found');
      }

      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = receipt ? currentBlock - receipt.blockNumber + 1 : 0;

      const result: TransactionDetails = {
        hash: tx.hash,
        blockNumber: (receipt?.blockNumber as number) || undefined,
        confirmations,
        gasUsed: receipt?.gasUsed?.toString(),
        status: (receipt?.status as number) || undefined
      };

      // Add timestamp if available
      if (tx.blockNumber) {
        const block = await this.provider.getBlock(tx.blockNumber);
        if (block?.timestamp && typeof block.timestamp === 'number') {
          result.timestamp = block.timestamp;
        }
      }

      return result;
    } catch (error) {
      console.error('Error getting transaction details:', error);
      throw new Error(`Failed to get transaction details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate Ethereum address
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Get token information
   */
  async getTokenInfo() {
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.tokenContract.name(),
        this.tokenContract.symbol(),
        this.tokenContract.decimals(),
        this.tokenContract.totalSupply()
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatUnits(totalSupply, decimals)
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }

  /**
   * Monitor token transfer events (for real-time updates)
   */
  async watchTransferEvents(callback: (from: string, to: string, amount: string, txHash: string) => void) {
    try {
      this.tokenContract.on('Transfer', (from, to, amount, event) => {
        const decimals = 18; // Assuming 18 decimals, should get from contract
        const readableAmount = ethers.formatUnits(amount, decimals);
        callback(from, to, readableAmount, event.transactionHash);
      });
    } catch (error) {
      console.error('Error setting up transfer event listener:', error);
    }
  }

  /**
   * Stop watching events
   */
  stopWatching() {
    this.tokenContract.removeAllListeners();
  }

  /**
   * Estimate gas for a token transfer
   */
  async estimateTransferGas(toAddress: string, amount: number): Promise<string> {
    try {
      const decimals = await this.tokenContract.decimals();
      const amountInWei = ethers.parseUnits(amount.toString(), decimals);
      
      const gasEstimate = await this.tokenContract.transfer.estimateGas(toAddress, amountInWei);
      return gasEstimate.toString();
    } catch (error) {
      console.error('Error estimating gas:', error);
      return '21000'; // Default gas limit for simple transfers
    }
  }

  /**
   * Get current gas price
   */
  async getCurrentGasPrice(): Promise<string> {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : '20';
    } catch (error) {
      console.error('Error getting gas price:', error);
      return '20'; // Default 20 gwei
    }
  }
}