import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
  Share,
  Clipboard,
} from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import { useTheme } from '../contexts/ThemeContext';
import WalletConnect from '../components/WalletConnect';
import ThemeToggle from '../components/ThemeToggle';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { 
    account, 
    balance, 
    isConnected, 
    loading, 
    error, 
    getBalance, 
    requestFaucet,
    sendTransaction,
    checkWalletConnection,
    reconnectWallet,
    forceWalletRefresh,
    refreshBalance,
    disconnectWallet
  } = useWallet();

  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  
  // Modal states
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  
  // Send form states
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  useEffect(() => {
    if (isConnected && account) {
      getBalance(account.accountAddress.toString());
    }
  }, [isConnected, account]);

  const handleRefresh = async () => {
    if (isConnected && account) {
      await getBalance(account.accountAddress.toString());
    }
  };

  const handleFaucet = async () => {
    try {
      await requestFaucet();
      Alert.alert('Success', '1 APT has been added to your wallet from the Devnet faucet!');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleSend = async () => {
    if (!recipientAddress || !sendAmount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (parseFloat(sendAmount) <= 0 || parseFloat(sendAmount) > balance) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Check wallet connection before sending
    const isWalletConnected = await checkWalletConnection();
    if (!isWalletConnected) {
      Alert.alert(
        'Wallet Disconnected', 
        'Your wallet connection has been lost. Would you like to reconnect?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Reconnect', 
            onPress: async () => {
              try {
                await reconnectWallet();
                Alert.alert('Success', 'Wallet reconnected successfully!');
              } catch (err) {
                Alert.alert('Error', 'Failed to reconnect wallet. Please try connecting manually.');
              }
            }
          }
        ]
      );
      return;
    }

    setSendLoading(true);
    try {
      const result = await sendTransaction(recipientAddress, parseFloat(sendAmount));
      Alert.alert('Success', `Transaction sent successfully! Hash: ${result}`);
      setShowSendModal(false);
      setRecipientAddress('');
      setSendAmount('');
    } catch (err) {
      console.error('Send transaction error:', err);
      const errorMessage = err.message || 'Unknown error occurred';
      
      // Check if error is related to wallet disconnection
      if (errorMessage.includes('disconnected') || errorMessage.includes('connection lost')) {
        Alert.alert(
          'Wallet Disconnected', 
          'Your wallet connection was lost during the transaction. Would you like to reconnect?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Reconnect', 
              onPress: async () => {
                try {
                  await reconnectWallet();
                  Alert.alert('Success', 'Wallet reconnected successfully!');
                } catch (reconnectErr) {
                  Alert.alert('Error', 'Failed to reconnect wallet. Please try connecting manually.');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Transaction Failed', errorMessage);
      }
    } finally {
      setSendLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (account?.accountAddress) {
      Clipboard.setString(account.accountAddress.toString());
      Alert.alert('Copied', 'Address copied to clipboard');
    }
  };

  const handleShareAddress = async () => {
    if (account?.accountAddress) {
      try {
        await Share.share({
          message: `My Aptos address: ${account.accountAddress.toString()}`,
        });
      } catch (err) {
        console.log('Share error:', err);
      }
    }
  };

  const handleWalletRefresh = async () => {
    try {
      await forceWalletRefresh();
      Alert.alert('Success', 'Wallet connection refreshed successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to refresh wallet connection. Please try reconnecting manually.');
    }
  };

  const handleBalanceRefresh = async () => {
    try {
      await refreshBalance();
      Alert.alert('Success', 'Balance refreshed successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to refresh balance. Please check your connection.');
    }
  };

  const handleDisconnect = () => {
    console.log('=== DISCONNECT BUTTON CLICKED ===');
    console.log('Current connection state:', isConnected);
    console.log('Current account:', account);
    
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            console.log('User confirmed disconnect, calling disconnectWallet...');
            disconnectWallet()
              .then(() => {
                console.log('Disconnect completed, showing success alert');
                Alert.alert('Success', 'Wallet disconnected successfully!');
              })
              .catch((err) => {
                console.error('Disconnect error in HomeScreen:', err);
                Alert.alert('Error', 'Failed to disconnect wallet. Please try again.');
              });
          },
        },
      ]
    );
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
      }
    >
       {/* Header */}
       <View style={[styles.header, { backgroundColor: colors.primary }]}>
         <View style={styles.headerTop}>
           <View style={styles.headerContent}>
             <Text style={[styles.title, { color: colors.textInverse }]}>AptosPay</Text>
             <Text style={[styles.subtitle, { color: colors.textInverse }]}>Aptos Devnet Wallet</Text>
           </View>
           <View style={styles.headerActions}>
             {isConnected && (
               <TouchableOpacity 
                 style={styles.headerDisconnectButton}
                 onPress={() => {
                   console.log('Header disconnect button clicked');
                   handleDisconnect();
                 }}
               >
                 <Ionicons name="log-out-outline" size={20} color={colors.textInverse} />
               </TouchableOpacity>
             )}
             <ThemeToggle size="small" showLabel={false} />
           </View>
         </View>
         <View style={styles.networkBadge}>
           <View style={styles.networkDot} />
           <Text style={styles.networkText}>Devnet</Text>
         </View>
       </View>

      {!isConnected ? (
        <View style={styles.walletSection}>
          <View style={[styles.walletCard, { backgroundColor: colors.surface, ...shadows.lg }]}>
            <Ionicons name="wallet-outline" size={64} color={colors.primary} />
            <Text style={[styles.walletTitle, { color: colors.text }]}>Connect Your Wallet</Text>
            <Text style={[styles.walletSubtitle, { color: colors.textSecondary }]}>
              Connect to start using AptosPay on devnet
            </Text>
            <WalletConnect />
          </View>
        </View>
      ) : (
        <View style={styles.connectedSection}>
           {/* Balance Card */}
           <View style={[styles.balanceCard, { backgroundColor: colors.surface, ...shadows.md }]}>
             <View style={styles.balanceHeader}>
               <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Total Balance</Text>
               <TouchableOpacity onPress={handleRefresh} disabled={loading}>
                 <Ionicons name="refresh" size={20} color={colors.textSecondary} />
               </TouchableOpacity>
             </View>
             <Text style={[styles.balanceAmount, { color: colors.text }]}>{balance.toFixed(4)}</Text>
             <Text style={[styles.balanceCurrency, { color: colors.primary }]}>APT</Text>
             <Text style={[styles.balanceUsd, { color: colors.textSecondary }]}>≈ ${(balance * 10).toFixed(2)} USD</Text>
           </View>

           {/* Account Info */}
           <View style={[styles.accountCard, { backgroundColor: colors.surface, ...shadows.sm }]}>
             <View style={styles.accountHeader}>
               <Ionicons name="person-circle" size={24} color={colors.primary} />
               <Text style={[styles.accountTitle, { color: colors.text }]}>Account</Text>
               <TouchableOpacity 
                 style={styles.disconnectButton}
                 onPress={() => {
                   console.log('Header disconnect button clicked');
                   handleDisconnect();
                 }}
               >
                 <Ionicons name="log-out-outline" size={20} color={colors.red} />
               </TouchableOpacity>
             </View>
             <Text style={[styles.accountAddress, { color: colors.textSecondary }]}>
               {formatAddress(account?.accountAddress.toString())}
             </Text>
             <View style={styles.walletInfo}>
               <View style={[styles.walletBadge, { backgroundColor: colors.primary }]}>
                 <Text style={[styles.walletBadgeText, { color: colors.textInverse }]}>
                   {account?.wallet || 'Unknown'}
                 </Text>
               </View>
               <Text style={[styles.walletStatus, { color: colors.green }]}>● Connected</Text>
             </View>
             <View style={styles.accountActions}>
               <TouchableOpacity 
                 style={styles.copyButton}
                 onPress={() => {
                   navigator.clipboard?.writeText(account?.accountAddress.toString());
                   Alert.alert('Copied', 'Address copied to clipboard');
                 }}
               >
                 <Ionicons name="copy-outline" size={16} color={colors.primary} />
                 <Text style={[styles.copyText, { color: colors.primary }]}>Copy</Text>
               </TouchableOpacity>
               
               <TouchableOpacity 
                 style={[styles.disconnectButtonFull, { backgroundColor: colors.errorBackground }]}
                 onPress={() => {
                   console.log('Full disconnect button clicked');
                   handleDisconnect();
                 }}
               >
                 <Ionicons name="log-out-outline" size={16} color={colors.red} />
                 <Text style={[styles.disconnectText, { color: colors.red }]}>Disconnect</Text>
               </TouchableOpacity>
               
               {/* Test Direct Disconnect Button */}
               <TouchableOpacity 
                 style={[styles.disconnectButtonFull, { backgroundColor: colors.accent3, marginTop: 8 }]}
                 onPress={() => {
                   console.log('TEST: Direct disconnect call');
                   disconnectWallet()
                     .then(() => {
                       console.log('TEST: Direct disconnect completed');
                       Alert.alert('Test Success', 'Direct disconnect completed!');
                     })
                     .catch((err) => {
                       console.error('TEST: Direct disconnect failed:', err);
                       Alert.alert('Test Error', 'Direct disconnect failed: ' + err.message);
                     });
                 }}
               >
                 <Ionicons name="bug" size={16} color="white" />
                 <Text style={[styles.disconnectText, { color: 'white' }]}>Test Disconnect</Text>
               </TouchableOpacity>
             </View>
           </View>

           {/* Main Features */}
           <View style={styles.featuresSection}>
             <Text style={[styles.sectionTitle, { color: colors.text }]}>DeFi Features</Text>
             <View style={styles.featuresGrid}>
               <TouchableOpacity
                 style={[styles.featureCard, { backgroundColor: colors.surface, ...shadows.sm }]}
                 onPress={() => navigation.navigate('KanaTrade')}
               >
                 <View style={[styles.featureIcon, { backgroundColor: colors.accent1 }]}>
                   <Ionicons name="bar-chart" size={24} color="white" />
                 </View>
                 <Text style={[styles.featureTitle, { color: colors.text }]}>Kana Trade</Text>
                 <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>Order book trading</Text>
               </TouchableOpacity>
               
               <TouchableOpacity
                 style={[styles.featureCard, { backgroundColor: colors.surface, ...shadows.sm }]}
                 onPress={() => navigation.navigate('KanaTrade', { screen: 'MarketData' })}
               >
                 <View style={[styles.featureIcon, { backgroundColor: colors.accent2 }]}>
                   <Ionicons name="analytics" size={24} color="white" />
                 </View>
                 <Text style={[styles.featureTitle, { color: colors.text }]}>Market Data</Text>
                 <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>Real-time prices</Text>
               </TouchableOpacity>
               
               <TouchableOpacity
                 style={[styles.featureCard, { backgroundColor: colors.surface, ...shadows.sm }]}
                 onPress={() => navigation.navigate('Trading')}
               >
                 <View style={[styles.featureIcon, { backgroundColor: colors.accent3 }]}>
                   <Ionicons name="trending-up" size={24} color="white" />
                 </View>
                 <Text style={[styles.featureTitle, { color: colors.text }]}>Leveraged Trade</Text>
                 <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>Up to 1000x leverage</Text>
               </TouchableOpacity>
               
               <TouchableOpacity
                 style={[styles.featureCard, { backgroundColor: colors.surface, ...shadows.sm }]}
                 onPress={() => navigation.navigate('AMM')}
               >
                 <View style={[styles.featureIcon, { backgroundColor: colors.accent4 }]}>
                   <Ionicons name="swap-horizontal" size={24} color="white" />
                 </View>
                 <Text style={[styles.featureTitle, { color: colors.text }]}>AMM Pools</Text>
                 <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>Liquidity & swaps</Text>
               </TouchableOpacity>
               
               <TouchableOpacity
                 style={[styles.featureCard, { backgroundColor: colors.surface, ...shadows.sm }]}
                 onPress={() => navigation.navigate('Hedging')}
               >
                 <View style={[styles.featureIcon, { backgroundColor: colors.primary }]}>
                   <Ionicons name="shield-checkmark" size={24} color="white" />
                 </View>
                 <Text style={[styles.featureTitle, { color: colors.text }]}>Risk Hedging</Text>
                 <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>Portfolio protection</Text>
               </TouchableOpacity>
               
               <TouchableOpacity
                 style={[styles.featureCard, { backgroundColor: colors.surface, ...shadows.sm }]}
                 onPress={() => navigation.navigate('Guide')}
               >
                 <View style={[styles.featureIcon, { backgroundColor: colors.accent5 }]}>
                   <Ionicons name="book" size={24} color="white" />
                 </View>
                 <Text style={[styles.featureTitle, { color: colors.text }]}>Guide</Text>
                 <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>Documentation</Text>
               </TouchableOpacity>
             </View>
           </View>

           {/* Wallet Actions */}
           <View style={styles.walletSection}>
             <Text style={[styles.sectionTitle, { color: colors.text }]}>Wallet</Text>
             <View style={styles.walletGrid}>
               <TouchableOpacity
                 style={[styles.walletCard, { backgroundColor: colors.surface, ...shadows.sm }]}
                 onPress={() => setShowSendModal(true)}
               >
                 <View style={[styles.walletIcon, { backgroundColor: colors.red }]}>
                   <Ionicons name="send" size={20} color="white" />
                 </View>
                 <Text style={[styles.walletText, { color: colors.text }]}>Send</Text>
               </TouchableOpacity>
               
               <TouchableOpacity
                 style={[styles.walletCard, { backgroundColor: colors.surface, ...shadows.sm }]}
                 onPress={() => setShowReceiveModal(true)}
               >
                 <View style={[styles.walletIcon, { backgroundColor: colors.green }]}>
                   <Ionicons name="download" size={20} color="white" />
                 </View>
                 <Text style={[styles.walletText, { color: colors.text }]}>Receive</Text>
               </TouchableOpacity>
               
               <TouchableOpacity
                 style={[styles.walletCard, { backgroundColor: colors.surface, ...shadows.sm }]}
                 onPress={() => setShowScannerModal(true)}
               >
                 <View style={[styles.walletIcon, { backgroundColor: colors.blue }]}>
                   <Ionicons name="qr-code" size={20} color="white" />
                 </View>
                 <Text style={[styles.walletText, { color: colors.text }]}>Scan QR</Text>
               </TouchableOpacity>
               
               <TouchableOpacity
                 style={[styles.walletCard, { backgroundColor: colors.surface, ...shadows.sm }]}
                 onPress={handleFaucet}
                 disabled={loading}
               >
                 <View style={[styles.walletIcon, { backgroundColor: colors.secondary }]}>
                   <Ionicons name="water" size={20} color="white" />
                 </View>
                 <Text style={[styles.walletText, { color: colors.text }]}>
                   {loading ? 'Requesting...' : 'Get APT'}
                 </Text>
               </TouchableOpacity>
             </View>
           </View>

           {/* Quick Stats */}
           <View style={[styles.statsCard, { backgroundColor: colors.surface, ...shadows.sm }]}>
             <Text style={[styles.statsTitle, { color: colors.text }]}>Network Info</Text>
             <View style={styles.statsRow}>
               <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Network:</Text>
               <Text style={[styles.statsValue, { color: colors.text }]}>Aptos Devnet</Text>
             </View>
             <View style={styles.statsRow}>
               <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Status:</Text>
               <View style={styles.statusContainer}>
                 <View style={[styles.statusDot, { backgroundColor: colors.green }]} />
                 <Text style={[styles.statsValue, { color: colors.text }]}>Connected</Text>
               </View>
             </View>
           </View>

           {error && (
             <View style={[styles.errorCard, { backgroundColor: colors.errorBackground, borderLeftColor: colors.red }]}>
               <Ionicons name="warning" size={20} color={colors.red} />
               <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>
             </View>
           )}
        </View>
      )}

      {/* Send Modal */}
      <Modal
        visible={showSendModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSendModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, ...shadows.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Send APT</Text>
              <TouchableOpacity onPress={() => setShowSendModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Recipient Address</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                value={recipientAddress}
                onChangeText={setRecipientAddress}
                placeholder="Enter Aptos address"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Amount (APT)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                value={sendAmount}
                onChangeText={setSendAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              <Text style={[styles.balanceText, { color: colors.textSecondary }]}>
                Balance: {balance.toFixed(4)} APT
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: colors.primary }, sendLoading && { opacity: 0.7 }]}
              onPress={handleSend}
              disabled={sendLoading}
            >
              <Text style={styles.sendButtonText}>
                {sendLoading ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>

            {/* Debug Info */}
            <View style={styles.debugInfo}>
              <Text style={[styles.debugText, { color: colors.textSecondary }]}>
                Debug: Wallet API Available: {account?.walletApi ? 'Yes' : 'No'}
              </Text>
              <Text style={[styles.debugText, { color: colors.textSecondary }]}>
                Wallet Type: {account?.wallet || 'Unknown'}
              </Text>
              <Text style={[styles.debugText, { color: colors.textSecondary }]}>
                Network: Aptos Devnet
              </Text>
              <Text style={[styles.debugText, { color: colors.textSecondary }]}>
                Balance: {balance.toFixed(4)} APT
              </Text>
              <Text style={[styles.debugText, { color: colors.textSecondary }]}>
                Address: {account?.accountAddress?.toString()?.slice(0, 8)}...
              </Text>
              
              <View style={styles.debugButtons}>
                <TouchableOpacity 
                  style={[styles.refreshButton, { backgroundColor: colors.primary, flex: 1, marginRight: 4 }]}
                  onPress={handleWalletRefresh}
                >
                  <Ionicons name="refresh" size={16} color="white" />
                  <Text style={styles.refreshButtonText}>Refresh Wallet</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.refreshButton, { backgroundColor: colors.accent2, flex: 1, marginLeft: 4 }]}
                  onPress={handleBalanceRefresh}
                >
                  <Ionicons name="cash" size={16} color="white" />
                  <Text style={styles.refreshButtonText}>Refresh Balance</Text>
                </TouchableOpacity>
              </View>
              
              {balance === 0 && (
                <View style={styles.zeroBalanceWarning}>
                  <Ionicons name="warning" size={16} color={colors.accent3} />
                  <Text style={[styles.warningText, { color: colors.accent3 }]}>
                    No devnet tokens detected. Use "Get APT" to request test tokens.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Receive Modal */}
      <Modal
        visible={showReceiveModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReceiveModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, ...shadows.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Receive APT</Text>
              <TouchableOpacity onPress={() => setShowReceiveModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.qrContainer}>
              <View style={[styles.qrPlaceholder, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="qr-code" size={80} color={colors.textSecondary} />
                <Text style={[styles.qrText, { color: colors.textSecondary }]}>QR Code</Text>
              </View>
            </View>

            <View style={styles.addressContainer}>
              <Text style={[styles.addressLabel, { color: colors.text }]}>Your Address</Text>
              <View style={[styles.addressBox, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                <Text style={[styles.addressText, { color: colors.text }]}>
                  {account?.accountAddress?.toString() || 'Not connected'}
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleCopyAddress}
              >
                <Ionicons name="copy" size={20} color="white" />
                <Text style={styles.actionButtonText}>Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                onPress={handleShareAddress}
              >
                <Ionicons name="share" size={20} color="white" />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Scanner Modal */}
      <Modal
        visible={showScannerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowScannerModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, ...shadows.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Scan QR Code</Text>
              <TouchableOpacity onPress={() => setShowScannerModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.scannerContainer}>
              <View style={[styles.scannerPlaceholder, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="scan" size={80} color={colors.textSecondary} />
                <Text style={[styles.scannerText, { color: colors.textSecondary }]}>Camera Scanner</Text>
                <Text style={[styles.scannerSubtext, { color: colors.textSecondary }]}>
                  Point camera at QR code
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.scannerButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                Alert.alert('Info', 'QR Scanner functionality will be implemented with camera permissions');
                setShowScannerModal(false);
              }}
            >
              <Ionicons name="camera" size={20} color="white" />
              <Text style={styles.scannerButtonText}>Open Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
   headerTop: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'flex-start',
     marginBottom: 16,
   },
   headerContent: {
     flex: 1,
   },
   headerActions: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 12,
   },
   headerDisconnectButton: {
     padding: 8,
     borderRadius: 8,
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
   },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginRight: 6,
  },
  networkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  walletSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  walletCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
  },
  walletTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 8,
  },
  walletSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
   connectedSection: {
     padding: 20,
     paddingBottom: 40,
   },
  balanceCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
   balanceLabel: {
     fontSize: 16,
     fontWeight: '500',
   },
   balanceAmount: {
     fontSize: 36,
     fontWeight: 'bold',
     marginBottom: 4,
   },
   balanceCurrency: {
     fontSize: 20,
     fontWeight: '600',
     marginBottom: 8,
   },
   balanceUsd: {
     fontSize: 14,
   },
  accountCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
   accountHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     marginBottom: 12,
   },
   accountTitle: {
     fontSize: 16,
     fontWeight: '600',
     marginLeft: 8,
     flex: 1,
   },
   accountAddress: {
     fontSize: 16,
     fontFamily: 'monospace',
     marginBottom: 8,
   },
   walletInfo: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     marginBottom: 12,
   },
   walletBadge: {
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 12,
   },
   walletBadgeText: {
     fontSize: 12,
     fontWeight: '600',
   },
   walletStatus: {
     fontSize: 12,
     fontWeight: '500',
   },
   accountActions: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
   },
   copyButton: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   copyText: {
     fontSize: 14,
     fontWeight: '500',
     marginLeft: 4,
   },
   disconnectButton: {
     padding: 8,
     borderRadius: 8,
   },
   disconnectButtonFull: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 12,
     paddingVertical: 8,
     borderRadius: 8,
   },
   disconnectText: {
     fontSize: 14,
     fontWeight: '500',
     marginLeft: 4,
   },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  actionButton: {
    width: (width - 44) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
   statsTitle: {
     fontSize: 16,
     fontWeight: '600',
     marginBottom: 16,
   },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
   statsLabel: {
     fontSize: 14,
   },
   statsValue: {
     fontSize: 14,
     fontWeight: '500',
   },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
     width: 8,
     height: 8,
     borderRadius: 4,
     marginRight: 6,
   },
  errorCard: {
     borderRadius: 12,
     padding: 16,
     flexDirection: 'row',
     alignItems: 'center',
     borderLeftWidth: 4,
   },
   errorText: {
     fontSize: 14,
     marginLeft: 8,
     flex: 1,
   },
   walletSection: {
     marginBottom: 24,
     paddingHorizontal: 4,
   },
   sectionTitle: {
     fontSize: 18,
     fontWeight: '600',
     marginBottom: 12,
   },
   walletGrid: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     justifyContent: 'space-between',
     alignItems: 'flex-start',
   },
   walletCard: {
     width: (width - 44) / 2,
     borderRadius: 16,
     padding: 16,
     alignItems: 'center',
     marginBottom: 12,
     minHeight: 80,
     justifyContent: 'center',
   },
   walletIcon: {
     width: 40,
     height: 40,
     borderRadius: 20,
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 8,
   },
   walletText: {
     fontSize: 14,
     fontWeight: '600',
     textAlign: 'center',
   },
   featuresSection: {
     marginBottom: 24,
     paddingHorizontal: 4,
   },
   featuresGrid: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     justifyContent: 'space-between',
     alignItems: 'flex-start',
   },
   featureCard: {
     width: (width - 44) / 2,
     borderRadius: 16,
     padding: 16,
     alignItems: 'center',
     marginBottom: 12,
     minHeight: 100,
     justifyContent: 'center',
   },
   featureIcon: {
     width: 48,
     height: 48,
     borderRadius: 24,
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 12,
   },
   featureTitle: {
     fontSize: 14,
     fontWeight: '600',
     marginBottom: 4,
     textAlign: 'center',
   },
   featureSubtitle: {
     fontSize: 11,
     textAlign: 'center',
     lineHeight: 14,
   },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  
  // Send modal styles
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  balanceText: {
    fontSize: 12,
    marginTop: 4,
  },
  sendButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Receive modal styles
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrText: {
    fontSize: 14,
    marginTop: 8,
  },
  addressContainer: {
    marginBottom: 24,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  addressBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Scanner modal styles
  scannerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scannerPlaceholder: {
    width: 250,
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  scannerSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  scannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  scannerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Debug styles
  debugInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    marginBottom: 4,
  },
  debugButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  zeroBalanceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 6,
    gap: 6,
  },
  warningText: {
    fontSize: 11,
    flex: 1,
  },
});

export default HomeScreen;
