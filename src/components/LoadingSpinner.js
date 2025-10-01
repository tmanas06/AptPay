import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LoadingSpinner = ({ message = 'Loading...', size = 'large', color = '#007AFF' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const LoadingOverlay = ({ visible, message = 'Loading...' }) => {
  if (!visible) return null;
  
  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.overlayMessage}>{message}</Text>
      </View>
    </View>
  );
};

const WalletLoadingSpinner = ({ message = 'Connecting to wallet...' }) => {
  return (
    <View style={styles.walletLoadingContainer}>
      <Ionicons name="wallet" size={48} color="#007AFF" />
      <ActivityIndicator size="large" color="#007AFF" style={styles.spinner} />
      <Text style={styles.walletLoadingMessage}>{message}</Text>
      <Text style={styles.walletLoadingSubtext}>
        Please wait while we connect to your wallet
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  overlayMessage: {
    marginTop: 16,
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'center',
    fontWeight: '500',
  },
  walletLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
  },
  spinner: {
    marginTop: 24,
    marginBottom: 24,
  },
  walletLoadingMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  walletLoadingSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export { LoadingSpinner, LoadingOverlay, WalletLoadingSpinner };
export default LoadingSpinner;
