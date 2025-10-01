#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONTRACT_DIR = path.join(__dirname, '..', 'move', 'aptospay');
const CONFIG_FILE = path.join(__dirname, '..', 'src', 'utils', 'constants.js');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, cwd = process.cwd()) {
  try {
    log(`Running: ${command}`, 'blue');
    const output = execSync(command, { 
      cwd, 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return output;
  } catch (error) {
    log(`Command failed: ${command}`, 'red');
    log(`Error: ${error.message}`, 'red');
    throw error;
  }
}

function updateContractAddress(address) {
  try {
    log(`Updating contract address to: ${address}`, 'yellow');
    
    // Update constants.js
    const constantsPath = path.join(__dirname, '..', 'src', 'utils', 'constants.js');
    let constantsContent = fs.readFileSync(constantsPath, 'utf8');
    
    // Replace contract address
    constantsContent = constantsContent.replace(
      /CONTRACT_ADDRESS:\s*['"][^'"]*['"]/,
      `CONTRACT_ADDRESS: '${address}'`
    );
    
    fs.writeFileSync(constantsPath, constantsContent);
    
    // Update SmartContractService.js
    const servicePath = path.join(__dirname, '..', 'src', 'services', 'SmartContractService.js');
    let serviceContent = fs.readFileSync(servicePath, 'utf8');
    
    // Replace contract address
    serviceContent = serviceContent.replace(
      /this\.contractAddress\s*=\s*['"][^'"]*['"]/,
      `this.contractAddress = '${address}'`
    );
    
    fs.writeFileSync(servicePath, serviceContent);
    
    log(`✅ Updated contract address in frontend files`, 'green');
  } catch (error) {
    log(`❌ Failed to update contract address: ${error.message}`, 'red');
    throw error;
  }
}

function checkPrerequisites() {
  log('🔍 Checking prerequisites...', 'cyan');
  
  // Check if Aptos CLI is installed
  try {
    const version = runCommand('aptos --version');
    log(`✅ Aptos CLI found: ${version.trim()}`, 'green');
  } catch (error) {
    log('❌ Aptos CLI not found. Please install it first:', 'red');
    log('   curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3', 'yellow');
    process.exit(1);
  }
  
  // Check if we're in the right directory
  if (!fs.existsSync(CONTRACT_DIR)) {
    log('❌ Move contract directory not found. Please run from project root.', 'red');
    process.exit(1);
  }
  
  // Check if Move.toml exists
  const moveTomlPath = path.join(CONTRACT_DIR, 'Move.toml');
  if (!fs.existsSync(moveTomlPath)) {
    log('❌ Move.toml not found in contract directory.', 'red');
    process.exit(1);
  }
  
  log('✅ All prerequisites met', 'green');
}

function initializeAptosProfile() {
  log('🔧 Initializing Aptos profile...', 'cyan');
  
  try {
    // Check if profile exists
    runCommand('aptos config show-profiles', CONTRACT_DIR);
    log('✅ Aptos profile already configured', 'green');
  } catch (error) {
    log('⚠️  Aptos profile not configured. Initializing...', 'yellow');
    
    try {
      // Initialize profile in contract directory
      runCommand('aptos init --profile dev', CONTRACT_DIR);
      log('✅ Aptos profile initialized successfully', 'green');
      
      // Fund the account
      log('💰 Funding account with testnet APT...', 'cyan');
      runCommand('aptos account fund-with-faucet --profile dev', CONTRACT_DIR);
      log('✅ Account funded successfully', 'green');
      
    } catch (initError) {
      log('❌ Failed to initialize Aptos profile:', 'red');
      log(initError.stdout || initError.message, 'red');
      log('Please run manually:', 'yellow');
      log('   cd move/aptospay', 'yellow');
      log('   aptos init --profile dev', 'yellow');
      log('   aptos account fund-with-faucet --profile dev', 'yellow');
      process.exit(1);
    }
  }
}

function compileContracts() {
  log('📦 Compiling Move contracts...', 'cyan');
  
  try {
    const output = runCommand('aptos move compile --package-dir .', CONTRACT_DIR);
    log('✅ Contracts compiled successfully', 'green');
    return output;
  } catch (error) {
    log('❌ Contract compilation failed:', 'red');
    log(error.stdout || error.message, 'red');
    process.exit(1);
  }
}

function testContracts() {
  log('🧪 Testing Move contracts...', 'cyan');
  
  try {
    const output = runCommand('aptos move test --package-dir .', CONTRACT_DIR);
    log('✅ All tests passed', 'green');
    return output;
  } catch (error) {
    log('⚠️  Some tests failed, but continuing with deployment...', 'yellow');
    log(error.stdout || error.message, 'yellow');
  }
}

function deployContracts() {
  log('🚀 Deploying contracts to devnet...', 'cyan');
  
  try {
    const output = runCommand('aptos move publish --package-dir . --profile dev', CONTRACT_DIR);
    log('✅ Contracts deployed successfully', 'green');
    
    log('Deployment output:', 'blue');
    log(output, 'blue');
    
    // Try multiple patterns to extract contract address
    let contractAddress = null;
    
    // Pattern 1: "Successfully published under account"
    let addressMatch = output.match(/Successfully published under account (\w+)/);
    if (addressMatch) {
      contractAddress = addressMatch[1];
    }
    
    // Pattern 2: "Account address" or similar
    if (!contractAddress) {
      addressMatch = output.match(/Account address[:\s]+(\w+)/);
      if (addressMatch) {
        contractAddress = addressMatch[1];
      }
    }
    
    // Pattern 3: Look for any 64-character hex string
    if (!contractAddress) {
      addressMatch = output.match(/(0x[a-fA-F0-9]{1,64})/);
      if (addressMatch) {
        contractAddress = addressMatch[1];
      }
    }
    
    // Pattern 4: Get from profile if deployment was successful
    if (!contractAddress) {
      try {
        const profileOutput = runCommand('aptos config show-profiles', CONTRACT_DIR);
        const profileMatch = profileOutput.match(/dev.*?account:\s*(\w+)/);
        if (profileMatch) {
          contractAddress = profileMatch[1];
        }
      } catch (profileError) {
        log('Could not get address from profile', 'yellow');
      }
    }
    
    if (!contractAddress) {
      log('⚠️  Could not extract contract address automatically', 'yellow');
      log('Please check the deployment output above and provide the contract address manually', 'yellow');
      
      // Try to get the profile address as fallback
      try {
        const profileOutput = runCommand('aptos config show-profiles', CONTRACT_DIR);
        log('Profile output:', 'blue');
        log(profileOutput, 'blue');
        
        // Look for any address in the profile output
        const anyAddressMatch = profileOutput.match(/(0x[a-fA-F0-9]{1,64})/);
        if (anyAddressMatch) {
          contractAddress = anyAddressMatch[1];
          log(`📋 Using profile address: ${contractAddress}`, 'green');
        }
      } catch (profileError) {
        log('Could not get address from profile either', 'red');
      }
    }
    
    if (contractAddress) {
      log(`📋 Contract deployed at address: ${contractAddress}`, 'green');
      return contractAddress;
    } else {
      throw new Error('Failed to extract contract address from deployment output. Please check the output above.');
    }
    
  } catch (error) {
    log('❌ Contract deployment failed:', 'red');
    log(error.stdout || error.message, 'red');
    process.exit(1);
  }
}

function initializeModules(contractAddress) {
  log('🔧 Initializing contract modules...', 'cyan');
  
  try {
    // Initialize trading module
    log('Initializing trading module...', 'blue');
    runCommand(`aptos move run --function-id ${contractAddress}::trading::initialize --profile dev`, CONTRACT_DIR);
    
    // Initialize AMM module
    log('Initializing AMM module...', 'blue');
    runCommand(`aptos move run --function-id ${contractAddress}::amm::initialize --profile dev`, CONTRACT_DIR);
    
    // Initialize hedging module
    log('Initializing hedging module...', 'blue');
    runCommand(`aptos move run --function-id ${contractAddress}::hedging::initialize --profile dev`, CONTRACT_DIR);
    
    // Initialize oracle module
    log('Initializing oracle module...', 'blue');
    runCommand(`aptos move run --function-id ${contractAddress}::oracle::initialize --profile dev`, CONTRACT_DIR);
    
    log('✅ All modules initialized successfully', 'green');
  } catch (error) {
    log('❌ Module initialization failed:', 'red');
    log(error.stdout || error.message, 'red');
    process.exit(1);
  }
}

function createDeploymentInfo(contractAddress) {
  log('📝 Creating deployment information...', 'cyan');
  
  const deploymentInfo = {
    contractAddress,
    network: 'devnet',
    deployedAt: new Date().toISOString(),
    modules: [
      'trading',
      'amm', 
      'hedging',
      'oracle'
    ],
    explorerUrl: `https://explorer.aptoslabs.com/account/${contractAddress}`,
    nodeUrl: 'https://fullnode.devnet.aptoslabs.com/v1',
    faucetUrl: 'https://faucet.devnet.aptoslabs.com',
  };
  
  const infoPath = path.join(__dirname, '..', 'deployment-info.json');
  fs.writeFileSync(infoPath, JSON.stringify(deploymentInfo, null, 2));
  
  log(`✅ Deployment info saved to: ${infoPath}`, 'green');
  return deploymentInfo;
}

function main() {
  log('🚀 Starting AptosPay Smart Contract Deployment', 'bright');
  log('================================================', 'bright');
  
  try {
    // Step 1: Check prerequisites
    checkPrerequisites();
    
    // Step 2: Initialize Aptos profile
    initializeAptosProfile();
    
    // Step 3: Compile contracts
    compileContracts();
    
    // Step 4: Test contracts (optional)
    testContracts();
    
    // Step 5: Deploy contracts
    const contractAddress = deployContracts();
    
    // Step 6: Initialize modules
    initializeModules(contractAddress);
    
    // Step 7: Update frontend configuration
    updateContractAddress(contractAddress);
    
    // Step 8: Create deployment info
    const deploymentInfo = createDeploymentInfo(contractAddress);
    
    // Success message
    log('\n🎉 Deployment completed successfully!', 'bright');
    log('================================================', 'bright');
    log(`📋 Contract Address: ${contractAddress}`, 'green');
    log(`🌐 Explorer: ${deploymentInfo.explorerUrl}`, 'blue');
    log(`🔗 Network: ${deploymentInfo.network}`, 'blue');
    log(`⏰ Deployed: ${deploymentInfo.deployedAt}`, 'blue');
    
    log('\n📚 Next Steps:', 'yellow');
    log('1. Update your wallet with testnet APT from the faucet', 'yellow');
    log('2. Run "npm start" to start the development server', 'yellow');
    log('3. Test all DeFi features in the app', 'yellow');
    log('4. Check the explorer to verify contract deployment', 'yellow');
    
    log('\n✨ All DeFi features are now live on devnet!', 'bright');
    
  } catch (error) {
    log('\n❌ Deployment failed!', 'red');
    log(`Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the deployment
if (require.main === module) {
  main();
}

module.exports = {
  main,
  deployContracts,
  updateContractAddress,
  checkPrerequisites,
};
