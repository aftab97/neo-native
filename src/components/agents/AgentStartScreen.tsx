import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLayoutStore } from '../../store';
import { AgentMetadata } from '../../types/agent';
import { AgentCard } from './AgentCard';
import { AgentIcon } from '../icons';
import { colors } from '../../theme/colors';

interface AgentStartScreenProps {
  agent: AgentMetadata;
  onSuggestionPress: (prompt: string) => void;
}

/**
 * Agent start screen - matches web app styling
 * Shows agent icon, name, description and suggestion cards
 */
export const AgentStartScreen: React.FC<AgentStartScreenProps> = ({
  agent,
  onSuggestionPress,
}) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  const textColor = isDarkTheme ? colors.gray['000'] : colors.gray['900'];
  const secondaryTextColor = isDarkTheme ? colors.gray['400'] : colors.gray['500'];

  const handleCardPress = (title: string) => {
    onSuggestionPress(title);
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
          <AgentIcon type={agent.iconType} size={80} />
        </View>
        <Text style={[styles.title, { color: textColor }]}>{agent.label}</Text>
        <Text style={[styles.description, { color: secondaryTextColor }]}>
          {agent.description}
        </Text>
      </View>

      {/* Suggestion Cards */}
      {agent.cardData && agent.cardData.length > 0 && (
        <View style={styles.cardsContainer}>
          <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
            Suggestions
          </Text>
          {agent.cardData.map((card, index) => (
            <AgentCard
              key={index}
              config={card}
              onPress={() => handleCardPress(card.title)}
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
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  cardsContainer: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
});
