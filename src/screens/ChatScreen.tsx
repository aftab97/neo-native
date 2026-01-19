import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useQueryClient, useQuery } from '@tanstack/react-query';
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
import { createSessionId, createMessageId } from '../utils/parseStream';
import { useLiveChatListener } from '../hooks';
import { ChatMessage } from '../types/chat';
import type { ChatScreenProps } from '../navigation/types';

export const ChatScreen: React.FC<ChatScreenProps> = () => {
  const route = useRoute<ChatScreenProps['route']>();
  const { sessionId: routeSessionId, agent: routeAgent } = route.params || {};

  const queryClient = useQueryClient();
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const { selectedAgent, setSelectedAgent } = useAgentStore();
  const { currentSessionId, setCurrentSessionId } = useSessionStore();
  const { data: user } = useGetUser();

  // Get the effective session ID for live chat
  const activeSessionForLiveChat = routeSessionId || currentSessionId;

  // Determine which session/agent we're viewing
  // IMPORTANT: Only use selectedAgent if we have a routeAgent context
  // When coming from homepage (no route params), always use general ['chat'] cache
  const hasRouteContext = routeAgent !== undefined || routeSessionId !== undefined;
  const activeAgent = hasRouteContext ? (routeAgent || selectedAgent) : selectedAgent;
  const activeSessionId = routeSessionId || currentSessionId;

  // Determine if we should use general chat (homepage flow) vs agent-specific chat
  // When no route params, use general ['chat'] cache regardless of selectedAgent
  const useGeneralChat = !hasRouteContext;

  // Get chat data based on context
  const { data: agentChat = [] } = useChatHistory(
    useGeneralChat ? undefined : (activeAgent || undefined)
  );
  const { data: sessionChat = [] } = useChatBySessionId(routeSessionId);

  // Mutations
  const chatMutation = useMutateChatPrompt();
  const historyMutation = useMutateChatHistory();
  const cancelMutation = useCancelChatPrompt();

  // Compute the chat cache key for live chat message routing
  const liveChatKey = routeSessionId
    ? queryKeys.chatById(routeSessionId)
    : useGeneralChat
    ? queryKeys.chat()
    : queryKeys.chat(activeAgent || undefined);

  // Live chat - watches for triggers and auto-connects
  const liveChat = useLiveChatListener(activeSessionForLiveChat || null, liveChatKey);

  // Watch connection state via query cache for reactive updates
  // This query gets invalidated when connection state changes, triggering re-renders
  const { data: connectionState } = useQuery<{ connected: boolean; reason?: string }>({
    queryKey: ['liveChatConnection', activeSessionForLiveChat || 'none'],
    queryFn: () => {
      const cached = queryClient.getQueryData<{ connected: boolean }>(['liveChatConnection', activeSessionForLiveChat]);
      return cached || { connected: false };
    },
    enabled: !!activeSessionForLiveChat,
    staleTime: 0,
  });

  // Use the cache state as source of truth (it gets updated on socket events)
  const isLiveChatActive = connectionState?.connected === true;

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
      agent: useGeneralChat ? undefined : (activeAgent || undefined),
      userEmail: user?.email || 'anonymous@example.com',
      // Cache key flags - matches web app logic
      isPromptFromChatPage: !!routeSessionId, // Viewing a history chat
      isPromptFromAgentPage: !useGeneralChat && !!activeAgent && !routeSessionId, // On agent page (not homepage)
    });
  };

  const handleCancel = () => {
    if (activeSessionId) {
      // Use same cache key logic as messages
      const chatKey = routeSessionId
        ? queryKeys.chatById(routeSessionId)
        : (!useGeneralChat && activeAgent)
        ? queryKeys.chat(activeAgent)
        : queryKeys.chat();

      cancelMutation.mutate({
        sessionId: activeSessionId,
        chatKey,
      });
    }
  };

  // Handle live chat message send (via WebSocket)
  const handleLiveChatSend = useCallback(
    (message: string) => {
      if (!isLiveChatActive || !activeSessionForLiveChat) {
        console.warn('[livechat] Cannot send - not connected');
        return;
      }

      // Add user message to cache optimistically
      const chatKey = routeSessionId
        ? queryKeys.chatById(routeSessionId)
        : useGeneralChat
        ? queryKeys.chat()
        : queryKeys.chat(activeAgent || undefined);

      const existing = queryClient.getQueryData<ChatMessage[]>(chatKey) ?? [];
      const maxOrder = existing.reduce(
        (max, msg) => (msg.order !== undefined ? Math.max(max, msg.order) : max),
        -1
      );

      queryClient.setQueryData<ChatMessage[]>(chatKey, [
        ...existing,
        {
          role: 'user',
          message,
          message_id: createMessageId('user'),
          session_id: activeSessionForLiveChat,
          order: maxOrder + 1,
        },
      ]);

      // Send via WebSocket
      liveChat.sendMessage(message);
    },
    [
      isLiveChatActive,
      activeSessionForLiveChat,
      routeSessionId,
      useGeneralChat,
      activeAgent,
      queryClient,
      liveChat,
    ]
  );

  // Handle adaptive card button submit actions
  const handleCardSubmit = (data: any) => {
    // Use existing session or create new one
    const sessionId = activeSessionId || createSessionId();

    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }

    // Send the action data as a JSON string to the action agent
    // isJson: true ensures the user message is not shown in the chat UI
    // cacheAgent ensures response goes to the cache being viewed (not 'action' cache)
    // When useGeneralChat is true (homepage flow), cacheAgent should be undefined to use ['chat']
    chatMutation.mutate({
      question: JSON.stringify(data),
      sessionId,
      agent: 'action', // Route to action agent backend
      cacheAgent: useGeneralChat ? undefined : (activeAgent || undefined), // Write to the cache being viewed
      userEmail: user?.email || 'anonymous@example.com',
      // Use same cache key flags as regular messages to keep responses in same view
      isPromptFromChatPage: !!routeSessionId,
      isPromptFromAgentPage: !useGeneralChat && !!activeAgent && !routeSessionId, // Not homepage flow
      isJson: true, // Skip showing user message for adaptive card submissions
    });
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <Chat messages={messages} onCardSubmit={handleCardSubmit} />

      <ChatInput
        onSend={handleSend}
        onCancel={handleCancel}
        placeholder={activeAgent ? `Ask ${activeAgent}...` : 'Ask Neo...'}
        isLoading={chatMutation.isPending}
        isLiveChatActive={isLiveChatActive}
        onLiveChatSend={handleLiveChatSend}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
