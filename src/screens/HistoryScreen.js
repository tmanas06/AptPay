import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const HistoryScreen = () => {
  const { account, isConnected } = useWallet();
  const { colors, shadows } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isConnected && account) {
      fetchTransactions();
    }
  }, [isConnected, account]);

  const fetchTransactions = async () => {
    if (!account) return;

    try {
      setLoading(true);
      // In a real implementation, you would use the Aptos Indexer API
      // For now, we'll show a placeholder message
      setTransactions([]);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Error', 'Failed to fetch transaction history');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Ionicons 
          name={item.type === 'sent' ? 'arrow-up' : 'arrow-down'} 
          size={24} 
          color={item.type === 'sent' ? '#FF3B30' : '#34C759'} 
        />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionType}>
          {item.type === 'sent' ? 'Sent' : 'Received'}
        </Text>
        <Text style={styles.transactionAddress}>
          {item.type === 'sent' ? `To: ${item.address}` : `From: ${item.address}`}
        </Text>
        <Text style={styles.transactionTime}>{item.time}</Text>
      </View>
      <View style={styles.transactionAmount}>
        <Text style={[
          styles.amountText,
          { color: item.type === 'sent' ? '#FF3B30' : '#34C759' }
        ]}>
          {item.type === 'sent' ? '-' : '+'}{item.amount} APT
        </Text>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="time-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Transactions Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your transaction history will appear here once you start sending or receiving APT
      </Text>
    </View>
  );

  if (!isConnected || !account) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centeredContent}>
          <Ionicons name="wallet-outline" size={64} color="#ccc" />
          <Text style={[styles.title, { color: colors.text }]}>Wallet Not Connected</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Please connect your wallet to view transaction history
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={loading}>
          <Ionicons 
            name="refresh" 
            size={24} 
            color={loading ? '#ccc' : '#007AFF'} 
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item, index) => index.toString()}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={transactions.length === 0 ? styles.emptyContainer : null}
      />

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
        <Text style={styles.infoText}>
          Transaction history is fetched from the Aptos blockchain. 
          It may take a few moments for new transactions to appear.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 5,
    borderRadius: 10,
    
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: 'flex-start',
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#1976d2',
    flex: 1,
    lineHeight: 20,
  },
});

export default HistoryScreen;
