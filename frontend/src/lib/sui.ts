import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

// SUI Network configuration
export const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet') || 'testnet';
export const SUI_RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl(NETWORK);

// Initialize SUI client
export const suiClient = new SuiClient({ url: SUI_RPC_URL });

// SUI transaction utilities
export class SuiTransactionUtils {
  static async createPaymentTransaction(
    recipientAddress: string,
    amount: number,
    message?: string
  ) {
    const tx = new Transaction();
    
    // Create a coin transfer transaction
    const [coin] = tx.splitCoins(tx.gas, [amount * 1_000_000_000]); // Convert SUI to MIST
    tx.transferObjects([coin], recipientAddress);
    
    // Add memo/message if provided
    if (message) {
      // Note: SUI doesn't have built-in memo field, but we can track this off-chain
    }
    
    return tx;
  }

  static async getTransactionDetails(txHash: string) {
    try {
      const result = await suiClient.getTransactionBlock({
        digest: txHash,
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });
      return result;
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      throw error;
    }
  }

  static async getAddressBalance(address: string) {
    try {
      const balance = await suiClient.getBalance({
        owner: address,
      });
      return balance;
    } catch (error) {
      console.error('Error fetching address balance:', error);
      throw error;
    }
  }

  static async waitForTransaction(txHash: string, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const result = await this.getTransactionDetails(txHash);
        if (result) {
          return result;
        }
      } catch (error) {
        // Transaction not found yet, continue waiting
      }
      
      // Wait 2 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Transaction confirmation timeout');
  }

  static formatSuiAmount(amount: string | number): number {
    // Convert MIST to SUI
    return typeof amount === 'string' ? 
      parseInt(amount) / 1_000_000_000 : 
      amount / 1_000_000_000;
  }

  static formatMistAmount(amount: number): number {
    // Convert SUI to MIST
    return Math.floor(amount * 1_000_000_000);
  }
}

// SUI Name Service utilities
export class SuiNameService {
  static async resolveName(name: string): Promise<string | null> {
    try {
      // This is a placeholder - implement actual SUI NS resolution
      // You'll need to use the SUI NS smart contract
      console.log('Resolving SUI NS name:', name);
      return null; // Return the resolved address
    } catch (error) {
      console.error('Error resolving SUI NS name:', error);
      return null;
    }
  }

  static async getNameByAddress(address: string): Promise<string | null> {
    try {
      // This is a placeholder - implement reverse SUI NS lookup
      console.log('Looking up SUI NS name for address:', address);
      return null; // Return the resolved name
    } catch (error) {
      console.error('Error looking up SUI NS name:', error);
      return null;
    }
  }

  static validateSuiAddress(address: string): boolean {
    // Basic SUI address validation (addresses are 32 bytes, usually hex)
    const suiAddressRegex = /^0x[a-fA-F0-9]{64}$/;
    return suiAddressRegex.test(address);
  }

  static formatSuiAddress(address: string): string {
    if (!address) return '';
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}
