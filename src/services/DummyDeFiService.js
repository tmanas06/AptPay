// Dummy DeFi Service - Simulates all trading, AMM, and hedging functionality
// Works completely offline with realistic dummy data

class DummyDeFiService {
  constructor() {
    console.log('DummyDeFiService constructor called');
    
    this.positions = new Map();
    this.orders = new Map();
    this.liquidityPositions = new Map();
    this.hedgePositions = new Map();
    this.marketData = new Map();
    this.userBalance = {
      APT: 100, // Starting with 100 APT
      USDC: 1000, // Starting with 1000 USDC
      USDT: 1000, // Starting with 1000 USDT
    };
    this.positionIdCounter = 1;
    this.orderIdCounter = 1;
    this.liquidityIdCounter = 1;
    this.hedgeIdCounter = 1;
    
    console.log('DummyDeFiService initialized with balance:', this.userBalance);
    
    // Initialize market data
    this.initializeMarketData();
    
    // Start price simulation
    this.startPriceSimulation();
    
    // Create a sample position for testing
    this.createSamplePosition();
    
    console.log('DummyDeFiService setup complete');
  }

  // Initialize realistic market data
  initializeMarketData() {
    console.log('Initializing market data...');
    
    this.marketData.set('APT/USDC', {
      symbol: 'APT/USDC',
      price: 8.45,
      change24h: 2.34,
      volume24h: 1250000,
      high24h: 8.67,
      low24h: 8.23,
      marketCap: 3500000000,
      lastUpdate: Date.now()
    });

    this.marketData.set('BTC/USDC', {
      symbol: 'BTC/USDC',
      price: 45000,
      change24h: -1.23,
      volume24h: 890000000,
      high24h: 46200,
      low24h: 44100,
      marketCap: 870000000000,
      lastUpdate: Date.now()
    });

    this.marketData.set('ETH/USDC', {
      symbol: 'ETH/USDC',
      price: 2650,
      change24h: -0.87,
      volume24h: 345000000,
      high24h: 2720,
      low24h: 2580,
      marketCap: 320000000000,
      lastUpdate: Date.now()
    });
    
    console.log('Market data initialized:', Array.from(this.marketData.keys()));
  }

  // Simulate realistic price movements
  startPriceSimulation() {
    setInterval(() => {
      this.updateMarketPrices();
    }, 5000); // Update every 5 seconds
  }

  // Create a sample position for testing
  createSamplePosition() {
    try {
      console.log('Creating sample position...');
      const samplePosition = {
        id: this.positionIdCounter++,
        symbol: 'APT/USDC',
        positionType: 'LONG',
        amount: 50,
        leverage: 5,
        entryPrice: 8.45,
        currentPrice: 8.45,
        margin: 84.5,
        pnl: 0,
        pnlPercentage: 0,
        status: 'OPEN',
        timestamp: Date.now(),
        unrealizedPnL: 0
      };
      
      this.positions.set(samplePosition.id, samplePosition);
      console.log('Sample position created:', samplePosition);
    } catch (error) {
      console.error('Error creating sample position:', error);
    }
  }

  updateMarketPrices() {
    this.marketData.forEach((data, symbol) => {
      // Generate realistic price movements (-2% to +2%)
      const volatility = (Math.random() - 0.5) * 0.04; // ±2%
      const newPrice = data.price * (1 + volatility);
      
      data.price = Math.max(newPrice, data.price * 0.98); // Prevent crashes
      data.lastUpdate = Date.now();
      
      // Update 24h change
      data.change24h = (Math.random() - 0.5) * 10; // ±5% 24h change
    });
  }

  // ===== TRADING FUNCTIONS =====

  // Open a leveraged position (Long/Short)
  openPosition(symbol, positionType, amount, leverage = 10, margin = null) {
    console.log('DummyDeFiService.openPosition() called with:', {
      symbol, positionType, amount, leverage, margin
    });
    
    const marketData = this.marketData.get(symbol);
    if (!marketData) {
      console.error(`Market ${symbol} not found`);
      throw new Error(`Market ${symbol} not found`);
    }

    const positionId = this.positionIdCounter++;
    const entryPrice = marketData.price;
    const marginAmount = margin || (amount * entryPrice / leverage);
    
    console.log('Position details:', {
      positionId, entryPrice, marginAmount, userBalance: this.userBalance.USDC
    });
    
    // Check if user has enough balance
    const requiredBalance = marginAmount;
    if (this.userBalance.USDC < requiredBalance) {
      console.error('Insufficient balance:', {
        required: requiredBalance,
        available: this.userBalance.USDC
      });
      throw new Error('Insufficient balance for margin');
    }

    // Deduct margin from balance
    this.userBalance.USDC -= marginAmount;

    const position = {
      id: positionId,
      symbol,
      positionType, // 'LONG' or 'SHORT'
      amount,
      leverage,
      entryPrice,
      currentPrice: entryPrice,
      margin: marginAmount,
      pnl: 0,
      pnlPercentage: 0,
      status: 'OPEN',
      timestamp: Date.now(),
      unrealizedPnL: 0
    };

    this.positions.set(positionId, position);
    this.updatePositionPnL(positionId);
    
    console.log('Position created successfully:', position);
    
    return {
      success: true,
      positionId,
      transactionHash: this.generateTxHash(),
      message: `${positionType} position opened successfully`
    };
  }

  // Close a position
  closePosition(positionId) {
    const position = this.positions.get(positionId);
    if (!position) {
      throw new Error('Position not found');
    }

    if (position.status !== 'OPEN') {
      throw new Error('Position is not open');
    }

    // Calculate final PnL
    this.updatePositionPnL(positionId);
    const finalPnL = position.pnl;

    // Add PnL to balance
    this.userBalance.USDC += position.margin + finalPnL;

    // Close position
    position.status = 'CLOSED';
    position.closePrice = position.currentPrice;
    position.closeTime = Date.now();

    return {
      success: true,
      positionId,
      pnl: finalPnL,
      transactionHash: this.generateTxHash(),
      message: `Position closed with PnL: $${finalPnL.toFixed(2)}`
    };
  }

  // Update position PnL
  updatePositionPnL(positionId) {
    const position = this.positions.get(positionId);
    if (!position || position.status !== 'OPEN') return;

    const marketData = this.marketData.get(position.symbol);
    position.currentPrice = marketData.price;

    let priceChange;
    if (position.positionType === 'LONG') {
      priceChange = position.currentPrice - position.entryPrice;
    } else { // SHORT
      priceChange = position.entryPrice - position.currentPrice;
    }

    position.unrealizedPnL = (priceChange * position.amount * position.leverage);
    position.pnl = position.unrealizedPnL;
    position.pnlPercentage = (position.pnl / position.margin) * 100;
  }

  // Get all positions
  getPositions() {
    console.log('DummyDeFiService.getPositions() called');
    console.log('Current positions count:', this.positions.size);
    this.positions.forEach((position, id) => {
      this.updatePositionPnL(id);
    });
    const positions = Array.from(this.positions.values());
    console.log('Returning positions:', positions);
    return positions;
  }

  // Get open positions only
  getOpenPositions() {
    return this.getPositions().filter(p => p.status === 'OPEN');
  }

  // ===== ORDER FUNCTIONS =====

  // Place a market order
  placeMarketOrder(symbol, amount, direction) {
    const marketData = this.marketData.get(symbol);
    if (!marketData) {
      throw new Error(`Market ${symbol} not found`);
    }

    const orderId = this.orderIdCounter++;
    const price = marketData.price;
    const totalCost = amount * price;

    // Check balance
    if (direction === 'BUY' && this.userBalance.USDC < totalCost) {
      throw new Error('Insufficient USDC balance');
    }

    if (direction === 'SELL' && this.userBalance.APT < amount) {
      throw new Error('Insufficient APT balance');
    }

    // Update balances
    if (direction === 'BUY') {
      this.userBalance.USDC -= totalCost;
      this.userBalance.APT += amount;
    } else {
      this.userBalance.APT -= amount;
      this.userBalance.USDC += totalCost;
    }

    const order = {
      id: orderId,
      symbol,
      amount,
      direction,
      price,
      type: 'MARKET',
      status: 'FILLED',
      timestamp: Date.now(),
      filledAt: Date.now()
    };

    this.orders.set(orderId, order);

    return {
      success: true,
      orderId,
      transactionHash: this.generateTxHash(),
      message: `Market ${direction} order executed at $${price.toFixed(2)}`
    };
  }

  // Place a limit order
  placeLimitOrder(symbol, amount, price, direction) {
    const orderId = this.orderIdCounter++;
    
    const order = {
      id: orderId,
      symbol,
      amount,
      price,
      direction,
      type: 'LIMIT',
      status: 'OPEN',
      timestamp: Date.now(),
      filledAt: null
    };

    this.orders.set(orderId, order);

    // Simulate order matching (simplified)
    setTimeout(() => {
      this.simulateOrderMatching(orderId);
    }, Math.random() * 30000 + 10000); // 10-40 seconds

    return {
      success: true,
      orderId,
      message: `Limit ${direction} order placed at $${price.toFixed(2)}`
    };
  }

  // Simulate order matching
  simulateOrderMatching(orderId) {
    const order = this.orders.get(orderId);
    if (!order || order.status !== 'OPEN') return;

    const marketData = this.marketData.get(order.symbol);
    let shouldFill = false;

    if (order.direction === 'BUY' && marketData.price <= order.price) {
      shouldFill = true;
    } else if (order.direction === 'SELL' && marketData.price >= order.price) {
      shouldFill = true;
    }

    if (shouldFill) {
      order.status = 'FILLED';
      order.filledAt = Date.now();
      order.filledPrice = marketData.price;

      // Update balances
      const totalCost = order.amount * order.filledPrice;
      if (order.direction === 'BUY') {
        this.userBalance.USDC -= totalCost;
        this.userBalance.APT += order.amount;
      } else {
        this.userBalance.APT -= order.amount;
        this.userBalance.USDC += totalCost;
      }
    }
  }

  // Cancel an order
  cancelOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'OPEN') {
      throw new Error('Order cannot be cancelled');
    }

    order.status = 'CANCELLED';
    order.cancelledAt = Date.now();

    return {
      success: true,
      orderId,
      message: 'Order cancelled successfully'
    };
  }

  // Get orders
  getOrders() {
    return Array.from(this.orders.values());
  }

  // Get open orders
  getOpenOrders() {
    return this.getOrders().filter(o => o.status === 'OPEN');
  }

  // ===== AMM FUNCTIONS =====

  // Create a liquidity pool
  createPool(tokenA, tokenB, amountA, amountB) {
    const poolId = this.liquidityIdCounter++;
    const poolKey = `${tokenA}/${tokenB}`;
    
    // Check balances
    if (this.userBalance[tokenA] < amountA || this.userBalance[tokenB] < amountB) {
      throw new Error('Insufficient balance for liquidity');
    }

    // Deduct from balances
    this.userBalance[tokenA] -= amountA;
    this.userBalance[tokenB] -= amountB;

    const pool = {
      id: poolId,
      tokenA,
      tokenB,
      amountA,
      amountB,
      totalLiquidity: Math.sqrt(amountA * amountB),
      fee: 0.003, // 0.3% fee
      volume24h: 0,
      createdAt: Date.now()
    };

    this.liquidityPositions.set(poolId, pool);

    return {
      success: true,
      poolId,
      transactionHash: this.generateTxHash(),
      message: `Liquidity pool ${poolKey} created successfully`
    };
  }

  // Add liquidity to existing pool
  addLiquidity(poolId, amountA, amountB) {
    const pool = this.liquidityPositions.get(poolId);
    if (!pool) {
      throw new Error('Pool not found');
    }

    // Check balances
    if (this.userBalance[pool.tokenA] < amountA || this.userBalance[pool.tokenB] < amountB) {
      throw new Error('Insufficient balance');
    }

    // Update balances
    this.userBalance[pool.tokenA] -= amountA;
    this.userBalance[pool.tokenB] -= amountB;

    // Update pool
    pool.amountA += amountA;
    pool.amountB += amountB;
    pool.totalLiquidity = Math.sqrt(pool.amountA * pool.amountB);

    return {
      success: true,
      poolId,
      transactionHash: this.generateTxHash(),
      message: 'Liquidity added successfully'
    };
  }

  // Swap tokens
  swapTokens(tokenIn, tokenOut, amountIn) {
    // Find relevant pool
    const pool = Array.from(this.liquidityPositions.values())
      .find(p => (p.tokenA === tokenIn && p.tokenB === tokenOut) || 
                 (p.tokenA === tokenOut && p.tokenB === tokenIn));

    if (!pool) {
      throw new Error('No liquidity pool found for this pair');
    }

    // Check balance
    if (this.userBalance[tokenIn] < amountIn) {
      throw new Error(`Insufficient ${tokenIn} balance`);
    }

    // Calculate swap amount (simplified AMM formula)
    const isReverse = pool.tokenA === tokenOut;
    const reserveIn = isReverse ? pool.amountB : pool.amountA;
    const reserveOut = isReverse ? pool.amountA : pool.amountB;
    
    const amountOut = (amountIn * reserveOut) / (reserveIn + amountIn);
    const fee = amountOut * pool.fee;
    const finalAmountOut = amountOut - fee;

    // Update balances
    this.userBalance[tokenIn] -= amountIn;
    this.userBalance[tokenOut] += finalAmountOut;

    // Update pool
    if (isReverse) {
      pool.amountB += amountIn;
      pool.amountA -= finalAmountOut;
    } else {
      pool.amountA += amountIn;
      pool.amountB -= finalAmountOut;
    }

    return {
      success: true,
      amountIn,
      amountOut: finalAmountOut,
      price: finalAmountOut / amountIn,
      transactionHash: this.generateTxHash(),
      message: `Swapped ${amountIn} ${tokenIn} for ${finalAmountOut.toFixed(6)} ${tokenOut}`
    };
  }

  // Get liquidity pools
  getPools() {
    return Array.from(this.liquidityPositions.values());
  }

  // ===== HEDGING FUNCTIONS =====

  // Open hedge position
  openHedgePosition(underlyingAsset, hedgeType, amount, strikePrice, expiry) {
    const hedgeId = this.hedgeIdCounter++;
    
    const hedge = {
      id: hedgeId,
      underlyingAsset,
      hedgeType, // 'PUT', 'CALL', 'COLLAR', 'STRADDLE'
      amount,
      strikePrice,
      expiry,
      premium: this.calculatePremium(hedgeType, amount, strikePrice, expiry),
      status: 'ACTIVE',
      createdAt: Date.now(),
      currentValue: 0,
      pnl: 0
    };

    // Deduct premium from balance
    this.userBalance.USDC -= hedge.premium;

    this.hedgePositions.set(hedgeId, hedge);
    this.updateHedgePnL(hedgeId);

    return {
      success: true,
      hedgeId,
      premium: hedge.premium,
      transactionHash: this.generateTxHash(),
      message: `${hedgeType} hedge position opened for $${hedge.premium.toFixed(2)} premium`
    };
  }

  // Calculate premium for hedging
  calculatePremium(hedgeType, amount, strikePrice, expiry) {
    const timeValue = Math.max(0, (expiry - Date.now()) / (1000 * 60 * 60 * 24)); // Days
    const intrinsicValue = amount * 0.02; // 2% of notional
    const timeDecay = Math.max(0.1, timeValue / 30); // Minimum 10% of intrinsic
    
    return (intrinsicValue + timeDecay) * amount;
  }

  // Update hedge PnL
  updateHedgePnL(hedgeId) {
    const hedge = this.hedgePositions.get(hedgeId);
    if (!hedge || hedge.status !== 'ACTIVE') return;

    const marketData = this.marketData.get(hedge.underlyingAsset);
    const currentPrice = marketData.price;
    const timeToExpiry = Math.max(0, (hedge.expiry - Date.now()) / (1000 * 60 * 60 * 24));

    let value = 0;
    switch (hedge.hedgeType) {
      case 'PUT':
        value = Math.max(0, hedge.strikePrice - currentPrice) * hedge.amount;
        break;
      case 'CALL':
        value = Math.max(0, currentPrice - hedge.strikePrice) * hedge.amount;
        break;
      case 'STRADDLE':
        value = Math.abs(currentPrice - hedge.strikePrice) * hedge.amount;
        break;
      default:
        value = 0;
    }

    // Apply time decay
    const timeDecay = timeToExpiry / 30; // 30 days to expiry
    hedge.currentValue = value * Math.max(0.1, timeDecay);
    hedge.pnl = hedge.currentValue - hedge.premium;

    // Auto-expire if past expiry
    if (timeToExpiry <= 0) {
      hedge.status = 'EXPIRED';
      hedge.pnl = Math.max(0, hedge.currentValue) - hedge.premium;
    }
  }

  // Get hedge positions
  getHedgePositions() {
    this.hedgePositions.forEach((hedge, id) => {
      this.updateHedgePnL(id);
    });
    return Array.from(this.hedgePositions.values());
  }

  // Close hedge position
  closeHedgePosition(hedgeId) {
    const hedge = this.hedgePositions.get(hedgeId);
    if (!hedge) {
      throw new Error('Hedge position not found');
    }

    if (hedge.status !== 'ACTIVE') {
      throw new Error('Hedge position is not active');
    }

    this.updateHedgePnL(hedgeId);
    const finalPnL = hedge.pnl;

    // Add value to balance
    this.userBalance.USDC += hedge.currentValue;

    hedge.status = 'CLOSED';
    hedge.closedAt = Date.now();

    return {
      success: true,
      hedgeId,
      pnl: finalPnL,
      transactionHash: this.generateTxHash(),
      message: `Hedge position closed with PnL: $${finalPnL.toFixed(2)}`
    };
  }

  // ===== UTILITY FUNCTIONS =====

  // Get market data
  getMarketData(symbol) {
    return this.marketData.get(symbol);
  }

  // Get all market data
  getAllMarketData() {
    console.log('DummyDeFiService.getAllMarketData() called');
    const marketData = Array.from(this.marketData.values());
    console.log('Returning market data:', marketData);
    return marketData;
  }

  // Get user balance
  getBalance() {
    return { ...this.userBalance };
  }

  // Generate dummy transaction hash
  generateTxHash() {
    return '0x' + Math.random().toString(16).substr(2, 64);
  }

  // Get trading statistics
  getTradingStats() {
    const positions = this.getPositions();
    const orders = this.getOrders();
    const hedges = this.getHedgePositions();

    const totalPnL = positions.reduce((sum, p) => sum + (p.pnl || 0), 0);
    const openPositions = positions.filter(p => p.status === 'OPEN').length;
    const totalVolume = orders.reduce((sum, o) => sum + (o.amount * o.price), 0);

    return {
      totalPnL,
      openPositions,
      totalVolume,
      totalOrders: orders.length,
      activeHedges: hedges.filter(h => h.status === 'ACTIVE').length,
      portfolioValue: Object.values(this.userBalance).reduce((sum, val) => sum + val, 0)
    };
  }
}

// Export singleton instance
export default new DummyDeFiService();
