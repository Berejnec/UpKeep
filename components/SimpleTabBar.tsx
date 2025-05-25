import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@rneui/themed';
import { Colors } from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTriangleExclamation, faMap } from '@fortawesome/free-solid-svg-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export function SimpleTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <LinearGradient
      colors={[Colors.light.primaryColor, '#0a5d54', '#083d36']}
      style={styles.tabBar}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined 
          ? options.tabBarLabel 
          : options.title !== undefined 
          ? options.title 
          : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Get the appropriate icon
        const getIcon = () => {
          const iconColor = isFocused ? '#4DFFCD' : 'rgba(255, 255, 255, 0.6)';
          const iconSize = 24;
          
          switch (route.name) {
            case 'issues':
              return (
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  size={iconSize}
                  color={iconColor}
                />
              );
            case 'map':
              return (
                <FontAwesomeIcon
                  icon={faMap}
                  size={iconSize}
                  color={iconColor}
                />
              );
            case 'profile':
              return (
                <FontAwesome
                  name="user-circle-o"
                  size={iconSize}
                  color={iconColor}
                />
              );
            default:
              return null;
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                {getIcon()}
              </View>
              
              {/* Label */}
              <Text style={[
                styles.tabLabel,
                isFocused ? styles.activeTabLabel : styles.inactiveTabLabel
              ]}>
                {label as string}
              </Text>
              
              {/* Active indicator dot */}
              {isFocused && <View style={styles.activeIndicator} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 15,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  iconContainer: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTabLabel: {
    color: '#4DFFCD',
    fontWeight: 'bold',
  },
  inactiveTabLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 4,
    height: 4,
    backgroundColor: '#4DFFCD',
    borderRadius: 2,
  },
});
