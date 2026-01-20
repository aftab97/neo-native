import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLayoutStore } from '../../store';
import { ChatMessage } from '../../types/chat';
import { colors } from '../../theme/colors';
import { UserAttachments } from './UserAttachments';

interface UserBlockProps {
  message: ChatMessage;
}

/**
 * User message bubble - matches web app styling
 * - Right-aligned
 * - Background: surface-300 (gray-100 light / gray-800 dark)
 * - Border radius: 16px (1rem)
 * - Max width: 80%
 * - Shows attached files above the message bubble
 */
export const UserBlock: React.FC<UserBlockProps> = ({ message }) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  // Match web: bg-surface-300 which is gray-100 in light, gray-800 in dark
  const backgroundColor = isDarkTheme ? colors.gray['800'] : colors.gray['100'];
  const textColor = isDarkTheme ? colors.gray['000'] : colors.gray['900'];

  const hasFiles = message.files && message.files.length > 0;
  const hasText = typeof message.message === 'string' && message.message.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Uploaded files */}
      {hasFiles && <UserAttachments files={message.files!} />}

      {/* Message bubble */}
      {hasText && (
        <View style={[styles.bubble, { backgroundColor }]}>
          <Text style={[styles.text, { color: textColor }]}>{message.message}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 16, // Match web app gap-4
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
