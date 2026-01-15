import React from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLayoutStore, useChatStore, useAgentStore } from '../store';
import { useMutateChatPrompt, useGetUser } from '../api';
import { WelcomeSection, AgentCards, PromptSuggestions, ChatInput } from '../components';
import { createSessionId } from '../utils/parseStream';
import type { HomeScreenProps } from '../navigation/types';

export const HomeScreen: React.FC<HomeScreenProps> = () => {
  const navigation = useNavigation();
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const { selectedAgent } = useAgentStore();
  const { setInputValue } = useChatStore();
  const { data: user } = useGetUser();
  const chatMutation = useMutateChatPrompt();

  const backgroundColor = isDarkTheme ? '#17191f' : '#eceef0';

  const handleSend = (message: string) => {
    const sessionId = createSessionId();

    chatMutation.mutate(
      {
        question: message,
        sessionId,
        agent: selectedAgent || undefined,
        userEmail: user?.email || 'anonymous@example.com',
      },
      {
        onSuccess: () => {
          navigation.navigate('Chat', { sessionId, agent: selectedAgent || undefined });
        },
      }
    );
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputValue(suggestion);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <WelcomeSection />
        <PromptSuggestions onSuggestionPress={handleSuggestionPress} />
        <AgentCards />
      </ScrollView>

      <ChatInput
        onSend={handleSend}
        placeholder="Ask Neo anything..."
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});
