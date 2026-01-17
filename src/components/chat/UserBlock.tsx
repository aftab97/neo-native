import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLayoutStore } from '../../store';
import { ChatMessage } from '../../types/chat';
import { colors } from '../../theme/colors';

interface UserBlockProps {
  message: ChatMessage;
}

/**
 * User message bubble - matches web app styling
 * - Right-aligned
 * - Background: surface-300 (gray-100 light / gray-800 dark)
 * - Border radius: 16px (1rem)
 * - Max width: 80%
 */
export const UserBlock: React.FC<UserBlockProps> = ({ message }) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  // Match web: bg-surface-300 which is gray-100 in light, gray-800 in dark
  const backgroundColor = isDarkTheme ? colors.gray['800'] : colors.gray['100'];
  const textColor = isDarkTheme ? colors.gray['000'] : colors.gray['900'];

  return (
    <View style={styles.container}>
      <View style={[styles.bubble, { backgroundColor }]}>
        <Text style={[styles.text, { color: textColor }]}>{message.message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
});
