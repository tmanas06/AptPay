# AptPay Technical Documentation

## 🏗️ Architecture Overview

### Tech Stack

**Frontend Framework:**
- React Native 0.72
- Expo SDK ~49.0.0
- React Navigation 6.x

**Blockchain Integration:**
- Aptos SDK (@aptos-labs/ts-sdk ^5.0.0)
- Wallet Adapter (@aptos-labs/wallet-adapter-react ^1.0.0)

**State Management:**
- React Context API
- Custom hooks (useWallet, useTheme)

**Styling:**
- React Native StyleSheet
- Cross-platform theming system
- Web-compatible shadows (boxShadow)

**Development Tools:**
- TypeScript 5.1.3
- Babel 7.20.0
- Webpack 5.88.0 (web builds)
- Metro (native builds)

---

## 📁 Project Structure

```
AptPay/
├── App.js                      # Main app entry with navigation
├── app.json                    # Expo configuration
├── babel.config.js             # Babel configuration
├── metro.config.js             # Metro bundler config
├── webpack.config.js           # Webpack config for web
├── tsconfig.json               # TypeScript configuration
│
├── assets/                     # Static assets
│   └── favicon.png            # App favicon
│
├── move/                       # Smart contracts
│   └── aptospay/
│       ├── Move.toml          # Move package config
│       └── sources/
│           └── aptospay.move  # Main contract
│
├── scripts/                    # Build & utility scripts
│   ├── deploy.js              # Contract deployment
│   ├── start-web.js           # Web server with cache clearing
│   ├── restart-dev.js         # Dev server restart
│   ├── update-theme-screens.js # Theme update automation
│   └── fix-theme-hooks.js     # Theme hook fixes
│
└── src/                        # Source code
    ├── components/            # Reusable components
    │   ├── WalletConnect.js   # Wallet connection modal
    │   ├── ThemeToggle.js     # Dark/Light mode toggle
    │   └── LoadingSpinner.js  # Loading indicators
    │
    ├── contexts/              # React contexts
    │   ├── WalletContext.js   # Wallet state management
    │   └── ThemeContext.js    # Theme state management
    │
    ├── screens/               # App screens
    │   ├── HomeScreen.js      # Main dashboard
    │   ├── TradingScreen.js   # Leveraged trading
    │   ├── AMMScreen.js       # Token swapping & liquidity
    │   ├── HedgingScreen.js   # Risk management
    │   ├── KanaTradingScreen.js    # Order book trading
    │   ├── MarketDataScreen.js     # Market analytics
    │   ├── OrderManagementScreen.js # Order tracking
    │   ├── SendScreen.js      # Send tokens
    │   ├── ReceiveScreen.js   # Receive tokens
    │   ├── HistoryScreen.js   # Transaction history
    │   └── QRScannerScreen.js # QR code scanning
    │
    └── utils/                 # Utility functions
        ├── constants.js       # App constants
        ├── helpers.js         # Helper functions
        └── testHelpers.js     # Test utilities
```

---

## 🔧 Core Systems

### 1. Wallet Management (WalletContext)

**Location:** `src/contexts/WalletContext.js`

**State Management:**
```javascript
{
  account: Object | null,           // Connected wallet account
  balance: Number,                  // APT balance
  isConnected: Boolean,             // Connection status
  loading: Boolean,                 // Loading state
  error: String | null,             // Error messages
  walletName: String,               // Wallet type (Petra/Martian)
}
```

**Key Functions:**
```javascript
connectWallet(walletType)         // Connect to wallet
disconnectWallet()                 // Disconnect wallet
getBalance(address)                // Fetch balance
sendTransaction(recipient, amount) // Send tokens
requestFaucet()                    // Request devnet tokens
```

**Implementation Details:**

**Non-Blocking Connection:**
```javascript
// Optimized wallet restoration
useEffect(() => {
  const restoreConnection = async () => {
    // Set basic state immediately
    setIsConnected(true);
    setWalletName(savedWallet);
    setAccount(basicAccount);
    
    // Fetch wallet API in background
    setTimeout(async () => {
      const walletApi = await getWalletApi();
      setAccount(prev => ({ ...prev, walletApi }));
      await getBalance();
    }, 100);
  };
  
  restoreConnection();
}, []);
```

**Connection Timeout:**
```javascript
// Prevent hanging connections
const response = await Promise.race([
  window.aptos.connect(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 10000)
  )
]);
```

**Cross-Platform Storage:**
```javascript
// Web: localStorage
localStorage.setItem('aptospay_connected', 'true');

// Native: AsyncStorage
await AsyncStorage.setItem('aptospay_connected', 'true');
```

### 2. Theme System (ThemeContext)

**Location:** `src/contexts/ThemeContext.js`

**Theme Object Structure:**
```javascript
{
  isDarkMode: Boolean,
  toggleTheme: Function,
  colors: {
    // Brand colors
    primary: String,
    secondary: String,
    accent1-5: String,
    
    // Background colors
    background: String,
    surface: String,
    card: String,
    
    // Text colors
    text: String,
    textSecondary: String,
    textInverse: String,
    
    // UI colors
    border: String,
    notification: String,
    success: String,
    warning: String,
    info: String,
    overlay: String,
    
    // Semantic colors
    green: String,
    red: String,
    blue: String,
    orange: String,
    purple: String,
  },
  shadows: {
    sm: Object,  // Platform-specific
    md: Object,
    lg: Object,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  }
}
```

**Platform-Specific Shadows:**
```javascript
// Web
shadows: {
  sm: {
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  }
}

// Native
shadows: {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  }
}
```

**Storage Strategy:**
```javascript
// Cross-platform storage helper
const storage = {
  async getItem(key) {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem(key);
    }
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, value);
    }
  }
};
```

### 3. Navigation System

**Structure:**
```javascript
App
└── ThemeProvider
    └── AptosWalletProvider
        └── NavigationContainer
            └── Tab.Navigator (Bottom Tabs)
                ├── Home Screen
                ├── KanaTrade Stack
                │   ├── KanaTradingScreen
                │   ├── MarketDataScreen
                │   └── OrderManagementScreen
                ├── Trading Screen
                ├── AMM Screen
                ├── Hedging Screen
                └── Wallet Stack
                    ├── SendScreen
                    ├── ReceiveScreen
                    ├── HistoryScreen
                    └── QRScannerScreen
```

**Tab Configuration:**
```javascript
<Tab.Navigator
  screenOptions={({ route }) => ({
    tabBarIcon: ({ focused, color, size }) => {
      const iconName = getIconName(route.name, focused);
      return <Ionicons name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textSecondary,
    headerShown: false,
    tabBarStyle: {
      height: 60,
      paddingBottom: 8,
      paddingTop: 8,
      backgroundColor: colors.tabBarBackground,
      borderTopColor: colors.tabBarBorder,
    },
  })}
>
```

---

## 🔌 API Integration

### Aptos SDK Integration

**Client Initialization:**
```javascript
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(config);
```

**Transaction Building:**
```javascript
const transaction = await aptos.transaction.build.simple({
  sender: account.address,
  data: {
    function: "0x1::aptos_account::transfer",
    functionArguments: [recipient, amount],
  },
});
```

**Transaction Signing & Submission:**
```javascript
// Sign with wallet
const signedTx = await walletApi.signTransaction(transaction);

// Submit to blockchain
const response = await aptos.transaction.submit.simple(signedTx);

// Wait for confirmation
await aptos.waitForTransaction({ 
  transactionHash: response.hash 
});
```

### Kana Labs API Integration

**Base Configuration:**
```javascript
const KANA_API_BASE = 'https://api.kana.labs';
const KANA_ENDPOINTS = {
  registeredMarkets: '/registered_markets',
  availableMarkets: '/available_markets',
  pairInfo: '/pair_info',
  orderHistory: '/order_history',
  marketPrice: '/market_price',
  placeOrder: '/place_order',
  // ... more endpoints
};
```

**API Calls:**
```javascript
// Fetch market data
const fetchMarkets = async () => {
  const response = await axios.get(
    `${KANA_API_BASE}${KANA_ENDPOINTS.availableMarkets}`
  );
  return response.data;
};

// Place order
const placeOrder = async (orderData) => {
  const response = await axios.post(
    `${KANA_API_BASE}${KANA_ENDPOINTS.placeOrder}`,
    orderData
  );
  return response.data;
};
```

---

## 🎨 Styling System

### Theme-Aware Styling Pattern

**Basic Pattern:**
```javascript
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { colors, shadows } = useTheme();
  
  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: colors.background,
        ...shadows.md 
      }
    ]}>
      <Text style={[styles.text, { color: colors.text }]}>
        Hello
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### Responsive Design

**Screen Dimensions:**
```javascript
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  card: {
    width: (width - 44) / 2, // 2 cards per row
    marginBottom: 12,
  },
});
```

**Platform-Specific Styles:**
```javascript
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
});
```

---

## 🔐 Security Implementation

### Address Validation

```javascript
const validateAddress = (address) => {
  // Remove 0x prefix if present
  const cleanAddress = address.startsWith('0x') 
    ? address.slice(2) 
    : address;
  
  // Check length and format
  const aptosAddressRegex = /^[0-9a-fA-F]{64}$/;
  return aptosAddressRegex.test(cleanAddress);
};
```

### Transaction Signing

```javascript
const sendTransaction = async (recipient, amount) => {
  // Validate inputs
  if (!validateAddress(recipient)) {
    throw new Error('Invalid address');
  }
  
  if (amount <= 0 || amount > balance) {
    throw new Error('Invalid amount');
  }
  
  // Build transaction
  const transaction = await buildTransaction(recipient, amount);
  
  // Sign with wallet (user confirmation required)
  const signedTx = await walletApi.signTransaction(transaction);
  
  // Submit to blockchain
  const response = await submitTransaction(signedTx);
  
  return response;
};
```

### Error Handling

```javascript
try {
  await sendTransaction(recipient, amount);
  Alert.alert('Success', 'Transaction sent');
} catch (error) {
  if (error.message.includes('insufficient funds')) {
    Alert.alert('Error', 'Insufficient balance');
  } else if (error.message.includes('user rejected')) {
    Alert.alert('Info', 'Transaction cancelled');
  } else {
    Alert.alert('Error', 'Transaction failed');
  }
  console.error('Transaction error:', error);
}
```

---

## 🚀 Performance Optimizations

### 1. Lazy Loading

```javascript
// Lazy load heavy screens
const TradingScreen = React.lazy(() => 
  import('./screens/TradingScreen')
);

const AMMScreen = React.lazy(() => 
  import('./screens/AMMScreen')
);
```

### 2. Memoization

```javascript
import { useMemo, useCallback } from 'react';

const MyComponent = ({ data }) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => expensiveOperation(item));
  }, [data]);
  
  // Memoize callbacks
  const handlePress = useCallback(() => {
    doSomething(processedData);
  }, [processedData]);
  
  return <View>...</View>;
};
```

### 3. Optimized Wallet Connection

```javascript
// Non-blocking restoration
setTimeout(async () => {
  const walletApi = await getWalletApi();
  await getBalance();
}, 100); // Small delay to not block UI
```

### 4. Debounced Updates

```javascript
import { useEffect, useState } from 'react';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

// Usage
const debouncedAmount = useDebounce(amount, 500);
useEffect(() => {
  calculateSwapAmount(debouncedAmount);
}, [debouncedAmount]);
```

---

## 🧪 Testing

### Unit Testing Pattern

```javascript
import { renderHook, act } from '@testing-library/react-hooks';
import { useWallet } from '../contexts/WalletContext';

describe('useWallet', () => {
  it('connects wallet successfully', async () => {
    const { result } = renderHook(() => useWallet());
    
    await act(async () => {
      await result.current.connectWallet('petra');
    });
    
    expect(result.current.isConnected).toBe(true);
    expect(result.current.account).toBeDefined();
  });
});
```

### Component Testing

```javascript
import { render, fireEvent } from '@testing-library/react-native';
import SendScreen from '../screens/SendScreen';

describe('SendScreen', () => {
  it('validates address correctly', () => {
    const { getByPlaceholderText, getByText } = render(<SendScreen />);
    
    const addressInput = getByPlaceholderText('Recipient Address');
    fireEvent.changeText(addressInput, 'invalid');
    
    const sendButton = getByText('Send');
    fireEvent.press(sendButton);
    
    expect(getByText('Invalid address')).toBeDefined();
  });
});
```

---

## 📦 Build & Deployment

### Development

```bash
# Start Expo dev server
npm start

# Start web
npm run web

# Start Android
npm run android

# Start iOS
npm run ios
```

### Web Build

```bash
# Clear cache and build
npm run web:clean

# Production build
expo build:web
```

### Native Build

```bash
# Android
npm run build:android

# iOS
npm run build:ios
```

### Smart Contract Deployment

```bash
# Compile Move contracts
cd move/aptospay
aptos move compile

# Deploy to devnet
node scripts/deploy.js
```

---

## 🔍 Debugging

### Enable Debug Mode

```javascript
// In App.js
const __DEV__ = process.env.NODE_ENV !== 'production';

if (__DEV__) {
  console.log('Debug mode enabled');
  // Enable React Native Debugger
  require('react-devtools');
}
```

### Wallet Debug Info

```javascript
const { account, isConnected, walletName } = useWallet();

useEffect(() => {
  if (__DEV__) {
    console.log('Wallet Debug:', {
      connected: isConnected,
      address: account?.accountAddress?.toString(),
      walletType: walletName,
    });
  }
}, [isConnected, account, walletName]);
```

### Network Debug

```javascript
const debugTransaction = async (hash) => {
  const tx = await aptos.getTransaction({ transactionHash: hash });
  console.log('Transaction Debug:', {
    hash,
    status: tx.success,
    gasUsed: tx.gas_used,
    vmStatus: tx.vm_status,
  });
};
```

---

## 🔄 State Flow Diagrams

### Wallet Connection Flow

```
User Clicks Connect
        ↓
Check Wallet Installed
        ↓
    [Yes] → Request Connection
        ↓         ↓
    [Approved]  [Rejected]
        ↓         ↓
    Get Account  Show Error
        ↓
    Fetch Balance
        ↓
    Update State
        ↓
    Store in localStorage
```

### Transaction Flow

```
User Initiates Transaction
        ↓
Validate Inputs
        ↓
Build Transaction
        ↓
Request Wallet Signature
        ↓
User Confirms in Wallet
        ↓
Submit to Blockchain
        ↓
Wait for Confirmation
        ↓
Update UI & Balance
        ↓
Show Success Message
```

---

## 📚 API Reference

### WalletContext API

```typescript
interface WalletContextType {
  // State
  account: Account | null;
  balance: number;
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  walletName: string;
  
  // Actions
  connectWallet: (walletType?: string) => Promise<void>;
  disconnectWallet: () => void;
  getBalance: (address: string) => Promise<void>;
  sendTransaction: (recipient: string, amount: number) => Promise<any>;
  requestFaucet: () => Promise<void>;
}
```

### ThemeContext API

```typescript
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => Promise<void>;
  colors: ColorPalette;
  shadows: ShadowStyles;
  spacing: SpacingScale;
  borderRadius: BorderRadiusScale;
}

interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  // ... more colors
}
```

---

## 🎯 Best Practices

### Code Organization

```javascript
// 1. Imports
import React from 'react';
import { View, Text } from 'react-native';

// 2. Types/Interfaces
interface Props {
  title: string;
}

// 3. Constants
const MAX_RETRIES = 3;

// 4. Component
const MyComponent: React.FC<Props> = ({ title }) => {
  // 5. Hooks
  const { colors } = useTheme();
  
  // 6. State
  const [value, setValue] = useState(0);
  
  // 7. Effects
  useEffect(() => {
    // ...
  }, []);
  
  // 8. Handlers
  const handlePress = () => {
    // ...
  };
  
  // 9. Render
  return <View>...</View>;
};

// 10. Styles
const styles = StyleSheet.create({
  // ...
});

// 11. Export
export default MyComponent;
```

### Error Handling

```javascript
const handleAsyncOperation = async () => {
  try {
    setLoading(true);
    const result = await asyncOperation();
    setData(result);
  } catch (error) {
    console.error('Operation failed:', error);
    setError(error.message);
    Alert.alert('Error', 'Operation failed');
  } finally {
    setLoading(false);
  }
};
```

---

**Version:** 1.0.0  
**Last Updated:** October 1, 2025  
**Maintained By:** AptPay Development Team

