import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLayoutStore } from '../../../store';
import { FileIcon } from '../../foundation/icons';
import { colors } from '../../foundation/colors/colors';

interface FileAttachment {
  id?: string;
  name: string;
  type?: string;
  loading?: boolean;
  error?: boolean;
  partialError?: boolean;
}

interface UserAttachmentsProps {
  files: FileAttachment[];
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
 * UserAttachments - Displays user uploaded files in conversation
 * Styled to match web app's Attachments component with variant="conversion"
 */
export const UserAttachments: React.FC<UserAttachmentsProps> = ({ files }) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  if (!files || files.length === 0) {
    return null;
  }

  // Theme colors matching web app tertiary button
  const tileBackground = isDarkTheme ? colors.gray['800'] : colors.gray['100'];
  const iconBackground = isDarkTheme ? colors.gray['700'] : colors.gray['200'];
  const textColor = isDarkTheme ? colors.gray['100'] : colors.gray['900'];
  const subtitleColor = isDarkTheme ? colors.gray['400'] : colors.gray['500'];
  const iconColor = isDarkTheme ? colors.blue['400'] : colors.blue['700'];
  const errorIconBg = isDarkTheme ? colors.red['900'] : colors.red['200'];
  const errorIconColor = isDarkTheme ? colors.red['400'] : colors.red['700'];
  const warningIconBg = isDarkTheme ? colors.yellow['900'] : colors.yellow['200'];
  const warningIconColor = isDarkTheme ? colors.yellow['400'] : colors.yellow['700'];

  return (
    <View style={styles.container}>
      {files.map((file, index) => {
        const fileName = decodeURIComponent(file.name);
        const fileType = getFileType(fileName, file.type);
        const hasError = file.error;
        const hasPartialError = file.partialError;
        const isLoading = file.loading;

        // Determine icon background and color based on state
        let currentIconBg = iconBackground;
        let currentIconColor = iconColor;

        if (hasError) {
          currentIconBg = errorIconBg;
          currentIconColor = errorIconColor;
        } else if (hasPartialError) {
          currentIconBg = warningIconBg;
          currentIconColor = warningIconColor;
        }

        const key = file.id ?? `${fileName}-${index}`;

        return (
          <View
            key={key}
            style={[styles.tile, { backgroundColor: tileBackground }]}
          >
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: currentIconBg }]}>
              {isLoading ? (
                <ActivityIndicator size="small" color={iconColor} />
              ) : (
                <FileIcon size={16} color={currentIconColor} />
              )}
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
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
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
