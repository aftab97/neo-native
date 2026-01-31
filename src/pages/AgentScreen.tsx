import React, { useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useLayoutStore, useAgentStore, useChatStore, useSessionStore } from '../store';
import { useMutateChatPrompt, useChatHistory, useGetUser } from '../api';
import { AgentStartScreen } from '../ui/components/agents';
import { Chat, ChatInput } from '../ui/components/chat';
import { Loader } from '../ui/components/loader/loader';
import { getAgentById } from '../ui/components/agents/agents';
import { createSessionId } from '../tools/parseStream';
import type { AgentScreenProps } from '../routes/types';

export const AgentScreen: React.FC<AgentScreenProps> = () => {
  const route = useRoute<AgentScreenProps['route']>();
  const navigation = useNavigation();
  const { agentId } = route.params;

  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const { setSelectedAgent } = useAgentStore();
  const { setInputValue } = useChatStore();
  const { currentSessionId, setCurrentSessionId } = useSessionStore();
  const { data: user } = useGetUser();

  // Get agent metadata
  const agent = getAgentById(agentId);

  // Get chat history for this agent
  const { data: messages = [] } = useChatHistory(agentId);

  const chatMutation = useMutateChatPrompt();

  const backgroundColor = isDarkTheme ? '#17191f' : '#eceef0';

  // Set selected agent on mount
  useEffect(() => {
    setSelectedAgent(agentId);

    // Update navigation title
    navigation.setOptions({
      title: agent?.title || 'Agent',
    });
  }, [agentId, agent?.title]);

  const handleSend = (message: string) => {
    // Use existing session ID (from file uploads) or create a new one
    const sessionId = currentSessionId || createSessionId();

    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }

    chatMutation.mutate({
      question: message,
      sessionId,
      agent: agentId,
      userEmail: user?.email || 'anonymous@example.com',
      isPromptFromAgentPage: true,
    });
  };

  const handleSuggestionPress = (prompt: string) => {
    setInputValue(prompt);
  };

  // Show agent start screen if no messages
  const showStartScreen = messages.length === 0;

  if (!agent) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Loader text="Agent not found" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {showStartScreen ? (
        <AgentStartScreen
          agent={agent}
          onSuggestionPress={handleSuggestionPress}
        />
      ) : (
        <Chat messages={messages} />
      )}

      <ChatInput
        onSend={handleSend}
        placeholder={`Ask ${agent.title}...`}
        isLoading={chatMutation.isPending}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
