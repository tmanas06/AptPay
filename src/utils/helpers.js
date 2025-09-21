// AptosPay Helper Functions

import { VALIDATION, APTOS_DECIMALS, OCTA_TO_APT } from './constants';

/**
 * Validates an Aptos address
 * @param {string} address - The address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidAptosAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  
  // Remove 0x prefix if present
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  
  // Check length and hex format
  return cleanAddress.length === VALIDATION.APTOS_ADDRESS_LENGTH && 
         /^[0-9a-fA-F]+$/.test(cleanAddress);
};

/**
 * Validates a private key
 * @param {string} privateKey - The private key to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidPrivateKey = (privateKey) => {
  if (!privateKey || typeof privateKey !== 'string') return false;
  
  // Remove 0x prefix if present
  const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  
  // Check length and hex format
  return cleanKey.length === VALIDATION.PRIVATE_KEY_LENGTH && 
         /^[0-9a-fA-F]+$/.test(cleanKey);
};

/**
 * Validates an amount
 * @param {string|number} amount - The amount to validate
 * @returns {object} - { isValid: boolean, value: number, error: string }
 */
export const validateAmount = (amount) => {
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    return { isValid: false, value: 0, error: 'Invalid amount' };
  }
  
  if (numAmount < VALIDATION.MIN_AMOUNT) {
    return { isValid: false, value: numAmount, error: 'Amount too small' };
  }
  
  if (numAmount > VALIDATION.MAX_AMOUNT) {
    return { isValid: false, value: numAmount, error: 'Amount too large' };
  }
  
  return { isValid: true, value: numAmount, error: null };
};

/**
 * Converts APT to octas (smallest unit)
 * @param {number} aptAmount - Amount in APT
 * @returns {number} - Amount in octas
 */
export const aptToOctas = (aptAmount) => {
  return Math.floor(aptAmount * OCTA_TO_APT);
};

/**
 * Converts octas to APT
 * @param {number} octas - Amount in octas
 * @returns {number} - Amount in APT
 */
export const octasToApt = (octas) => {
  return octas / OCTA_TO_APT;
};

/**
 * Formats an address for display
 * @param {string} address - The address to format
 * @param {number} startLength - Number of characters to show at start
 * @param {number} endLength - Number of characters to show at end
 * @returns {string} - Formatted address
 */
export const formatAddress = (address, startLength = 8, endLength = 8) => {
  if (!address) return '';
  
  if (address.length <= startLength + endLength) {
    return address;
  }
  
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

/**
 * Formats an amount for display
 * @param {number} amount - The amount to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted amount
 */
export const formatAmount = (amount, decimals = 4) => {
  if (isNaN(amount)) return '0.0000';
  
  return amount.toFixed(decimals);
};

/**
 * Formats a transaction hash for display
 * @param {string} hash - The transaction hash
 * @param {number} length - Number of characters to show
 * @returns {string} - Formatted hash
 */
export const formatTransactionHash = (hash, length = 16) => {
  if (!hash) return '';
  
  if (hash.length <= length) {
    return hash;
  }
  
  return `${hash.slice(0, length)}...`;
};

/**
 * Generates a random ID
 * @param {number} length - Length of the ID
 * @returns {string} - Random ID
 */
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Debounces a function
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Throttles a function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  
  return (...args) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Sleeps for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after the delay
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retries a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} retries - Number of retries
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} - Promise that resolves with the result
 */
export const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await sleep(delay);
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * Checks if a string is a valid hex string
 * @param {string} str - String to check
 * @returns {boolean} - True if valid hex, false otherwise
 */
export const isHexString = (str) => {
  return /^[0-9a-fA-F]+$/.test(str);
};

/**
 * Converts a hex string to Uint8Array
 * @param {string} hex - Hex string to convert
 * @returns {Uint8Array} - Converted bytes
 */
export const hexToBytes = (hex) => {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  
  return bytes;
};

/**
 * Converts a Uint8Array to hex string
 * @param {Uint8Array} bytes - Bytes to convert
 * @returns {string} - Hex string
 */
export const bytesToHex = (bytes) => {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};
