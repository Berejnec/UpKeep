import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Logo, HeaderLogo, SplashLogo, AuthLogo, TabBarLogo } from '@/components/Logo';
import { Stack } from 'expo-router';

export default function LogoShowcaseScreen() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Logo Showcase',
          headerStyle: { backgroundColor: Colors.light.primaryColor },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }} 
      />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header Section */}
          <LinearGradient
            colors={[Colors.light.primaryColor, '#0a5d54']}
            style={styles.headerSection}
          >
            <Text style={styles.headerTitle}>UpKeep Logo Variants</Text>
            <Text style={styles.headerSubtitle}>
              Comprehensive logo system for the UpKeep application
            </Text>
          </LinearGradient>

          {/* Logo Variants */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Size Variants</Text>
            
            <View style={styles.logoRow}>
              <View style={styles.logoItem}>
                <Logo size="small" variant="default" showText={true} />
                <Text style={styles.logoLabel}>Small (40px)</Text>
              </View>
              
              <View style={styles.logoItem}>
                <Logo size="medium" variant="default" showText={true} />
                <Text style={styles.logoLabel}>Medium (60px)</Text>
              </View>
            </View>

            <View style={styles.logoRow}>
              <View style={styles.logoItem}>
                <Logo size="large" variant="default" showText={true} />
                <Text style={styles.logoLabel}>Large (80px)</Text>
              </View>
              
              <View style={styles.logoItem}>
                <Logo size="xlarge" variant="default" showText={true} />
                <Text style={styles.logoLabel}>XLarge (120px)</Text>
              </View>
            </View>
          </View>

          {/* Color Variants */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color Variants</Text>
            
            <View style={styles.colorVariantsContainer}>
              <View style={[styles.colorVariantItem, styles.defaultBg]}>
                <Logo size="medium" variant="default" showText={true} />
                <Text style={styles.variantLabel}>Default</Text>
              </View>
              
              <LinearGradient
                colors={[Colors.light.primaryColor, '#0a5d54']}
                style={[styles.colorVariantItem, styles.gradientBg]}
              >
                <Logo size="medium" variant="white" showText={true} />
                <Text style={[styles.variantLabel, styles.whiteText]}>White</Text>
              </LinearGradient>
              
              <View style={[styles.colorVariantItem, styles.darkBg]}>
                <Logo size="medium" variant="dark" showText={true} />
                <Text style={[styles.variantLabel, styles.whiteText]}>Dark</Text>
              </View>
              
              <View style={[styles.colorVariantItem, styles.lightBg]}>
                <Logo size="medium" variant="minimal" showText={true} />
                <Text style={styles.variantLabel}>Minimal</Text>
              </View>
            </View>
          </View>

          {/* Specialized Variants */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialized Variants</Text>
            
            <View style={styles.specializedContainer}>
              <View style={styles.specializedItem}>
                <View style={styles.headerDemo}>
                  <HeaderLogo />
                </View>
                <Text style={styles.specializedLabel}>Header Logo</Text>
                <Text style={styles.specializedDesc}>Used in navigation headers</Text>
              </View>
              
              <View style={styles.specializedItem}>
                <LinearGradient
                  colors={[Colors.light.primaryColor, '#0a5d54']}
                  style={styles.authDemo}
                >
                  <AuthLogo />
                </LinearGradient>
                <Text style={styles.specializedLabel}>Auth Logo</Text>
                <Text style={styles.specializedDesc}>Used in sign-in/sign-up screens</Text>
              </View>
              
              <View style={styles.specializedItem}>
                <View style={styles.tabDemo}>
                  <TabBarLogo />
                </View>
                <Text style={styles.specializedLabel}>Tab Bar Logo</Text>
                <Text style={styles.specializedDesc}>Used in tab navigation</Text>
              </View>
              
              <View style={styles.specializedItem}>
                <LinearGradient
                  colors={[Colors.light.primaryColor, '#0a5d54']}
                  style={styles.splashDemo}
                >
                  <SplashLogo />
                </LinearGradient>
                <Text style={styles.specializedLabel}>Splash Logo</Text>
                <Text style={styles.specializedDesc}>Used in splash screen</Text>
              </View>
            </View>
          </View>

          {/* Usage Guidelines */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Usage Guidelines</Text>
            <View style={styles.guidelinesContainer}>
              <Text style={styles.guidelineItem}>• Use HeaderLogo for navigation headers</Text>
              <Text style={styles.guidelineItem}>• Use AuthLogo for authentication screens</Text>
              <Text style={styles.guidelineItem}>• Use SplashLogo for splash screens and loading states</Text>
              <Text style={styles.guidelineItem}>• Use TabBarLogo for compact spaces</Text>
              <Text style={styles.guidelineItem}>• Maintain consistent spacing around logos</Text>
              <Text style={styles.guidelineItem}>• Choose appropriate variant based on background</Text>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  logoItem: {
    alignItems: 'center',
    padding: 20,
  },
  logoLabel: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  colorVariantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorVariantItem: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  defaultBg: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  gradientBg: {
    // LinearGradient applied inline
  },
  darkBg: {
    backgroundColor: '#333',
  },
  lightBg: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  variantLabel: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  whiteText: {
    color: 'white',
  },
  specializedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  specializedItem: {
    width: '48%',
    marginBottom: 20,
    alignItems: 'center',
  },
  headerDemo: {
    backgroundColor: Colors.light.primaryColor,
    padding: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  authDemo: {
    padding: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  tabDemo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  splashDemo: {
    padding: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  specializedLabel: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  specializedDesc: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  guidelinesContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  guidelineItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
});
