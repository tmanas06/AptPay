// For now, let's use a simplified approach that works with the existing wallet setup
class SmartContractService {
  constructor() {
    this.contractAddress = '0xa561992c5d672fc0d6eb59c2ccf8fe1b445a9229f023498b14521a8f9fa4dd9a'; // Will be updated after deployment
    this.account = null;
    this.client = null;
  }

  // Set the deployed contract address
  setContractAddress(address) {
    this.contractAddress = address;
    console.log('Contract address set to:', address);
  }

  // Set the user account for transactions
  setAccount(account) {
    this.account = account;
    // Import the wallet's client from the global context
    if (typeof window !== 'undefined' && window.aptosClient) {
      this.client = window.aptosClient;
    }
  }

  // Helper function to make contract calls
  async makeContractCall(
    moduleName,
    functionName,
    args = [],
    typeArgs = []
  ) {
    if (!this.account) {
      throw new Error('Account not set. Please connect wallet first.');
    }

    try {
      console.log(`Making contract call: ${moduleName}::${functionName}`);
      console.log('Args:', args);

      const payload = {
        type: 'entry_function_payload',
        function: `${this.contractAddress}::${moduleName}::${functionName}`,
        arguments: args,
        type_arguments: typeArgs,
      };

      const response = await this.account.signAndSubmitTransaction(payload);
      console.log('Transaction submitted:', response.hash);
      
      // Wait for transaction to complete
      await this.client.waitForTransaction({ transactionHash: response.hash });
      console.log('Transaction confirmed:', response.hash);
      
      return response;
    } catch (error) {
      console.error('Contract call failed:', error);
      throw error;
    }
  }

  // Helper function to view contract data
  async viewContractData(
    moduleName,
    functionName,
    args = [],
    typeArgs = []
  ) {
    try {
      console.log(`Viewing contract data: ${moduleName}::${functionName}`);
      
      const payload = {
        function: `${this.contractAddress}::${moduleName}::${functionName}`,
        arguments: args,
        type_arguments: typeArgs,
      };

      const response = await this.client.view({ payload });
      console.log('View response:', response);
      
      return response;
    } catch (error) {
      console.error('View call failed:', error);
      throw error;
    }
  }

  // ==================== TRADING CONTRACT FUNCTIONS ====================

  // Initialize trading module (admin only)
  async initializeTrading(adminAccount) {
    return await this.makeContractCall(
      'trading',
      'initialize',
      [],
      []
    );
  }

  // Open a trading position
  async openPosition(tradingPair, positionType, size, leverage, margin) {
    return await this.makeContractCall(
      'trading',
      'open_position',
      [
        tradingPair,
        positionType,
        size,
        leverage,
        margin
      ],
      []
    );
  }

  // Close a trading position
  async closePosition(positionId) {
    return await this.makeContractCall(
      'trading',
      'close_position',
      [positionId],
      []
    );
  }

  // Get position details
  async getPosition(positionId) {
    try {
      const response = await this.viewContractData(
        'trading',
        'get_position',
        [positionId],
        []
      );
      
      if (response && response.length >= 13) {
        return {
          id: response[0],
          owner: response[1],
          tradingPair: response[2],
          positionType: response[3],
          size: response[4],
          entryPrice: response[5],
          leverage: response[6],
          margin: response[7],
          timestamp: response[8],
          status: response[9],
          pnl: response[10],
          fundingFees: response[11],
          liquidationPrice: response[12],
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get position:', error);
      return null;
    }
  }

  // Get market data
  async getMarketData(tradingPair) {
    try {
      const response = await this.viewContractData(
        'trading',
        'get_market_data',
        [tradingPair],
        []
      );
      
      if (response && response.length >= 5) {
        return {
          tradingPair: response[0],
          currentPrice: response[1],
          lastUpdate: response[2],
          volume24h: response[3],
          priceChange24h: response[4],
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get market data:', error);
      return null;
    }
  }

  // Get trading stats
  async getTradingStats() {
    try {
      const response = await this.viewContractData(
        'trading',
        'get_trading_stats',
        [],
        []
      );
      
      if (response && response.length >= 4) {
        return {
          totalVolume: response[0],
          totalTrades: response[1],
          totalFees: response[2],
          openPositions: response[3],
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get trading stats:', error);
      return null;
    }
  }

  // Get user positions
  async getUserPositions(userAddress) {
    try {
      const response = await this.viewContractData(
        'trading',
        'get_user_positions',
        [userAddress],
        []
      );
      
      return response || [];
    } catch (error) {
      console.error('Failed to get user positions:', error);
      return [];
    }
  }

  // ==================== AMM CONTRACT FUNCTIONS ====================

  // Initialize AMM module (admin only)
  async initializeAMM(adminAccount) {
    return await this.makeContractCall(
      'amm',
      'initialize',
      [],
      []
    );
  }

  // Add liquidity to a pool
  async addLiquidity(poolId, amount0, amount1, minLiquidity) {
    return await this.makeContractCall(
      'amm',
      'add_liquidity',
      [
        poolId,
        amount0,
        amount1,
        minLiquidity
      ],
      []
    );
  }

  // Remove liquidity from a pool
  async removeLiquidity(positionId, liquidityAmount) {
    return await this.makeContractCall(
      'amm',
      'remove_liquidity',
      [positionId, liquidityAmount],
      []
    );
  }

  // Swap tokens
  async swapTokens(poolId, tokenIn, amountIn, minAmountOut, deadline) {
    const currentTime = Math.floor(Date.now() / 1000);
    const expiryTime = currentTime + (deadline || 300); // 5 minutes default
    
    return await this.makeContractCall(
      'amm',
      'swap_tokens',
      [
        poolId,
        tokenIn,
        amountIn,
        minAmountOut,
        expiryTime
      ],
      []
    );
  }

  // Get pool information
  async getPoolInfo(poolId) {
    try {
      const response = await this.viewContractData(
        'amm',
        'get_pool_info',
        [poolId],
        []
      );
      
      if (response && response.length >= 11) {
        return {
          id: response[0],
          token0: response[1],
          token1: response[2],
          reserve0: response[3],
          reserve1: response[4],
          totalSupply: response[5],
          feeRate: response[6],
          lastUpdate: response[7],
          volume24h: response[8],
          isActive: response[9],
          k: response[10],
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get pool info:', error);
      return null;
    }
  }

  // Get liquidity position
  async getPositionInfo(positionId) {
    try {
      const response = await this.viewContractData(
        'amm',
        'get_position_info',
        [positionId],
        []
      );
      
      if (response && response.length >= 8) {
        return {
          id: response[0],
          owner: response[1],
          poolId: response[2],
          liquidityTokens: response[3],
          token0Amount: response[4],
          token1Amount: response[5],
          feesEarned: response[6],
          timestamp: response[7],
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get position info:', error);
      return null;
    }
  }

  // Get swap quote
  async getSwapQuote(poolId, tokenIn, amountIn) {
    try {
      const response = await this.viewContractData(
        'amm',
        'get_swap_quote',
        [poolId, tokenIn, amountIn],
        []
      );
      
      if (response && response.length >= 3) {
        return {
          amountOut: response[0],
          fee: response[1],
          priceImpact: response[2],
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get swap quote:', error);
      return null;
    }
  }

  // Get user AMM positions
  async getUserAMMPositions(userAddress) {
    try {
      const response = await this.viewContractData(
        'amm',
        'get_user_positions',
        [userAddress],
        []
      );
      
      return response || [];
    } catch (error) {
      console.error('Failed to get user AMM positions:', error);
      return [];
    }
  }

  // Get AMM stats
  async getAMMStats() {
    try {
      const response = await this.viewContractData(
        'amm',
        'get_amm_stats',
        [],
        []
      );
      
      if (response && response.length >= 4) {
        return {
          totalVolume: response[0],
          totalFees: response[1],
          totalPools: response[2],
          totalSwaps: response[3],
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get AMM stats:', error);
      return null;
    }
  }

  // ==================== HEDGING CONTRACT FUNCTIONS ====================

  // Initialize hedging module (admin only)
  async initializeHedging(adminAccount) {
    return await this.makeContractCall(
      'hedging',
      'initialize',
      [],
      []
    );
  }

  // Create a hedge position
  async createHedge(strategyId, underlyingAsset, hedgeAmount, strikePrice, expiryDays, autoRenew) {
    return await this.makeContractCall(
      'hedging',
      'create_hedge',
      [
        strategyId,
        underlyingAsset,
        hedgeAmount,
        strikePrice,
        expiryDays,
        autoRenew
      ],
      []
    );
  }

  // Close a hedge position
  async closeHedge(positionId) {
    return await this.makeContractCall(
      'hedging',
      'close_hedge',
      [positionId],
      []
    );
  }

  // Get hedge position details
  async getHedgePosition(positionId) {
    try {
      const response = await this.viewContractData(
        'hedging',
        'get_hedge_position',
        [positionId],
        []
      );
      
      if (response && response.length >= 14) {
        return {
          id: response[0],
          owner: response[1],
          strategyId: response[2],
          underlyingAsset: response[3],
          hedgeAmount: response[4],
          strikePrice: response[5],
          expiryTimestamp: response[6],
          premiumPaid: response[7],
          collateralDeposited: response[8],
          status: response[9],
          pnl: response[10],
          createdAt: response[11],
          lastUpdated: response[12],
          autoRenew: response[13],
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get hedge position:', error);
      return null;
    }
  }

  // Get hedging strategy info
  async getHedgingStrategy(strategyId) {
    try {
      const response = await this.viewContractData(
        'hedging',
        'get_hedging_strategy',
        [strategyId],
        []
      );
      
      if (response && response.length >= 10) {
        return {
          id: response[0],
          name: response[1],
          description: response[2],
          riskLevel: response[3],
          minAmount: response[4],
          maxAmount: response[5],
          feeRate: response[6],
          isActive: response[7],
          expectedReturnMin: response[8],
          expectedReturnMax: response[9],
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get hedging strategy:', error);
      return null;
    }
  }

  // Get user hedge positions
  async getUserHedgePositions(userAddress) {
    try {
      const response = await this.viewContractData(
        'hedging',
        'get_user_hedge_positions',
        [userAddress],
        []
      );
      
      return response || [];
    } catch (error) {
      console.error('Failed to get user hedge positions:', error);
      return [];
    }
  }

  // Get risk metrics
  async getRiskMetrics(userAddress) {
    try {
      const response = await this.viewContractData(
        'hedging',
        'get_user_risk_metrics',
        [userAddress],
        []
      );
      
      if (response && response.length >= 11) {
        return {
          totalValue: response[0],
          hedgedValue: response[1],
          unhedgedValue: response[2],
          deltaExposure: response[3],
          gammaExposure: response[4],
          vegaExposure: response[5],
          thetaExposure: response[6],
          var95: response[7],
          maxDrawdown: response[8],
          sharpeRatio: response[9],
          volatility: response[10],
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get risk metrics:', error);
      return null;
    }
  }

  // Get hedging stats
  async getHedgingStats() {
    try {
      const response = await this.viewContractData(
        'hedging',
        'get_hedging_stats',
        [],
        []
      );
      
      if (response && response.length >= 4) {
        return {
          totalHedgedValue: response[0],
          totalPremiumCollected: response[1],
          totalPayouts: response[2],
          totalPositions: response[3],
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get hedging stats:', error);
      return null;
    }
  }

  // ==================== ORACLE CONTRACT FUNCTIONS ====================

  // Initialize oracle module (admin only)
  async initializeOracle(adminAccount) {
    return await this.makeContractCall(
      'oracle',
      'initialize',
      [],
      []
    );
  }

  // Get current price
  async getPrice(symbol) {
    try {
      const response = await this.viewContractData(
        'oracle',
        'get_price',
        [symbol],
        []
      );
      
      if (response && response.length >= 3) {
        return {
          price: response[0],
          timestamp: response[1],
          confidence: response[2],
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get price:', error);
      return null;
    }
  }

  // Get detailed price data
  async getPriceData(symbol) {
    try {
      const response = await this.viewContractData(
        'oracle',
        'get_price_data',
        [symbol],
        []
      );
      
      if (response && response.length >= 8) {
        return {
          symbol: response[0],
          price: response[1],
          timestamp: response[2],
          volume24h: response[3],
          priceChange24h: response[4],
          priceChange7d: response[5],
          marketCap: response[6],
          confidence: response[7],
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get price data:', error);
      return null;
    }
  }

  // Get all available symbols
  async getAllSymbols() {
    try {
      const response = await this.viewContractData(
        'oracle',
        'get_all_symbols',
        [],
        []
      );
      
      return response || [];
    } catch (error) {
      console.error('Failed to get all symbols:', error);
      return [];
    }
  }

  // Get oracle stats
  async getOracleStats() {
    try {
      const response = await this.viewContractData(
        'oracle',
        'get_oracle_stats',
        [],
        []
      );
      
      if (response && response.length >= 3) {
        return {
          totalSymbols: response[0],
          totalFeeds: response[1],
          isPaused: response[2],
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get oracle stats:', error);
      return null;
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  // Format price from contract format (scaled by 1e6) to decimal
  formatPrice(price) {
    return (price / 1000000).toFixed(6);
  }

  // Format amount from contract format to decimal
  formatAmount(amount, decimals = 6) {
    return (amount / Math.pow(10, decimals)).toFixed(decimals);
  }

  // Convert decimal amount to contract format
  toContractAmount(amount, decimals = 6) {
    return Math.floor(amount * Math.pow(10, decimals));
  }

  // Convert decimal price to contract format
  toContractPrice(price) {
    return Math.floor(price * 1000000);
  }

  // Get current timestamp in seconds
  getCurrentTimestamp() {
    return Math.floor(Date.now() / 1000);
  }

  // Calculate deadline timestamp
  getDeadlineTimestamp(minutes = 5) {
    return this.getCurrentTimestamp() + (minutes * 60);
  }

  // Validate address format
  isValidAddress(address) {
    return /^0x[a-fA-F0-9]{1,64}$/.test(address);
  }

  // Get contract address
  getContractAddress() {
    return this.contractAddress;
  }

  // Check if contract is deployed
  isContractDeployed() {
    return this.contractAddress && this.contractAddress !== '0x1';
  }
}

export default new SmartContractService();
