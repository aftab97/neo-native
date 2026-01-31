import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useLayoutStore } from '../../store';

interface LoaderProps {
  size?: 'small' | 'large';
  text?: string;
  fullScreen?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'large',
  text,
  fullScreen = false,
}) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  const color = '#0158ab';
  const textColor = isDarkTheme ? '#9ea6ae' : '#6e7a85';
  const backgroundColor = isDarkTheme ? '#17191f' : '#eceef0';

  const content = (
    <View style={[styles.container, fullScreen && { backgroundColor }]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={[styles.text, { color: textColor }]}>{text}</Text>}
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreen}>{content}</View>;
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
  },
});
