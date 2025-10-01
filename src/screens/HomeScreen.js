import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import WalletConnect from '../components/WalletConnect';
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
    requestFaucet 
  } = useWallet();

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

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>AptosPay</Text>
          <Text style={styles.subtitle}>Aptos Devnet Wallet</Text>
        </View>
        <View style={styles.networkBadge}>
          <View style={styles.networkDot} />
          <Text style={styles.networkText}>Devnet</Text>
        </View>
      </View>

      {!isConnected ? (
        <View style={styles.walletSection}>
          <View style={styles.walletCard}>
            <Ionicons name="wallet-outline" size={64} color="#007AFF" />
            <Text style={styles.walletTitle}>Connect Your Wallet</Text>
            <Text style={styles.walletSubtitle}>
              Connect to start using AptosPay on devnet
            </Text>
            <WalletConnect />
          </View>
        </View>
      ) : (
        <View style={styles.connectedSection}>
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <TouchableOpacity onPress={handleRefresh} disabled={loading}>
                <Ionicons name="refresh" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceAmount}>{balance.toFixed(4)}</Text>
            <Text style={styles.balanceCurrency}>APT</Text>
            <Text style={styles.balanceUsd}>≈ ${(balance * 10).toFixed(2)} USD</Text>
          </View>

          {/* Account Info */}
          <View style={styles.accountCard}>
            <View style={styles.accountHeader}>
              <Ionicons name="person-circle" size={24} color="#007AFF" />
              <Text style={styles.accountTitle}>Account</Text>
            </View>
            <Text style={styles.accountAddress}>
              {formatAddress(account?.accountAddress.toString())}
            </Text>
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={() => {
                navigator.clipboard?.writeText(account?.accountAddress.toString());
                Alert.alert('Copied', 'Address copied to clipboard');
              }}
            >
              <Ionicons name="copy-outline" size={16} color="#007AFF" />
              <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>
          </View>

          {/* Main Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>DeFi Features</Text>
            <View style={styles.featuresGrid}>
              <TouchableOpacity
                style={styles.featureCard}
                onPress={() => navigation.navigate('KanaTrade')}
              >
                <View style={[styles.featureIcon, { backgroundColor: '#6C5CE7' }]}>
                  <Ionicons name="bar-chart" size={24} color="white" />
                </View>
                <Text style={styles.featureTitle}>Kana Trade</Text>
                <Text style={styles.featureSubtitle}>Order book trading</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.featureCard}
                onPress={() => navigation.navigate('KanaTrade', { screen: 'MarketData' })}
              >
                <View style={[styles.featureIcon, { backgroundColor: '#00B894' }]}>
                  <Ionicons name="analytics" size={24} color="white" />
                </View>
                <Text style={styles.featureTitle}>Market Data</Text>
                <Text style={styles.featureSubtitle}>Real-time prices</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.featureCard}
                onPress={() => navigation.navigate('Trading')}
              >
                <View style={[styles.featureIcon, { backgroundColor: '#FF3B30' }]}>
                  <Ionicons name="trending-up" size={24} color="white" />
                </View>
                <Text style={styles.featureTitle}>Leveraged Trade</Text>
                <Text style={styles.featureSubtitle}>Up to 1000x leverage</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.featureCard}
                onPress={() => navigation.navigate('AMM')}
              >
                <View style={[styles.featureIcon, { backgroundColor: '#34C759' }]}>
                  <Ionicons name="swap-horizontal" size={24} color="white" />
                </View>
                <Text style={styles.featureTitle}>AMM Pools</Text>
                <Text style={styles.featureSubtitle}>Liquidity & swaps</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.featureCard}
                onPress={() => navigation.navigate('Hedging')}
              >
                <View style={[styles.featureIcon, { backgroundColor: '#007AFF' }]}>
                  <Ionicons name="shield-checkmark" size={24} color="white" />
                </View>
                <Text style={styles.featureTitle}>Risk Hedging</Text>
                <Text style={styles.featureSubtitle}>Portfolio protection</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.featureCard}
                onPress={() => navigation.navigate('Wallet')}
              >
                <View style={[styles.featureIcon, { backgroundColor: '#FF9500' }]}>
                  <Ionicons name="wallet" size={24} color="white" />
                </View>
                <Text style={styles.featureTitle}>Wallet</Text>
                <Text style={styles.featureSubtitle}>Send & receive</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Access Cards */}
          <View style={styles.quickAccessSection}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.quickAccessGrid}>
              <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('Wallet', { screen: 'Send' })}
              >
                <Ionicons name="send" size={20} color="#FF3B30" />
                <Text style={styles.quickAccessText}>Send</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('Wallet', { screen: 'Receive' })}
              >
                <Ionicons name="download" size={20} color="#34C759" />
                <Text style={styles.quickAccessText}>Receive</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('Wallet', { screen: 'History' })}
              >
                <Ionicons name="time" size={20} color="#FF9500" />
                <Text style={styles.quickAccessText}>History</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={handleFaucet}
                disabled={loading}
              >
                <Ionicons name="water" size={20} color="#5856D6" />
                <Text style={styles.quickAccessText}>
                  {loading ? 'Requesting...' : 'Get APT'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Network Info</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Network:</Text>
              <Text style={styles.statsValue}>Aptos Devnet</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Status:</Text>
              <View style={styles.statusContainer}>
                <View style={styles.statusDot} />
                <Text style={styles.statsValue}>Connected</Text>
              </View>
            </View>
          </View>

          {error && (
            <View style={styles.errorCard}>
              <Ionicons name="warning" size={20} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerContent: {
    flex: 1,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
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
  },
  balanceCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  balanceCurrency: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  balanceUsd: {
    fontSize: 14,
    color: '#6c757d',
  },
  accountCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  accountAddress: {
    fontSize: 16,
    color: '#6c757d',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  copyText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
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
    color: '#6c757d',
  },
  statsValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginRight: 6,
  },
  errorCard: {
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginLeft: 8,
    flex: 1,
  },
  quickAccessSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  quickAccessCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginTop: 8,
  },
  featuresSection: {
    marginBottom: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  featureCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureSubtitle: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
});

export default HomeScreen;
