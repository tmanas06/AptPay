import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import { Ionicons } from '@expo/vector-icons';

const WalletConnect = () => {
  const { connectWallet, disconnectWallet, isConnected, account, balance, loading, walletName } = useWallet();
  const [showModal, setShowModal] = useState(false);

  const handleConnect = async (walletType) => {
    try {
      await connectWallet(walletType);
      setShowModal(false);
    } catch (error) {
      Alert.alert('Connection Failed', error.message);
    }
  };

  const checkWalletAvailability = () => {
    if (typeof window === 'undefined') {
      return { petra: false, martian: false };
    }
    
    return {
      petra: !!window.aptos,
      martian: !!window.martian
    };
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', onPress: disconnectWallet },
      ]
    );
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected && account) {
    return (
      <View style={styles.connectedContainer}>
        <View style={styles.walletInfo}>
          <View style={styles.walletHeader}>
            <Ionicons name="wallet" size={24} color="#34C759" />
            <Text style={styles.walletStatus}>Connected via {walletName}</Text>
          </View>
          <Text style={styles.walletAddress}>{formatAddress(account.accountAddress.toString())}</Text>
          <Text style={styles.walletBalance}>{balance.toFixed(4)} APT</Text>
        </View>
        <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.disconnectText}>Disconnect</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const wallets = checkWalletAvailability();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.connectButton} onPress={() => setShowModal(true)}>
        <Ionicons name="wallet-outline" size={24} color="#007AFF" />
        <Text style={styles.connectText}>Connect Wallet</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Connect Your Wallet</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContainer}>
              <Text style={styles.modalSubtitle}>
                Choose a wallet to connect to AptosPay
              </Text>

              <View style={styles.walletOptions}>
                {/* Petra Wallet */}
                <TouchableOpacity 
                  style={[
                    styles.walletOption,
                    !wallets.petra && styles.walletOptionDisabled
                  ]}
                  onPress={() => wallets.petra ? handleConnect('petra') : null}
                  disabled={!wallets.petra || loading}
                >
                  <View style={styles.walletIconContainer}>
                    <Ionicons name="wallet" size={32} color={wallets.petra ? "#007AFF" : "#ccc"} />
                  </View>
                  <View style={styles.walletInfo}>
                    <Text style={[styles.walletName, !wallets.petra && styles.walletNameDisabled]}>
                      Petra Wallet
                    </Text>
                    <Text style={styles.walletDescription}>
                      Official Aptos wallet by Aptos Labs
                    </Text>
                    {!wallets.petra && (
                      <Text style={styles.walletUnavailable}>
                        Not installed
                      </Text>
                    )}
                  </View>
                  {wallets.petra && (
                    <Ionicons name="chevron-forward" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>

                {/* Martian Wallet */}
                <TouchableOpacity 
                  style={[
                    styles.walletOption,
                    !wallets.martian && styles.walletOptionDisabled
                  ]}
                  onPress={() => wallets.martian ? handleConnect('martian') : null}
                  disabled={!wallets.martian || loading}
                >
                  <View style={styles.walletIconContainer}>
                    <Ionicons name="wallet" size={32} color={wallets.martian ? "#FF6B35" : "#ccc"} />
                  </View>
                  <View style={styles.walletInfo}>
                    <Text style={[styles.walletName, !wallets.martian && styles.walletNameDisabled]}>
                      Martian Wallet
                    </Text>
                    <Text style={styles.walletDescription}>
                      Multi-chain wallet for Aptos ecosystem
                    </Text>
                    {!wallets.martian && (
                      <Text style={styles.walletUnavailable}>
                        Not installed
                      </Text>
                    )}
                  </View>
                  {wallets.martian && (
                    <Ionicons name="chevron-forward" size={20} color="#FF6B35" />
                  )}
                </TouchableOpacity>
              </View>

              {loading && (
                <View style={styles.loadingContainer}>
                  <Ionicons name="hourglass-outline" size={24} color="#007AFF" />
                  <Text style={styles.loadingText}>Connecting to wallet...</Text>
                </View>
              )}

              <View style={styles.infoSection}>
                <View style={styles.infoHeader}>
                  <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
                  <Text style={styles.infoTitle}>How to get started</Text>
                </View>
                <Text style={styles.infoText}>
                  {`1. Install Petra or Martian wallet extension in your browser
2. Create or import your wallet
3. Switch to Aptos Devnet
4. Click on your preferred wallet above`}
                </Text>
              </View>

              <View style={styles.warningSection}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#34C759" />
                <Text style={styles.warningText}>
                  Your wallet connection is secure. We never access your private keys or funds.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  connectedContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  walletInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  walletStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
    marginLeft: 8,
  },
  walletAddress: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  walletBalance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  disconnectText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  scrollContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  walletOptions: {
    marginBottom: 20,
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  walletOptionDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    opacity: 0.6,
  },
  walletIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  walletNameDisabled: {
    color: '#999',
  },
  walletDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  walletUnavailable: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 10,
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  warningSection: {
    flexDirection: 'row',
    backgroundColor: '#f0fff4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  warningText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#2d5a3d',
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default WalletConnect;
