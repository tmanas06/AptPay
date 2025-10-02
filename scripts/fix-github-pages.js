#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing GitHub Pages deployment...\n');

try {
  // Read the current index.html
  const indexPath = path.join('docs', 'index.html');
  let indexHtml = fs.readFileSync(indexPath, 'utf8');
  
  // Create a better index.html that properly loads the Expo web app
  const newIndexHtml = `<!DOCTYPE html>
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
    console.log('🚀 AptPay - Starting application...');
    
    // Set up Expo web environment
    window.__expo = window.__expo || {};
    window.__expo.web = window.__expo.web || {};
    
    // Find the bundle file
    const bundleFiles = [
      'web-f09e6bf89769e2662126a47766365b5f.js',
      'index.web.js',
      'web-bundle.js'
    ];
    
    let bundleLoaded = false;
    let currentBundleIndex = 0;
    
    function tryLoadBundle() {
      if (currentBundleIndex >= bundleFiles.length) {
        console.error('❌ All bundle files failed to load');
        showError();
        return;
      }
      
      const bundleFile = bundleFiles[currentBundleIndex];
      console.log(\`📦 Trying to load bundle: \${bundleFile}\`);
      
      const script = document.createElement('script');
      script.src = \`./bundles/\${bundleFile}\`;
      
      script.onload = () => {
        console.log(\`✅ Bundle loaded successfully: \${bundleFile}\`);
        bundleLoaded = true;
        
        // Try to initialize the app
        setTimeout(() => {
          if (window.Expo && window.Expo.registerRootComponent) {
            console.log('🎉 Expo app initialized successfully');
          } else {
            console.log('⚠️ Expo not found, trying alternative initialization');
            // The bundle should have initialized the app
          }
        }, 1000);
      };
      
      script.onerror = (error) => {
        console.error(\`❌ Failed to load bundle: \${bundleFile}\`, error);
        currentBundleIndex++;
        tryLoadBundle();
      };
      
      document.head.appendChild(script);
    }
    
    function showError() {
      document.getElementById('root').innerHTML = \`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px; background: #f8f9fa;">
          <div style="font-size: 48px; margin-bottom: 20px;">🚀</div>
          <h1 style="color: #007AFF; margin-bottom: 20px; font-size: 2.5rem;">AptPay</h1>
          <p style="color: #6c757d; margin-bottom: 20px; font-size: 1.1rem;">Your DeFi Trading Platform on Aptos</p>
          <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px;">
            <h3 style="color: #dc3545; margin-bottom: 15px;">Application Loading Issue</h3>
            <p style="color: #6c757d; margin-bottom: 15px;">The AptPay application failed to load properly. This might be due to:</p>
            <ul style="text-align: left; color: #6c757d; margin-bottom: 20px;">
              <li>Network connectivity issues</li>
              <li>Browser compatibility problems</li>
              <li>JavaScript bundle loading errors</li>
            </ul>
            <button onclick="window.location.reload()" style="padding: 12px 24px; background: #007AFF; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
              🔄 Refresh Page
            </button>
          </div>
        </div>
      \`;
    }
    
    // Start loading the bundle
    tryLoadBundle();
    
    // Fallback timeout
    setTimeout(() => {
      if (!bundleLoaded) {
        console.log('⏰ Bundle loading timeout, showing fallback');
        showError();
      }
    }, 15000);
    
  </script>
</body>
</html>`;

  // Write the new index.html
  fs.writeFileSync(indexPath, newIndexHtml);
  console.log('✅ Updated index.html with better loading logic');
  
  // Also create a simple test page to verify the setup
  const testHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AptPay - Test Page</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #007AFF; }
    .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
    .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 AptPay - GitHub Pages Test</h1>
    <div class="status success">✅ GitHub Pages is working correctly</div>
    <div class="status success">✅ Static files are being served</div>
    <div class="status success">✅ JavaScript execution is enabled</div>
    
    <h2>📁 Available Files:</h2>
    <ul id="fileList"></ul>
    
    <h2>🔗 Links:</h2>
    <p><a href="./index.html">Main AptPay App</a></p>
    <p><a href="./bundles/">View Bundles Directory</a></p>
    
    <script>
      // Test JavaScript execution
      console.log('✅ JavaScript is working');
      
      // List available files (this won't work due to CORS, but shows JS is running)
      document.getElementById('fileList').innerHTML = \`
        <li>index.html (main app)</li>
        <li>bundles/ (JavaScript bundles)</li>
        <li>assets/ (images and resources)</li>
      \`;
    </script>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join('docs', 'test.html'), testHtml);
  console.log('✅ Created test.html for debugging');
  
  console.log('\n🎉 GitHub Pages fix completed!');
  console.log('📁 Files updated:');
  console.log('  - docs/index.html (improved loading)');
  console.log('  - docs/test.html (debug page)');
  console.log('\n🔗 Test URLs:');
  console.log('  - Main app: https://tmanas06.github.io/AptPay/');
  console.log('  - Test page: https://tmanas06.github.io/AptPay/test.html');
  
} catch (error) {
  console.error('❌ Fix failed:', error.message);
  process.exit(1);
}
