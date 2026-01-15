import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useLayoutStore, useChatStore } from '../../store';

const SUGGESTIONS = [
  'What can Neo do?',
  'What is my project code?',
  'How do I apply for leave?',
  'Get guest wifi access',
];

interface PromptSuggestionsProps {
  onSuggestionPress?: (suggestion: string) => void;
}

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  onSuggestionPress,
}) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const { setInputValue } = useChatStore();

  const borderColor = isDarkTheme ? '#3a424a' : '#e0e3e6';
  const textColor = isDarkTheme ? '#ffffff' : '#21232c';
  const hoverBg = isDarkTheme ? '#21232c' : '#f4f5f6';

  const handlePress = (suggestion: string) => {
    setInputValue(suggestion);
    onSuggestionPress?.(suggestion);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {SUGGESTIONS.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.suggestionButton,
              { borderColor, backgroundColor: 'transparent' },
            ]}
            onPress={() => handlePress(suggestion)}
            activeOpacity={0.7}
            accessibilityLabel={`Suggestion: ${suggestion}`}
            accessibilityRole="button"
          >
            <Text style={[styles.suggestionText, { color: textColor }]}>
              {suggestion}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
  },
});
