import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { SplashLogo } from '@/components/Logo';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

export function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const animationSequence = Animated.sequence([
      // Logo appears and scales up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Text slides up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      // Hold for a moment
      Animated.delay(1000),
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start(() => {
      onAnimationComplete?.();
    });
  }, [fadeAnim, scaleAnim, slideAnim, onAnimationComplete]);

  return (
    <LinearGradient
      colors={[Colors.light.primaryColor, '#0a5d54', '#083d36']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <SplashLogo />
        
        <Animated.View
          style={[
            styles.textContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.tagline}>Maintain • Report • Resolve</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </Animated.View>
      </Animated.View>

      {/* Decorative elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      <View style={styles.decorativeCircle3} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    letterSpacing: 1,
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '300',
  },
  // Decorative background elements
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: height * 0.3,
    right: -80,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
});
