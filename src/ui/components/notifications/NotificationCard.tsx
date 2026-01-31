import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useNotificationStore, useLayoutStore } from '../../../store';
import { openNotificationLink, type NotificationVariant } from '../../../api';
import { colors } from '../../foundation/colors/colors';
import { CloseIcon } from '../../foundation/icons';

interface NotificationCardProps {
  id: string;
  variant: NotificationVariant;
  description: string;
  tag: string;
  timestamp?: Date;
  link?: string;
}

const getVariantColors = (variant: NotificationVariant, isDark: boolean) => {
  const variantStyles = {
    blue: {
      tagText: isDark ? colors.blue['400'] : colors.blue['700'],
      tagBorder: isDark ? colors.blue['700'] : colors.blue['200'],
    },
    yellow: {
      tagText: isDark ? colors.yellow['300'] : colors.yellow['700'],
      tagBorder: isDark ? colors.yellow['700'] : colors.yellow['200'],
    },
    gray: {
      tagText: isDark ? colors.gray['300'] : colors.gray['700'],
      tagBorder: isDark ? colors.gray['600'] : colors.gray['300'],
    },
    green: {
      tagText: isDark ? colors.green['400'] : colors.green['700'],
      tagBorder: isDark ? colors.green['700'] : colors.green['200'],
    },
    purple: {
      tagText: isDark ? colors.purple['600'] : colors.purple['700'],
      tagBorder: isDark ? colors.purple['700'] : colors.purple['100'],
    },
  };

  return variantStyles[variant];
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
  id,
  variant,
  description,
  tag,
  link,
}) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const dismissNotification = useNotificationStore(
    (state) => state.dismissNotification
  );

  const variantColors = getVariantColors(variant, isDarkTheme);

  const cardBg = isDarkTheme
    ? 'rgba(43, 47, 59, 0.6)'
    : 'rgba(255, 255, 255, 0.9)';
  const textColor = isDarkTheme ? colors.gray['100'] : colors.gray['900'];
  const closeIconColor = isDarkTheme ? colors.gray['400'] : colors.gray['500'];

  const handleCardPress = () => {
    if (link) {
      openNotificationLink(link);
    }
  };

  const handleDismiss = () => {
    dismissNotification(id);
  };

  return (
    <Pressable
      onPress={handleCardPress}
      accessibilityRole="button"
      accessibilityLabel={`${tag}: ${description}`}
      accessibilityHint={link ? 'Double tap to open link' : undefined}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.card,
            {
              backgroundColor: pressed
                ? isDarkTheme
                  ? 'rgba(43, 47, 59, 0.8)'
                  : 'rgba(255, 255, 255, 1)'
                : cardBg,
              borderColor: variantColors.tagText,
            },
          ]}
        >
          {/* Dismiss button */}
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.dismissButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Dismiss notification"
            accessibilityRole="button"
          >
            <CloseIcon size={16} color={closeIconColor} />
          </TouchableOpacity>

          {/* Tag */}
          <View
            style={[
              styles.tag,
              {
                borderColor: variantColors.tagBorder,
              },
            ]}
          >
            <Text style={[styles.tagText, { color: variantColors.tagText }]}>
              {tag}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.content}>
            <Text
              style={[styles.description, { color: textColor }]}
              numberOfLines={4}
            >
              {description}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 120,
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    justifyContent: 'space-between',
  },
  dismissButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 10,
    padding: 4,
    borderRadius: 12,
  },
  tag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '400',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 19,
  },
});
