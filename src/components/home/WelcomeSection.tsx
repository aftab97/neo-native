import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useLayoutStore } from '../../store';
import { useGetUser } from '../../api';
import { colors, gradients } from '../../theme/colors';

/**
 * Capitalize the first letter of each word in a name
 * e.g., "JOHN DOE" -> "John Doe", "john" -> "John"
 */
const formatName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Gradient text component for "Neo" branding
 */
const GradientNeoText: React.FC = () => (
  <MaskedView
    maskElement={
      <Text style={styles.neoTextMask}>Neo</Text>
    }
  >
    <LinearGradient
      colors={[gradients.neo[1], gradients.neo[0]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <Text style={[styles.neoTextMask, { opacity: 0 }]}>Neo</Text>
    </LinearGradient>
  </MaskedView>
);

export const WelcomeSection: React.FC = () => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const { data: user } = useGetUser();

  const textColor = isDarkTheme ? colors.gray['300'] : colors.gray['900'];
  const subtitleColor = isDarkTheme ? colors.gray['000'] : colors.gray['900'];

  const firstName = formatName(user?.firstname || '');
  const displayName = firstName || 'there';

  return (
    <View style={styles.container}>
      {/* Greeting line - lighter weight */}
      <View style={styles.greetingContainer}>
        <Text style={[styles.greeting, { color: textColor }]}>
          Hello {displayName}, welcome to{' '}
        </Text>
        <GradientNeoText />
      </View>

      {/* Subtitle - larger and bolder */}
      <Text style={[styles.subtitle, { color: subtitleColor }]}>
        Capgemini's Intelligence Platform
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  greetingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'baseline',
    paddingBottom: 4,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 28,
    textAlign: 'center',
  },
  neoTextMask: {
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 28,
  },
  gradientContainer: {
    // Container for the gradient behind the masked text
  },
  subtitle: {
    fontSize: 26,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 32,
    marginTop: 4,
  },
});
