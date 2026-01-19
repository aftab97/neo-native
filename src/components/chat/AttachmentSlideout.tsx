import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import * as MediaLibrary from 'expo-media-library';
import { useLayoutStore } from '../../store';
import { useFileUpload } from '../../hooks';
import { CameraIcon, FileIcon, GlobeIcon, PlusIcon } from '../icons';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Drawer height constraints
const DEFAULT_HEIGHT = 340; // Default collapsed height
const MAX_HEIGHT = SCREEN_HEIGHT * 0.8; // 80% of screen when expanded
const EXPAND_DISTANCE = MAX_HEIGHT - DEFAULT_HEIGHT; // How much to expand
const SNAP_THRESHOLD = 80; // Pixels dragged before snapping
const PHOTO_TILE_SIZE = (SCREEN_WIDTH - 32 - 48) / 5; // 5 tiles with gaps

interface AttachmentSlideoutProps {
  visible: boolean;
  onClose: () => void;
  isLiveChatActive?: boolean;
}

export const AttachmentSlideout: React.FC<AttachmentSlideoutProps> = ({
  visible,
  onClose,
  isLiveChatActive = false,
}) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const { takePhoto, pickImages, pickDocuments, getRecentPhotos, addPhotoFromAsset } =
    useFileUpload({ isLiveChatActive });

  const [recentPhotos, setRecentPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [slideAnim] = useState(new Animated.Value(0));

  // Draggable state - single animated value with offset pattern
  // 0 = fully expanded (MAX_HEIGHT), EXPAND_DISTANCE = collapsed (DEFAULT_HEIGHT)
  const [isExpanded, setIsExpanded] = useState(false);
  const expandY = useRef(new Animated.Value(EXPAND_DISTANCE)).current; // Start collapsed
  const basePosition = useRef(EXPAND_DISTANCE); // Track base position for gesture calculations

  // Theme colors
  const backgroundColor = isDarkTheme ? colors.gray['900'] : colors.gray['000'];
  const textColor = isDarkTheme ? colors.gray['100'] : colors.gray['900'];
  const secondaryTextColor = isDarkTheme ? colors.gray['400'] : colors.gray['500'];
  const borderColor = isDarkTheme ? colors.gray['700'] : colors.gray['200'];
  const tileBackground = isDarkTheme ? colors.gray['800'] : colors.gray['100'];
  const accentColor = colors.blue['700'];

  // Load recent photos when slideout opens
  useEffect(() => {
    if (visible) {
      loadRecentPhotos();
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
    const { state } = event.nativeEvent;

    if (state === State.BEGAN) {
      // When gesture begins, set current position as offset
      // translationY starts at 0 and gets added to offset
      expandY.setOffset(basePosition.current);
      expandY.setValue(0);
    }

    if (state === State.END || state === State.CANCELLED) {
      const { translationY: dragY, velocityY } = event.nativeEvent;

      // Flatten offset back into value for animation
      expandY.flattenOffset();

      // Determine if dragging down with intent
      const isDraggingDown = dragY > SNAP_THRESHOLD || velocityY > 500;
      const isDraggingUp = dragY < -SNAP_THRESHOLD || velocityY < -500;

      // Three states: Expanded (0) → Default (EXPAND_DISTANCE) → Closed
      // If at default position and dragging down → animate closed then dismiss
      if (isDraggingDown && !isExpanded) {
        // Animate drawer off-screen, then call onClose
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
        // Dragging up → expand
        targetValue = 0;
      } else if (isDraggingDown && isExpanded) {
        // Dragging down from expanded → go to default
        targetValue = EXPAND_DISTANCE;
      } else {
        // Snap to nearest position
        const currentPosition = Math.max(0, Math.min(EXPAND_DISTANCE, basePosition.current + dragY));
        targetValue = currentPosition < EXPAND_DISTANCE / 2 ? 0 : EXPAND_DISTANCE;
      }

      basePosition.current = targetValue;
      setIsExpanded(targetValue === 0);

      // Animate smoothly to target
      Animated.spring(expandY, {
        toValue: targetValue,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    }
  };

  const loadRecentPhotos = async () => {
    const photos = await getRecentPhotos(10);
    setRecentPhotos(photos);
  };

  const handleTakePhoto = async () => {
    await takePhoto();
    onClose();
  };

  const handlePickImages = async () => {
    await pickImages();
    onClose();
  };

  const handlePickDocuments = async () => {
    await pickDocuments();
    onClose();
  };

  const handleSelectRecentPhoto = async (asset: MediaLibrary.Asset) => {
    await addPhotoFromAsset(asset);
    onClose();
  };

  const handleWebSearch = () => {
    // Placeholder for web search functionality
    onClose();
  };

  if (!visible) return null;

  // Slide in/out animation (for opening/closing the drawer)
  const slideTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [MAX_HEIGHT, 0],
  });

  // Combine slide animation with expand position (clamped to valid range)
  const combinedTranslateY = Animated.add(
    slideTranslateY,
    expandY.interpolate({
      inputRange: [0, EXPAND_DISTANCE],
      outputRange: [0, EXPAND_DISTANCE],
      extrapolate: 'clamp',
    })
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          borderTopColor: borderColor,
          height: MAX_HEIGHT,
          transform: [{ translateY: combinedTranslateY }],
        },
      ]}
    >
      {/* Wrap entire content with gesture handler for drag from anywhere */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetY={[-10, 10]} // Require 10px vertical movement to activate
      >
        <Animated.View style={styles.gestureContainer}>
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: borderColor }]} />
          </View>

          {/* Scrollable content area */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            bounces={isExpanded}
            scrollEnabled={isExpanded}
          >
            {/* Photos Row */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
                Photos
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoRow}
              >
                {/* Camera Button */}
                <TouchableOpacity
                  style={[styles.cameraTile, { backgroundColor: accentColor }]}
                  onPress={handleTakePhoto}
                  accessibilityLabel="Take photo"
                  accessibilityRole="button"
                >
                  <CameraIcon size={28} color="#ffffff" />
                </TouchableOpacity>

                {/* Recent Photos */}
                {recentPhotos.map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    style={styles.photoTile}
                    onPress={() => handleSelectRecentPhoto(photo)}
                    accessibilityLabel={`Select photo ${photo.filename}`}
                    accessibilityRole="button"
                  >
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.photoImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}

                {/* More Photos Button */}
                <TouchableOpacity
                  style={[styles.moreTile, { backgroundColor: tileBackground }]}
                  onPress={handlePickImages}
                  accessibilityLabel="Browse more photos"
                  accessibilityRole="button"
                >
                  <PlusIcon size={24} color={secondaryTextColor} />
                  <Text style={[styles.moreText, { color: secondaryTextColor }]}>
                    More
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Web Search Row */}
            <TouchableOpacity
              style={[styles.actionRow, { borderBottomColor: borderColor }]}
              onPress={handleWebSearch}
              accessibilityLabel="Web search"
              accessibilityRole="button"
            >
              <View style={[styles.actionIcon, { backgroundColor: tileBackground }]}>
                <GlobeIcon size={22} color={accentColor} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: textColor }]}>
                  Web Search
                </Text>
                <Text style={[styles.actionSubtitle, { color: secondaryTextColor }]}>
                  Search the web for information
                </Text>
              </View>
            </TouchableOpacity>

            {/* Add Files Row */}
            <TouchableOpacity
              style={[styles.actionRow, { borderBottomColor: 'transparent' }]}
              onPress={handlePickDocuments}
              accessibilityLabel="Add files"
              accessibilityRole="button"
            >
              <View style={[styles.actionIcon, { backgroundColor: tileBackground }]}>
                <FileIcon size={22} color={accentColor} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: textColor }]}>
                  Add Files
                </Text>
                <Text style={[styles.actionSubtitle, { color: secondaryTextColor }]}>
                  {isLiveChatActive
                    ? 'PDF, Word, Excel, PowerPoint, Text, CSV'
                    : 'PDF, Word, Excel, PowerPoint, Text, CSV, ZIP'}
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  gestureContainer: {
    flex: 1,
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
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cameraTile: {
    width: PHOTO_TILE_SIZE,
    height: PHOTO_TILE_SIZE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTile: {
    width: PHOTO_TILE_SIZE,
    height: PHOTO_TILE_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  moreTile: {
    width: PHOTO_TILE_SIZE,
    height: PHOTO_TILE_SIZE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 11,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
});
