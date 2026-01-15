import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLayoutStore, useChatStore } from '../../store';
import { AgentMetadata } from '../../types/agent';
import { AgentCard } from './AgentCard';

// Icon mapping
const iconMap: Record<string, string> = {
  brain: '🧠',
  users: '👥',
  scale: '⚖️',
  'dollar-sign': '💰',
  'clipboard-check': '📋',
  'file-text': '📄',
  'bar-chart-2': '📊',
  tool: '🔧',
};

interface AgentStartScreenProps {
  agent: AgentMetadata;
  onSuggestionPress: (prompt: string) => void;
}

export const AgentStartScreen: React.FC<AgentStartScreenProps> = ({
  agent,
  onSuggestionPress,
}) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  const textColor = isDarkTheme ? '#ffffff' : '#21232c';
  const secondaryTextColor = isDarkTheme ? '#9ea6ae' : '#6e7a85';

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
        <Text style={styles.icon}>{iconMap[agent.icon] || '🤖'}</Text>
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
  icon: {
    fontSize: 64,
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
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
});
