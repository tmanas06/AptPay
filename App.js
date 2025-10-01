import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { AptosWalletProvider } from './src/contexts/WalletContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import TradingScreen from './src/screens/TradingScreen';
import HedgingScreen from './src/screens/HedgingScreen';
import AMMScreen from './src/screens/AMMScreen';
import KanaTradingScreen from './src/screens/KanaTradingScreen';
import MarketDataScreen from './src/screens/MarketDataScreen';
import OrderManagementScreen from './src/screens/OrderManagementScreen';
import GuideScreen from './src/screens/GuideScreen';
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

function WalletStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="WalletMain" 
        component={HomeScreen} 
        options={{ title: 'Wallet' }}
      />
      <Stack.Screen 
        name="Send" 
        component={SendStack} 
        options={{ title: 'Send' }}
      />
      <Stack.Screen 
        name="Receive" 
        component={ReceiveScreen} 
        options={{ title: 'Receive' }}
      />
      <Stack.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{ title: 'History' }}
      />
    </Stack.Navigator>
  );
}

function KanaStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="KanaMain" 
        component={KanaTradingScreen} 
        options={{ title: 'Kana Trading' }}
      />
      <Stack.Screen 
        name="MarketData" 
        component={MarketDataScreen} 
        options={{ title: 'Market Data' }}
      />
      <Stack.Screen 
        name="OrderManagement" 
        component={OrderManagementScreen} 
        options={{ title: 'Order Management' }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'KanaTrade') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'MarketData') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Trading') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
          } else if (route.name === 'AMM') {
            iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
          } else if (route.name === 'Hedging') {
              iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
            } else if (route.name === 'Guide') {
              iconName = focused ? 'book' : 'book-outline';
            }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="KanaTrade" component={KanaStack} />
      <Tab.Screen name="Trading" component={TradingScreen} />
      <Tab.Screen name="AMM" component={AMMScreen} />
      <Tab.Screen name="Hedging" component={HedgingScreen} />
      <Tab.Screen name="Guide" component={GuideScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AptosWalletProvider>
        <NavigationContainer>
          <StatusBarWrapper />
          <MainTabs />
        </NavigationContainer>
      </AptosWalletProvider>
    </ThemeProvider>
  );
}

// Component to handle theme-aware status bar
function StatusBarWrapper() {
  const { isDarkMode } = useTheme();
  return <StatusBar style={isDarkMode ? "light" : "dark"} />;
}
