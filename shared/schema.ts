import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"), // Full name for clients
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"), // Email for clients
  mobile: text("mobile"), // Mobile number for clients
  role: text("role").notNull().default("client"), // "admin" | "client"
  package: text("package"), // "Silver" | "Gold" | "Diamond" (nullable for admins)
  parentId: varchar("parent_id"), // For binary tree structure
  position: text("position"), // "left" | "right" (position under parent)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  package: true,
  parentId: true,
  position: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["admin", "client"]),
});

// Enhanced schema for client creation with validation
export const createClientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be less than 20 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(6, "Password must be at least 6 characters").max(50, "Password must be less than 50 characters"),
  mobile: z.string().regex(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"),
  email: z.string().email("Please enter a valid email address"),
  package: z.enum(["Silver", "Gold", "Diamond"], { required_error: "Please select a plan" }),
  parentId: z.string().optional().nullable(),
  position: z.enum(["left", "right"]).optional().nullable()
});

export const paymentConfirmationSchema = z.object({
  clientData: createClientSchema,
  paymentConfirmed: z.boolean()
});

// Plans table schema
export const plans = pgTable("plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  price: text("price").notNull(), // Stored as text to handle currency formatting
  businessVolume: text("business_volume").notNull(),
  referralCommission: text("referral_commission").notNull(),
  treeCommission: text("tree_commission").notNull(),
  status: text("status").notNull().default("active"), // "active" | "disabled"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true,
});

export const updatePlanSchema = insertPlanSchema.partial();

// Reports table schema
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "technical" | "payment" | "account" | "other"
  status: text("status").notNull().default("pending"), // "pending" | "in-progress" | "resolved" | "closed"
  priority: text("priority").notNull().default("medium"), // "low" | "medium" | "high" | "urgent"
  adminResponse: text("admin_response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Earnings table schema
export const earnings = pgTable("earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id),
  type: text("type").notNull(), // "referral" | "tree" | "bonus"
  amount: text("amount").notNull(), // Stored as text to handle currency formatting
  description: text("description").notNull(),
  fromClientId: varchar("from_client_id").references(() => users.id), // The client who generated this earning
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Withdrawals table schema
export const withdrawals = pgTable("withdrawals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id),
  amount: text("amount").notNull(),
  bankDetails: text("bank_details").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected" | "completed"
  adminNotes: text("admin_notes"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

// Validation schemas for client features
export const createReportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be less than 1000 characters"),
  category: z.enum(["technical", "payment", "account", "other"], { required_error: "Please select a category" }),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

export const createWithdrawalSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid number"),
  bankDetails: z.string().min(10, "Bank details must be at least 10 characters").max(500, "Bank details must be less than 500 characters"),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").max(50, "Password must be less than 50 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters").optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  mobile: z.string().regex(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits").optional(),
});

// Plan pricing information (keeping for backward compatibility)
export const planPricing = {
  Silver: 510,
  Gold: 1010,
  Diamond: 1510
} as const;

export type CreateClientRequest = z.infer<typeof createClientSchema>;
export type PaymentConfirmationRequest = z.infer<typeof paymentConfirmationSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserWithoutPassword = Omit<User, 'password'>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type UpdatePlan = z.infer<typeof updatePlanSchema>;

// New types for client dashboard features
export type Report = typeof reports.$inferSelect;
export type CreateReportRequest = z.infer<typeof createReportSchema>;
export type Earning = typeof earnings.$inferSelect;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type CreateWithdrawalRequest = z.infer<typeof createWithdrawalSchema>;
export type UpdatePasswordRequest = z.infer<typeof updatePasswordSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
