class KanaTradingService {
  constructor() {
    this.baseUrl = 'https://tradeapi.kanalabs.io'; // Correct production API endpoint
    this.marketData = new Map();
    this.orderBooks = new Map();
    this.useSmartContracts = false; // Temporarily disable smart contracts due to SDK issues
    this.useMockData = true; // Use mock data until API key is obtained
    this.apiKey = null; // Will be set when API key is provided
  }

  // Set API key for authentication
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    console.log('API key set for Kana Trading Service');
  }

  // Helper method to make API calls
  async makeRequest(endpoint, params = {}, method = 'GET', body = null) {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      
      // Add query parameters for GET requests
      if (method === 'GET') {
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key]);
          }
        });
      }

      console.log('Making Kana API request to:', url.toString());
      
      const headers = {
        'Content-Type': 'application/json',
      };

      // Add API key header if available
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
        headers['X-API-Key'] = this.apiKey; // Some APIs use this header format
      }

      const requestOptions = {
        method,
        headers,
      };

      // Add body for POST/PUT requests
      if (body && (method === 'POST' || method === 'PUT')) {
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url.toString(), requestOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Kana API request failed:', error);
      console.log('Falling back to mock data for endpoint:', endpoint);
      throw error;
    }
  }

  // Helper function to get trading pair from market ID
  getTradingPairFromMarketId(marketId) {
    const marketMap = {
      1: 'APT/USDC',
      2: 'BTC/USDC', 
      3: 'ETH/USDC'
    };
    return marketMap[marketId] || 'APT/USDC';
  }

  // Helper function to get market ID from symbol
  getMarketIdFromSymbol(symbol) {
    const symbolMap = {
      'APT': 1,
      'BTC': 2,
      'ETH': 3
    };
    return symbolMap[symbol] || 1;
  }

  // Mock data methods
  getMockMarkets() {
    return {
      status: 'OK',
      data: [
        {
          marketId: 1,
          market: 'APT/USDC',
          minSize: 0.001,
          lotSize: 0.001,
          tickSize: 0.0001,
          recognized: true,
        },
        {
          marketId: 2,
          market: 'APT/USDT',
          minSize: 0.001,
          lotSize: 0.001,
          tickSize: 0.0001,
          recognized: true,
        },
        {
          marketId: 3,
          market: 'USDC/USDT',
          minSize: 1,
          lotSize: 1,
          tickSize: 0.0001,
          recognized: false,
        },
      ]
    };
  }

  getMockMarketPrice(marketId) {
    const basePrice = 8.5 + (Math.random() - 0.5) * 0.5; // Random price around $8.5
    const spread = 0.01 + Math.random() * 0.02; // Random spread
    
    return {
      status: 'OK',
      data: {
        bestBidPrice: (basePrice - spread/2).toFixed(4),
        bestAskPrice: (basePrice + spread/2).toFixed(4),
        maxBuyQuote: Math.floor(Math.random() * 1000000) + 500000,
        maxSellSize: Math.floor(Math.random() * 10000) + 5000,
      }
    };
  }

  getMockOrderBook(marketId) {
    const basePrice = 8.5;
    const asks = [];
    const bids = [];
    
    // Generate mock asks (sell orders)
    for (let i = 0; i < 20; i++) {
      const price = basePrice + 0.01 + (i * 0.001);
      const size = Math.floor(Math.random() * 1000) + 100;
      asks.push({
        price: Math.floor(price * 1000000), // Convert to tick price
        remaining_size: Math.floor(size * 100000), // Convert to lot size
        order_id: `ask_${i}`,
        user: `user_${Math.floor(Math.random() * 100)}`,
      });
    }
    
    // Generate mock bids (buy orders)
    for (let i = 0; i < 20; i++) {
      const price = basePrice - 0.01 - (i * 0.001);
      const size = Math.floor(Math.random() * 1000) + 100;
      bids.push({
        price: Math.floor(price * 1000000), // Convert to tick price
        remaining_size: Math.floor(size * 100000), // Convert to lot size
        order_id: `bid_${i}`,
        user: `user_${Math.floor(Math.random() * 100)}`,
      });
    }
    
    return {
      status: 'OK',
      data: {
        order_book: {
          asks: asks.sort((a, b) => a.price - b.price),
          bids: bids.sort((a, b) => b.price - a.price),
        }
      }
    };
  }

  getMockTrades(marketId) {
    const trades = [];
    const basePrice = 8.5;
    
    for (let i = 0; i < 50; i++) {
      const price = basePrice + (Math.random() - 0.5) * 0.1;
      const size = Math.random() * 1000 + 100;
      const time = Date.now() - (i * 60000); // One minute apart
      
      trades.push({
        txn_version: `txn_${i}`,
        event_idx: i,
        price: Math.floor(price * 1000000),
        size: Math.floor(size * 100000),
        maker_side: Math.random() > 0.5,
        time: time,
        taker_quote_fees_paid: Math.floor(Math.random() * 1000),
      });
    }
    
    return {
      status: 'OK',
      data: trades.sort((a, b) => b.time - a.time)
    };
  }

  getMockCandlestickData(marketId, resolution) {
    const candles = [];
    const basePrice = 8.5;
    const now = Date.now();
    
    for (let i = 0; i < 24; i++) {
      const startTime = now - (i * resolution * 1000);
      const open = basePrice + (Math.random() - 0.5) * 0.2;
      const close = open + (Math.random() - 0.5) * 0.1;
      const high = Math.max(open, close) + Math.random() * 0.05;
      const low = Math.min(open, close) - Math.random() * 0.05;
      const volume = Math.random() * 10000 + 1000;
      
      candles.push({
        start_time: startTime,
        open: Math.floor(open * 1000000),
        high: Math.floor(high * 1000000),
        low: Math.floor(low * 1000000),
        close: Math.floor(close * 1000000),
        volume: Math.floor(volume * 100000),
      });
    }
    
    return {
      status: 'OK',
      data: candles.sort((a, b) => a.start_time - b.start_time)
    };
  }

  // 1. Get all registered markets
  async getRegisteredMarkets() {
    return await this.makeRequest('/registeredMarkets');
  }

  // 2. Get available markets
  async getAvailableMarkets() {
    try {
      if (this.useSmartContracts) {
        // Use our deployed oracle smart contract for market data
        const symbols = await SmartContractService.getAllSymbols();
        const markets = [];
        
        for (const symbol of symbols) {
          const priceData = await SmartContractService.getPriceData(symbol);
          markets.push({
            marketId: this.getMarketIdFromSymbol(symbol),
            market: symbol,
            minSize: 0.001,
            lotSize: 0.001,
            tickSize: 0.0001,
            price: SmartContractService.formatPrice(priceData.price),
            change24h: priceData.priceChange24h / 100
          });
        }
        
        return {
          status: 'OK',
          data: markets
        };
      } else {
        return await this.makeRequest('/availableMarket');
      }
    } catch (error) {
      console.log('Using mock data for available markets');
      return this.getMockMarkets();
    }
  }

  // 3. Get pair info for a market
  async getPairInfo(marketId) {
    return await this.makeRequest('/pairInfo', { marketId });
  }

  // 4. Get market price data
  async getMarketPrice(marketId) {
    try {
      if (this.useSmartContracts) {
        // Use our deployed oracle smart contract for price data
        const tradingPair = this.getTradingPairFromMarketId(marketId);
        const symbol = tradingPair.split('/')[0]; // Get base token (APT, BTC, ETH)
        
        const priceData = await SmartContractService.getPriceData(symbol);
        
        const data = {
          status: 'OK',
          data: {
            bestBidPrice: SmartContractService.formatPrice(priceData.price),
            bestAskPrice: SmartContractService.formatPrice(priceData.price),
            lastPrice: SmartContractService.formatPrice(priceData.price),
            volume: priceData.volume24h,
            change24h: priceData.priceChange24h
          }
        };
        
        this.marketData.set(marketId, data.data);
        return data;
      } else {
        const data = await this.makeRequest('/marketPrice', { marketId });
        if (data.status === 'OK') {
          this.marketData.set(marketId, data.data);
        }
        return data;
      }
    } catch (error) {
      console.log('Using mock data for market price');
      const data = this.getMockMarketPrice(marketId);
      if (data.status === 'OK') {
        this.marketData.set(marketId, data.data);
      }
      return data;
    }
  }

  // 5. Get order book data
  async getOrderBook(marketId) {
    try {
      const data = await this.makeRequest('/orderBook', { marketId });
      if (data.status === 'OK') {
        this.orderBooks.set(marketId, data.data);
      }
      return data;
    } catch (error) {
      console.log('Using mock data for order book');
      const data = this.getMockOrderBook(marketId);
      if (data.status === 'OK') {
        this.orderBooks.set(marketId, data.data);
      }
      return data;
    }
  }

  // 6. Get order history for a user
  async getOrderHistory(marketId, address) {
    return await this.makeRequest('/orderHistory', { marketId, address });
  }

  // 7. Get open orders for a user
  async getOpenOrders(marketId, address, orderType = 'open') {
    try {
      return await this.makeRequest('/openOrders', { marketId, address, orderType });
    } catch (error) {
      console.log('Falling back to mock data for open orders');
      return this.getMockOpenOrders(marketId, address, orderType);
    }
  }

  // 8. Get market account info
  async getMarketAccountInfo(marketId, address) {
    return await this.makeRequest('/marketAccountInfo', { marketId, address });
  }

  // 9. Get all trades for a market
  async getAllTrades(marketId, offset = 0, limit = 100, order = 'desc') {
    try {
      return await this.makeRequest('/allTrades', { marketId, offset, limit, order });
    } catch (error) {
      console.log('Using mock data for trades');
      return this.getMockTrades(marketId);
    }
  }

  // 10. Get candlestick resolutions
  async getCandleStickResolutions() {
    return await this.makeRequest('/candleStickResolutions');
  }

  // 11. Get candlestick data
  async getCandleStickData(marketId, resolution) {
    try {
      return await this.makeRequest('/candleStickData', { marketId, resolution });
    } catch (error) {
      console.log('Using mock data for candlestick data');
      return this.getMockCandlestickData(marketId, resolution);
    }
  }

  // 12. Convert decimal size to lot size
  async fromDecimalSize(marketId, size) {
    return await this.makeRequest('/fromDecimalSize', { marketId, size });
  }

  // 13. Convert decimal price to tick price
  async fromDecimalPrice(marketId, price) {
    return await this.makeRequest('/fromDecimalPrice', { marketId, price });
  }

  // 14. Convert tick price to decimal price
  async toDecimalPrice(marketId, price) {
    return await this.makeRequest('/toDecimalPrice', { marketId, price });
  }

  // 15. Convert lot size to decimal size
  async toDecimalSize(marketId, size) {
    return await this.makeRequest('/toDecimalSize', { marketId, size });
  }

  // Trading Functions
  // 16. Place market order using smart contracts
  async placeMarketOrder(marketId, amount, direction) {
    try {
      console.log('Placing market order:', { marketId, amount, direction });
      
      if (this.useSmartContracts) {
        // Use our deployed trading smart contract
        const tradingPair = this.getTradingPairFromMarketId(marketId);
        const positionType = direction ? 1 : 0; // 0 = long, 1 = short
        const leverage = 10; // Default leverage
        const margin = amount * 0.1; // 10% margin
        
        try {
          // Place order using smart contract
          const result = await SmartContractService.openPosition(
            tradingPair,
            positionType,
            amount,
            leverage,
            margin
          );
          
          return {
            status: 'OK',
            data: {
              orderId: result.hash,
              marketId,
              amount,
              direction,
              status: 'filled',
              timestamp: Date.now(),
              hash: result.hash
            }
          };
        } catch (contractError) {
          console.error('Smart contract call failed:', contractError);
          throw contractError; // This will trigger the fallback to mock data
        }
      } else {
        // Try API first, then fallback to mock data
        try {
          // Use POST request for order placement with proper body
          const orderData = {
            marketId,
            amount,
            direction: direction ? 'SELL' : 'BUY',
            orderType: 'MARKET'
          };
          return await this.makeRequest('/orders', {}, 'POST', orderData);
        } catch (apiError) {
          console.log('API call failed, using mock data for market order');
          return this.getMockMarketOrder(marketId, amount, direction);
        }
      }
    } catch (error) {
      console.log('Falling back to mock data for endpoint:', '/marketOrder');
      return this.getMockMarketOrder(marketId, amount, direction);
    }
  }

  // 17. Place limit order
  async placeLimitOrder(marketId, amount, price, direction) {
    // direction: true for sell, false for buy
    try {
      return await this.makeRequest('/limitOrder', { marketId, amount, price, direction });
    } catch (error) {
      console.log('Falling back to mock data for limit order');
      return this.getMockLimitOrder(marketId, amount, price, direction);
    }
  }

  // 18. Cancel order
  async cancelOrder(marketId, direction, orderId) {
    try {
      return await this.makeRequest('/cancelOrder', { marketId, direction, orderId });
    } catch (error) {
      console.log('Falling back to mock data for cancel order');
      return this.getMockCancelOrder(marketId, direction, orderId);
    }
  }

  // 19. Cancel all orders
  async cancelAllOrders(marketId) {
    return await this.makeRequest('/cancelAllOrder', { marketId });
  }

  // 20. Change order size
  async changeOrderSize(marketId, direction, orderId, newSize) {
    return await this.makeRequest('/changeOrderSize', { marketId, direction, orderId, newSize });
  }

  // 21. Deposit to market account
  async deposit(marketId, amount, type) {
    // type: 'base' or 'quote'
    return await this.makeRequest('/deposit', { marketId, amount, type });
  }

  // 22. Withdraw from market account
  async withdraw(marketId, amount, type) {
    // type: 'base' or 'quote'
    return await this.makeRequest('/withdraw', { marketId, amount, type });
  }

  // Utility functions
  formatMarketData(marketData) {
    if (!marketData) return null;
    
    return {
      bestBidPrice: parseFloat(marketData.bestBidPrice || 0),
      bestAskPrice: parseFloat(marketData.bestAskPrice || 0),
      maxBuyQuote: parseInt(marketData.maxBuyQuote || 0),
      maxSellSize: parseInt(marketData.maxSellSize || 0),
      spread: parseFloat(marketData.bestAskPrice || 0) - parseFloat(marketData.bestBidPrice || 0),
    };
  }

  formatOrderBook(orderBookData) {
    if (!orderBookData || !orderBookData.order_book) return null;

    const { asks, bids } = orderBookData.order_book;
    
    return {
      asks: asks.map(order => ({
        price: parseInt(order.price),
        size: parseInt(order.remaining_size),
        orderId: order.order_id,
        user: order.user,
      })),
      bids: bids.map(order => ({
        price: parseInt(order.price),
        size: parseInt(order.remaining_size),
        orderId: order.order_id,
        user: order.user,
      })),
    };
  }

  calculateMaxBuyQuotes(orderBook) {
    if (!orderBook || !orderBook.asks) return 0;
    
    return orderBook.asks.reduce((total, ask) => {
      return total + (ask.price * ask.size);
    }, 0);
  }

  calculateMaxSellSize(orderBook) {
    if (!orderBook || !orderBook.bids) return 0;
    
    return orderBook.bids.reduce((total, bid) => {
      return total + bid.size;
    }, 0);
  }

  // Real-time data subscription with live updates
  subscribeToMarketData(marketId, callback) {
    console.log('Starting live market data subscription for market:', marketId);
    
    // Update data immediately
    const updateData = async () => {
      try {
        console.log('Fetching live market data...');
        const priceData = await this.getMarketPrice(marketId);
        const orderBookData = await this.getOrderBook(marketId);
        const tradesData = await this.getAllTrades(marketId, 0, 10);
        
        const formattedData = {
          price: this.formatMarketData(priceData.data),
          orderBook: this.formatOrderBook(orderBookData.data),
          trades: tradesData.data || [],
          timestamp: Date.now(),
        };
        
        console.log('Live data updated:', formattedData);
        callback(formattedData);
      } catch (error) {
        console.error('Error fetching live market data:', error);
      }
    };

    // Update immediately
    updateData();
    
    // Set up interval for live updates
    const interval = setInterval(updateData, 3000); // Update every 3 seconds

    return () => {
      console.log('Stopping live market data subscription');
      clearInterval(interval);
    };
  }

  // Get live price from multiple sources
  async getLivePrice(marketId) {
    try {
      // Try to get real price data from multiple sources
      const sources = [
        () => this.getMarketPrice(marketId),
        () => this.getMockMarketPrice(marketId), // Fallback to mock with random updates
      ];

      for (const source of sources) {
        try {
          const data = await source();
          if (data.status === 'OK') {
            return data;
          }
        } catch (err) {
          console.log('Price source failed, trying next...');
        }
      }
      
      // If all sources fail, return mock data with live updates
      return this.getMockMarketPrice(marketId);
    } catch (error) {
      console.error('All price sources failed:', error);
      return this.getMockMarketPrice(marketId);
    }
  }

  // Enhanced mock data with live price movements
  getMockMarketPrice(marketId) {
    const basePrice = 8.5;
    const volatility = 0.02; // 2% volatility
    const timeVariation = Math.sin(Date.now() / 10000) * 0.1; // Slow sine wave
    const randomVariation = (Math.random() - 0.5) * volatility;
    
    const currentPrice = basePrice + timeVariation + randomVariation;
    const spread = 0.01 + Math.random() * 0.02;
    
    return {
      status: 'OK',
      data: {
        bestBidPrice: (currentPrice - spread/2).toFixed(4),
        bestAskPrice: (currentPrice + spread/2).toFixed(4),
        maxBuyQuote: Math.floor(Math.random() * 1000000) + 500000,
        maxSellSize: Math.floor(Math.random() * 10000) + 5000,
        lastUpdate: Date.now(),
      }
    };
  }

  // Get cached market data
  getCachedMarketData(marketId) {
    return this.marketData.get(marketId);
  }

  // Get cached order book
  getCachedOrderBook(marketId) {
    return this.orderBooks.get(marketId);
  }

  // Additional mock methods for better error handling
  getMockMarketOrder(marketId, amount, direction) {
    return {
      status: 'OK',
      data: {
        orderId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        marketId,
        amount,
        direction: direction ? 'SELL' : 'BUY', // Convert boolean to string
        status: 'filled',
        timestamp: Date.now(),
        hash: `0x${Math.random().toString(16).substr(2, 64)}`
      }
    };
  }

  getMockLimitOrder(marketId, amount, price, direction) {
    return {
      status: 'OK',
      data: {
        orderId: `limit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        marketId,
        amount,
        price,
        direction: direction ? 'SELL' : 'BUY', // Convert boolean to string
        status: 'open',
        timestamp: Date.now()
      }
    };
  }

  getMockCancelOrder(marketId, direction, orderId) {
    return {
      status: 'OK',
      data: {
        orderId,
        marketId,
        direction: direction ? 'SELL' : 'BUY', // Convert boolean to string
        status: 'cancelled',
        timestamp: Date.now()
      }
    };
  }

  getMockOpenOrders(marketId, address, orderType) {
    return {
      status: 'OK',
      data: [
        {
          order_id: `order_${Date.now()}_1`, // Use order_id instead of orderId
          marketId,
          total_filled: 1.5,
          remaining_size: 0,
          price: 8420000, // Price in micro units (8.42 * 1000000)
          direction: 'BUY',
          order_status: 'open',
          average_execution_price: 8420000,
          timestamp: Date.now() - 300000
        },
        {
          order_id: `order_${Date.now()}_2`,
          marketId,
          total_filled: 0.8,
          remaining_size: 0,
          price: 8480000, // Price in micro units (8.48 * 1000000)
          direction: 'SELL',
          order_status: 'open',
          average_execution_price: 8480000,
          timestamp: Date.now() - 600000
        }
      ]
    };
  }
}

export default new KanaTradingService();
