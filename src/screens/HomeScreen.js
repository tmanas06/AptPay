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
    requestFaucet 
  } = useWallet();
  
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

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
          <ThemeToggle size="small" showLabel={false} />
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
          <View style={[styles.accountCard, { backgroundColor: colors.surface, ...shadows.sm }]}>
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Access</Text>
            <View style={styles.quickAccessGrid}>
              <TouchableOpacity
                style={[styles.quickAccessCard, { backgroundColor: colors.surface, ...shadows.sm }]}
                onPress={() => navigation.navigate('Guide')}
              >
                <Ionicons name="book" size={20} color={colors.primary} />
                <Text style={[styles.quickAccessText, { color: colors.text }]}>User Guide</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.quickAccessCard, { backgroundColor: colors.surface, ...shadows.sm }]}
                onPress={() => navigation.navigate('Trading')}
              >
                <Ionicons name="trending-up" size={20} color={colors.accent3} />
                <Text style={[styles.quickAccessText, { color: colors.text }]}>Trade</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.quickAccessCard, { backgroundColor: colors.surface, ...shadows.sm }]}
                onPress={() => navigation.navigate('AMM')}
              >
                <Ionicons name="swap-horizontal" size={20} color={colors.accent4} />
                <Text style={[styles.quickAccessText, { color: colors.text }]}>Swap</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.quickAccessCard, { backgroundColor: colors.surface, ...shadows.sm }]}
                onPress={handleFaucet}
                disabled={loading}
              >
                <Ionicons name="water" size={20} color={colors.secondary} />
                <Text style={[styles.quickAccessText, { color: colors.text }]}>
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
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quickAccessCard: {
    width: (width - 44) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginTop: 8,
  },
  featuresSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  featureCard: {
    width: (width - 44) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
    textAlign: 'center',
  },
  featureSubtitle: {
    fontSize: 11,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 14,
  },
});

export default HomeScreen;
