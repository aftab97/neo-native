import React, { useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useLayoutStore, useAgentStore, useSessionStore } from '../store';
import {
  useChatHistory,
  useChatBySessionId,
  useMutateChatPrompt,
  useMutateChatHistory,
  useCancelChatPrompt,
  useGetUser,
  queryKeys,
} from '../api';
import { Chat, ChatInput, Loader } from '../components';
import { createSessionId } from '../utils/parseStream';
import type { ChatScreenProps } from '../navigation/types';

export const ChatScreen: React.FC<ChatScreenProps> = () => {
  const route = useRoute<ChatScreenProps['route']>();
  const { sessionId: routeSessionId, agent: routeAgent } = route.params || {};

  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const { selectedAgent, setSelectedAgent } = useAgentStore();
  const { currentSessionId, setCurrentSessionId } = useSessionStore();
  const { data: user } = useGetUser();

  // Determine which session/agent we're viewing
  const activeAgent = routeAgent || selectedAgent;
  const activeSessionId = routeSessionId || currentSessionId;

  // Get chat data based on context
  const { data: agentChat = [] } = useChatHistory(activeAgent || undefined);
  const { data: sessionChat = [] } = useChatBySessionId(routeSessionId);

  // Mutations
  const chatMutation = useMutateChatPrompt();
  const historyMutation = useMutateChatHistory();
  const cancelMutation = useCancelChatPrompt();

  // Load history if we have a session ID from route
  useEffect(() => {
    if (routeSessionId && user?.email) {
      historyMutation.mutate({
        sessionId: routeSessionId,
        userEmail: user.email,
      });
    }
  }, [routeSessionId, user?.email]);

  // Set agent if from route
  useEffect(() => {
    if (routeAgent) {
      setSelectedAgent(routeAgent);
    }
  }, [routeAgent]);

  // Determine which messages to show
  const messages = routeSessionId ? sessionChat : agentChat;

  const backgroundColor = isDarkTheme ? '#17191f' : '#eceef0';

  const handleSend = (message: string) => {
    // Use existing session or create new one
    const sessionId = activeSessionId || createSessionId();

    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }

    chatMutation.mutate({
      question: message,
      sessionId,
      agent: activeAgent || undefined,
      userEmail: user?.email || 'anonymous@example.com',
    });
  };

  const handleCancel = () => {
    if (activeSessionId) {
      const chatKey = activeAgent
        ? queryKeys.chat(activeAgent)
        : queryKeys.chat();

      cancelMutation.mutate({
        sessionId: activeSessionId,
        chatKey,
      });
    }
  };

  // Show loader while loading history
  if (routeSessionId && historyMutation.isPending) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Loader text="Loading conversation..." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <Chat messages={messages} />

      <ChatInput
        onSend={handleSend}
        onCancel={handleCancel}
        placeholder={activeAgent ? `Ask ${activeAgent}...` : 'Ask Neo...'}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
