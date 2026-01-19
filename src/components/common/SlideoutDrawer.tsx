import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
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
  /** Whether dragging down closes the drawer (without expand functionality). Defaults to false */
  dragToClose?: boolean;
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
  dragToClose = false,
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

  // Drag-to-close animation state
  const dragY = useRef(new Animated.Value(0)).current;

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

      // Reset drag-to-close state
      dragY.setValue(0);

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

  // Handle pan gesture for dragging the drawer (expandable mode)
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
      const { translationY: transY, velocityY } = event.nativeEvent;

      expandY.flattenOffset();

      const isDraggingDown = transY > SNAP_THRESHOLD || velocityY > 500;
      const isDraggingUp = transY < -SNAP_THRESHOLD || velocityY < -500;

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
        const currentPosition = Math.max(0, Math.min(EXPAND_DISTANCE, basePosition.current + transY));
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

  // Handle pan gesture for drag-to-close mode (simpler - just close on drag down)
  const onDragToCloseGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: dragY } }],
    { useNativeDriver: true }
  );

  const onDragToCloseStateChange = (event: PanGestureHandlerGestureEvent) => {
    const { state, translationY, velocityY } = event.nativeEvent;

    if (state === State.END || state === State.CANCELLED) {
      const isDraggingDown = translationY > SNAP_THRESHOLD || velocityY > 500;

      if (isDraggingDown) {
        // Close the drawer
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          onClose();
        });
      } else {
        // Snap back to original position
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }).start();
      }
    }
  };

  if (!visible) return null;

  // Slide animation - drawer slides up from bottom
  const slideTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [MAX_HEIGHT, 0],
  });

  // Combine slide animation with expand position or drag-to-close
  let combinedTranslateY: Animated.AnimatedInterpolation<number> | Animated.AnimatedAddition<number>;

  if (dragToClose) {
    // For drag-to-close: just add the drag offset (clamped to positive values only)
    combinedTranslateY = Animated.add(
      slideTranslateY,
      dragY.interpolate({
        inputRange: [-MAX_HEIGHT, 0, MAX_HEIGHT],
        outputRange: [0, 0, MAX_HEIGHT],
        extrapolate: 'clamp',
      })
    );
  } else if (expandable && EXPAND_DISTANCE > 0) {
    // For expandable: combine slide with expand animation
    combinedTranslateY = Animated.add(
      slideTranslateY,
      expandY.interpolate({
        inputRange: [0, EXPAND_DISTANCE],
        outputRange: [0, EXPAND_DISTANCE],
        extrapolate: 'clamp',
      })
    );
  } else {
    // Non-expandable: just use slide animation
    combinedTranslateY = slideTranslateY;
  }

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
      <View style={styles.container}>
        {/* Overlay - tapping closes the drawer */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        {/* Drawer - positioned at bottom */}
        <View style={styles.drawerContainer} pointerEvents="box-none">
          {dragToClose ? (
            <PanGestureHandler
              onGestureEvent={onDragToCloseGestureEvent}
              onHandlerStateChange={onDragToCloseStateChange}
              activeOffsetY={[-10, 10]}
            >
              {drawerContent}
            </PanGestureHandler>
          ) : expandable ? (
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
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  drawerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
