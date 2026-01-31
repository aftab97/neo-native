import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { useFileStore, useLayoutStore, type FileAttachment } from '../../../store';
import { isImageFile } from '../../../hooks';
import { CloseIcon, FileIcon } from '../../foundation/icons';
import { colors } from '../../foundation/colors/colors';
import { AttachmentsLoader } from './AttachmentsLoader';

interface AttachmentPreviewProps {
  onRemoveAll?: () => void;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  onRemoveAll,
}) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const allFiles = useFileStore((state) => state.files);
  const removeFile = useFileStore((state) => state.removeFile);
  const removeAllFiles = useFileStore((state) => state.removeAllFiles);

  // Only show files that are visible in prompt bar (not yet sent)
  const files = allFiles.filter((file) => file.isVisibleInPromptBar !== false);

  // Theme colors
  const backgroundColor = isDarkTheme ? colors.gray['800'] : colors.gray['100'];
  const textColor = isDarkTheme ? colors.gray['100'] : colors.gray['900'];
  const secondaryTextColor = isDarkTheme ? colors.gray['400'] : colors.gray['500'];
  const errorColor = colors.red['500'];
  const warningColor = colors.yellow['500'];
  const accentColor = colors.blue['700'];

  if (files.length === 0) return null;

  const handleRemoveFile = (id: string) => {
    removeFile(id);
  };

  const handleRemoveAll = () => {
    removeAllFiles();
    onRemoveAll?.();
  };

  const getStatusText = (file: FileAttachment): string => {
    if (file.error) {
      return file.errorMessage || 'Upload failed';
    }
    if (file.partialError) {
      return 'Partially processed';
    }
    // When loading, just show the file type - the spinner already indicates loading
    return file.type;
  };

  const getStatusColor = (file: FileAttachment): string => {
    if (file.error) return errorColor;
    if (file.partialError) return warningColor;
    return secondaryTextColor;
  };

  const renderFileItem = (file: FileAttachment) => {
    const isImage = isImageFile(file.name);

    return (
      <View
        key={file.id}
        style={[
          styles.fileItem,
          {
            backgroundColor,
            borderColor: file.error ? errorColor : file.partialError ? warningColor : 'transparent',
            borderWidth: file.error || file.partialError ? 1 : 0,
          },
        ]}
      >
        {/* Thumbnail or Icon */}
        <View style={styles.thumbnailContainer}>
          {isImage ? (
            <Image
              source={{ uri: file.uri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.iconContainer, { backgroundColor: isDarkTheme ? colors.gray['700'] : colors.gray['200'] }]}>
              <FileIcon size={20} color={accentColor} />
            </View>
          )}

          {/* Loading overlay */}
          {file.loading && (
            <View style={styles.loadingOverlay}>
              <AttachmentsLoader size={24} />
            </View>
          )}
        </View>

        {/* File info */}
        <View style={styles.fileInfo}>
          <Text
            style={[styles.fileName, { color: textColor }]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {file.name}
          </Text>
          <Text style={[styles.fileType, { color: getStatusColor(file) }]}>
            {getStatusText(file)}
          </Text>
        </View>

        {/* Remove button */}
        {!file.loading && (
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: isDarkTheme ? colors.gray['700'] : colors.gray['200'] }]}
            onPress={() => handleRemoveFile(file.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`Remove ${file.name}`}
            accessibilityRole="button"
          >
            <CloseIcon size={14} color={secondaryTextColor} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {files.map(renderFileItem)}

        {/* Remove All Button */}
        {files.length > 1 && (
          <TouchableOpacity
            style={[styles.removeAllButton, { backgroundColor }]}
            onPress={handleRemoveAll}
            accessibilityLabel="Remove all files"
            accessibilityRole="button"
          >
            <Text style={[styles.removeAllText, { color: accentColor }]}>
              Remove all
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 10,
    borderRadius: 12,
    maxWidth: 200,
  },
  thumbnailContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '500',
  },
  fileType: {
    fontSize: 11,
    marginTop: 1,
  },
  removeButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeAllButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  removeAllText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
