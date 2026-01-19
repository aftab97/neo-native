import React, { useEffect, useState } from 'react';
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
import * as MediaLibrary from 'expo-media-library';
import { useLayoutStore } from '../../store';
import { useFileUpload } from '../../hooks';
import { CameraIcon, FileIcon, GlobeIcon, PlusIcon } from '../icons';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          borderTopColor: borderColor,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Handle bar */}
      <View style={styles.handleContainer}>
        <View style={[styles.handle, { backgroundColor: borderColor }]} />
      </View>

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
            style={[
              styles.cameraTile,
              { backgroundColor: accentColor },
            ]}
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
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
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
});
