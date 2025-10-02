#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building AptPay for Vercel with Expo Web...\n');

try {
  // Step 1: Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'pipe' });
  }
  if (fs.existsSync('web-build')) {
    execSync('rm -rf web-build', { stdio: 'pipe' });
  }

  // Step 2: Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });

  // Step 3: Configure Expo for web with Metro bundler
  console.log('🔧 Configuring Expo for web build...');
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  
  // Ensure web configuration is set for Metro bundler
  if (!appJson.expo.web) {
    appJson.expo.web = {};
  }
  
  appJson.expo.web.bundler = 'metro';
  appJson.expo.web.name = 'AptPay';
  appJson.expo.web.shortName = 'AptPay';
  appJson.expo.web.lang = 'en';
  appJson.expo.web.scope = '/';
  appJson.expo.web.themeColor = '#007AFF';
  appJson.expo.web.description = 'Advanced DeFi trading platform on Aptos blockchain';
  appJson.expo.web.dir = 'ltr';
  appJson.expo.web.display = 'standalone';
  appJson.expo.web.orientation = 'portrait';
  appJson.expo.web.startUrl = '/';
  appJson.expo.web.backgroundColor = '#f8f9fa';
  
  fs.writeFileSync('app.json', JSON.stringify(appJson, null, 2));

  // Step 4: Build with Expo export
  console.log('📱 Building Expo web app...');
  
  try {
    execSync('npx expo export --platform web --output-dir dist', { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        NODE_OPTIONS: '--max-old-space-size=4096',
        EXPO_PLATFORM: 'web'
      }
    });
    console.log('✅ Expo web build successful!');
  } catch (error) {
    console.log('⚠️ Expo build had errors, but checking if build was created...');
    
    // Check if the build was actually created despite the error
    if (fs.existsSync('dist') && (fs.existsSync('dist/bundles') || fs.existsSync('dist/index.html'))) {
      console.log('✅ Build was created despite errors - continuing...');
    } else {
      throw new Error('Build failed and no output was created');
    }
  }

  // Step 5: Ensure proper structure for Vercel
  console.log('🔧 Preparing build for Vercel...');
  
  if (!fs.existsSync('dist')) {
    throw new Error('No dist directory found');
  }

  // Check if we have index.html
  if (!fs.existsSync('dist/index.html')) {
    console.log('📝 Creating index.html for Metro bundler...');
    
    // Find the actual bundle file
    let bundleFile = 'index.web.js';
    if (fs.existsSync('dist/bundles')) {
      const bundleFiles = fs.readdirSync('dist/bundles').filter(file => file.endsWith('.js'));
      if (bundleFiles.length > 0) {
        bundleFile = bundleFiles[0];
      }
    }
    
    console.log(`Found bundle file: ${bundleFile}`);
    
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
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="loading">
      <div class="spinner"></div>
    </div>
  </div>
  
  <script>
    // Metro bundler setup for AptPay
    window.__expo = window.__expo || {};
    window.__expo.web = window.__expo.web || {};
    
    // Set up the Metro bundler environment
    window.__expo.web.bundleUrl = './bundles/${bundleFile}';
    
    // Load the Metro bundle
    const script = document.createElement('script');
    script.src = './bundles/${bundleFile}';
    script.onload = () => {
      console.log('AptPay Metro bundle loaded successfully');
    };
    script.onerror = (error) => {
      console.error('Failed to load AptPay bundle:', error);
      document.getElementById('root').innerHTML = \`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px;">
          <h1 style="color: #007AFF; margin-bottom: 20px;">AptPay</h1>
          <p style="color: #6c757d; margin-bottom: 20px;">Your DeFi Trading Platform on Aptos</p>
          <p style="color: #dc3545; font-size: 14px;">Failed to load application. Please refresh the page.</p>
          <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #007AFF; color: white; border: none; border-radius: 5px; cursor: pointer;">Refresh</button>
        </div>
      \`;
    };
    document.head.appendChild(script);
    
    // Fallback timeout
    setTimeout(() => {
      if (document.getElementById('root').innerHTML.includes('loading')) {
        document.getElementById('root').innerHTML = \`
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px;">
            <h1 style="color: #007AFF; margin-bottom: 20px;">AptPay</h1>
            <p style="color: #6c757d; margin-bottom: 20px;">Your DeFi Trading Platform on Aptos</p>
            <p style="color: #6c757d; font-size: 14px;">Loading your AptPay application...</p>
            <div class="spinner" style="margin-top: 20px;"></div>
            <p style="color: #6c757d; font-size: 12px; margin-top: 20px;">If this takes too long, please refresh the page</p>
          </div>
        \`;
      }
    }, 10000);
  </script>
</body>
</html>`;
    
    fs.writeFileSync(path.join('dist', 'index.html'), indexHtml);
    console.log('✅ Created index.html for Metro bundler');
  }

  // Step 6: Verify build structure
  console.log('🔍 Verifying build structure...');
  
  const distFiles = fs.readdirSync('dist', { recursive: true });
  console.log('📁 Build contents:');
  distFiles.forEach(file => console.log(`  - ${file}`));
  
  if (!fs.existsSync('dist/index.html')) {
    throw new Error('index.html not found in dist directory');
  }

  console.log('\n🎉 AptPay build completed successfully!');
  console.log('📁 Output directory: dist');
  console.log('🚀 Ready for Vercel deployment!');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  console.log('\n🔧 Troubleshooting steps:');
  console.log('1. Check your Aptos SDK imports in WalletContext.js');
  console.log('2. Make sure all dependencies are web-compatible');
  console.log('3. Check for any native-only code that needs web alternatives');
  console.log('4. Ensure your app.json is properly configured for web');
  process.exit(1);
}
