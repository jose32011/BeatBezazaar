import { 
  type User, 
  type InsertUser,
  type Beat,
  type InsertBeat,
  type Purchase,
  type InsertPurchase,
  type Analytics,
  type InsertAnalytics
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Beat operations
  getBeat(id: string): Promise<Beat | undefined>;
  getAllBeats(): Promise<Beat[]>;
  getLatestBeats(limit: number): Promise<Beat[]>;
  createBeat(beat: InsertBeat): Promise<Beat>;
  updateBeat(id: string, beat: Partial<InsertBeat>): Promise<Beat | undefined>;
  deleteBeat(id: string): Promise<boolean>;
  
  // Purchase operations
  getPurchase(id: string): Promise<Purchase | undefined>;
  getPurchasesByUser(userId: string): Promise<Purchase[]>;
  getAllPurchases(): Promise<Purchase[]>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  
  // Analytics operations
  getAnalytics(): Promise<Analytics | undefined>;
  updateAnalytics(analytics: Partial<InsertAnalytics>): Promise<Analytics>;
  incrementSiteVisits(): Promise<void>;
  incrementDownloads(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private beats: Map<string, Beat>;
  private purchases: Map<string, Purchase>;
  private analytics: Analytics;

  constructor() {
    this.users = new Map();
    this.beats = new Map();
    this.purchases = new Map();
    
    // Initialize analytics
    this.analytics = {
      id: randomUUID(),
      siteVisits: 0,
      totalDownloads: 0,
      updatedAt: new Date(),
    };
    
    // Create default admin user
    const adminId = randomUUID();
    this.users.set(adminId, {
      id: adminId,
      username: "admin",
      password: "admin123", // In real app, this would be hashed
      role: "admin",
      email: "admin@beatmarket.com",
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "client",
      email: insertUser.email || null,
    };
    this.users.set(id, user);
    return user;
  }

  // Beat operations
  async getBeat(id: string): Promise<Beat | undefined> {
    return this.beats.get(id);
  }

  async getAllBeats(): Promise<Beat[]> {
    return Array.from(this.beats.values()).sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }

  async getLatestBeats(limit: number): Promise<Beat[]> {
    const allBeats = await this.getAllBeats();
    return allBeats.slice(0, limit);
  }

  async createBeat(insertBeat: InsertBeat): Promise<Beat> {
    const id = randomUUID();
    const beat: Beat = { 
      ...insertBeat, 
      id,
      audioUrl: insertBeat.audioUrl || null,
      createdAt: new Date(),
    };
    this.beats.set(id, beat);
    return beat;
  }

  async updateBeat(id: string, beatUpdate: Partial<InsertBeat>): Promise<Beat | undefined> {
    const beat = this.beats.get(id);
    if (!beat) return undefined;
    
    const updatedBeat = { ...beat, ...beatUpdate };
    this.beats.set(id, updatedBeat);
    return updatedBeat;
  }

  async deleteBeat(id: string): Promise<boolean> {
    return this.beats.delete(id);
  }

  // Purchase operations
  async getPurchase(id: string): Promise<Purchase | undefined> {
    return this.purchases.get(id);
  }

  async getPurchasesByUser(userId: string): Promise<Purchase[]> {
    return Array.from(this.purchases.values()).filter(
      (purchase) => purchase.userId === userId,
    );
  }

  async getAllPurchases(): Promise<Purchase[]> {
    return Array.from(this.purchases.values()).sort((a, b) => {
      return new Date(b.purchasedAt || 0).getTime() - new Date(a.purchasedAt || 0).getTime();
    });
  }

  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const id = randomUUID();
    const purchase: Purchase = { 
      ...insertPurchase, 
      id,
      purchasedAt: new Date(),
    };
    this.purchases.set(id, purchase);
    return purchase;
  }

  // Analytics operations
  async getAnalytics(): Promise<Analytics | undefined> {
    return this.analytics;
  }

  async updateAnalytics(analyticsUpdate: Partial<InsertAnalytics>): Promise<Analytics> {
    this.analytics = { 
      ...this.analytics, 
      ...analyticsUpdate,
      updatedAt: new Date(),
    };
    return this.analytics;
  }

  async incrementSiteVisits(): Promise<void> {
    this.analytics.siteVisits += 1;
    this.analytics.updatedAt = new Date();
  }

  async incrementDownloads(): Promise<void> {
    this.analytics.totalDownloads += 1;
    this.analytics.updatedAt = new Date();
  }
}

export const storage = new MemStorage();
