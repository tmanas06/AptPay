# AptPay Features Documentation

## 📱 Overview

AptPay is a comprehensive decentralized finance (DeFi) application built on the Aptos blockchain. It combines wallet functionality, trading features, liquidity provision, and risk management tools in a single, user-friendly interface.

---

## 🎨 Theme System

### Dark/Light Mode Toggle

**Location:** Header of Home Screen (top right corner)

**How to Use:**
1. Click the moon/sun icon in the header
2. The app instantly switches between light and dark modes
3. Your preference is automatically saved and persists across sessions

**Features:**
- ✅ Seamless theme switching across all pages
- ✅ Automatic preference storage (web: localStorage, mobile: AsyncStorage)
- ✅ System theme detection on first launch
- ✅ Optimized color palettes for both modes
- ✅ Web-compatible shadows and styling

---

## 💼 Wallet Features

### 1. Wallet Connection

**Location:** Home Screen

**Supported Wallets:**
- **Petra Wallet** (Primary)
- **Martian Wallet** (Alternative)

**How to Connect:**
1. Click "Connect Wallet" button on Home Screen
2. Select your preferred wallet (Petra or Martian)
3. Approve the connection in your wallet extension
4. Your wallet is now connected and ready to use

**Features:**
- ✅ Secure wallet connection
- ✅ Automatic reconnection on app restart
- ✅ Support for multiple wallet types
- ✅ Connection timeout protection (10 seconds)
- ✅ Non-blocking wallet restoration

**Connection Details:**
- Private key-based authentication
- Devnet network support
- Address validation
- Balance synchronization

### 2. Balance Display

**Location:** Home Screen (after connecting wallet)

**Information Shown:**
- Total APT balance
- USD equivalent (estimated)
- Account address (shortened format)
- Copy address functionality

**How to Use:**
1. Connect your wallet
2. View your balance in the Balance Card
3. Click the copy icon to copy your full address
4. Pull down to refresh your balance

### 3. Send Tokens

**Location:** Navigation → Wallet → Send

**How to Send APT:**
1. Navigate to Send Screen
2. Enter recipient's Aptos address (with or without 0x prefix)
3. Enter amount to send
4. Review transaction details
5. Confirm and sign the transaction in your wallet

**Features:**
- ✅ Address validation (64-character hex format)
- ✅ Real-time address verification
- ✅ Balance checking before transaction
- ✅ Transaction confirmation modal
- ✅ Gas fee estimation
- ✅ Quick amount presets (25%, 50%, 75%, Max)

**Address Format:**
- Accepts: `0x1234...` or `1234...`
- Length: 64 hexadecimal characters
- Validation: Automatic

### 4. Receive Tokens

**Location:** Navigation → Wallet → Receive

**How to Receive:**
1. Navigate to Receive Screen
2. View your QR code (automatically generated)
3. Share your address via:
   - QR code scanning
   - Copy address button
   - Share functionality

**Features:**
- ✅ QR code generation
- ✅ One-tap address copy
- ✅ Share via system share sheet
- ✅ Display full address
- ✅ Network indicator (Devnet)

### 5. Transaction History

**Location:** Navigation → Wallet → History

**Information Displayed:**
- Transaction type (Send/Receive/Contract Interaction)
- Amount and token
- Recipient/Sender address
- Timestamp
- Transaction status
- Block explorer link

**How to Use:**
1. Navigate to History Screen
2. View all past transactions
3. Click on a transaction for details
4. Use "View on Explorer" to see blockchain details

**Features:**
- ✅ Chronological transaction list
- ✅ Transaction type indicators
- ✅ Status badges (Success/Pending/Failed)
- ✅ Direct explorer links
- ✅ Pull-to-refresh for updates

### 6. Faucet Request

**Location:** Home Screen (after connecting wallet)

**How to Request Test Tokens:**
1. Connect your wallet on Devnet
2. Click "Request Faucet" button
3. Wait for confirmation (usually 10-30 seconds)
4. Receive 1 APT in your wallet

**Features:**
- ✅ One-click token request
- ✅ Automatic balance update
- ✅ Devnet network only
- ✅ Rate limiting protection

---

## 📊 Trading Features

### 1. Leveraged Trading (Merkle Trade Integration)

**Location:** Navigation → Trading

**Leverage Options:** 1x, 2x, 5x, 10x, 25x, 50x, 100x, 200x, 500x, 1000x

**Supported Trading Pairs:**
- APT/USDC
- BTC/USDC
- ETH/USDC
- And more...

**How to Trade:**

#### Opening a Position:
1. Select trading pair from horizontal scroll
2. Choose position type:
   - **Long**: Profit when price goes up
   - **Short**: Profit when price goes down
3. Select leverage multiplier (1x to 1000x)
4. Enter amount to trade
5. Review:
   - Entry price
   - Position size
   - Liquidation price
   - Estimated PnL
6. Click "LONG [PAIR]" or "SHORT [PAIR]" to execute
7. Confirm in your wallet

#### Managing Positions:
1. View open positions in "Open Positions" section
2. See real-time PnL (Profit and Loss)
3. Monitor:
   - Entry price
   - Current price
   - PnL percentage
   - Position size
4. Click X icon to close position

**Features:**
- ✅ Up to 1000x leverage
- ✅ Real-time price updates
- ✅ Automatic PnL calculation
- ✅ Risk metrics display
- ✅ Multiple position management
- ✅ One-click position closure
- ✅ Stop-loss and take-profit (coming soon)

**Risk Management:**
- Position size limits
- Liquidation price warnings
- Real-time margin requirements
- Automatic risk calculations

### 2. Kana Labs Trading Integration

**Location:** Navigation → KanaTrade

**Features:**
- **Order Book Trading**: Real order book with market depth
- **Market Orders**: Instant execution at best price
- **Limit Orders**: Set your desired price
- **Market Data**: Real-time price charts and indicators

#### Market Orders
**How to Place:**
1. Go to KanaTrade → Market Orders tab
2. Select trading pair
3. Enter amount
4. Choose Buy or Sell
5. Review market price
6. Confirm order

**Features:**
- ✅ Instant execution
- ✅ Best available price
- ✅ Slippage protection
- ✅ Market depth display

#### Limit Orders
**How to Place:**
1. Go to KanaTrade → Limit Orders tab
2. Select trading pair
3. Enter price and amount
4. Choose Buy or Sell
5. Set expiration (optional)
6. Submit order

**Features:**
- ✅ Price control
- ✅ Good-til-cancelled (GTC) orders
- ✅ Post-only options
- ✅ Order book integration

#### Order Management
**Location:** Navigation → KanaTrade → Order Management

**Actions Available:**
- View all open orders
- Cancel pending orders
- Modify order prices
- View order history
- Track filled orders

**Features:**
- ✅ Real-time order status
- ✅ Bulk order cancellation
- ✅ Order modification
- ✅ Execution history

#### Market Data
**Location:** Navigation → MarketData

**Information Available:**
- Real-time price charts
- Order book depth
- Recent trades
- 24h volume
- Price changes
- Candlestick charts
- Technical indicators

**Chart Types:**
- 1m, 5m, 15m, 1h, 4h, 1d intervals
- Candlestick patterns
- Volume bars
- Moving averages

---

## 💧 AMM & Liquidity Features

### Location: Navigation → AMM

### 1. Token Swapping

**How to Swap:**
1. Go to AMM → Swap tab
2. Select "From" token (e.g., APT)
3. Select "To" token (e.g., USDC)
4. Enter amount to swap
5. Review exchange rate and price impact
6. Check slippage tolerance
7. Click "Swap" and confirm

**Features:**
- ✅ Automatic price calculation
- ✅ Real-time exchange rates
- ✅ Slippage protection (0.5% - 5%)
- ✅ Price impact warnings
- ✅ Minimum received amount
- ✅ Token balance display
- ✅ Quick swap token reversal

**Supported Tokens:**
- APT (Aptos)
- USDC (USD Coin)
- BTC (Bitcoin)
- ETH (Ethereum)
- And more...

### 2. Liquidity Provision

**How to Add Liquidity:**
1. Go to AMM → Liquidity tab
2. Select token pair (e.g., APT/USDC)
3. Enter amount for first token
4. Second token amount auto-calculates
5. Review:
   - Pool share percentage
   - LP tokens to receive
   - Price impact
6. Click "Add Liquidity"
7. Approve tokens (if first time)
8. Confirm transaction

**How to Remove Liquidity:**
1. Go to AMM → Liquidity tab
2. View "Your Liquidity Positions"
3. Select position to remove
4. Choose removal percentage (25%, 50%, 75%, 100%)
5. Review tokens to receive
6. Click "Remove Liquidity"
7. Confirm transaction

**Features:**
- ✅ Automatic ratio calculation
- ✅ LP token minting
- ✅ Pool share tracking
- ✅ Fee earnings display
- ✅ Impermanent loss calculator
- ✅ Multiple pool support

**Earnings:**
- Trading fees (0.3% of swaps)
- LP token rewards
- Yield farming opportunities
- APR display

### 3. Pool Analytics

**Location:** AMM → Pools tab

**Information Available:**
- Total Value Locked (TVL)
- 24h trading volume
- 24h fees earned
- Annual Percentage Rate (APR)
- Token reserves
- Pool composition
- Historical performance

**How to Use:**
1. Browse available pools
2. Click on pool for details
3. View liquidity depth
4. Check APR and fees
5. Compare different pools
6. Select best yield opportunity

**Features:**
- ✅ Real-time pool stats
- ✅ APR comparison
- ✅ Volume tracking
- ✅ Fee distribution
- ✅ Pool history charts

---

## 🛡️ Risk Management & Hedging

### Location: Navigation → Hedging

### Portfolio Hedging Strategies

**Available Strategies:**

#### 1. Delta Neutral Hedging
**Purpose:** Eliminate directional risk

**How it Works:**
- Balances long and short positions
- Maintains neutral market exposure
- Protects against price swings

**How to Use:**
1. Go to Hedging screen
2. Select "Delta Neutral" strategy
3. Enter portfolio value
4. Review hedge ratio
5. Confirm hedging position

#### 2. Protective Puts
**Purpose:** Downside protection

**How it Works:**
- Buys put options
- Limits maximum loss
- Maintains upside potential

**How to Use:**
1. Select "Protective Puts"
2. Choose strike price
3. Set expiration date
4. Calculate premium cost
5. Execute hedge

#### 3. Covered Calls
**Purpose:** Generate income on holdings

**How it Works:**
- Sells call options on owned tokens
- Earns premium income
- Caps upside potential

**How to Use:**
1. Select "Covered Calls"
2. Choose call strike price
3. Set expiration
4. View premium earnings
5. Confirm strategy

#### 4. Iron Condors
**Purpose:** Profit from low volatility

**How it Works:**
- Combines puts and calls
- Profits when price stays in range
- Limited risk and reward

**How to Use:**
1. Select "Iron Condor"
2. Set price range
3. Choose expiration
4. Review max profit/loss
5. Execute strategy

**Risk Metrics Displayed:**
- Portfolio Value at Risk (VaR)
- Maximum Drawdown
- Sharpe Ratio
- Volatility Index
- Hedge Effectiveness

**Features:**
- ✅ Multiple hedging strategies
- ✅ Automated hedge suggestions
- ✅ Risk metrics dashboard
- ✅ Strategy backtesting
- ✅ Portfolio protection
- ✅ Real-time hedge monitoring

---

## 🔍 Quick Access Features

### Location: Home Screen → Quick Access Section

**Available Actions:**

#### 1. Send
- Quick access to send tokens
- One-tap navigation
- Recent recipients

#### 2. Receive
- Instant QR code display
- Quick address copy
- Share functionality

#### 3. Scan QR
- Camera-based QR scanner
- Address parsing
- Auto-fill send form

#### 4. History
- Recent transactions
- Quick transaction lookup
- Export functionality

**How to Use:**
1. Tap any quick access card
2. Automatically navigate to feature
3. Previous form data preserved
4. Quick return to home

---

## 📈 Market Data & Analytics

### Location: Navigation → MarketData

**Available Data:**

#### Price Charts
- Real-time candlestick charts
- Multiple timeframes
- Technical indicators
- Drawing tools

#### Order Book
- Live buy/sell orders
- Market depth visualization
- Price levels
- Order clustering

#### Recent Trades
- Latest executed trades
- Trade size and price
- Buy/sell indicators
- Time stamps

#### Market Stats
- 24h high/low
- Trading volume
- Price changes
- Market cap
- Circulating supply

**Chart Features:**
- ✅ Interactive zoom and pan
- ✅ Multiple indicators (MA, RSI, MACD)
- ✅ Drawing tools
- ✅ Price alerts
- ✅ Historical data
- ✅ Export functionality

---

## 🎯 Advanced Features

### 1. QR Code Scanner

**Location:** Navigation → Wallet → Scan QR

**How to Use:**
1. Tap "Scan QR" from quick access
2. Allow camera permissions
3. Point camera at QR code
4. Address automatically captured
5. Navigate to send screen with pre-filled address

**Features:**
- ✅ Fast QR recognition
- ✅ Address validation
- ✅ Auto-navigation
- ✅ Error handling
- ✅ Manual entry fallback

### 2. Account Management

**Features:**
- View account address
- Copy address with one tap
- Network indicator (Devnet/Mainnet)
- Account balance
- Transaction count

**How to Access:**
1. Connect wallet
2. View account card on Home Screen
3. Tap address to copy
4. View full address in modal

### 3. Network Status

**Information Shown:**
- Current network (Devnet/Mainnet)
- Connection status
- Block height
- Network health

**Indicators:**
- 🟢 Green: Connected
- 🟡 Yellow: Reconnecting
- 🔴 Red: Disconnected

---

## 🔐 Security Features

### Wallet Security
- Private key never leaves your wallet
- Secure transaction signing
- Connection timeout protection
- Automatic session management

### Transaction Security
- Amount validation
- Address verification
- Gas estimation
- Confirmation prompts
- Transaction status tracking

### Best Practices
1. Always verify recipient addresses
2. Double-check transaction amounts
3. Start with small test transactions
4. Keep wallet extensions updated
5. Use hardware wallets for large amounts
6. Never share your private keys

---

## 🚀 Getting Started Guide

### First Time Setup

**Step 1: Install Wallet**
1. Install Petra Wallet or Martian Wallet browser extension
2. Create new wallet or import existing
3. Switch to Aptos Devnet for testing
4. Save your seed phrase securely

**Step 2: Get Test Tokens**
1. Open AptPay application
2. Click "Connect Wallet"
3. Approve connection in wallet
4. Click "Request Faucet" button
5. Wait for 1 APT to arrive

**Step 3: Explore Features**
1. Check your balance on Home Screen
2. Try sending tokens to another address
3. Explore trading features
4. Test liquidity provision
5. View transaction history

**Step 4: Advanced Usage**
1. Open leveraged trading position
2. Place limit orders on Kana
3. Add liquidity to earn fees
4. Set up portfolio hedges
5. Monitor market data

---

## 📱 Navigation Guide

### Bottom Tab Navigation

**Home Tab** 🏠
- Wallet overview
- Balance display
- Quick access features
- DeFi features grid

**KanaTrade Tab** 📊
- Order book trading
- Market/Limit orders
- Order management
- Real-time data

**Trading Tab** 📈
- Leveraged trading
- Position management
- Multiple pairs
- High leverage options

**AMM Tab** 💧
- Token swapping
- Liquidity provision
- Pool analytics
- Yield farming

**Hedging Tab** 🛡️
- Risk management
- Portfolio protection
- Hedging strategies
- Risk metrics

**Wallet Tab** 💼
- Send tokens
- Receive tokens
- Transaction history
- QR scanner

---

## 💡 Tips & Tricks

### Trading Tips
1. Start with lower leverage (2x-5x) to learn
2. Always set stop-losses
3. Monitor liquidation prices
4. Use limit orders for better prices
5. Check market depth before large trades

### Liquidity Provision Tips
1. Choose high-volume pairs for more fees
2. Monitor impermanent loss
3. Compound your earnings
4. Compare APRs across pools
5. Start with stable pairs (e.g., USDC/USDT)

### Risk Management Tips
1. Never invest more than you can afford to lose
2. Diversify across multiple strategies
3. Use hedging for large positions
4. Monitor portfolio regularly
5. Set profit-taking targets

### UI Tips
1. Pull down to refresh data on any screen
2. Use dark mode for better viewing at night
3. Bookmark frequently used features
4. Check transaction history regularly
5. Enable notifications for important events

---

## 🐛 Troubleshooting

### Wallet Won't Connect
- Ensure wallet extension is installed
- Check you're on Aptos Devnet
- Refresh the page
- Try different wallet type
- Clear browser cache

### Transaction Failed
- Check sufficient balance
- Verify address format
- Ensure enough for gas fees
- Check network status
- Try again with higher gas

### Balance Not Updating
- Pull down to refresh
- Reconnect wallet
- Check network connection
- Wait for block confirmation
- Check transaction status

### Theme Not Saving
- Check browser allows localStorage
- Enable cookies and site data
- Update browser to latest version
- Try clearing cache once

---

## 📞 Support & Resources

### Help Resources
- In-app tooltips and hints
- Transaction history for reference
- Block explorer integration
- Community forums
- Documentation

### Network Information
- **Devnet RPC**: https://fullnode.devnet.aptoslabs.com/v1
- **Devnet Explorer**: https://explorer.aptoslabs.com/?network=devnet
- **Faucet**: Built-in one-click faucet

### Best Practices
1. Test all features on Devnet first
2. Start with small amounts
3. Verify all transactions
4. Keep wallet secure
5. Regular balance checks

---

## 🎓 Learning Resources

### Beginner Topics
- Understanding blockchain wallets
- How to send and receive tokens
- Reading transaction history
- Network fees and gas

### Intermediate Topics
- Token swapping mechanics
- Providing liquidity
- Reading order books
- Understanding leverage

### Advanced Topics
- Hedging strategies
- Risk management
- Portfolio optimization
- Advanced trading techniques

---

## 🌟 Feature Highlights

### What Makes AptPay Special

✨ **All-in-One Platform**
- Wallet, trading, and DeFi in one app
- No need for multiple applications
- Seamless feature integration

✨ **User-Friendly**
- Intuitive interface
- Clear navigation
- Helpful tooltips
- Error prevention

✨ **Powerful Trading**
- Up to 1000x leverage
- Multiple trading venues
- Real order books
- Advanced order types

✨ **Complete DeFi Suite**
- AMM functionality
- Liquidity provision
- Yield farming
- Risk management

✨ **Modern Design**
- Dark/Light mode
- Responsive layout
- Smooth animations
- Professional styling

---

## 📊 Supported Networks

### Current Support
- **Aptos Devnet**: Full support for testing

### Coming Soon
- **Aptos Mainnet**: Production deployment
- **Testnet**: Additional testing environment

---

## 🔄 Updates & Changelog

### Latest Version Features
- ✅ Complete dark mode implementation
- ✅ All screens themed
- ✅ Improved wallet connection
- ✅ Enhanced UI/UX
- ✅ Cross-platform compatibility
- ✅ Performance optimizations

---

## 📝 Quick Reference

### Keyboard Shortcuts (Web)
- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + Shift + D`: Toggle dark mode
- `Ctrl/Cmd + H`: Go to home
- `Esc`: Close modals

### Transaction Status
- 🟢 **Success**: Transaction confirmed
- 🟡 **Pending**: Waiting for confirmation
- 🔴 **Failed**: Transaction rejected

### Risk Levels
- 🟢 **Low**: Stable, low volatility
- 🟡 **Medium**: Moderate risk/reward
- 🔴 **High**: High volatility, use caution

---

**Version:** 1.0.0  
**Last Updated:** October 1, 2025  
**Network:** Aptos Devnet  
**Built with:** React Native, Expo, Aptos SDK

