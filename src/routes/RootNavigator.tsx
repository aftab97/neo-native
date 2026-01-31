import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useLayoutStore } from '../store';
import { DrawerContent } from '../ui/layout/DrawerContent';
import { Header } from '../ui/layout/Header';
import { HomeScreen } from '../pages/HomeScreen';
import { ChatScreen } from '../pages/ChatScreen';
import { AgentScreen } from '../pages/AgentScreen';
import { SupportScreen } from '../pages/SupportScreen';
import { TermsScreen } from '../pages/TermsScreen';
import type { MainStackParamList, DrawerParamList } from './types';

const Drawer = createDrawerNavigator<DrawerParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

const MainStack = () => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  return (
    <Stack.Navigator
      screenOptions={{
        header: (props) => <Header {...props} />,
        contentStyle: {
          backgroundColor: isDarkTheme ? '#17191f' : '#eceef0',
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Neo' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
      <Stack.Screen
        name="Agent"
        component={AgentScreen}
        options={{ title: 'Agent' }}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{ title: 'Support', headerShown: false }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ title: 'Terms & Policies', headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export const RootNavigator = () => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
          backgroundColor: isDarkTheme ? '#000000' : '#ffffff',
        },
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        swipeEnabled: true,
        swipeEdgeWidth: 50,
      }}
    >
      <Drawer.Screen name="Main" component={MainStack} />
    </Drawer.Navigator>
  );
};
