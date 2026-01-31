import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { t } from 'ttag';
import { useLayoutStore } from '../../../store';
import { ShuffleIcon } from '../../foundation/icons';
import { colors } from '../../foundation/colors/colors';

/**
 * Custom hook to persist the last non-empty status
 * This ensures the routing status remains visible after SSE streaming completes
 */
const usePersistedStatus = (status?: string[]): string[] => {
  const persistedStatusRef = useRef<string[]>([]);

  useEffect(() => {
    // Only update persisted status if we have new status items
    if (status && status.length > 0) {
      persistedStatusRef.current = status;
    }
  }, [status]);

  // Return current status if available, otherwise return persisted status
  return (status && status.length > 0) ? status : persistedStatusRef.current;
};

/**
 * Animated ellipsis component for loading states
 */
const AnimatedEllipsis: React.FC = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return <Text>{dots}</Text>;
};

/**
 * Check if a value indicates web search
 */
const isWebSearchValue = (value?: string): boolean => {
  return (value ?? '').trim().toLowerCase().includes('websearch');
};

/**
 * Check if metadata has HTTP sources
 */
const hasHttpSources = (metadata?: Record<string, any> | null): boolean => {
  const sources = metadata?.sources;
  if (!Array.isArray(sources) || sources.length === 0) return false;

  return sources.some((s: any) => {
    const url = typeof s === 'string' ? s : s?.source_url || s?.url;
    return typeof url === 'string' && /^https?:\/\//i.test(url);
  });
};

/**
 * Check if this is a web search message
 */
const isWebSearchMessage = ({
  backend,
  agent,
  metadata,
  status,
}: {
  backend?: string;
  agent?: string;
  metadata?: Record<string, any> | null;
  status?: string[];
}): boolean => {
  const backendIsWeb = isWebSearchValue(backend);
  const agentIsWeb = isWebSearchValue(agent);
  const statusMentionsWeb = Array.isArray(status)
    ? status.some((s) => isWebSearchValue(s))
    : false;
  const hasSources = hasHttpSources(metadata);

  return (backendIsWeb || agentIsWeb || statusMentionsWeb) && hasSources;
};

interface RoutingStatusProps {
  status?: string[];
  backend?: string;
  agent?: string;
  metadata?: Record<string, any> | null;
}

/**
 * RoutingStatus component - expandable status display matching web app design
 * Shows shuffle icon with last status, expands to show all status items
 */
export const RoutingStatus: React.FC<RoutingStatusProps> = ({
  status,
  backend,
  agent,
  metadata,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  // Animation values
  const expandProgress = useSharedValue(0);

  // Persist status so it remains visible after SSE streaming completes
  const persistedStatus = usePersistedStatus(status);

  const web = isWebSearchMessage({ backend, agent, metadata, status: persistedStatus });

  // Theme colors
  const textColor = isDarkTheme ? colors.gray['300'] : colors.gray['600'];
  const iconBgColor = isDarkTheme ? colors.gray['800'] : colors.gray['200'];
  const iconColor = isDarkTheme ? colors.gray['400'] : colors.gray['500'];
  const hoverBgColor = isDarkTheme ? colors.gray['900'] : colors.gray['100'];
  const borderColor = isDarkTheme ? colors.gray['700'] : colors.gray['200'];
  const successColor = isDarkTheme ? colors.green['400'] : colors.green['700'];

  // Check if currently streaming (has live status updates)
  const isStreaming = status && status.length > 0;

  const displayStatus: string[] = Array.isArray(persistedStatus) ? persistedStatus : [];
  const statusCount = displayStatus.length;
  const hasDisplayStatus = statusCount > 0;
  const lastIndex = statusCount - 1;

  // Animated styles for expanded content
  const expandedAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: expandProgress.value,
      maxHeight: interpolate(expandProgress.value, [0, 1], [0, 500]),
      marginTop: interpolate(expandProgress.value, [0, 1], [0, 12]),
    };
  });

  const renderStatusLine = (statusText: string, showEllipsis: boolean) => {
    if ((statusText || '').toLowerCase().includes('neo is generating your answer')) {
      const base = statusText.replace(/\.*$/, '');
      return (
        <Text style={[styles.statusText, { color: textColor }]}>
          {base}
          {showEllipsis && isStreaming && <AnimatedEllipsis />}
        </Text>
      );
    }
    return <Text style={[styles.statusText, { color: textColor }]}>{statusText}</Text>;
  };

  const patchLastStatusLine = (value: string): string => {
    if (!web) return value;
    if ((value || '').toLowerCase().includes('answer generated')) {
      return 'Answer generated from Web Search';
    }
    return value;
  };

  const rawLastStatus = hasDisplayStatus ? displayStatus[lastIndex] : '';
  const displayLastStatus = patchLastStatusLine(rawLastStatus);

  const handlePress = () => {
    const toValue = expanded ? 0 : 1;

    // Animate expand/collapse
    expandProgress.value = withTiming(toValue, {
      duration: 450,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });

    setExpanded((prev) => !prev);
  };

  if (!hasDisplayStatus) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: expanded ? hoverBgColor : 'transparent' }]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityLabel={t`Routing Layer Status`}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
    >
      {/* Header row with icon and last status */}
      <View style={styles.headerRow}>
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <ShuffleIcon size={12} color={iconColor} />
        </View>
        <View style={styles.statusTextContainer}>
          {renderStatusLine(displayLastStatus, !expanded)}
        </View>
      </View>

      {/* Expanded content with animation */}
      <Animated.View style={[styles.expandedContainer, expandedAnimatedStyle]}>
        <View style={[styles.statusList, { borderLeftColor: borderColor }]}>
          {displayStatus.map((item, index) => {
            const text = index === lastIndex ? patchLastStatusLine(item) : item;
            const isLast = index === lastIndex;

            return (
              <Animated.Text
                key={`${index}-${text}`}
                style={[
                  styles.expandedStatusText,
                  { color: isLast ? successColor : textColor },
                ]}
              >
                {text}
              </Animated.Text>
            );
          })}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
  },
  expandedContainer: {
    paddingLeft: 10,
    overflow: 'hidden',
  },
  statusList: {
    borderLeftWidth: 1,
    paddingLeft: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 16,
  },
  expandedStatusText: {
    fontSize: 13,
  },
});
