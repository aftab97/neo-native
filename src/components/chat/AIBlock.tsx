import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useLayoutStore } from '../../store';
import { ChatMessage } from '../../types/chat';

interface AIBlockProps {
  message: ChatMessage;
}

export const AIBlock: React.FC<AIBlockProps> = ({ message }) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  const textColor = isDarkTheme ? '#ffffff' : '#21232c';
  const secondaryTextColor = isDarkTheme ? '#9ea6ae' : '#6e7a85';
  const codeBackgroundColor = isDarkTheme ? '#1f2937' : '#f3f4f6';
  const linkColor = '#0158ab';

  const isLoading = message.status && message.status.length > 0 && !message.message;
  const hasError = message.status?.includes('Error');

  // Markdown styles
  const markdownStyles = {
    body: {
      color: textColor,
      fontSize: 16,
      lineHeight: 24,
    },
    heading1: {
      color: textColor,
      fontSize: 24,
      fontWeight: '700' as const,
      marginTop: 16,
      marginBottom: 8,
    },
    heading2: {
      color: textColor,
      fontSize: 20,
      fontWeight: '600' as const,
      marginTop: 14,
      marginBottom: 6,
    },
    heading3: {
      color: textColor,
      fontSize: 18,
      fontWeight: '600' as const,
      marginTop: 12,
      marginBottom: 4,
    },
    paragraph: {
      color: textColor,
      marginTop: 0,
      marginBottom: 12,
    },
    link: {
      color: linkColor,
      textDecorationLine: 'underline' as const,
    },
    code_inline: {
      backgroundColor: codeBackgroundColor,
      color: textColor,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: 'monospace',
      fontSize: 14,
    },
    code_block: {
      backgroundColor: codeBackgroundColor,
      padding: 12,
      borderRadius: 8,
      fontFamily: 'monospace',
      fontSize: 14,
      overflow: 'hidden' as const,
    },
    fence: {
      backgroundColor: codeBackgroundColor,
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
    },
    blockquote: {
      backgroundColor: codeBackgroundColor,
      borderLeftWidth: 4,
      borderLeftColor: linkColor,
      paddingLeft: 12,
      paddingVertical: 8,
      marginVertical: 8,
    },
    list_item: {
      color: textColor,
      marginBottom: 4,
    },
    bullet_list: {
      marginBottom: 12,
    },
    ordered_list: {
      marginBottom: 12,
    },
    hr: {
      backgroundColor: isDarkTheme ? '#3a424a' : '#e0e3e6',
      height: 1,
      marginVertical: 16,
    },
    table: {
      borderColor: isDarkTheme ? '#3a424a' : '#e0e3e6',
    },
    tr: {
      borderBottomWidth: 1,
      borderColor: isDarkTheme ? '#3a424a' : '#e0e3e6',
    },
    th: {
      padding: 8,
      color: textColor,
      fontWeight: '600' as const,
    },
    td: {
      padding: 8,
      color: textColor,
    },
  };

  return (
    <View style={styles.container}>
      {/* Status indicator */}
      {message.status && message.status.length > 0 && (
        <View style={styles.statusContainer}>
          {isLoading && <ActivityIndicator size="small" color={linkColor} />}
          <Text
            style={[
              styles.statusText,
              { color: hasError ? '#ef4444' : secondaryTextColor },
            ]}
          >
            {message.status.join(' • ')}
          </Text>
        </View>
      )}

      {/* Message content */}
      {message.message ? (
        <Markdown style={markdownStyles}>{message.message}</Markdown>
      ) : isLoading ? null : (
        <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
          No response
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
