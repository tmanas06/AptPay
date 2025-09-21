import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Ionicons } from '@expo/vector-icons';

const QRScannerScreen = ({ navigation, route }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    
    setScanned(true);
    Vibration.vibrate();
    
    // Validate if the scanned data is a valid Aptos address
    const aptosAddressRegex = /^[0-9a-fA-F]{64}$/;
    
    if (aptosAddressRegex.test(data)) {
      // Navigate back to Send screen with the scanned address
      navigation.navigate('SendMain', { scannedAddress: data });
    } else {
      Alert.alert(
        'Invalid QR Code',
        'The scanned QR code does not contain a valid Aptos address.',
        [
          {
            text: 'Try Again',
            onPress: () => setScanned(false),
          },
          {
            text: 'Cancel',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  const goBack = () => {
    navigation.goBack();
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.centeredContent}>
          <Text style={styles.message}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.centeredContent}>
          <Ionicons name="camera-outline" size={64} color="#ccc" />
          <Text style={styles.title}>Camera Permission Required</Text>
          <Text style={styles.subtitle}>
            Please allow camera access to scan QR codes
          </Text>
          <TouchableOpacity style={styles.button} onPress={getCameraPermissions}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        flashMode={flashOn ? 'torch' : 'off'}
      />
      
      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Scan QR Code</Text>
          <TouchableOpacity style={styles.topButton} onPress={toggleFlash}>
            <Ionicons 
              name={flashOn ? "flash" : "flash-off"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>

        {/* Scanning area */}
        <View style={styles.scanningArea}>
          <View style={styles.scanningFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Bottom instructions */}
        <View style={styles.bottomInstructions}>
          <Text style={styles.instructionText}>
            Position the QR code within the frame
          </Text>
          <Text style={styles.instructionSubtext}>
            The code will be scanned automatically
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  scanningArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  bottomInstructions: {
    padding: 30,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 5,
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#ccc',
  },
});

export default QRScannerScreen;
