#!/usr/bin/env node

/**
 * Deployment script for AptosPay
 * This script helps deploy the Move contract and update the frontend configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONTRACT_DIR = './move/aptospay';
const WALLET_CONTEXT_PATH = './src/contexts/WalletContext.js';

function runCommand(command, cwd = process.cwd()) {
  try {
    console.log(`Running: ${command}`);
    const output = execSync(command, { 
      cwd, 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    return output;
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

function updateContractAddress(address) {
  const walletContextPath = path.resolve(WALLET_CONTEXT_PATH);
  
  if (!fs.existsSync(walletContextPath)) {
    console.error('WalletContext.js not found');
    return;
  }

  let content = fs.readFileSync(walletContextPath, 'utf8');
  
  // Update the contract address in the sendTransaction function
  const contractAddressRegex = /const moduleAddress = "[^"]*";/;
  const newContractAddress = `const moduleAddress = "${address}";`;
  
  if (contractAddressRegex.test(content)) {
    content = content.replace(contractAddressRegex, newContractAddress);
  } else {
    // If not found, add it after the client initialization
    const clientInitRegex = /(const client = new AptosClient\([^)]+\);)/;
    content = content.replace(clientInitRegex, `$1\n  ${newContractAddress}`);
  }
  
  fs.writeFileSync(walletContextPath, content);
  console.log(`Updated contract address to: ${address}`);
}

function main() {
  console.log('🚀 Starting AptosPay deployment...\n');

  // Check if Aptos CLI is installed
  try {
    runCommand('aptos --version');
  } catch (error) {
    console.error('❌ Aptos CLI not found. Please install it first:');
    console.error('   curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3');
    process.exit(1);
  }

  // Check if we're in the right directory
  if (!fs.existsSync(CONTRACT_DIR)) {
    console.error('❌ Move contract directory not found. Please run from project root.');
    process.exit(1);
  }

  // Deploy the contract
  console.log('📦 Deploying Move contract...');
  const deployOutput = runCommand('aptos move publish --package-dir . --profile dev', CONTRACT_DIR);
  
  // Extract contract address from output
  const addressMatch = deployOutput.match(/Successfully published under account (\w+)/);
  if (!addressMatch) {
    console.error('❌ Failed to extract contract address from deployment output');
    process.exit(1);
  }

  const contractAddress = addressMatch[1];
  console.log(`✅ Contract deployed at address: ${contractAddress}`);

  // Update frontend configuration
  console.log('🔧 Updating frontend configuration...');
  updateContractAddress(contractAddress);

  // Install dependencies
  console.log('📦 Installing dependencies...');
  runCommand('npm install');

  console.log('\n🎉 Deployment completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Run "npm start" to start the development server');
  console.log('2. Scan the QR code with Expo Go app on your phone');
  console.log('3. Test the app with testnet APT from the faucet');
  console.log(`\nContract address: ${contractAddress}`);
  console.log(`Explorer: https://explorer.aptoslabs.com/account/${contractAddress}`);
}

if (require.main === module) {
  main();
}

module.exports = { updateContractAddress, runCommand };
