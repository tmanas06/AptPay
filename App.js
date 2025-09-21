import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { AptosWalletProvider } from './src/contexts/WalletContext';
import HomeScreen from './src/screens/HomeScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function SendStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SendMain" 
        component={SendScreen} 
        options={{ title: 'Send APT' }}
      />
      <Stack.Screen 
        name="QRScanner" 
        component={QRScannerScreen} 
        options={{ title: 'Scan QR Code' }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Send') {
            iconName = focused ? 'send' : 'send-outline';
          } else if (route.name === 'Receive') {
            iconName = focused ? 'download' : 'download-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Send" component={SendStack} />
      <Tab.Screen name="Receive" component={ReceiveScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AptosWalletProvider>
      <NavigationContainer>
        <MainTabs />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AptosWalletProvider>
  );
}
