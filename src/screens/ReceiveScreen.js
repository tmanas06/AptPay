import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  ScrollView,
} from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const ReceiveScreen = () => {
  const { account, isConnected } = useWallet();
  const { colors, shadows } = useTheme();
  const [showQR, setShowQR] = useState(false);

  const handleCopyAddress = async () => {
    if (account) {
      try {
        await navigator.clipboard.writeText(account.accountAddress.toString());
        Alert.alert('Copied', 'Address copied to clipboard');
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = account.accountAddress.toString();
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        Alert.alert('Copied', 'Address copied to clipboard');
      }
    }
  };

  const handleShareAddress = async () => {
    if (account) {
      try {
        if (navigator.share) {
          await navigator.share({
            text: `My AptosPay address: ${account.accountAddress.toString()}`,
            title: 'AptosPay Address',
          });
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(account.accountAddress.toString());
          Alert.alert('Copied', 'Address copied to clipboard');
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to share address');
      }
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  if (!isConnected || !account) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centeredContent}>
          <Ionicons name="wallet-outline" size={64} color="#ccc" />
          <Text style={[styles.title, { color: colors.text }]}>Wallet Not Connected</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Please connect your wallet to receive payments
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.addressCard}>
          <Text style={styles.cardTitle}>Your AptosPay Address</Text>
          <Text style={styles.addressText}>{formatAddress(account.accountAddress.toString())}</Text>
          <Text style={styles.fullAddress}>{account.accountAddress.toString()}</Text>
        </View>

        <View style={styles.qrSection}>
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => setShowQR(!showQR)}
          >
            <Ionicons 
              name={showQR ? "eye-off-outline" : "qr-code-outline"} 
              size={24} 
              color="#007AFF" 
            />
            <Text style={styles.qrButtonText}>
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </Text>
          </TouchableOpacity>

          {showQR && (
            <View style={styles.qrContainer}>
              <QRCode
                value={account.accountAddress.toString()}
                size={200}
                color="#000"
                backgroundColor="#fff"
              />
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCopyAddress}>
            <Ionicons name="copy-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Copy Address</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShareAddress}>
            <Ionicons name="share-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Share Address</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How to Receive Payments</Text>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            <Text style={styles.infoText}>
              Share your address or QR code with the sender
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            <Text style={styles.infoText}>
              The sender will scan your QR code or enter your address
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            <Text style={styles.infoText}>
              You'll receive the payment instantly
            </Text>
          </View>
        </View>

        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={20} color="#FF9500" />
          <Text style={styles.warningText}>
            This address can only receive APT tokens from the Aptos Devnet. Sending tokens from another network will result in loss of funds.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
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
  addressCard: {
    
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  addressText: {
    fontSize: 20,
    fontWeight: 'bold',
    
    marginBottom: 10,
  },
  fullAddress: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  qrSection: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    marginBottom: 20,
  },
  qrButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  warningText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#856404',
    flex: 1,
  },
});

export default ReceiveScreen;
