import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayoutStore, useChatStore, useRequestStore } from '../../store';

// Icon placeholders
const SendIcon = ({ color }: { color: string }) => (
  <TextInput
    editable={false}
    style={{ fontSize: 20, color, textAlign: 'center' }}
    value="➤"
  />
);

const StopIcon = ({ color }: { color: string }) => (
  <TextInput
    editable={false}
    style={{ fontSize: 20, color, textAlign: 'center' }}
    value="■"
  />
);

interface ChatInputProps {
  onSend: (message: string) => void;
  onCancel?: () => void;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onCancel,
  placeholder = 'Ask Neo...',
}) => {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const { inputValue, setInputValue, isPromptPaused } = useChatStore();
  const { abortController } = useRequestStore();

  const [isFocused, setIsFocused] = useState(false);

  const backgroundColor = isDarkTheme ? '#21232c' : '#ffffff';
  const textColor = isDarkTheme ? '#ffffff' : '#21232c';
  const placeholderColor = isDarkTheme ? '#6e7a85' : '#9ea6ae';
  const borderColor = isFocused
    ? '#0158ab'
    : isDarkTheme
    ? '#3a424a'
    : '#e0e3e6';
  const accentColor = '#0158ab';

  const canSend = inputValue.trim().length > 0 && !isPromptPaused;
  const isGenerating = isPromptPaused && abortController;

  const handleSend = () => {
    if (canSend) {
      onSend(inputValue.trim());
      Keyboard.dismiss();
    }
  };

  const handleCancel = () => {
    onCancel?.();
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
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          value={inputValue}
          onChangeText={setInputValue}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSend}
          multiline
          maxLength={10000}
          editable={!isPromptPaused}
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
          accessibilityLabel={isGenerating ? 'Stop generating' : 'Send message'}
          accessibilityRole="button"
        >
          {isGenerating ? (
            <StopIcon color="#ffffff" />
          ) : (
            <SendIcon color={canSend ? '#ffffff' : placeholderColor} />
          )}
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
});
