import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { useLayoutStore } from '../../../store';
import { useFileUpload } from '../../../hooks';
import { CameraIcon, FileIcon, SearchWebIcon, PlusIcon, PromptLibraryIcon } from '../../foundation/icons';
import { colors } from '../../foundation/colors/colors';
import { SlideoutDrawer } from '../common';
import { PromptLibraryTab } from './PromptLibraryTab';

type ViewType = 'attachments' | 'prompts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ANIMATION_DURATION = 250;
const PHOTO_TILE_GAP = 8;
const PHOTO_TILE_SIZE = (SCREEN_WIDTH - 32 - PHOTO_TILE_GAP * 4) / 5; // 5 tiles per row with gaps
const TWO_ROW_HEIGHT = PHOTO_TILE_SIZE * 2 + PHOTO_TILE_GAP; // Height for 2 rows of tiles

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
  const [currentView, setCurrentView] = useState<ViewType>('attachments');

  // Animation values for slide transition
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Theme colors
  const textColor = isDarkTheme ? colors.gray['100'] : colors.gray['900'];
  const secondaryTextColor = isDarkTheme ? colors.gray['400'] : colors.gray['500'];
  const borderColor = isDarkTheme ? colors.gray['700'] : colors.gray['200'];
  const tileBackground = isDarkTheme ? colors.gray['800'] : colors.gray['100'];
  const accentColor = colors.blue['700'];

  // Load recent photos when slideout opens, clear when it closes
  useEffect(() => {
    if (visible) {
      loadRecentPhotos();
    } else {
      // Clear photos when closing to avoid stale URIs
      setRecentPhotos([]);
      // Reset to attachments view when closing
      setCurrentView('attachments');
      // Reset animation position
      slideAnim.setValue(0);
    }
  }, [visible]);

  const loadRecentPhotos = async () => {
    const photos = await getRecentPhotos(10);
    setRecentPhotos(photos);
  };

  const handleTakePhoto = async () => {
    const success = await takePhoto();
    if (success) {
      onClose();
    }
  };

  const handlePickImages = async () => {
    const success = await pickImages();
    if (success) {
      onClose();
    }
  };

  const handlePickDocuments = async () => {
    const success = await pickDocuments();
    if (success) {
      onClose();
    }
  };

  const handleSelectRecentPhoto = async (asset: MediaLibrary.Asset) => {
    await addPhotoFromAsset(asset);
    onClose();
  };

  const handleWebSearch = () => {
    // Placeholder for web search functionality
    onClose();
  };

  const handleOpenPrompts = () => {
    setCurrentView('prompts');
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  };

  const handleBackFromPrompts = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start(() => {
      setCurrentView('attachments');
    });
  };

  const handlePromptSelect = () => {
    onClose();
  };

  return (
    <SlideoutDrawer
      visible={visible}
      onClose={onClose}
      defaultHeight={currentView === 'prompts' ? 450 : 340}
      maxHeightPercent={0.85}
      expandable={true}
    >
      {(isExpanded) => {
        // Animated transforms for slide transitions
        const attachmentsTranslateX = slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -SCREEN_WIDTH],
        });
        const promptsTranslateX = slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [SCREEN_WIDTH, 0],
        });

        return (
          <View style={styles.slideoutContent}>
            {/* Attachments View */}
            <Animated.View
              style={[
                styles.animatedScreen,
                { transform: [{ translateX: attachmentsTranslateX }] },
              ]}
              pointerEvents={currentView === 'attachments' ? 'auto' : 'none'}
            >
              <ScrollView
              style={styles.contentScroll}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Photos Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
                  Photos
                </Text>
                {isExpanded ? (
                  // Expanded: 2-row grid layout
                  <View style={[styles.photoGrid, { height: TWO_ROW_HEIGHT }]}>
                    {/* Camera Button */}
                    <TouchableOpacity
                      style={[styles.cameraTile, { backgroundColor: accentColor }]}
                      onPress={handleTakePhoto}
                      accessibilityLabel="Take photo"
                      accessibilityRole="button"
                    >
                      <CameraIcon size={28} color="#ffffff" />
                    </TouchableOpacity>

                    {/* Recent Photos - show up to 8 to fill 2 rows (camera + 8 photos + more = 10 tiles) */}
                    {recentPhotos.slice(0, 8).map((photo) => (
                      photo.uri ? (
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
                      ) : null
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
                  </View>
                ) : (
                  // Collapsed: horizontal scroll
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
                      photo.uri ? (
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
                      ) : null
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
                )}
              </View>

              {/* Web Search Row */}
              <TouchableOpacity
                style={[styles.actionRow, { borderBottomColor: borderColor }]}
                onPress={handleWebSearch}
                accessibilityLabel="Web search"
                accessibilityRole="button"
              >
                <View style={[styles.actionIcon, { backgroundColor: tileBackground }]}>
                  <SearchWebIcon size={24} color={accentColor} />
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
                style={[styles.actionRow, { borderBottomColor: borderColor }]}
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

              {/* Prompts Row */}
              <TouchableOpacity
                style={[styles.actionRow, { borderBottomColor: 'transparent' }]}
                onPress={handleOpenPrompts}
                accessibilityLabel="Browse prompts"
                accessibilityRole="button"
              >
                <View style={[styles.actionIcon, { backgroundColor: tileBackground }]}>
                  <PromptLibraryIcon size={24} color={accentColor} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionTitle, { color: textColor }]}>
                    Prompts
                  </Text>
                  <Text style={[styles.actionSubtitle, { color: secondaryTextColor }]}>
                    Browse prompt templates by category
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
            </Animated.View>

            {/* Prompts View */}
            <Animated.View
              style={[
                styles.animatedScreen,
                styles.promptsScreen,
                { transform: [{ translateX: promptsTranslateX }] },
              ]}
              pointerEvents={currentView === 'prompts' ? 'auto' : 'none'}
            >
              <PromptLibraryTab
                onSelectPrompt={handlePromptSelect}
                onBack={handleBackFromPrompts}
              />
            </Animated.View>
          </View>
        );
      }}
    </SlideoutDrawer>
  );
};

const styles = StyleSheet.create({
  slideoutContent: {
    flex: 1,
    overflow: 'hidden',
  },
  animatedScreen: {
    flex: 1,
  },
  promptsScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
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
    gap: PHOTO_TILE_GAP,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: PHOTO_TILE_GAP,
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
});
