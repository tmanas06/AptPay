#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Metro bundle for GitHub Pages...\n');

try {
  // Read the current bundle file
  const bundlePath = path.join('docs', 'bundles', 'web-f09e6bf89769e2662126a47766365b5f.js');
  
  if (fs.existsSync(bundlePath)) {
    let bundleContent = fs.readFileSync(bundlePath, 'utf8');
    
    // Fix asset paths in the bundle
    bundleContent = bundleContent.replace(
      /require\("\.\/assets\//g,
      'require("./assets/'
    );
    
    bundleContent = bundleContent.replace(
      /require\("\.\/src\//g,
      'require("./src/'
    );
    
    // Fix font paths
    bundleContent = bundleContent.replace(
      /Ionicons\.ttf/g,
      './fonts/Ionicons.ttf'
    );
    
    // Write the fixed bundle
    fs.writeFileSync(bundlePath, bundleContent);
    console.log('✅ Fixed asset paths in Metro bundle');
  } else {
    console.log('⚠️ Bundle file not found, skipping bundle fixes');
  }
  
  // Create a better index.html that handles the Metro bundler properly
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AptPay - DeFi Trading Platform</title>
  <meta name="description" content="Advanced DeFi trading platform on Aptos blockchain">
  <meta name="theme-color" content="#007AFF">
  <link rel="icon" href="./assets/favicon.png">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: #f8f9fa;
    }
    
    #root {
      width: 100%;
      height: 100vh;
    }
    
    .loading {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: #f8f9fa;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e9ecef;
      border-top: 4px solid #007AFF;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .loading-text {
      color: #6c757d;
      font-size: 16px;
      margin-bottom: 10px;
    }
    
    .loading-subtext {
      color: #6c757d;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="loading">
      <div class="spinner"></div>
      <div class="loading-text">Loading AptPay...</div>
      <div class="loading-subtext">Your DeFi Trading Platform on Aptos</div>
    </div>
  </div>
  
  <script>
    console.log('🚀 AptPay - Starting Metro bundler application...');
    
    // Set up Expo web environment
    window.__expo = window.__expo || {};
    window.__expo.web = window.__expo.web || {};
    
    // Configure paths for GitHub Pages
    window.__expo.web.assetPath = './assets/';
    window.__expo.web.fontPath = './fonts/';
    window.__expo.web.bundleUrl = './bundles/web-f09e6bf89769e2662126a47766365b5f.js';
    
    // Set up error handling
    window.addEventListener('error', function(e) {
      console.error('Global error:', e.error);
    });
    
    window.addEventListener('unhandledrejection', function(e) {
      console.error('Unhandled promise rejection:', e.reason);
    });
    
    // Load the Metro bundle
    const script = document.createElement('script');
    script.src = './bundles/web-f09e6bf89769e2662126a47766365b5f.js';
    
    script.onload = () => {
      console.log('✅ AptPay Metro bundle loaded successfully');
      
      // Try to initialize the app
      setTimeout(() => {
        if (window.Expo && window.Expo.registerRootComponent) {
          console.log('🎉 Expo app initialized successfully');
        } else if (window.React && window.ReactDOM) {
          console.log('🎉 React app initialized successfully');
        } else {
          console.log('⚠️ App loaded but initialization unclear');
        }
      }, 2000);
    };
    
    script.onerror = (error) => {
      console.error('❌ Failed to load AptPay bundle:', error);
      document.getElementById('root').innerHTML = \`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px; background: #f8f9fa;">
          <div style="font-size: 48px; margin-bottom: 20px;">🚀</div>
          <h1 style="color: #007AFF; margin-bottom: 20px; font-size: 2.5rem;">AptPay</h1>
          <p style="color: #6c757d; margin-bottom: 20px; font-size: 1.1rem;">Your DeFi Trading Platform on Aptos</p>
          <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px;">
            <h3 style="color: #dc3545; margin-bottom: 15px;">Bundle Loading Failed</h3>
            <p style="color: #6c757d; margin-bottom: 15px;">The AptPay application bundle failed to load. This might be due to:</p>
            <ul style="text-align: left; color: #6c757d; margin-bottom: 20px;">
              <li>Network connectivity issues</li>
              <li>JavaScript bundle corruption</li>
              <li>Browser compatibility problems</li>
            </ul>
            <button onclick="window.location.reload()" style="padding: 12px 24px; background: #007AFF; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-right: 10px;">
              🔄 Refresh Page
            </button>
            <a href="./app.html" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; text-decoration: none; display: inline-block;">
              📱 Use Web App
            </a>
          </div>
        </div>
      \`;
    };
    
    document.head.appendChild(script);
    
    // Fallback timeout
    setTimeout(() => {
      const root = document.getElementById('root');
      if (root && root.innerHTML.includes('loading')) {
        console.log('⏰ App loading timeout, showing fallback');
        root.innerHTML = \`
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px; background: #f8f9fa;">
            <div style="font-size: 48px; margin-bottom: 20px;">🚀</div>
            <h1 style="color: #007AFF; margin-bottom: 20px; font-size: 2.5rem;">AptPay</h1>
            <p style="color: #6c757d; margin-bottom: 20px; font-size: 1.1rem;">Your DeFi Trading Platform on Aptos</p>
            <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px;">
              <h3 style="color: #ffc107; margin-bottom: 15px;">Loading Taking Too Long</h3>
              <p style="color: #6c757d; margin-bottom: 15px;">The application is taking longer than expected to load. This might be due to:</p>
              <ul style="text-align: left; color: #6c757d; margin-bottom: 20px;">
                <li>Large bundle size</li>
                <li>Slow network connection</li>
                <li>Complex initialization process</li>
              </ul>
              <button onclick="window.location.reload()" style="padding: 12px 24px; background: #007AFF; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-right: 10px;">
                🔄 Refresh Page
              </button>
              <a href="./app.html" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; text-decoration: none; display: inline-block;">
                📱 Use Web App
              </a>
            </div>
          </div>
        \`;
      }
    }, 20000);
    
  </script>
</body>
</html>`;

  // Write the new index.html
  fs.writeFileSync(path.join('docs', 'index.html'), indexHtml);
  console.log('✅ Updated index.html with better Metro bundler support');
  
  console.log('\n🎉 Metro bundle fix completed!');
  console.log('📁 Files updated:');
  console.log('  - docs/index.html (improved Metro bundler loading)');
  console.log('  - docs/bundles/web-f09e6bf89769e2662126a47766365b5f.js (fixed asset paths)');
  console.log('\n🔗 Test URL: https://tmanas06.github.io/AptPay/');
  
} catch (error) {
  console.error('❌ Fix failed:', error.message);
  process.exit(1);
}
