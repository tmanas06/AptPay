import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  FlatList,
} from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import KanaTradingService from '../services/KanaTradingService';
import SmartContractService from '../services/SmartContractService';

const { width } = Dimensions.get('window');

const MarketDataScreen = ({ navigation }) => {
  const { account, isConnected } = useWallet();
  const { colors, shadows } = useTheme();
  const [activeTab, setActiveTab] = useState('markets');
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [orderBook, setOrderBook] = useState(null);
  const [trades, setTrades] = useState([]);
  const [candlestickData, setCandlestickData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState(3600); // 1 hour default
  const [liveData, setLiveData] = useState(null);
  const [isLive, setIsLive] = useState(false);

  const tabs = [
    { id: 'markets', label: 'Markets', icon: 'list' },
    { id: 'charts', label: 'Charts', icon: 'bar-chart' },
    { id: 'trades', label: 'Recent Trades', icon: 'trending-up' },
  ];

  const timeframes = [
    { label: '1m', value: 60 },
    { label: '5m', value: 300 },
    { label: '15m', value: 900 },
    { label: '1h', value: 3600 },
    { label: '4h', value: 14400 },
    { label: '1d', value: 86400 },
  ];

  useEffect(() => {
    if (isConnected && account) {
      // Set up SmartContractService with the wallet account
      SmartContractService.setAccount(account);
      console.log('SmartContractService set up with account:', account.address);
      loadMarkets();
    }
  }, [isConnected, account]);

  useEffect(() => {
    if (selectedMarket) {
      loadMarketData();
      loadOrderBook();
      loadTrades();
      loadCandlestickData();
      
      // Start live data subscription
      startLiveData();
    }
    
    return () => {
      // Cleanup live data subscription
      stopLiveData();
    };
  }, [selectedMarket, timeframe]);

  // Live data subscription
  const startLiveData = () => {
    if (!selectedMarket) return;
    
    console.log('Starting live data for market:', selectedMarket.marketId);
    setIsLive(true);
    
    const unsubscribe = KanaTradingService.subscribeToMarketData(
      selectedMarket.marketId,
      (data) => {
        console.log('Received live data update:', data);
        setLiveData(data);
        
        // Update individual data states
        if (data.price) {
          setMarketData(data.price);
        }
        if (data.orderBook) {
          setOrderBook(data.orderBook);
        }
        if (data.trades) {
          setTrades(data.trades);
        }
      }
    );
    
    // Store unsubscribe function
    window.liveDataUnsubscribe = unsubscribe;
  };

  const stopLiveData = () => {
    console.log('Stopping live data subscription');
    setIsLive(false);
    if (window.liveDataUnsubscribe) {
      window.liveDataUnsubscribe();
      window.liveDataUnsubscribe = null;
    }
  };

  const loadMarkets = async () => {
    try {
      console.log('=== LOADING MARKETS ===');
      setLoading(true);
      const response = await KanaTradingService.getAvailableMarkets();
      console.log('Markets response:', response);
      
      if (response.status === 'OK') {
        setMarkets(response.data);
        console.log('Markets loaded:', response.data.length, 'markets');
        if (response.data.length > 0) {
          setSelectedMarket(response.data[0]);
          console.log('Selected market:', response.data[0]);
        }
      } else {
        console.error('Markets response not OK:', response);
      }
    } catch (error) {
      console.error('Failed to load markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMarketData = async () => {
    if (!selectedMarket) return;
    
    try {
      console.log('=== LOADING MARKET DATA ===');
      console.log('Market ID:', selectedMarket.marketId);
      const response = await KanaTradingService.getMarketPrice(selectedMarket.marketId);
      console.log('Market data response:', response);
      
      if (response.status === 'OK') {
        const formattedData = KanaTradingService.formatMarketData(response.data);
        console.log('Formatted market data:', formattedData);
        setMarketData(formattedData);
      } else {
        console.error('Market data response not OK:', response);
      }
    } catch (error) {
      console.error('Failed to load market data:', error);
    }
  };

  const loadOrderBook = async () => {
    if (!selectedMarket) return;
    
    try {
      console.log('=== LOADING ORDER BOOK ===');
      const response = await KanaTradingService.getOrderBook(selectedMarket.marketId);
      console.log('Order book response:', response);
      
      if (response.status === 'OK') {
        const formattedData = KanaTradingService.formatOrderBook(response.data);
        console.log('Formatted order book:', formattedData);
        setOrderBook(formattedData);
      } else {
        console.error('Order book response not OK:', response);
      }
    } catch (error) {
      console.error('Failed to load order book:', error);
    }
  };

  const loadTrades = async () => {
    if (!selectedMarket) return;
    
    try {
      const response = await KanaTradingService.getAllTrades(selectedMarket.marketId, 0, 50);
      if (response.status === 'OK') {
        setTrades(response.data);
      }
    } catch (error) {
      console.error('Failed to load trades:', error);
    }
  };

  const loadCandlestickData = async () => {
    if (!selectedMarket) return;
    
    try {
      const response = await KanaTradingService.getCandleStickData(selectedMarket.marketId, timeframe);
      if (response.status === 'OK') {
        setCandlestickData(response.data);
      }
    } catch (error) {
      console.error('Failed to load candlestick data:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatPrice = (price) => {
    return (price / 1000000).toFixed(4);
  };

  const formatSize = (size) => {
    return (size / 100000).toFixed(3);
  };

  const renderMarketsList = () => (
    <View style={styles.marketsContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Markets</Text>
      <FlatList
        data={markets}
        keyExtractor={(item) => item.marketId.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.marketItem,
              selectedMarket?.marketId === item.marketId && styles.selectedMarketItem
            ]}
            onPress={() => setSelectedMarket(item)}
          >
            <View style={styles.marketInfo}>
              <Text style={styles.marketSymbol}>{item.market}</Text>
              <Text style={styles.marketDetails}>
                Min: {item.minSize} • Lot: {item.lotSize} • Tick: {item.tickSize}
              </Text>
            </View>
            <View style={styles.marketStatus}>
              <View style={[
                styles.statusDot,
                item.recognized ? styles.recognizedDot : styles.unrecognizedDot
              ]} />
              <Text style={styles.statusText}>
                {item.recognized ? 'Recognized' : 'Unrecognized'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderMarketOverview = () => (
    <View style={styles.overviewCard}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Market Overview</Text>
      {selectedMarket && (
        <View style={styles.marketHeader}>
          <Text style={styles.marketSymbolLarge}>{selectedMarket.market}</Text>
          <Text style={styles.marketId}>Market ID: {selectedMarket.marketId}</Text>
        </View>
      )}
      
      {marketData && (
        <View style={styles.priceData}>
          {liveData && (
            <View style={styles.lastUpdateRow}>
              <Text style={styles.lastUpdateText}>
                Last updated: {new Date(liveData.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Best Bid</Text>
            <Text style={[styles.priceValue, styles.bidPrice]}>
              ${formatPrice(marketData.bestBidPrice)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Best Ask</Text>
            <Text style={[styles.priceValue, styles.askPrice]}>
              ${formatPrice(marketData.bestAskPrice)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Spread</Text>
            <Text style={styles.priceValue}>
              ${formatPrice(marketData.spread)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Max Buy Quote</Text>
            <Text style={styles.priceValue}>
              ${(marketData.maxBuyQuote / 1000000).toFixed(2)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Max Sell Size</Text>
            <Text style={styles.priceValue}>
              {formatSize(marketData.maxSellSize)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderOrderBookData = () => (
    <View style={styles.orderBookCard}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Book Depth</Text>
      {orderBook && (
        <View style={styles.orderBookContainer}>
          {/* Asks */}
          <View style={styles.orderBookSection}>
            <Text style={styles.orderBookHeader}>Asks (Sell Orders)</Text>
            <FlatList
              data={orderBook.asks.slice(0, 15)}
              keyExtractor={(item) => item.orderId}
              renderItem={({ item }) => (
                <View style={styles.orderBookRow}>
                  <Text style={[styles.orderBookPrice, styles.askPrice]}>
                    ${formatPrice(item.price)}
                  </Text>
                  <Text style={styles.orderBookSize}>
                    {formatSize(item.size)}
                  </Text>
                </View>
              )}
            />
          </View>

          {/* Bids */}
          <View style={styles.orderBookSection}>
            <Text style={styles.orderBookHeader}>Bids (Buy Orders)</Text>
            <FlatList
              data={orderBook.bids.slice(0, 15)}
              keyExtractor={(item) => item.orderId}
              renderItem={({ item }) => (
                <View style={styles.orderBookRow}>
                  <Text style={[styles.orderBookPrice, styles.bidPrice]}>
                    ${formatPrice(item.price)}
                  </Text>
                  <Text style={styles.orderBookSize}>
                    {formatSize(item.size)}
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      )}
    </View>
  );

  const renderCharts = () => (
    <View style={styles.chartsContainer}>
      <View style={styles.chartHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Price Chart</Text>
        <View style={styles.timeframeSelector}>
          {timeframes.map((tf) => (
            <TouchableOpacity
              key={tf.value}
              style={[
                styles.timeframeButton,
                timeframe === tf.value && styles.selectedTimeframe
              ]}
              onPress={() => setTimeframe(tf.value)}
            >
              <Text style={[
                styles.timeframeText,
                timeframe === tf.value && styles.selectedTimeframeText
              ]}>
                {tf.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {candlestickData.length > 0 ? (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>OHLC Data (Last 10 periods)</Text>
          <FlatList
            data={candlestickData.slice(0, 10)}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.candleRow}>
                <Text style={styles.candleTime}>
                  {new Date(item.start_time).toLocaleTimeString()}
                </Text>
                <View style={styles.candleData}>
                  <Text style={styles.candleValue}>O: ${formatPrice(item.open)}</Text>
                  <Text style={styles.candleValue}>H: ${formatPrice(item.high)}</Text>
                  <Text style={styles.candleValue}>L: ${formatPrice(item.low)}</Text>
                  <Text style={styles.candleValue}>C: ${formatPrice(item.close)}</Text>
                  <Text style={styles.candleValue}>V: {formatSize(item.volume)}</Text>
                </View>
              </View>
            )}
          />
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No chart data available</Text>
        </View>
      )}
    </View>
  );

  const renderTrades = () => (
    <View style={styles.tradesContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Trades</Text>
      {trades.length > 0 ? (
        <FlatList
          data={trades.slice(0, 20)}
          keyExtractor={(item, index) => `${item.txn_version}-${item.event_idx}`}
          renderItem={({ item }) => (
            <View style={styles.tradeRow}>
              <View style={styles.tradeInfo}>
                <Text style={styles.tradeTime}>{formatTime(item.time)}</Text>
                <Text style={[
                  styles.tradeSide,
                  item.maker_side ? styles.sellSide : styles.buySide
                ]}>
                  {item.maker_side ? 'SELL' : 'BUY'}
                </Text>
              </View>
              <View style={styles.tradeDetails}>
                <Text style={styles.tradePrice}>${formatPrice(item.price)}</Text>
                <Text style={styles.tradeSize}>{formatSize(item.size)}</Text>
                <Text style={styles.tradeFee}>
                  Fee: ${(item.taker_quote_fees_paid / 1000000).toFixed(4)}
                </Text>
              </View>
            </View>
          )}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No recent trades</Text>
        </View>
      )}
    </View>
  );

  if (!isConnected) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Market Data</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Real-time market information</Text>
        </View>
        <View style={styles.disconnectedCard}>
          <Ionicons name="wallet-outline" size={64} color="#007AFF" />
          <Text style={styles.disconnectedTitle}>Connect Wallet</Text>
          <Text style={styles.disconnectedSubtitle}>
            Connect your wallet to view market data
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Market Data</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Real-time market information</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.refreshButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                console.log('Manual refresh triggered');
                if (selectedMarket) {
                  loadMarketData();
                  loadOrderBook();
                  loadTrades();
                }
              }}
            >
              <Ionicons name="refresh" size={16} color="white" />
            </TouchableOpacity>
            <View style={styles.liveIndicator}>
              <View style={[styles.liveDot, { backgroundColor: isLive ? colors.green : colors.textSecondary }]} />
              <Text style={[styles.liveText, { color: isLive ? colors.green : colors.textSecondary }]}>
                {isLive ? 'LIVE' : 'OFFLINE'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Market Overview */}
      {renderMarketOverview()}

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
        {activeTab === 'markets' && renderMarketsList()}
        {activeTab === 'charts' && renderCharts()}
        {activeTab === 'trades' && renderTrades()}
        
        {/* Always show order book data */}
        {renderOrderBookData()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    
  },
  overviewCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  marketHeader: {
    marginBottom: 16,
  },
  marketSymbolLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  marketId: {
    fontSize: 14,
    color: '#6c757d',
  },
  priceData: {
    gap: 8,
  },
  lastUpdateRow: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 8,
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  bidPrice: {
    color: '#34C759',
  },
  askPrice: {
    color: '#FF3B30',
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
    
  },
  content: {
    flex: 1,
  },
  marketsContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    
  },
  marketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  selectedMarketItem: {
    backgroundColor: '#f0f8ff',
  },
  marketInfo: {
    flex: 1,
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
  marketStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  recognizedDot: {
    backgroundColor: '#34C759',
  },
  unrecognizedDot: {
    backgroundColor: '#FF9500',
  },
  statusText: {
    fontSize: 12,
    color: '#6c757d',
  },
  orderBookCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    
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
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  orderBookPrice: {
    fontSize: 11,
    fontWeight: '500',
  },
  orderBookSize: {
    fontSize: 11,
    color: '#6c757d',
  },
  chartsContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeframeSelector: {
    flexDirection: 'row',
  },
  timeframeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
  },
  selectedTimeframe: {
    backgroundColor: '#007AFF',
  },
  timeframeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6c757d',
  },
  selectedTimeframeText: {
    color: 'white',
  },
  chartContainer: {
    marginTop: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  candleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  candleTime: {
    fontSize: 12,
    color: '#6c757d',
  },
  candleData: {
    flexDirection: 'row',
    gap: 12,
  },
  candleValue: {
    fontSize: 11,
    color: '#1a1a1a',
  },
  tradesContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    
  },
  tradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  tradeInfo: {
    flex: 1,
  },
  tradeTime: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  tradeSide: {
    fontSize: 12,
    fontWeight: '600',
  },
  buySide: {
    color: '#34C759',
  },
  sellSide: {
    color: '#FF3B30',
  },
  tradeDetails: {
    alignItems: 'flex-end',
  },
  tradePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  tradeSize: {
    fontSize: 12,
    color: '#6c757d',
  },
  tradeFee: {
    fontSize: 10,
    color: '#6c757d',
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#6c757d',
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

export default MarketDataScreen;
