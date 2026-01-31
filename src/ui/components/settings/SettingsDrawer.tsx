import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { t } from 'ttag';
import { useNavigation } from '@react-navigation/native';
import { useLayoutStore, useLocaleStore } from '../../../store';
import { SERVICE_NOW_URL } from '../../../api/env';
import { useEffectiveLocale, type AvailableLocale } from '../../../hooks';
import { useGetUser, useGetProfilePicture, useDeleteAllChats } from '../../../api';
import { clearStoredJwt } from '../../../api';
import { SlideoutDrawer } from '../common';
import {
  CloseIcon,
  MapPinIcon,
  BuildingIcon,
  HashIcon,
  EmailIcon,
  PhoneIcon,
  LanguageIcon,
  MoonIcon,
  SunIcon,
  TrashIcon,
  LogoutIcon,
  InfoIcon,
  IssueIcon,
  FileTextIcon,
  ChevronRightIcon,
} from '../../foundation/icons';
import { colors } from '../../foundation/colors/colors';

type LocaleOption = 'auto' | AvailableLocale;

interface SettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

type ThemeType = 'light' | 'dark' | 'system';

/**
 * Get initials from name or email
 */
const getInitials = (name?: string, fallbackEmail?: string): string => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return fallbackEmail ? fallbackEmail.slice(0, 2).toUpperCase() : '';
};

/**
 * Format name: First letter uppercase, rest lowercase
 */
const formatName = (firstname?: string, lastname?: string): string => {
  const formatPart = (part?: string): string => {
    if (!part) return '';
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  };

  const formatted = `${formatPart(firstname)} ${formatPart(lastname)}`.trim();
  return formatted;
};

/**
 * Truncate name with ellipsis if too long
 */
const truncateName = (name: string, maxLength: number = 20): string => {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength - 3) + '...';
};

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  visible,
  onClose,
}) => {
  const navigation = useNavigation();
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const theme = useLayoutStore((state) => state.theme);
  const setTheme = useLayoutStore((state) => state.setTheme);

  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const effectiveLocale = useEffectiveLocale();

  const { data: userInfo, isLoading: isLoadingUser } = useGetUser();
  const { data: profilePictureData } = useGetProfilePicture();
  const deleteAllChatsMutation = useDeleteAllChats();

  const [isDeleting, setIsDeleting] = useState(false);

  const handleLanguageChange = (newLocale: LocaleOption) => {
    setLocale(newLocale);
  };

  // Theme colors
  const backgroundColor = isDarkTheme ? colors.gray['900'] : colors.gray['000'];
  const textColor = isDarkTheme ? colors.gray['100'] : colors.gray['900'];
  const secondaryText = isDarkTheme ? colors.gray['400'] : colors.gray['500'];
  const borderColor = isDarkTheme ? colors.gray['700'] : colors.gray['200'];
  const surfaceColor = isDarkTheme ? colors.gray['800'] : colors.gray['100'];
  const accentColor = colors.blue['700'];
  const dangerColor = colors.red['500'];

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
  };

  const handleDeleteAllChats = () => {
    if (!userInfo?.email) {
      Alert.alert(t`Error`, t`Unable to delete chats. User info not available.`);
      return;
    }

    Alert.alert(
      t`Delete all chats`,
      t`Are you sure you want to delete all chat history?`,
      [
        {
          text: t`Cancel`,
          style: 'cancel',
        },
        {
          text: t`Delete`,
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteAllChatsMutation.mutateAsync({ userEmail: userInfo.email });
              Alert.alert(t`Success`, t`All chats have been deleted.`);
            } catch (error) {
              Alert.alert(t`Error`, t`Failed to delete chats. Please try again.`);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t`Log out`,
      t`Are you sure you want to log out?`,
      [
        {
          text: t`Cancel`,
          style: 'cancel',
        },
        {
          text: t`Log out`,
          style: 'destructive',
          onPress: async () => {
            try {
              await clearStoredJwt();
              // The app should handle navigation to login screen via auth state change
            } catch (error) {
              Alert.alert(t`Error`, t`Failed to log out. Please try again.`);
            }
          },
        },
      ]
    );
  };

  // Help & Support handlers
  const handleSupportPress = () => {
    onClose();
    navigation.navigate('Support' as never);
  };

  const handleReportIssuePress = () => {
    Linking.openURL(SERVICE_NOW_URL);
  };

  const handleTermsPress = () => {
    onClose();
    navigation.navigate('Terms' as never);
  };

  const fullName = formatName(userInfo?.firstname, userInfo?.lastname);
  const initials = getInitials(
    `${userInfo?.firstname ?? ''} ${userInfo?.lastname ?? ''}`.trim() || undefined,
    userInfo?.email
  );

  const renderAvatar = (size: 'small' | 'large' = 'large') => {
    const avatarSize = size === 'large' ? 64 : 40;
    const fontSize = size === 'large' ? 24 : 16;

    if (profilePictureData?.profilePicture) {
      return (
        <Image
          source={{ uri: profilePictureData.profilePicture }}
          style={[
            styles.avatar,
            { width: avatarSize, height: avatarSize, borderRadius: avatarSize * 0.25 },
          ]}
        />
      );
    }

    return (
      <View
        style={[
          styles.avatarFallback,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize * 0.25,
            backgroundColor: isDarkTheme ? colors.gray['700'] : colors.blue['100'],
          },
        ]}
      >
        <Text
          style={[
            styles.avatarText,
            {
              fontSize,
              color: isDarkTheme ? colors.gray['200'] : colors.gray['700'],
            },
          ]}
        >
          {initials}
        </Text>
      </View>
    );
  };

  const renderAccountItem = (
    icon: React.ReactNode,
    label: string,
    value?: string
  ) => (
    <View style={styles.accountItem}>
      <View style={[styles.accountIconWrapper, { backgroundColor: surfaceColor }]}>
        {icon}
      </View>
      <View style={styles.accountItemContent}>
        <Text style={[styles.accountLabel, { color: secondaryText }]}>{label}</Text>
        <Text style={[styles.accountValue, { color: textColor }]} numberOfLines={1}>
          {value || t`Not available`}
        </Text>
      </View>
    </View>
  );

  const renderThemeOption = (themeOption: ThemeType, label: string, icon: React.ReactNode) => {
    const isSelected = theme === themeOption;
    return (
      <TouchableOpacity
        style={[
          styles.themeOption,
          {
            backgroundColor: isSelected ? accentColor : surfaceColor,
            borderColor: isSelected ? accentColor : borderColor,
          },
        ]}
        onPress={() => handleThemeChange(themeOption)}
        activeOpacity={0.7}
      >
        {icon}
        <Text
          style={[
            styles.themeOptionText,
            { color: isSelected ? '#ffffff' : textColor },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderLanguageOption = (localeOption: LocaleOption, label: string) => {
    const isSelected = locale === localeOption;
    return (
      <TouchableOpacity
        key={localeOption}
        style={[
          styles.languageOption,
          {
            backgroundColor: isSelected ? accentColor : surfaceColor,
            borderColor: isSelected ? accentColor : borderColor,
          },
        ]}
        onPress={() => handleLanguageChange(localeOption)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.languageOptionText,
            { color: isSelected ? '#ffffff' : textColor },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SlideoutDrawer
      visible={visible}
      onClose={onClose}
      maxHeightPercent={0.92}
      expandable={false}
      dragToClose={true}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t`Settings`}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <CloseIcon size={24} color={secondaryText} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section - matches web app: Avatar + Name + Job Title */}
        <View style={styles.profileSection}>
          {renderAvatar('large')}
          {isLoadingUser ? (
            <ActivityIndicator size="small" color={accentColor} style={styles.loadingIndicator} />
          ) : (
            <>
              <Text style={[styles.profileName, { color: textColor }]}>
                {truncateName(fullName) || 'User'}
              </Text>
              {userInfo?.jobTitle && (
                <Text style={[styles.profileJobTitle, { color: secondaryText }]}>
                  {userInfo.jobTitle}
                </Text>
              )}
            </>
          )}
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: secondaryText }]}>{t`Account`}</Text>
          <View style={[styles.sectionContent, { backgroundColor: surfaceColor, borderColor }]}>
            {renderAccountItem(
              <EmailIcon size={20} color={accentColor} />,
              t`Email`,
              userInfo?.email
            )}
            {renderAccountItem(
              <PhoneIcon size={20} color={accentColor} />,
              t`Phone`,
              undefined // Phone number not accessible from device for privacy reasons
            )}
            {renderAccountItem(
              <MapPinIcon size={20} color={accentColor} />,
              t`Location`,
              userInfo?.country
            )}
            {renderAccountItem(
              <BuildingIcon size={20} color={accentColor} />,
              t`BU`,
              userInfo?.BU
            )}
            {renderAccountItem(
              <HashIcon size={20} color={accentColor} />,
              t`GGID`,
              userInfo?.ggid
            )}
          </View>
        </View>

        {/* General Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: secondaryText }]}>{t`General`}</Text>
          <View style={[styles.sectionContent, { backgroundColor: surfaceColor, borderColor }]}>
            {/* Language */}
            <View style={styles.languageSection}>
              <View style={styles.languageLabelRow}>
                <View style={[styles.settingsIconWrapper, { backgroundColor: backgroundColor }]}>
                  <LanguageIcon size={20} color={accentColor} />
                </View>
                <Text style={[styles.settingsLabel, { color: textColor }]}>{t`Language`}</Text>
              </View>
              <View style={styles.languageOptions}>
                {renderLanguageOption('auto', t`Auto Detect`)}
                {renderLanguageOption('en', 'English')}
                {renderLanguageOption('de', 'Deutsch')}
                {renderLanguageOption('es', 'Español')}
                {renderLanguageOption('fr', 'Français')}
                {renderLanguageOption('pl', 'Polski')}
              </View>
            </View>

            {/* Theme */}
            <View style={styles.themeSection}>
              <View style={styles.themeLabelRow}>
                <View style={[styles.settingsIconWrapper, { backgroundColor: backgroundColor }]}>
                  {isDarkTheme ? (
                    <MoonIcon size={20} color={accentColor} />
                  ) : (
                    <SunIcon size={20} color={accentColor} />
                  )}
                </View>
                <Text style={[styles.settingsLabel, { color: textColor }]}>{t`Theme`}</Text>
              </View>
              <View style={styles.themeOptions}>
                {renderThemeOption('light', t`Light`, <SunIcon size={16} color={theme === 'light' ? '#ffffff' : textColor} />)}
                {renderThemeOption('dark', t`Dark`, <MoonIcon size={16} color={theme === 'dark' ? '#ffffff' : textColor} />)}
                {renderThemeOption('system', t`System default`, <SettingsIcon size={16} color={theme === 'system' ? '#ffffff' : textColor} />)}
              </View>
            </View>

            {/* Delete All Chats */}
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={handleDeleteAllChats}
              activeOpacity={0.7}
              disabled={isDeleting}
            >
              <View style={[styles.settingsIconWrapper, { backgroundColor: backgroundColor }]}>
                <TrashIcon size={20} color={dangerColor} />
              </View>
              <View style={styles.settingsRowContent}>
                <Text style={[styles.settingsLabel, { color: dangerColor }]}>
                  {t`Delete all chats`}
                </Text>
                {isDeleting && (
                  <ActivityIndicator size="small" color={dangerColor} />
                )}
              </View>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity
              style={[styles.settingsRow, styles.lastRow]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={[styles.settingsIconWrapper, { backgroundColor: backgroundColor }]}>
                <LogoutIcon size={20} color={dangerColor} />
              </View>
              <View style={styles.settingsRowContent}>
                <Text style={[styles.settingsLabel, { color: dangerColor }]}>{t`Log out`}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Help & Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: secondaryText }]}>{t`Help & Support`}</Text>
          <View style={[styles.sectionContent, { backgroundColor: surfaceColor, borderColor }]}>
            {/* Support */}
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={handleSupportPress}
              activeOpacity={0.7}
            >
              <View style={[styles.settingsIconWrapper, { backgroundColor: backgroundColor }]}>
                <InfoIcon size={20} color={accentColor} />
              </View>
              <View style={styles.settingsRowContent}>
                <Text style={[styles.settingsLabel, { color: textColor }]}>{t`Support`}</Text>
                <ChevronRightIcon size={20} color={secondaryText} />
              </View>
            </TouchableOpacity>

            {/* Report an Issue */}
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={handleReportIssuePress}
              activeOpacity={0.7}
            >
              <View style={[styles.settingsIconWrapper, { backgroundColor: backgroundColor }]}>
                <IssueIcon size={20} color={accentColor} />
              </View>
              <View style={styles.settingsRowContent}>
                <Text style={[styles.settingsLabel, { color: textColor }]}>{t`Report an issue`}</Text>
                <ChevronRightIcon size={20} color={secondaryText} />
              </View>
            </TouchableOpacity>

            {/* Terms & Policies */}
            <TouchableOpacity
              style={[styles.settingsRow, styles.lastRow]}
              onPress={handleTermsPress}
              activeOpacity={0.7}
            >
              <View style={[styles.settingsIconWrapper, { backgroundColor: backgroundColor }]}>
                <FileTextIcon size={20} color={accentColor} />
              </View>
              <View style={styles.settingsRowContent}>
                <Text style={[styles.settingsLabel, { color: textColor }]}>{t`Terms & policies`}</Text>
                <ChevronRightIcon size={20} color={secondaryText} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Version */}
        <Text style={[styles.versionText, { color: secondaryText }]}>
          Neo Mobile v1.0.0
        </Text>
      </ScrollView>
    </SlideoutDrawer>
  );
};

// Import SettingsIcon for theme option (avoiding circular dependency)
const SettingsIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.6, height: size * 0.6, borderRadius: size * 0.3, borderWidth: 1.5, borderColor: color }} />
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatar: {
    resizeMode: 'cover',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: '500',
  },
  loadingIndicator: {
    marginTop: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
  },
  profileJobTitle: {
    fontSize: 14,
    marginTop: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sectionContent: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  accountIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountItemContent: {
    flex: 1,
    gap: 2,
  },
  accountLabel: {
    fontSize: 12,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  settingsIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsRowContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingsValue: {
    fontSize: 14,
  },
  languageSection: {
    padding: 12,
  },
  languageLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginLeft: 48,
  },
  languageOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  languageOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  themeSection: {
    padding: 12,
  },
  themeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 48,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
  },
});
