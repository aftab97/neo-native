import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLayoutStore, useAgentStore } from '../../store';
import { AGENTS } from '../../config/agents';
import { AgentMetadata } from '../../types/agent';

// Icon mapping (emoji placeholders - can be replaced with SVG icons)
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

interface AgentCardItemProps {
  agent: AgentMetadata;
  onPress: () => void;
  isDarkTheme: boolean;
}

const AgentCardItem: React.FC<AgentCardItemProps> = ({
  agent,
  onPress,
  isDarkTheme,
}) => {
  const backgroundColor = isDarkTheme ? '#21232c' : '#ffffff';
  const textColor = isDarkTheme ? '#ffffff' : '#21232c';
  const secondaryTextColor = isDarkTheme ? '#9ea6ae' : '#6e7a85';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`Open ${agent.label} agent`}
      accessibilityRole="button"
    >
      <Text style={styles.icon}>{iconMap[agent.icon] || '🤖'}</Text>
      <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
        {agent.label}
      </Text>
      <Text
        style={[styles.description, { color: secondaryTextColor }]}
        numberOfLines={2}
      >
        {agent.description}
      </Text>
    </TouchableOpacity>
  );
};

export const AgentCards: React.FC = () => {
  const navigation = useNavigation();
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const { setSelectedAgent } = useAgentStore();

  const handleAgentPress = (agent: AgentMetadata) => {
    setSelectedAgent(agent.id);
    navigation.navigate('Agent', { agentId: agent.id });
  };

  const renderItem = ({ item }: { item: AgentMetadata }) => (
    <AgentCardItem
      agent={item}
      onPress={() => handleAgentPress(item)}
      isDarkTheme={isDarkTheme}
    />
  );

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.sectionTitle,
          { color: isDarkTheme ? '#9ea6ae' : '#6e7a85' },
        ]}
      >
        Agents
      </Text>
      <FlatList
        data={AGENTS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        scrollEnabled={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  listContainer: {
    gap: 12,
  },
  row: {
    gap: 12,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    minHeight: 120,
  },
  icon: {
    fontSize: 28,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
});
