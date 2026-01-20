import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { useNavigation } from "@react-navigation/native";
import { t } from "ttag";
import {
  useLayoutStore,
  useAgentStore,
  useNotificationStore,
} from "../../store";
import { useResetChat } from "../../hooks";
import { useGetChatTitles, useNotifications, useGetUser, useGetProfilePicture } from "../../api";
import { AGENTS } from "../../config/agents";
import {
  PlusIcon,
  ChatIcon,
  AgentIcon,
  NeoLogo,
  BellIcon,
  HistoryIcon,
  ChevronRightIcon,
} from "../icons";
import { NotificationCard } from "../notifications";
import { SettingsDrawer } from "../settings";
import { colors } from "../../theme/colors";

type TabType = "history" | "notifications";

export const DrawerContent: React.FC<DrawerContentComponentProps> = ({
  navigation: drawerNavigation,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const { selectedAgent } = useAgentStore();
  const { resetAll, resetForAgent } = useResetChat();
  const {
    data: chatTitles = [],
    refetch,
    isRefetching,
    isLoading: isLoadingChats,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetChatTitles();

  // Notifications
  const {
    data: notifications = [],
    isLoading: isLoadingNotifications,
    isRefetching: isRefetchingNotifications,
    refetch: refetchNotifications,
  } = useNotifications();
  const dismissedIds = useNotificationStore((state) => state.dismissedIds);
  const visibleNotifications = notifications.filter(
    (notification) => !dismissedIds.has(notification.id)
  );

  // User info for footer
  const { data: userInfo } = useGetUser();
  const { data: profilePictureData } = useGetProfilePicture();

  // Debug logging for notifications
  if (visibleNotifications.length > 0 || isLoadingNotifications) {
    console.log('[DrawerContent] Notifications:', visibleNotifications.length, 'visible,', isLoadingNotifications ? 'loading...' : 'loaded');
  }

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("history");
  const [showSettings, setShowSettings] = useState(false);

  // Theme colors
  const backgroundColor = isDarkTheme
    ? colors.gray["1000"]
    : colors.gray["000"];
  const textColor = isDarkTheme ? colors.gray["000"] : colors.gray["900"];
  const secondaryTextColor = isDarkTheme
    ? colors.gray["400"]
    : colors.gray["500"];
  const borderColor = isDarkTheme ? colors.gray["800"] : colors.gray["200"];
  const hoverBg = isDarkTheme ? colors.gray["900"] : colors.gray["050"];
  const accentColor = colors.blue["700"];
  const tabActiveBg = isDarkTheme ? colors.gray["800"] : colors.gray["100"];
  const tabInactiveBg = "transparent";

  const handleNewChat = () => {
    resetAll();
    drawerNavigation.closeDrawer();
    navigation.navigate("Home");
  };

  const handleChatPress = (sessionId: string) => {
    drawerNavigation.closeDrawer();
    navigation.navigate("Chat", { sessionId });
  };

  const handleAgentPress = (agentId: string) => {
    resetForAgent(agentId);
    drawerNavigation.closeDrawer();
    navigation.navigate("Agent", { agentId });
  };

  // Handler for loading more chats when scrolling near the bottom
  const handleChatsScroll = useCallback(
    (event: any) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const paddingToBottom = 50;
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

      if (isCloseToBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const renderHistoryTab = () => {
    const hasChats = chatTitles.length > 0;

    return (
      <View style={styles.scrollContainer}>
        {/* Recent Chats Section - dynamic height when empty, flex when has data */}
        <View
          style={[
            styles.section,
            hasChats && styles.sectionFlex,
          ]}
        >
          <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
            {t`Recent chats `}
          </Text>
          {isLoadingChats ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={accentColor} />
            </View>
          ) : !hasChats ? (
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              {t`No recent chats`}
            </Text>
          ) : (
            <ScrollView
              style={styles.sectionScrollView}
              showsVerticalScrollIndicator={false}
              onScroll={handleChatsScroll}
              scrollEventThrottle={400}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  tintColor={accentColor}
                  colors={[accentColor]}
                />
              }
            >
              {chatTitles.map((chat) => (
                <TouchableOpacity
                  key={chat.session_id}
                  style={[styles.listItem, { backgroundColor: "transparent" }]}
                  onPress={() => handleChatPress(chat.session_id)}
                  accessibilityLabel={`Open chat: ${chat.title}`}
                  accessibilityRole="button"
                >
                  <View style={styles.iconContainer}>
                    <ChatIcon size={18} color={secondaryTextColor} />
                  </View>
                  <Text
                    style={[styles.listItemText, { color: textColor }]}
                    numberOfLines={1}
                  >
                    {chat.title || t`Untitled Chat`}
                  </Text>
                </TouchableOpacity>
              ))}
              {isFetchingNextPage && (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color={accentColor} />
                </View>
              )}
            </ScrollView>
          )}
        </View>

      {/* Agents Section */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
          {t`Agents`}
        </Text>
        <ScrollView
          style={styles.sectionScrollView}
          showsVerticalScrollIndicator={false}
        >
          {AGENTS.map((agent) => (
            <TouchableOpacity
              key={agent.id}
              style={[
                styles.listItem,
                {
                  backgroundColor:
                    selectedAgent === agent.id ? hoverBg : "transparent",
                },
              ]}
              onPress={() => handleAgentPress(agent.id)}
              accessibilityLabel={`Open ${agent.label} agent`}
              accessibilityRole="button"
            >
              <View style={styles.iconContainer}>
                <AgentIcon type={agent.iconType} size={24} />
              </View>
              <Text
                style={[styles.listItemText, { color: textColor }]}
                numberOfLines={1}
              >
                {agent.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
    );
  };

  const renderNotificationsTab = () => (
    <ScrollView
      style={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.notificationsContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefetchingNotifications}
          onRefresh={refetchNotifications}
          tintColor={accentColor}
          colors={[accentColor]}
        />
      }
    >
      {isLoadingNotifications ? (
        <View style={styles.centerContent}>
          <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
            {t`Loading...`}
          </Text>
        </View>
      ) : visibleNotifications.length === 0 ? (
        <View style={styles.centerContent}>
          <BellIcon size={48} color={secondaryTextColor} />
          <Text
            style={[
              styles.emptyText,
              { color: secondaryTextColor, marginTop: 12 },
            ]}
          >
            {t`No notifications`}
          </Text>
          <Text
            style={[
              styles.emptySubtext,
              { color: secondaryTextColor, marginTop: 4 },
            ]}
          >
            {t`You're all caught up!`}
          </Text>
        </View>
      ) : (
        visibleNotifications.map((notification) => (
          <NotificationCard key={notification.id} {...notification} />
        ))
      )}
    </ScrollView>
  );

  return (
    <View
      style={[styles.container, { backgroundColor, paddingTop: insets.top }]}
    >
      {/* Logo / Brand */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <NeoLogo width={70} height={20} color={textColor} />
        <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
          {t`Capgemini's Intelligence Platform`}
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={[styles.tabContainer, { backgroundColor: hoverBg }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            {
              backgroundColor:
                activeTab === "history" ? tabActiveBg : tabInactiveBg,
            },
          ]}
          onPress={() => setActiveTab("history")}
          accessibilityLabel="History tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "history" }}
        >
          <HistoryIcon
            size={22}
            color={activeTab === "history" ? accentColor : secondaryTextColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            {
              backgroundColor:
                activeTab === "notifications" ? tabActiveBg : tabInactiveBg,
            },
          ]}
          onPress={() => setActiveTab("notifications")}
          accessibilityLabel="Notifications tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "notifications" }}
        >
          <View style={styles.tabIconContainer}>
            <BellIcon
              size={22}
              color={
                activeTab === "notifications" ? accentColor : secondaryTextColor
              }
            />
            {visibleNotifications.length > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.red["500"] }]}>
                <Text style={styles.badgeText}>
                  {visibleNotifications.length > 99
                    ? "99+"
                    : visibleNotifications.length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* New Chat Button */}
      <TouchableOpacity
        style={[styles.newChatButton, { backgroundColor: accentColor }]}
        onPress={handleNewChat}
        accessibilityLabel="Start new chat"
        accessibilityRole="button"
      >
        <PlusIcon size={20} color="#ffffff" />
        <Text style={styles.newChatText}>{t`New chat`}</Text>
      </TouchableOpacity>

      {/* Tab Content */}
      {activeTab === "history" ? renderHistoryTab() : renderNotificationsTab()}

      {/* Footer - Profile trigger for settings */}
      <TouchableOpacity
        style={[styles.footer, { borderTopColor: borderColor }]}
        onPress={() => setShowSettings(true)}
        activeOpacity={0.7}
        accessibilityLabel="Open settings"
        accessibilityRole="button"
      >
        <View style={styles.footerContent}>
          {/* Profile Picture */}
          {profilePictureData?.profilePicture ? (
            <Image
              source={{ uri: profilePictureData.profilePicture }}
              style={styles.footerAvatar}
            />
          ) : (
            <View
              style={[
                styles.footerAvatarFallback,
                {
                  backgroundColor: isDarkTheme
                    ? colors.gray["700"]
                    : colors.blue["100"],
                },
              ]}
            >
              <Text
                style={[
                  styles.footerAvatarText,
                  {
                    color: isDarkTheme
                      ? colors.gray["200"]
                      : colors.gray["700"],
                  },
                ]}
              >
                {getInitials(
                  `${userInfo?.firstname ?? ""} ${userInfo?.lastname ?? ""}`.trim() ||
                    undefined,
                  userInfo?.email
                )}
              </Text>
            </View>
          )}

          {/* Name */}
          <Text
            style={[styles.footerName, { color: textColor }]}
            numberOfLines={1}
          >
            {truncateName(formatName(userInfo?.firstname, userInfo?.lastname)) ||
              "User"}
          </Text>

          {/* Chevron */}
          <ChevronRightIcon size={20} color={secondaryTextColor} />
        </View>
      </TouchableOpacity>

      {/* Settings Drawer */}
      <SettingsDrawer
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </View>
  );
};

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
  return fallbackEmail ? fallbackEmail.slice(0, 2).toUpperCase() : "";
};

/**
 * Format name: First letter uppercase, rest lowercase
 */
const formatName = (firstname?: string, lastname?: string): string => {
  const formatPart = (part?: string): string => {
    if (!part) return "";
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  };
  return `${formatPart(firstname)} ${formatPart(lastname)}`.trim();
};

/**
 * Truncate name with ellipsis if too long
 */
const truncateName = (name: string, maxLength: number = 18): string => {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength - 3) + "..."
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: "row",
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  tabIconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  newChatText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionFlex: {
    flex: 1,
  },
  sectionContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionScrollView: {
    flex: 1,
  },
  iconContainer: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loadingFooter: {
    paddingVertical: 12,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
    gap: 12,
  },
  listItemText: {
    fontSize: 14,
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: "italic",
    paddingVertical: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: "center",
  },
  notificationsContainer: {
    padding: 16,
    gap: 16,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 9,
  },
  footerAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  footerAvatarText: {
    fontSize: 14,
    fontWeight: "500",
  },
  footerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
});
