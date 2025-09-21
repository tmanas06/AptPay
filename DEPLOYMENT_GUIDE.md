# AptosPay Deployment Guide

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v16+)
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`
- Aptos CLI: `curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3`

### 2. Installation
```bash
# Clone and setup
cd move
npm install

# Deploy contract and start app
npm run deploy
```

### 3. Development
```bash
# Start development server
npm start

# Run on specific platforms
npm run android
npm run ios
npm run web
```

## 📱 App Structure

```
AptosPay/
├── move/aptospay/           # Move smart contract
│   ├── Move.toml
│   └── sources/aptospay.move
├── src/
│   ├── contexts/            # React context providers
│   │   └── WalletContext.js
│   ├── screens/             # Main app screens
│   │   ├── HomeScreen.js
│   │   ├── SendScreen.js
│   │   ├── ReceiveScreen.js
│   │   ├── HistoryScreen.js
│   │   └── QRScannerScreen.js
│   ├── components/          # Reusable components
│   │   └── WalletConnect.js
│   └── utils/               # Helper functions
│       ├── constants.js
│       ├── helpers.js
│       └── testHelpers.js
├── scripts/
│   └── deploy.js            # Deployment script
└── App.js                   # Main app entry point
```

## 🔧 Configuration

### Contract Deployment
1. **Deploy to testnet:**
   ```bash
   cd move/aptospay
   aptos move publish --package-dir . --profile dev
   ```

2. **Update contract address:**
   - Copy the deployed address from the output
   - Update `src/contexts/WalletContext.js` line 81

### Environment Setup
Create `.env` file:
```env
APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
APTOS_FAUCET_URL=https://faucet.testnet.aptoslabs.com
CONTRACT_ADDRESS=0xYOUR_DEPLOYED_ADDRESS
```

## 🧪 Testing

### Run Validation Tests
```bash
node src/utils/testHelpers.js
```

### Test Wallet Connection
1. Generate a test private key
2. Use the faucet to get test APT
3. Test sending/receiving transactions

## 📦 Build for Production

### Android
```bash
npm run build:android
```

### iOS
```bash
npm run build:ios
```

## 🔍 Key Features Implemented

### ✅ Move Smart Contract
- **File:** `move/aptospay/sources/aptospay.move`
- **Functions:** `send`, `get_balance`, `initialize`
- **Events:** `PaymentSentEvent`, `PaymentReceivedEvent`

### ✅ React Native Frontend
- **Navigation:** Bottom tabs with stack navigation
- **Screens:** Home, Send, Receive, History, QR Scanner
- **State Management:** React Context for wallet state

### ✅ Wallet Integration
- **Authentication:** Private key-based connection
- **Balance:** Real-time APT balance display
- **Transactions:** Send APT with validation

### ✅ QR Code Support
- **Scanning:** Camera-based QR code scanner
- **Generation:** QR code for receiving addresses
- **Validation:** Aptos address format validation

### ✅ Mobile-First Design
- **UI/UX:** Modern, intuitive interface
- **Responsive:** Optimized for mobile devices
- **Accessibility:** Clear visual feedback and error handling

## 🚨 Important Notes

### Security
- Private keys are stored locally only
- All transactions require user confirmation
- Address validation prevents invalid transactions

### Network
- Currently configured for Aptos testnet
- Faucet integration for test APT
- Real-time balance updates

### Limitations
- Single token support (APT only)
- Basic transaction history (needs Indexer API)
- No keyless authentication (can be added)

## 🔄 Next Steps

1. **Deploy contract** using the provided script
2. **Update contract address** in the frontend
3. **Test the app** with testnet APT
4. **Customize UI** as needed
5. **Add features** like multi-token support

## 🆘 Troubleshooting

### Common Issues
1. **Contract deployment fails:** Check Aptos CLI installation
2. **App won't start:** Run `npm install` and check dependencies
3. **QR scanner not working:** Check camera permissions
4. **Transactions failing:** Verify contract address and network

### Debug Mode
Enable debug logging by setting `__DEV__ = true` in the app.

## 📞 Support

- **Documentation:** Check Aptos docs
- **Issues:** Create GitHub issue
- **Community:** Join Aptos Discord

---

**Built with ❤️ for the Aptos ecosystem**
