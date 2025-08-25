// JSON file-based data persistence system
// Stores all data in JSON files within the project

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

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

// File paths for JSON storage
const DATA_DIR = join(process.cwd(), 'data');
export const FILE_PATHS = {
  creators: join(DATA_DIR, 'creators.json'),
  payments: join(DATA_DIR, 'payments.json'),
  links: join(DATA_DIR, 'links.json'),
  analytics: join(DATA_DIR, 'analytics.json')
};

// Utility function to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Ensure data directory exists
function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// JSON file storage class
export class JSONStorage {
  static get<T>(filePath: string): T[] {
    try {
      ensureDataDir();
      if (existsSync(filePath)) {
        const data = readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
      }
      // Create empty file if it doesn't exist
      this.set(filePath, []);
      return [];
    } catch (error) {
      console.error(`Error reading from file ${filePath}:`, error);
      return [];
    }
  }

  static set<T>(filePath: string, value: T[]): void {
    try {
      ensureDataDir();
      writeFileSync(filePath, JSON.stringify(value, null, 2));
    } catch (error) {
      console.error(`Error writing to file ${filePath}:`, error);
    }
  }

  static add<T extends { id: string }>(filePath: string, item: T): T {
    const items = this.get<T>(filePath);
    items.push(item);
    this.set(filePath, items);
    return item;
  }

  static update<T extends { id: string }>(filePath: string, id: string, updates: Partial<T>): T | null {
    const items = this.get<T>(filePath);
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates };
    this.set(filePath, items);
    return items[index];
  }

  static delete<T extends { id: string }>(filePath: string, id: string): boolean {
    const items = this.get<T>(filePath);
    const filteredItems = items.filter(item => item.id !== id);
    
    if (filteredItems.length === items.length) return false;
    
    this.set(filePath, filteredItems);
    return true;
  }

  static find<T extends { id: string }>(filePath: string, predicate: (item: T) => boolean): T | null {
    const items = this.get<T>(filePath);
    return items.find(predicate) || null;
  }

  static filter<T>(filePath: string, predicate: (item: T) => boolean): T[] {
    const items = this.get<T>(filePath);
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
    
    return JSONStorage.add(FILE_PATHS.creators, newCreator);
  }

  static async findCreatorByEmail(email: string): Promise<Creator | null> {
    return JSONStorage.find(FILE_PATHS.creators, (c: Creator) => c.email === email);
  }

  static async findCreatorByUsername(username: string): Promise<Creator | null> {
    return JSONStorage.find(FILE_PATHS.creators, (c: Creator) => c.username === username);
  }

  static async findCreatorByWallet(walletAddress: string): Promise<Creator | null> {
    return JSONStorage.find(FILE_PATHS.creators, (c: Creator) => c.walletAddress === walletAddress);
  }

  static async findCreatorById(id: string): Promise<Creator | null> {
    return JSONStorage.find(FILE_PATHS.creators, (c: Creator) => c.id === id);
  }

  static async updateCreator(id: string, updates: Partial<Creator>): Promise<Creator | null> {
    return JSONStorage.update(FILE_PATHS.creators, id, {
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
    
    return JSONStorage.add(FILE_PATHS.payments, newPayment);
  }

  static async findPaymentByTxHash(txHash: string): Promise<Payment | null> {
    return JSONStorage.find(FILE_PATHS.payments, (p: Payment) => p.txHash === txHash);
  }

  static async getCreatorPayments(creatorId: string, options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ payments: Payment[]; total: number }> {
    let payments = JSONStorage.filter(FILE_PATHS.payments, (p: Payment) => p.creatorId === creatorId);
    
    // Apply date filters
    if (options?.startDate) {
      payments = payments.filter(p => new Date(p.timestamp) >= options.startDate!);
    }
    if (options?.endDate) {
      payments = payments.filter(p => new Date(p.timestamp) <= options.endDate!);
    }
    
    // Sort by timestamp (newest first)
    payments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const total = payments.length;
    
    // Apply pagination
    if (options?.offset) {
      payments = payments.slice(options.offset);
    }
    if (options?.limit) {
      payments = payments.slice(0, options.limit);
    }
    
    return { payments, total };
  }

  // Analytics
  static async getCreatorAnalytics(creatorId: string, period: number = 30): Promise<{
    overview: {
      totalAmount: number;
      averageAmount: number;
      totalPayments: number;
      uniqueDonors: number;
      period: number;
    };
    recentPayments: Payment[];
    chartData: Array<{
      date: string;
      amount: number;
      payments: number;
      donors: number;
    }>;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const { payments } = await this.getCreatorPayments(creatorId, { startDate, endDate });
    
    // Calculate overview stats
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPayments = payments.length;
    const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;
    const uniqueDonors = new Set(payments.map(p => p.fromAddress)).size;

    // Generate chart data
    const chartData: Array<{
      date: string;
      amount: number;
      payments: number;
      donors: number;
    }> = [];

    for (let i = period - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayPayments = payments.filter(p => {
        const paymentDate = new Date(p.timestamp).toISOString().split('T')[0];
        return paymentDate === dateStr;
      });

      chartData.push({
        date: dateStr,
        amount: dayPayments.reduce((sum, p) => sum + p.amount, 0),
        payments: dayPayments.length,
        donors: new Set(dayPayments.map(p => p.fromAddress)).size,
      });
    }

    return {
      overview: {
        totalAmount,
        averageAmount,
        totalPayments,
        uniqueDonors,
        period
      },
      recentPayments: payments.slice(0, 5),
      chartData
    };
  }

  // Shareable Links
  static async createLink(link: Omit<ShareableLink, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShareableLink> {
    const newLink: ShareableLink = {
      ...link,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return JSONStorage.add(FILE_PATHS.links, newLink);
  }

  static async findLinkBySlug(slug: string): Promise<ShareableLink | null> {
    return JSONStorage.find(FILE_PATHS.links, (l: ShareableLink) => l.slug === slug);
  }

  static async getCreatorLinks(creatorId: string): Promise<ShareableLink[]> {
    return JSONStorage.filter(FILE_PATHS.links, (l: ShareableLink) => l.creatorId === creatorId);
  }

  static async updateLink(id: string, updates: Partial<ShareableLink>): Promise<ShareableLink | null> {
    return JSONStorage.update(FILE_PATHS.links, id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  static async deleteLink(id: string): Promise<boolean> {
    return JSONStorage.delete(FILE_PATHS.links, id);
  }
}