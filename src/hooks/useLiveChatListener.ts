/**
 * Live Chat Listener Hook
 * Watches for live chat triggers in query cache and auto-connects
 * Based on neo3-ui/src/ui/components/prompt-bar/hooks/useLiveChatListener.ts
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { Socket } from 'socket.io-client';
import { useLiveChatQuery, lcLog, lcWarn } from '../api/liveChat';
import { queryKeys } from '../api/queryClient';

const MAX_TRIGGER_AGE_MS = 15000;
const ALLOWED_START_TYPES = [
  'legacy',
  'metadata',
  'init_suffix',
  'wait_phrase',
  'high_volume',
  'join',
  'heuristic',
];

interface LiveChatTrigger {
  liveSessionId?: string;
  message?: string;
  startType?: string;
  ts?: number;
}

function isValidTrigger(trigger: LiveChatTrigger | null | undefined): boolean {
  if (!trigger || typeof trigger !== 'object') return false;
  const { ts, startType, message } = trigger;
  if (typeof ts !== 'number') return false;
  if (!message || typeof message !== 'string') return false;
  // Allow legacy triggers missing startType
  if (!startType) return true;
  if (!ALLOWED_START_TYPES.includes(startType)) return false;
  if (Date.now() - ts > MAX_TRIGGER_AGE_MS) return false;
  return true;
}

/**
 * Fallback helper: Check chat history for a live chat start marker
 * and promote to trigger if not already set
 */
function ensureLiveChatTrigger(queryClient: any, sessionId: string) {
  const chatKey = queryKeys.chatById(sessionId);
  const chatHistory = queryClient.getQueryData(chatKey) || [];
  const triggerKey = ['liveChatTrigger', sessionId];
  const trigger = queryClient.getQueryData(triggerKey);

  // Find if a livechat start message exists in history
  const foundStart = chatHistory.find((m: any) => m?.isLiveChatStart);
  if (foundStart && !trigger) {
    queryClient.setQueryData(triggerKey, {
      liveSessionId: foundStart.isLiveChatStart.liveSessionId || sessionId,
      message: foundStart.isLiveChatStart.message,
      startType: foundStart.isLiveChatStart.startType || 'metadata',
      ts: Date.now(),
    });
    lcLog('[listener/fallback] Trigger promoted from chat history', {
      sessionId,
      trigger: queryClient.getQueryData(triggerKey),
    });
  }
}

/**
 * Hook to listen for live chat triggers and auto-connect
 * @param sessionId - The current session ID
 * @param chatKey - The chat cache key to write messages to (optional)
 */
export function useLiveChatListener(
  sessionId: string | null,
  chatKey?: readonly unknown[]
) {
  const qc = useQueryClient();

  // Query for the session-specific trigger
  const trigger = useQuery({
    queryKey: ['liveChatTrigger', sessionId],
    enabled: !!sessionId,
    staleTime: 0,
    queryFn: async () => {
      return qc.getQueryData<LiveChatTrigger>(['liveChatTrigger', sessionId]) ?? null;
    },
  }).data;

  // Periodically check if a trigger should exist
  useEffect(() => {
    if (!sessionId || trigger) return;

    const interval = setInterval(() => {
      ensureLiveChatTrigger(qc, sessionId);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, trigger, qc]);

  // Get user email from cache
  const user = qc.getQueryData<{ email?: string }>(queryKeys.user);
  const userId = user?.email ?? '';

  // Initialize live chat hook with strict connect mode
  const liveChat = useLiveChatQuery(sessionId || '', userId, undefined, true);

  const sessionIdRef = useRef(sessionId);
  const liveChatRef = useRef(liveChat);
  const prevSessionIdRef = useRef<string | null>(null);
  // Store direct socket reference so we can access it even after sessionId changes
  const activeSocketRef = useRef<Socket | null>(null);

  const connect = liveChat.connect;

  // Track connection attempts to prevent spam
  const connectionAttemptRef = useRef<{ sessionId: string; attemptedAt: number } | null>(null);

  // Auto-connect when valid trigger is detected
  useEffect(() => {
    // Only log when there's a trigger to reduce noise
    if (trigger) {
      lcLog('[listener] useEffect triggered with trigger', {
        sessionId,
        startType: trigger?.startType,
      });
    }

    if (!sessionId) {
      return;
    }
    if (!trigger) {
      return;
    }

    const valid = isValidTrigger(trigger);
    if (!valid) {
      lcWarn('[listener] Invalid trigger, skipping connect');
      return;
    }

    // Prevent repeated connection attempts for the same session within 10 seconds
    const now = Date.now();
    if (
      connectionAttemptRef.current?.sessionId === sessionId &&
      now - connectionAttemptRef.current.attemptedAt < 10000
    ) {
      lcLog('[listener] Skipping connect - recent attempt already made');
      return;
    }

    const socket = liveChat._getSocket?.();
    if (socket?.connected) {
      lcLog('[listener] socket already connected, clearing trigger');
      qc.removeQueries({
        queryKey: ['liveChatTrigger', sessionId],
        exact: true,
      });
      return;
    }

    // Record this connection attempt
    connectionAttemptRef.current = { sessionId, attemptedAt: now };

    lcLog('[listener] Attempting to connect with:', {
      sessionId,
      userId,
      chatKey: JSON.stringify(chatKey),
    });
    connect({
      session_id: sessionId,
      user_id: userId,
      forceNew: true,
      reason: 'explicit-start',
      chatKey,
    }).then(() => {
      lcLog('[listener] connect() promise resolved');
    }).catch((e) => {
      lcWarn('[listener] connect failed:', e?.message || e);
      // Clear trigger on connection failure to prevent retry spam
      qc.removeQueries({
        queryKey: ['liveChatTrigger', sessionId],
        exact: true,
      });
    });
  }, [sessionId, trigger, userId, connect, liveChat, qc, chatKey]);

  // Clear trigger after successful socket connect
  useEffect(() => {
    if (!sessionId) return;
    const socket = liveChat._getSocket?.();
    if (!socket) return;

    const onConnect = () => {
      lcLog('[listener] socket connected; clearing trigger', { sessionId });
      qc.removeQueries({
        queryKey: ['liveChatTrigger', sessionId],
        exact: true,
      });
    };

    socket.on?.('connect', onConnect);
    return () => {
      socket.off?.('connect', onConnect);
    };
  }, [liveChat, sessionId, qc]);

  // Update refs
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    liveChatRef.current = liveChat;
  }, [liveChat]);

  // Store direct socket reference when connected
  // This allows us to access the socket even after sessionId changes
  useEffect(() => {
    const socket = liveChat._getSocket?.();
    if (socket?.connected) {
      activeSocketRef.current = socket;
    }
  }, [liveChat]);

  // Also listen for connect events to capture socket reference
  useEffect(() => {
    const socket = liveChat._getSocket?.();
    if (!socket) return;

    const onConnect = () => {
      activeSocketRef.current = socket;
    };

    socket.on?.('connect', onConnect);
    return () => {
      socket.off?.('connect', onConnect);
    };
  }, [liveChat]);

  // Detect sessionId change (e.g., user clicked a different recent chat)
  // Disconnect previous session's live chat if it was active
  useEffect(() => {
    const prevSessionId = prevSessionIdRef.current;

    // If sessionId changed and there was a previous session
    if (prevSessionId && prevSessionId !== sessionId) {
      // Use the stored socket reference (not via API which uses new sessionId)
      const socket = activeSocketRef.current;

      if (socket?.connected) {
        try {
          // Send cancel message directly via socket
          socket.emit('user_message', {
            event: 'user_message',
            message: 'cancel',
            session_id: prevSessionId,
            user_id: userId,
          });
        } catch (e) {
          lcWarn('[session-change] emit error', e);
        }

        try {
          socket.disconnect();
        } catch (e) {
          lcWarn('[session-change] disconnect error', e);
        }

        // Clear the stored socket reference
        activeSocketRef.current = null;
      }
    }

    // Update the previous sessionId ref
    prevSessionIdRef.current = sessionId;
  }, [sessionId, userId]);

  // Cancel and disconnect helper
  const sendCancelIfActive = useCallback(() => {
    const sid = sessionIdRef.current;
    // Use stored socket reference for reliability
    const socket = activeSocketRef.current;

    if (!sid || !socket?.connected) {
      return;
    }

    try {
      socket.emit('user_message', {
        event: 'user_message',
        message: 'cancel',
        session_id: sid,
        user_id: userId,
      });
    } catch (e) {
      lcWarn('[cancel-on-exit] emit error', e);
    }

    try {
      socket.disconnect();
    } catch (e) {
      lcWarn('[cancel-on-exit] disconnect error', e);
    }

    // Clear the stored socket reference
    activeSocketRef.current = null;
  }, [userId]);

  // Handle navigation away (screen loses focus)
  // React Navigation keeps screens in memory, so we need to use focus/blur events
  useFocusEffect(
    useCallback(() => {
      // Screen is focused - nothing to do on focus
      return () => {
        // Screen lost focus (user navigated away) - disconnect live chat
        sendCancelIfActive();
      };
    }, [sendCancelIfActive])
  );

  // Cleanup on unmount (backup for when component actually unmounts)
  useEffect(() => {
    return () => {
      sendCancelIfActive();
    };
  }, [sendCancelIfActive]);

  return liveChat;
}

/**
 * Publish a live chat trigger to the query cache
 * Called from SSE parsing when live chat start is detected
 */
export function publishLiveChatTrigger(
  queryClient: any,
  sessionId: string,
  trigger: {
    liveSessionId?: string;
    message: string;
    startType: string;
  }
) {
  const triggerKey = ['liveChatTrigger', sessionId];
  const existingTrigger = queryClient.getQueryData(triggerKey);

  // Don't overwrite if already exists and identical
  if (
    existingTrigger &&
    existingTrigger.message === trigger.message &&
    existingTrigger.startType === trigger.startType
  ) {
    lcLog('[publish] Skipping trigger (already exists)', { sessionId });
    return false;
  }

  queryClient.setQueryData(triggerKey, {
    liveSessionId: trigger.liveSessionId || sessionId,
    message: trigger.message,
    startType: trigger.startType,
    ts: Date.now(),
  });

  lcLog('[publish] Trigger published', {
    sessionId,
    trigger: queryClient.getQueryData(triggerKey),
  });

  return true;
}
