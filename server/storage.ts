import {
  users,
  pCoinTransactions,
  trades,
  redeemCodes,
  codeRedemptions,
  coinPriceHistory,
  gameSessions,
  shopItems,
  userPurchases,
  gameBans,
  userBanners,
  userInventory,
  bannerTrades,
  leaderboard,
  type User,
  type InsertUser,
  type LoginUser,
  type InsertTransaction,
  type Transaction,
  type InsertTrade,
  type Trade,
  type RedeemCode,
  type InsertRedeemCode,
  type CodeRedemption,
  type InsertCodeRedemption,
  type CoinPrice,
  type InsertCoinPrice,
  type GameSession,
  type InsertGameSession,
  type ShopItem,
  type InsertShopItem,
  type UserPurchase,
  type InsertUserPurchase,
  type GameBan,
  type InsertGameBan,
  type UserBanner,
  type InsertUserBanner,
  type UserInventory,
  type InsertUserInventory,
  type BannerTrade,
  type InsertBannerTrade,
  type Leaderboard,
  type InsertLeaderboard,
  chatMessages,
  type ChatMessage,
  type InsertChatMessage,
  tradeChatMessages,
  type TradeChatMessage,
  type InsertTradeChatMessage,
  bankAccounts,
  bankTransactions,
  type BankAccount,
  type InsertBankAccount,
  type BankTransaction,
  type InsertBankTransaction,
  tickets,
  ticketMessages,
  type Ticket,
  type InsertTicket,
  type TicketMessage,
  type InsertTicketMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // P COIN operations
  updateUserBalance(userId: number, newBalance: string): Promise<User>;
  addTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number, limit?: number): Promise<Transaction[]>;
  giveWelcomeBonus(userId: number): Promise<boolean>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllTransactions(): Promise<Transaction[]>;
  updateUserRole(userId: number, role: string): Promise<User>;
  addCoinsToUser(userId: number, amount: string, reason: string): Promise<void>;
  deleteUser(userId: number): Promise<void>;
  getAdminStats(): Promise<{
    totalUsers: number;
    totalCoins: string;
    totalTransactions: number;
  }>;
  
  // Owner operations
  getAdminUsers(): Promise<User[]>;
  removeAdminRole(userId: number): Promise<User>;
  promoteToAdmin(userId: number): Promise<User>;
  banUser(userId: number, reason: string): Promise<User>;
  unbanUser(userId: number): Promise<User>;
  updateUserCoins(userId: number, amount: string, reason: string): Promise<User>;
  resetUserCoins(userId: number): Promise<User>;
  
  // VIP operations
  setUserVip(userId: number, isVip: boolean, durationDays?: number): Promise<User>;
  
  // Chat operations
  sendChatMessage(userId: number, message: string, isVipChat: boolean): Promise<any>;
  getChatMessages(isVipChat: boolean, limit?: number): Promise<any[]>;
  deleteChatMessage(messageId: number): Promise<void>;
  
  // Redeem code operations
  createRedeemCode(code: InsertRedeemCode): Promise<RedeemCode>;
  getRedeemCode(code: string): Promise<RedeemCode | undefined>;
  redeemCode(codeStr: string, userId: number): Promise<{ success: boolean; message: string; amount?: string }>;
  getAllRedeemCodes(): Promise<RedeemCode[]>;
  getAllRedeemCodesWithRedemptions(): Promise<any[]>;
  getActiveRedeemCodes(): Promise<RedeemCode[]>;
  hasUserRedeemedCode(codeId: number, userId: number): Promise<boolean>;
  
  // Trading operations
  createTrade(trade: InsertTrade): Promise<Trade>;
  getUserTrades(userId: number): Promise<Trade[]>;
  getPendingTrades(userId: number): Promise<Trade[]>;
  acceptTrade(tradeId: number): Promise<void>;
  cancelTrade(tradeId: number): Promise<void>;
  getAllTrades(): Promise<Trade[]>;
  
  // Price history operations
  addPricePoint(price: InsertCoinPrice): Promise<CoinPrice>;
  getPriceHistory(hours?: number): Promise<CoinPrice[]>;
  getLatestPrice(): Promise<CoinPrice | undefined>;
  initializePriceHistory(): Promise<void>;
  
  // Game operations
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getGameStats(userId: number): Promise<{
    totalWins: number;
    totalWinnings: string;
    gamesPlayed: number;
    biggestWin: string;
  }>;
  getRecentGames(userId: number, limit?: number): Promise<GameSession[]>;
  
  // Shop operations
  getShopItems(): Promise<ShopItem[]>;
  purchaseItem(userId: number, itemId: number): Promise<{ success: boolean; message: string }>;
  getUserPurchases(userId: number): Promise<UserPurchase[]>;
  createShopItem(item: InsertShopItem): Promise<ShopItem>;
  
  // Profile operations
  updateUserProfileImage(userId: number, imageUrl: string): Promise<User>;
  getUserBanners(userId: number): Promise<UserBanner[]>;
  setActiveBanner(userId: number, bannerUrl: string): Promise<UserBanner>;
  
  // Game ban operations
  banUserFromGame(userId: number, gameType: string, reason: string, bannedBy: number): Promise<GameBan>;
  unbanUserFromGame(userId: number, gameType: string): Promise<void>;
  getUserGameBans(userId: number): Promise<GameBan[]>;
  isUserBannedFromGame(userId: number, gameType: string): Promise<boolean>;
  getAllGameBans(): Promise<GameBan[]>;
  
  // Inventory operations
  getUserInventory(userId: number): Promise<UserInventory[]>;
  addToInventory(userId: number, itemId: number, quantity?: number): Promise<UserInventory>;
  removeFromInventory(userId: number, itemId: number, quantity?: number): Promise<void>;
  
  // Banner trading operations
  createBannerTrade(trade: InsertBannerTrade): Promise<BannerTrade>;
  getUserBannerTrades(userId: number): Promise<BannerTrade[]>;
  acceptBannerTrade(tradeId: number, userId: number): Promise<void>;
  cancelBannerTrade(tradeId: number, userId: number): Promise<void>;
  getAllBannerTrades(): Promise<BannerTrade[]>;
  
  // Leaderboard operations
  updateLeaderboard(userId: number, winnings: string, gameResult: boolean): Promise<Leaderboard>;
  getLeaderboard(limit?: number): Promise<any[]>;
  
  // Trade chat operations
  sendTradeMessage(tradeId: number, userId: number, message: string): Promise<TradeChatMessage>;
  getTradeMessages(tradeId: number): Promise<any[]>;
  deleteTradeMessage(messageId: number): Promise<void>;
  
  // Bank operations
  createBankAccount(userId: number): Promise<BankAccount>;
  getBankAccount(userId: number): Promise<BankAccount | undefined>;
  deposit(userId: number, amount: string): Promise<BankAccount>;
  withdraw(userId: number, amount: string): Promise<BankAccount>;
  calculateInterest(userId: number): Promise<BankAccount>;
  getBankTransactions(userId: number, limit?: number): Promise<BankTransaction[]>;
  getAllBankAccounts(): Promise<BankAccount[]>;
  
  // Ticket system operations
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getUserTickets(userId: number): Promise<Ticket[]>;
  getAllTickets(): Promise<Ticket[]>;
  updateTicketStatus(ticketId: number, status: string, assignedTo?: number): Promise<Ticket>;
  addTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;
  getTicketMessages(ticketId: number): Promise<(TicketMessage & { username: string })[]>;
  deleteTicketMessage(messageId: number): Promise<void>;
  deleteTicket(ticketId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // P COIN operations
  async updateUserBalance(userId: number, newBalance: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Validate new balance - ensure it's a valid number and not negative
    const balance = parseFloat(newBalance);
    if (isNaN(balance) || balance < 0) {
      throw new Error(`Invalid balance: ${newBalance} (parsed as ${balance})`);
    }

    // Format balance to 2 decimal places
    const formattedBalance = balance.toFixed(2);

    const [updatedUser] = await db
      .update(users)
      .set({ 
        pCoinBalance: formattedBalance,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  async addTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(pCoinTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getUserTransactions(userId: number, limit: number = 10): Promise<Transaction[]> {
    return await db
      .select()
      .from(pCoinTransactions)
      .where(eq(pCoinTransactions.userId, userId))
      .orderBy(desc(pCoinTransactions.createdAt))
      .limit(limit);
  }

  async giveWelcomeBonus(userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || user.hasReceivedWelcomeBonus === 1) {
      return false;
    }

    // Add 10 P COINS as welcome bonus
    const currentBalance = parseFloat(user.pCoinBalance || "0");
    const newBalance = (currentBalance + 10).toFixed(2);

    // Update user balance and mark as received welcome bonus
    await db
      .update(users)
      .set({ 
        pCoinBalance: newBalance,
        hasReceivedWelcomeBonus: 1,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Record the transaction
    await this.addTransaction({
      userId: userId,
      amount: "10.00",
      type: "welcome_bonus",
      description: "Welcome bonus for new user"
    });

    return true;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(pCoinTransactions).orderBy(desc(pCoinTransactions.createdAt));
  }

  async updateUserRole(userId: number, role: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!['user', 'admin', 'owner'].includes(role)) {
      throw new Error("Invalid role");
    }
    
    const [updatedUser] = await db
      .update(users)
      .set({ 
        role: role,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  async addCoinsToUser(userId: number, amount: string, reason: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentBalance = parseFloat(user.pCoinBalance || "0");
    const addAmount = parseFloat(amount);
    
    // Validate amount
    if (isNaN(addAmount) || addAmount <= 0) {
      throw new Error("Invalid amount");
    }
    
    // Check for overflow (max 99,999,999.99)
    if (addAmount > 99999999.99) {
      throw new Error("Amount too large. Maximum is 99,999,999.99");
    }
    
    const newBalance = (currentBalance + addAmount).toFixed(2);
    
    // Check new balance doesn't exceed limit
    if (parseFloat(newBalance) > 99999999.99) {
      throw new Error("New balance would exceed maximum limit");
    }

    // Update user balance
    await db
      .update(users)
      .set({ 
        pCoinBalance: newBalance,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Record the transaction
    await this.addTransaction({
      userId: userId,
      amount: amount,
      type: "admin_add",
      description: `Admin added coins: ${reason}`
    });
  }

  async deleteUser(userId: number): Promise<void> {
    console.log(`Attempting to delete user with ID: ${userId}`);
    
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    console.log(`Found user: ${user.username}, deleting transactions first...`);
    
    // Delete user's transactions first (foreign key constraint)
    const deletedTransactions = await db.delete(pCoinTransactions).where(eq(pCoinTransactions.userId, userId));
    console.log(`Deleted ${deletedTransactions} transactions`);
    
    // Delete the user
    console.log(`Deleting user: ${user.username}`);
    const deletedUser = await db.delete(users).where(eq(users.id, userId));
    console.log(`User deletion result:`, deletedUser);
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    totalCoins: string;
    totalTransactions: number;
  }> {
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalCoins = await db.select({ 
      sum: sql<string>`sum(CAST(COALESCE(${users.pCoinBalance}, '0') AS DECIMAL(10,2)))` 
    }).from(users);
    const totalTransactions = await db.select({ 
      count: sql<number>`count(*)` 
    }).from(pCoinTransactions);

    return {
      totalUsers: totalUsers[0]?.count || 0,
      totalCoins: (parseFloat(totalCoins[0]?.sum || "0")).toFixed(2),
      totalTransactions: totalTransactions[0]?.count || 0,
    };
  }

  // Trading operations
  async createTrade(trade: InsertTrade): Promise<Trade> {
    // Get sender and validate balance
    const sender = await this.getUser(trade.senderUserId);
    if (!sender) {
      throw new Error("Sender not found");
    }

    const senderBalance = parseFloat(sender.pCoinBalance || "0");
    const tradeAmount = parseFloat(trade.amount);

    if (senderBalance < tradeAmount) {
      throw new Error("Insufficient balance");
    }

    // Deduct amount from sender immediately when creating trade
    const newSenderBalance = (senderBalance - tradeAmount).toFixed(2);
    await db
      .update(users)
      .set({ pCoinBalance: newSenderBalance, updatedAt: new Date() })
      .where(eq(users.id, trade.senderUserId));

    // Create trade request
    const [createdTrade] = await db
      .insert(trades)
      .values(trade)
      .returning();

    // Record transaction for sender
    await this.addTransaction({
      userId: trade.senderUserId,
      amount: `-${tradeAmount}`,
      type: "trade_pending",
      description: `P COINS held for pending trade (Trade ID: ${createdTrade.id})`
    });

    return createdTrade;
  }

  async getUserTrades(userId: number): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .where(eq(trades.senderUserId, userId))
      .orderBy(desc(trades.createdAt));
  }

  async getPendingTrades(userId: number): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .where(eq(trades.receiverUserId, userId))
      .where(eq(trades.status, "pending"))
      .orderBy(desc(trades.createdAt));
  }

  async acceptTrade(tradeId: number): Promise<void> {
    const trade = await db
      .select()
      .from(trades)
      .where(eq(trades.id, tradeId))
      .where(eq(trades.status, "pending"))
      .limit(1);

    if (!trade[0]) {
      throw new Error("Trade not found or already completed");
    }

    const tradeData = trade[0];
    const sender = await this.getUser(tradeData.senderUserId);
    const receiver = await this.getUser(tradeData.receiverUserId);

    if (!sender || !receiver) {
      throw new Error("Users not found");
    }

    const tradeAmount = parseFloat(tradeData.amount);

    // Give coins to receiver (sender already paid when creating trade)
    const newReceiverBalance = (parseFloat(receiver.pCoinBalance || "0") + tradeAmount).toFixed(2);

    await db
      .update(users)
      .set({ pCoinBalance: newReceiverBalance, updatedAt: new Date() })
      .where(eq(users.id, tradeData.receiverUserId));

    // Update trade status
    await db
      .update(trades)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(trades.id, tradeId));

    // Record transaction for receiver
    await this.addTransaction({
      userId: tradeData.receiverUserId,
      amount: tradeAmount.toString(),
      type: "trade_receive",
      description: `Received ${tradeAmount} P COINS from ${sender.username}${tradeData.message ? `: ${tradeData.message}` : ""}`
    });

    // Update sender's pending transaction to completed
    await this.addTransaction({
      userId: tradeData.senderUserId,
      amount: "0.00",
      type: "trade_completed",
      description: `Trade completed: Sent ${tradeAmount} P COINS to ${receiver.username}${tradeData.message ? `: ${tradeData.message}` : ""}`
    });
  }

  async cancelTrade(tradeId: number): Promise<void> {
    const trade = await db
      .select()
      .from(trades)
      .where(eq(trades.id, tradeId))
      .where(eq(trades.status, "pending"))
      .limit(1);

    if (!trade[0]) {
      throw new Error("Trade not found or already completed");
    }

    const tradeData = trade[0];
    const sender = await this.getUser(tradeData.senderUserId);

    if (!sender) {
      throw new Error("Sender not found");
    }

    // Refund coins to sender
    const tradeAmount = parseFloat(tradeData.amount);
    const newSenderBalance = (parseFloat(sender.pCoinBalance || "0") + tradeAmount).toFixed(2);

    await db
      .update(users)
      .set({ pCoinBalance: newSenderBalance, updatedAt: new Date() })
      .where(eq(users.id, tradeData.senderUserId));

    // Update trade status
    await db
      .update(trades)
      .set({ status: "cancelled" })
      .where(eq(trades.id, tradeId));

    // Record refund transaction
    await this.addTransaction({
      userId: tradeData.senderUserId,
      amount: tradeAmount.toString(),
      type: "trade_refund",
      description: `Trade cancelled: Refunded ${tradeAmount} P COINS`
    });
  }

  async getAllTrades(): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .orderBy(desc(trades.createdAt));
  }

  // Owner operations
  async getAdminUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'admin'));
  }

  async removeAdminRole(userId: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role: 'user', updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async promoteToAdmin(userId: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role: 'admin', updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async banUser(userId: number, reason: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        isBanned: true, 
        bannedAt: new Date(),
        bannedReason: reason
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async unbanUser(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        isBanned: false, 
        bannedAt: null,
        bannedReason: null
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserCoins(userId: number, amount: string, reason: string): Promise<User> {
    // Validate and format the amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      throw new Error("Invalid amount");
    }
    const formattedAmount = numAmount.toFixed(2);

    // Update user balance
    const [user] = await db
      .update(users)
      .set({ 
        pCoinBalance: formattedAmount,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    // Add transaction record
    await this.addTransaction({
      userId,
      amount: formattedAmount,
      type: 'admin_adjustment',
      description: reason
    });

    return user;
  }

  async resetUserCoins(userId: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        pCoinBalance: "0.00",
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    // Record transaction
    await this.addTransaction({
      userId,
      amount: "0.00",
      type: "owner_reset",
      description: "Coins reset by owner"
    });

    return updatedUser;
  }

  // VIP operations
  async setUserVip(userId: number, isVip: boolean, durationDays?: number): Promise<User> {
    const vipExpiresAt = isVip && durationDays ? 
      new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000) : null;

    const [updatedUser] = await db
      .update(users)
      .set({
        isVip,
        vipExpiresAt,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  // Chat operations
  async sendChatMessage(userId: number, message: string, isVipChat: boolean): Promise<any> {
    const [chatMessage] = await db
      .insert(chatMessages)
      .values({
        userId,
        message,
        isVipChat
      })
      .returning();

    return chatMessage;
  }

  async getChatMessages(isVipChat: boolean, limit: number = 50): Promise<any[]> {
    const messages = await db
      .select({
        id: chatMessages.id,
        message: chatMessages.message,
        createdAt: chatMessages.createdAt,
        isVipChat: chatMessages.isVipChat,
        userId: chatMessages.userId,
        username: users.username,
        role: users.role,
        isVip: users.isVip
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.userId, users.id))
      .where(eq(chatMessages.isVipChat, isVipChat))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    return messages.reverse(); // Reverse to show oldest first
  }

  async deleteChatMessage(messageId: number): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.id, messageId));
  }

  // Redeem code operations
  async createRedeemCode(codeData: InsertRedeemCode): Promise<RedeemCode> {
    const [code] = await db
      .insert(redeemCodes)
      .values(codeData)
      .returning();
    return code;
  }

  async getRedeemCode(code: string): Promise<RedeemCode | undefined> {
    const [redeemCode] = await db
      .select()
      .from(redeemCodes)
      .where(eq(redeemCodes.code, code));
    return redeemCode;
  }

  async redeemCode(codeStr: string, userId: number): Promise<{ success: boolean; message: string; amount?: string }> {
    // Get the code
    const code = await this.getRedeemCode(codeStr);
    if (!code) {
      return { success: false, message: "Invalid code" };
    }

    // Check if code is fully used
    if (code.usedCount >= code.usageLimit) {
      return { success: false, message: "Code has no more uses remaining" };
    }

    // Check if user already redeemed this code
    const alreadyRedeemed = await this.hasUserRedeemedCode(code.id, userId);
    if (alreadyRedeemed) {
      return { success: false, message: "You have already redeemed this code" };
    }

    // Redeem the code
    await db.transaction(async (tx) => {
      // Increment used count
      await tx
        .update(redeemCodes)
        .set({
          usedCount: code.usedCount + 1,
        })
        .where(eq(redeemCodes.id, code.id));

      // Record the redemption
      await tx
        .insert(codeRedemptions)
        .values({
          codeId: code.id,
          userId: userId,
        });

      // Add coins to user
      const user = await this.getUser(userId);
      if (user) {
        const newBalance = (parseFloat(user.pCoinBalance || "0") + parseFloat(code.amount)).toFixed(2);
        await this.updateUserBalance(userId, newBalance);
        
        // Add transaction record
        await this.addTransaction({
          userId,
          amount: code.amount,
          type: "code_redeem",
          description: `Redeemed code ${codeStr}`,
        });
      }
    });

    return { success: true, message: "Code redeemed successfully", amount: code.amount };
  }

  async getAllRedeemCodes(): Promise<RedeemCode[]> {
    return await db
      .select()
      .from(redeemCodes)
      .orderBy(desc(redeemCodes.createdAt));
  }

  async getAllRedeemCodesWithRedemptions(): Promise<any[]> {
    const codes = await db
      .select()
      .from(redeemCodes)
      .orderBy(desc(redeemCodes.createdAt));

    const codesWithRedemptions = await Promise.all(
      codes.map(async (code) => {
        // Get all redemptions for this code with user details
        const redemptions = await db
          .select({
            id: codeRedemptions.id,
            userId: codeRedemptions.userId,
            redeemedAt: codeRedemptions.redeemedAt,
            username: users.username,
          })
          .from(codeRedemptions)
          .innerJoin(users, eq(codeRedemptions.userId, users.id))
          .where(eq(codeRedemptions.codeId, code.id))
          .orderBy(desc(codeRedemptions.redeemedAt));

        return {
          ...code,
          redemptions,
        };
      })
    );

    return codesWithRedemptions;
  }

  async getActiveRedeemCodes(): Promise<RedeemCode[]> {
    return await db
      .select()
      .from(redeemCodes)
      .where(sql`${redeemCodes.usedCount} < ${redeemCodes.usageLimit}`)
      .orderBy(desc(redeemCodes.createdAt));
  }

  async hasUserRedeemedCode(codeId: number, userId: number): Promise<boolean> {
    const redemption = await db
      .select()
      .from(codeRedemptions)
      .where(eq(codeRedemptions.codeId, codeId))
      .where(eq(codeRedemptions.userId, userId))
      .limit(1);
    
    return redemption.length > 0;
  }

  // Price history operations
  async addPricePoint(priceData: InsertCoinPrice): Promise<CoinPrice> {
    const [price] = await db
      .insert(coinPriceHistory)
      .values(priceData)
      .returning();
    return price;
  }

  async getPriceHistory(hours: number = 24): Promise<CoinPrice[]> {
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - hours);
    
    return await db
      .select()
      .from(coinPriceHistory)
      .where(sql`${coinPriceHistory.timestamp} >= ${hoursAgo}`)
      .orderBy(coinPriceHistory.timestamp);
  }

  async getLatestPrice(): Promise<CoinPrice | undefined> {
    const [price] = await db
      .select()
      .from(coinPriceHistory)
      .orderBy(desc(coinPriceHistory.timestamp))
      .limit(1);
    return price;
  }

  async initializePriceHistory(): Promise<void> {
    // Check if we have any price history
    const existing = await this.getLatestPrice();
    if (!existing) {
      // Initialize with a starting price of $1.00
      await this.addPricePoint({
        price: "1.0000",
        volume: "0",
        changePercent: "0"
      });
    }
  }

  // Game operations
  async createGameSession(sessionData: InsertGameSession): Promise<GameSession> {
    const [session] = await db
      .insert(gameSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async getGameStats(userId: number): Promise<{
    totalWins: number;
    totalWinnings: string;
    gamesPlayed: number;
    biggestWin: string;
  }> {
    const games = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.userId, userId));

    const wins = games.filter(g => g.result === 'win');
    const totalWinnings = wins.reduce((sum, g) => sum + parseFloat(g.winAmount), 0);
    const biggestWin = Math.max(...wins.map(g => parseFloat(g.winAmount)), 0);

    return {
      totalWins: wins.length,
      totalWinnings: totalWinnings.toFixed(2),
      gamesPlayed: games.length,
      biggestWin: biggestWin.toFixed(2)
    };
  }

  async getRecentGames(userId: number, limit: number = 10): Promise<GameSession[]> {
    return db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.userId, userId))
      .orderBy(desc(gameSessions.createdAt))
      .limit(limit);
  }

  // Shop operations
  async getShopItems(): Promise<ShopItem[]> {
    const items = await db
      .select()
      .from(shopItems)
      .where(eq(shopItems.isActive, true))
      .orderBy(shopItems.id);
    return items;
  }

  async purchaseItem(userId: number, itemId: number): Promise<{ success: boolean; message: string }> {
    try {
      const [item] = await db.select().from(shopItems).where(eq(shopItems.id, itemId));
      if (!item) {
        return { success: false, message: "Item not found" };
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return { success: false, message: "User not found" };
      }

      const userBalance = parseFloat(user.pCoinBalance || "0");
      const itemPrice = parseFloat(item.price);

      if (userBalance < itemPrice) {
        return { success: false, message: "Insufficient P COIN balance" };
      }

      // Allow multiple purchases of banners, but restrict other items (except VIP membership)
      if (item.name !== 'VIP Membership' && item.type !== 'banner') {
        const existingPurchase = await db
          .select()
          .from(userPurchases)
          .where(eq(userPurchases.userId, userId))
          .where(eq(userPurchases.itemId, itemId));

        if (existingPurchase.length > 0) {
          return { success: false, message: "You already own this item" };
        }
      }

      // Create purchase and update balance
      const newBalance = (userBalance - itemPrice).toFixed(2);
      
      await db.update(users)
        .set({ pCoinBalance: newBalance })
        .where(eq(users.id, userId));

      await db.insert(userPurchases).values({
        userId,
        itemId,
        purchasePrice: item.price,
      });

      await db.insert(pCoinTransactions).values({
        userId,
        amount: `-${item.price}`,
        type: "purchase",
        description: `Purchased ${item.name}`,
      });

      // If it's a banner, add to user inventory
      if (item.type === 'banner') {
        await this.addToInventory(userId, itemId, 1);
        
        // Also add to user banners for backwards compatibility
        await db.insert(userBanners).values({
          userId,
          bannerUrl: item.imageUrl || "",
          isActive: false,
        });
      }

      // If it's VIP membership, activate VIP status
      if (item.name === 'VIP Membership') {
        await this.setUserVip(userId, true, 30);
      }

      return { success: true, message: "Item purchased successfully!" };
    } catch (error) {
      console.error("Error purchasing item:", error);
      return { success: false, message: "Failed to purchase item" };
    }
  }

  async getUserPurchases(userId: number): Promise<UserPurchase[]> {
    const purchases = await db
      .select()
      .from(userPurchases)
      .where(eq(userPurchases.userId, userId))
      .orderBy(desc(userPurchases.createdAt));
    return purchases;
  }

  async createShopItem(itemData: InsertShopItem): Promise<ShopItem> {
    const [item] = await db.insert(shopItems).values(itemData).returning();
    return item;
  }

  // Profile operations
  async updateUserProfileImage(userId: number, imageUrl: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ profileImageUrl: imageUrl })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserBanners(userId: number): Promise<UserBanner[]> {
    const banners = await db
      .select()
      .from(userBanners)
      .where(eq(userBanners.userId, userId))
      .orderBy(desc(userBanners.createdAt));
    return banners;
  }

  async setActiveBanner(userId: number, bannerUrl: string): Promise<UserBanner> {
    // Deactivate all current banners
    await db
      .update(userBanners)
      .set({ isActive: false })
      .where(eq(userBanners.userId, userId));

    // Activate the selected banner
    const [banner] = await db
      .update(userBanners)
      .set({ isActive: true })
      .where(eq(userBanners.userId, userId))
      .where(eq(userBanners.bannerUrl, bannerUrl))
      .returning();

    return banner;
  }

  // Game ban operations
  async banUserFromGame(userId: number, gameType: string, reason: string, bannedBy: number): Promise<GameBan> {
    const [ban] = await db.insert(gameBans).values({
      userId,
      gameType,
      reason,
      bannedBy,
    }).returning();
    return ban;
  }

  async unbanUserFromGame(userId: number, gameType: string): Promise<void> {
    await db
      .delete(gameBans)
      .where(eq(gameBans.userId, userId))
      .where(eq(gameBans.gameType, gameType));
  }

  async getUserGameBans(userId: number): Promise<GameBan[]> {
    const bans = await db
      .select()
      .from(gameBans)
      .where(eq(gameBans.userId, userId));
    return bans;
  }

  async isUserBannedFromGame(userId: number, gameType: string): Promise<boolean> {
    const [ban] = await db
      .select()
      .from(gameBans)
      .where(eq(gameBans.userId, userId))
      .where(eq(gameBans.gameType, gameType));
    return !!ban;
  }

  async getAllGameBans(): Promise<GameBan[]> {
    const bans = await db
      .select()
      .from(gameBans)
      .orderBy(desc(gameBans.createdAt));
    return bans;
  }

  // Inventory operations
  async getUserInventory(userId: number): Promise<UserInventory[]> {
    const inventory = await db
      .select()
      .from(userInventory)
      .where(eq(userInventory.userId, userId))
      .orderBy(desc(userInventory.createdAt));
    return inventory;
  }

  async addToInventory(userId: number, itemId: number, quantity: number = 1): Promise<UserInventory> {
    // Check if item already exists in inventory
    const [existingItem] = await db
      .select()
      .from(userInventory)
      .where(eq(userInventory.userId, userId))
      .where(eq(userInventory.itemId, itemId));

    if (existingItem) {
      // Update quantity
      const [updated] = await db
        .update(userInventory)
        .set({ quantity: existingItem.quantity + quantity })
        .where(eq(userInventory.id, existingItem.id))
        .returning();
      return updated;
    } else {
      // Create new inventory item
      const [newItem] = await db
        .insert(userInventory)
        .values({
          userId,
          itemId,
          quantity,
        })
        .returning();
      return newItem;
    }
  }

  async removeFromInventory(userId: number, itemId: number, quantity: number = 1): Promise<void> {
    const [existingItem] = await db
      .select()
      .from(userInventory)
      .where(eq(userInventory.userId, userId))
      .where(eq(userInventory.itemId, itemId));

    if (existingItem) {
      const newQuantity = existingItem.quantity - quantity;
      if (newQuantity <= 0) {
        // Remove item completely
        await db
          .delete(userInventory)
          .where(eq(userInventory.id, existingItem.id));
      } else {
        // Update quantity
        await db
          .update(userInventory)
          .set({ quantity: newQuantity })
          .where(eq(userInventory.id, existingItem.id));
      }
    }
  }

  // Banner trading operations
  async createBannerTrade(tradeData: InsertBannerTrade): Promise<BannerTrade> {
    const [trade] = await db.insert(bannerTrades).values(tradeData).returning();
    return trade;
  }

  async getUserBannerTrades(userId: number): Promise<BannerTrade[]> {
    const trades = await db
      .select()
      .from(bannerTrades)
      .where(sql`${bannerTrades.fromUserId} = ${userId} OR ${bannerTrades.toUserId} = ${userId}`)
      .orderBy(desc(bannerTrades.createdAt));
    return trades;
  }

  async acceptBannerTrade(tradeId: number, userId: number): Promise<void> {
    const [trade] = await db
      .select()
      .from(bannerTrades)
      .where(eq(bannerTrades.id, tradeId));

    if (!trade) {
      throw new Error("Trade not found");
    }

    if (trade.status !== "pending") {
      throw new Error("Trade is no longer pending");
    }

    let updates: any = {};
    
    if (trade.fromUserId === userId) {
      updates.fromUserAccepted = true;
    } else if (trade.toUserId === userId) {
      updates.toUserAccepted = true;
    } else {
      throw new Error("User not part of this trade");
    }

    // Check if both users have accepted
    const bothAccepted = (updates.fromUserAccepted || trade.fromUserAccepted) && 
                        (updates.toUserAccepted || trade.toUserAccepted);

    if (bothAccepted) {
      updates.status = "completed";
      updates.completedAt = new Date();

      // Execute the trade - swap items in inventory
      await this.removeFromInventory(trade.fromUserId, trade.fromItemId, trade.fromQuantity);
      await this.removeFromInventory(trade.toUserId, trade.toItemId, trade.toQuantity);
      await this.addToInventory(trade.fromUserId, trade.toItemId, trade.toQuantity);
      await this.addToInventory(trade.toUserId, trade.fromItemId, trade.fromQuantity);
    }

    await db
      .update(bannerTrades)
      .set(updates)
      .where(eq(bannerTrades.id, tradeId));
  }

  async cancelBannerTrade(tradeId: number, userId: number): Promise<void> {
    const [trade] = await db
      .select()
      .from(bannerTrades)
      .where(eq(bannerTrades.id, tradeId));

    if (!trade) {
      throw new Error("Trade not found");
    }

    if (trade.fromUserId !== userId && trade.toUserId !== userId) {
      throw new Error("User not authorized to cancel this trade");
    }

    await db
      .update(bannerTrades)
      .set({ status: "cancelled" })
      .where(eq(bannerTrades.id, tradeId));
  }

  async getAllBannerTrades(): Promise<BannerTrade[]> {
    const trades = await db
      .select()
      .from(bannerTrades)
      .orderBy(desc(bannerTrades.createdAt));
    return trades;
  }

  // Leaderboard operations
  async updateLeaderboard(userId: number, winnings: string, gameResult: boolean): Promise<Leaderboard> {
    const winningsNum = parseFloat(winnings);
    
    const [existingEntry] = await db
      .select()
      .from(leaderboard)
      .where(eq(leaderboard.userId, userId));

    if (existingEntry) {
      const newTotalWinnings = parseFloat(existingEntry.totalWinnings) + winningsNum;
      const newTotalGames = existingEntry.totalGamesPlayed + 1;
      const newBiggestWin = winningsNum > parseFloat(existingEntry.biggestWin) ? winnings : existingEntry.biggestWin;
      
      // Calculate win rate (assuming we track wins somehow)
      const wins = gameResult ? 1 : 0;
      const currentWinRate = parseFloat(existingEntry.winRate) || 0;
      const newWinRate = ((currentWinRate * existingEntry.totalGamesPlayed) + wins) / newTotalGames;

      const [updated] = await db
        .update(leaderboard)
        .set({
          totalWinnings: newTotalWinnings.toFixed(2),
          totalGamesPlayed: newTotalGames,
          biggestWin: newBiggestWin,
          winRate: newWinRate.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(leaderboard.userId, userId))
        .returning();
      return updated;
    } else {
      const [newEntry] = await db
        .insert(leaderboard)
        .values({
          userId,
          totalWinnings: winnings,
          totalGamesPlayed: 1,
          biggestWin: winnings,
          winRate: gameResult ? "100.00" : "0.00",
        })
        .returning();
      return newEntry;
    }
  }

  async getLeaderboard(limit: number = 10): Promise<any[]> {
    const results = await db
      .select({
        userId: leaderboard.userId,
        username: users.username,
        totalWinnings: leaderboard.totalWinnings,
        totalGamesPlayed: leaderboard.totalGamesPlayed,
        biggestWin: leaderboard.biggestWin,
        winRate: leaderboard.winRate,
        updatedAt: leaderboard.updatedAt,
      })
      .from(leaderboard)
      .leftJoin(users, eq(leaderboard.userId, users.id))
      .orderBy(desc(leaderboard.totalWinnings))
      .limit(limit);
    return results;
  }

  // Trade chat operations
  async sendTradeMessage(tradeId: number, userId: number, message: string): Promise<TradeChatMessage> {
    const [chatMessage] = await db
      .insert(tradeChatMessages)
      .values({
        tradeId,
        userId,
        message: message.trim(),
      })
      .returning();
    return chatMessage;
  }

  async getTradeMessages(tradeId: number): Promise<any[]> {
    const messages = await db
      .select({
        id: tradeChatMessages.id,
        tradeId: tradeChatMessages.tradeId,
        userId: tradeChatMessages.userId,
        username: users.username,
        message: tradeChatMessages.message,
        createdAt: tradeChatMessages.createdAt,
      })
      .from(tradeChatMessages)
      .innerJoin(users, eq(tradeChatMessages.userId, users.id))
      .where(eq(tradeChatMessages.tradeId, tradeId))
      .orderBy(tradeChatMessages.createdAt);

    return messages;
  }

  async deleteTradeMessage(messageId: number): Promise<void> {
    await db
      .delete(tradeChatMessages)
      .where(eq(tradeChatMessages.id, messageId));
  }

  // Bank operations
  async createBankAccount(userId: number): Promise<BankAccount> {
    const [account] = await db
      .insert(bankAccounts)
      .values({
        userId,
        balance: "0.00",
        interestRate: "0.0500", // 5% annual interest
      })
      .returning();
    return account;
  }

  async getBankAccount(userId: number): Promise<BankAccount | undefined> {
    const account = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, userId))
      .limit(1);
    return account[0];
  }

  async deposit(userId: number, amount: string): Promise<BankAccount> {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error("Invalid deposit amount");
    }

    // Get current user balance
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const userBalance = parseFloat(user.pCoinBalance);
    if (userBalance < numAmount) {
      throw new Error("Insufficient P COIN balance");
    }

    // Get or create bank account
    let bankAccount = await this.getBankAccount(userId);
    if (!bankAccount) {
      bankAccount = await this.createBankAccount(userId);
    }

    const newBankBalance = parseFloat(bankAccount.balance) + numAmount;
    const newUserBalance = userBalance - numAmount;

    // Update bank account
    const [updatedAccount] = await db
      .update(bankAccounts)
      .set({ balance: newBankBalance.toFixed(2) })
      .where(eq(bankAccounts.userId, userId))
      .returning();

    // Update user balance
    await this.updateUserBalance(userId, newUserBalance.toFixed(2));

    // Add transaction records
    await db.insert(bankTransactions).values({
      userId,
      type: 'deposit',
      amount: amount,
      description: `Deposited ${amount} P COINS to NAPASSIST Bank`
    });

    await this.addTransaction({
      userId,
      amount: `-${amount}`,
      type: 'bank_deposit',
      description: `Deposited to NAPASSIST Bank`
    });

    return updatedAccount;
  }

  async withdraw(userId: number, amount: string): Promise<BankAccount> {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error("Invalid withdrawal amount");
    }

    const bankAccount = await this.getBankAccount(userId);
    if (!bankAccount) {
      throw new Error("Bank account not found");
    }

    const bankBalance = parseFloat(bankAccount.balance);
    if (bankBalance < numAmount) {
      throw new Error("Insufficient bank balance");
    }

    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const newBankBalance = bankBalance - numAmount;
    const newUserBalance = parseFloat(user.pCoinBalance) + numAmount;

    // Update bank account
    const [updatedAccount] = await db
      .update(bankAccounts)
      .set({ balance: newBankBalance.toFixed(2) })
      .where(eq(bankAccounts.userId, userId))
      .returning();

    // Update user balance
    await this.updateUserBalance(userId, newUserBalance.toFixed(2));

    // Add transaction records
    await db.insert(bankTransactions).values({
      userId,
      type: 'withdrawal',
      amount: amount,
      description: `Withdrew ${amount} P COINS from NAPASSIST Bank`
    });

    await this.addTransaction({
      userId,
      amount: amount,
      type: 'bank_withdrawal',
      description: `Withdrawn from NAPASSIST Bank`
    });

    return updatedAccount;
  }

  async calculateInterest(userId: number): Promise<BankAccount> {
    const bankAccount = await this.getBankAccount(userId);
    if (!bankAccount) {
      throw new Error("Bank account not found");
    }

    const now = new Date();
    const lastCalculation = new Date(bankAccount.lastInterestCalculation);
    const hoursSinceLastCalculation = (now.getTime() - lastCalculation.getTime()) / (1000 * 60 * 60);

    // Calculate interest every 24 hours
    if (hoursSinceLastCalculation >= 24) {
      const balance = parseFloat(bankAccount.balance);
      const interestRate = parseFloat(bankAccount.interestRate);
      const dailyRate = interestRate / 365; // Convert annual rate to daily
      const interest = balance * dailyRate;

      if (interest > 0) {
        const newBalance = balance + interest;

        const [updatedAccount] = await db
          .update(bankAccounts)
          .set({
            balance: newBalance.toFixed(2),
            lastInterestCalculation: now,
          })
          .where(eq(bankAccounts.userId, userId))
          .returning();

        // Add interest transaction
        await db.insert(bankTransactions).values({
          userId,
          type: 'interest',
          amount: interest.toFixed(2),
          description: `Daily interest earned (${(interestRate * 100).toFixed(2)}% APY)`
        });

        return updatedAccount;
      }
    }

    return bankAccount;
  }

  async getBankTransactions(userId: number, limit: number = 20): Promise<BankTransaction[]> {
    const transactions = await db
      .select()
      .from(bankTransactions)
      .where(eq(bankTransactions.userId, userId))
      .orderBy(desc(bankTransactions.createdAt))
      .limit(limit);
    return transactions;
  }

  async getAllBankAccounts(): Promise<BankAccount[]> {
    const accounts = await db
      .select()
      .from(bankAccounts)
      .orderBy(desc(bankAccounts.balance));
    return accounts;
  }
  // Ticket system implementation  
  async createTicket(ticketData: InsertTicket): Promise<Ticket> {
    const [ticket] = await db.insert(tickets).values(ticketData).returning();
    return ticket;
  }
  
  async getUserTickets(userId: number): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.userId, userId)).orderBy(desc(tickets.createdAt));
  }
  
  async getAllTickets(): Promise<Ticket[]> {
    return await db.select().from(tickets).orderBy(desc(tickets.createdAt));
  }
  
  async updateTicketStatus(ticketId: number, status: string, assignedTo?: number): Promise<Ticket> {
    const updateData: any = { status, updatedAt: new Date() };
    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo;
    }
    
    const [ticket] = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, ticketId))
      .returning();
    return ticket;
  }
  
  async addTicketMessage(messageData: InsertTicketMessage): Promise<TicketMessage> {
    const [message] = await db.insert(ticketMessages).values(messageData).returning();
    return message;
  }
  
  async getTicketMessages(ticketId: number): Promise<(TicketMessage & { username: string })[]> {
    return await db
      .select({
        id: ticketMessages.id,
        ticketId: ticketMessages.ticketId,
        userId: ticketMessages.userId,
        message: ticketMessages.message,
        isStaff: ticketMessages.isStaff,
        createdAt: ticketMessages.createdAt,
        username: users.username
      })
      .from(ticketMessages)
      .leftJoin(users, eq(ticketMessages.userId, users.id))
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(ticketMessages.createdAt);
  }
  
  async deleteTicketMessage(messageId: number): Promise<void> {
    await db.delete(ticketMessages).where(eq(ticketMessages.id, messageId));
  }

  async deleteTicket(ticketId: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete all ticket messages first
      await tx.delete(ticketMessages).where(eq(ticketMessages.ticketId, ticketId));
      // Delete the ticket
      await tx.delete(tickets).where(eq(tickets.id, ticketId));
    });
  }
}

export const storage = new DatabaseStorage();
