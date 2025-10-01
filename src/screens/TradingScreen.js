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
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const TradingScreen = ({ navigation }) => {
  const { account, balance, isConnected } = useWallet();
  const [selectedPair, setSelectedPair] = useState('APT/USDC');
  const [leverage, setLeverage] = useState(10);
  const [positionType, setPositionType] = useState('long'); // long or short
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState([]);

  const tradingPairs = [
    { symbol: 'APT/USDC', price: 8.45, change: '+2.34%' },
    { symbol: 'BTC/USDC', price: 43250, change: '+1.23%' },
    { symbol: 'ETH/USDC', price: 2650, change: '-0.87%' },
  ];

  const leverageOptions = [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000];

  useEffect(() => {
    if (isConnected) {
      fetchPositions();
    }
  }, [isConnected]);

  const fetchPositions = async () => {
    // Mock data - replace with actual API calls
    setPositions([
      {
        id: 1,
        pair: 'APT/USDC',
        type: 'long',
        leverage: 10,
        entryPrice: 8.2,
        currentPrice: 8.45,
        size: 100,
        pnl: 250,
        pnlPercent: 3.05,
      },
    ]);
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
      // Mock trade execution - replace with actual smart contract calls
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Trade Executed',
        `Successfully opened ${positionType} position for ${amount} ${selectedPair.split('/')[0]} with ${leverage}x leverage`
      );
      
      setAmount('');
      fetchPositions();
    } catch (error) {
      Alert.alert('Error', 'Failed to execute trade');
    } finally {
      setLoading(false);
    }
  };

  const closePosition = async (positionId) => {
    try {
      // Mock position closure
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Position closed successfully');
      fetchPositions();
    } catch (error) {
      Alert.alert('Error', 'Failed to close position');
    }
  };

  const formatPnl = (pnl) => {
    const color = pnl >= 0 ? '#34C759' : '#FF3B30';
    const sign = pnl >= 0 ? '+' : '';
    return { color, text: `${sign}${pnl.toFixed(2)}` };
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Leveraged Trading</Text>
          <Text style={styles.subtitle}>Trade with up to 1000x leverage</Text>
        </View>
        <View style={styles.disconnectedCard}>
          <Ionicons name="wallet-outline" size={64} color="#007AFF" />
          <Text style={styles.disconnectedTitle}>Connect Wallet</Text>
          <Text style={styles.disconnectedSubtitle}>
            Connect your wallet to start trading
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchPositions} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Leveraged Trading</Text>
        <Text style={styles.subtitle}>Trade with up to 1000x leverage</Text>
      </View>

      {/* Trading Pairs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trading Pairs</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tradingPairs.map((pair, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.pairCard,
                selectedPair === pair.symbol && styles.selectedPairCard
              ]}
              onPress={() => setSelectedPair(pair.symbol)}
            >
              <Text style={styles.pairSymbol}>{pair.symbol}</Text>
              <Text style={styles.pairPrice}>${pair.price.toLocaleString()}</Text>
              <Text style={[
                styles.pairChange,
                { color: pair.change.startsWith('+') ? '#34C759' : '#FF3B30' }
              ]}>
                {pair.change}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Position Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Position Type</Text>
        <View style={styles.positionTypeContainer}>
          <TouchableOpacity
            style={[
              styles.positionTypeButton,
              positionType === 'long' && styles.selectedPositionType
            ]}
            onPress={() => setPositionType('long')}
          >
            <Ionicons 
              name="trending-up" 
              size={20} 
              color={positionType === 'long' ? 'white' : '#34C759'} 
            />
            <Text style={[
              styles.positionTypeText,
              positionType === 'long' && styles.selectedPositionTypeText
            ]}>
              Long
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.positionTypeButton,
              positionType === 'short' && styles.selectedPositionType
            ]}
            onPress={() => setPositionType('short')}
          >
            <Ionicons 
              name="trending-down" 
              size={20} 
              color={positionType === 'short' ? 'white' : '#FF3B30'} 
            />
            <Text style={[
              styles.positionTypeText,
              positionType === 'short' && styles.selectedPositionTypeText
            ]}>
              Short
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Leverage Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Leverage: {leverage}x</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {leverageOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.leverageButton,
                leverage === option && styles.selectedLeverageButton
              ]}
              onPress={() => setLeverage(option)}
            >
              <Text style={[
                styles.leverageText,
                leverage === option && styles.selectedLeverageText
              ]}>
                {option}x
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Amount Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amount</Text>
        <View style={styles.amountContainer}>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.amountCurrency}>
            {selectedPair.split('/')[0]}
          </Text>
        </View>
        <Text style={styles.amountHint}>
          Available: {balance.toFixed(4)} APT
        </Text>
      </View>

      {/* Trade Button */}
      <TouchableOpacity
        style={[styles.tradeButton, loading && styles.disabledButton]}
        onPress={handleTrade}
        disabled={loading}
      >
        <Text style={styles.tradeButtonText}>
          {loading ? 'Executing...' : `${positionType.toUpperCase()} ${selectedPair}`}
        </Text>
      </TouchableOpacity>

      {/* Open Positions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Open Positions</Text>
        {positions.length === 0 ? (
          <View style={styles.noPositionsCard}>
            <Ionicons name="bar-chart-outline" size={48} color="#999" />
            <Text style={styles.noPositionsText}>No open positions</Text>
          </View>
        ) : (
          positions.map((position) => {
            const pnlInfo = formatPnl(position.pnl);
            return (
              <View key={position.id} style={styles.positionCard}>
                <View style={styles.positionHeader}>
                  <View>
                    <Text style={styles.positionPair}>{position.pair}</Text>
                    <Text style={styles.positionDetails}>
                      {position.type.toUpperCase()} • {position.leverage}x • {position.size} tokens
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => closePosition(position.id)}
                  >
                    <Ionicons name="close" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
                <View style={styles.positionStats}>
                  <View style={styles.positionStat}>
                    <Text style={styles.positionStatLabel}>Entry Price</Text>
                    <Text style={styles.positionStatValue}>${position.entryPrice}</Text>
                  </View>
                  <View style={styles.positionStat}>
                    <Text style={styles.positionStatLabel}>Current Price</Text>
                    <Text style={styles.positionStatValue}>${position.currentPrice}</Text>
                  </View>
                  <View style={styles.positionStat}>
                    <Text style={styles.positionStatLabel}>PnL</Text>
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  pairCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedPairCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  pairSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  pairPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
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
    borderColor: '#e9ecef',
    backgroundColor: 'white',
  },
  selectedPositionType: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  positionTypeText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1a1a1a',
  },
  selectedPositionTypeText: {
    color: 'white',
  },
  leverageButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: 'white',
  },
  selectedLeverageButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  leverageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  selectedLeverageText: {
    color: 'white',
  },
  amountContainer: {
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
  tradeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  tradeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  positionCard: {
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
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  positionPair: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  positionDetails: {
    fontSize: 14,
    color: '#6c757d',
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
    color: '#6c757d',
    marginBottom: 2,
  },
  positionStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  noPositionsCard: {
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
  noPositionsText: {
    fontSize: 16,
    color: '#6c757d',
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

export default TradingScreen;
