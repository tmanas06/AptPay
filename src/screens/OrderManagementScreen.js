import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import { Ionicons } from '@expo/vector-icons';
import KanaTradingService from '../services/KanaTradingService';

const { width } = Dimensions.get('window');

const OrderManagementScreen = ({ navigation }) => {
  const { account, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState('open');
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'open', label: 'Open Orders', icon: 'time' },
    { id: 'history', label: 'Order History', icon: 'list' },
    { id: 'account', label: 'Account Info', icon: 'person' },
  ];

  useEffect(() => {
    if (isConnected) {
      loadMarkets();
    }
  }, [isConnected]);

  useEffect(() => {
    if (selectedMarket && account) {
      loadOrders();
      loadOrderHistory();
      loadAccountInfo();
    }
  }, [selectedMarket, account, activeTab]);

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
      console.error('Failed to load markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!selectedMarket || !account) return;
    
    try {
      const response = await KanaTradingService.getOpenOrders(
        selectedMarket.marketId,
        account.accountAddress.toString(),
        'open'
      );
      if (response.status === 'OK') {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const loadOrderHistory = async () => {
    if (!selectedMarket || !account) return;
    
    try {
      const response = await KanaTradingService.getOrderHistory(
        selectedMarket.marketId,
        account.accountAddress.toString()
      );
      if (response.status === 'OK') {
        setOrderHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to load order history:', error);
    }
  };

  const loadAccountInfo = async () => {
    if (!selectedMarket || !account) return;
    
    try {
      const response = await KanaTradingService.getMarketAccountInfo(
        selectedMarket.marketId,
        account.accountAddress.toString()
      );
      if (response.status === 'OK') {
        setAccountInfo(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load account info:', error);
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
        loadOrders();
      } else {
        Alert.alert('Error', 'Failed to cancel order');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel order');
    }
  };

  const cancelAllOrders = async () => {
    if (!selectedMarket) return;
    
    Alert.alert(
      'Cancel All Orders',
      'Are you sure you want to cancel all orders in this market?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await KanaTradingService.cancelAllOrders(selectedMarket.marketId);
              if (response.status === 'OK') {
                Alert.alert('Success', 'All orders cancelled successfully');
                loadOrders();
              } else {
                Alert.alert('Error', 'Failed to cancel all orders');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel all orders');
            }
          }
        }
      ]
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatPrice = (price) => {
    if (!price) return 'Market';
    return `$${(price / 1000000).toFixed(4)}`;
  };

  const formatSize = (size) => {
    return (size / 100000).toFixed(3);
  };

  const formatAmount = (amount) => {
    return (amount / 1000000).toFixed(2);
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
              ID: {market.marketId}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderOpenOrders = () => (
    <View style={styles.ordersContainer}>
      <View style={styles.ordersHeader}>
        <Text style={styles.sectionTitle}>Open Orders</Text>
        {orders.length > 0 && (
          <TouchableOpacity
            style={styles.cancelAllButton}
            onPress={cancelAllOrders}
          >
            <Text style={styles.cancelAllText}>Cancel All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {orders.length > 0 ? (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.order_id}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={[
                    styles.orderDirection,
                    { color: item.direction === 'buy' ? '#34C759' : '#FF3B30' }
                  ]}>
                    {item.direction.toUpperCase()}
                  </Text>
                  <Text style={styles.orderType}>{item.order_type}</Text>
                </View>
                <Text style={[
                  styles.orderStatus,
                  { color: item.order_status === 'open' ? '#34C759' : '#FF9500' }
                ]}>
                  {item.order_status}
                </Text>
              </View>
              
              <View style={styles.orderDetails}>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Size:</Text>
                  <Text style={styles.orderDetailValue}>
                    {formatSize(item.total_filled)} / {formatSize(item.total_filled + item.remaining_size)}
                  </Text>
                </View>
                
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Price:</Text>
                  <Text style={styles.orderDetailValue}>
                    {formatPrice(item.price)}
                  </Text>
                </View>
                
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Avg Price:</Text>
                  <Text style={styles.orderDetailValue}>
                    ${(item.average_execution_price / 1000000).toFixed(4)}
                  </Text>
                </View>
                
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Fees Paid:</Text>
                  <Text style={styles.orderDetailValue}>
                    ${(item.total_fees_paid_in_quote_subunits / 1000000).toFixed(4)}
                  </Text>
                </View>
                
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Created:</Text>
                  <Text style={styles.orderDetailValue}>
                    {formatTime(item.created_at)}
                  </Text>
                </View>
              </View>
              
              {item.order_status === 'open' && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => cancelOrder(item.order_id, item.direction)}
                >
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  <Text style={styles.cancelButtonText}>Cancel Order</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Ionicons name="checkmark-circle" size={48} color="#34C759" />
          <Text style={styles.noDataText}>No open orders</Text>
          <Text style={styles.noDataSubtext}>
            Your orders will appear here when placed
          </Text>
        </View>
      )}
    </View>
  );

  const renderOrderHistory = () => (
    <View style={styles.historyContainer}>
      <Text style={styles.sectionTitle}>Order History</Text>
      
      {orderHistory.length > 0 ? (
        <FlatList
          data={orderHistory}
          keyExtractor={(item) => item.order_id}
          renderItem={({ item }) => (
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={styles.historyInfo}>
                  <Text style={[
                    styles.historyDirection,
                    { color: item.direction === 'buy' ? '#34C759' : '#FF3B30' }
                  ]}>
                    {item.direction.toUpperCase()}
                  </Text>
                  <Text style={styles.historyType}>{item.order_type}</Text>
                </View>
                <Text style={[
                  styles.historyStatus,
                  { color: item.order_status === 'closed' ? '#34C759' : '#FF9500' }
                ]}>
                  {item.order_status}
                </Text>
              </View>
              
              <View style={styles.historyDetails}>
                <View style={styles.historyDetailRow}>
                  <Text style={styles.historyDetailLabel}>Size:</Text>
                  <Text style={styles.historyDetailValue}>
                    {formatSize(item.total_filled)}
                  </Text>
                </View>
                
                <View style={styles.historyDetailRow}>
                  <Text style={styles.historyDetailLabel}>Avg Price:</Text>
                  <Text style={styles.historyDetailValue}>
                    ${(item.average_execution_price / 1000000).toFixed(4)}
                  </Text>
                </View>
                
                <View style={styles.historyDetailRow}>
                  <Text style={styles.historyDetailLabel}>Fees:</Text>
                  <Text style={styles.historyDetailValue}>
                    ${(item.total_fees_paid_in_quote_subunits / 1000000).toFixed(4)}
                  </Text>
                </View>
                
                <View style={styles.historyDetailRow}>
                  <Text style={styles.historyDetailLabel}>Created:</Text>
                  <Text style={styles.historyDetailValue}>
                    {formatTime(item.created_at)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Ionicons name="list" size={48} color="#6c757d" />
          <Text style={styles.noDataText}>No order history</Text>
          <Text style={styles.noDataSubtext}>
            Your completed orders will appear here
          </Text>
        </View>
      )}
    </View>
  );

  const renderAccountInfo = () => (
    <View style={styles.accountContainer}>
      <Text style={styles.sectionTitle}>Market Account Info</Text>
      
      {accountInfo ? (
        <View style={styles.accountCard}>
          <View style={styles.accountHeader}>
            <Text style={styles.accountMarket}>{selectedMarket?.market}</Text>
            <Text style={styles.accountId}>Market ID: {accountInfo.market_id}</Text>
          </View>
          
          <View style={styles.accountBalances}>
            <View style={styles.balanceSection}>
              <Text style={styles.balanceTitle}>Base Asset (APT)</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Available:</Text>
                <Text style={styles.balanceValue}>
                  {formatSize(accountInfo.base_available)}
                </Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Total:</Text>
                <Text style={styles.balanceValue}>
                  {formatSize(accountInfo.base_total)}
                </Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Ceiling:</Text>
                <Text style={styles.balanceValue}>
                  {formatSize(accountInfo.base_ceiling)}
                </Text>
              </View>
            </View>
            
            <View style={styles.balanceSection}>
              <Text style={styles.balanceTitle}>Quote Asset (USDC)</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Available:</Text>
                <Text style={styles.balanceValue}>
                  ${formatAmount(accountInfo.quote_available)}
                </Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Total:</Text>
                <Text style={styles.balanceValue}>
                  ${formatAmount(accountInfo.quote_total)}
                </Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Ceiling:</Text>
                <Text style={styles.balanceValue}>
                  ${formatAmount(accountInfo.quote_ceiling)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <Ionicons name="person" size={48} color="#6c757d" />
          <Text style={styles.noDataText}>No account info</Text>
          <Text style={styles.noDataSubtext}>
            Account information will appear here
          </Text>
        </View>
      )}
    </View>
  );

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Order Management</Text>
          <Text style={styles.subtitle}>Manage your trading orders</Text>
        </View>
        <View style={styles.disconnectedCard}>
          <Ionicons name="wallet-outline" size={64} color="#007AFF" />
          <Text style={styles.disconnectedTitle}>Connect Wallet</Text>
          <Text style={styles.disconnectedSubtitle}>
            Connect your wallet to manage orders
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Order Management</Text>
        <Text style={styles.subtitle}>Manage your trading orders</Text>
      </View>

      {/* Market Selector */}
      {renderMarketSelector()}

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
        {activeTab === 'open' && renderOpenOrders()}
        {activeTab === 'history' && renderOrderHistory()}
        {activeTab === 'account' && renderAccountInfo()}
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
  ordersContainer: {
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
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cancelAllButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  orderCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
    paddingVertical: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderDirection: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  orderType: {
    fontSize: 12,
    color: '#6c757d',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderDetails: {
    marginBottom: 12,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderDetailLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  orderDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 4,
  },
  historyContainer: {
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
  historyCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
    paddingVertical: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDirection: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  historyType: {
    fontSize: 12,
    color: '#6c757d',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyDetails: {
    marginBottom: 8,
  },
  historyDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyDetailLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  historyDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  accountContainer: {
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
  accountCard: {
    marginTop: 16,
  },
  accountHeader: {
    marginBottom: 20,
  },
  accountMarket: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  accountId: {
    fontSize: 14,
    color: '#6c757d',
  },
  accountBalances: {
    gap: 20,
  },
  balanceSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 4,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
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

export default OrderManagementScreen;
