import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLayoutStore } from '../../store';
import { useGetUser } from '../../api';

export const WelcomeSection: React.FC = () => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const { data: user } = useGetUser();

  const textColor = isDarkTheme ? '#ffffff' : '#21232c';
  const secondaryTextColor = isDarkTheme ? '#9ea6ae' : '#6e7a85';

  const firstName = user?.firstname || 'there';

  return (
    <View style={styles.container}>
      <Text style={[styles.greeting, { color: textColor }]}>
        Hello {firstName}, welcome to{' '}
        <Text style={styles.neoText}>Neo</Text>
      </Text>
      <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
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
  greeting: {
    fontSize: 24,
    fontWeight: '300',
    textAlign: 'center',
  },
  neoText: {
    fontWeight: '700',
    color: '#0158ab',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});
