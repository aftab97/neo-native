import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useLayoutStore } from "../../store";
import { useResetChat, useAvailableServices } from "../../hooks";
import { AGENTS } from "../../config/agents";
import { AgentMetadata } from "../../types/agent";
import { AnalystIcon, AgentLibraryLogo } from "../icons";
import { colors } from "../../theme/colors";

interface AgentCardItemProps {
  agent: AgentMetadata;
  onPress: () => void;
  isDarkTheme: boolean;
}

const AgentCardItem: React.FC<AgentCardItemProps> = ({
  agent,
  onPress,
  isDarkTheme,
}) => {
  const backgroundColor = isDarkTheme ? colors.gray['900'] : colors.gray['000'];
  const textColor = isDarkTheme ? colors.gray['000'] : colors.gray['900'];
  const secondaryTextColor = isDarkTheme ? colors.gray['400'] : colors.gray['500'];
  const borderColor = isDarkTheme ? colors.gray['800'] : colors.gray['200'];

  // Determine if this is an analyst agent (same logic as web app)
  const isAnalystAgent = agent.categoryName?.toLowerCase().includes('analyst');

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor, borderColor }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`Open ${agent.title} agent`}
      accessibilityRole="button"
    >
      <View style={styles.iconContainer}>
        {isAnalystAgent ? (
          <AnalystIcon size={48} />
        ) : (
          <AgentLibraryLogo size={48} />
        )}
      </View>
      <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
        {agent.title}
      </Text>
      <Text
        style={[styles.description, { color: secondaryTextColor }]}
        numberOfLines={2}
      >
        {agent.text}
      </Text>
    </TouchableOpacity>
  );
};

export const AgentCards: React.FC = () => {
  const navigation = useNavigation();
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const { resetForAgent } = useResetChat();
  const { services: availableServices } = useAvailableServices();

  // RBAC - filter agents based on user's available services
  const filteredAgents = useMemo(() => {
    // If no services available yet, show all agents (loading state)
    if (availableServices.length === 0) return AGENTS;
    // Filter agents to only those the user has access to
    return AGENTS.filter((agent) => availableServices.includes(agent.id));
  }, [availableServices]);

  const handleAgentPress = (agent: AgentMetadata) => {
    // Reset the agent's chat cache before navigating (fresh start)
    resetForAgent(agent.id);
    navigation.navigate("Agent", { agentId: agent.id });
  };

  const renderItem = ({ item }: { item: AgentMetadata }) => (
    <AgentCardItem
      agent={item}
      onPress={() => handleAgentPress(item)}
      isDarkTheme={isDarkTheme}
    />
  );

  const sectionTitleColor = isDarkTheme ? colors.gray['400'] : colors.gray['500'];

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
        Agents
      </Text>
      <FlatList
        data={filteredAgents}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        scrollEnabled={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  listContainer: {
    gap: 12,
  },
  row: {
    gap: 12,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 160,
  },
  iconContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16, // text-md (1rem / 16px)
    fontWeight: "400", // font-normal to match web
    marginBottom: 4,
  },
  description: {
    fontSize: 14, // text-sm (0.875rem / 14px) to match web
    lineHeight: 20,
  },
});
