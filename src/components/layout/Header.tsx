import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { useLayoutStore } from '../../store';

// Simple icon components using text (can be replaced with SVG icons later)
const MenuIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 24, color }}>☰</Text>
);

const SunIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>☀️</Text>
);

const MoonIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>🌙</Text>
);

interface HeaderProps extends NativeStackHeaderProps {}

export const Header: React.FC<HeaderProps> = ({ options }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isDarkTheme, theme, setTheme } = useLayoutStore();

  const toggleDrawer = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const backgroundColor = isDarkTheme ? '#000000' : '#ffffff';
  const textColor = isDarkTheme ? '#ffffff' : '#21232c';
  const borderColor = isDarkTheme ? '#3a424a' : '#e0e3e6';

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor,
          borderBottomColor: borderColor,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Menu Button */}
        <TouchableOpacity
          onPress={toggleDrawer}
          style={styles.iconButton}
          accessibilityLabel="Open menu"
          accessibilityRole="button"
        >
          <MenuIcon color={textColor} />
        </TouchableOpacity>

        {/* Title / Logo */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: textColor }]}>
            {options.title || 'Neo'}
          </Text>
        </View>

        {/* Theme Toggle */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={styles.iconButton}
          accessibilityLabel={`Switch to ${isDarkTheme ? 'light' : 'dark'} theme`}
          accessibilityRole="button"
        >
          {isDarkTheme ? (
            <SunIcon color={textColor} />
          ) : (
            <MoonIcon color={textColor} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
