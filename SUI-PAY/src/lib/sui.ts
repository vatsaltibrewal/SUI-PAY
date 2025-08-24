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
  // SUI NS contract addresses (these are mainnet addresses - update for testnet if needed)
  static readonly SUINS_REGISTRY_ID = '0x6e0ddefc0ad98889c04bab9639e512c21766c5e6366f89e696956d9be6952871';
  static readonly SUINS_RESOLUTION_ID = '0x6e0ddefc0ad98889c04bab9639e512c21766c5e6366f89e696956d9be6952871';

  static async resolveName(name: string): Promise<string | null> {
    try {
      // Remove @ and .suins if present, normalize the name
      const normalizedName = name.replace(/^@/, '').replace(/\.suins$/, '').toLowerCase();
      
      if (!normalizedName) return null;

      // For demo purposes, we'll implement a mock resolution
      // In production, you'd query the actual SUI NS smart contract
      const mockResolution = await this.mockSuiNSResolution(normalizedName);
      
      console.log(`Resolving SUI NS name: ${normalizedName} -> ${mockResolution}`);
      return mockResolution;
    } catch (error) {
      console.error('Error resolving SUI NS name:', error);
      return null;
    }
  }

  static async getNameByAddress(address: string): Promise<string | null> {
    try {
      // For demo purposes, we'll implement a mock reverse lookup
      // In production, you'd query the actual SUI NS smart contract
      const mockName = await this.mockSuiNSReverseLookup(address);
      
      console.log(`Looking up SUI NS name for address: ${address} -> ${mockName}`);
      return mockName;
    } catch (error) {
      console.error('Error looking up SUI NS name:', error);
      return null;
    }
  }

  // Mock SUI NS resolution for demo purposes
  static async mockSuiNSResolution(name: string): Promise<string | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock database of SUI NS names
    const mockRegistry: Record<string, string> = {
      'alice': '0x1234567890abcdef1234567890abcdef12345678901234567890abcdef123456',
      'bob': '0x2345678901bcdef12345678901bcdef12345678901234567890abcdef1234567',
      'charlie': '0x3456789012cdef123456789012cdef123456789012345678901bcdef12345678',
      'demo': '0x4567890123def1234567890123def1234567890123456789012cdef123456789',
      'test': '0x567890124def12345678901234def12345678901234567890123def1234567890',
    };
    
    return mockRegistry[name] || null;
  }

  // Mock SUI NS reverse lookup for demo purposes
  static async mockSuiNSReverseLookup(address: string): Promise<string | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock reverse registry
    const mockReverseRegistry: Record<string, string> = {
      '0x1234567890abcdef1234567890abcdef12345678901234567890abcdef123456': 'alice',
      '0x2345678901bcdef12345678901bcdef12345678901234567890abcdef1234567': 'bob',
      '0x3456789012cdef123456789012cdef123456789012345678901bcdef12345678': 'charlie',
      '0x4567890123def1234567890123def1234567890123456789012cdef123456789': 'demo',
      '0x567890124def12345678901234def12345678901234567890123def1234567890': 'test',
    };
    
    const name = mockReverseRegistry[address.toLowerCase()];
    return name ? `@${name}.suins` : null;
  }

  static validateSuiAddress(address: string): boolean {
    if (!address) return false;
    
    // Handle both 32-byte (64 hex chars) and 20-byte (40 hex chars) addresses
    // SUI addresses can be 32 bytes but are often displayed as shorter forms
    const suiAddressRegex = /^0x[a-fA-F0-9]{40,64}$/;
    return suiAddressRegex.test(address);
  }

  static normalizeSuiAddress(address: string): string {
    // Ensure address is properly formatted
    if (!address) return '';
    if (!address.startsWith('0x')) {
      address = '0x' + address;
    }
    return address.toLowerCase();
  }

  static formatSuiAddress(address: string): string {
    if (!address) return '';
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  static async validateAndResolveName(nameOrAddress: string): Promise<{
    isValid: boolean;
    resolvedAddress?: string;
    displayName?: string;
    type: 'address' | 'suins' | 'invalid';
  }> {
    if (!nameOrAddress) {
      return { isValid: false, type: 'invalid' };
    }

    // Check if it's an address
    if (this.validateSuiAddress(nameOrAddress)) {
      const suinsName = await this.getNameByAddress(nameOrAddress);
      return {
        isValid: true,
        resolvedAddress: this.normalizeSuiAddress(nameOrAddress),
        displayName: suinsName || this.formatSuiAddress(nameOrAddress),
        type: 'address'
      };
    }

    // Check if it's a SUI NS name
    const normalizedName = nameOrAddress.replace(/^@/, '').replace(/\.suins$/, '');
    if (normalizedName && /^[a-zA-Z0-9-_]{1,63}$/.test(normalizedName)) {
      const resolvedAddress = await this.resolveName(normalizedName);
      if (resolvedAddress) {
        return {
          isValid: true,
          resolvedAddress,
          displayName: `@${normalizedName}.suins`,
          type: 'suins'
        };
      }
    }

    return { isValid: false, type: 'invalid' };
  }
}
