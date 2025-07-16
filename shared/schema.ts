import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  decimal,
  serial,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - updated for username/password auth
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  pCoinBalance: decimal("p_coin_balance", { precision: 10, scale: 2 }).default("0.00"),
  hasReceivedWelcomeBonus: integer("has_received_welcome_bonus").default(0), // 0 = false, 1 = true
  role: varchar("role").default("user"), // 'user', 'admin', 'owner'
  isVip: boolean("is_vip").default(false), // VIP status for premium features
  vipExpiresAt: timestamp("vip_expires_at"), // When VIP expires
  isBanned: boolean("is_banned").default(false),
  bannedAt: timestamp("banned_at"),
  bannedReason: text("banned_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// P COIN transactions table for tracking balance changes
export const pCoinTransactions = pgTable("p_coin_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type").notNull(), // 'welcome_bonus', 'game_win', 'game_loss', 'purchase', 'trade_send', 'trade_receive', etc.
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trading system table
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  senderUserId: integer("sender_user_id").notNull().references(() => users.id),
  receiverUserId: integer("receiver_user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"), // 'pending', 'completed', 'cancelled'
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Redeem codes table for owner-generated codes
export const redeemCodes = pgTable("redeem_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 6 }).notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  usageLimit: integer("usage_limit").notNull().default(1),
  usedCount: integer("used_count").notNull().default(0),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Track individual redemptions
export const codeRedemptions = pgTable("code_redemptions", {
  id: serial("id").primaryKey(),
  codeId: integer("code_id").notNull().references(() => redeemCodes.id),
  userId: integer("user_id").notNull().references(() => users.id),
  redeemedAt: timestamp("redeemed_at").defaultNow(),
});

// P COIN price history for stock chart
export const coinPriceHistory = pgTable("coin_price_history", {
  id: serial("id").primaryKey(),
  price: decimal("price", { precision: 10, scale: 4 }).notNull(), // Price in USD
  timestamp: timestamp("timestamp").defaultNow(),
  volume: decimal("volume", { precision: 15, scale: 2 }).default("0"), // Trading volume
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }).default("0"), // % change
});

// Game sessions for tracking game history
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameType: varchar("game_type", { length: 50 }).notNull(), // poker, blackjack, roulette, etc.
  betAmount: decimal("bet_amount", { precision: 10, scale: 2 }).notNull(),
  winAmount: decimal("win_amount", { precision: 10, scale: 2 }).default("0"),
  gameData: jsonb("game_data"), // Store game-specific data (cards, numbers, etc.)
  result: varchar("result", { length: 20 }).notNull(), // win, lose, draw
  createdAt: timestamp("created_at").defaultNow(),
});

// Leaderboard for game achievements
export const gameLeaderboard = pgTable("game_leaderboard", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameType: varchar("game_type", { length: 50 }).notNull(),
  totalWins: integer("total_wins").default(0),
  totalLosses: integer("total_losses").default(0),
  totalWinAmount: decimal("total_win_amount", { precision: 15, scale: 2 }).default("0"),
  biggestWin: decimal("biggest_win", { precision: 10, scale: 2 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shop items table
export const shopItems = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type").notNull(), // 'banner', 'avatar', 'theme', etc.
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User purchases table
export const userPurchases = pgTable("user_purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull().references(() => shopItems.id),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// User inventory table for banner stacking
export const userInventory = pgTable("user_inventory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull().references(() => shopItems.id),
  quantity: integer("quantity").default(1),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Banner trading system
export const bannerTrades = pgTable("banner_trades", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  fromItemId: integer("from_item_id").notNull().references(() => shopItems.id),
  toItemId: integer("to_item_id").notNull().references(() => shopItems.id),
  fromQuantity: integer("from_quantity").default(1),
  toQuantity: integer("to_quantity").default(1),
  status: varchar("status").default("pending"), // pending, accepted, rejected, cancelled
  fromUserAccepted: boolean("from_user_accepted").default(false),
  toUserAccepted: boolean("to_user_accepted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Leaderboard table
export const leaderboard = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  totalWinnings: decimal("total_winnings", { precision: 15, scale: 2 }).default("0"),
  totalGamesPlayed: integer("total_games_played").default(0),
  biggestWin: decimal("biggest_win", { precision: 10, scale: 2 }).default("0"),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Game bans table for admin functionality
export const gameBans = pgTable("game_bans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameType: varchar("game_type").notNull(),
  reason: text("reason"),
  bannedBy: integer("banned_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// User profile banners (purchased banners)
export const userBanners = pgTable("user_banners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bannerUrl: varchar("banner_url").notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  isVipChat: boolean("is_vip_chat").default(false), // true for VIP chat, false for regular
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat system for real-time messaging
export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type").notNull(), // 'regular', 'vip'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trade chat messages
export const tradeChatMessages = pgTable("trade_chat_messages", {
  id: serial("id").primaryKey(),
  tradeId: integer("trade_id").notNull().references(() => bannerTrades.id),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bank system - NAPASSIST Bank
export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0"),
  interestRate: decimal("interest_rate", { precision: 5, scale: 4 }).default("0.0500"), // 5% annual interest
  lastInterestCalculation: timestamp("last_interest_calculation").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bankTransactions = pgTable("bank_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // deposit, withdrawal, interest
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTransactionSchema = createInsertSchema(pCoinTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertRedeemCodeSchema = createInsertSchema(redeemCodes).omit({
  id: true,
  createdAt: true,
  usedCount: true,
});

export const insertCodeRedemptionSchema = createInsertSchema(codeRedemptions).omit({
  id: true,
  redeemedAt: true,
});

export const insertCoinPriceSchema = createInsertSchema(coinPriceHistory).omit({
  id: true,
  timestamp: true,
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
  createdAt: true,
});

export const insertGameLeaderboardSchema = createInsertSchema(gameLeaderboard).omit({
  id: true,
  updatedAt: true,
});

export const insertShopItemSchema = createInsertSchema(shopItems).omit({
  id: true,
  createdAt: true,
});

export const insertUserPurchaseSchema = createInsertSchema(userPurchases).omit({
  id: true,
  createdAt: true,
});

export const insertGameBanSchema = createInsertSchema(gameBans).omit({
  id: true,
  createdAt: true,
});

export const insertUserBannerSchema = createInsertSchema(userBanners).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertChatRoomSchema = createInsertSchema(chatRooms).omit({
  id: true,
  createdAt: true,
});

export const insertUserInventorySchema = createInsertSchema(userInventory).omit({
  id: true,
  createdAt: true,
});

export const insertBannerTradeSchema = createInsertSchema(bannerTrades).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertLeaderboardSchema = createInsertSchema(leaderboard).omit({
  id: true,
  updatedAt: true,
});

export const insertTradeChatMessageSchema = createInsertSchema(tradeChatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  createdAt: true,
  lastInterestCalculation: true,
});

export const insertBankTransactionSchema = createInsertSchema(bankTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof pCoinTransactions.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertRedeemCode = z.infer<typeof insertRedeemCodeSchema>;
export type RedeemCode = typeof redeemCodes.$inferSelect;
export type InsertCodeRedemption = z.infer<typeof insertCodeRedemptionSchema>;
export type CodeRedemption = typeof codeRedemptions.$inferSelect;
export type InsertCoinPrice = z.infer<typeof insertCoinPriceSchema>;
export type CoinPrice = typeof coinPriceHistory.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameLeaderboard = z.infer<typeof insertGameLeaderboardSchema>;
export type GameLeaderboard = typeof gameLeaderboard.$inferSelect;
export type InsertShopItem = z.infer<typeof insertShopItemSchema>;
export type ShopItem = typeof shopItems.$inferSelect;
export type InsertUserPurchase = z.infer<typeof insertUserPurchaseSchema>;
export type UserPurchase = typeof userPurchases.$inferSelect;
export type InsertGameBan = z.infer<typeof insertGameBanSchema>;
export type GameBan = typeof gameBans.$inferSelect;
export type InsertUserBanner = z.infer<typeof insertUserBannerSchema>;
export type UserBanner = typeof userBanners.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertUserInventory = z.infer<typeof insertUserInventorySchema>;
export type UserInventory = typeof userInventory.$inferSelect;
export type InsertBannerTrade = z.infer<typeof insertBannerTradeSchema>;
export type BannerTrade = typeof bannerTrades.$inferSelect;
export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type Leaderboard = typeof leaderboard.$inferSelect;
export type InsertTradeChatMessage = z.infer<typeof insertTradeChatMessageSchema>;
export type TradeChatMessage = typeof tradeChatMessages.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankTransaction = z.infer<typeof insertBankTransactionSchema>;
export type BankTransaction = typeof bankTransactions.$inferSelect;

// Ticket system exports
export * from "./ticket-schema";

// Ticket schema imports
import { tickets, ticketMessages } from "./ticket-schema";
