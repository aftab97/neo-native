import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { useNavigation } from "@react-navigation/native";
import { useLayoutStore, useAgentStore } from "../../store";
import { useResetChat } from "../../hooks";
import { useGetChatTitles } from "../../api";
import { AGENTS } from "../../config/agents";

// Simple icon placeholders
const PlusIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>+</Text>
);

const ChatIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 16, color }}>💬</Text>
);

const AgentIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 16, color }}>🤖</Text>
);

export const DrawerContent: React.FC<DrawerContentComponentProps> = ({
  navigation: drawerNavigation,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const { selectedAgent } = useAgentStore();
  const { resetAll, resetForAgent } = useResetChat();
  const { data: chatTitles = [] } = useGetChatTitles();

  const backgroundColor = isDarkTheme ? "#000000" : "#ffffff";
  const textColor = isDarkTheme ? "#ffffff" : "#21232c";
  const secondaryTextColor = isDarkTheme ? "#9ea6ae" : "#6e7a85";
  const borderColor = isDarkTheme ? "#3a424a" : "#e0e3e6";
  const hoverBg = isDarkTheme ? "#21232c" : "#f4f5f6";
  const accentColor = "#0158ab";

  const handleNewChat = () => {
    // Reset chat cache and navigate to homepage
    resetAll();
    drawerNavigation.closeDrawer();
    navigation.navigate("Home");
  };

  const handleChatPress = (sessionId: string) => {
    // Don't reset - load the existing chat session
    drawerNavigation.closeDrawer();
    navigation.navigate("Chat", { sessionId });
  };

  const handleAgentPress = (agentId: string) => {
    // Reset the agent's chat cache (fresh start)
    resetForAgent(agentId);
    drawerNavigation.closeDrawer();
    navigation.navigate("Agent", { agentId });
  };

  return (
    <View
      style={[styles.container, { backgroundColor, paddingTop: insets.top }]}
    >
      {/* Logo / Brand */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Text style={[styles.logo, { color: textColor }]}>Neo</Text>
        <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
          Intelligence Platform
        </Text>
      </View>

      {/* New Chat Button */}
      <TouchableOpacity
        style={[styles.newChatButton, { backgroundColor: accentColor }]}
        onPress={handleNewChat}
        accessibilityLabel="Start new chat"
        accessibilityRole="button"
      >
        <PlusIcon color="#ffffff" />
        <Text style={styles.newChatText}>New Chat</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Recent Chats Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
            Recent Chats
          </Text>
          {chatTitles.length === 0 ? (
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              No recent chats
            </Text>
          ) : (
            chatTitles.slice(0, 10).map((chat) => (
              <TouchableOpacity
                key={chat.session_id}
                style={[styles.listItem, { backgroundColor: "transparent" }]}
                onPress={() => handleChatPress(chat.session_id)}
                accessibilityLabel={`Open chat: ${chat.title}`}
                accessibilityRole="button"
              >
                <ChatIcon color={secondaryTextColor} />
                <Text
                  style={[styles.listItemText, { color: textColor }]}
                  numberOfLines={1}
                >
                  {chat.title || "Untitled Chat"}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Agents Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
            Agents
          </Text>
          {AGENTS.slice(0, 8).map((agent) => (
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
              <AgentIcon color={secondaryTextColor} />
              <Text
                style={[styles.listItemText, { color: textColor }]}
                numberOfLines={1}
              >
                {agent.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: borderColor }]}>
        <Text style={[styles.footerText, { color: secondaryTextColor }]}>
          Neo Mobile v1.0.0
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  logo: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
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
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
  },
});
