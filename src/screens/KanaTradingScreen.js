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
  Dimensions,
  FlatList,
} from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import { Ionicons } from '@expo/vector-icons';
import KanaTradingService from '../services/KanaTradingService';

const { width } = Dimensions.get('window');

const KanaTradingScreen = ({ navigation }) => {
  const { account, balance, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState('orderbook');
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [marketData, setMarketData] = useState(null);
  const [orderBook, setOrderBook] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderAmount, setOrderAmount] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderType, setOrderType] = useState('market'); // 'market' or 'limit'
  const [orderDirection, setOrderDirection] = useState('buy'); // 'buy' or 'sell'

  const tabs = [
    { id: 'orderbook', label: 'Order Book', icon: 'list' },
    { id: 'trades', label: 'Trades', icon: 'trending-up' },
    { id: 'orders', label: 'My Orders', icon: 'time' },
    { id: 'place', label: 'Place Order', icon: 'add-circle' },
    { id: 'marketdata', label: 'Market Data', icon: 'analytics' },
    { id: 'management', label: 'Management', icon: 'settings' },
  ];

  useEffect(() => {
    if (isConnected) {
      loadMarkets();
    }
  }, [isConnected]);

  useEffect(() => {
    if (selectedMarket) {
      loadMarketData();
      loadOrderBook();
      loadUserOrders();
    }
  }, [selectedMarket]);

  const loadMarkets = async () => {
    try {
      setLoading(true);
      const response = await KanaTradingService.getAvailableMarkets();
      if (response.status === 'OK') {
        setMarkets(response.data);
        if (response.data.length > 0) {
          setSelectedMarket(response.data[0]);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load markets');
    } finally {
      setLoading(false);
    }
  };

  const loadMarketData = async () => {
    if (!selectedMarket) return;
    
    try {
      const response = await KanaTradingService.getMarketPrice(selectedMarket.marketId);
      if (response.status === 'OK') {
        setMarketData(KanaTradingService.formatMarketData(response.data));
      }
    } catch (error) {
      console.error('Failed to load market data:', error);
    }
  };

  const loadOrderBook = async () => {
    if (!selectedMarket) return;
    
    try {
      const response = await KanaTradingService.getOrderBook(selectedMarket.marketId);
      if (response.status === 'OK') {
        setOrderBook(KanaTradingService.formatOrderBook(response.data));
      }
    } catch (error) {
      console.error('Failed to load order book:', error);
    }
  };

  const loadUserOrders = async () => {
    if (!selectedMarket || !account) return;
    
    try {
      const response = await KanaTradingService.getOpenOrders(
        selectedMarket.marketId,
        account.accountAddress.toString()
      );
      if (response.status === 'OK') {
        setUserOrders(response.data);
      }
    } catch (error) {
      console.error('Failed to load user orders:', error);
    }
  };

  const placeOrder = async () => {
    if (!isConnected || !selectedMarket) {
      Alert.alert('Error', 'Please connect your wallet and select a market');
      return;
    }

    if (!orderAmount || parseFloat(orderAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (orderType === 'limit' && (!orderPrice || parseFloat(orderPrice) <= 0)) {
      Alert.alert('Error', 'Please enter a valid price for limit orders');
      return;
    }

    try {
      setLoading(true);
      
      let response;
      const amount = parseFloat(orderAmount);
      const price = parseFloat(orderPrice);
      const direction = orderDirection === 'sell';

      if (orderType === 'market') {
        response = await KanaTradingService.placeMarketOrder(
          selectedMarket.marketId,
          amount,
          direction
        );
      } else {
        response = await KanaTradingService.placeLimitOrder(
          selectedMarket.marketId,
          amount,
          price,
          direction
        );
      }

      if (response.status === 'OK') {
        Alert.alert(
          'Order Placed',
          `${orderType === 'market' ? 'Market' : 'Limit'} ${orderDirection} order placed successfully`
        );
        
        // Reset form
        setOrderAmount('');
        setOrderPrice('');
        
        // Reload data
        loadMarketData();
        loadOrderBook();
        loadUserOrders();
      } else {
        Alert.alert('Error', 'Failed to place order');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId, direction) => {
    try {
      const response = await KanaTradingService.cancelOrder(
        selectedMarket.marketId,
        direction === 'sell',
        orderId
      );
      
      if (response.status === 'OK') {
        Alert.alert('Success', 'Order cancelled successfully');
        loadUserOrders();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel order');
    }
  };

  const renderMarketSelector = () => (
    <View style={styles.marketSelector}>
      <Text style={styles.sectionTitle}>Select Market</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {markets.map((market) => (
          <TouchableOpacity
            key={market.marketId}
            style={[
              styles.marketCard,
              selectedMarket?.marketId === market.marketId && styles.selectedMarketCard
            ]}
            onPress={() => setSelectedMarket(market)}
          >
            <Text style={styles.marketSymbol}>{market.market}</Text>
            <Text style={styles.marketDetails}>
              Min: {market.minSize} | Lot: {market.lotSize}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderMarketData = () => (
    <View style={styles.marketDataCard}>
      <Text style={styles.marketDataTitle}>Market Data</Text>
      {marketData ? (
        <View style={styles.marketDataRow}>
          <View style={styles.marketDataItem}>
            <Text style={styles.marketDataLabel}>Bid</Text>
            <Text style={styles.marketDataValue}>${marketData.bestBidPrice.toFixed(4)}</Text>
          </View>
          <View style={styles.marketDataItem}>
            <Text style={styles.marketDataLabel}>Ask</Text>
            <Text style={styles.marketDataValue}>${marketData.bestAskPrice.toFixed(4)}</Text>
          </View>
          <View style={styles.marketDataItem}>
            <Text style={styles.marketDataLabel}>Spread</Text>
            <Text style={styles.marketDataValue}>${marketData.spread.toFixed(4)}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.noDataText}>Loading market data...</Text>
      )}
    </View>
  );

  const renderOrderBook = () => (
    <View style={styles.orderBookCard}>
      <Text style={styles.sectionTitle}>Order Book</Text>
      {orderBook ? (
        <View style={styles.orderBookContainer}>
          {/* Asks (Sell Orders) */}
          <View style={styles.orderBookSection}>
            <Text style={styles.orderBookHeader}>Asks (Sell)</Text>
            <FlatList
              data={orderBook.asks.slice(0, 10)}
              keyExtractor={(item) => item.orderId}
              renderItem={({ item }) => (
                <View style={styles.orderBookRow}>
                  <Text style={[styles.orderBookPrice, styles.askPrice]}>
                    ${(item.price / 1000000).toFixed(4)}
                  </Text>
                  <Text style={styles.orderBookSize}>
                    {(item.size / 100000).toFixed(3)}
                  </Text>
                </View>
              )}
            />
          </View>

          {/* Spread */}
          <View style={styles.spreadRow}>
            <Text style={styles.spreadText}>
              Spread: ${marketData?.spread.toFixed(4) || '0.0000'}
            </Text>
          </View>

          {/* Bids (Buy Orders) */}
          <View style={styles.orderBookSection}>
            <Text style={styles.orderBookHeader}>Bids (Buy)</Text>
            <FlatList
              data={orderBook.bids.slice(0, 10)}
              keyExtractor={(item) => item.orderId}
              renderItem={({ item }) => (
                <View style={styles.orderBookRow}>
                  <Text style={[styles.orderBookPrice, styles.bidPrice]}>
                    ${(item.price / 1000000).toFixed(4)}
                  </Text>
                  <Text style={styles.orderBookSize}>
                    {(item.size / 100000).toFixed(3)}
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      ) : (
        <Text style={styles.noDataText}>Loading order book...</Text>
      )}
    </View>
  );

  const renderPlaceOrder = () => (
    <View style={styles.placeOrderCard}>
      <Text style={styles.sectionTitle}>Place Order</Text>
      
      {/* Order Type Selection */}
      <View style={styles.orderTypeContainer}>
        <TouchableOpacity
          style={[
            styles.orderTypeButton,
            orderType === 'market' && styles.selectedOrderType
          ]}
          onPress={() => setOrderType('market')}
        >
          <Text style={[
            styles.orderTypeText,
            orderType === 'market' && styles.selectedOrderTypeText
          ]}>
            Market
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.orderTypeButton,
            orderType === 'limit' && styles.selectedOrderType
          ]}
          onPress={() => setOrderType('limit')}
        >
          <Text style={[
            styles.orderTypeText,
            orderType === 'limit' && styles.selectedOrderTypeText
          ]}>
            Limit
          </Text>
        </TouchableOpacity>
      </View>

      {/* Direction Selection */}
      <View style={styles.directionContainer}>
        <TouchableOpacity
          style={[
            styles.directionButton,
            orderDirection === 'buy' && styles.buyButton
          ]}
          onPress={() => setOrderDirection('buy')}
        >
          <Text style={[
            styles.directionText,
            orderDirection === 'buy' && styles.buyButtonText
          ]}>
            Buy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.directionButton,
            orderDirection === 'sell' && styles.sellButton
          ]}
          onPress={() => setOrderDirection('sell')}
        >
          <Text style={[
            styles.directionText,
            orderDirection === 'sell' && styles.sellButtonText
          ]}>
            Sell
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Amount</Text>
        <TextInput
          style={styles.input}
          value={orderAmount}
          onChangeText={setOrderAmount}
          placeholder="Enter amount"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      {/* Price Input (for limit orders) */}
      {orderType === 'limit' && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Price</Text>
          <TextInput
            style={styles.input}
            value={orderPrice}
            onChangeText={setOrderPrice}
            placeholder="Enter price"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>
      )}

      {/* Place Order Button */}
      <TouchableOpacity
        style={[
          styles.placeOrderButton,
          loading && styles.disabledButton
        ]}
        onPress={placeOrder}
        disabled={loading}
      >
        <Text style={styles.placeOrderButtonText}>
          {loading ? 'Placing...' : `Place ${orderDirection} Order`}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderUserOrders = () => (
    <View style={styles.userOrdersCard}>
      <Text style={styles.sectionTitle}>My Orders</Text>
      {userOrders.length > 0 ? (
        <FlatList
          data={userOrders}
          keyExtractor={(item) => item.order_id}
          renderItem={({ item }) => (
            <View style={styles.orderItem}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderDirection}>
                  {item.direction.toUpperCase()}
                </Text>
                <Text style={styles.orderStatus}>{item.order_status}</Text>
              </View>
              <View style={styles.orderDetails}>
                <Text style={styles.orderDetailText}>
                  Size: {item.total_filled} / {item.total_filled + item.remaining_size}
                </Text>
                {item.price && (
                  <Text style={styles.orderDetailText}>
                    Price: ${(item.price / 1000000).toFixed(4)}
                  </Text>
                )}
                <Text style={styles.orderDetailText}>
                  Avg Price: ${(item.average_execution_price / 1000000).toFixed(4)}
                </Text>
              </View>
              {item.order_status === 'open' && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => cancelOrder(item.order_id, item.direction)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      ) : (
        <Text style={styles.noDataText}>No open orders</Text>
      )}
    </View>
  );

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Kana Labs Trading</Text>
          <Text style={styles.subtitle}>Advanced order book trading</Text>
        </View>
        <View style={styles.disconnectedCard}>
          <Ionicons name="wallet-outline" size={64} color="#007AFF" />
          <Text style={styles.disconnectedTitle}>Connect Wallet</Text>
          <Text style={styles.disconnectedSubtitle}>
            Connect your wallet to start trading on Kana Labs
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Kana Labs Trading</Text>
        <Text style={styles.subtitle}>Advanced order book trading</Text>
      </View>

      {/* Market Selector */}
      {renderMarketSelector()}

      {/* Market Data */}
      {renderMarketData()}

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

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadMarkets} />
        }
      >
        {activeTab === 'orderbook' && renderOrderBook()}
        {activeTab === 'place' && renderPlaceOrder()}
        {activeTab === 'orders' && renderUserOrders()}
        {activeTab === 'marketdata' && (
          <TouchableOpacity
            style={styles.navigationCard}
            onPress={() => navigation.navigate('MarketData')}
          >
            <Ionicons name="analytics" size={32} color="#007AFF" />
            <Text style={styles.navigationTitle}>Market Data</Text>
            <Text style={styles.navigationSubtitle}>View real-time market data and charts</Text>
          </TouchableOpacity>
        )}
        {activeTab === 'management' && (
          <TouchableOpacity
            style={styles.navigationCard}
            onPress={() => navigation.navigate('OrderManagement')}
          >
            <Ionicons name="settings" size={32} color="#007AFF" />
            <Text style={styles.navigationTitle}>Order Management</Text>
            <Text style={styles.navigationSubtitle}>Manage your orders and account</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
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
  marketSelector: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  marketCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedMarketCard: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  marketSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  marketDetails: {
    fontSize: 12,
    color: '#6c757d',
  },
  marketDataCard: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  marketDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  marketDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  marketDataItem: {
    flex: 1,
    alignItems: 'center',
  },
  marketDataLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  marketDataValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
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
  orderBookCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderBookContainer: {
    flexDirection: 'row',
  },
  orderBookSection: {
    flex: 1,
  },
  orderBookHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  orderBookRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  orderBookPrice: {
    fontSize: 12,
    fontWeight: '500',
  },
  askPrice: {
    color: '#FF3B30',
  },
  bidPrice: {
    color: '#34C759',
  },
  orderBookSize: {
    fontSize: 12,
    color: '#6c757d',
  },
  spreadRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
    marginVertical: 8,
  },
  spreadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  placeOrderCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  orderTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: 'white',
    marginHorizontal: 4,
  },
  selectedOrderType: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  orderTypeText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1a1a1a',
  },
  selectedOrderTypeText: {
    color: 'white',
  },
  directionContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  directionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#f8f9fa',
  },
  buyButton: {
    backgroundColor: '#34C759',
  },
  sellButton: {
    backgroundColor: '#FF3B30',
  },
  directionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1a1a1a',
  },
  buyButtonText: {
    color: 'white',
  },
  sellButtonText: {
    color: 'white',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  placeOrderButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  placeOrderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  userOrdersCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingVertical: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderDirection: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6c757d',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  orderDetails: {
    marginBottom: 8,
  },
  orderDetailText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  noDataText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    padding: 20,
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
  navigationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navigationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 8,
  },
  navigationSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default KanaTradingScreen;
