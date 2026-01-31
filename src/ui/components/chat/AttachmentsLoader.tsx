import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AttachmentsLoaderProps {
  size?: number;
}

export const AttachmentsLoader: React.FC<AttachmentsLoaderProps> = ({ size = 24 }) => {
  const strokeDashoffset = useSharedValue(125.6);

  useEffect(() => {
    strokeDashoffset.value = withRepeat(
      withTiming(0, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1, // Infinite repeat
      false // Don't reverse
    );
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 44 44">
        {/* Background circle (track) */}
        <Circle
          cx="22"
          cy="22"
          r="20"
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
        />
        {/* Animated progress circle */}
        <AnimatedCircle
          cx="22"
          cy="22"
          r="20"
          fill="none"
          stroke="#1773cf"
          strokeWidth="4"
          strokeDasharray="125.6"
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
