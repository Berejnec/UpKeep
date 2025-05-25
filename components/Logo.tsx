import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  variant?: 'default' | 'white' | 'dark' | 'minimal';
  showText?: boolean;
  style?: ViewStyle;
}

export function Logo({ 
  size = 'medium', 
  variant = 'default', 
  showText = true,
  style 
}: LogoProps) {
  const sizeConfig = {
    small: {
      containerSize: 40,
      iconSize: 24,
      fontSize: 16,
      textMargin: 8,
    },
    medium: {
      containerSize: 60,
      iconSize: 36,
      fontSize: 20,
      textMargin: 12,
    },
    large: {
      containerSize: 80,
      iconSize: 48,
      fontSize: 24,
      textMargin: 16,
    },
    xlarge: {
      containerSize: 120,
      iconSize: 72,
      fontSize: 32,
      textMargin: 20,
    },
  };

  const variantConfig = {
    default: {
      containerBg: Colors.light.primaryColor,
      iconColor: 'white',
      textColor: Colors.light.primaryColor,
      shadowColor: '#000',
    },
    white: {
      containerBg: 'rgba(255, 255, 255, 0.2)',
      iconColor: 'white',
      textColor: 'white',
      shadowColor: '#000',
    },
    dark: {
      containerBg: '#333',
      iconColor: 'white',
      textColor: '#333',
      shadowColor: '#000',
    },
    minimal: {
      containerBg: 'transparent',
      iconColor: Colors.light.primaryColor,
      textColor: Colors.light.primaryColor,
      shadowColor: 'transparent',
    },
  };

  const config = sizeConfig[size];
  const colors = variantConfig[variant];

  const logoContainerStyle = [
    styles.logoContainer,
    {
      width: config.containerSize,
      height: config.containerSize,
      borderRadius: config.containerSize / 2,
      backgroundColor: colors.containerBg,
      shadowColor: colors.shadowColor,
    },
    variant !== 'minimal' && styles.shadow,
  ];

  const textStyle = [
    styles.logoText,
    {
      fontSize: config.fontSize,
      color: colors.textColor,
      marginTop: showText ? config.textMargin : 0,
    },
  ];

  return (
    <View style={[styles.container, style]}>
      <View style={logoContainerStyle}>
        <MaterialIcons 
          name="build" 
          size={config.iconSize} 
          color={colors.iconColor} 
        />
      </View>
      {showText && (
        <Text style={textStyle}>UpKeep</Text>
      )}
    </View>
  );
}

// Specialized logo variants for common use cases
export function HeaderLogo() {
  return <Logo size="small" variant="white" showText={true} />;
}

export function SplashLogo() {
  return <Logo size="xlarge" variant="white" showText={true} />;
}

export function AuthLogo() {
  return <Logo size="large" variant="white" showText={false} />;
}

export function TabBarLogo() {
  return <Logo size="small" variant="minimal" showText={false} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadow: {
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
