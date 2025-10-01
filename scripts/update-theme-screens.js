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

console.log('🎨 Updating all screens with theme support...\n');

screens.forEach(screenFile => {
  const filePath = path.join(screensDir, screenFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${screenFile} not found, skipping...`);
    return;
  }

  console.log(`📱 Updating ${screenFile}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add useTheme import if not present
    if (!content.includes("import { useTheme } from '../contexts/ThemeContext';")) {
      content = content.replace(
        /import { useWallet } from '\.\.\/contexts\/WalletContext';/,
        "import { useWallet } from '../contexts/WalletContext';\nimport { useTheme } from '../contexts/ThemeContext';"
      );
    }
    
    // Add useTheme hook if not present
    if (!content.includes('const { colors, shadows } = useTheme();')) {
      content = content.replace(
        /const { account, balance, isConnected } = useWallet\(\);/,
        "const { account, balance, isConnected } = useWallet();\n  const { colors, shadows } = useTheme();"
      );
    }
    
    // Update container styles
    content = content.replace(
      /style={styles\.container}/g,
      "style={[styles.container, { backgroundColor: colors.background }]}"
    );
    
    // Update header styles
    content = content.replace(
      /style={styles\.header}/g,
      "style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}"
    );
    
    // Update title styles
    content = content.replace(
      /style={styles\.title}/g,
      "style={[styles.title, { color: colors.text }]}"
    );
    
    // Update subtitle styles
    content = content.replace(
      /style={styles\.subtitle}/g,
      "style={[styles.subtitle, { color: colors.textSecondary }]}"
    );
    
    // Update section title styles
    content = content.replace(
      /style={styles\.sectionTitle}/g,
      "style={[styles.sectionTitle, { color: colors.text }]}"
    );
    
    // Remove hardcoded colors from styles
    const colorReplacements = [
      { from: "backgroundColor: '#f8f9fa',", to: "" },
      { from: "backgroundColor: 'white',", to: "" },
      { from: "color: '#1a1a1a',", to: "" },
      { from: "color: '#6c757d',", to: "" },
      { from: "color: '#007AFF',", to: "" },
      { from: "borderBottomColor: '#e9ecef',", to: "" },
      { from: "borderColor: '#e9ecef',", to: "" },
      { from: /shadowColor: '#000',[\s\S]*?elevation: \d+,?/g, to: "" },
    ];
    
    colorReplacements.forEach(({ from, to }) => {
      content = content.replace(from, to);
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ ${screenFile} updated successfully`);
    
  } catch (error) {
    console.error(`   ❌ Error updating ${screenFile}:`, error.message);
  }
});

console.log('\n🎉 Theme updates completed!');
console.log('\n📋 Next steps:');
console.log('1. Test all screens for proper dark mode');
console.log('2. Verify theme toggle works on all pages');
console.log('3. Check for any remaining hardcoded colors');
