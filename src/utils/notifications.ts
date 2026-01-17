/**
 * Notification utilities for live chat background messages
 */

import * as Notifications from "expo-notifications";
import { AppState, AppStateStatus, Platform } from "react-native";

// Track current app state
let currentAppState: AppStateStatus = AppState.currentState;

// Initialize app state listener
AppState.addEventListener("change", (nextState) => {
  currentAppState = nextState;
});

/**
 * Check if app is currently in background
 */
export function isAppInBackground(): boolean {
  return currentAppState === "background" || currentAppState === "inactive";
}

/**
 * Configure notification handler behavior
 * Call this once at app startup
 */
export async function configureNotifications(): Promise<void> {
  // Set how notifications should be handled when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[notifications] Permission not granted");
    return;
  }

  // Configure notification channel for Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("live-chat", {
      name: "Live Chat",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0158ab",
    });
  }
}

/**
 * Show a local notification for a live chat message
 */
export async function showLiveChatNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.warn("[notifications] Failed to show notification:", error);
  }
}

/**
 * Show notification for live agent message (only when app is in background)
 */
export async function notifyLiveAgentMessage(
  message: string,
  sessionId?: string
): Promise<void> {
  if (!isAppInBackground()) {
    return; // Don't show notification if app is in foreground
  }

  // Truncate long messages
  const truncatedMessage =
    message.length > 200 ? message.substring(0, 197) + "..." : message;

  await showLiveChatNotification("Live Agent", truncatedMessage, {
    sessionId,
    type: "live_chat_message",
  });
}
