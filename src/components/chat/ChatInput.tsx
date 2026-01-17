import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayoutStore, useChatStore, useRequestStore } from '../../store';

interface ChatInputProps {
  onSend: (message: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  /** External loading state (e.g., from mutation.isPending) */
  isLoading?: boolean;
  /** True when live chat WebSocket is active */
  isLiveChatActive?: boolean;
  /** Called instead of onSend when live chat is active */
  onLiveChatSend?: (message: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onCancel,
  placeholder = 'Ask Neo...',
  isLoading = false,
  isLiveChatActive = false,
  onLiveChatSend,
}) => {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const { abortController } = useRequestStore();

  // Use store's inputValue only for initial/external values (e.g., suggestions)
  const storeInputValue = useChatStore((state) => state.inputValue);
  const setStoreInputValue = useChatStore((state) => state.setInputValue);

  // Local state for the actual input - more reliable than global store
  const [localValue, setLocalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Sync from store when it changes externally (e.g., suggestion clicked)
  useEffect(() => {
    if (storeInputValue && storeInputValue !== localValue) {
      setLocalValue(storeInputValue);
      // Clear the store value after syncing
      setStoreInputValue('');
    }
  }, [storeInputValue]);

  const backgroundColor = isDarkTheme ? '#21232c' : '#ffffff';
  const textColor = isDarkTheme ? '#ffffff' : '#21232c';
  const placeholderColor = isDarkTheme ? '#6e7a85' : '#9ea6ae';
  const borderColor = isFocused
    ? '#0158ab'
    : isDarkTheme
    ? '#3a424a'
    : '#e0e3e6';
  const accentColor = '#0158ab';

  const hasText = localValue.trim().length > 0;
  const canSend = hasText && !isLoading;
  const isGenerating = isLoading && abortController;

  const handleSend = () => {
    const message = localValue.trim();
    if (message && !isLoading) {
      // Route to live chat if active, otherwise use normal send
      if (isLiveChatActive && onLiveChatSend) {
        onLiveChatSend(message);
      } else {
        onSend(message);
      }
      setLocalValue(''); // Clear immediately
      Keyboard.dismiss();
    }
  };

  // Use different placeholder when live chat is active
  const effectivePlaceholder = isLiveChatActive
    ? 'Message live agent...'
    : placeholder;

  const handleCancel = () => {
    onCancel?.();
  };

  const handleChangeText = (text: string) => {
    setLocalValue(text);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 8), backgroundColor },
      ]}
    >
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDarkTheme ? '#3a424a' : '#f4f5f6',
            borderColor,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: textColor }]}
          placeholder={effectivePlaceholder}
          placeholderTextColor={placeholderColor}
          value={localValue}
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSend}
          multiline
          maxLength={10000}
          editable={!isLoading}
          returnKeyType="send"
          blurOnSubmit={false}
          accessibilityLabel="Chat input"
          accessibilityHint="Type your message here"
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: isGenerating
                ? '#ef4444'
                : canSend
                ? accentColor
                : isDarkTheme
                ? '#4b555e'
                : '#e0e3e6',
            },
          ]}
          onPress={isGenerating ? handleCancel : handleSend}
          disabled={!canSend && !isGenerating}
          activeOpacity={0.7}
          accessibilityLabel={isGenerating ? 'Stop generating' : 'Send message'}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonIcon, { color: canSend || isGenerating ? '#ffffff' : placeholderColor }]}>
            {isGenerating ? '■' : '➤'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    borderWidth: 2,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 48,
    maxHeight: 150,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    maxHeight: 120,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  buttonIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
});
