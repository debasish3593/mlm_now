import { 
  type User, 
  type InsertUser, 
  type CreateClientRequest, 
  type Plan, 
  type InsertPlan, 
  type UpdatePlan,
  type Report,
  type CreateReportRequest,
  type Earning,
  type Withdrawal,
  type CreateWithdrawalRequest,
  type UpdatePasswordRequest,
  type UpdateProfileRequest,
  users, 
  plans,
  reports,
  earnings,
  withdrawals
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createClient(client: CreateClientRequest, createdById?: string): Promise<User>;
  createClientWithPayment(client: CreateClientRequest, createdById?: string): Promise<User>;
  deleteClient(id: string): Promise<boolean>;
  updateUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean>;
  updateUserProfile(userId: string, profile: UpdateProfileRequest): Promise<User | null>;
  
  // Authentication
  validateUser(username: string, password: string, role: string): Promise<User | null>;
  
  // Hierarchical operations
  getAllClients(): Promise<User[]>;
  getClientsByParent(parentId: string): Promise<User[]>;
  getClientDownline(clientId: string): Promise<User[]>;
  getAvailablePositions(parentId: string): Promise<("left" | "right")[]>;
  
  // Plans management
  getAllPlans(): Promise<Plan[]>;
  getPlanById(id: string): Promise<Plan | null>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: string, plan: UpdatePlan): Promise<Plan | null>;
  deletePlan(id: string): Promise<boolean>;
  
  // Reports management
  createReport(clientId: string, report: CreateReportRequest): Promise<Report>;
  getReportsByClient(clientId: string): Promise<Report[]>;
  getAllReports(): Promise<Report[]>;
  updateReportStatus(reportId: string, status: string, adminResponse?: string): Promise<Report | null>;
  
  // Earnings management
  getEarningsByClient(clientId: string): Promise<Earning[]>;
  createEarning(clientId: string, type: string, amount: string, description: string, fromClientId?: string): Promise<Earning>;
  getTotalEarnings(clientId: string): Promise<string>;
  
  // Withdrawals management
  createWithdrawal(clientId: string, withdrawal: CreateWithdrawalRequest): Promise<Withdrawal>;
  getWithdrawalsByClient(clientId: string): Promise<Withdrawal[]>;
  getAllWithdrawals(): Promise<Withdrawal[]>;
  updateWithdrawalStatus(withdrawalId: string, status: string, adminNotes?: string): Promise<Withdrawal | null>;
  
  // Statistics
  getClientStats(): Promise<{
    total: number;
    silver: number;
    gold: number;
    diamond: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private plans: Map<string, Plan>;
  private reports: Map<string, Report>;
  private earnings: Map<string, Earning>;
  private withdrawals: Map<string, Withdrawal>;

  constructor() {
    this.users = new Map();
    this.plans = new Map();
    this.reports = new Map();
    this.earnings = new Map();
    this.withdrawals = new Map();
    this.initializeAdminUser();
    this.initializePlans();
  }

  private async initializeAdminUser() {
    const adminExists = Array.from(this.users.values()).some(user => user.role === "admin");
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const admin: User = {
        id: randomUUID(),
        name: "System Admin",
        username: "admin",
        password: hashedPassword,
        email: "admin@nappinghand.com",
        mobile: null,
        role: "admin",
        package: null,
        parentId: null,
        position: null,
        createdAt: new Date(),
      };
      this.users.set(admin.id, admin);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const id = randomUUID();
    const user: User = { 
      id,
      name: null,
      email: null,
      mobile: null,
      username: insertUser.username,
      password: hashedPassword,
      role: insertUser.role || "client",
      package: insertUser.package || null,
      parentId: insertUser.parentId || null,
      position: insertUser.position || null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async createClient(client: CreateClientRequest, createdById?: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(client.password, 10);
    const id = randomUUID();
    
    // Ensure parentId is set (fallback to createdById if not provided)
    const parentId = client.parentId || createdById;
    
    // If parentId is provided, find available position
    let position: string | null = null;
    if (parentId) {
      const availablePositions = await this.getAvailablePositions(parentId);
      if (availablePositions.length === 0) {
        throw new Error("Parent already has 2 children");
      }
      position = client.position || availablePositions[0];
    }

    const user: User = {
      id,
      name: client.name || null,
      username: client.username,
      password: hashedPassword,
      email: client.email || null,
      mobile: client.mobile || null,
      role: "client",
      package: client.package,
      parentId: parentId || null,
      position: position,
      createdAt: new Date(),
    };
    
    this.users.set(id, user);
    return user;
  }

  // Enhanced client creation with payment confirmation and binary tree logic
  async createClientWithPayment(client: CreateClientRequest, adminId?: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(client.password, 10);
    const id = randomUUID();
    
    // Binary tree insertion logic
    let parentId = client.parentId || adminId;
    let position: string | null = null;
    
    if (parentId) {
      // Find available position under the specified parent
      const availablePositions = await this.getAvailablePositions(parentId);
      
      if (availablePositions.length === 0) {
        // Parent has no available positions, find the first available spot in the tree
        const allClients = await this.getAllClients();
        
        for (const potentialParent of allClients) {
          const availablePos = await this.getAvailablePositions(potentialParent.id);
          if (availablePos.length > 0) {
            parentId = potentialParent.id;
            position = availablePos[0]; // Take the first available position
            break;
          }
        }
        
        // If still no position found, make them a direct client under admin
        if (!position && adminId) {
          parentId = adminId;
          const adminPositions = await this.getAvailablePositions(adminId);
          position = adminPositions.length > 0 ? adminPositions[0] : null;
        }
      } else {
        // Assign to the first available position
        position = availablePositions[0];
      }
    }

    const user: User = {
      id,
      name: client.name || null,
      username: client.username,
      password: hashedPassword,
      email: client.email || null,
      mobile: client.mobile || null,
      role: "client",
      package: client.package,
      parentId: parentId || null,
      position: position || null,
      createdAt: new Date(),
    };
    
    this.users.set(id, user);
    return user;
  }

  async validateUser(username: string, password: string, role: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user || user.role !== role) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getAllClients(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === "client");
  }

  async getClientsByParent(parentId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.parentId === parentId);
  }

  async getClientDownline(clientId: string): Promise<User[]> {
    const downline: User[] = [];
    const directChildren = await this.getClientsByParent(clientId);
    
    for (const child of directChildren) {
      downline.push(child);
      const childDownline = await this.getClientDownline(child.id);
      downline.push(...childDownline);
    }
    
    return downline;
  }

  async getAvailablePositions(parentId: string): Promise<("left" | "right")[]> {
    const children = await this.getClientsByParent(parentId);
    const occupiedPositions = children.map(child => child.position).filter(Boolean);
    
    const allPositions: ("left" | "right")[] = ["left", "right"];
    return allPositions.filter(pos => !occupiedPositions.includes(pos));
  }

  async getClientStats(): Promise<{ total: number; silver: number; gold: number; diamond: number; }> {
    const clients = await this.getAllClients();
    return {
      total: clients.length,
      silver: clients.filter(c => c.package === "Silver").length,
      gold: clients.filter(c => c.package === "Gold").length,
      diamond: clients.filter(c => c.package === "Diamond").length,
    };
  }

  private async initializePlans() {
    const defaultPlans: Plan[] = [
      {
        id: randomUUID(),
        name: "Silver",
        price: "₹510.00 INR",
        businessVolume: "100",
        referralCommission: "₹100.00 INR",
        treeCommission: "₹200.00 INR",
        status: "active",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Gold",
        price: "₹1010.00 INR",
        businessVolume: "200",
        referralCommission: "₹200.00 INR",
        treeCommission: "₹400.00 INR",
        status: "active",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Diamond",
        price: "₹1510.00 INR",
        businessVolume: "300",
        referralCommission: "₹300.00 INR",
        treeCommission: "₹600.00 INR",
        status: "active",
        createdAt: new Date(),
      }
    ];

    for (const plan of defaultPlans) {
      this.plans.set(plan.id, plan);
    }
  }

  async getAllPlans(): Promise<Plan[]> {
    return Array.from(this.plans.values());
  }

  async getPlanById(id: string): Promise<Plan | null> {
    return this.plans.get(id) || null;
  }

  async createPlan(planData: InsertPlan): Promise<Plan> {
    const id = randomUUID();
    const plan: Plan = {
      id,
      name: planData.name,
      price: planData.price,
      businessVolume: planData.businessVolume,
      referralCommission: planData.referralCommission,
      treeCommission: planData.treeCommission,
      status: planData.status || "active",
      createdAt: new Date(),
    };
    this.plans.set(id, plan);
    return plan;
  }

  async updatePlan(id: string, planData: UpdatePlan): Promise<Plan | null> {
    const existingPlan = this.plans.get(id);
    if (!existingPlan) return null;

    const updatedPlan: Plan = {
      ...existingPlan,
      ...planData,
    };
    this.plans.set(id, updatedPlan);
    return updatedPlan;
  }

  async deletePlan(id: string): Promise<boolean> {
    return this.plans.delete(id);
  }

  async deleteClient(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user || user.role !== 'client') {
      return false;
    }

    // Get all children of this user and reassign them
    const children = Array.from(this.users.values()).filter(u => u.parentId === id);
    
    // For each child, remove the parent connection (they become orphaned)
    for (const child of children) {
      child.parentId = null;
      child.position = null;
    }

    // Delete the user
    return this.users.delete(id);
  }

  async updateUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) return false;
    
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    return true;
  }

  async updateUserProfile(userId: string, profile: UpdateProfileRequest): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;
    
    if (profile.name !== undefined) user.name = profile.name;
    if (profile.email !== undefined) user.email = profile.email;
    if (profile.mobile !== undefined) user.mobile = profile.mobile;
    
    return user;
  }

  // Reports management
  async createReport(clientId: string, report: CreateReportRequest): Promise<Report> {
    const id = randomUUID();
    const newReport: Report = {
      id,
      clientId,
      title: report.title,
      description: report.description,
      category: report.category,
      status: "pending",
      priority: report.priority || "medium",
      adminResponse: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.reports.set(id, newReport);
    return newReport;
  }

  async getReportsByClient(clientId: string): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(r => r.clientId === clientId);
  }

  async getAllReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateReportStatus(reportId: string, status: string, adminResponse?: string): Promise<Report | null> {
    const report = this.reports.get(reportId);
    if (!report) return null;
    
    report.status = status;
    if (adminResponse) report.adminResponse = adminResponse;
    report.updatedAt = new Date();
    return report;
  }

  // Earnings management
  async getEarningsByClient(clientId: string): Promise<Earning[]> {
    return Array.from(this.earnings.values()).filter(e => e.clientId === clientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createEarning(clientId: string, type: string, amount: string, description: string, fromClientId?: string): Promise<Earning> {
    const id = randomUUID();
    const earning: Earning = {
      id,
      clientId,
      type,
      amount,
      description,
      fromClientId: fromClientId || null,
      createdAt: new Date(),
    };
    this.earnings.set(id, earning);
    return earning;
  }

  async getTotalEarnings(clientId: string): Promise<string> {
    const clientEarnings = await this.getEarningsByClient(clientId);
    const total = clientEarnings.reduce((sum, earning) => {
      // Parse amount (assuming format "₹100.00 INR")
      const numericAmount = parseFloat(earning.amount.replace(/[₹,INR\s]/g, ''));
      return sum + (isNaN(numericAmount) ? 0 : numericAmount);
    }, 0);
    return `₹${total.toFixed(2)} INR`;
  }

  // Withdrawals management
  async createWithdrawal(clientId: string, withdrawal: CreateWithdrawalRequest): Promise<Withdrawal> {
    const id = randomUUID();
    const newWithdrawal: Withdrawal = {
      id,
      clientId,
      amount: `₹${withdrawal.amount} INR`,
      bankDetails: withdrawal.bankDetails,
      status: "pending",
      adminNotes: null,
      requestedAt: new Date(),
      processedAt: null,
    };
    this.withdrawals.set(id, newWithdrawal);
    return newWithdrawal;
  }

  async getWithdrawalsByClient(clientId: string): Promise<Withdrawal[]> {
    return Array.from(this.withdrawals.values()).filter(w => w.clientId === clientId)
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  async getAllWithdrawals(): Promise<Withdrawal[]> {
    return Array.from(this.withdrawals.values()).sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  async updateWithdrawalStatus(withdrawalId: string, status: string, adminNotes?: string): Promise<Withdrawal | null> {
    const withdrawal = this.withdrawals.get(withdrawalId);
    if (!withdrawal) return null;
    
    withdrawal.status = status;
    if (adminNotes) withdrawal.adminNotes = adminNotes;
    if (status !== "pending") withdrawal.processedAt = new Date();
    
    return withdrawal;
  }
}

// PostgreSQL Storage Implementation
export class PostgreSQLStorage implements IStorage {
  private db;
  
  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for PostgreSQL storage");
    }
    const client = postgres(process.env.DATABASE_URL, { ssl: false });
    this.db = drizzle(client);
    this.initializeData();
  }
  
  private async initializeData() {
    // Initialize admin user if not exists
    await this.initializeAdminUser();
    // Initialize default plans
    await this.initializePlans();
  }
  
  private async initializeAdminUser() {
    try {
      const existingAdmin = await this.db.select().from(users).where(eq(users.role, "admin")).limit(1);
      
      if (existingAdmin.length === 0) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await this.db.insert(users).values({
          name: "System Admin",
          username: "admin",
          password: hashedPassword,
          email: "admin@nappinghand.com",
          role: "admin",
        });
      }
    } catch (error) {
      console.error("Failed to initialize admin user:", error);
    }
  }
  
  private async initializePlans() {
    try {
      const existingPlans = await this.db.select().from(plans).limit(1);
      
      if (existingPlans.length === 0) {
        await this.db.insert(plans).values([
          {
            name: "Silver",
            price: "₹510.00 INR",
            businessVolume: "100",
            referralCommission: "₹100.00 INR",
            treeCommission: "₹200.00 INR",
            status: "active",
          },
          {
            name: "Gold",
            price: "₹1010.00 INR",
            businessVolume: "200",
            referralCommission: "₹200.00 INR",
            treeCommission: "₹400.00 INR",
            status: "active",
          },
          {
            name: "Diamond",
            price: "₹1510.00 INR",
            businessVolume: "300",
            referralCommission: "₹300.00 INR",
            treeCommission: "₹600.00 INR",
            status: "active",
          }
        ]);
      }
    } catch (error) {
      console.error("Failed to initialize plans:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const result = await this.db.insert(users).values({
      username: insertUser.username,
      password: hashedPassword,
      role: insertUser.role || "client",
      package: insertUser.package || null,
      parentId: insertUser.parentId || null,
      position: insertUser.position || null,
    }).returning();
    return result[0];
  }

  async createClient(client: CreateClientRequest, createdById?: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(client.password, 10);
    
    // Ensure parentId is set (fallback to createdById if not provided)
    const parentId = client.parentId || createdById;
    
    // If parentId is provided, find available position
    let position: string | null = null;
    if (parentId) {
      const availablePositions = await this.getAvailablePositions(parentId);
      if (availablePositions.length === 0) {
        throw new Error("Parent already has 2 children");
      }
      position = client.position || availablePositions[0];
    }

    const result = await this.db.insert(users).values({
      name: client.name,
      username: client.username,
      password: hashedPassword,
      email: client.email,
      mobile: client.mobile,
      role: "client",
      package: client.package,
      parentId: parentId || null,
      position: position,
    }).returning();
    
    return result[0];
  }

  async createClientWithPayment(client: CreateClientRequest, adminId?: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(client.password, 10);
    
    // Binary tree insertion logic
    let parentId = client.parentId || adminId;
    let position: string | null = null;
    
    if (parentId) {
      // Find available position under the specified parent
      const availablePositions = await this.getAvailablePositions(parentId);
      
      if (availablePositions.length === 0) {
        // Parent has no available positions, find the first available spot in the tree
        const allClients = await this.getAllClients();
        
        for (const potentialParent of allClients) {
          const availablePos = await this.getAvailablePositions(potentialParent.id);
          if (availablePos.length > 0) {
            parentId = potentialParent.id;
            position = availablePos[0]; // Take the first available position
            break;
          }
        }
        
        // If still no position found, make them a direct client under admin
        if (!position && adminId) {
          parentId = adminId;
          const adminPositions = await this.getAvailablePositions(adminId);
          position = adminPositions.length > 0 ? adminPositions[0] : null;
        }
      } else {
        // Assign to the first available position
        position = availablePositions[0];
      }
    }

    const result = await this.db.insert(users).values({
      name: client.name,
      username: client.username,
      password: hashedPassword,
      email: client.email,
      mobile: client.mobile,
      role: "client",
      package: client.package,
      parentId: parentId || null,
      position: position || null,
    }).returning();
    
    return result[0];
  }

  async validateUser(username: string, password: string, role: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user || user.role !== role) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getAllClients(): Promise<User[]> {
    return await this.db.select().from(users).where(eq(users.role, "client"));
  }

  async getClientsByParent(parentId: string): Promise<User[]> {
    return await this.db.select().from(users).where(eq(users.parentId, parentId));
  }

  async getClientDownline(clientId: string): Promise<User[]> {
    const downline: User[] = [];
    const directChildren = await this.getClientsByParent(clientId);
    
    for (const child of directChildren) {
      downline.push(child);
      const childDownline = await this.getClientDownline(child.id);
      downline.push(...childDownline);
    }
    
    return downline;
  }

  async getAvailablePositions(parentId: string): Promise<("left" | "right")[]> {
    const children = await this.getClientsByParent(parentId);
    const occupiedPositions = children.map(child => child.position).filter(Boolean);
    
    const allPositions: ("left" | "right")[] = ["left", "right"];
    return allPositions.filter(pos => !occupiedPositions.includes(pos));
  }

  async getClientStats(): Promise<{ total: number; silver: number; gold: number; diamond: number; }> {
    const allClients = await this.getAllClients();
    return {
      total: allClients.length,
      silver: allClients.filter(c => c.package === "Silver").length,
      gold: allClients.filter(c => c.package === "Gold").length,
      diamond: allClients.filter(c => c.package === "Diamond").length,
    };
  }

  async getAllPlans(): Promise<Plan[]> {
    return await this.db.select().from(plans);
  }

  async getPlanById(id: string): Promise<Plan | null> {
    const result = await this.db.select().from(plans).where(eq(plans.id, id)).limit(1);
    return result[0] || null;
  }

  async createPlan(planData: InsertPlan): Promise<Plan> {
    const result = await this.db.insert(plans).values(planData).returning();
    return result[0];
  }

  async updatePlan(id: string, planData: UpdatePlan): Promise<Plan | null> {
    const result = await this.db.update(plans).set(planData).where(eq(plans.id, id)).returning();
    return result[0] || null;
  }

  async deletePlan(id: string): Promise<boolean> {
    const result = await this.db.delete(plans).where(eq(plans.id, id)).returning();
    return result.length > 0;
  }

  async deleteClient(id: string): Promise<boolean> {
    const user = await this.getUserById(id);
    if (!user || user.role !== 'client') {
      return false;
    }

    // Get all children of this user and reassign them
    const children = await this.getClientsByParent(id);
    
    // For each child, remove the parent connection (they become orphaned)
    for (const child of children) {
      await this.db.update(users).set({
        parentId: null,
        position: null,
      }).where(eq(users.id, child.id));
    }

    // Delete the user
    const result = await this.db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async updateUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;
    
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) return false;
    
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const result = await this.db.update(users).set({
      password: hashedNewPassword
    }).where(eq(users.id, userId)).returning();
    
    return result.length > 0;
  }

  async updateUserProfile(userId: string, profile: UpdateProfileRequest): Promise<User | null> {
    const updateData: any = {};
    if (profile.name !== undefined) updateData.name = profile.name;
    if (profile.email !== undefined) updateData.email = profile.email;
    if (profile.mobile !== undefined) updateData.mobile = profile.mobile;
    
    if (Object.keys(updateData).length === 0) {
      return await this.getUserById(userId);
    }
    
    const result = await this.db.update(users).set(updateData).where(eq(users.id, userId)).returning();
    return result[0] || null;
  }

  // Reports management
  async createReport(clientId: string, report: CreateReportRequest): Promise<Report> {
    const result = await this.db.insert(reports).values({
      clientId,
      title: report.title,
      description: report.description,
      category: report.category,
      priority: report.priority || "medium",
    }).returning();
    return result[0];
  }

  async getReportsByClient(clientId: string): Promise<Report[]> {
    return await this.db.select().from(reports).where(eq(reports.clientId, clientId)).orderBy(desc(reports.createdAt));
  }

  async getAllReports(): Promise<Report[]> {
    return await this.db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async updateReportStatus(reportId: string, status: string, adminResponse?: string): Promise<Report | null> {
    const updateData: any = { status, updatedAt: new Date() };
    if (adminResponse) updateData.adminResponse = adminResponse;
    
    const result = await this.db.update(reports).set(updateData).where(eq(reports.id, reportId)).returning();
    return result[0] || null;
  }

  // Earnings management
  async getEarningsByClient(clientId: string): Promise<Earning[]> {
    return await this.db.select().from(earnings).where(eq(earnings.clientId, clientId)).orderBy(desc(earnings.createdAt));
  }

  async createEarning(clientId: string, type: string, amount: string, description: string, fromClientId?: string): Promise<Earning> {
    const result = await this.db.insert(earnings).values({
      clientId,
      type,
      amount,
      description,
      fromClientId: fromClientId || null,
    }).returning();
    return result[0];
  }

  async getTotalEarnings(clientId: string): Promise<string> {
    const clientEarnings = await this.getEarningsByClient(clientId);
    const total = clientEarnings.reduce((sum, earning) => {
      // Parse amount (assuming format "₹100.00 INR")
      const numericAmount = parseFloat(earning.amount.replace(/[₹,INR\s]/g, ''));
      return sum + (isNaN(numericAmount) ? 0 : numericAmount);
    }, 0);
    return `₹${total.toFixed(2)} INR`;
  }

  // Withdrawals management
  async createWithdrawal(clientId: string, withdrawal: CreateWithdrawalRequest): Promise<Withdrawal> {
    const result = await this.db.insert(withdrawals).values({
      clientId,
      amount: `₹${withdrawal.amount} INR`,
      bankDetails: withdrawal.bankDetails,
    }).returning();
    return result[0];
  }

  async getWithdrawalsByClient(clientId: string): Promise<Withdrawal[]> {
    return await this.db.select().from(withdrawals).where(eq(withdrawals.clientId, clientId)).orderBy(desc(withdrawals.requestedAt));
  }

  async getAllWithdrawals(): Promise<Withdrawal[]> {
    return await this.db.select().from(withdrawals).orderBy(desc(withdrawals.requestedAt));
  }

  async updateWithdrawalStatus(withdrawalId: string, status: string, adminNotes?: string): Promise<Withdrawal | null> {
    const updateData: any = { status };
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (status !== "pending") updateData.processedAt = new Date();
    
    const result = await this.db.update(withdrawals).set(updateData).where(eq(withdrawals.id, withdrawalId)).returning();
    return result[0] || null;
  }
}

// Use PostgreSQL storage in production, MemStorage for development/testing
export const storage = process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL 
  ? new MemStorage() 
  : new PostgreSQLStorage();
