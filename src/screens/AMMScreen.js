import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const AMMScreen = ({ navigation }) => {
  const { account, balance, isConnected } = useWallet();
  const { colors, shadows } = useTheme();
  const [activeTab, setActiveTab] = useState('swap');
  const [fromToken, setFromToken] = useState('APT');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [pools, setPools] = useState([]);
  const [userLiquidity, setUserLiquidity] = useState([]);

  const tokens = [
    { symbol: 'APT', name: 'Aptos', balance: balance, price: 8.45 },
    { symbol: 'USDC', name: 'USD Coin', balance: 1250, price: 1.00 },
    { symbol: 'BTC', name: 'Bitcoin', balance: 0.05, price: 43250 },
    { symbol: 'ETH', name: 'Ethereum', balance: 2.5, price: 2650 },
  ];

  const tabs = [
    { id: 'swap', label: 'Swap', icon: 'swap-horizontal' },
    { id: 'liquidity', label: 'Liquidity', icon: 'water' },
    { id: 'pools', label: 'Pools', icon: 'analytics' },
  ];

  useEffect(() => {
    if (isConnected) {
      fetchPools();
      fetchUserLiquidity();
    }
  }, [isConnected]);

  const fetchPools = async () => {
    // Mock data - replace with actual API calls
    setPools([
      {
        id: 1,
        pair: 'APT/USDC',
        liquidity: 1250000,
        volume24h: 45000,
        fee24h: 1350,
        apr: 12.5,
        token0: { symbol: 'APT', amount: 150000 },
        token1: { symbol: 'USDC', amount: 1250000 },
      },
      {
        id: 2,
        pair: 'BTC/USDC',
        liquidity: 850000,
        volume24h: 32000,
        fee24h: 960,
        apr: 8.7,
        token0: { symbol: 'BTC', amount: 20 },
        token1: { symbol: 'USDC', amount: 850000 },
      },
    ]);
  };

  const fetchUserLiquidity = async () => {
    // Mock data
    setUserLiquidity([
      {
        id: 1,
        pair: 'APT/USDC',
        share: 2.5,
        value: 3125,
        token0: { symbol: 'APT', amount: 375 },
        token1: { symbol: 'USDC', amount: 3125 },
        fees: 45.2,
      },
    ]);
  };

  const calculateSwapAmount = (amount, fromTokenSymbol, toTokenSymbol) => {
    // Mock calculation - replace with actual price feed
    const fromTokenData = tokens.find(t => t.symbol === fromTokenSymbol);
    const toTokenData = tokens.find(t => t.symbol === toTokenSymbol);
    
    if (!fromTokenData || !toTokenData) return '0';
    
    const rate = fromTokenData.price / toTokenData.price;
    return (parseFloat(amount) * rate).toFixed(6);
  };

  const handleSwap = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Mock swap execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Swap Successful',
        `Swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}`
      );
      
      setFromAmount('');
      setToAmount('');
    } catch (error) {
      Alert.alert('Error', 'Failed to execute swap');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLiquidity = async (poolId) => {
    if (!isConnected) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    try {
      // Mock liquidity addition
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Success', 'Liquidity added successfully');
      fetchUserLiquidity();
    } catch (error) {
      Alert.alert('Error', 'Failed to add liquidity');
    }
  };

  const handleRemoveLiquidity = async (liquidityId) => {
    try {
      // Mock liquidity removal
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Success', 'Liquidity removed successfully');
      fetchUserLiquidity();
    } catch (error) {
      Alert.alert('Error', 'Failed to remove liquidity');
    }
  };

  const swapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  useEffect(() => {
    if (fromAmount && fromToken && toToken) {
      const calculated = calculateSwapAmount(fromAmount, fromToken, toToken);
      setToAmount(calculated);
    }
  }, [fromAmount, fromToken, toToken]);

  if (!isConnected) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>AMM Pools</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Swap tokens and provide liquidity</Text>
        </View>
        <View style={styles.disconnectedCard}>
          <Ionicons name="wallet-outline" size={64} color={colors.primary} />
          <Text style={[styles.disconnectedTitle, { color: colors.text }]}>Connect Wallet</Text>
          <Text style={[styles.disconnectedSubtitle, { color: colors.textSecondary }]}>
            Connect your wallet to start trading and providing liquidity
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>AMM Pools</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Swap tokens and provide liquidity</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              { backgroundColor: activeTab === tab.id ? colors.primary : 'transparent' }
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.id ? 'white' : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.id ? 'white' : colors.textSecondary }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={[styles.content, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchPools} />
        }
      >
        {activeTab === 'swap' && (
          <View style={styles.swapContainer}>
            {/* From Token */}
            <View style={styles.tokenContainer}>
              <Text style={styles.tokenLabel}>From</Text>
              <View style={styles.tokenInputContainer}>
                <TextInput
                  style={styles.tokenInput}
                  value={fromAmount}
                  onChangeText={setFromAmount}
                  placeholder="0.0"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.tokenSelector}>
                  <Text style={styles.tokenSymbol}>{fromToken}</Text>
                  <Ionicons name="chevron-down" size={20} color="#6c757d" />
                </TouchableOpacity>
              </View>
              <Text style={styles.tokenBalance}>
                Balance: {tokens.find(t => t.symbol === fromToken)?.balance.toFixed(4) || '0'}
              </Text>
            </View>

            {/* Swap Button */}
            <TouchableOpacity style={styles.swapButton} onPress={swapTokens}>
              <Ionicons name="swap-vertical" size={24} color="#007AFF" />
            </TouchableOpacity>

            {/* To Token */}
            <View style={styles.tokenContainer}>
              <Text style={styles.tokenLabel}>To</Text>
              <View style={styles.tokenInputContainer}>
                <TextInput
                  style={styles.tokenInput}
                  value={toAmount}
                  onChangeText={setToAmount}
                  placeholder="0.0"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                  editable={false}
                />
                <TouchableOpacity style={styles.tokenSelector}>
                  <Text style={styles.tokenSymbol}>{toToken}</Text>
                  <Ionicons name="chevron-down" size={20} color="#6c757d" />
                </TouchableOpacity>
              </View>
              <Text style={styles.tokenBalance}>
                Balance: {tokens.find(t => t.symbol === toToken)?.balance.toFixed(4) || '0'}
              </Text>
            </View>

            {/* Swap Button */}
            <TouchableOpacity
              style={[styles.swapExecuteButton, loading && styles.disabledButton]}
              onPress={handleSwap}
              disabled={loading}
            >
              <Text style={styles.swapExecuteButtonText}>
                {loading ? 'Swapping...' : 'Swap'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'liquidity' && (
          <View style={styles.liquidityContainer}>
            <Text style={styles.sectionTitle}>Your Liquidity</Text>
            {userLiquidity.length === 0 ? (
              <View style={styles.noLiquidityCard}>
                <Ionicons name="water-outline" size={48} color="#999" />
                <Text style={styles.noLiquidityText}>No liquidity provided</Text>
                <Text style={styles.noLiquiditySubtext}>
                  Add liquidity to pools to earn trading fees
                </Text>
              </View>
            ) : (
              userLiquidity.map((liquidity) => (
                <View key={liquidity.id} style={styles.liquidityCard}>
                  <View style={styles.liquidityHeader}>
                    <Text style={styles.liquidityPair}>{liquidity.pair}</Text>
                    <Text style={styles.liquidityValue}>${liquidity.value.toLocaleString()}</Text>
                  </View>
                  <View style={styles.liquidityStats}>
                    <View style={styles.liquidityStat}>
                      <Text style={styles.liquidityStatLabel}>Share</Text>
                      <Text style={styles.liquidityStatValue}>{liquidity.share}%</Text>
                    </View>
                    <View style={styles.liquidityStat}>
                      <Text style={styles.liquidityStatLabel}>Fees Earned</Text>
                      <Text style={styles.liquidityStatValue}>${liquidity.fees.toFixed(2)}</Text>
                    </View>
                  </View>
                  <View style={styles.liquidityTokens}>
                    <Text style={styles.liquidityTokensLabel}>Tokens:</Text>
                    <Text style={styles.liquidityTokensText}>
                      {liquidity.token0.amount} {liquidity.token0.symbol} + {liquidity.token1.amount} {liquidity.token1.symbol}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeLiquidityButton}
                    onPress={() => handleRemoveLiquidity(liquidity.id)}
                  >
                    <Text style={styles.removeLiquidityButtonText}>Remove Liquidity</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'pools' && (
          <View style={styles.poolsContainer}>
            <Text style={styles.sectionTitle}>Available Pools</Text>
            {pools.map((pool) => (
              <View key={pool.id} style={styles.poolCard}>
                <View style={styles.poolHeader}>
                  <Text style={styles.poolPair}>{pool.pair}</Text>
                  <Text style={styles.poolAPR}>{pool.apr}% APR</Text>
                </View>
                <View style={styles.poolStats}>
                  <View style={styles.poolStat}>
                    <Text style={styles.poolStatLabel}>Liquidity</Text>
                    <Text style={styles.poolStatValue}>${pool.liquidity.toLocaleString()}</Text>
                  </View>
                  <View style={styles.poolStat}>
                    <Text style={styles.poolStatLabel}>Volume 24h</Text>
                    <Text style={styles.poolStatValue}>${pool.volume24h.toLocaleString()}</Text>
                  </View>
                  <View style={styles.poolStat}>
                    <Text style={styles.poolStatLabel}>Fees 24h</Text>
                    <Text style={styles.poolStatValue}>${pool.fee24h.toLocaleString()}</Text>
                  </View>
                </View>
                <View style={styles.poolTokens}>
                  <Text style={styles.poolTokensLabel}>Reserves:</Text>
                  <Text style={styles.poolTokensText}>
                    {pool.token0.amount} {pool.token0.symbol} + {pool.token1.amount} {pool.token1.symbol}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addLiquidityButton}
                  onPress={() => handleAddLiquidity(pool.id)}
                >
                  <Text style={styles.addLiquidityButtonText}>Add Liquidity</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#f0f8ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  swapContainer: {
    padding: 20,
  },
  tokenContainer: {
    marginBottom: 20,
  },
  tokenLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  tokenInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tokenInput: {
    flex: 1,
    fontSize: 18,
    color: '#1a1a1a',
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 4,
  },
  tokenBalance: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
  },
  swapButton: {
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 12,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  swapExecuteButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  swapExecuteButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  liquidityContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  noLiquidityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noLiquidityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 4,
  },
  noLiquiditySubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  liquidityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  liquidityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liquidityPair: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  liquidityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  liquidityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  liquidityStat: {
    flex: 1,
  },
  liquidityStatLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  liquidityStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  liquidityTokens: {
    marginBottom: 12,
  },
  liquidityTokensLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  liquidityTokensText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  removeLiquidityButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  removeLiquidityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  poolsContainer: {
    padding: 20,
  },
  poolCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  poolPair: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  poolAPR: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
  },
  poolStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  poolStat: {
    flex: 1,
  },
  poolStatLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  poolStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  poolTokens: {
    marginBottom: 12,
  },
  poolTokensLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  poolTokensText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  addLiquidityButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addLiquidityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  disconnectedCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  disconnectedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 8,
  },
  disconnectedSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default AMMScreen;
