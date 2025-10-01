#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🌐 Starting web server with clean cache...\n');

try {
  // Clear various caches
  console.log('🧹 Clearing caches...');
  
  // Clear .expo cache
  const expoCache = path.join(__dirname, '..', '.expo');
  if (fs.existsSync(expoCache)) {
    fs.rmSync(expoCache, { recursive: true, force: true });
    console.log('   ✓ Cleared .expo cache');
  }
  
  // Clear webpack cache
  const webpackCache = path.join(__dirname, '..', '.webpack');
  if (fs.existsSync(webpackCache)) {
    fs.rmSync(webpackCache, { recursive: true, force: true });
    console.log('   ✓ Cleared webpack cache');
  }
  
  // Clear web-build
  const webBuild = path.join(__dirname, '..', 'web-build');
  if (fs.existsSync(webBuild)) {
    fs.rmSync(webBuild, { recursive: true, force: true });
    console.log('   ✓ Cleared web-build');
  }
  
  console.log('\n✅ Caches cleared successfully!');
  console.log('\n🚀 Starting web server...\n');
  
  // Set environment variable and start web server
  process.env.EXPO_PLATFORM = 'web';
  execSync('npx expo start --web --clear', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Error starting web server:', error.message);
  process.exit(1);
}
