import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useLayoutStore, usePopupStore } from '../../store';
import { FileMetaData } from '../../types/chat';
import { FileIcon, DownloadIcon } from '../icons';
import { colors } from '../../theme/colors';
import { isImageFile } from './AIMessageImages';

interface AIMessageAttachmentsProps {
  files: FileMetaData[];
}

/**
 * Get file extension from filename
 */
const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 1].toUpperCase();
  }
  return 'FILE';
};

/**
 * Format file size for display (if available)
 */
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Get icon color based on file type
 */
const getFileTypeColor = (extension: string): string => {
  const ext = extension.toLowerCase();

  // Documents
  if (['pdf'].includes(ext)) return colors.red['500'];
  if (['doc', 'docx'].includes(ext)) return colors.blue['600'];
  if (['xls', 'xlsx', 'csv'].includes(ext)) return colors.green['600'];
  if (['ppt', 'pptx'].includes(ext)) return colors.yellow['600'];

  // Code files
  if (['js', 'ts', 'tsx', 'jsx', 'json'].includes(ext)) return colors.yellow['500'];
  if (['py', 'rb', 'go', 'rs'].includes(ext)) return colors.purple['500'];
  if (['html', 'css', 'scss'].includes(ext)) return colors.yellow['400'];

  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return colors.gray['500'];

  // Text
  if (['txt', 'md', 'rtf'].includes(ext)) return colors.gray['400'];

  return colors.blue['500'];
};

/**
 * AIMessageAttachments - Displays non-image file attachments with download option
 * Shows file name, type badge, and opens the file URL when tapped
 */
export const AIMessageAttachments: React.FC<AIMessageAttachmentsProps> = ({ files }) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const { addToast } = usePopupStore();

  // Filter to non-image files with signed URLs
  const attachmentFiles = files.filter((f) => !isImageFile(f) && f.signedUrl && !f.loading);

  if (attachmentFiles.length === 0) {
    return null;
  }

  const handleOpenFile = async (file: FileMetaData) => {
    if (!file.signedUrl) {
      addToast({
        variant: 'danger',
        label: 'File URL not available',
      });
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(file.signedUrl);
      if (canOpen) {
        await Linking.openURL(file.signedUrl);
      } else {
        addToast({
          variant: 'danger',
          label: 'Unable to open file',
        });
      }
    } catch (error) {
      console.error('Error opening file:', error);
      addToast({
        variant: 'danger',
        label: 'Failed to open file',
      });
    }
  };

  const bgColor = isDarkTheme ? colors.gray['800'] : colors.gray['100'];
  const borderColor = isDarkTheme ? colors.gray['700'] : colors.gray['200'];
  const textColor = isDarkTheme ? colors.gray['100'] : colors.gray['900'];
  const secondaryColor = isDarkTheme ? colors.gray['400'] : colors.gray['500'];

  return (
    <View style={styles.container}>
      {attachmentFiles.map((file) => {
        const extension = getFileExtension(file.name);
        const typeColor = getFileTypeColor(extension);

        return (
          <TouchableOpacity
            key={file.name}
            style={[styles.attachmentItem, { backgroundColor: bgColor, borderColor }]}
            onPress={() => handleOpenFile(file)}
            activeOpacity={0.7}
          >
            <View style={styles.fileInfo}>
              <View style={[styles.fileIconContainer, { backgroundColor: typeColor + '20' }]}>
                <FileIcon size={20} color={typeColor} />
              </View>
              <View style={styles.fileDetails}>
                <Text
                  style={[styles.fileName, { color: textColor }]}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {file.name}
                </Text>
                <View style={styles.fileMetaRow}>
                  <View style={[styles.extensionBadge, { backgroundColor: typeColor + '20' }]}>
                    <Text style={[styles.extensionText, { color: typeColor }]}>
                      {extension}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.downloadButton}>
              <DownloadIcon size={18} color={secondaryColor} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  extensionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  extensionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  downloadButton: {
    padding: 8,
  },
});
