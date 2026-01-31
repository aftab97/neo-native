import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLayoutStore } from '../../../store';
import { AgentCardConfig } from './types';

interface AgentCardProps {
  config: AgentCardConfig;
  onPress: () => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ config, onPress }) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  const backgroundColor = isDarkTheme ? '#21232c' : '#ffffff';
  const textColor = isDarkTheme ? '#ffffff' : '#21232c';
  const secondaryTextColor = isDarkTheme ? '#9ea6ae' : '#6e7a85';
  const borderColor = isDarkTheme ? '#3a424a' : '#e0e3e6';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor, borderColor }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${config.title} suggestion`}
    >
      <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
        {config.title}
      </Text>
      {config.items && config.items.length > 0 && (
        <View style={styles.itemsContainer}>
          {config.items.slice(0, 2).map((item) => (
            <Text
              key={item.id}
              style={[styles.itemText, { color: secondaryTextColor }]}
              numberOfLines={2}
            >
              {item.text}
            </Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  title: {
    fontSize: 16, // text-md (1rem / 16px) to match web
    fontWeight: '400', // font-normal to match web
    marginBottom: 8,
  },
  itemsContainer: {
    gap: 4,
  },
  itemText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
