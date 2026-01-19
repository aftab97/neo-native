import React, { useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useLayoutStore, useChatStore, useSessionStore, useFileStore } from "../store";
import { useMutateChatPrompt, useGetUser } from "../api";
import {
  WelcomeSection,
  AgentCards,
  PromptSuggestions,
  ChatInput,
} from "../components";
import { useResetChat } from "../hooks";
import { createSessionId } from "../utils/parseStream";
import type { HomeScreenProps } from "../navigation/types";

export const HomeScreen: React.FC<HomeScreenProps> = () => {
  const navigation = useNavigation();
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const { setInputValue } = useChatStore();
  const { currentSessionId, setCurrentSessionId } = useSessionStore();
  const files = useFileStore((state) => state.files);
  const { data: user } = useGetUser();
  const chatMutation = useMutateChatPrompt();
  const { resetForHomepage } = useResetChat();

  const backgroundColor = isDarkTheme ? "#17191f" : "#eceef0";

  // Reset chat state when homepage is focused (navigating back or new chat)
  // But only if there are no pending file uploads
  useFocusEffect(
    useCallback(() => {
      // Don't reset if user has files attached (they may have uploaded before typing)
      if (files.length === 0) {
        resetForHomepage();
      }
    }, [resetForHomepage, files.length])
  );

  const handleSend = (message: string) => {
    // Use existing session ID (from file uploads) or create a new one
    const sessionId = currentSessionId || createSessionId();

    // Store session ID so ChatScreen can use it for subsequent messages
    // (e.g., adaptive card button clicks)
    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }

    // Navigate IMMEDIATELY to ChatScreen to see real-time streaming
    // Don't pass sessionId - homepage uses ['chat'] cache key, not session-based
    navigation.navigate("Chat", {});

    // Start the mutation - this writes to ['chat'] cache key
    chatMutation.mutate({
      question: message,
      sessionId,
      userEmail: user?.email || "anonymous@example.com",
    });
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputValue(suggestion);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
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
        placeholder="Ask Neo..."
        isLoading={chatMutation.isPending}
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
