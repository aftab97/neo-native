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
import { t } from 'ttag';
import { useLayoutStore, useChatStore, useRequestStore, useFileStore } from '../../store';
import { PlusIcon } from '../icons';
import { AttachmentSlideout } from './AttachmentSlideout';
import { AttachmentPreview } from './AttachmentPreview';

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
  placeholder = t`Ask Neo`,
  isLoading = false,
  isLiveChatActive = false,
  onLiveChatSend,
}) => {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const isFeedbackInputFocused = useLayoutStore((state) => state.isFeedbackInputFocused);
  const { abortController } = useRequestStore();
  const files = useFileStore((state) => state.files);

  // Use store's inputValue only for initial/external values (e.g., suggestions)
  const storeInputValue = useChatStore((state) => state.inputValue);
  const setStoreInputValue = useChatStore((state) => state.setInputValue);

  // Local state for the actual input - more reliable than global store
  const [localValue, setLocalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showAttachmentSlideout, setShowAttachmentSlideout] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Track keyboard visibility to adjust bottom padding
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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
  const inputBgColor = isDarkTheme ? '#3a424a' : '#f4f5f6';

  const hasText = localValue.trim().length > 0;
  const hasFiles = files.length > 0;
  const filesLoading = files.some(file => file.loading);
  const canSend = (hasText || hasFiles) && !isLoading && !filesLoading;
  const isGenerating = isLoading && abortController;

  const handleSend = () => {
    const message = localValue.trim();
    if ((message || hasFiles) && !isLoading && !filesLoading) {
      // Route to live chat if active, otherwise use normal send
      if (isLiveChatActive && onLiveChatSend) {
        onLiveChatSend(message);
      } else {
        onSend(message);
      }
      setLocalValue(''); // Clear immediately
      // NOTE: Don't clear files here - chat.ts clears them in onSuccess after the mutation completes
      // The mutation needs the files to extract gcs_uris for the request
      Keyboard.dismiss();
    }
  };

  // Use different placeholder when live chat is active
  const effectivePlaceholder = isLiveChatActive
    ? t`Ask our Live Agent`
    : placeholder;

  const handleCancel = () => {
    onCancel?.();
  };

  const handleChangeText = (text: string) => {
    setLocalValue(text);
  };

  const toggleAttachmentSlideout = () => {
    setShowAttachmentSlideout(!showAttachmentSlideout);
    if (!showAttachmentSlideout) {
      Keyboard.dismiss();
    }
  };

  // Only apply safe area inset when keyboard is hidden
  const bottomPadding = keyboardVisible ? 8 : Math.max(insets.bottom, 8);

  // Hide ChatInput when feedback input is focused to avoid confusion
  if (isFeedbackInputFocused) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: bottomPadding, backgroundColor },
      ]}
    >
      {/* Attachment Preview */}
      {hasFiles && <AttachmentPreview />}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: inputBgColor,
            borderColor,
          },
        ]}
      >
        {/* Plus Button */}
        <TouchableOpacity
          style={styles.plusButton}
          onPress={toggleAttachmentSlideout}
          accessibilityLabel="Add attachment"
          accessibilityRole="button"
        >
          <PlusIcon size={22} color={isDarkTheme ? '#9ea6ae' : '#646b82'} />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={[styles.input, { color: textColor }]}
          placeholder={effectivePlaceholder}
          placeholderTextColor={placeholderColor}
          value={localValue}
          onChangeText={handleChangeText}
          onFocus={() => {
            setIsFocused(true);
            setShowAttachmentSlideout(false);
          }}
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

      {/* Attachment Slideout - uses shared SlideoutDrawer component */}
      <AttachmentSlideout
        visible={showAttachmentSlideout}
        onClose={() => setShowAttachmentSlideout(false)}
        isLiveChatActive={isLiveChatActive}
      />
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
    paddingLeft: 6,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 48,
    maxHeight: 150,
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    paddingHorizontal: 8,
    maxHeight: 120,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
});
