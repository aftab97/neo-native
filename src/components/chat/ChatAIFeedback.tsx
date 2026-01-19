import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Clipboard,
  Keyboard,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayoutStore, usePopupStore } from '../../store';
import { useMutateSendFeedback } from '../../api';
import {
  CopyIcon,
  CheckIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  ThumbsUpFilledIcon,
  ThumbsDownFilledIcon,
  CloseIcon,
} from '../icons';
import { colors } from '../../theme/colors';

interface ChatAIFeedbackProps {
  message: string;
  sessionID?: string;
  messageID?: string;
  agent?: string;
}

const POSITIVE_FEEDBACK = [
  'Accurate answer',
  'Helpful answer',
  'Followed instructions',
  'Good sources',
];

const NEGATIVE_FEEDBACK = [
  'Answer generation delay',
  "Doesn't follow the prompt or conversation history",
  'Out of date information',
  'Wrong or missing source',
  'Inaccurate answer',
  "Doesn't follow instruction",
];

const OTHER_BTN_TEXT = 'Other';

const HEADER_CONTENT_HEIGHT = 56;

export const ChatAIFeedback: React.FC<ChatAIFeedbackProps> = ({
  message,
  sessionID,
  messageID,
  agent,
}) => {
  const insets = useSafeAreaInsets();
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const setFeedbackInputFocused = useLayoutStore((state) => state.setFeedbackInputFocused);
  const scrollChatListToEnd = useLayoutStore((state) => state.scrollChatListToEnd);
  const chatListScrollCallback = useLayoutStore((state) => state.chatListScrollCallback);
  const chatListScrollY = useLayoutStore((state) => state.chatListScrollY);
  const { addToast } = usePopupStore();

  // Header height for scroll calculations
  const headerHeight = insets.top + HEADER_CONTENT_HEIGHT;
  const sendFeedback = useMutateSendFeedback();
  const textInputRef = useRef<TextInput>(null);
  const extraDetailsRef = useRef<View>(null);
  const feedbackPanelRef = useRef<View>(null);
  const showExtraDetailsRef = useRef(false);

  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative'>('positive');
  const [disableThumbsUp, setDisableThumbsUp] = useState(false);
  const [disableThumbsDown, setDisableThumbsDown] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showExtraDetails, setShowExtraDetails] = useState(false);
  const [selectedBtnText, setSelectedBtnText] = useState('');
  const [extraDetailsText, setExtraDetailsText] = useState('');
  const [copied, setCopied] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const iconColor = isDarkTheme ? colors.gray['400'] : colors.gray['500'];
  const textColor = isDarkTheme ? colors.gray['100'] : colors.gray['900'];
  const secondaryTextColor = isDarkTheme ? colors.gray['400'] : colors.gray['500'];
  const borderColor = isDarkTheme ? colors.gray['700'] : colors.gray['200'];
  const panelBg = isDarkTheme ? colors.gray['900'] : colors.gray['000'];
  const chipBg = isDarkTheme ? colors.gray['800'] : colors.gray['100'];
  const chipBorder = isDarkTheme ? colors.gray['700'] : colors.gray['300'];
  const chipSelectedBg = isDarkTheme ? colors.gray['700'] : colors.gray['200'];
  const inputBg = isDarkTheme ? colors.gray['900'] : colors.gray['000'];

  // Track keyboard height and scroll input into view when keyboard shows
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      const kbHeight = e.endCoordinates.height;
      setKeyboardHeight(kbHeight);

      // If extra details section is visible, measure and scroll to show input
      if (showExtraDetailsRef.current && extraDetailsRef.current && chatListScrollCallback) {
        setTimeout(() => {
          extraDetailsRef.current?.measureInWindow((x, y, width, height) => {
            const screenHeight = Dimensions.get('window').height;
            const inputBottom = y + height;
            const visibleBottom = screenHeight - kbHeight - 20; // 20px margin above keyboard
            const visibleTop = headerHeight + 20; // 20px margin below header

            // Check if input bottom is below visible area (hidden by keyboard)
            if (inputBottom > visibleBottom) {
              const scrollAmount = inputBottom - visibleBottom;
              const currentScrollY = useLayoutStore.getState().chatListScrollY;
              chatListScrollCallback(currentScrollY + scrollAmount);
            }
            // Check if input top is above visible area (hidden by header)
            else if (y < visibleTop) {
              const scrollAmount = y - visibleTop;
              const currentScrollY = useLayoutStore.getState().chatListScrollY;
              chatListScrollCallback(Math.max(0, currentScrollY + scrollAmount));
            }
          });
        }, 100);
      }
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [chatListScrollCallback, headerHeight]);

  // Cleanup focus state when component unmounts
  useEffect(() => {
    return () => {
      setFeedbackInputFocused(false);
    };
  }, [setFeedbackInputFocused]);

  // Reset focus state when feedback panel closes
  useEffect(() => {
    if (!showFeedback || !showExtraDetails) {
      setFeedbackInputFocused(false);
    }
  }, [showFeedback, showExtraDetails, setFeedbackInputFocused]);

  // Scroll to show feedback panel when it opens
  const scrollToShowPanel = useCallback(() => {
    // Small delay to let the layout settle, then measure and scroll
    setTimeout(() => {
      feedbackPanelRef.current?.measureInWindow((x, y, width, height) => {
        if (!chatListScrollCallback) return;

        const screenHeight = Dimensions.get('window').height;
        const panelBottom = y + height;
        const visibleBottom = screenHeight - 100; // Leave room for input bar
        const visibleTop = headerHeight + 20;

        // Check if panel bottom is below visible area
        if (panelBottom > visibleBottom) {
          const scrollAmount = panelBottom - visibleBottom;
          const currentScrollY = useLayoutStore.getState().chatListScrollY;
          chatListScrollCallback(currentScrollY + scrollAmount);
        }
        // Check if panel top is above visible area
        else if (y < visibleTop) {
          const scrollAmount = y - visibleTop;
          const currentScrollY = useLayoutStore.getState().chatListScrollY;
          chatListScrollCallback(Math.max(0, currentScrollY + scrollAmount));
        }
      });
    }, 100);
  }, [chatListScrollCallback, headerHeight]);

  const resetFields = () => {
    showExtraDetailsRef.current = false;
    setShowExtraDetails(false);
    setExtraDetailsText('');
    setSelectedBtnText('');
    setFeedbackInputFocused(false);
  };

  const handleCopy = useCallback(() => {
    if (message) {
      Clipboard.setString(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [message]);

  const handleFeedback = (feedback: 'positive' | 'negative') => {
    if (showFeedback && feedbackType !== feedback) {
      setFeedbackType(feedback);
    } else {
      const willShow = !showFeedback;
      setShowFeedback(willShow);
      setFeedbackType(feedback);
      // Scrolling is now handled by onLayout of the panel
    }
    resetFields();
  };

  // Handle panel layout - scroll into view after panel has rendered
  const handlePanelLayout = useCallback(() => {
    scrollToShowPanel();
  }, [scrollToShowPanel]);

  const handleCancel = () => {
    Keyboard.dismiss();
    resetFields();
    setShowFeedback(false);
  };

  const handleOtherButtonClick = () => {
    setSelectedBtnText(OTHER_BTN_TEXT);
    const newValue = !showExtraDetails;
    showExtraDetailsRef.current = newValue;
    setShowExtraDetails(newValue);
    // Scrolling is handled by onLayout of the extra details container
  };

  // Handle extra details layout - scroll into view after it has rendered
  const handleExtraDetailsLayout = useCallback(() => {
    scrollToShowPanel();
  }, [scrollToShowPanel]);

  const handleSendFeedback = useCallback((btnText?: string) => {
    if (feedbackType === 'negative') {
      setDisableThumbsDown(true);
      setDisableThumbsUp(true);
    }
    if (feedbackType === 'positive') {
      setDisableThumbsUp(true);
      setDisableThumbsDown(true);
    }

    const feedbackMsg = extraDetailsText || '';
    const selectedButtonText = btnText || selectedBtnText || OTHER_BTN_TEXT;

    sendFeedback.mutate({
      session_id: sessionID,
      message_id: messageID,
      feedback: feedbackType,
      feedback_msg: feedbackMsg,
    });

    showExtraDetailsRef.current = true;
    setShowExtraDetails(true);
    setSelectedBtnText(selectedButtonText);
  }, [feedbackType, extraDetailsText, selectedBtnText, sessionID, messageID, sendFeedback]);

  const onClickSend = () => {
    Keyboard.dismiss();
    handleSendFeedback();
    setShowFeedback(false);
    setFeedbackInputFocused(false);
  };

  const handleInputFocus = () => {
    setFeedbackInputFocused(true);
    // Scrolling is handled by keyboard show event listener
  };

  const handleInputBlur = () => {
    setFeedbackInputFocused(false);
  };

  const feedbackOptions = feedbackType === 'positive' ? POSITIVE_FEEDBACK : NEGATIVE_FEEDBACK;

  const getTitle = () => {
    if (selectedBtnText && selectedBtnText !== OTHER_BTN_TEXT) {
      return 'Thanks for your feedback! Help us improve by giving a few extra details.';
    }
    return feedbackType === 'positive'
      ? 'What did you like about the response?'
      : 'What went wrong - can you help understand?';
  };

  return (
    <View style={styles.container}>
      {/* Action buttons row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleCopy}
          accessibilityLabel={copied ? 'Copied' : 'Copy'}
        >
          {copied ? (
            <CheckIcon size={20} color={iconColor} />
          ) : (
            <CopyIcon size={20} color={iconColor} />
          )}
        </TouchableOpacity>

        {(!feedbackType || feedbackType === 'positive' || !disableThumbsUp) && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleFeedback('positive')}
            disabled={disableThumbsUp}
            accessibilityLabel="Good response"
          >
            {(showFeedback && feedbackType === 'positive') || disableThumbsUp ? (
              <ThumbsUpFilledIcon size={20} color={iconColor} />
            ) : (
              <ThumbsUpIcon size={20} color={iconColor} />
            )}
          </TouchableOpacity>
        )}

        {(!feedbackType || feedbackType === 'negative' || !disableThumbsDown) && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleFeedback('negative')}
            disabled={disableThumbsDown}
            accessibilityLabel="Bad response"
          >
            {(showFeedback && feedbackType === 'negative') || disableThumbsDown ? (
              <ThumbsDownFilledIcon size={20} color={iconColor} />
            ) : (
              <ThumbsDownIcon size={20} color={iconColor} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Feedback panel */}
      {showFeedback && (
        <View
          ref={feedbackPanelRef}
          onLayout={handlePanelLayout}
          style={[
            styles.feedbackPanel,
            {
              backgroundColor: panelBg,
              borderColor,
            },
          ]}
        >
          {/* Header with title and close button */}
          <View style={styles.feedbackHeader}>
            <Text style={[styles.feedbackTitle, { color: secondaryTextColor }]}>
              {getTitle()}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCancel}
              accessibilityLabel="Close"
            >
              <CloseIcon size={16} color={iconColor} />
            </TouchableOpacity>
          </View>

          {/* Feedback option chips */}
          {(!selectedBtnText || selectedBtnText === OTHER_BTN_TEXT) && (
            <View style={styles.chipsContainer}>
              {feedbackOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: chipBg,
                      borderColor: chipBorder,
                    },
                  ]}
                  onPress={() => handleSendFeedback(option)}
                >
                  <Text style={[styles.chipText, { color: textColor }]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.chip,
                  {
                    backgroundColor: selectedBtnText === OTHER_BTN_TEXT ? chipSelectedBg : chipBg,
                    borderColor: chipBorder,
                  },
                ]}
                onPress={handleOtherButtonClick}
              >
                <Text style={[styles.chipText, { color: textColor }]}>
                  {OTHER_BTN_TEXT}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Extra details input */}
          {showExtraDetails && (
            <View
              ref={extraDetailsRef}
              onLayout={handleExtraDetailsLayout}
              style={[
                styles.extraDetailsContainer,
                {
                  backgroundColor: inputBg,
                  borderColor,
                },
              ]}
            >
              <TextInput
                ref={textInputRef}
                style={[styles.textarea, { color: textColor }]}
                placeholder={
                  feedbackType === 'positive'
                    ? 'What worked well for you?'
                    : 'What could be improved?'
                }
                placeholderTextColor={secondaryTextColor}
                value={extraDetailsText}
                onChangeText={setExtraDetailsText}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                multiline
                autoFocus
              />
              <View style={styles.sendButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    {
                      backgroundColor: extraDetailsText.length
                        ? colors.blue['700']
                        : isDarkTheme
                        ? colors.gray['700']
                        : colors.gray['200'],
                    },
                  ]}
                  onPress={onClickSend}
                  disabled={!extraDetailsText.length}
                >
                  <Text
                    style={[
                      styles.sendButtonText,
                      {
                        color: extraDetailsText.length
                          ? '#ffffff'
                          : secondaryTextColor,
                      },
                    ]}
                  >
                    Send
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconButton: {
    padding: 8,
    borderRadius: 6,
  },
  feedbackPanel: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 16,
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  closeButton: {
    padding: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
  },
  extraDetailsContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  textarea: {
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  sendButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sendButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
