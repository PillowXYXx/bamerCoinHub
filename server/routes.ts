import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, isOwner } from "./auth";

// Game logic functions
function processPlinkoGame(betAmount: number, gameData: any) {
  const { difficulty, rows, multipliers } = gameData;
  
  // Simulate ball path
  const ballPath = [];
  let currentPosition = Math.floor(rows / 2);
  
  for (let i = 0; i < rows; i++) {
    ballPath.push(currentPosition);
    // Random left or right movement
    if (Math.random() > 0.5) {
      currentPosition = Math.min(currentPosition + 1, i + 2);
    } else {
      currentPosition = Math.max(currentPosition - 1, 0);
    }
  }
  
  // Final position determines multiplier
  const finalPosition = Math.min(currentPosition, multipliers.length - 1);
  const multiplier = multipliers[finalPosition] || 0;
  const winAmount = betAmount * multiplier;
  
  return {
    ballPath,
    multiplier,
    winAmount,
    finalPosition
  };
}

function processCupsGame(betAmount: number, gameData: any) {
  const { selectedCup } = gameData;
  
  // Randomly place ball under one of 3 cups
  const ballPosition = Math.floor(Math.random() * 3);
  const won = selectedCup === ballPosition;
  const winAmount = won ? betAmount * 3 : 0;
  
  return {
    ballPosition,
    won,
    winAmount
  };
}

function processRouletteGame(betAmount: number, gameData: any) {
  const { selectedNumbers, selectedColor, selectedType } = gameData;
  
  // Generate random number 0-36
  const winningNumber = Math.floor(Math.random() * 37);
  
  let winAmount = 0;
  let multiplier = 0;
  
  // Check number bets (36x payout)
  if (selectedNumbers && selectedNumbers.includes(winningNumber)) {
    multiplier = 36;
    winAmount = betAmount * multiplier;
  }
  
  // Check color bets (2x payout)
  if (!winAmount && selectedColor && winningNumber !== 0) {
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const isRed = redNumbers.includes(winningNumber);
    const isWinningColor = (selectedColor === 'red' && isRed) || (selectedColor === 'black' && !isRed);
    
    if (isWinningColor) {
      multiplier = 2;
      winAmount = betAmount * multiplier;
    }
  }
  
  // Check type bets (2x payout)
  if (!winAmount && selectedType && winningNumber !== 0) {
    const isEven = winningNumber % 2 === 0;
    const isWinningType = (selectedType === 'even' && isEven) || (selectedType === 'odd' && !isEven);
    
    if (isWinningType) {
      multiplier = 2;
      winAmount = betAmount * multiplier;
    }
  }
  
  return {
    number: winningNumber,
    winAmount,
    multiplier
  };
}

function processSlideGame(betAmount: number, gameData: any) {
  const { prediction, targetValue, multiplier } = gameData;
  
  // Generate random value 0-100
  const actualValue = Math.floor(Math.random() * 101);
  
  let won = false;
  if (prediction === 'higher' && actualValue > targetValue) {
    won = true;
  } else if (prediction === 'lower' && actualValue < targetValue) {
    won = true;
  }
  
  const winAmount = won ? betAmount * multiplier : 0;
  
  return {
    actualValue,
    won,
    winAmount,
    multiplier
  };
}

function processJackpotGame(betAmount: number, gameData: any) {
  const { jackpotAmount } = gameData;
  
  const symbols = ['🍋', '🍎', '🍇', '🍊', '🍒', '💎', '⭐', '👑'];
  const resultSymbols = [
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)]
  ];
  
  let winAmount = 0;
  let jackpot = false;
  
  // Check for jackpot (all crowns)
  if (resultSymbols.every(symbol => symbol === '👑')) {
    winAmount = jackpotAmount;
    jackpot = true;
  }
  // Check for three of a kind
  else if (resultSymbols[0] === resultSymbols[1] && resultSymbols[1] === resultSymbols[2]) {
    const multipliers: { [key: string]: number } = {
      '💎': 50,
      '⭐': 25,
      '🍒': 10,
      '🍋': 5,
      '🍎': 3,
      '🍇': 2,
      '🍊': 2
    };
    const multiplier = multipliers[resultSymbols[0]] || 2;
    winAmount = betAmount * multiplier;
  }
  // Check for two of a kind
  else if (resultSymbols[0] === resultSymbols[1] || resultSymbols[1] === resultSymbols[2] || resultSymbols[0] === resultSymbols[2]) {
    winAmount = betAmount * 1.5;
  }
  
  return {
    symbols: resultSymbols,
    winAmount,
    jackpot
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // P COIN routes
  app.post('/api/claim-welcome-bonus', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const success = await storage.giveWelcomeBonus(userId);
      
      if (!success) {
        return res.status(400).json({ 
          message: "Welcome bonus already claimed or user not found" 
        });
      }

      const updatedUser = await storage.getUser(userId);
      res.json({ 
        message: "Welcome bonus claimed successfully!",
        user: updatedUser
      });
    } catch (error) {
      console.error("Error claiming welcome bonus:", error);
      res.status(500).json({ message: "Failed to claim welcome bonus" });
    }
  });

  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const transactions = await storage.getUserTransactions(userId, limit);
      
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ balance: user.pCoinBalance });
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  // User profile route
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/transactions', isAdmin, async (req: any, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/admin/stats', isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.post('/api/admin/add-coins', isAdmin, async (req: any, res) => {
    try {
      const { userId, amount, reason } = req.body;
      
      if (!userId || !amount || !reason) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      await storage.addCoinsToUser(userId, amount, reason);
      res.json({ message: "Coins added successfully" });
    } catch (error) {
      console.error("Error adding coins:", error);
      res.status(500).json({ message: "Failed to add coins" });
    }
  });

  app.post('/api/admin/update-role', isAdmin, async (req: any, res) => {
    try {
      const { userId, role } = req.body;
      
      if (!userId || !role) {
        return res.status(400).json({ message: "User ID and role are required" });
      }

      // Prevent modifying yourself
      if (req.user && req.user.id === userId) {
        return res.status(400).json({ message: "Cannot modify your own role" });
      }

      // Get the target user to check their current role
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent admins from modifying other admins or owners
      if (req.user.role === 'admin' && (targetUser.role === 'admin' || targetUser.role === 'owner')) {
        return res.status(403).json({ message: "Admins cannot modify other admin or owner accounts" });
      }

      // Only owners can promote/demote admins
      if (role === 'admin' || role === 'owner') {
        if (req.user.role !== 'owner') {
          return res.status(403).json({ message: "Only owners can manage admin roles" });
        }
      }

      // Prevent creating multiple owners
      if (role === 'owner' && req.user.role !== 'owner') {
        return res.status(403).json({ message: "Only owners can create other owners" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      res.json({ message: "Role updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.delete('/api/admin/delete-user', isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Prevent admin from deleting themselves
      if (req.user && req.user.id === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      // Get the target user to check their role
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent admins from deleting other admins or owners
      if (req.user.role === 'admin' && (targetUser.role === 'admin' || targetUser.role === 'owner')) {
        return res.status(403).json({ message: "Admins cannot delete other admin or owner accounts" });
      }

      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Owner self-coin editing route
  app.post("/api/owner/update-coins", isOwner, async (req: any, res) => {
    try {
      const { userId, amount, reason } = req.body;
      
      // Validate that owner is editing their own account
      if (userId !== req.user.id) {
        return res.status(403).json({ error: "Owners can only edit their own coins using this endpoint" });
      }

      if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({ error: "Invalid amount provided" });
      }

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ error: "Reason is required for coin updates" });
      }

      const updatedUser = await storage.updateUserCoins(userId, amount, reason);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating owner coins:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Owner routes (only for owner role)
  app.get("/api/owner/admins", isAuthenticated, isOwner, async (req: any, res) => {
    try {
      const admins = await storage.getAdminUsers();
      res.json(admins);
    } catch (error) {
      console.error("Error getting admin users:", error);
      res.status(500).json({ message: "Failed to get admin users" });
    }
  });

  // Generate redeem code (owner only)
  app.post("/api/owner/generate-code", isAuthenticated, isOwner, async (req: any, res) => {
    try {
      const { amount, usageLimit } = req.body;
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      if (!usageLimit || isNaN(parseInt(usageLimit)) || parseInt(usageLimit) <= 0) {
        return res.status(400).json({ message: "Valid usage limit is required" });
      }

      // Generate 6 character alphanumeric code
      function generateCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      }

      // Ensure code is unique
      let code = generateCode();
      let existingCode = await storage.getRedeemCode(code);
      while (existingCode) {
        code = generateCode();
        existingCode = await storage.getRedeemCode(code);
      }

      const redeemCode = await storage.createRedeemCode({
        code,
        amount: parseFloat(amount).toFixed(2),
        usageLimit: parseInt(usageLimit),
        createdBy: req.user.id,
      });

      res.json({ message: "Code generated successfully", code: redeemCode });
    } catch (error) {
      console.error("Error generating code:", error);
      res.status(500).json({ message: "Failed to generate code" });
    }
  });

  // Get all redeem codes with redemption details (owner only)
  app.get("/api/owner/codes", isAuthenticated, isOwner, async (req: any, res) => {
    try {
      const codes = await storage.getAllRedeemCodesWithRedemptions();
      res.json(codes);
    } catch (error) {
      console.error("Error getting codes:", error);
      res.status(500).json({ message: "Failed to get codes" });
    }
  });

  app.post("/api/owner/remove-admin", isAuthenticated, isOwner, async (req: any, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const updatedUser = await storage.removeAdminRole(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error removing admin role:", error);
      res.status(500).json({ message: "Failed to remove admin role" });
    }
  });

  app.post("/api/owner/promote-admin", isAuthenticated, isOwner, async (req: any, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const updatedUser = await storage.promoteToAdmin(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error promoting to admin:", error);
      res.status(500).json({ message: "Failed to promote to admin" });
    }
  });

  // Owner-only route: Ban user
  app.post('/api/owner/ban-user', isAuthenticated, isOwner, async (req: any, res) => {
    try {
      const { userId, reason } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const updatedUser = await storage.banUser(userId, reason || "No reason provided");
      res.json(updatedUser);
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ message: "Failed to ban user" });
    }
  });

  // Owner-only route: Unban user
  app.post('/api/owner/unban-user', isAuthenticated, isOwner, async (req: any, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const updatedUser = await storage.unbanUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ message: "Failed to unban user" });
    }
  });

  // Owner-only route: Update user coins
  app.post('/api/owner/update-coins', isAuthenticated, isOwner, async (req: any, res) => {
    try {
      const { userId, amount, reason } = req.body;
      
      if (!userId || !amount) {
        return res.status(400).json({ message: "User ID and amount are required" });
      }

      const updatedUser = await storage.updateUserCoins(userId, amount, reason || "Owner adjustment");
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user coins:", error);
      res.status(500).json({ message: "Failed to update user coins" });
    }
  });

  // Redeem code route (for all authenticated users)
  app.post('/api/redeem', isAuthenticated, async (req: any, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Code is required" });
      }

      const result = await storage.redeemCode(code.toUpperCase(), req.user.id);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error redeeming code:", error);
      res.status(500).json({ message: "Failed to redeem code" });
    }
  });

  // Trading routes
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/trades/send', isAuthenticated, async (req: any, res) => {
    try {
      const { recipientUsername, amount, message } = req.body;
      
      if (!recipientUsername || !amount) {
        return res.status(400).json({ message: "Recipient username and amount are required" });
      }

      // Find recipient user
      const recipient = await storage.getUserByUsername(recipientUsername);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient user not found" });
      }

      // Prevent sending to yourself
      if (recipient.id === req.user.id) {
        return res.status(400).json({ message: "Cannot send trade to yourself" });
      }

      // Validate amount
      const tradeAmount = parseFloat(amount);
      if (isNaN(tradeAmount) || tradeAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Balance check will be done in storage.createTrade()

      // Create trade
      const trade = await storage.createTrade({
        senderUserId: req.user.id,
        receiverUserId: recipient.id,
        amount: amount,
        message: message || null,
        status: "pending"
      });

      res.json({ message: "Trade sent successfully", trade });
    } catch (error) {
      console.error("Error sending trade:", error);
      res.status(500).json({ message: "Failed to send trade" });
    }
  });

  app.get('/api/trades/sent', isAuthenticated, async (req: any, res) => {
    try {
      const trades = await storage.getUserTrades(req.user.id);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching sent trades:", error);
      res.status(500).json({ message: "Failed to fetch sent trades" });
    }
  });

  app.get('/api/trades/received', isAuthenticated, async (req: any, res) => {
    try {
      const trades = await storage.getPendingTrades(req.user.id);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching received trades:", error);
      res.status(500).json({ message: "Failed to fetch received trades" });
    }
  });

  app.post('/api/trades/:id/accept', isAuthenticated, async (req: any, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      if (isNaN(tradeId)) {
        return res.status(400).json({ message: "Invalid trade ID" });
      }

      await storage.acceptTrade(tradeId);
      res.json({ message: "Trade accepted successfully" });
    } catch (error) {
      console.error("Error accepting trade:", error);
      res.status(500).json({ message: "Failed to accept trade" });
    }
  });

  app.post('/api/trades/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      if (isNaN(tradeId)) {
        return res.status(400).json({ message: "Invalid trade ID" });
      }

      await storage.cancelTrade(tradeId);
      res.json({ message: "Trade cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling trade:", error);
      res.status(500).json({ message: "Failed to cancel trade" });
    }
  });

  // Price history routes
  app.get("/api/price-history", async (req, res) => {
    try {
      await storage.initializePriceHistory();
      const hours = parseInt(req.query.hours as string) || 24;
      const history = await storage.getPriceHistory(hours);
      res.json(history);
    } catch (error) {
      console.error("Error fetching price history:", error);
      res.status(500).json({ message: "Failed to fetch price history" });
    }
  });

  app.get("/api/latest-price", async (req, res) => {
    try {
      await storage.initializePriceHistory();
      const price = await storage.getLatestPrice();
      res.json(price);
    } catch (error) {
      console.error("Error fetching latest price:", error);
      res.status(500).json({ message: "Failed to fetch latest price" });
    }
  });

  // Simulate price fluctuations (for demonstration)
  app.post("/api/simulate-price", isAuthenticated, isOwner, async (req: any, res) => {
    try {
      const latestPrice = await storage.getLatestPrice();
      const currentPrice = parseFloat(latestPrice?.price || "1.0000");
      
      // Random price fluctuation between -5% to +5%
      const changePercent = (Math.random() - 0.5) * 10; // -5 to +5
      const newPrice = currentPrice * (1 + changePercent / 100);
      const volume = Math.random() * 1000000; // Random volume
      
      const pricePoint = await storage.addPricePoint({
        price: newPrice.toFixed(4),
        volume: volume.toFixed(2),
        changePercent: changePercent.toFixed(2)
      });
      
      res.json(pricePoint);
    } catch (error) {
      console.error("Error simulating price:", error);
      res.status(500).json({ message: "Failed to simulate price" });
    }
  });

  // Game endpoints
  app.post("/api/games/play", isAuthenticated, async (req: any, res) => {
    try {
      const { gameType, betAmount, gameData } = req.body;
      const userId = req.user.id;
      
      const bet = parseFloat(betAmount);
      
      if (bet <= 0) {
        return res.status(400).json({ error: "Invalid bet amount" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const userBalance = parseFloat(user.pCoinBalance || "0");
      if (userBalance < bet) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // Process game logic based on game type
      let gameResult: any = {};
      
      switch (gameType) {
        case 'plinko':
          gameResult = processPlinkoGame(bet, gameData);
          break;
        case 'cups':
          gameResult = processCupsGame(bet, gameData);
          break;
        case 'roulette':
          gameResult = processRouletteGame(bet, gameData);
          break;
        case 'slide':
          gameResult = processSlideGame(bet, gameData);
          break;
        case 'jackpot':
          gameResult = processJackpotGame(bet, gameData);
          break;
        default:
          return res.status(400).json({ error: "Unknown game type" });
      }
      
      const winAmount = gameResult.winAmount || 0;
      const result = winAmount > 0 ? 'win' : 'loss';
      const balanceChange = winAmount - bet;
      const newBalance = (userBalance + balanceChange).toFixed(2);
      
      await storage.updateUserBalance(userId, newBalance);
      
      await storage.createGameSession({
        userId,
        gameType,
        betAmount: bet.toString(),
        winAmount: winAmount.toString(),
        gameData,
        result
      });
      
      await storage.addTransaction({
        userId,
        amount: Math.abs(balanceChange).toFixed(2),
        type: result === 'win' ? 'game_win' : 'game_loss',
        description: `${gameType} game - ${result}`
      });
      
      res.json({ 
        success: true, 
        newBalance,
        winAmount,
        result,
        ...gameResult
      });
    } catch (error: any) {
      console.error("Error playing game:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/games/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getGameStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching game stats:", error);
      res.status(500).json({ error: "Failed to fetch game stats" });
    }
  });

  app.get("/api/games/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const games = await storage.getRecentGames(userId, 10);
      res.json(games);
    } catch (error) {
      console.error("Error fetching recent games:", error);
      res.status(500).json({ error: "Failed to fetch recent games" });
    }
  });

  // Create the Karina banner shop item
  try {
    const existingItems = await storage.getShopItems();
    const karinaBannerExists = existingItems.some(item => item.name === "Karina Banner");
    
    if (!karinaBannerExists) {
      await storage.createShopItem({
        name: "Karina Banner",
        description: "Exclusive Karina profile banner - show your style!",
        price: "250.00",
        type: "banner",
        imageUrl: "@assets/2c18f8c8a2d9fd775a2ff7bf024c4695_1752662254140.jpg",
        isActive: true
      });
      console.log("Karina Banner shop item created successfully");
    }
  } catch (error) {
    console.error("Error creating Karina Banner shop item:", error);
  }

  // Shop routes
  app.get("/api/shop/items", async (req, res) => {
    try {
      const items = await storage.getShopItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching shop items:", error);
      res.status(500).json({ message: "Failed to fetch shop items" });
    }
  });

  app.post("/api/shop/purchase", isAuthenticated, async (req: any, res) => {
    try {
      const { itemId } = req.body;
      const userId = req.user.id;
      
      const result = await storage.purchaseItem(userId, itemId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error purchasing item:", error);
      res.status(500).json({ message: "Failed to purchase item" });
    }
  });

  app.get("/api/shop/purchases", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const purchases = await storage.getUserPurchases(userId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching user purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  // Profile routes
  app.post("/api/profile/update-image", isAuthenticated, async (req: any, res) => {
    try {
      const { imageUrl } = req.body;
      const userId = req.user.id;
      
      const user = await storage.updateUserProfileImage(userId, imageUrl);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile image:", error);
      res.status(500).json({ message: "Failed to update profile image" });
    }
  });

  app.get("/api/profile/banners", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const banners = await storage.getUserBanners(userId);
      res.json(banners);
    } catch (error) {
      console.error("Error fetching user banners:", error);
      res.status(500).json({ message: "Failed to fetch banners" });
    }
  });

  app.post("/api/profile/set-banner", isAuthenticated, async (req: any, res) => {
    try {
      const { bannerUrl } = req.body;
      const userId = req.user.id;
      
      const banner = await storage.setActiveBanner(userId, bannerUrl);
      res.json(banner);
    } catch (error) {
      console.error("Error setting active banner:", error);
      res.status(500).json({ message: "Failed to set active banner" });
    }
  });

  // Game ban admin routes
  app.post("/api/admin/ban-game", isAdmin, async (req: any, res) => {
    try {
      const { userId, gameType, reason } = req.body;
      const bannedBy = req.user.id;
      
      const ban = await storage.banUserFromGame(userId, gameType, reason, bannedBy);
      res.json(ban);
    } catch (error) {
      console.error("Error banning user from game:", error);
      res.status(500).json({ message: "Failed to ban user from game" });
    }
  });

  app.post("/api/admin/unban-game", isAdmin, async (req: any, res) => {
    try {
      const { userId, gameType } = req.body;
      
      await storage.unbanUserFromGame(userId, gameType);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unbanning user from game:", error);
      res.status(500).json({ message: "Failed to unban user from game" });
    }
  });

  app.get("/api/admin/game-bans", isAdmin, async (req, res) => {
    try {
      const bans = await storage.getAllGameBans();
      res.json(bans);
    } catch (error) {
      console.error("Error fetching game bans:", error);
      res.status(500).json({ message: "Failed to fetch game bans" });
    }
  });

  // Enhanced owner coin editing - allow editing coins for all users including admins and owner
  app.post("/api/owner/edit-coins", isOwner, async (req: any, res) => {
    try {
      const { userId, amount, reason } = req.body;
      
      const user = await storage.updateUserCoins(userId, amount, reason || "Owner coin adjustment");
      res.json(user);
    } catch (error: any) {
      console.error("Error updating user coins:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Owner coin reset
  app.post("/api/owner/reset-coins/:userId", isOwner, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const updatedUser = await storage.resetUserCoins(userId);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error resetting coins:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // VIP management routes
  app.post("/api/admin/set-vip/:userId", isAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { isVip, durationDays } = req.body;
      const updatedUser = await storage.setUserVip(userId, isVip, durationDays);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error setting VIP status:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Chat routes
  app.get("/api/chat/messages/:type", isAuthenticated, async (req: any, res) => {
    try {
      const { type } = req.params;
      const isVipChat = type === 'vip';
      
      // Check VIP access for VIP chat
      if (isVipChat && !req.user.isVip && req.user.role !== 'admin' && req.user.role !== 'owner') {
        return res.status(403).json({ error: "VIP access required for premium chat" });
      }
      
      const messages = await storage.getChatMessages(isVipChat, 50);
      res.json(messages);
    } catch (error: any) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chat/send", isAuthenticated, async (req: any, res) => {
    try {
      const { message, isVipChat } = req.body;
      const userId = req.user.id;
      
      // Check VIP access for VIP chat
      if (isVipChat && !req.user.isVip && req.user.role !== 'admin' && req.user.role !== 'owner') {
        return res.status(403).json({ error: "VIP access required for premium chat" });
      }
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: "Message cannot be empty" });
      }
      
      if (message.length > 500) {
        return res.status(400).json({ error: "Message too long" });
      }
      
      const chatMessage = await storage.sendChatMessage(userId, message.trim(), isVipChat);
      res.json(chatMessage);
    } catch (error: any) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/chat/delete/:messageId", isAdmin, async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      await storage.deleteChatMessage(messageId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting chat message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Inventory routes
  app.get("/api/inventory", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const inventory = await storage.getUserInventory(userId);
      res.json(inventory);
    } catch (error: any) {
      console.error("Error getting inventory:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Leaderboard routes
  app.get("/api/leaderboard", async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error: any) {
      console.error("Error getting leaderboard:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Banner trading routes
  app.get("/api/banner-trades", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const trades = await storage.getUserBannerTrades(userId);
      res.json(trades);
    } catch (error: any) {
      console.error("Error getting banner trades:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/banner-trades", isAuthenticated, async (req: any, res) => {
    try {
      const { toUserId, fromItemId, toItemId, fromQuantity, toQuantity } = req.body;
      const fromUserId = req.user.id;

      if (!toUserId || !fromItemId || !toItemId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const trade = await storage.createBannerTrade({
        fromUserId,
        toUserId,
        fromItemId,
        toItemId,
        fromQuantity: fromQuantity || 1,
        toQuantity: toQuantity || 1,
      });

      res.json(trade);
    } catch (error: any) {
      console.error("Error creating banner trade:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/banner-trades/:tradeId/accept", isAuthenticated, async (req: any, res) => {
    try {
      const tradeId = parseInt(req.params.tradeId);
      const userId = req.user.id;

      await storage.acceptBannerTrade(tradeId, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error accepting banner trade:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/banner-trades/:tradeId/cancel", isAuthenticated, async (req: any, res) => {
    try {
      const tradeId = parseInt(req.params.tradeId);
      const userId = req.user.id;

      await storage.cancelBannerTrade(tradeId, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error cancelling banner trade:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/banner-trades/all", isAdmin, async (req: any, res) => {
    try {
      const trades = await storage.getAllBannerTrades();
      res.json(trades);
    } catch (error: any) {
      console.error("Error getting all banner trades:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Trade chat routes
  app.get("/api/trade-chat/:tradeId", isAuthenticated, async (req: any, res) => {
    try {
      const tradeId = parseInt(req.params.tradeId);
      const messages = await storage.getTradeMessages(tradeId);
      res.json(messages);
    } catch (error: any) {
      console.error("Error getting trade messages:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/trade-chat/:tradeId/send", isAuthenticated, async (req: any, res) => {
    try {
      const tradeId = parseInt(req.params.tradeId);
      const { message } = req.body;
      const userId = req.user.id;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: "Message cannot be empty" });
      }

      if (message.length > 500) {
        return res.status(400).json({ error: "Message too long" });
      }

      const chatMessage = await storage.sendTradeMessage(tradeId, userId, message.trim());
      res.json(chatMessage);
    } catch (error: any) {
      console.error("Error sending trade message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/trade-chat/:messageId", isAdmin, async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      await storage.deleteTradeMessage(messageId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting trade message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Bank routes - NAPASSIST Bank
  app.get("/api/bank/account", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let account = await storage.getBankAccount(userId);
      
      if (!account) {
        account = await storage.createBankAccount(userId);
      }

      // Calculate interest on every request
      account = await storage.calculateInterest(userId);
      
      res.json(account);
    } catch (error: any) {
      console.error("Error getting bank account:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bank/deposit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { amount } = req.body;
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Invalid deposit amount" });
      }

      const account = await storage.deposit(userId, amount);
      res.json(account);
    } catch (error: any) {
      console.error("Error depositing to bank:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bank/withdraw", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { amount } = req.body;
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Invalid withdrawal amount" });
      }

      const account = await storage.withdraw(userId, amount);
      res.json(account);
    } catch (error: any) {
      console.error("Error withdrawing from bank:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bank/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const transactions = await storage.getBankTransactions(userId, limit);
      res.json(transactions);
    } catch (error: any) {
      console.error("Error getting bank transactions:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bank/all-accounts", isAdmin, async (req: any, res) => {
    try {
      const accounts = await storage.getAllBankAccounts();
      res.json(accounts);
    } catch (error: any) {
      console.error("Error getting all bank accounts:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add price update every minute with dynamic changes
  setInterval(async () => {
    try {
      const currentPrice = await storage.getLatestPrice();
      const basePrice = currentPrice ? parseFloat(currentPrice.price) : 1.0;
      
      // 75% chance increase, 25% chance decrease for realistic trading
      const direction = Math.random() < 0.75 ? 1 : -1;
      const changePercent = Math.random() * 0.12; // 0% to 12% change
      const newPrice = Math.max(0.1, basePrice * (1 + (direction * changePercent)));
      
      await storage.addPricePoint({
        price: newPrice.toFixed(4),
      });
      
      console.log(`💰 Price updated: ${basePrice.toFixed(4)} -> ${newPrice.toFixed(4)} (${direction > 0 ? '+' : ''}${(direction * changePercent * 100).toFixed(2)}%)`);
    } catch (error) {
      console.error('Error updating price:', error);
    }
  }, 60000); // Every minute

  // Ticket system routes
  app.get("/api/tickets", isAuthenticated, async (req: any, res) => {
    try {
      const tickets = await storage.getUserTickets(req.user.id);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.post("/api/tickets", isAuthenticated, async (req: any, res) => {
    try {
      const { title, description, category, priority } = req.body;
      
      if (!title || !description || !category) {
        return res.status(400).json({ message: "Title, description, and category are required" });
      }

      const ticket = await storage.createTicket({
        userId: req.user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        priority: priority || "normal"
      });
      
      res.json(ticket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  app.get("/api/tickets/:ticketId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const messages = await storage.getTicketMessages(ticketId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching ticket messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/tickets/:ticketId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const { message } = req.body;
      
      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }

      const ticketMessage = await storage.addTicketMessage({
        ticketId,
        userId: req.user.id,
        message: message.trim(),
        isStaff: req.user.role === 'admin' || req.user.role === 'owner'
      });
      
      res.json(ticketMessage);
    } catch (error) {
      console.error("Error adding ticket message:", error);
      res.status(500).json({ message: "Failed to add message" });
    }
  });

  // Admin ticket management
  app.get("/api/admin/tickets", isAdmin, async (req: any, res) => {
    try {
      const tickets = await storage.getAllTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching all tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.put("/api/admin/tickets/:ticketId/status", isAdmin, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const { status, assignedTo } = req.body;
      
      const ticket = await storage.updateTicketStatus(ticketId, status, assignedTo);
      res.json(ticket);
    } catch (error) {
      console.error("Error updating ticket status:", error);
      res.status(500).json({ message: "Failed to update ticket status" });
    }
  });

  // Profile image update route  
  app.post("/api/profile/update-image", isAuthenticated, async (req: any, res) => {
    try {
      const { imageUrl } = req.body;
      const user = await storage.updateUserProfileImage(req.user.id, imageUrl);
      res.json(user);
    } catch (error) {
      console.error("Profile image update error:", error);
      res.status(500).json({ error: "Failed to update profile image" });
    }
  });

  // Delete ticket route
  app.delete("/api/tickets/:ticketId", isAuthenticated, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      await storage.deleteTicket(ticketId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting ticket:", error);
      res.status(500).json({ error: "Failed to delete ticket" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
