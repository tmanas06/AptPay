import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import KanaTradingService from '../services/KanaTradingService';

const ApiKeyConfig = ({ onApiKeySet }) => {
  const { colors, shadows } = useTheme();
  const [apiKey, setApiKey] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter a valid API key');
      return;
    }

    // Set the API key in the trading service
    KanaTradingService.setApiKey(apiKey.trim());
    
    Alert.alert(
      'Success',
      'API key has been set successfully! You can now use real Kana Labs trading data.',
      [
        {
          text: 'OK',
          onPress: () => {
            setIsVisible(false);
            if (onApiKeySet) {
              onApiKeySet(apiKey.trim());
            }
          }
        }
      ]
    );
  };

  const handleGetApiKey = () => {
    Alert.alert(
      'Get API Key',
      'To get a Kana Labs API key:\n\n1. Email: hello@kanalabs.io\n2. Mention you need API access for trading integration\n3. They will provide your API key\n\nThis will enable real trading data instead of mock data.',
      [
        { text: 'Copy Email', onPress: () => {
          // In a real app, you might copy to clipboard
          console.log('Email to copy: hello@kanalabs.io');
        }},
        { text: 'OK' }
      ]
    );
  };

  if (!isVisible) {
    return (
      <TouchableOpacity
        style={[styles.configButton, { backgroundColor: colors.primary }]}
        onPress={() => setIsVisible(true)}
      >
        <Ionicons name="key" size={16} color="white" />
        <Text style={styles.configButtonText}>Configure API Key</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Kana Labs API Key</Text>
        <TouchableOpacity onPress={() => setIsVisible(false)}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.description, { color: colors.text }]}>
          Enter your Kana Labs API key to access real trading data:
        </Text>

        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
            color: colors.text 
          }]}
          placeholder="Enter your API key"
          placeholderTextColor={colors.placeholder}
          value={apiKey}
          onChangeText={setApiKey}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.getKeyButton, { backgroundColor: colors.secondary }]}
          onPress={handleGetApiKey}
        >
          <Ionicons name="mail" size={16} color="white" />
          <Text style={styles.buttonText}>How to Get API Key</Text>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.border }]}
            onPress={() => setIsVisible(false)}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleSaveApiKey}
          >
            <Text style={styles.buttonText}>Save API Key</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  configButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    minWidth: 300,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  getKeyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ApiKeyConfig;
