import React, { useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useLayoutStore, useChatStore, useSessionStore } from "../store";
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
  const { setCurrentSessionId } = useSessionStore();
  const { data: user } = useGetUser();
  const chatMutation = useMutateChatPrompt();
  const { resetForHomepage } = useResetChat();

  const backgroundColor = isDarkTheme ? "#17191f" : "#eceef0";

  // Reset chat state when homepage is focused (navigating back or new chat)
  useFocusEffect(
    useCallback(() => {
      resetForHomepage();
    }, [resetForHomepage])
  );

  const handleSend = (message: string) => {
    const sessionId = createSessionId();

    // Store session ID so ChatScreen can use it for subsequent messages
    // (e.g., adaptive card button clicks)
    setCurrentSessionId(sessionId);

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
        placeholder="Ask Neo anything..."
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
