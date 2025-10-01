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
            if (savedWallet === 'Petra' && window.aptos) {
              try {
                walletApi = window.aptos;
              } catch (err) {
                console.log('Petra wallet not available for restore');
              }
            } else if (savedWallet === 'Martian' && window.martian) {
              try {
                walletApi = window.martian;
              } catch (err) {
                console.log('Martian wallet not available for restore');
              }
            }
            
            // Update account with wallet API if available
            if (walletApi) {
              setAccount(prev => ({
                ...prev,
                walletApi: walletApi
              }));
            }
            
            // Get balance in background
            try {
              await getBalance(savedAddress);
            } catch (err) {
              console.log('Failed to restore balance:', err);
            }
          }, 100); // Small delay to not block UI
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
          console.log('Petra wallet connection failed:', err);
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
      const balance = await client.getAccountAPTAmount({ accountAddress: address });
      setBalance(balance / Math.pow(10, 8)); // Convert from octas to APT
    } catch (err) {
      console.error('Error fetching balance:', err);
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

    try {
      setLoading(true);
      setError(null);

      const amountInOctas = Math.floor(amount * Math.pow(10, 8)); // Convert APT to octas

      // Clean the recipient address (remove 0x prefix if present)
      const cleanRecipient = recipient.startsWith('0x') ? recipient.slice(2) : recipient;

      // Use the wallet's transaction API with proper format
      const transaction = {
        arguments: [cleanRecipient, amountInOctas.toString()],
        function: "0x1::coin::transfer",
        type: "entry_function_payload",
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
      };

      console.log('Sending transaction:', transaction);
      console.log('Wallet API available:', !!account.walletApi);
      console.log('Wallet API methods:', Object.keys(account.walletApi || {}));
      
      let result;
      
      // Try the wallet's signAndSubmitTransaction method first
      if (account.walletApi.signAndSubmitTransaction) {
        console.log('Using signAndSubmitTransaction');
        result = await account.walletApi.signAndSubmitTransaction(transaction);
      } 
      // Try signTransaction + submitTransaction
      else if (account.walletApi.signTransaction) {
        console.log('Using signTransaction + submitTransaction');
        const signedTx = await account.walletApi.signTransaction(transaction);
        result = await client.submitTransaction({ transaction: signedTx });
      } 
      // Try alternative method names
      else if (account.walletApi.submitTransaction) {
        console.log('Using submitTransaction');
        result = await account.walletApi.submitTransaction(transaction);
      }
      else {
        throw new Error(`Wallet does not support transaction signing. Available methods: ${Object.keys(account.walletApi || {}).join(', ')}`);
      }
      
      console.log('Transaction result:', result);
      
      // Refresh balance after successful transaction
      await getBalance(account.accountAddress.toString());

      return result.hash || result;
    } catch (err) {
      console.error('Transaction error:', err);
      setError('Transaction failed: ' + err.message);
      throw err;
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
      // Use the new SDK method for funding accounts on devnet
      await client.fundAccount({
        accountAddress: account.accountAddress.toString(),
        amount: 100000000 // 1 APT in octas
      });
      await getBalance(account.accountAddress.toString());
    } catch (err) {
      setError('Faucet request failed: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
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
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
