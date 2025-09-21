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

  // Restore wallet connection on app load
  useEffect(() => {
    const restoreConnection = async () => {
      if (typeof window !== 'undefined') {
        const wasConnected = localStorage.getItem('aptospay_connected');
        const savedAddress = localStorage.getItem('aptospay_account_address');
        const savedWallet = localStorage.getItem('aptospay_wallet_name');
        
        if (wasConnected === 'true' && savedAddress) {
          setIsConnected(true);
          setWalletName(savedWallet);
          // Create a mock account object with the saved address
          const mockAccount = {
            accountAddress: { toString: () => savedAddress }
          };
          setAccount(mockAccount);
          await getBalance(savedAddress);
        }
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

      // Try to connect to Petra wallet
      if (walletType === 'petra' && window.aptos) {
        try {
          const response = await window.aptos.connect();
          if (response) {
            accountData = await window.aptos.account();
            wallet = 'Petra';
          }
        } catch (err) {
          console.log('Petra wallet connection failed:', err);
        }
      }

      // Try to connect to Martian wallet
      if (walletType === 'martian' && window.martian) {
        try {
          const response = await window.martian.connect();
          if (response) {
            accountData = await window.martian.account();
            wallet = 'Martian';
          }
        } catch (err) {
          console.log('Martian wallet connection failed:', err);
        }
      }

      // Auto-detect wallet if no specific type provided
      if (!wallet) {
        if (window.aptos) {
          try {
            const response = await window.aptos.connect();
            if (response) {
              accountData = await window.aptos.account();
              wallet = 'Petra';
            }
          } catch (err) {
            console.log('Petra auto-connect failed:', err);
          }
        }

        if (!wallet && window.martian) {
          try {
            const response = await window.martian.connect();
            if (response) {
              accountData = await window.martian.account();
              wallet = 'Martian';
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
        walletApi: wallet === 'Petra' ? window.aptos : window.martian
      };

      setAccount(account);
      setIsConnected(true);
      setWalletName(wallet);

      // Store connection state in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('aptospay_connected', 'true');
        localStorage.setItem('aptospay_account_address', accountData.address);
        localStorage.setItem('aptospay_wallet_name', wallet);
      }

      // Get balance
      await getBalance(accountData.address);
      
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
    if (!account || !account.walletApi) {
      throw new Error('Wallet not connected or wallet API not available');
    }

    try {
      setLoading(true);
      setError(null);

      const amountInOctas = Math.floor(amount * Math.pow(10, 8)); // Convert APT to octas

      // Use the wallet's transaction API
      const transaction = {
        arguments: [recipient, amountInOctas.toString()],
        function: "0x1::coin::transfer",
        type: "entry_function_payload",
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
      };

      const result = await account.walletApi.signAndSubmitTransaction(transaction);
      
      // Refresh balance after successful transaction
      await getBalance(account.accountAddress.toString());

      return result.hash;
    } catch (err) {
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
