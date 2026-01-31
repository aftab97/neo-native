import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  ListRenderItem,
  Keyboard,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
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
  const setChatListScrollCallback = useLayoutStore((state) => state.setChatListScrollCallback);
  const setChatListScrollToEndCallback = useLayoutStore((state) => state.setChatListScrollToEndCallback);
  const setChatListMetrics = useLayoutStore((state) => state.setChatListMetrics);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const contentHeightRef = useRef(0);
  const scrollYRef = useRef(0);

  // Track keyboard visibility
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Scroll to offset callback for feedback component
  const scrollToOffset = useCallback((offset: number) => {
    flatListRef.current?.scrollToOffset({ offset, animated: true });
  }, []);

  // Scroll to end callback
  const scrollToEnd = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  // Register scroll callbacks on mount
  useEffect(() => {
    setChatListScrollCallback(scrollToOffset);
    setChatListScrollToEndCallback(scrollToEnd);
    return () => {
      setChatListScrollCallback(null);
      setChatListScrollToEndCallback(null);
    };
  }, [scrollToOffset, scrollToEnd, setChatListScrollCallback, setChatListScrollToEndCallback]);

  // Track scroll position
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    scrollYRef.current = contentOffset.y;
    contentHeightRef.current = contentSize.height;
    setChatListMetrics(contentSize.height, contentOffset.y, layoutMeasurement.height);
  }, [setChatListMetrics]);

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

  // Footer height to create space for keyboard - just keyboard height is enough
  const footerHeight = keyboardHeight > 0 ? keyboardHeight : 20;

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
      onScroll={handleScroll}
      scrollEventThrottle={16}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10,
      }}
      ListFooterComponent={<View style={{ height: footerHeight }} />}
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
});
