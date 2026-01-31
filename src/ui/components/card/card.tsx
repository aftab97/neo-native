import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useLayoutStore } from '../../../store';

type CardVariant = 'filled' | 'outlined';

interface CardProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  children,
  variant = 'filled',
  onPress,
  style,
}) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  const backgroundColor =
    variant === 'filled'
      ? isDarkTheme
        ? '#21232c'
        : '#ffffff'
      : 'transparent';

  const borderColor = isDarkTheme ? '#3a424a' : '#e0e3e6';
  const textColor = isDarkTheme ? '#ffffff' : '#21232c';
  const secondaryTextColor = isDarkTheme ? '#9ea6ae' : '#6e7a85';

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
          borderWidth: variant === 'outlined' ? 1 : 0,
        },
        style,
      ]}
    >
      {title && <Text style={[styles.title, { color: textColor }]}>{title}</Text>}
      {description && (
        <Text style={[styles.description, { color: secondaryTextColor }]}>
          {description}
        </Text>
      )}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});
