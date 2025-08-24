// Local storage-based data management
// In production, this could be replaced with GitHub-based storage or other cloud solutions

export interface Creator {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  walletAddress: string;
  suiNameService?: string;
  isVerified: boolean;
  twitterHandle?: string;
  websiteUrl?: string;
  minDonationAmount: number;
  customMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  txHash: string;
  amount: number;
  currency: string;
  message?: string;
  donorName?: string;
  donorEmail?: string;
  isAnonymous: boolean;
  fromAddress: string;
  toAddress: string;
  blockHeight?: number;
  timestamp: string;
  creatorId: string;
}

export interface ShareableLink {
  id: string;
  slug: string;
  title: string;
  description?: string;
  isActive: boolean;
  buttonText: string;
  theme: string;
  clickCount: number;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  id: string;
  creatorId: string;
  date: string;
  totalPayments: number;
  totalAmount: number;
  uniqueDonors: number;
  averageAmount: number;
  profileViews: number;
  linkClicks: number;
}

// Storage keys
const STORAGE_KEYS = {
  creators: 'sui-pay-creators',
  payments: 'sui-pay-payments',
  links: 'sui-pay-links',
  analytics: 'sui-pay-analytics',
  sessions: 'sui-pay-sessions'
};

// Utility functions for localStorage (client-side)
export class LocalStorage {
  static get<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static set<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  static add<T extends { id: string }>(key: string, item: T): T {
    const items = this.get<T>(key);
    items.push(item);
    this.set(key, items);
    return item;
  }

  static update<T extends { id: string }>(key: string, id: string, updates: Partial<T>): T | null {
    const items = this.get<T>(key);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates };
    this.set(key, items);
    return items[index];
  }

  static delete<T extends { id: string }>(key: string, id: string): boolean {
    const items = this.get<T>(key);
    const filteredItems = items.filter(item => item.id !== id);
    if (filteredItems.length === items.length) return false;
    
    this.set(key, filteredItems);
    return true;
  }

  static find<T extends { id: string }>(key: string, predicate: (item: T) => boolean): T | null {
    const items = this.get<T>(key);
    return items.find(predicate) || null;
  }

  static filter<T>(key: string, predicate: (item: T) => boolean): T[] {
    const items = this.get<T>(key);
    return items.filter(predicate);
  }
}

// Server-side file storage (for API routes)
export class FileStorage {
  private static getFilePath(key: string): string {
    // In development, store in a data folder
    // In production, this could use GitHub API or other cloud storage
    return `./data/${key}.json`;
  }

  static async get<T>(key: string): Promise<T[]> {
    try {
      // For now, we'll use a simple in-memory storage for server-side
      // In production, implement file system or GitHub storage
      return [];
    } catch {
      return [];
    }
  }

  static async set<T>(key: string, data: T[]): Promise<void> {
    try {
      // Implement file system or cloud storage here
      console.log(`Would save ${key}:`, data);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  static async add<T extends { id: string }>(key: string, item: T): Promise<T> {
    const items = await this.get<T>(key);
    items.push(item);
    await this.set(key, items);
    return item;
  }

  static async update<T extends { id: string }>(key: string, id: string, updates: Partial<T>): Promise<T | null> {
    const items = await this.get<T>(key);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates };
    await this.set(key, items);
    return items[index];
  }

  static async delete<T extends { id: string }>(key: string, id: string): Promise<boolean> {
    const items = await this.get<T>(key);
    const filteredItems = items.filter(item => item.id !== id);
    if (filteredItems.length === items.length) return false;
    
    await this.set(key, filteredItems);
    return true;
  }

  static async find<T extends { id: string }>(key: string, predicate: (item: T) => boolean): Promise<T | null> {
    const items = await this.get<T>(key);
    return items.find(predicate) || null;
  }

  static async filter<T>(key: string, predicate: (item: T) => boolean): Promise<T[]> {
    const items = await this.get<T>(key);
    return items.filter(predicate);
  }
}

// Data access layer
export class DataStore {
  // Creators
  static async createCreator(creator: Omit<Creator, 'id' | 'createdAt' | 'updatedAt'>): Promise<Creator> {
    const newCreator: Creator = {
      ...creator,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return FileStorage.add(STORAGE_KEYS.creators, newCreator);
  }

  static async findCreatorByEmail(email: string): Promise<Creator | null> {
    return FileStorage.find(STORAGE_KEYS.creators, (c: Creator) => c.email === email);
  }

  static async findCreatorByUsername(username: string): Promise<Creator | null> {
    return FileStorage.find(STORAGE_KEYS.creators, (c: Creator) => c.username === username);
  }

  static async findCreatorByWallet(walletAddress: string): Promise<Creator | null> {
    return FileStorage.find(STORAGE_KEYS.creators, (c: Creator) => c.walletAddress === walletAddress);
  }

  static async updateCreator(id: string, updates: Partial<Creator>): Promise<Creator | null> {
    return FileStorage.update(STORAGE_KEYS.creators, id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  // Payments
  static async createPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    const newPayment: Payment = {
      ...payment,
      id: generateId()
    };
    
    return FileStorage.add(STORAGE_KEYS.payments, newPayment);
  }

  static async findPaymentByTxHash(txHash: string): Promise<Payment | null> {
    return FileStorage.find(STORAGE_KEYS.payments, (p: Payment) => p.txHash === txHash);
  }

  static async getCreatorPayments(creatorId: string): Promise<Payment[]> {
    return FileStorage.filter(STORAGE_KEYS.payments, (p: Payment) => p.creatorId === creatorId);
  }

  // Shareable Links
  static async createLink(link: Omit<ShareableLink, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShareableLink> {
    const newLink: ShareableLink = {
      ...link,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return FileStorage.add(STORAGE_KEYS.links, newLink);
  }

  static async findLinkBySlug(slug: string): Promise<ShareableLink | null> {
    return FileStorage.find(STORAGE_KEYS.links, (l: ShareableLink) => l.slug === slug);
  }

  static async getCreatorLinks(creatorId: string): Promise<ShareableLink[]> {
    return FileStorage.filter(STORAGE_KEYS.links, (l: ShareableLink) => l.creatorId === creatorId);
  }

  static async updateLink(id: string, updates: Partial<ShareableLink>): Promise<ShareableLink | null> {
    return FileStorage.update(STORAGE_KEYS.links, id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  static async deleteLink(id: string): Promise<boolean> {
    return FileStorage.delete(STORAGE_KEYS.links, id);
  }
}

// Utility function to generate IDs
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
