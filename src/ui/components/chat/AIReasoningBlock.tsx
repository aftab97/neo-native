import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useLayoutStore } from '../../../store';
import { ChevronDownIcon } from '../../foundation/icons';
import { colors } from '../../foundation/colors/colors';

interface AIReasoningBlockProps {
  thought: string;
  thoughtTitle: string;
}

/**
 * AIReasoningBlock - Expandable thought/reasoning display
 *
 * Displays AI reasoning in a collapsible format with:
 * - Clickable header with title and chevron icon
 * - Expandable content area with left border
 * - Markdown rendering for content
 *
 * Matches web app's ai-reasoning-block.tsx styling
 */
export const AIReasoningBlock: React.FC<AIReasoningBlockProps> = ({
  thought,
  thoughtTitle,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  // Skip rendering if no content
  if (!thought || !thoughtTitle) return null;

  const secondaryColor = isDarkTheme ? colors.gray['400'] : colors.gray['500'];
  const borderColor = isDarkTheme ? colors.gray['700'] : colors.gray['300'];
  const textColor = isDarkTheme ? colors.gray['100'] : colors.gray['900'];

  // Markdown styles for thought content
  const markdownStyles = {
    body: {
      color: textColor,
      fontSize: 14,
      lineHeight: 21, // 150% line height
    },
    paragraph: {
      color: textColor,
      marginTop: 0,
      marginBottom: 8,
    },
    link: {
      color: isDarkTheme ? colors.blue['400'] : colors.blue['600'],
    },
    code_inline: {
      backgroundColor: isDarkTheme ? colors.gray['800'] : colors.gray['100'],
      color: isDarkTheme ? colors.gray['200'] : colors.gray['700'],
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: 'monospace',
      fontSize: 13,
    },
    code_block: {
      backgroundColor: isDarkTheme ? colors.gray['800'] : colors.gray['100'],
      color: isDarkTheme ? colors.gray['200'] : colors.gray['700'],
      padding: 8,
      borderRadius: 6,
      fontFamily: 'monospace',
      fontSize: 13,
    },
    fence: {
      backgroundColor: isDarkTheme ? colors.gray['800'] : colors.gray['100'],
      color: isDarkTheme ? colors.gray['200'] : colors.gray['700'],
      padding: 8,
      borderRadius: 6,
      fontFamily: 'monospace',
      fontSize: 13,
      marginVertical: 4,
    },
    list_item: {
      color: textColor,
      marginBottom: 2,
    },
    strong: {
      fontWeight: '600' as const,
    },
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={`${thoughtTitle}, ${isExpanded ? 'collapse' : 'expand'} to see reasoning`}
      >
        <Text style={[styles.title, { color: secondaryColor }]}>
          {thoughtTitle}
        </Text>
        <View style={[styles.chevron, isExpanded && styles.chevronExpanded]}>
          <ChevronDownIcon size={12} color={secondaryColor} />
        </View>
      </Pressable>

      {isExpanded && (
        <View style={[styles.content, { borderLeftColor: borderColor }]}>
          <Markdown style={markdownStyles}>
            {thought}
          </Markdown>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  content: {
    marginTop: 8,
    marginLeft: 10,
    borderLeftWidth: 1,
    paddingLeft: 20,
    paddingVertical: 8,
  },
});
