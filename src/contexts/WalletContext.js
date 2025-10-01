import React, { createContext, useContext, useState, useEffect } from 'react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const AptosWalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [walletName, setWalletName] = useState(null);

  // Initialize Aptos client
  const config = new AptosConfig({ network: Network.DEVNET });
  const client = new Aptos(config);

  // Restore wallet connection on app load (optimized)
  useEffect(() => {
    const restoreConnection = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        const wasConnected = localStorage.getItem('aptospay_connected');
        const savedAddress = localStorage.getItem('aptospay_account_address');
        const savedWallet = localStorage.getItem('aptospay_wallet_name');
        
        if (wasConnected === 'true' && savedAddress && savedWallet) {
          // Set basic state immediately for faster UI response
          setIsConnected(true);
          setWalletName(savedWallet);
          
          // Create account object immediately
          const account = {
            accountAddress: { toString: () => savedAddress },
            wallet: savedWallet,
            walletApi: null // Will be set later if available
          };
          setAccount(account);
          
          // Try to get wallet API in background (non-blocking)
          setTimeout(async () => {
            let walletApi = null;
            let isWalletAvailable = false;
            
            // Check wallet availability with better error handling
            try {
              if (savedWallet === 'Petra' && window.aptos) {
                // Test if Petra wallet is actually responsive
                try {
                  // Use a more robust connection check
                  const connectionStatus = await Promise.race([
                    window.aptos.isConnected(),
                    new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Connection timeout')), 3000)
                    )
                  ]);
                  
                  if (connectionStatus) {
                    walletApi = window.aptos;
                    isWalletAvailable = true;
                    console.log('Petra wallet restored successfully');
                  }
                } catch (err) {
                  console.log('Petra wallet not responsive:', err.message);
                  // Try alternative Petra detection
                  if (window.petra) {
                    try {
                      await window.petra.isConnected();
                      walletApi = window.petra;
                      isWalletAvailable = true;
                      console.log('Petra wallet restored via window.petra');
                    } catch (petraErr) {
                      console.log('Petra via window.petra also failed:', petraErr.message);
                    }
                  }
                }
              } else if (savedWallet === 'Martian' && window.martian) {
                // Test if Martian wallet is actually responsive
                try {
                  const connectionStatus = await Promise.race([
                    window.martian.isConnected(),
                    new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Connection timeout')), 3000)
                    )
                  ]);
                  
                  if (connectionStatus) {
                    walletApi = window.martian;
                    isWalletAvailable = true;
                    console.log('Martian wallet restored successfully');
                  }
                } catch (err) {
                  console.log('Martian wallet not responsive:', err.message);
                }
              }
            } catch (err) {
              console.log('Wallet availability check failed:', err);
            }
            
            // Update account with wallet API if available
            if (walletApi && isWalletAvailable) {
              setAccount(prev => ({
                ...prev,
                walletApi: walletApi
              }));
              
              // Get balance immediately after successful connection
              try {
                await getBalance(savedAddress);
              } catch (err) {
                console.log('Failed to restore balance:', err);
              }
            } else {
              // Wallet is not available, disconnect
              console.log('Wallet not available, disconnecting...');
              setIsConnected(false);
              setAccount(null);
              setWalletName(null);
              localStorage.removeItem('aptospay_connected');
              localStorage.removeItem('aptospay_account_address');
              localStorage.removeItem('aptospay_wallet_name');
            }
          }, 1000); // Longer delay to ensure wallet extension is loaded
        }
      } catch (err) {
        console.log('Failed to restore wallet connection:', err);
        // Clear corrupted localStorage
        localStorage.removeItem('aptospay_connected');
        localStorage.removeItem('aptospay_account_address');
        localStorage.removeItem('aptospay_wallet_name');
      }
    };
    
    restoreConnection();
  }, []);

  const connectWallet = async (walletType = 'petra') => {
    try {
      setLoading(true);
      setError(null);

      if (typeof window === 'undefined') {
        throw new Error('Wallet connection only available in browser');
      }

      let wallet = null;
      let accountData = null;
      let walletApi = null;

      // Optimize wallet detection - check availability first
      const petraAvailable = window.aptos && typeof window.aptos.connect === 'function';
      const martianAvailable = window.martian && typeof window.martian.connect === 'function';

      if (!petraAvailable && !martianAvailable) {
        throw new Error('No wallet found. Please install Petra or Martian wallet.');
      }

      // Try to connect to specific wallet type
      if (walletType === 'petra' && petraAvailable) {
        try {
          const response = await Promise.race([
            window.aptos.connect(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Connection timeout')), 10000)
            )
          ]);
          
          if (response) {
            accountData = await window.aptos.account();
            wallet = 'Petra';
            walletApi = window.aptos;
          }
        } catch (err) {
          console.log('Petra wallet connection failed, trying window.petra:', err);
          // Try alternative Petra API
          if (window.petra) {
            try {
              const response = await Promise.race([
                window.petra.connect(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Connection timeout')), 10000)
                )
              ]);
              
              if (response) {
                accountData = await window.petra.account();
                wallet = 'Petra';
                walletApi = window.petra;
                console.log('Petra connected via window.petra');
              }
            } catch (petraErr) {
              console.log('Petra via window.petra also failed:', petraErr);
            }
          }
        }
      } else if (walletType === 'martian' && martianAvailable) {
        try {
          const response = await Promise.race([
            window.martian.connect(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Connection timeout')), 10000)
            )
          ]);
          
          if (response) {
            accountData = await window.martian.account();
            wallet = 'Martian';
            walletApi = window.martian;
          }
        } catch (err) {
          console.log('Martian wallet connection failed:', err);
        }
      }

      // Auto-detect wallet if no specific type provided or failed
      if (!wallet) {
        if (petraAvailable) {
          try {
            const response = await Promise.race([
              window.aptos.connect(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 10000)
              )
            ]);
            
            if (response) {
              accountData = await window.aptos.account();
              wallet = 'Petra';
              walletApi = window.aptos;
            }
          } catch (err) {
            console.log('Petra auto-connect failed:', err);
          }
        }

        if (!wallet && martianAvailable) {
          try {
            const response = await Promise.race([
              window.martian.connect(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 10000)
              )
            ]);
            
            if (response) {
              accountData = await window.martian.account();
              wallet = 'Martian';
              walletApi = window.martian;
            }
          } catch (err) {
            console.log('Martian auto-connect failed:', err);
          }
        }
      }

      if (!wallet || !accountData) {
        throw new Error('No wallet found or connection rejected. Please install Petra or Martian wallet.');
      }

      // Create account object
      const account = {
        accountAddress: { toString: () => accountData.address },
        wallet: wallet,
        walletApi: walletApi
      };

      // Update state immediately for faster UI response
      setAccount(account);
      setIsConnected(true);
      setWalletName(wallet);

      // Store connection state in localStorage for persistence
      localStorage.setItem('aptospay_connected', 'true');
      localStorage.setItem('aptospay_account_address', accountData.address);
      localStorage.setItem('aptospay_wallet_name', wallet);

      // Get balance in background (non-blocking)
      setTimeout(async () => {
        try {
          await getBalance(accountData.address);
        } catch (err) {
          console.log('Failed to get balance:', err);
        }
      }, 0);
      
    } catch (err) {
      setError('Failed to connect wallet: ' + err.message);
      console.error('Wallet connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      setLoading(true);
      
      // Disconnect from wallet if API available
      if (account?.walletApi) {
        try {
          await account.walletApi.disconnect();
        } catch (err) {
          console.log('Wallet disconnect API failed:', err);
        }
      }
      
      setAccount(null);
      setBalance(0);
      setIsConnected(false);
      setError(null);
      setWalletName(null);
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aptospay_connected');
        localStorage.removeItem('aptospay_account_address');
        localStorage.removeItem('aptospay_wallet_name');
      }
    } finally {
      setLoading(false);
    }
  };

  const getBalance = async (address) => {
    try {
      console.log('=== BALANCE FETCH DEBUG ===');
      console.log('Fetching balance for address:', address);
      console.log('Using Aptos client on network:', config.network);
      
      // Try multiple balance fetching methods
      let balanceInAPT = 0;
      
      try {
        // Method 1: getAccountAPTAmount (preferred)
        const balance = await client.getAccountAPTAmount({ accountAddress: address });
        balanceInAPT = balance / Math.pow(10, 8);
        console.log('Method 1 (getAccountAPTAmount) success:', balanceInAPT, 'APT');
      } catch (method1Err) {
        console.log('Method 1 failed:', method1Err.message);
        
        try {
          // Method 2: getAccountInfo with coin data
          const accountInfo = await client.getAccountInfo({ accountAddress: address });
          console.log('Account info response:', accountInfo);
          
          if (accountInfo && accountInfo.data && accountInfo.data.coin) {
            balanceInAPT = accountInfo.data.coin.value / Math.pow(10, 8);
            console.log('Method 2 (getAccountInfo) success:', balanceInAPT, 'APT');
          } else {
            console.log('No coin data found in account info');
          }
        } catch (method2Err) {
          console.log('Method 2 failed:', method2Err.message);
          
          try {
            // Method 3: Direct account resources query
            const resources = await client.getAccountResources({ accountAddress: address });
            console.log('Account resources:', resources);
            
            // Look for AptosCoin resource
            const aptosCoinResource = resources.find(resource => 
              resource.type.includes('0x1::coin::CoinStore') && 
              resource.type.includes('0x1::aptos_coin::AptosCoin')
            );
            
            if (aptosCoinResource && aptosCoinResource.data && aptosCoinResource.data.coin) {
              balanceInAPT = aptosCoinResource.data.coin.value / Math.pow(10, 8);
              console.log('Method 3 (getAccountResources) success:', balanceInAPT, 'APT');
            } else {
              console.log('No AptosCoin resource found');
            }
          } catch (method3Err) {
            console.log('Method 3 failed:', method3Err.message);
          }
        }
      }
      
      console.log('Final balance result:', balanceInAPT, 'APT');
      setBalance(balanceInAPT);
      
      // If balance is 0, suggest getting devnet tokens
      if (balanceInAPT === 0) {
        console.log('Balance is 0 - user may need devnet tokens');
      }
      
    } catch (err) {
      console.error('All balance fetch methods failed:', err);
      setBalance(0);
    }
  };

  const sendTransaction = async (recipient, amount) => {
    if (!account) {
      throw new Error('Wallet not connected. Please reconnect your wallet.');
    }

    if (!account.walletApi) {
      throw new Error('Wallet API not available. Please disconnect and reconnect your wallet to enable transactions.');
    }

    // Validate inputs
    if (!recipient || recipient.trim().length === 0) {
      throw new Error('Recipient address is required');
    }

    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (amount > balance) {
      throw new Error(`Insufficient balance. You have ${balance.toFixed(4)} APT but trying to send ${amount} APT`);
    }

    try {
      setLoading(true);
      setError(null);

      const amountInOctas = Math.floor(amount * Math.pow(10, 8)); // Convert APT to octas

      // Clean the recipient address (remove 0x prefix if present)
      const cleanRecipient = recipient.startsWith('0x') ? recipient.slice(2) : recipient;

      // Validate recipient address format (basic validation)
      if (cleanRecipient.length !== 64) {
        throw new Error('Invalid recipient address format. Aptos addresses should be 64 characters long.');
      }

      console.log('=== TRANSACTION DEBUG INFO ===');
      console.log('Wallet name:', account.wallet);
      console.log('Wallet API available:', !!account.walletApi);
      console.log('Wallet API methods:', Object.keys(account.walletApi || {}));
      console.log('Recipient address:', cleanRecipient);
      console.log('Amount in octas:', amountInOctas);
      console.log('Current balance:', balance);

      let result;

      // Check if wallet is still connected before proceeding
      try {
        if (account.walletApi && account.walletApi.isConnected) {
          const isConnected = await account.walletApi.isConnected();
          if (!isConnected) {
            throw new Error('Wallet is disconnected. Please reconnect your wallet.');
          }
        }
      } catch (connectionError) {
        console.error('Wallet connection check failed:', connectionError);
        throw new Error('Wallet connection lost. Please reconnect your wallet.');
      }

      // Use the Aptos SDK to generate the transaction properly
      try {
        console.log('=== USING APTOS SDK METHOD ===');
        
        // Generate transaction using Aptos SDK
        const rawTxn = await client.generateTransaction({
          sender: account.accountAddress.toString(),
          data: {
            function: "0x1::coin::transfer",
            arguments: [cleanRecipient, amountInOctas.toString()],
            type_arguments: ["0x1::aptos_coin::AptosCoin"]
          }
        });

        console.log('Generated raw transaction:', rawTxn);

        // Try to sign and submit using wallet
        if (account.walletApi.signAndSubmitTransaction) {
          console.log('Using wallet signAndSubmitTransaction with SDK generated transaction');
          result = await account.walletApi.signAndSubmitTransaction(rawTxn);
        } else if (account.walletApi.signTransaction) {
          console.log('Using wallet signTransaction + SDK submitTransaction');
          const signedTxn = await account.walletApi.signTransaction(rawTxn);
          result = await client.submitTransaction({ transaction: signedTxn });
        } else {
          throw new Error('No signing method available in wallet');
        }

        console.log('Transaction successful! Result:', result);
        
      } catch (sdkError) {
        console.error('SDK method failed, trying direct wallet methods:', sdkError);
        
        // Fallback to direct wallet methods with proper Petra format
        const transactionPayload = {
          type: "entry_function_payload",
          function: "0x1::coin::transfer",
          arguments: [cleanRecipient, amountInOctas.toString()],
          type_arguments: ["0x1::aptos_coin::AptosCoin"]
        };

        // Try different formats for Petra wallet
        const transactionFormats = [
          // New Petra format (most likely to work)
          { payload: transactionPayload },
          // Alternative format with sender
          { 
            sender: account.accountAddress.toString(),
            payload: transactionPayload 
          },
          // Direct payload (legacy)
          transactionPayload
        ];

        let lastError = null;
        for (let i = 0; i < transactionFormats.length; i++) {
          try {
            console.log(`Trying direct wallet format ${i + 1}:`, transactionFormats[i]);
            
            if (account.walletApi.signAndSubmitTransaction) {
              result = await account.walletApi.signAndSubmitTransaction(transactionFormats[i]);
            } else if (account.walletApi.signTransaction) {
              const signedTx = await account.walletApi.signTransaction(transactionFormats[i]);
              result = await client.submitTransaction({ transaction: signedTx });
            } else {
              throw new Error('No signing method available');
            }
            
            console.log('Direct wallet transaction success! Result:', result);
            break; // Success, exit the loop
          } catch (err) {
            console.error(`Direct wallet format ${i + 1} failed:`, err);
            lastError = err;
            if (i === transactionFormats.length - 1) {
              // All formats failed
              throw new Error(`All transaction methods failed. Last error: ${lastError.message || lastError.toString()}. Please make sure you approve the transaction in your wallet popup.`);
            }
          }
        }
      }
      
      // Wait a moment for transaction to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh balance after successful transaction
      await getBalance(account.accountAddress.toString());

      return result.hash || result;
    } catch (err) {
      console.error('=== TRANSACTION ERROR ===');
      console.error('Error details:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      
      const errorMessage = err.message || err.toString() || 'Unknown error occurred';
      setError(`Transaction failed: ${errorMessage}`);
      throw new Error(`Transaction failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const requestFaucet = async () => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      console.log('=== FAUCET REQUEST DEBUG ===');
      console.log('Requesting faucet for address:', account.accountAddress.toString());
      console.log('Network:', config.network);
      
      // Use the new SDK method for funding accounts on devnet
      const result = await client.fundAccount({
        accountAddress: account.accountAddress.toString(),
        amount: 100000000 // 1 APT in octas
      });
      
      console.log('Faucet request result:', result);
      
      // Wait a moment for the transaction to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh balance
      await getBalance(account.accountAddress.toString());
      
      console.log('Faucet request completed successfully');
    } catch (err) {
      console.error('Faucet request failed:', err);
      setError('Faucet request failed: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkWalletConnection = async () => {
    if (!account || !account.walletApi) {
      return false;
    }

    try {
      if (account.walletApi.isConnected) {
        const isConnected = await account.walletApi.isConnected();
        if (!isConnected) {
          // Wallet is disconnected, clear the connection
          disconnectWallet();
          return false;
        }
        return true;
      }
      return true; // If no isConnected method, assume connected
    } catch (err) {
      console.error('Wallet connection check failed:', err);
      // If connection check fails, assume disconnected
      disconnectWallet();
      return false;
    }
  };

  const reconnectWallet = async () => {
    try {
      setLoading(true);
      setError(null);

      // Clear current connection
      setAccount(null);
      setIsConnected(false);
      setWalletName(null);
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aptospay_connected');
        localStorage.removeItem('aptospay_account_address');
        localStorage.removeItem('aptospay_wallet_name');
      }

      // Try to reconnect with the same wallet type
      const savedWallet = localStorage.getItem('aptospay_wallet_name') || 'petra';
      await connectWallet(savedWallet.toLowerCase());
    } catch (err) {
      setError('Reconnection failed: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const forceWalletRefresh = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!account) {
        throw new Error('No wallet connected');
      }

      console.log('Force refreshing wallet connection...');
      
      // Check if wallet is still available
      let walletApi = null;
      if (account.wallet === 'Petra') {
        if (window.aptos) {
          try {
            await window.aptos.isConnected();
            walletApi = window.aptos;
            console.log('Petra wallet refreshed via window.aptos');
          } catch (err) {
            console.log('Petra via window.aptos failed, trying window.petra');
            if (window.petra) {
              try {
                await window.petra.isConnected();
                walletApi = window.petra;
                console.log('Petra wallet refreshed via window.petra');
              } catch (petraErr) {
                throw new Error('Petra wallet not available');
              }
            } else {
              throw new Error('Petra wallet not available');
            }
          }
        } else {
          throw new Error('Petra wallet not available');
        }
      } else if (account.wallet === 'Martian') {
        if (window.martian) {
          try {
            await window.martian.isConnected();
            walletApi = window.martian;
            console.log('Martian wallet refreshed');
          } catch (err) {
            throw new Error('Martian wallet not available');
          }
        } else {
          throw new Error('Martian wallet not available');
        }
      }

      // Update account with refreshed wallet API
      if (walletApi) {
        setAccount(prev => ({
          ...prev,
          walletApi: walletApi
        }));

        // Refresh balance
        await getBalance(account.accountAddress.toString());
        console.log('Wallet refresh completed successfully');
      } else {
        throw new Error('Wallet API not available');
      }
    } catch (err) {
      console.error('Wallet refresh failed:', err);
      setError('Wallet refresh failed: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    if (!account) {
      throw new Error('No wallet connected');
    }

    try {
      console.log('Manually refreshing balance...');
      await getBalance(account.accountAddress.toString());
      console.log('Balance refresh completed');
    } catch (err) {
      console.error('Balance refresh failed:', err);
      throw err;
    }
  };

  const value = {
    account,
    balance,
    isConnected,
    loading,
    error,
    walletName,
    connectWallet,
    disconnectWallet,
    getBalance,
    sendTransaction,
    requestFaucet,
    checkWalletConnection,
    reconnectWallet,
    forceWalletRefresh,
    refreshBalance,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
