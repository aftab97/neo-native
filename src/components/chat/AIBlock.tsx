import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useLayoutStore } from '../../store';
import { ChatMessage } from '../../types/chat';
import { colors, codeColors } from '../../theme/colors';
import { AdaptiveCardViewer } from './AdaptiveCardViewer';

interface AIBlockProps {
  message: ChatMessage;
  onCardSubmit?: (data: any) => void;
  /** True when this message is from a live chat agent (not AI) */
  isLiveChatAgent?: boolean;
}

interface ParsedResponse {
  type: 'card' | 'text' | 'chart';
  content?: any;
  text?: string;
  spec?: string;
}

/**
 * Parse JSON responses from the action agent
 * Returns array of parsed responses or null if not JSON
 */
const parseJsonResponses = (message: string): ParsedResponse[] | null => {
  if (!message) return null;

  const allResponses: ParsedResponse[] = [];

  try {
    // Handle case where multiple JSON objects are concatenated (Adaptive Cards)
    const rawMessages = message
      .trim()
      .split(/}(?=\s*{)/g) // split at boundary between objects
      .map((part, idx, arr) => (idx < arr.length - 1 ? part + '}' : part));

    for (const raw of rawMessages) {
      const json = JSON.parse(raw);
      if (Array.isArray(json.responses)) {
        allResponses.push(...json.responses);
      }
    }

    return allResponses.length > 0 ? allResponses : null;
  } catch (err) {
    // Not valid JSON, return null to render as markdown
    return null;
  }
};

/**
 * AI response block - matches web app styling
 * - Left-aligned, full width
 * - Markdown rendering with syntax highlighting
 * - Adaptive card support for action agent responses
 * - Status indicators during streaming
 */
export const AIBlock: React.FC<AIBlockProps> = ({ message, onCardSubmit, isLiveChatAgent = false }) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  const theme = isDarkTheme ? 'dark' : 'light';
  const textColor = isDarkTheme ? colors.gray['000'] : colors.gray['900'];
  const secondaryTextColor = isDarkTheme ? colors.gray['400'] : colors.gray['500'];
  const codeBackground = codeColors[theme].background;
  const inlineCodeBg = codeColors[theme].inlineCode.bg;
  const inlineCodeText = codeColors[theme].inlineCode.text;
  const linkColor = isDarkTheme ? colors.blue['500'] : colors.blue['700'];
  const hrColor = isDarkTheme ? colors.gray['700'] : colors.gray['200'];
  const tableBorderColor = isDarkTheme ? colors.gray['700'] : colors.gray['200'];
  const tableHeaderBg = isDarkTheme ? colors.gray['800'] : colors.gray['100'];

  const isLoading = message.status && message.status.length > 0 && !message.message;
  const hasError = message.status?.includes('Error');

  // Parse JSON responses (memoized to avoid re-parsing on each render)
  const parsedResponses = useMemo(() => {
    return parseJsonResponses(message.message || '');
  }, [message.message]);

  // Markdown styles matching web app
  const markdownStyles = {
    body: {
      color: textColor,
      fontSize: 16,
      lineHeight: 24,
    },
    heading1: {
      color: textColor,
      fontSize: 24,
      fontWeight: '300' as const,
      marginTop: 16,
      marginBottom: 8,
      lineHeight: 28.8,
    },
    heading2: {
      color: textColor,
      fontSize: 20,
      fontWeight: '300' as const,
      marginTop: 14,
      marginBottom: 6,
      lineHeight: 28,
    },
    heading3: {
      color: textColor,
      fontSize: 18,
      fontWeight: '500' as const,
      marginTop: 12,
      marginBottom: 4,
    },
    heading4: {
      color: textColor,
      fontSize: 16,
      fontWeight: '500' as const,
      marginTop: 10,
      marginBottom: 4,
    },
    heading5: {
      color: textColor,
      fontSize: 14,
      fontWeight: '500' as const,
      marginTop: 8,
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
      backgroundColor: inlineCodeBg,
      color: inlineCodeText,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      fontFamily: 'monospace',
      fontSize: 14,
    },
    code_block: {
      backgroundColor: codeBackground,
      color: colors.gray['100'],
      padding: 12,
      borderRadius: 8,
      fontFamily: 'monospace',
      fontSize: 14,
      overflow: 'hidden' as const,
    },
    fence: {
      backgroundColor: codeBackground,
      color: colors.gray['100'],
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
      fontFamily: 'monospace',
      fontSize: 14,
    },
    blockquote: {
      backgroundColor: isDarkTheme ? colors.gray['800'] : colors.gray['100'],
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
      backgroundColor: hrColor,
      height: 1,
      marginVertical: 16,
    },
    table: {
      borderWidth: 1,
      borderColor: tableBorderColor,
      borderRadius: 8,
      overflow: 'hidden' as const,
    },
    thead: {
      backgroundColor: tableHeaderBg,
    },
    tr: {
      borderBottomWidth: 1,
      borderColor: tableBorderColor,
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
    strong: {
      fontWeight: '600' as const,
    },
    em: {
      fontStyle: 'italic' as const,
    },
  };

  // Render parsed responses (cards, text, charts)
  const renderParsedResponses = () => {
    if (!parsedResponses) return null;

    return parsedResponses.map((res, idx) => {
      if (res.type === 'card' && res.content) {
        return (
          <AdaptiveCardViewer
            key={`card-${idx}`}
            content={res.content}
            onSubmit={onCardSubmit}
          />
        );
      } else if (res.type === 'text' && res.text) {
        return (
          <Markdown key={`text-${idx}`} style={markdownStyles}>
            {res.text}
          </Markdown>
        );
      } else if (res.type === 'chart' && res.spec) {
        // TODO: Implement chart rendering
        return (
          <View key={`chart-${idx}`} style={styles.chartPlaceholder}>
            <Text style={{ color: secondaryTextColor }}>
              Chart visualization not yet supported in mobile
            </Text>
          </View>
        );
      }
      return null;
    });
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
              { color: hasError ? colors.red['500'] : secondaryTextColor },
            ]}
          >
            {message.status.join(' • ')}
          </Text>
        </View>
      )}

      {/* Message content */}
      {message.message ? (
        parsedResponses ? (
          // Render parsed JSON responses (adaptive cards, etc.)
          renderParsedResponses()
        ) : (
          // Render as markdown
          <Markdown style={markdownStyles}>{message.message}</Markdown>
        )
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
    gap: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  chartPlaceholder: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    marginVertical: 8,
  },
});
