# 🚀 AptosPay Smart Contracts

Comprehensive DeFi smart contracts built for the Aptos blockchain, featuring advanced trading, AMM functionality, risk hedging, and price oracles.

## 📋 Contract Overview

### 🏗️ Architecture

The smart contract system consists of four main modules:

1. **Trading Contract** (`trading.move`) - Leveraged trading with up to 1000x leverage
2. **AMM Contract** (`amm.move`) - Automated Market Maker with liquidity pools
3. **Hedging Contract** (`hedging.move`) - Risk management and portfolio protection
4. **Oracle Contract** (`oracle.move`) - Price feeds and market data

### 🔧 Key Features

- **Multi-Module Design**: Modular architecture for easy maintenance and upgrades
- **Comprehensive Error Handling**: Detailed error codes and validation
- **Admin Controls**: Secure admin functions for system management
- **Real-time Data**: Live price feeds and market data
- **Risk Management**: Built-in liquidation and risk controls
- **Fee System**: Configurable fees for all operations

## 📊 Trading Contract (`trading.move`)

### Features
- **Leveraged Trading**: Up to 1000x leverage on multiple trading pairs
- **Position Management**: Long/short positions with real-time PnL tracking
- **Risk Controls**: Automatic liquidation and margin requirements
- **Multiple Pairs**: APT/USDC, BTC/USDC, ETH/USDC support
- **Real-time Pricing**: Live price updates from oracle

### Key Functions
```move
// Open a new trading position
public entry fun open_position(
    user: &signer,
    trading_pair: String,
    position_type: u8, // 0 = long, 1 = short
    size: u64,
    leverage: u64,
    margin: u64,
)

// Close an existing position
public entry fun close_position(
    user: &signer,
    position_id: u64,
)

// Liquidate a position (admin only)
public entry fun liquidate_position(
    admin: &signer,
    position_id: u64,
)
```

### Trading Pairs
- **APT/USDC**: Base Aptos token trading
- **BTC/USDC**: Bitcoin perpetual futures
- **ETH/USDC**: Ethereum perpetual futures

### Risk Parameters
- **Max Leverage**: 1000x
- **Maintenance Margin**: 5%
- **Liquidation Threshold**: 8%
- **Min Trade Size**: 0.01 tokens

## 💧 AMM Contract (`amm.move`)

### Features
- **Token Swapping**: Instant token exchanges with minimal slippage
- **Liquidity Provision**: Earn fees by providing liquidity
- **Pool Management**: Create and manage liquidity pools
- **Fee Distribution**: Automatic fee distribution to liquidity providers
- **Price Discovery**: Automated price discovery through constant product formula

### Key Functions
```move
// Add liquidity to a pool
public entry fun add_liquidity(
    user: &signer,
    pool_id: u64,
    amount0: u64,
    amount1: u64,
    min_liquidity: u64,
)

// Swap tokens
public entry fun swap_tokens(
    user: &signer,
    pool_id: u64,
    token_in: String,
    amount_in: u64,
    min_amount_out: u64,
    deadline: u64,
)

// Remove liquidity
public entry fun remove_liquidity(
    user: &signer,
    position_id: u64,
    liquidity_amount: u64,
)
```

### Pool Configuration
- **Default Fee Rate**: 0.3%
- **Protocol Fee**: 0.1%
- **Minimum Liquidity**: 0.000001 tokens
- **Supported Pairs**: APT/USDC, BTC/USDC, ETH/USDC

## 🛡️ Hedging Contract (`hedging.move`)

### Features
- **Multiple Strategies**: 6 different hedging strategies
- **Risk Management**: Portfolio protection and risk metrics
- **Automated Hedging**: Set-and-forget hedging positions
- **Premium System**: Pay premiums for protection
- **Auto-Renewal**: Automatic position renewal

### Hedging Strategies

#### 1. Delta Neutral
- **Risk Level**: Low
- **Description**: Hedge against price movements using options
- **Expected Return**: 5-8%
- **Fee Rate**: 0.5%

#### 2. Protective Put
- **Risk Level**: Medium
- **Description**: Protect against downside risk
- **Expected Return**: 8-12%
- **Fee Rate**: 0.75%

#### 3. Covered Call
- **Risk Level**: Medium
- **Description**: Income generation strategy
- **Expected Return**: 6-10%
- **Fee Rate**: 0.6%

#### 4. Iron Condor
- **Risk Level**: High
- **Description**: Volatility trading strategy
- **Expected Return**: 10-20%
- **Fee Rate**: 1%

#### 5. Collar
- **Risk Level**: Low
- **Description**: Combined protective put and covered call
- **Expected Return**: 4-7%
- **Fee Rate**: 0.8%

#### 6. Stop Loss
- **Risk Level**: Low
- **Description**: Automated stop loss protection
- **Expected Return**: Break-even to 2%
- **Fee Rate**: 0.25%

### Key Functions
```move
// Create a hedge position
public entry fun create_hedge(
    user: &signer,
    strategy_id: u8,
    underlying_asset: String,
    hedge_amount: u64,
    strike_price: u64,
    expiry_days: u64,
    auto_renew: bool,
)

// Close a hedge position
public entry fun close_hedge(
    user: &signer,
    position_id: u64,
)

// Update risk metrics
public entry fun update_risk_metrics(
    user: &signer,
    portfolio_value: u64,
    delta_exposure: i64,
    volatility: u64,
)
```

## 📈 Oracle Contract (`oracle.move`)

### Features
- **Real-time Prices**: Live price feeds for all supported assets
- **Multiple Sources**: Aggregated prices from multiple oracle feeds
- **Price Validation**: Deviation checks and confidence scoring
- **Historical Data**: 24h and 7d price change tracking
- **Market Data**: Volume, market cap, and trading statistics

### Supported Assets
- **APT**: Aptos native token
- **BTC**: Bitcoin
- **ETH**: Ethereum
- **USDC**: USD Coin

### Price Data Structure
```move
struct PriceData has store {
    symbol: String,
    price: u64, // Scaled by 1e6
    timestamp: u64,
    volume_24h: u64,
    price_change_24h: i64, // in basis points
    price_change_7d: i64, // in basis points
    market_cap: u64,
    confidence: u64, // 0-100
}
```

### Oracle Configuration
- **Min Feeds**: 2-3 feeds required per asset
- **Max Age**: 3-10 minutes depending on asset
- **Max Deviation**: 0.5-5% between feeds
- **Confidence Scoring**: 0-100 based on feed quality

## 🚀 Deployment

### Prerequisites
1. **Aptos CLI**: Install from [aptos.dev](https://aptos.dev)
2. **Node.js**: v16 or higher
3. **Devnet Account**: Initialize with `aptos init`

### Quick Deployment
```bash
# Deploy all contracts
npm run deploy-contracts

# Or manually
cd move/aptospay
aptos move publish --package-dir . --profile dev
```

### Manual Deployment Steps
```bash
# 1. Initialize Aptos profile
aptos init

# 2. Compile contracts
aptos move compile --package-dir .

# 3. Test contracts
aptos move test --package-dir .

# 4. Deploy to devnet
aptos move publish --package-dir . --profile dev

# 5. Initialize modules
aptos move run --function-id <CONTRACT_ADDRESS>::trading::initialize --profile dev
aptos move run --function-id <CONTRACT_ADDRESS>::amm::initialize --profile dev
aptos move run --function-id <CONTRACT_ADDRESS>::hedging::initialize --profile dev
aptos move run --function-id <CONTRACT_ADDRESS>::oracle::initialize --profile dev
```

## 🔧 Configuration

### Contract Addresses
Update the contract address in:
- `src/utils/constants.js`
- `src/services/SmartContractService.js`

### Network Configuration
```javascript
const APTOS_CONFIG = {
  NODE_URL: 'https://fullnode.devnet.aptoslabs.com/v1',
  FAUCET_URL: 'https://faucet.devnet.aptoslabs.com',
  EXPLORER_URL: 'https://explorer.aptoslabs.com',
};
```

### Fee Configuration
- **Trading Fees**: 0.3% default
- **AMM Fees**: 0.3% swap, 0.1% protocol
- **Hedging Fees**: 0.25% - 1% depending on strategy
- **Oracle Fees**: Free for viewing

## 📊 Usage Examples

### Opening a Trading Position
```javascript
import SmartContractService from '../services/SmartContractService';

// Open a long position with 10x leverage
await SmartContractService.openPosition(
  'APT/USDC',    // Trading pair
  0,             // Position type (0 = long)
  1000000000,    // Size (1 APT)
  10,            // Leverage (10x)
  84500000       // Margin (0.845 USDC)
);
```

### Adding Liquidity to AMM
```javascript
// Add liquidity to APT/USDC pool
await SmartContractService.addLiquidity(
  1,              // Pool ID
  1000000000,     // APT amount (1 APT)
  8450000000,     // USDC amount (8.45 USDC)
  1000000         // Min liquidity tokens
);
```

### Creating a Hedge Position
```javascript
// Create protective put hedge
await SmartContractService.createHedge(
  1,              // Strategy ID (Protective Put)
  'APT',          // Underlying asset
  1000000000,     // Hedge amount (1 APT)
  80000000,       // Strike price ($8.00)
  30,             // Expiry days
  false           // Auto-renew
);
```

### Getting Price Data
```javascript
// Get current APT price
const priceData = await SmartContractService.getPriceData('APT');
console.log('APT Price:', SmartContractService.formatPrice(priceData.price));
console.log('24h Change:', priceData.priceChange24h / 100, '%');
```

## 🔒 Security Features

### Access Control
- **Admin Functions**: Restricted to contract deployer
- **User Functions**: Public with proper validation
- **Emergency Controls**: Pause/unpause functionality

### Risk Management
- **Liquidation System**: Automatic position liquidation
- **Margin Requirements**: Minimum margin enforcement
- **Price Validation**: Oracle price deviation checks
- **Position Limits**: Maximum positions per user

### Error Handling
- **Comprehensive Errors**: Detailed error codes
- **Input Validation**: All inputs validated
- **State Checks**: Contract state validation
- **Graceful Failures**: Safe error recovery

## 📈 Performance

### Gas Optimization
- **Efficient Storage**: Optimized data structures
- **Batch Operations**: Multiple operations in single transaction
- **View Functions**: Gas-free data reading
- **Minimal Loops**: Optimized iteration patterns

### Scalability
- **Modular Design**: Independent module upgrades
- **State Separation**: Isolated user states
- **Batch Processing**: Multiple operations support
- **Oracle Integration**: External data sources

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Individual function testing
- **Integration Tests**: End-to-end workflows
- **Edge Cases**: Boundary condition testing
- **Security Tests**: Access control validation

### Test Commands
```bash
# Run all tests
npm run test-contracts

# Run specific module tests
aptos move test --filter trading
aptos move test --filter amm
aptos move test --filter hedging
aptos move test --filter oracle
```

## 📚 API Reference

### Trading Module
- `open_position()` - Open new trading position
- `close_position()` - Close existing position
- `liquidate_position()` - Liquidate undercollateralized position
- `get_position()` - Get position details
- `get_market_data()` - Get market price data

### AMM Module
- `add_liquidity()` - Add liquidity to pool
- `remove_liquidity()` - Remove liquidity from pool
- `swap_tokens()` - Swap tokens in pool
- `get_pool_info()` - Get pool information
- `get_swap_quote()` - Get swap quote

### Hedging Module
- `create_hedge()` - Create hedge position
- `close_hedge()` - Close hedge position
- `update_risk_metrics()` - Update portfolio risk
- `get_hedge_position()` - Get hedge details
- `get_hedging_strategy()` - Get strategy info

### Oracle Module
- `get_price()` - Get current price
- `get_price_data()` - Get detailed price data
- `get_all_symbols()` - Get supported assets
- `is_price_fresh()` - Check price freshness

## 🔄 Updates & Maintenance

### Version Control
- **Semantic Versioning**: Clear version numbering
- **Backward Compatibility**: Maintained where possible
- **Migration Scripts**: Automated upgrades
- **Documentation**: Updated with each release

### Monitoring
- **Transaction Monitoring**: Track all contract calls
- **Error Tracking**: Monitor and log errors
- **Performance Metrics**: Gas usage and execution time
- **Security Audits**: Regular security reviews

## 📞 Support

### Documentation
- **API Docs**: Complete function reference
- **Examples**: Code samples and tutorials
- **Troubleshooting**: Common issues and solutions
- **Best Practices**: Recommended usage patterns

### Community
- **GitHub Issues**: Bug reports and feature requests
- **Discord**: Real-time community support
- **Telegram**: Announcements and updates
- **Twitter**: News and updates

---

**Built with ❤️ for the Aptos ecosystem**

*These smart contracts provide a complete DeFi infrastructure for trading, liquidity provision, risk management, and price discovery on the Aptos blockchain.*
