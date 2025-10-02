# AptosPay - Advanced DeFi Trading Platform

A comprehensive DeFi platform built for Aptos blockchain, combining payment functionality with advanced trading features from the winning projects of last year's hackathon. Features leveraged trading, AMM pools, risk hedging capabilities, and full dark/light mode support.

## 📚 Documentation

**Complete Guides:**
- 📖 **[FEATURES.md](FEATURES.md)** - Detailed feature documentation and usage instructions
- 🚀 **[USER_GUIDE.md](USER_GUIDE.md)** - Quick start guide, workflows, and tips
- 🔧 **[TECHNICAL_DOCS.md](TECHNICAL_DOCS.md)** - Technical details, API reference, and architecture
- 🚢 **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Smart contract and app deployment

**Quick Links:**
- [Getting Started](#-quick-start) - Set up in 5 minutes
- [Features Overview](#-features) - What you can do
- [Development](#-development) - Run locally

## 🚀 Features

### Core Wallet Features
- **Instant Payments**: Send and receive APT tokens instantly
- **Mobile-First Design**: Optimized for mobile devices with React Native
- **Dark/Light Mode**: Fully implemented theme system with persistent preferences
- **QR Code Support**: Scan QR codes for easy address input
- **Wallet Integration**: Connect with Petra or Martian wallets
- **Transaction History**: View all your payment history
- **Testnet Support**: Built for Aptos devnet with faucet integration

### Advanced Trading Features (from Merkle Trade)
- **Leveraged Trading**: Trade with up to 1000x leverage
- **Multiple Trading Pairs**: APT/USDC, BTC/USDC, ETH/USDC
- **Long/Short Positions**: Take both long and short positions
- **Real-time PnL**: Track your position performance
- **Risk Management**: Built-in liquidation protection

### Kana Labs Integration (Professional Trading)
- **Order Book Trading**: Professional order book interface
- **Market & Limit Orders**: Place market and limit orders
- **Real-time Market Data**: Live price feeds and market information
- **Order Management**: Track, modify, and cancel orders
- **Account Management**: Deposit, withdraw, and manage market accounts
- **Trade History**: Complete trading history and analytics
- **Advanced Charts**: OHLC data and candlestick charts

### AMM Features (from Umi Pool)
- **Token Swapping**: Swap between different tokens
- **Liquidity Provision**: Provide liquidity to earn trading fees
- **Pool Management**: View and manage liquidity pools
- **Proactive Rebalancing**: Automatic liquidity optimization
- **Fee Distribution**: Earn fees from trading volume

### Risk Hedging Features (from Neutral Alpha)
- **Portfolio Protection**: Hedge against volatility losses
- **Multiple Strategies**: Delta neutral, protective puts, covered calls, iron condors
- **Risk Metrics**: Comprehensive portfolio risk analysis
- **Automated Hedging**: Set and forget hedging strategies
- **LP Protection**: Specifically designed for liquidity providers

## 🏗️ Architecture

- **Frontend**: React Native with Expo
- **Smart Contracts**: Aptos Move modules for trading, AMM, and hedging
- **Blockchain**: Aptos testnet
- **Authentication**: Private key-based wallet connection
- **Modules**:
  - `trading.move`: Leveraged trading with up to 1000x leverage
  - `amm.move`: Automated Market Maker with liquidity pools
  - `hedging.move`: Risk hedging and portfolio protection
  - `aptospay.move`: Core payment functionality

## 📱 App Screens

The app includes multiple screens organized by functionality:

### Main Navigation
- **Home**: Balance overview and quick access to all features
- **Kana Trade**: Professional order book trading with Kana Labs
- **Trading**: Leveraged trading with up to 1000x leverage
- **AMM**: Token swapping and liquidity provision
- **Hedging**: Risk management and portfolio protection
- **Wallet**: Traditional wallet functions (send, receive, history)

### Kana Labs Trading Features
- Professional order book visualization
- Market and limit order placement
- Real-time order book depth
- Order management and cancellation
- Market account management
- Trading history and analytics
- OHLC charts and candlestick data

### Leveraged Trading Features
- Trading pair selection (APT/USDC, BTC/USDC, ETH/USDC)
- Leverage selection (1x to 1000x)
- Long/Short position types
- Real-time position tracking
- PnL monitoring

### AMM Screen Features
- Token swapping interface
- Liquidity provision management
- Pool statistics and APR
- User liquidity positions
- Fee tracking

### Hedging Screen Features
- Portfolio risk metrics
- Multiple hedging strategies
- Position hedging management
- Risk analysis dashboard

## 🛠️ Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Aptos CLI (for contract deployment)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AptosPay
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Deploy the Move contract**
   ```bash
   cd move/aptospay
   aptos move publish --package-dir . --profile dev
   ```

4. **Update contract address**
   - Copy the deployed contract address
   - Update `src/contexts/WalletContext.js` with your contract address

5. **Start the development server**
   ```bash
   npm start
   ```

## 📱 Running on Device

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Web
```bash
npm run web
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
APTOS_FAUCET_URL=https://faucet.testnet.aptoslabs.com
CONTRACT_ADDRESS=0x1  # Replace with your deployed contract address
```

### Contract Deployment

1. **Initialize Aptos CLI**
   ```bash
   aptos init
   ```

2. **Deploy the contract**
   ```bash
   aptos move publish --package-dir ./move/aptospay --profile dev
   ```

3. **Update the contract address in the app**

## 📚 Usage

### Connecting Wallet

1. Open the app
2. Tap "Connect Wallet"
3. Enter your private key (64 characters)
4. Tap "Connect"

### Kana Labs Trading

1. Navigate to the Kana Trade tab
2. Select a market (APT/USDC, BTC/USDC, etc.)
3. Choose between Market or Limit orders
4. Select Buy or Sell direction
5. Enter amount and price (for limit orders)
6. Review order details and execute
7. Monitor orders in the "My Orders" section

### Leveraged Trading

1. Navigate to the Trading tab
2. Select a trading pair (APT/USDC, BTC/USDC, ETH/USDC)
3. Choose Long or Short position
4. Select leverage (1x to 1000x)
5. Enter the amount you want to trade
6. Tap the trade button to execute
7. Monitor your position in the "Open Positions" section

### AMM Trading

1. Navigate to the AMM tab
2. Select "Swap" for token exchanges
3. Choose from/to tokens
4. Enter amount to swap
5. Review the exchange rate and fees
6. Execute the swap
7. For liquidity provision, go to "Liquidity" tab
8. Add liquidity to existing pools or create new ones

### Risk Hedging

1. Navigate to the Hedging tab
2. View your portfolio risk metrics
3. Select a hedging strategy:
   - **Delta Neutral**: Low risk, steady returns
   - **Protective Put**: Downside protection
   - **Covered Call**: Income generation
   - **Iron Condor**: Volatility trading
4. Enter the amount to hedge
5. Apply the hedge to protect your positions

### Traditional Wallet Functions

#### Sending APT
1. Navigate to Wallet > Send
2. Enter recipient address or scan QR code
3. Enter amount to send
4. Tap "Send APT"
5. Confirm the transaction

#### Receiving APT
1. Navigate to Wallet > Receive
2. Share your address or QR code
3. Wait for the sender to complete the transaction

#### Getting Test APT
1. Connect your wallet
2. Tap "Get APT" on the home screen
3. Wait for the faucet to send test tokens

## 🔒 Security

- **Private Key Storage**: Private keys are stored locally and never transmitted
- **Address Validation**: All addresses are validated before transactions
- **Amount Validation**: Amounts are validated to prevent invalid transactions
- **Transaction Confirmation**: All transactions require user confirmation

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run e2e
```

## 📦 Dependencies

### Core Dependencies
- `expo`: React Native framework
- `@aptos-labs/ts-sdk`: Aptos TypeScript SDK
- `@react-navigation/native`: Navigation
- `expo-barcode-scanner`: QR code scanning
- `react-native-qrcode-svg`: QR code generation

### Development Dependencies
- `@babel/core`: Babel transpiler
- `typescript`: TypeScript support

## 🚀 Deployment

### Mobile App

1. **Build for production**
   ```bash
   expo build:android
   expo build:ios
   ```

2. **Submit to app stores**
   - Follow Expo's deployment guide
   - Configure app store metadata

### Smart Contract

1. **Deploy to mainnet**
   ```bash
   aptos move publish --package-dir ./move/aptospay --profile mainnet
   ```

2. **Verify on Aptos Explorer**
   - Submit contract for verification
   - Update contract address in app

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the Aptos documentation
- **Issues**: Create an issue on GitHub
- **Community**: Join the Aptos Discord

## 🔮 Roadmap

### Completed Features ✅
- [x] Leveraged trading with up to 1000x leverage
- [x] AMM pools with liquidity provision
- [x] Risk hedging strategies
- [x] Advanced portfolio management
- [x] Real-time PnL tracking
- [x] Multi-token support
- [x] Kana Labs order book trading integration
- [x] Professional market data and analytics
- [x] Order management and history
- [x] Real-time price feeds and charts

### Upcoming Features 🚧
- [ ] Options trading
- [ ] Futures contracts
- [ ] Cross-chain swaps
- [ ] Advanced order types (limit, stop-loss)
- [ ] Social trading features
- [ ] Automated trading strategies
- [ ] Keyless authentication
- [ ] Push notifications
- [ ] Advanced analytics dashboard
- [ ] NFT trading integration

## 📊 Performance

- **Transaction Speed**: ~1-2 seconds
- **App Size**: ~50MB
- **Memory Usage**: ~100MB
- **Battery Impact**: Minimal

## 🐛 Known Issues

- QR code scanning may not work on all devices
- Transaction history requires Aptos Indexer API integration
- Private key input is not masked by default

## 🔄 Updates

### Version 1.0.0
- Initial release
- Basic send/receive functionality
- QR code support
- Wallet integration

---

**Built with ❤️ for the Aptos ecosystem**
#   A p t P a y 
 
 #   G i t H u b   P a g e s   D e p l o y m e n t  
 