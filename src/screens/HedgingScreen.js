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
import SmartContractService from '../services/SmartContractService';
import DummyDeFiService from '../services/DummyDeFiService';

const HedgingScreen = ({ navigation }) => {
  const { account, balance, isConnected } = useWallet();
  const { colors, shadows } = useTheme();
  const [activeTab, setActiveTab] = useState('portfolio');
  const [selectedStrategy, setSelectedStrategy] = useState('delta-neutral');
  const [hedgeAmount, setHedgeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState([]);
  const [riskMetrics, setRiskMetrics] = useState({});

  const tabs = [
    { id: 'portfolio', label: 'Portfolio', icon: 'pie-chart' },
    { id: 'hedge', label: 'Hedge', icon: 'shield-checkmark' },
    { id: 'strategies', label: 'Strategies', icon: 'trending-up' },
  ];

  const hedgingStrategies = [
    {
      id: 'delta-neutral',
      name: 'Delta Neutral',
      description: 'Hedge against price movements using options',
      riskLevel: 'Low',
      expectedReturn: '5-8%',
      icon: 'trending-flat',
      color: '#34C759',
    },
    {
      id: 'protective-put',
      name: 'Protective Put',
      description: 'Protect against downside risk',
      riskLevel: 'Medium',
      expectedReturn: '8-12%',
      icon: 'shield',
      
    },
    {
      id: 'covered-call',
      name: 'Covered Call',
      description: 'Generate income while holding assets',
      riskLevel: 'Medium',
      expectedReturn: '10-15%',
      icon: 'call',
      color: '#FF9500',
    },
    {
      id: 'iron-condor',
      name: 'Iron Condor',
      description: 'Profit from low volatility',
      riskLevel: 'High',
      expectedReturn: '15-25%',
      icon: 'resize',
      color: '#FF3B30',
    },
  ];

  useEffect(() => {
    if (isConnected && account) {
      // Set up SmartContractService with the wallet account
      SmartContractService.setAccount(account);
      console.log('SmartContractService set up with account:', account.address);
      fetchPositions();
      fetchRiskMetrics();
    }
  }, [isConnected, account]);

  const fetchPositions = async () => {
    try {
      const hedgePositions = DummyDeFiService.getHedgePositions();
      // Convert to expected format
      const formattedPositions = hedgePositions.map(hedge => ({
        id: hedge.id,
        asset: hedge.underlyingAsset.split('/')[0],
        type: 'hedge',
        amount: hedge.amount,
        value: hedge.currentValue,
        pnl: hedge.pnl,
        pnlPercent: (hedge.pnl / hedge.premium) * 100,
        hedgeType: hedge.hedgeType,
        hedgeValue: hedge.currentValue,
        hedgePnl: hedge.pnl,
        strikePrice: hedge.strikePrice,
        expiry: hedge.expiry,
        status: hedge.status
      }));
      setPositions(formattedPositions);
    } catch (error) {
      console.error('Error fetching hedge positions:', error);
      setPositions([]);
    }
  };

  const fetchRiskMetrics = async () => {
    // Mock risk metrics
    setRiskMetrics({
      totalExposure: 13450,
      hedgedExposure: 13450,
      unhedgedExposure: 0,
      portfolioBeta: 0.85,
      var95: 675,
      maxDrawdown: 12.5,
      sharpeRatio: 1.42,
      volatility: 18.3,
    });
  };

  const handleHedge = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    if (!hedgeAmount || parseFloat(hedgeAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Mock hedge execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Hedge Applied',
        `Successfully applied ${selectedStrategy} hedge for ${hedgeAmount} APT`
      );
      
      setHedgeAmount('');
      fetchPositions();
      fetchRiskMetrics();
    } catch (error) {
      Alert.alert('Error', 'Failed to apply hedge');
    } finally {
      setLoading(false);
    }
  };

  const removeHedge = async (positionId) => {
    try {
      // Mock hedge removal
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Hedge removed successfully');
      fetchPositions();
      fetchRiskMetrics();
    } catch (error) {
      Alert.alert('Error', 'Failed to remove hedge');
    }
  };

  const formatPnl = (pnl) => {
    const color = pnl >= 0 ? '#34C759' : '#FF3B30';
    const sign = pnl >= 0 ? '+' : '';
    return { color, text: `${sign}$${pnl.toFixed(2)}` };
  };

  if (!isConnected) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Risk Hedging</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Protect your portfolio from volatility</Text>
        </View>
        <View style={styles.disconnectedCard}>
          <Ionicons name="wallet-outline" size={64} color="#007AFF" />
          <Text style={styles.disconnectedTitle}>Connect Wallet</Text>
          <Text style={styles.disconnectedSubtitle}>
            Connect your wallet to start hedging your positions
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Risk Hedging</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Protect your portfolio from volatility</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.id ? '#007AFF' : '#6c757d'} 
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchPositions} />
        }
      >
        {activeTab === 'portfolio' && (
          <View style={styles.portfolioContainer}>
            {/* Risk Metrics */}
            <View style={styles.riskMetricsCard}>
              <Text style={styles.cardTitle}>Portfolio Risk Metrics</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Total Exposure</Text>
                  <Text style={styles.metricValue}>${riskMetrics.totalExposure?.toLocaleString()}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Hedged</Text>
                  <Text style={styles.metricValue}>${riskMetrics.hedgedExposure?.toLocaleString()}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Portfolio Beta</Text>
                  <Text style={styles.metricValue}>{riskMetrics.portfolioBeta}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>VaR (95%)</Text>
                  <Text style={styles.metricValue}>${riskMetrics.var95}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Max Drawdown</Text>
                  <Text style={[styles.metricValue, { color: '#FF3B30' }]}>
                    {riskMetrics.maxDrawdown}%
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Sharpe Ratio</Text>
                  <Text style={[styles.metricValue, { color: '#34C759' }]}>
                    {riskMetrics.sharpeRatio}
                  </Text>
                </View>
              </View>
            </View>

            {/* Positions */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Hedged Positions</Text>
            {positions.map((position) => {
              const pnlInfo = formatPnl(position.pnl);
              const hedgePnlInfo = formatPnl(position.hedgePnl);
              return (
                <View key={position.id} style={styles.positionCard}>
                  <View style={styles.positionHeader}>
                    <View>
                      <Text style={styles.positionAsset}>{position.asset}</Text>
                      <Text style={styles.positionType}>
                        {position.type.toUpperCase()} • {position.amount} tokens
                      </Text>
                    </View>
                    <View style={styles.positionValues}>
                      <Text style={styles.positionValue}>${position.value.toLocaleString()}</Text>
                      <Text style={[styles.positionPnl, { color: pnlInfo.color }]}>
                        {pnlInfo.text}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.hedgeInfo}>
                    <View style={styles.hedgeInfoRow}>
                      <Ionicons name="shield-checkmark" size={16} color="#007AFF" />
                      <Text style={styles.hedgeInfoLabel}>Hedge: {position.hedgeType}</Text>
                      <Text style={[styles.hedgePnl, { color: hedgePnlInfo.color }]}>
                        {hedgePnlInfo.text}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.removeHedgeButton}
                    onPress={() => removeHedge(position.id)}
                  >
                    <Text style={styles.removeHedgeButtonText}>Remove Hedge</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'hedge' && (
          <View style={styles.hedgeContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Apply Hedge</Text>
            
            {/* Strategy Selection */}
            <View style={styles.strategyContainer}>
              <Text style={styles.strategyLabel}>Select Hedging Strategy</Text>
              {hedgingStrategies.map((strategy) => (
                <TouchableOpacity
                  key={strategy.id}
                  style={[
                    styles.strategyCard,
                    selectedStrategy === strategy.id && styles.selectedStrategyCard
                  ]}
                  onPress={() => setSelectedStrategy(strategy.id)}
                >
                  <View style={styles.strategyHeader}>
                    <View style={[styles.strategyIcon, { backgroundColor: strategy.color }]}>
                      <Ionicons name={strategy.icon} size={20} color="white" />
                    </View>
                    <View style={styles.strategyInfo}>
                      <Text style={styles.strategyName}>{strategy.name}</Text>
                      <Text style={styles.strategyDescription}>{strategy.description}</Text>
                    </View>
                  </View>
                  <View style={styles.strategyStats}>
                    <View style={styles.strategyStat}>
                      <Text style={styles.strategyStatLabel}>Risk</Text>
                      <Text style={[
                        styles.strategyStatValue,
                        { color: strategy.riskLevel === 'Low' ? '#34C759' : 
                                strategy.riskLevel === 'Medium' ? '#FF9500' : '#FF3B30' }
                      ]}>
                        {strategy.riskLevel}
                      </Text>
                    </View>
                    <View style={styles.strategyStat}>
                      <Text style={styles.strategyStatLabel}>Expected Return</Text>
                      <Text style={styles.strategyStatValue}>{strategy.expectedReturn}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount Input */}
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Amount to Hedge</Text>
              <View style={styles.amountInputContainer}>
                <TextInput
                  style={styles.amountInput}
                  value={hedgeAmount}
                  onChangeText={setHedgeAmount}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                <Text style={styles.amountCurrency}>APT</Text>
              </View>
              <Text style={styles.amountHint}>
                Available: {balance.toFixed(4)} APT
              </Text>
            </View>

            {/* Hedge Button */}
            <TouchableOpacity
              style={[styles.hedgeButton, loading && styles.disabledButton]}
              onPress={handleHedge}
              disabled={loading}
            >
              <Text style={styles.hedgeButtonText}>
                {loading ? 'Applying Hedge...' : 'Apply Hedge'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'strategies' && (
          <View style={styles.strategiesContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Strategies</Text>
            
            {hedgingStrategies.map((strategy) => (
              <View key={strategy.id} style={styles.strategyDetailCard}>
                <View style={styles.strategyDetailHeader}>
                  <View style={[styles.strategyDetailIcon, { backgroundColor: strategy.color }]}>
                    <Ionicons name={strategy.icon} size={24} color="white" />
                  </View>
                  <View style={styles.strategyDetailInfo}>
                    <Text style={styles.strategyDetailName}>{strategy.name}</Text>
                    <Text style={styles.strategyDetailDescription}>{strategy.description}</Text>
                  </View>
                </View>
                
                <View style={styles.strategyDetailStats}>
                  <View style={styles.strategyDetailStat}>
                    <Text style={styles.strategyDetailStatLabel}>Risk Level</Text>
                    <Text style={[
                      styles.strategyDetailStatValue,
                      { color: strategy.riskLevel === 'Low' ? '#34C759' : 
                              strategy.riskLevel === 'Medium' ? '#FF9500' : '#FF3B30' }
                    ]}>
                      {strategy.riskLevel}
                    </Text>
                  </View>
                  <View style={styles.strategyDetailStat}>
                    <Text style={styles.strategyDetailStatLabel}>Expected Return</Text>
                    <Text style={styles.strategyDetailStatValue}>{strategy.expectedReturn}</Text>
                  </View>
                  <View style={styles.strategyDetailStat}>
                    <Text style={styles.strategyDetailStatLabel}>Best For</Text>
                    <Text style={styles.strategyDetailStatValue}>
                      {strategy.riskLevel === 'Low' ? 'Conservative' : 
                       strategy.riskLevel === 'Medium' ? 'Moderate' : 'Aggressive'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.selectStrategyButton}
                  onPress={() => {
                    setSelectedStrategy(strategy.id);
                    setActiveTab('hedge');
                  }}
                >
                  <Text style={styles.selectStrategyButtonText}>Select Strategy</Text>
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
  portfolioContainer: {
    padding: 20,
  },
  riskMetricsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metric: {
    width: '48%',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  positionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  positionAsset: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  positionType: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  positionValues: {
    alignItems: 'flex-end',
  },
  positionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  positionPnl: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  hedgeInfo: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  hedgeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hedgeInfoLabel: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    flex: 1,
  },
  hedgePnl: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeHedgeButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  removeHedgeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  hedgeContainer: {
    padding: 20,
  },
  strategyContainer: {
    marginBottom: 20,
  },
  strategyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  strategyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    
  },
  selectedStrategyCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  strategyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  strategyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  strategyInfo: {
    flex: 1,
  },
  strategyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  strategyDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  strategyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  strategyStat: {
    flex: 1,
  },
  strategyStatLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  strategyStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  amountContainer: {
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    color: '#1a1a1a',
  },
  amountCurrency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  amountHint: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
  },
  hedgeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  hedgeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  strategiesContainer: {
    padding: 20,
  },
  strategyDetailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    
  },
  strategyDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  strategyDetailIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  strategyDetailInfo: {
    flex: 1,
  },
  strategyDetailName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  strategyDetailDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  strategyDetailStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  strategyDetailStat: {
    flex: 1,
  },
  strategyDetailStatLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  strategyDetailStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  selectStrategyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  selectStrategyButtonText: {
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

export default HedgingScreen;
