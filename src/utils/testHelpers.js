// Test helpers for AptosPay

import { 
  isValidAptosAddress, 
  isValidPrivateKey, 
  validateAmount,
  formatAddress,
  formatAmount 
} from './helpers';

/**
 * Run basic validation tests
 */
export const runValidationTests = () => {
  console.log('🧪 Running AptosPay validation tests...\n');

  // Test address validation
  const testAddresses = [
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    '0x123', // Invalid
    'invalid-address', // Invalid
    '', // Invalid
  ];

  console.log('Testing address validation:');
  testAddresses.forEach((addr, index) => {
    const isValid = isValidAptosAddress(addr);
    console.log(`  ${index + 1}. "${addr}" -> ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  });

  // Test private key validation
  const testPrivateKeys = [
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    '0x123', // Invalid
    'invalid-key', // Invalid
    '', // Invalid
  ];

  console.log('\nTesting private key validation:');
  testPrivateKeys.forEach((key, index) => {
    const isValid = isValidPrivateKey(key);
    console.log(`  ${index + 1}. "${key}" -> ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  });

  // Test amount validation
  const testAmounts = [
    '0.001',
    '1.5',
    '100',
    '0', // Invalid
    '-1', // Invalid
    'abc', // Invalid
    '1000001', // Invalid (too large)
  ];

  console.log('\nTesting amount validation:');
  testAmounts.forEach((amount, index) => {
    const result = validateAmount(amount);
    console.log(`  ${index + 1}. "${amount}" -> ${result.isValid ? '✅ Valid' : '❌ Invalid'} ${result.error || ''}`);
  });

  // Test formatting functions
  console.log('\nTesting formatting functions:');
  const testAddress = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const testAmount = 1.23456789;
  
  console.log(`  Address: "${testAddress}" -> "${formatAddress(testAddress)}"`);
  console.log(`  Amount: ${testAmount} -> "${formatAmount(testAmount)}"`);

  console.log('\n✅ All tests completed!');
};

/**
 * Test wallet connection (mock)
 */
export const testWalletConnection = () => {
  console.log('🔗 Testing wallet connection...');
  
  // Mock private key for testing
  const mockPrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  
  if (isValidPrivateKey(mockPrivateKey)) {
    console.log('✅ Private key validation passed');
  } else {
    console.log('❌ Private key validation failed');
  }
  
  console.log('✅ Wallet connection test completed!');
};

/**
 * Test transaction validation
 */
export const testTransactionValidation = () => {
  console.log('💸 Testing transaction validation...');
  
  const testCases = [
    {
      recipient: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      amount: '1.5',
      expected: true
    },
    {
      recipient: 'invalid-address',
      amount: '1.5',
      expected: false
    },
    {
      recipient: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      amount: '0',
      expected: false
    },
    {
      recipient: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      amount: '1000001',
      expected: false
    }
  ];
  
  testCases.forEach((testCase, index) => {
    const addressValid = isValidAptosAddress(testCase.recipient);
    const amountResult = validateAmount(testCase.amount);
    const isValid = addressValid && amountResult.isValid;
    
    console.log(`  ${index + 1}. Recipient: ${testCase.recipient.slice(0, 16)}..., Amount: ${testCase.amount} -> ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  });
  
  console.log('✅ Transaction validation test completed!');
};

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runValidationTests();
  testWalletConnection();
  testTransactionValidation();
}
