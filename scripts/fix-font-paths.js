#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing font paths in Metro bundle...\n');

try {
  // Read the current bundle file
  const bundlePath = path.join('docs', 'bundles', 'web-f09e6bf89769e2662126a47766365b5f.js');
  
  if (fs.existsSync(bundlePath)) {
    let bundleContent = fs.readFileSync(bundlePath, 'utf8');
    
    // Fix the specific font path that's causing the 404 error
    // The error shows it's looking for: /assets/node_modules/@expo/vector-icons/build/...
    // We need to change it to: ./fonts/
    
    bundleContent = bundleContent.replace(
      /\/assets\/node_modules\/@expo\/vector-icons\/build\/vendor\/react-native-vector-icons\/Fonts\/Ionicons\.ttf/g,
      './fonts/Ionicons.ttf'
    );
    
    bundleContent = bundleContent.replace(
      /\/assets\/node_modules\/@expo\/vector-icons\/build\/vendor\/react-native-vector-icons\/Fonts\//g,
      './fonts/'
    );
    
    bundleContent = bundleContent.replace(
      /node_modules\/@expo\/vector-icons\/build\/vendor\/react-native-vector-icons\/Fonts\//g,
      './fonts/'
    );
    
    // Also fix any other font references
    bundleContent = bundleContent.replace(
      /Ionicons\.ttf/g,
      './fonts/Ionicons.ttf'
    );
    
    // Write the fixed bundle
    fs.writeFileSync(bundlePath, bundleContent);
    console.log('✅ Fixed font paths in Metro bundle');
  } else {
    console.log('⚠️ Bundle file not found, skipping bundle fixes');
  }
  
  // Also copy the font to the assets directory as a fallback
  const assetsDir = path.join('docs', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  // Create the full path structure that the bundle expects
  const fontDir = path.join('docs', 'assets', 'node_modules', '@expo', 'vector-icons', 'build', 'vendor', 'react-native-vector-icons', 'Fonts');
  fs.mkdirSync(fontDir, { recursive: true });
  
  // Copy the font to both locations
  const sourceFont = path.join('docs', 'fonts', 'Ionicons.ttf');
  const targetFont = path.join(fontDir, 'Ionicons.ttf');
  
  if (fs.existsSync(sourceFont)) {
    fs.copyFileSync(sourceFont, targetFont);
    console.log('✅ Copied font to expected path structure');
  }
  
  console.log('\n🎉 Font path fix completed!');
  console.log('📁 Fonts available at:');
  console.log('  - docs/fonts/Ionicons.ttf');
  console.log('  - docs/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf');
  
} catch (error) {
  console.error('❌ Fix failed:', error.message);
  process.exit(1);
}
