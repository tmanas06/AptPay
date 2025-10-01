#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Restarting AptosPay development server...\n');

try {
  // Clear various caches
  console.log('🧹 Clearing caches...');
  
  // Clear npm cache
  try {
    execSync('npm cache clean --force', { stdio: 'inherit' });
  } catch (err) {
    console.log('⚠️  Could not clear npm cache');
  }
  
  // Clear Metro cache
  try {
    execSync('npx expo r -c', { stdio: 'inherit' });
  } catch (err) {
    console.log('⚠️  Could not clear Metro cache');
  }
  
  // Clear Expo cache
  try {
    execSync('npx expo install --fix', { stdio: 'inherit' });
  } catch (err) {
    console.log('⚠️  Could not clear Expo cache');
  }
  
  console.log('\n✅ Caches cleared successfully!');
  console.log('\n🚀 Starting development server...\n');
  
  // Start the development server
  execSync('npm start', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Error restarting development server:', error.message);
  process.exit(1);
}
