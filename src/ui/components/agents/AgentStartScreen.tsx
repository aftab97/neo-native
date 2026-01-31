import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLayoutStore } from '../../../store';
import { AgentMetadata, AgentCardItem } from './types';
import { AgentCard } from './AgentCard';
import { AnalystIcon, AgentLibraryLogo } from '../../foundation/icons';
import { colors } from '../../foundation/colors/colors';

interface AgentStartScreenProps {
  agent: AgentMetadata;
  onSuggestionPress: (prompt: string) => void;
}

/**
 * Agent start screen - matches web app styling
 * Shows agent icon, title, subtitle, description and suggestion cards
 */
export const AgentStartScreen: React.FC<AgentStartScreenProps> = ({
  agent,
  onSuggestionPress,
}) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  const textColor = isDarkTheme ? colors.gray['000'] : colors.gray['900'];
  const secondaryTextColor = isDarkTheme ? colors.gray['400'] : colors.gray['500'];
  const subtitleColor = isDarkTheme ? colors.blue['500'] : colors.blue['700'];

  // Determine if this is an analyst agent (same logic as web app)
  const isAnalystAgent = agent.categoryName?.toLowerCase().includes('analyst');

  // Handle card click - join all item.text values (matching web app behavior)
  const handleCardClick = (items: readonly AgentCardItem[]) => {
    const content = items.map((item) => item.text).join('\n');
    onSuggestionPress(content);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Agent Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          {isAnalystAgent ? (
            <AnalystIcon size={64} />
          ) : (
            <AgentLibraryLogo size={64} />
          )}
        </View>
        <Text style={[styles.title, { color: textColor }]}>{agent.title}</Text>
        {agent.subTitle && (
          <Text style={[styles.subTitle, { color: subtitleColor }]}>
            {agent.subTitle}
          </Text>
        )}
        <Text style={[styles.description, { color: secondaryTextColor }]}>
          {agent.text}
        </Text>
      </View>

      {/* Suggestion Cards */}
      {agent.cardData && agent.cardData.length > 0 && (
        <View style={styles.cardsContainer}>
          {agent.cardData.map((card, index) => (
            <AgentCard
              key={index}
              config={card}
              onPress={() => handleCardClick(card.items)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 36, // text-4xl (2.25rem / 36px) to match web
    fontWeight: '400', // font-normal to match web
    letterSpacing: -0.32, // tracking-[-0.02rem] to match web
    marginBottom: 8,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 18, // text-lg to match web
    fontWeight: '400', // font-normal to match web
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18, // text-lg to match web
    textAlign: 'center',
    lineHeight: 26,
  },
  cardsContainer: {
    paddingHorizontal: 16,
  },
});
