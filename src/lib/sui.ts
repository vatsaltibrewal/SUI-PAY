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
  // SUI NS package and registry addresses (updated for production)
  static readonly SUINS_PACKAGE_ID = '0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88c44e0594';
  static readonly SUINS_REGISTRY_ID = '0xe64cd9db9f829c6cc405d8790e64396a4afc0054c157c3e6318a7c88d80ce7b8';

  static async resolveName(name: string): Promise<string | null> {
    try {
      // Remove @ and .suins if present, normalize the name
      const normalizedName = name.replace(/^@/, '').replace(/\.suins$/, '').toLowerCase();
      
      if (!normalizedName) return null;

      console.log(`Attempting to resolve SUI NS name: ${normalizedName}`);

      // Try to resolve using actual SUI NS registry
      try {
        const result = await suiClient.getObject({
          id: this.SUINS_REGISTRY_ID,
          options: {
            showBcs: true,
            showContent: true,
            showDisplay: true,
            showType: true,
          },
        });

        console.log('SUI NS registry object:', result);

        // Query the actual registry for the name
        const nameRecord = await this.queryNameRecord(normalizedName);
        if (nameRecord) {
          console.log(`Resolved SUI NS name: ${normalizedName} -> ${nameRecord}`);
          return nameRecord;
        }
      } catch (registryError) {
        console.warn('Failed to query SUI NS registry:', registryError);
      }

      // Fallback to mock resolution for demo purposes
      const mockResolution = await this.mockSuiNSResolution(normalizedName);
      console.log(`Using mock resolution: ${normalizedName} -> ${mockResolution}`);
      return mockResolution;
    } catch (error) {
      console.error('Error resolving SUI NS name:', error);
      return null;
    }
  }

  static async queryNameRecord(name: string): Promise<string | null> {
    try {
      // In a real implementation, you would:
      // 1. Query the SUI NS registry for the name
      // 2. Parse the response to get the wallet address
      // This is a simplified version - actual implementation would be more complex
      
      // For now, return null to use mock data
      return null;
    } catch (error) {
      console.error('Error querying name record:', error);
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
    
    // Mock database of SUI NS names - using actual wallet addresses from user's data
    const mockRegistry: Record<string, string> = {
      'alice': '0x1234567890abcdef1234567890abcdef12345678901234567890abcdef123456',
      'bob': '0x2345678901bcdef12345678901bcdef12345678901234567890abcdef1234567',
      'charlie': '0x3456789012cdef123456789012cdef123456789012345678901bcdef12345678',
      'demo': '0x4567890123def1234567890123def1234567890123456789012cdef123456789',
      'test': '0x567890124def12345678901234def12345678901234567890123def1234567890',
      'vattyy': '0x0caf044a99070cf2a97abd33e56c6608253371177b8a615296ce293b964fd44e',
      'vatsal': '0x87f5b3f50f1ba',
      'user1': '0xabc123def456789012345678901234567890123456789012345678901234567890',
      'user2': '0xdef456abc789012345678901234567890123456789012345678901234567890',
      'creator': '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456',
    };
    
    return mockRegistry[name] || null;
  }

  // Mock SUI NS reverse lookup for demo purposes
  static async mockSuiNSReverseLookup(address: string): Promise<string | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock reverse registry - matching the forward registry
    const mockReverseRegistry: Record<string, string> = {
      '0x1234567890abcdef1234567890abcdef12345678901234567890abcdef123456': 'alice',
      '0x2345678901bcdef12345678901bcdef12345678901234567890abcdef1234567': 'bob',
      '0x3456789012cdef123456789012cdef123456789012345678901bcdef12345678': 'charlie',
      '0x4567890123def1234567890123def1234567890123456789012cdef123456789': 'demo',
      '0x567890124def12345678901234def12345678901234567890123def1234567890': 'test',
      '0x0caf044a99070cf2a97abd33e56c6608253371177b8a615296ce293b964fd44e': 'vattyy',
      '0x87f5b3f50f1ba': 'vatsal',
      '0xabc123def456789012345678901234567890123456789012345678901234567890': 'user1',
      '0xdef456abc789012345678901234567890123456789012345678901234567890': 'user2',
      '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456': 'creator',
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
