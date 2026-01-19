import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLayoutStore } from '../../store';
import { FileMetaData } from '../../types/chat';
import { CloseIcon } from '../icons';
import { colors } from '../../theme/colors';

interface AIMessageImagesProps {
  files: FileMetaData[];
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];

/**
 * Check if a file is an image based on name or type
 */
export const isImageFile = (file: FileMetaData): boolean => {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  // Check by mime type
  if (IMAGE_MIME_TYPES.some((mime) => type.includes(mime))) {
    return true;
  }

  // Check by extension
  return IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext));
};

/**
 * AIMessageImages - Displays images from AI message attachments
 * Shows a grid of thumbnails that can be tapped to view full size
 */
export const AIMessageImages: React.FC<AIMessageImagesProps> = ({ files }) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const [selectedImage, setSelectedImage] = useState<FileMetaData | null>(null);
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [errorImages, setErrorImages] = useState<Set<string>>(new Set());

  // Filter to only image files with signed URLs
  const imageFiles = files.filter((f) => isImageFile(f) && f.signedUrl && !f.loading);

  if (imageFiles.length === 0) {
    return null;
  }

  const handleImageLoad = (fileName: string) => {
    setLoadingImages((prev) => {
      const next = new Set(prev);
      next.delete(fileName);
      return next;
    });
  };

  const handleImageError = (fileName: string) => {
    setLoadingImages((prev) => {
      const next = new Set(prev);
      next.delete(fileName);
      return next;
    });
    setErrorImages((prev) => new Set(prev).add(fileName));
  };

  const handleImageLoadStart = (fileName: string) => {
    setLoadingImages((prev) => new Set(prev).add(fileName));
  };

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Calculate thumbnail size based on number of images
  const getThumbnailSize = () => {
    if (imageFiles.length === 1) {
      return { width: 200, height: 150 };
    } else if (imageFiles.length === 2) {
      return { width: 140, height: 100 };
    } else {
      return { width: 100, height: 80 };
    }
  };

  const thumbnailSize = getThumbnailSize();
  const borderColor = isDarkTheme ? colors.gray['700'] : colors.gray['300'];
  const bgColor = isDarkTheme ? colors.gray['800'] : colors.gray['100'];

  return (
    <View style={styles.container}>
      <View style={styles.imageGrid}>
        {imageFiles.map((file) => (
          <TouchableOpacity
            key={file.name}
            style={[
              styles.thumbnailContainer,
              {
                width: thumbnailSize.width,
                height: thumbnailSize.height,
                borderColor,
                backgroundColor: bgColor,
              },
            ]}
            onPress={() => setSelectedImage(file)}
            activeOpacity={0.8}
          >
            {loadingImages.has(file.name) && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={colors.blue['500']} />
              </View>
            )}
            {!errorImages.has(file.name) ? (
              <Image
                source={{ uri: file.signedUrl }}
                style={styles.thumbnail}
                resizeMode="cover"
                onLoadStart={() => handleImageLoadStart(file.name)}
                onLoad={() => handleImageLoad(file.name)}
                onError={() => handleImageError(file.name)}
              />
            ) : (
              <View style={[styles.errorPlaceholder, { backgroundColor: bgColor }]}>
                <ImageIcon size={24} color={isDarkTheme ? colors.gray['500'] : colors.gray['400']} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Full-size image modal */}
      <Modal
        visible={selectedImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedImage(null)}
        >
          <View style={styles.modalContent}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedImage(null)}
            >
              <CloseIcon size={24} color="#ffffff" />
            </TouchableOpacity>

            {selectedImage && (
              <Image
                source={{ uri: selectedImage.signedUrl }}
                style={[
                  styles.fullImage,
                  {
                    maxWidth: screenWidth - 40,
                    maxHeight: screenHeight - 120,
                  },
                ]}
                resizeMode="contain"
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

// Simple ImageIcon component for error state
const ImageIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View
      style={{
        width: size * 0.8,
        height: size * 0.6,
        borderWidth: 2,
        borderColor: color,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: size * 0.2,
          height: size * 0.2,
          borderRadius: size * 0.1,
          backgroundColor: color,
          position: 'absolute',
          top: 4,
          left: 4,
        }}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  thumbnailContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 1,
  },
  errorPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
