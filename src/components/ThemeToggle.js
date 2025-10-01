import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ style, showLabel = true, size = 'medium' }) => {
  const { isDarkMode, toggleTheme, colors, shadows } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          containerSize: 36,
          iconSize: 18,
          fontSize: 12,
        };
      case 'large':
        return {
          containerSize: 56,
          iconSize: 28,
          fontSize: 16,
        };
      default: // medium
        return {
          containerSize: 44,
          iconSize: 22,
          fontSize: 14,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    iconContainer: {
      width: sizeStyles.containerSize,
      height: sizeStyles.containerSize,
      borderRadius: sizeStyles.containerSize / 2,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: showLabel ? 8 : 0,
    },
    icon: {
      color: colors.text,
    },
    label: {
      fontSize: sizeStyles.fontSize,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 4,
    },
    compactContainer: {
      width: sizeStyles.containerSize,
      height: sizeStyles.containerSize,
      borderRadius: sizeStyles.containerSize / 2,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
  });

  if (!showLabel) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, style]}
        onPress={toggleTheme}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isDarkMode ? 'sunny' : 'moon'}
          size={sizeStyles.iconSize}
          color={colors.text}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={isDarkMode ? 'sunny' : 'moon'}
          size={sizeStyles.iconSize}
          color={colors.text}
        />
      </View>
      <Text style={styles.label}>
        {isDarkMode ? 'Light' : 'Dark'} Mode
      </Text>
    </TouchableOpacity>
  );
};

export default ThemeToggle;
