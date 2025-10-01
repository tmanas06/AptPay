#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, '..', 'src', 'screens');
const screens = [
  'HedgingScreen.js',
  'KanaTradingScreen.js', 
  'MarketDataScreen.js',
  'OrderManagementScreen.js',
  'SendScreen.js',
  'ReceiveScreen.js',
  'HistoryScreen.js',
  'QRScannerScreen.js'
];

console.log('🔧 Adding missing useTheme hooks...\n');

screens.forEach(screenFile => {
  const filePath = path.join(screensDir, screenFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${screenFile} not found, skipping...`);
    return;
  }

  console.log(`📱 Fixing ${screenFile}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if useTheme hook is missing
    if (!content.includes('const { colors, shadows } = useTheme();')) {
      // Find the useWallet line and add useTheme after it
      content = content.replace(
        /const { [^}]+ } = useWallet\(\);/,
        (match) => match + '\n  const { colors, shadows } = useTheme();'
      );
      
      fs.writeFileSync(filePath, content);
      console.log(`   ✅ Added useTheme hook to ${screenFile}`);
    } else {
      console.log(`   ✓ ${screenFile} already has useTheme hook`);
    }
    
  } catch (error) {
    console.error(`   ❌ Error fixing ${screenFile}:`, error.message);
  }
});

console.log('\n🎉 Theme hooks fix completed!');
