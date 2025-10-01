class KanaTradingService {
  constructor() {
    this.baseUrl = 'https://trade-api-test.kanalabs.io'; // Update with actual endpoint
    this.marketData = new Map();
    this.orderBooks = new Map();
  }

  // Helper method to make API calls
  async makeRequest(endpoint, params = {}) {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Kana API request failed:', error);
      throw error;
    }
  }

  // 1. Get all registered markets
  async getRegisteredMarkets() {
    return await this.makeRequest('/registeredMarkets');
  }

  // 2. Get available markets
  async getAvailableMarkets() {
    return await this.makeRequest('/availableMarket');
  }

  // 3. Get pair info for a market
  async getPairInfo(marketId) {
    return await this.makeRequest('/pairInfo', { marketId });
  }

  // 4. Get market price data
  async getMarketPrice(marketId) {
    const data = await this.makeRequest('/marketPrice', { marketId });
    if (data.status === 'OK') {
      this.marketData.set(marketId, data.data);
    }
    return data;
  }

  // 5. Get order book data
  async getOrderBook(marketId) {
    const data = await this.makeRequest('/orderBook', { marketId });
    if (data.status === 'OK') {
      this.orderBooks.set(marketId, data.data);
    }
    return data;
  }

  // 6. Get order history for a user
  async getOrderHistory(marketId, address) {
    return await this.makeRequest('/orderHistory', { marketId, address });
  }

  // 7. Get open orders for a user
  async getOpenOrders(marketId, address, orderType = 'open') {
    return await this.makeRequest('/openOrders', { marketId, address, orderType });
  }

  // 8. Get market account info
  async getMarketAccountInfo(marketId, address) {
    return await this.makeRequest('/marketAccountInfo', { marketId, address });
  }

  // 9. Get all trades for a market
  async getAllTrades(marketId, offset = 0, limit = 100, order = 'desc') {
    return await this.makeRequest('/allTrades', { marketId, offset, limit, order });
  }

  // 10. Get candlestick resolutions
  async getCandleStickResolutions() {
    return await this.makeRequest('/candleStickResolutions');
  }

  // 11. Get candlestick data
  async getCandleStickData(marketId, resolution) {
    return await this.makeRequest('/candleStickData', { marketId, resolution });
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
  // 16. Place market order
  async placeMarketOrder(marketId, amount, direction) {
    // direction: true for sell, false for buy
    return await this.makeRequest('/marketOrder', { marketId, amount, direction });
  }

  // 17. Place limit order
  async placeLimitOrder(marketId, amount, price, direction) {
    // direction: true for sell, false for buy
    return await this.makeRequest('/limitOrder', { marketId, amount, price, direction });
  }

  // 18. Cancel order
  async cancelOrder(marketId, direction, orderId) {
    return await this.makeRequest('/cancelOrder', { marketId, direction, orderId });
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

  // Real-time data subscription (mock implementation)
  subscribeToMarketData(marketId, callback) {
    // In a real implementation, this would use WebSocket or Server-Sent Events
    const interval = setInterval(async () => {
      try {
        const priceData = await this.getMarketPrice(marketId);
        const orderBookData = await this.getOrderBook(marketId);
        
        const formattedData = {
          price: this.formatMarketData(priceData.data),
          orderBook: this.formatOrderBook(orderBookData.data),
        };
        
        callback(formattedData);
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }

  // Get cached market data
  getCachedMarketData(marketId) {
    return this.marketData.get(marketId);
  }

  // Get cached order book
  getCachedOrderBook(marketId) {
    return this.orderBooks.get(marketId);
  }
}

export default new KanaTradingService();
