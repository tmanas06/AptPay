import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

const ThemeContext = createContext();

// Storage helper that works on both web and native
const storage = {
  async getItem(key) {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.log('Error reading from localStorage:', error);
        return null;
      }
    } else {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        return await AsyncStorage.getItem(key);
      } catch (error) {
        console.log('Error reading from AsyncStorage:', error);
        return null;
      }
    }
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.log('Error writing to localStorage:', error);
      }
    } else {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(key, value);
      } catch (error) {
        console.log('Error writing to AsyncStorage:', error);
      }
    }
  },
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await storage.getItem('aptospay_theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.log('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await storage.setItem('aptospay_theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  const theme = {
    isDarkMode,
    isLoading,
    toggleTheme,
    colors: {
      // Primary colors
      primary: isDarkMode ? '#007AFF' : '#007AFF',
      primaryLight: isDarkMode ? '#4A9EFF' : '#4A9EFF',
      primaryDark: isDarkMode ? '#0056CC' : '#0056CC',
      
      // Background colors
      background: isDarkMode ? '#000000' : '#f8f9fa',
      backgroundSecondary: isDarkMode ? '#1c1c1e' : '#ffffff',
      backgroundTertiary: isDarkMode ? '#2c2c2e' : '#f1f3f4',
      
      // Surface colors
      surface: isDarkMode ? '#1c1c1e' : '#ffffff',
      surfaceSecondary: isDarkMode ? '#2c2c2e' : '#f8f9fa',
      surfaceElevated: isDarkMode ? '#3a3a3c' : '#ffffff',
      
      // Text colors
      text: isDarkMode ? '#ffffff' : '#1a1a1a',
      textSecondary: isDarkMode ? '#8e8e93' : '#6c757d',
      textTertiary: isDarkMode ? '#636366' : '#8e8e93',
      textInverse: isDarkMode ? '#1a1a1a' : '#ffffff',
      
      // Border colors
      border: isDarkMode ? '#38383a' : '#e9ecef',
      borderSecondary: isDarkMode ? '#48484a' : '#dee2e6',
      borderFocus: isDarkMode ? '#007AFF' : '#007AFF',
      
      // Status colors
      success: isDarkMode ? '#34C759' : '#34C759',
      warning: isDarkMode ? '#FF9500' : '#FF9500',
      error: isDarkMode ? '#FF3B30' : '#FF3B30',
      info: isDarkMode ? '#007AFF' : '#007AFF',
      
      // Additional status colors
      red: isDarkMode ? '#FF3B30' : '#FF3B30',
      green: isDarkMode ? '#34C759' : '#34C759',
      blue: isDarkMode ? '#007AFF' : '#007AFF',
      secondary: isDarkMode ? '#8e8e93' : '#6c757d',
      
      // Background colors for status
      errorBackground: isDarkMode ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 59, 48, 0.1)',
      successBackground: isDarkMode ? 'rgba(52, 199, 89, 0.1)' : 'rgba(52, 199, 89, 0.1)',
      warningBackground: isDarkMode ? 'rgba(255, 149, 0, 0.1)' : 'rgba(255, 149, 0, 0.1)',
      
      // Accent colors for features
      accent1: isDarkMode ? '#6C5CE7' : '#6C5CE7', // Kana Trade
      accent2: isDarkMode ? '#00B894' : '#00B894', // Market Data
      accent3: isDarkMode ? '#FF3B30' : '#FF3B30', // Leveraged Trade
      accent4: isDarkMode ? '#34C759' : '#34C759', // AMM
      accent5: isDarkMode ? '#007AFF' : '#007AFF', // Hedging
      accent6: isDarkMode ? '#FF9500' : '#FF9500', // Wallet
      accent7: isDarkMode ? '#5856D6' : '#5856D6', // Get APT
      
      // Shadow colors
      shadow: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.1)',
      shadowLight: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.05)',
      
      // Overlay colors
      overlay: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
      
      // Tab bar colors
      tabBarBackground: isDarkMode ? '#1c1c1e' : '#ffffff',
      tabBarBorder: isDarkMode ? '#38383a' : '#e9ecef',
    },
    
    // Typography
    typography: {
      h1: {
        fontSize: 28,
        fontWeight: 'bold',
        color: isDarkMode ? '#ffffff' : '#1a1a1a',
      },
      h2: {
        fontSize: 22,
        fontWeight: 'bold',
        color: isDarkMode ? '#ffffff' : '#1a1a1a',
      },
      h3: {
        fontSize: 18,
        fontWeight: '600',
        color: isDarkMode ? '#ffffff' : '#1a1a1a',
      },
      h4: {
        fontSize: 16,
        fontWeight: '600',
        color: isDarkMode ? '#ffffff' : '#1a1a1a',
      },
      body: {
        fontSize: 14,
        fontWeight: '400',
        color: isDarkMode ? '#ffffff' : '#1a1a1a',
      },
      bodySecondary: {
        fontSize: 14,
        fontWeight: '400',
        color: isDarkMode ? '#8e8e93' : '#6c757d',
      },
      caption: {
        fontSize: 12,
        fontWeight: '400',
        color: isDarkMode ? '#8e8e93' : '#6c757d',
      },
      button: {
        fontSize: 16,
        fontWeight: '600',
        color: isDarkMode ? '#ffffff' : '#ffffff',
      },
    },
    
    // Spacing
    spacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    
    // Border radius
    borderRadius: {
      sm: 6,
      md: 8,
      lg: 12,
      xl: 16,
      xxl: 20,
      round: 50,
    },
    
    // Shadows - web compatible
    shadows: {
      sm: Platform.OS === 'web' ? {
        boxShadow: `0 1px 2px ${isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.1)'}`,
      } : {
        shadowColor: isDarkMode ? '#000000' : '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDarkMode ? 0.8 : 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      md: Platform.OS === 'web' ? {
        boxShadow: `0 2px 4px ${isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.1)'}`,
      } : {
        shadowColor: isDarkMode ? '#000000' : '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDarkMode ? 0.8 : 0.1,
        shadowRadius: 4,
        elevation: 4,
      },
      lg: Platform.OS === 'web' ? {
        boxShadow: `0 4px 8px ${isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.1)'}`,
      } : {
        shadowColor: isDarkMode ? '#000000' : '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDarkMode ? 0.8 : 0.1,
        shadowRadius: 8,
        elevation: 8,
      },
    },
  };

  const value = {
    ...theme,
    isDarkMode,
    isLoading,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
