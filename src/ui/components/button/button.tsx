import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useLayoutStore } from '../../store';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  const getBackgroundColor = () => {
    if (disabled) {
      return isDarkTheme ? '#3a424a' : '#e0e3e6';
    }

    switch (variant) {
      case 'primary':
        return '#0158ab';
      case 'secondary':
        return isDarkTheme ? '#3a424a' : '#f4f5f6';
      case 'danger':
        return isDarkTheme ? '#7f1d1d' : '#fee2e2';
      case 'ghost':
        return 'transparent';
      default:
        return '#0158ab';
    }
  };

  const getTextColor = () => {
    if (disabled) {
      return isDarkTheme ? '#6e7a85' : '#9ea6ae';
    }

    switch (variant) {
      case 'primary':
        return '#ffffff';
      case 'secondary':
        return isDarkTheme ? '#ffffff' : '#21232c';
      case 'danger':
        return isDarkTheme ? '#fecaca' : '#b91c1c';
      case 'ghost':
        return isDarkTheme ? '#ffffff' : '#21232c';
      default:
        return '#ffffff';
    }
  };

  const getSizeStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          button: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
          text: { fontSize: 14 },
        };
      case 'lg':
        return {
          button: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12 },
          text: { fontSize: 18 },
        };
      default:
        return {
          button: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
          text: { fontSize: 16 },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        sizeStyles.button,
        { backgroundColor: getBackgroundColor() },
        fullWidth && styles.fullWidth,
        variant === 'ghost' && styles.ghost,
        style,
      ]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            sizeStyles.text,
            { color: getTextColor() },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  ghost: {
    borderWidth: 0,
  },
  text: {
    fontWeight: '600',
  },
});
