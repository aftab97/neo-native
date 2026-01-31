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
import { FileIcon } from '../icons';
import { colors } from '../../theme/colors';
import { isImageFile } from './AIMessageImages';

interface AIMessageAttachmentsProps {
  files: FileMetaData[];
}

/**
 * Get file type label from filename
 */
const getFileType = (fileName: string, fileType?: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return 'PDF';
    case 'xls':
    case 'xlsx':
    case 'xlsm':
    case 'xlsb':
      return 'Excel';
    case 'doc':
    case 'docx':
    case 'docm':
      return 'Word';
    case 'ppt':
    case 'pptx':
    case 'pptm':
      return 'PowerPoint';
    case 'txt':
      return 'Text';
    case 'csv':
      return 'CSV';
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
    case 'bz2':
    case 'xz':
      return 'ZIP';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'heic':
      return 'Image';
    default:
      return fileType || 'File';
  }
};

/**
 * AIMessageAttachments - Displays non-image file attachments from API response
 * Styled to match web app's Attachments component with variant="signedUrl"
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

  // Theme colors matching web app tertiary button
  const tileBackground = isDarkTheme ? colors.gray['800'] : colors.gray['100'];
  const iconBackground = isDarkTheme ? colors.gray['700'] : colors.gray['200'];
  const textColor = isDarkTheme ? colors.gray['100'] : colors.gray['900'];
  const subtitleColor = isDarkTheme ? colors.gray['400'] : colors.gray['500'];
  const iconColor = isDarkTheme ? colors.blue['400'] : colors.blue['700'];

  return (
    <View style={styles.container}>
      {attachmentFiles.map((file, index) => {
        const fileName = decodeURIComponent(file.name);
        const fileType = getFileType(fileName, file.type);
        const key = `${fileName}-${index}`;

        return (
          <TouchableOpacity
            key={key}
            style={[styles.tile, { backgroundColor: tileBackground }]}
            onPress={() => handleOpenFile(file)}
            activeOpacity={0.7}
          >
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: iconBackground }]}>
              <FileIcon size={16} color={iconColor} />
            </View>

            {/* File info */}
            <View style={styles.textContainer}>
              <Text
                style={[styles.fileName, { color: textColor }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {fileName}
              </Text>
              <Text
                style={[styles.fileType, { color: subtitleColor }]}
                numberOfLines={1}
              >
                {fileType}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 16,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    width: 192, // 12rem
    borderRadius: 12,
    paddingHorizontal: 8,
    gap: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 14,
  },
  fileType: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
  },
});
