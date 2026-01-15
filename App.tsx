import './global.css';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Providers } from './src/providers';
import { RootNavigator } from './src/navigation';
import { ToastContainer } from './src/components/ui';
import { useLayoutStore } from './src/store';

const AppContent: React.FC = () => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const backgroundColor = isDarkTheme ? '#17191f' : '#eceef0';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <RootNavigator />
      <ToastContainer />
    </View>
  );
};

export default function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
