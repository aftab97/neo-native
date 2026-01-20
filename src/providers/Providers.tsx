import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '../api/queryClient';
import { useLayoutStore } from '../store';
import { fetchAndStoreSessionToken } from '../api/sessionToken';
import { configureNotifications } from '../utils/notifications';
import { LocaleProvider } from './LocaleProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const updateSystemTheme = useLayoutStore((state) => state.updateSystemTheme);
  const systemColorScheme = useColorScheme();

  // Sync system color scheme with store
  useEffect(() => {
    updateSystemTheme(systemColorScheme);
  }, [systemColorScheme, updateSystemTheme]);

  // Initialize app services on startup
  useEffect(() => {
    // Pre-fetch session token for live chat authentication
    fetchAndStoreSessionToken().then((token) => {
      if (token) {
        console.log('[Providers] Session token pre-fetched successfully');
      } else {
        console.warn('[Providers] Could not pre-fetch session token');
      }
    });

    // Configure notifications for live chat background messages
    configureNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <LocaleProvider>
            <NavigationContainer>
              <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
              {children}
            </NavigationContainer>
          </LocaleProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
