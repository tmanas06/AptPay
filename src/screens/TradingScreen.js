import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import SmartContractService from '../services/SmartContractService';
import DummyDeFiService from '../services/DummyDeFiService';

const { width } = Dimensions.get('window');

const TradingScreen = ({ navigation }) => {
  const { account, balance, isConnected } = useWallet();
  const { colors, shadows } = useTheme();
  const [selectedPair, setSelectedPair] = useState('APT/USDC');
  const [leverage, setLeverage] = useState(10);
  const [positionType, setPositionType] = useState('long'); // long or short
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState([]);

  // Test function to verify DummyDeFiService is working
  const testDummyService = () => {
    console.log('=== TESTING DUMMY DEFI SERVICE ===');
    console.log('Service instance:', DummyDeFiService);
    console.log('Available methods:', Object.getOwnPropertyNames(DummyDeFiService));
    
    try {
      const balance = DummyDeFiService.getBalance();
      console.log('User balance:', balance);
      
      const marketData = DummyDeFiService.getAllMarketData();
      console.log('Market data:', marketData);
      
      const positions = DummyDeFiService.getPositions();
      console.log('Positions:', positions);
      
      Alert.alert('Test Complete', `Balance: ${JSON.stringify(balance)}\nMarkets: ${marketData.length}\nPositions: ${positions.length}`);
    } catch (error) {
      console.error('Test error:', error);
      Alert.alert('Test Error', error.message);
    }
  };

  const tradingPairs = [
    { symbol: 'APT/USDC', price: 8.45, change: '+2.34%' },
    { symbol: 'BTC/USDC', price: 43250, change: '+1.23%' },
    { symbol: 'ETH/USDC', price: 2650, change: '-0.87%' },
  ];

  const leverageOptions = [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000];

  useEffect(() => {
    if (isConnected && account) {
      // Set up SmartContractService with the wallet account
      SmartContractService.setAccount(account);
      console.log('SmartContractService set up with account:', account.address);
      
      // Test DummyDeFiService
      console.log('Testing DummyDeFiService...');
      console.log('DummyDeFiService instance:', DummyDeFiService);
      console.log('DummyDeFiService methods:', Object.getOwnPropertyNames(DummyDeFiService));
      
      fetchPositions();
      fetchMarketData();
    }
  }, [isConnected, account]);

  const fetchPositions = async () => {
    try {
      console.log('Fetching positions from DummyDeFiService...');
      const positions = DummyDeFiService.getPositions();
      console.log('Raw positions:', positions);
      
      // Convert to expected format
      const formattedPositions = positions.map(pos => ({
        id: pos.id,
        pair: pos.symbol,
        type: pos.positionType.toLowerCase(),
        leverage: pos.leverage,
        entryPrice: pos.entryPrice,
        currentPrice: pos.currentPrice,
        size: pos.amount,
        pnl: pos.pnl,
        pnlPercent: pos.pnlPercentage,
        status: pos.status
      }));
      console.log('Formatted positions:', formattedPositions);
      setPositions(formattedPositions);
    } catch (error) {
      console.error('Error fetching positions:', error);
      setPositions([]);
    }
  };

  const fetchMarketData = async () => {
    try {
      console.log('Fetching market data from DummyDeFiService...');
      const marketData = DummyDeFiService.getAllMarketData();
      console.log('Raw market data:', marketData);
      
      const formattedPairs = marketData.map(data => ({
        symbol: data.symbol,
        price: data.price,
        change: `${data.change24h > 0 ? '+' : ''}${data.change24h.toFixed(2)}%`
      }));
      console.log('Formatted trading pairs:', formattedPairs);
      setTradingPairs(formattedPairs);
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  };

  const handleTrade = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const amountNum = parseFloat(amount);
      const positionTypeUpper = positionType.toUpperCase();
      
      console.log('Opening position with DummyDeFiService:', {
        selectedPair,
        positionTypeUpper,
        amountNum,
        leverage
      });
      
      // Open position using dummy DeFi service
      const result = DummyDeFiService.openPosition(
        selectedPair,
        positionTypeUpper,
        amountNum,
        leverage
      );

      console.log('Position result:', result);

      if (result.success) {
        Alert.alert(
          'Trade Executed',
          `Successfully opened ${positionType} position for ${amount} ${selectedPair.split('/')[0]} with ${leverage}x leverage\n\nTransaction: ${result.transactionHash.slice(0, 10)}...`
        );
        
        setAmount('');
        fetchPositions(); // Refresh positions
      } else {
        Alert.alert('Error', result.message || 'Failed to execute trade');
      }
    } catch (error) {
      console.error('Trade error:', error);
      Alert.alert('Error', error.message || 'Failed to execute trade');
    } finally {
      setLoading(false);
    }
  };

  const closePosition = async (positionId) => {
    try {
      const result = DummyDeFiService.closePosition(positionId);
      
      if (result.success) {
        Alert.alert(
          'Position Closed',
          `Position closed successfully!\n\nPnL: $${result.pnl.toFixed(2)}\nTransaction: ${result.transactionHash.slice(0, 10)}...`
        );
        fetchPositions(); // Refresh positions
      } else {
        Alert.alert('Error', result.message || 'Failed to close position');
      }
    } catch (error) {
      console.error('Close position error:', error);
      Alert.alert('Error', error.message || 'Failed to close position');
    }
  };

  const formatPnl = (pnl) => {
    const color = pnl >= 0 ? colors.green : colors.red;
    const sign = pnl >= 0 ? '+' : '';
    return { color, text: `${sign}${pnl.toFixed(2)}` };
  };

  if (!isConnected) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Leveraged Trading</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Trade with up to 1000x leverage</Text>
        </View>
        <View style={styles.disconnectedCard}>
          <Ionicons name="wallet-outline" size={64} color={colors.primary} />
          <Text style={[styles.disconnectedTitle, { color: colors.text }]}>Connect Wallet</Text>
          <Text style={[styles.disconnectedSubtitle, { color: colors.textSecondary }]}>
            Connect your wallet to start trading
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchPositions} />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Leveraged Trading</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Trade with up to 1000x leverage</Text>
        
        {/* Test Button */}
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: colors.primary }]}
          onPress={testDummyService}
        >
          <Text style={styles.testButtonText}>Test Dummy Service</Text>
        </TouchableOpacity>
      </View>

      {/* Trading Pairs */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Trading Pairs</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tradingPairs.map((pair, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.pairCard,
                { backgroundColor: colors.surface, ...shadows.sm },
                selectedPair === pair.symbol && { borderColor: colors.primary }
              ]}
              onPress={() => setSelectedPair(pair.symbol)}
            >
              <Text style={[styles.pairSymbol, { color: colors.text }]}>{pair.symbol}</Text>
              <Text style={[styles.pairPrice, { color: colors.text }]}>${pair.price.toLocaleString()}</Text>
              <Text style={[
                styles.pairChange,
                { color: pair.change.startsWith('+') ? colors.green : colors.red }
              ]}>
                {pair.change}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Position Type */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Position Type</Text>
        <View style={styles.positionTypeContainer}>
          <TouchableOpacity
            style={[
              styles.positionTypeButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              positionType === 'long' && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setPositionType('long')}
          >
            <Ionicons 
              name="trending-up" 
              size={20} 
              color={positionType === 'long' ? 'white' : colors.green} 
            />
            <Text style={[
              styles.positionTypeText,
              { color: positionType === 'long' ? 'white' : colors.text }
            ]}>
              Long
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.positionTypeButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              positionType === 'short' && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setPositionType('short')}
          >
            <Ionicons 
              name="trending-down" 
              size={20} 
              color={positionType === 'short' ? 'white' : colors.red} 
            />
            <Text style={[
              styles.positionTypeText,
              { color: positionType === 'short' ? 'white' : colors.text }
            ]}>
              Short
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Leverage Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Leverage: {leverage}x</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {leverageOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.leverageButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
                leverage === option && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setLeverage(option)}
            >
              <Text style={[
                styles.leverageText,
                { color: leverage === option ? 'white' : colors.text }
              ]}>
                {option}x
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Amount Input */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Amount</Text>
        <View style={[styles.amountContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.amountInput, { color: colors.text }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
            keyboardType="numeric"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={[styles.amountCurrency, { color: colors.primary }]}>
            {selectedPair.split('/')[0]}
          </Text>
        </View>
        <Text style={[styles.amountHint, { color: colors.textSecondary }]}>
          Available: {balance.toFixed(4)} APT
        </Text>
      </View>

      {/* Trade Button */}
      <TouchableOpacity
        style={[
          styles.tradeButton, 
          { backgroundColor: colors.primary },
          loading && { backgroundColor: colors.textSecondary }
        ]}
        onPress={handleTrade}
        disabled={loading}
      >
        <Text style={styles.tradeButtonText}>
          {loading ? 'Executing...' : `${positionType.toUpperCase()} ${selectedPair}`}
        </Text>
      </TouchableOpacity>

      {/* Open Positions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Open Positions</Text>
        {positions.length === 0 ? (
          <View style={[styles.noPositionsCard, { backgroundColor: colors.surface, ...shadows.sm }]}>
            <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.noPositionsText, { color: colors.textSecondary }]}>No open positions</Text>
          </View>
        ) : (
          positions.map((position) => {
            const pnlInfo = formatPnl(position.pnl);
            return (
              <View key={position.id} style={[styles.positionCard, { backgroundColor: colors.surface, ...shadows.sm }]}>
                <View style={styles.positionHeader}>
                  <View>
                    <Text style={[styles.positionPair, { color: colors.text }]}>{position.pair}</Text>
                    <Text style={[styles.positionDetails, { color: colors.textSecondary }]}>
                      {position.type.toUpperCase()} • {position.leverage}x • {position.size} tokens
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => closePosition(position.id)}
                  >
                    <Ionicons name="close" size={20} color={colors.red} />
                  </TouchableOpacity>
                </View>
                <View style={styles.positionStats}>
                  <View style={styles.positionStat}>
                    <Text style={[styles.positionStatLabel, { color: colors.textSecondary }]}>Entry Price</Text>
                    <Text style={[styles.positionStatValue, { color: colors.text }]}>${position.entryPrice}</Text>
                  </View>
                  <View style={styles.positionStat}>
                    <Text style={[styles.positionStatLabel, { color: colors.textSecondary }]}>Current Price</Text>
                    <Text style={[styles.positionStatValue, { color: colors.text }]}>${position.currentPrice}</Text>
                  </View>
                  <View style={styles.positionStat}>
                    <Text style={[styles.positionStatLabel, { color: colors.textSecondary }]}>PnL</Text>
                    <Text style={[styles.positionStatValue, { color: pnlInfo.color }]}>
                      {pnlInfo.text}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  pairCard: {
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pairSymbol: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  pairPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pairChange: {
    fontSize: 14,
    fontWeight: '500',
  },
  positionTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  positionTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  positionTypeText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  leverageButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  leverageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
  },
  amountCurrency: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  amountHint: {
    fontSize: 14,
    marginTop: 8,
  },
  tradeButton: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  tradeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  positionCard: {
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
  positionPair: {
    fontSize: 16,
    fontWeight: '600',
  },
  positionDetails: {
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  positionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  positionStat: {
    flex: 1,
  },
  positionStatLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  positionStatValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  noPositionsCard: {
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  noPositionsText: {
    fontSize: 16,
    marginTop: 12,
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
    marginTop: 20,
    marginBottom: 8,
  },
  disconnectedSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  testButton: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TradingScreen;
