# Kana Labs API Integration Guide

## 📋 Overview

This document explains how to integrate with the **Kana Labs Trading API** for real-time trading data and order execution.

## 🔗 Resources

- **Kana Trade DApp**: https://testnet.kana.trade/?market=BTC-PERP
- **API Documentation (Swagger)**: https://tradeapi.kanalabs.io/swagger/static/index.html#/
- **GitHub Examples**: https://github.com/kanalabs/trade-implementation
- **Contact for API Key**: hello@kanalabs.io

## 🔑 Getting an API Key

### Step 1: Contact Kana Labs
Email: **hello@kanalabs.io**

Subject: API Key Request for Trading Integration

Body:
```
Hello Kana Labs Team,

I would like to request an API key for integrating my trading application with your API.

Application Name: AptPay
Purpose: DeFi trading and swap features integration
Network: Aptos Testnet/Devnet

Thank you!
```

### Step 2: Receive API Key
You'll receive your API key via email. Keep it secure and never commit it to your repository.

### Step 3: Configure API Key in AptPay

Once you have your API key, you can set it in the application:

```javascript
import KanaTradingService from './src/services/KanaTradingService';

// Set your API key
KanaTradingService.setApiKey('YOUR_API_KEY_HERE');
```

Or use the built-in API Key Configuration UI in the Trading screen.

## 🛠️ Current Implementation

### API Endpoint
```javascript
baseUrl: 'https://tradeapi.kanalabs.io'
```

### Authentication
API requests include the following headers when an API key is set:
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_API_KEY',
  'X-API-Key': 'YOUR_API_KEY'
}
```

### Available Endpoints

#### 1. **Get Available Markets**
```javascript
GET /availableMarket
```
Returns list of all available trading pairs.

#### 2. **Get Market Price**
```javascript
GET /marketPrice?marketId={marketId}
```
Returns current price data for a specific market.

#### 3. **Get Order Book**
```javascript
GET /orderBook?marketId={marketId}
```
Returns bids and asks for a specific market.

#### 4. **Place Market Order**
```javascript
POST /orders
Body: {
  "marketId": 1,
  "amount": 1.5,
  "direction": "BUY",
  "orderType": "MARKET"
}
```

#### 5. **Place Limit Order**
```javascript
POST /orders
Body: {
  "marketId": 1,
  "amount": 1.5,
  "price": 8.45,
  "direction": "BUY",
  "orderType": "LIMIT"
}
```

#### 6. **Get Open Orders**
```javascript
GET /openOrders?marketId={marketId}&address={walletAddress}&orderType=open
```

#### 7. **Cancel Order**
```javascript
DELETE /orders/{orderId}
```

## 📱 Using the API Key Configuration UI

1. Open the **Trading** screen in AptPay
2. Look for the **"Configure API Key"** button at the top
3. Click it to open the configuration modal
4. Enter your API key
5. Click **"Save API Key"**

The app will now use real Kana Labs data instead of mock data!

## 🔄 Mock Data vs Real Data

### Current Behavior (Without API Key)
- Uses **mock data** for all trading functions
- Simulates realistic price movements
- No real blockchain transactions
- Perfect for testing UI/UX

### With API Key
- Uses **real Kana Labs API**
- Real-time market data
- Real order placement (on testnet)
- Actual trading functionality

To toggle between mock and real data:
```javascript
// In KanaTradingService.js
this.useMockData = false; // Use real API
this.useMockData = true;  // Use mock data
```

## 🚀 Features Supported

### ✅ Currently Working
- Market data fetching (with fallback to mock)
- Order book display
- Market price updates
- Mock order placement
- Order history display
- API key configuration UI

### 🔜 Coming Soon (With API Key)
- Real order execution
- Real-time price updates via WebSocket
- Trade history from blockchain
- Position management
- PnL tracking

## 🛡️ Security Best Practices

1. **Never commit API keys** to your repository
2. **Use environment variables** for production:
   ```javascript
   const API_KEY = process.env.KANA_API_KEY;
   ```
3. **Rotate API keys** regularly
4. **Use different keys** for development and production
5. **Monitor API usage** to detect unauthorized access

## 📊 Example Integration

### Setting Up the Service
```javascript
// In your App.js or initialization file
import KanaTradingService from './src/services/KanaTradingService';

// Set API key from environment or secure storage
const apiKey = process.env.KANA_API_KEY || 'your-api-key-here';
KanaTradingService.setApiKey(apiKey);
```

### Fetching Market Data
```javascript
import KanaTradingService from '../services/KanaTradingService';

// Get available markets
const markets = await KanaTradingService.getAvailableMarkets();

// Get market price
const priceData = await KanaTradingService.getMarketPrice(1);

// Get order book
const orderBook = await KanaTradingService.getOrderBook(1);
```

### Placing Orders
```javascript
// Place a market order
const marketOrder = await KanaTradingService.placeMarketOrder(
  1,      // marketId
  1.5,    // amount
  false   // direction (false = BUY, true = SELL)
);

// Place a limit order
const limitOrder = await KanaTradingService.placeLimitOrder(
  1,      // marketId
  1.5,    // amount
  8.45,   // price
  false   // direction (false = BUY, true = SELL)
);
```

## 🐛 Troubleshooting

### CORS Errors
If you see CORS errors, it means:
1. The API endpoint doesn't allow browser requests (need backend proxy)
2. API key is required for authentication
3. Request format is incorrect

**Solution**: The app automatically falls back to mock data when API calls fail.

### API Key Not Working
Check:
1. API key is correctly formatted
2. No extra spaces or special characters
3. API key is still valid (not expired)
4. Your IP is allowed (if API has IP whitelist)

### Mock Data Showing Instead of Real Data
Ensure:
```javascript
// In KanaTradingService.js constructor
this.useMockData = false; // Must be false to use real API
this.apiKey = 'your-api-key'; // Must be set
```

## 📞 Support

- **Email**: hello@kanalabs.io
- **GitHub**: https://github.com/kanalabs
- **Documentation**: https://tradeapi.kanalabs.io/swagger/static/index.html#/

## 🎯 Next Steps

1. **Request API Key** from hello@kanalabs.io
2. **Test with Mock Data** to ensure UI/UX is working
3. **Configure API Key** once received
4. **Test Real Trading** on testnet
5. **Deploy to Production** with proper security measures

---

**Note**: Currently, the app is configured to use mock data for all trading functions. This provides a safe testing environment without requiring an API key. Once you have your API key, simply configure it using the built-in UI or programmatically, and the app will seamlessly switch to real Kana Labs data.

