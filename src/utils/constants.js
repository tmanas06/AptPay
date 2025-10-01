// AptosPay Constants

export const APTOS_CONFIG = {
  NODE_URL: 'https://fullnode.devnet.aptoslabs.com/v1',
  FAUCET_URL: 'https://faucet.devnet.aptoslabs.com',
  EXPLORER_URL: 'https://explorer.aptoslabs.com',
};

export const CONTRACT_CONFIG = {
  MODULE_NAME: 'AptosPay',
  FUNCTION_NAME: 'send',
  // Update this with your deployed contract address
  CONTRACT_ADDRESS: '0xa561992c5d672fc0d6eb59c2ccf8fe1b445a9229f023498b14521a8f9fa4dd9a', // Replace with actual deployed address
  
  // Smart Contract Modules
  TRADING_MODULE: 'trading',
  AMM_MODULE: 'amm',
  HEDGING_MODULE: 'hedging',
  ORACLE_MODULE: 'oracle',
  
  // Trading Configuration
  MAX_LEVERAGE: 1000,
  MIN_TRADE_SIZE: 1000000, // 0.01 APT
  DEFAULT_FEE_RATE: 30, // 0.3%
  
  // AMM Configuration
  DEFAULT_SWAP_FEE: 30, // 0.3%
  PROTOCOL_FEE: 10, // 0.1%
  MINIMUM_LIQUIDITY: 1000000,
  
  // Hedging Configuration
  MAX_HEDGE_POSITIONS: 10,
  DEFAULT_RISK_TOLERANCE: 1, // Medium risk
};

export const TRANSACTION_CONFIG = {
  MAX_RETRIES: 3,
  TIMEOUT: 30000, // 30 seconds
  GAS_UNIT_PRICE: 100,
  MAX_GAS_AMOUNT: 1000,
};

export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  REFRESH_INTERVAL: 10000, // 10 seconds
};

export const VALIDATION = {
  APTOS_ADDRESS_LENGTH: 64,
  PRIVATE_KEY_LENGTH: 64,
  MIN_AMOUNT: 0.000001, // 1 octa
  MAX_AMOUNT: 1000000, // 1M APT
};

export const COLORS = {
  PRIMARY: '#007AFF',
  SUCCESS: '#34C759',
  ERROR: '#FF3B30',
  WARNING: '#FF9500',
  INFO: '#5AC8FA',
  BACKGROUND: '#F5F5F5',
  CARD: '#FFFFFF',
  TEXT: '#333333',
  TEXT_SECONDARY: '#666666',
  BORDER: '#DDDDDD',
};

export const SCREENS = {
  HOME: 'Home',
  SEND: 'Send',
  RECEIVE: 'Receive',
  HISTORY: 'History',
  QR_SCANNER: 'QRScanner',
};

export const EVENTS = {
  WALLET_CONNECTED: 'wallet_connected',
  WALLET_DISCONNECTED: 'wallet_disconnected',
  TRANSACTION_SENT: 'transaction_sent',
  TRANSACTION_RECEIVED: 'transaction_received',
  BALANCE_UPDATED: 'balance_updated',
};

export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Wallet not connected',
  INVALID_ADDRESS: 'Invalid Aptos address',
  INVALID_AMOUNT: 'Invalid amount',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  TRANSACTION_FAILED: 'Transaction failed',
  NETWORK_ERROR: 'Network error',
  UNKNOWN_ERROR: 'An unknown error occurred',
};

export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  TRANSACTION_SENT: 'Transaction sent successfully',
  ADDRESS_COPIED: 'Address copied to clipboard',
  BALANCE_UPDATED: 'Balance updated',
};

export const APTOS_DECIMALS = 8; // APT has 8 decimal places
export const OCTA_TO_APT = Math.pow(10, APTOS_DECIMALS);
