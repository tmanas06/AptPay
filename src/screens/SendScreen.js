import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const SendScreen = ({ navigation }) => {
  const { account, balance, sendTransaction, loading } = useWallet();
  const { colors, shadows } = useTheme();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isValidAddress, setIsValidAddress] = useState(false);

  const validateAddress = (address) => {
    // Aptos address validation - accepts with or without 0x prefix
    const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
    const aptosAddressRegex = /^[0-9a-fA-F]{64}$/;
    return aptosAddressRegex.test(cleanAddress);
  };

  const handleAddressChange = (text) => {
    setRecipient(text);
    setIsValidAddress(validateAddress(text));
  };

  const handleAmountChange = (text) => {
    // Only allow numbers and decimal point
    const cleanText = text.replace(/[^0-9.]/g, '');
    setAmount(cleanText);
  };

  const handleSend = async () => {
    if (!recipient || !amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isValidAddress) {
      Alert.alert('Error', 'Please enter a valid Aptos address');
      return;
    }

    const sendAmount = parseFloat(amount);
    if (isNaN(sendAmount) || sendAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (sendAmount > balance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    try {
      Alert.alert(
        'Confirm Transaction',
        `Send ${sendAmount} APT to ${recipient.slice(0, 8)}...${recipient.slice(-8)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              try {
                const txHash = await sendTransaction(recipient, sendAmount);
                Alert.alert('Success', `Transaction sent!\nHash: ${txHash.slice(0, 16)}...`);
                setRecipient('');
                setAmount('');
                setIsValidAddress(false);
              } catch (err) {
                Alert.alert('Error', err.message);
              }
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleQRScan = () => {
    navigation.navigate('QRScanner');
  };

  const setMaxAmount = () => {
    setAmount(balance.toString());
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{balance.toFixed(4)} APT</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recipient Address</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  recipient && !isValidAddress && styles.inputError
                ]}
                placeholder="Enter Aptos address (0x... or 64 hex chars)"
                value={recipient}
                onChangeText={handleAddressChange}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
              />
              <TouchableOpacity style={styles.qrButton} onPress={handleQRScan}>
                <Ionicons name="qr-code-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
            {recipient && !isValidAddress && (
              <Text style={styles.errorText}>Invalid Aptos address format</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (APT)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity style={styles.maxButton} onPress={setMaxAmount}>
                <Text style={styles.maxButtonText}>MAX</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!recipient || !amount || !isValidAddress || loading) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={!recipient || !amount || !isValidAddress || loading}
          >
            <Text style={styles.sendButtonText}>
              {loading ? 'Sending...' : 'Send APT'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Transaction Info</Text>
          <Text style={styles.infoText}>
            • Transactions are processed on Aptos devnet
          </Text>
          <Text style={styles.infoText}>
            • Network fees are minimal
          </Text>
          <Text style={styles.infoText}>
            • Transactions are irreversible
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  balanceCard: {
    
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#333',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  qrButton: {
    padding: 8,
    marginLeft: 10,
  },
  maxButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  maxButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 5,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default SendScreen;
