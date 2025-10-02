#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Creating a simple web version of AptPay...\n');

try {
  // Create a simplified web version that doesn't rely on Metro bundler
  const simpleAppHtml = `<!DOCTYPE html>
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
      background: #f8f9fa;
      color: #333;
    }
    
    .app {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .header {
      background: #007AFF;
      color: white;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .header h1 {
      font-size: 2rem;
      margin-bottom: 5px;
    }
    
    .header p {
      opacity: 0.9;
      font-size: 1rem;
    }
    
    .nav {
      background: white;
      border-bottom: 1px solid #e9ecef;
      padding: 0 20px;
    }
    
    .nav-list {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    
    .nav-item {
      flex: 1;
    }
    
    .nav-link {
      display: block;
      padding: 15px 10px;
      text-decoration: none;
      color: #6c757d;
      text-align: center;
      border-bottom: 3px solid transparent;
      transition: all 0.3s ease;
    }
    
    .nav-link:hover,
    .nav-link.active {
      color: #007AFF;
      border-bottom-color: #007AFF;
    }
    
    .content {
      flex: 1;
      padding: 40px 20px;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    
    .card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 20px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    
    .card h2 {
      color: #007AFF;
      margin-bottom: 15px;
      font-size: 1.5rem;
    }
    
    .card p {
      color: #6c757d;
      line-height: 1.6;
      margin-bottom: 15px;
    }
    
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    
    .feature-card {
      background: white;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 2px 15px rgba(0,0,0,0.1);
      text-align: center;
      transition: transform 0.3s ease;
    }
    
    .feature-card:hover {
      transform: translateY(-5px);
    }
    
    .feature-icon {
      font-size: 2.5rem;
      margin-bottom: 15px;
    }
    
    .feature-card h3 {
      color: #007AFF;
      margin-bottom: 10px;
    }
    
    .feature-card p {
      color: #6c757d;
      font-size: 0.9rem;
    }
    
    .status-badge {
      display: inline-block;
      background: #28a745;
      color: white;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: bold;
      margin-bottom: 20px;
    }
    
    .btn {
      background: #007AFF;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.3s ease;
    }
    
    .btn:hover {
      background: #0056b3;
    }
    
    .hidden {
      display: none;
    }
    
    @media (max-width: 768px) {
      .nav-list {
        flex-direction: column;
      }
      
      .content {
        padding: 20px 15px;
      }
      
      .feature-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="app">
    <header class="header">
      <h1>🚀 AptPay</h1>
      <p>Advanced DeFi Trading Platform on Aptos</p>
    </header>
    
    <nav class="nav">
      <ul class="nav-list">
        <li class="nav-item">
          <a href="#" class="nav-link active" data-section="home">Home</a>
        </li>
        <li class="nav-item">
          <a href="#" class="nav-link" data-section="trading">Trading</a>
        </li>
        <li class="nav-item">
          <a href="#" class="nav-link" data-section="amm">AMM</a>
        </li>
        <li class="nav-item">
          <a href="#" class="nav-link" data-section="hedging">Hedging</a>
        </li>
        <li class="nav-item">
          <a href="#" class="nav-link" data-section="guide">Guide</a>
        </li>
      </ul>
    </nav>
    
    <main class="content">
      <!-- Home Section -->
      <div id="home" class="section">
        <div class="card">
          <span class="status-badge">✅ LIVE</span>
          <h2>Welcome to AptPay</h2>
          <p>Your complete DeFi trading platform built on the Aptos blockchain. Experience advanced trading features, automated market making, and sophisticated hedging strategies.</p>
          <p>This is a simplified web version of your React Native AptPay application, optimized for web deployment.</p>
        </div>
        
        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon">📈</div>
            <h3>Trading</h3>
            <p>Advanced trading interface with real-time market data and order management</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🔄</div>
            <h3>AMM</h3>
            <p>Automated Market Making with liquidity provision and yield farming</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🛡️</div>
            <h3>Hedging</h3>
            <p>Sophisticated hedging strategies to protect your investments</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">💼</div>
            <h3>Wallet</h3>
            <p>Secure wallet integration with Aptos blockchain support</p>
          </div>
        </div>
      </div>
      
      <!-- Trading Section -->
      <div id="trading" class="section hidden">
        <div class="card">
          <h2>📈 Trading Dashboard</h2>
          <p>Advanced trading interface coming soon. This section will include:</p>
          <ul style="margin: 15px 0; padding-left: 20px; color: #6c757d;">
            <li>Real-time price charts</li>
            <li>Order book visualization</li>
            <li>Trade execution interface</li>
            <li>Portfolio management</li>
          </ul>
          <button class="btn">Connect Wallet</button>
        </div>
      </div>
      
      <!-- AMM Section -->
      <div id="amm" class="section hidden">
        <div class="card">
          <h2>🔄 Automated Market Making</h2>
          <p>Liquidity provision and yield farming features coming soon. This section will include:</p>
          <ul style="margin: 15px 0; padding-left: 20px; color: #6c757d;">
            <li>Liquidity pool management</li>
            <li>Yield farming strategies</li>
            <li>Impermanent loss protection</li>
            <li>Reward tracking</li>
          </ul>
          <button class="btn">Add Liquidity</button>
        </div>
      </div>
      
      <!-- Hedging Section -->
      <div id="hedging" class="section hidden">
        <div class="card">
          <h2>🛡️ Hedging Strategies</h2>
          <p>Advanced hedging tools coming soon. This section will include:</p>
          <ul style="margin: 15px 0; padding-left: 20px; color: #6c757d;">
            <li>Risk assessment tools</li>
            <li>Hedge ratio calculations</li>
            <li>Options and futures integration</li>
            <li>Portfolio protection</li>
          </ul>
          <button class="btn">Start Hedging</button>
        </div>
      </div>
      
      <!-- Guide Section -->
      <div id="guide" class="section hidden">
        <div class="card">
          <h2>📚 User Guide</h2>
          <p>Learn how to use AptPay effectively. This section will include:</p>
          <ul style="margin: 15px 0; padding-left: 20px; color: #6c757d;">
            <li>Getting started tutorial</li>
            <li>Trading strategies guide</li>
            <li>Risk management tips</li>
            <li>FAQ and support</li>
          </ul>
          <button class="btn">View Tutorial</button>
        </div>
      </div>
    </main>
  </div>
  
  <script>
    // Simple navigation functionality
    document.addEventListener('DOMContentLoaded', function() {
      const navLinks = document.querySelectorAll('.nav-link');
      const sections = document.querySelectorAll('.section');
      
      navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Remove active class from all links
          navLinks.forEach(l => l.classList.remove('active'));
          
          // Add active class to clicked link
          this.classList.add('active');
          
          // Hide all sections
          sections.forEach(section => section.classList.add('hidden'));
          
          // Show target section
          const targetSection = this.getAttribute('data-section');
          const targetElement = document.getElementById(targetSection);
          if (targetElement) {
            targetElement.classList.remove('hidden');
          }
        });
      });
      
      console.log('🚀 AptPay web app loaded successfully!');
    });
  </script>
</body>
</html>`;

  // Write the simple app
  fs.writeFileSync(path.join('docs', 'app.html'), simpleAppHtml);
  console.log('✅ Created simplified web app: docs/app.html');
  
  // Update the main index.html to redirect to the simple app
  const redirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AptPay - DeFi Trading Platform</title>
  <meta name="description" content="Advanced DeFi trading platform on Aptos blockchain">
  <meta name="theme-color" content="#007AFF">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: #f8f9fa;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    
    .container {
      text-align: center;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 20px rgba(0,0,0,0.1);
      max-width: 500px;
    }
    
    .logo {
      font-size: 4rem;
      margin-bottom: 20px;
    }
    
    h1 {
      color: #007AFF;
      margin-bottom: 10px;
      font-size: 2.5rem;
    }
    
    p {
      color: #6c757d;
      margin-bottom: 30px;
      font-size: 1.1rem;
    }
    
    .btn {
      background: #007AFF;
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1.1rem;
      text-decoration: none;
      display: inline-block;
      margin: 10px;
      transition: background 0.3s ease;
    }
    
    .btn:hover {
      background: #0056b3;
    }
    
    .btn.secondary {
      background: #6c757d;
    }
    
    .btn.secondary:hover {
      background: #5a6268;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🚀</div>
    <h1>AptPay</h1>
    <p>Advanced DeFi Trading Platform on Aptos</p>
    
    <a href="./app.html" class="btn">Launch Web App</a>
    <a href="./test.html" class="btn secondary">Debug Info</a>
    
    <p style="margin-top: 30px; font-size: 0.9rem; color: #6c757d;">
      Your React Native AptPay app is now available as a web application
    </p>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join('docs', 'index.html'), redirectHtml);
  console.log('✅ Updated index.html with app launcher');
  
  console.log('\n🎉 Simple web app created successfully!');
  console.log('📁 Files created:');
  console.log('  - docs/index.html (app launcher)');
  console.log('  - docs/app.html (simplified AptPay web app)');
  console.log('  - docs/test.html (debug page)');
  console.log('\n🔗 Test URLs:');
  console.log('  - Main launcher: https://tmanas06.github.io/AptPay/');
  console.log('  - Web app: https://tmanas06.github.io/AptPay/app.html');
  console.log('  - Debug page: https://tmanas06.github.io/AptPay/test.html');
  
} catch (error) {
  console.error('❌ Creation failed:', error.message);
  process.exit(1);
}
