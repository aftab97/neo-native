import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Main stack params
export type MainStackParamList = {
  Home: undefined;
  Chat: { sessionId?: string; agent?: string };
  Agent: { agentId: string };
};

// Drawer params
export type DrawerParamList = {
  Main: NavigatorScreenParams<MainStackParamList>;
};

// Screen props types
export type HomeScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParamList, 'Home'>,
  DrawerScreenProps<DrawerParamList>
>;

export type ChatScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParamList, 'Chat'>,
  DrawerScreenProps<DrawerParamList>
>;

export type AgentScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParamList, 'Agent'>,
  DrawerScreenProps<DrawerParamList>
>;

// Navigation prop type for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends MainStackParamList {}
  }
}
