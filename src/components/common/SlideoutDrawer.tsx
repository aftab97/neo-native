import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import { useLayoutStore } from '../../store';
import { colors } from '../../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SlideoutDrawerProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Height of the drawer when collapsed. Defaults to 340 */
  defaultHeight?: number;
  /** Maximum height as a percentage of screen (0-1). Defaults to 0.8 (80%) */
  maxHeightPercent?: number;
  /** Whether the drawer can be expanded by dragging. Defaults to true */
  expandable?: boolean;
  /** Whether to show the handle bar. Defaults to true */
  showHandle?: boolean;
}

/**
 * Reusable slideout drawer component with consistent styling and animation.
 * Used by AttachmentSlideout, SourcesPills, and other bottom sheet components.
 */
export const SlideoutDrawer: React.FC<SlideoutDrawerProps> = ({
  visible,
  onClose,
  children,
  defaultHeight = 340,
  maxHeightPercent = 0.8,
  expandable = true,
  showHandle = true,
}) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  // Calculate heights
  const MAX_HEIGHT = SCREEN_HEIGHT * maxHeightPercent;
  const DEFAULT_HEIGHT = Math.min(defaultHeight, MAX_HEIGHT);
  const EXPAND_DISTANCE = MAX_HEIGHT - DEFAULT_HEIGHT;
  const SNAP_THRESHOLD = 80;

  // Animation state
  const [slideAnim] = useState(new Animated.Value(0));
  const [isExpanded, setIsExpanded] = useState(false);
  const expandY = useRef(new Animated.Value(EXPAND_DISTANCE)).current;
  const basePosition = useRef(EXPAND_DISTANCE);

  // Theme colors
  const backgroundColor = isDarkTheme ? colors.gray['900'] : colors.gray['000'];
  const borderColor = isDarkTheme ? colors.gray['700'] : colors.gray['200'];

  // Handle open/close animations
  useEffect(() => {
    if (visible) {
      // Reset to collapsed state when opening
      expandY.setOffset(0);
      expandY.setValue(EXPAND_DISTANCE);
      basePosition.current = EXPAND_DISTANCE;
      setIsExpanded(false);

      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Handle pan gesture for dragging the drawer
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: expandY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (!expandable) return;

    const { state } = event.nativeEvent;

    if (state === State.BEGAN) {
      expandY.setOffset(basePosition.current);
      expandY.setValue(0);
    }

    if (state === State.END || state === State.CANCELLED) {
      const { translationY: dragY, velocityY } = event.nativeEvent;

      expandY.flattenOffset();

      const isDraggingDown = dragY > SNAP_THRESHOLD || velocityY > 500;
      const isDraggingUp = dragY < -SNAP_THRESHOLD || velocityY < -500;

      // If at default position and dragging down → close
      if (isDraggingDown && !isExpanded) {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          onClose();
        });
        return;
      }

      let targetValue: number;
      if (isDraggingUp) {
        targetValue = 0;
      } else if (isDraggingDown && isExpanded) {
        targetValue = EXPAND_DISTANCE;
      } else {
        const currentPosition = Math.max(0, Math.min(EXPAND_DISTANCE, basePosition.current + dragY));
        targetValue = currentPosition < EXPAND_DISTANCE / 2 ? 0 : EXPAND_DISTANCE;
      }

      basePosition.current = targetValue;
      setIsExpanded(targetValue === 0);

      Animated.spring(expandY, {
        toValue: targetValue,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    }
  };

  if (!visible) return null;

  // Slide animation
  const slideTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [MAX_HEIGHT, 0],
  });

  // Combine slide animation with expand position
  const combinedTranslateY = expandable
    ? Animated.add(
        slideTranslateY,
        expandY.interpolate({
          inputRange: [0, EXPAND_DISTANCE],
          outputRange: [0, EXPAND_DISTANCE],
          extrapolate: 'clamp',
        })
      )
    : slideTranslateY;

  const drawerContent = (
    <Animated.View
      style={[
        styles.drawer,
        {
          backgroundColor,
          borderTopColor: borderColor,
          height: MAX_HEIGHT,
          transform: [{ translateY: combinedTranslateY }],
        },
      ]}
    >
      {showHandle && (
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: borderColor }]} />
        </View>
      )}
      {children}
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          {expandable ? (
            <PanGestureHandler
              onGestureEvent={onGestureEvent}
              onHandlerStateChange={onHandlerStateChange}
              activeOffsetY={[-10, 10]}
            >
              {drawerContent}
            </PanGestureHandler>
          ) : (
            drawerContent
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  drawer: {
    borderTopWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
});
