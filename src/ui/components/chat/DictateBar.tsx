import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useLayoutStore } from '../../../store';
import { CloseIcon, CheckIcon } from '../../foundation/icons';
import { colors } from '../../foundation/colors/colors';

const NUM_BARS = 48;
const BAR_WIDTH = 3;
const BAR_GAP = 2;

interface DictateBarProps {
  audioLevels: number[];
  onCancel: () => void;
  onComplete: () => void;
}

export const DictateBar: React.FC<DictateBarProps> = ({
  audioLevels,
  onCancel,
  onComplete,
}) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const [cancelPressed, setCancelPressed] = useState(false);
  const [completePressed, setCompletePressed] = useState(false);

  // Theme colors matching web app
  const inactiveBarColor = isDarkTheme ? colors.gray['600'] : colors.gray['300'];
  const activeBarColor = isDarkTheme ? colors.gray['300'] : colors.gray['500'];

  // Icon colors matching web app's prompt-bar variant
  // Default: icon-secondary (light: gray-400, dark: gray-500)
  // Pressed/Hover: icon-default (light: gray-500, dark: gray-400)
  const iconColorDefault = isDarkTheme ? colors.gray['500'] : colors.gray['400'];
  const iconColorPressed = isDarkTheme ? colors.gray['400'] : colors.gray['500'];

  // Background on press matching web app's bg-subtle
  const bgSubtle = isDarkTheme ? colors.gray['800'] : colors.blue['100'];

  // Ensure we have the right number of levels
  const levels = audioLevels.length === NUM_BARS
    ? audioLevels
    : Array(NUM_BARS).fill(8);

  return (
    <View style={styles.container}>
      {/* Waveform */}
      <View style={styles.waveformContainer}>
        {/* Background (inactive) bars */}
        <View style={styles.barsContainer}>
          {Array.from({ length: NUM_BARS }).map((_, i) => (
            <View
              key={`bg-${i}`}
              style={[
                styles.bar,
                styles.backgroundBar,
                { backgroundColor: inactiveBarColor },
              ]}
            />
          ))}
        </View>
        {/* Foreground (active) bars */}
        <View style={[styles.barsContainer, styles.absoluteBars]}>
          {levels.map((level, i) => (
            <View
              key={`fg-${i}`}
              style={[
                styles.bar,
                {
                  backgroundColor: activeBarColor,
                  height: Math.min(Math.max(level, 4), 16),
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Cancel Button - matches web app prompt-bar variant */}
      <Pressable
        style={[
          styles.controlButton,
          cancelPressed && { backgroundColor: bgSubtle },
        ]}
        onPress={onCancel}
        onPressIn={() => setCancelPressed(true)}
        onPressOut={() => setCancelPressed(false)}
        accessibilityLabel="Cancel dictation"
        accessibilityRole="button"
      >
        <CloseIcon
          size={24}
          color={cancelPressed ? iconColorPressed : iconColorDefault}
        />
      </Pressable>

      {/* Complete Button - matches web app prompt-bar variant */}
      <Pressable
        style={[
          styles.controlButton,
          completePressed && { backgroundColor: bgSubtle },
        ]}
        onPress={onComplete}
        onPressIn={() => setCompletePressed(true)}
        onPressOut={() => setCompletePressed(false)}
        accessibilityLabel="Complete dictation"
        accessibilityRole="button"
      >
        <CheckIcon
          size={24}
          color={completePressed ? iconColorPressed : iconColorDefault}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4, // Match gap on left side
    gap: 4, // gap-[0.25rem] = 4px
  },
  waveformContainer: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BAR_GAP,
    height: '100%',
  },
  absoluteBars: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 2,
  },
  backgroundBar: {
    height: 8,
    minHeight: 4,
    maxHeight: 8,
  },
  controlButton: {
    width: 40, // p-2 (8px) * 2 + icon size (24) = 40
    height: 40,
    borderRadius: 20, // rounded-full
    alignItems: 'center',
    justifyContent: 'center',
  },
});
