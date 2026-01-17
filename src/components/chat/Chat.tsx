import React, { useRef, useEffect } from 'react';
import { FlatList, View, StyleSheet, ListRenderItem } from 'react-native';
import { useLayoutStore } from '../../store';
import { ChatMessage } from '../../types/chat';
import { UserBlock } from './UserBlock';
import { AIBlock } from './AIBlock';

interface ChatProps {
  messages: ChatMessage[];
  onCardSubmit?: (data: any) => void;
}

export const Chat: React.FC<ChatProps> = ({ messages, onCardSubmit }) => {
  const flatListRef = useRef<FlatList>(null);
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, messages[messages.length - 1]?.message]);

  const renderMessage: ListRenderItem<ChatMessage> = ({ item }) => {
    if (item.role === 'user') {
      return <UserBlock message={item} />;
    }
    // Render both 'ai' and 'live_chat_agent' messages using AIBlock
    return (
      <AIBlock
        message={item}
        onCardSubmit={onCardSubmit}
        isLiveChatAgent={item.role === 'live_chat_agent'}
      />
    );
  };

  const keyExtractor = (item: ChatMessage, index: number) =>
    item.message_id || `message-${index}`;

  // Sort messages by order if available
  const sortedMessages = [...messages].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return 0;
  });

  return (
    <FlatList
      ref={flatListRef}
      data={sortedMessages}
      renderItem={renderMessage}
      keyExtractor={keyExtractor}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10,
      }}
      ListFooterComponent={<View style={styles.footer} />}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
  },
  footer: {
    height: 20,
  },
});
