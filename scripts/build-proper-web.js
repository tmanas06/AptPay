#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building AptPay for proper web deployment...\n');

try {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('dist')) {
    execSync('rmdir /s /q dist', { stdio: 'pipe', windowsHide: true });
  }
  if (fs.existsSync('docs')) {
    execSync('rmdir /s /q docs', { stdio: 'pipe', windowsHide: true });
  }

  // Install dependencies
  console.log('\n📦 Installing dependencies...');
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });

  // Configure Expo for web build
  console.log('\n🔧 Configuring Expo for web build...');
  const appJsonPath = 'app.json';
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  appJson.expo.web = appJson.expo.web || {};
  appJson.expo.web.bundler = 'metro';
  appJson.expo.web.output = 'static';
  appJson.expo.web.publicPath = './';
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  console.log('🔧 Configured app.json for Metro bundler and static output.');

  // Build Expo web app
  console.log('\n📱 Building Expo web app...');
  try {
    execSync('npx expo export --platform web --output-dir dist --clear', {
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
    if (fs.existsSync('dist') && fs.existsSync('dist/bundles')) {
      console.log('✅ Build was created despite errors - continuing...');
    } else {
      throw new Error('Build failed and no output was created');
    }
  }

  // Create docs directory and copy build
  console.log('\n📁 Setting up docs directory...');
  fs.mkdirSync('docs', { recursive: true });
  
  // Copy all files from dist to docs
  if (fs.existsSync('dist')) {
    const copyRecursive = (src, dest) => {
      if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach(file => {
          copyRecursive(path.join(src, file), path.join(dest, file));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };
    copyRecursive('dist', 'docs');
    console.log('✅ Copied build to docs directory');
  }

  // Create a proper index.html that ensures React Native web works
  console.log('\n📝 Creating optimized index.html...');
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
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: #1a1a1a;
      color: #ffffff;
      overflow-x: hidden;
    }
    
    #root {
      width: 100%;
      min-height: 100vh;
    }
    
    .loading {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: #1a1a1a;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #333;
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
      color: #ffffff;
      font-size: 16px;
      margin-bottom: 10px;
    }
    
    .loading-subtext {
      color: #888;
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
    window.__expo.web.publicPath = './';
    
    // Set up React Native Web environment
    window.ReactNativeWeb = window.ReactNativeWeb || {};
    
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
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        console.log(\`✅ Bundle loaded successfully: \${bundleFile}\`);
        bundleLoaded = true;
        
        // Wait a bit for React to initialize
        setTimeout(() => {
          console.log('🎉 AptPay application should now be running');
        }, 2000);
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
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px; background: #1a1a1a; color: white;">
          <div style="font-size: 48px; margin-bottom: 20px;">🚀</div>
          <h1 style="color: #007AFF; margin-bottom: 20px; font-size: 2.5rem;">AptPay</h1>
          <p style="color: #888; margin-bottom: 20px; font-size: 1.1rem;">Your DeFi Trading Platform on Aptos</p>
          <div style="background: #333; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.3); max-width: 500px;">
            <h3 style="color: #ff6b6b; margin-bottom: 15px;">Application Loading Failed</h3>
            <p style="color: #888; margin-bottom: 15px;">The AptPay application failed to load properly.</p>
            <button onclick="window.location.reload()" style="padding: 12px 24px; background: #007AFF; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-right: 10px;">
              🔄 Refresh Page
            </button>
            <a href="./app.html" style="padding: 12px 24px; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; text-decoration: none; display: inline-block;">
              📱 Use Web App
            </a>
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
  fs.writeFileSync(path.join('docs', 'index.html'), indexHtml);
  console.log('✅ Created optimized index.html');

  // Verify build structure
  console.log('\n🔍 Verifying build structure...');
  if (fs.existsSync('docs')) {
    console.log('📁 Build contents:');
    const listFiles = (dir, prefix = '') => {
      const files = fs.readdirSync(dir);
      files.slice(0, 10).forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        console.log(`${prefix}${file}${stat.isDirectory() ? '/' : ''}`);
        if (stat.isDirectory() && prefix.length < 20) {
          listFiles(filePath, prefix + '  ');
        }
      });
    };
    listFiles('docs');
  }

  console.log('\n🎉 AptPay build completed successfully!');
  console.log('📁 Output directory: docs');
  console.log('🚀 Ready for GitHub Pages deployment!');
  console.log('\n🔗 Test URL: https://tmanas06.github.io/AptPay/');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
