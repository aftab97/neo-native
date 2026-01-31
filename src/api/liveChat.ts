/**
 * Live Chat API - WebSocket-based real-time chat with live agents
 * Based on neo3-ui/src/api/live-chat/live-chat.tsx
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient, QueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from './config';
import { ChatMessage, ChatContentType } from '../types/chat';
import { createMessageId } from '../tools/parseStream';
import { getOrFetchJwt, getJwtSync } from './sessionToken';
import { notifyLiveAgentMessage } from '../tools/notifications';

// Logging helpers
const lcLog = (...args: any[]) => console.log('[livechat]', ...args);
const lcWarn = (...args: any[]) => console.warn('[livechat]', ...args);
const lcError = (...args: any[]) => console.error('[livechat]', ...args);

export { lcLog, lcWarn, lcError };

export interface LiveChatCache {
  messages?: any[];
  user_id?: string;
  session_id?: string;
  hasConnectedOnce?: boolean;
  wasDisconnected?: boolean;
  connectionError?: boolean;
  sessionStartTime?: string | null;
  sessionEndTime?: string | null;
  initAgentMessageRecieved?: boolean;
  displayFirstAgentMessage?: boolean;
  latestStatus?: unknown;
  endLiveChat?: ((duration: string) => void) | undefined;
  activeLiveChatSession?: unknown;
  initAgentPayload?: any;
  /** The chat cache key to write messages to */
  chatKey?: readonly unknown[];
}

// Shared socket map for connection reuse
const socketMap = new Map<string, Socket | null>();
const listenerAttached = new Set<string>();

const makeKey = (session?: string, user?: string) =>
  `${session ?? 'no-session'}::${user ?? 'no-user'}`;

type SetRaw = (patch: Partial<LiveChatCache> | ((prev?: LiveChatCache) => Partial<LiveChatCache>)) => void;
type GetWithSocket = () => LiveChatCache & { socket?: Socket | null };

interface HandlersArgs {
  set: SetRaw;
  get: GetWithSocket;
  queryClient: QueryClient;
}

/**
 * Determine the correct chat cache key based on session
 */
function chooseChatKeyForSession(sessionId?: string): readonly unknown[] {
  if (sessionId) {
    return ['chat', { id: sessionId }];
  }
  return ['chat'];
}

/**
 * Add a live chat message to the query cache
 */
function addLiveChatMessage(
  queryClient: QueryClient,
  sessionId: string,
  text: string,
  status: string[],
  explicitChatKey?: readonly unknown[]
) {
  // Use explicit chat key if provided, otherwise derive from session
  const targetKey = explicitChatKey || chooseChatKeyForSession(sessionId);

  lcLog('Adding message to cache key:', JSON.stringify(targetKey), 'text:', text.substring(0, 50));

  const existing = queryClient.getQueryData<ChatMessage[]>(targetKey) ?? [];

  // Calculate next order
  const maxOrder = existing.reduce(
    (max, msg) => (msg.order !== undefined ? Math.max(max, msg.order) : max),
    -1
  );

  const newMessage = {
    message: text,
    contents: text ? [{ type: ChatContentType.TEXT, content: text }] : [],
    role: 'live_chat_agent' as const,
    session_id: sessionId,
    user_id: createMessageId('user'),
    message_id: createMessageId('ai'),
    status,
    order: maxOrder + 1,
  };

  queryClient.setQueryData(targetKey, [...existing, newMessage]);

  lcLog('Message added, total messages:', existing.length + 1);
}

/**
 * Setup socket event listeners
 */
function setupSocketListeners(
  socket: Socket,
  { set, get, queryClient }: HandlersArgs
) {
  lcLog('Attaching listeners to socket', { id: socket.id });

  const safeSet = (patch: Partial<LiveChatCache> | ((prev?: LiveChatCache) => Partial<LiveChatCache>)) => {
    try {
      set(patch);
    } catch (e) {
      lcWarn('set error', e);
    }
  };

  // Connection events
  socket.on('connect', () => {
    (socket as any).__hasConnectedOnce = true;
    lcLog('socket connected', {
      id: socket.id,
      transport: socket.io?.engine?.transport?.name,
      readyState: socket.io?.engine?.readyState,
      url: API_BASE_URL,
    });
    safeSet({
      hasConnectedOnce: true,
      connectionError: false,
      wasDisconnected: false,
    });

    try {
      const sid = get()?.session_id || 'unknown';
      queryClient.setQueryData(
        ['liveChatConnection', sid],
        {
          connected: true,
          socketId: socket.id,
          at: Date.now(),
        }
      );
      // Invalidate to trigger re-renders
      queryClient.invalidateQueries({ queryKey: ['liveChatConnection', sid] });
      lcLog('Connection state set to CONNECTED for session:', sid);
    } catch {}
  });

  socket.on('disconnect', (reason) => {
    lcLog('socket disconnected', { reason, id: socket.id });
    safeSet({ wasDisconnected: true, hasConnectedOnce: false });

    const sessionId = get()?.session_id || 'unknown';

    // Clear the live chat trigger to prevent reconnection attempts
    try {
      queryClient.removeQueries({
        queryKey: ['liveChatTrigger', sessionId],
        exact: true,
      });
      lcLog('Trigger cleared on disconnect for session:', sessionId);
    } catch {}

    try {
      queryClient.setQueryData(
        ['liveChatConnection', sessionId],
        {
          connected: false,
          reason,
          socketId: socket.id,
          at: Date.now(),
        }
      );
      // Invalidate to trigger immediate re-renders
      queryClient.invalidateQueries({ queryKey: ['liveChatConnection', sessionId] });
      lcLog('Connection state set to DISCONNECTED for session:', sessionId);
    } catch {}
  });

  socket.on('error', (err) => {
    lcError('socket error', { err, id: socket.id });
    safeSet({ connectionError: true });
  });

  socket.on('reconnect_attempt', (attempt) => {
    lcLog('reconnect_attempt', { attempt, id: socket.id });
    safeSet({ connectionError: true });
  });

  socket.on('reconnect', (attempt) => {
    lcLog('reconnect success', { attempt, id: socket.id });
    safeSet({
      connectionError: false,
      hasConnectedOnce: true,
      wasDisconnected: false,
    });
  });

  socket.on('reconnect_error', (err) => {
    lcWarn('reconnect_error', { err, id: socket.id });
    safeSet({ connectionError: true });
  });

  socket.on('reconnect_failed', () => {
    lcWarn('reconnect_failed', { id: socket.id });
    safeSet({
      connectionError: true,
      wasDisconnected: true,
      hasConnectedOnce: false,
    });
  });

  socket.on('connect_error', (err) => {
    lcError('connect_error', {
      message: err.message,
      name: err.name,
      // @ts-ignore - socket.io error context
      context: (err as any).context,
      // @ts-ignore - socket.io error description
      description: (err as any).description,
      stack: err.stack?.substring(0, 500),
    });
    // Also log transport state
    lcError('Transport state at connect_error:', {
      readyState: socket.io?.engine?.readyState,
      transport: socket.io?.engine?.transport?.name,
    });
  });

  // Main bot_response handler
  socket.on('bot_response', (payload) => {
    lcLog('bot_response received:', JSON.stringify(payload).substring(0, 200));

    try {
      const raw = get();
      const sid = raw?.session_id || payload?.session_id || 'unknown';
      const chatKey = raw?.chatKey; // Use the stored chat key

      lcLog('bot_response context:', { sid, hasChatKey: !!chatKey, chatKey: JSON.stringify(chatKey) });

      if (payload?.livechat === 'start') {
        safeSet({ initAgentMessageRecieved: true, initAgentPayload: payload });
        if (payload?.text) {
          addLiveChatMessage(queryClient, sid, payload.text, [
            'Live Chat: Agent Requested',
            'Live Chat: Routing',
          ], chatKey);
        }
        return;
      }

      if (payload?.livechat === 'end') {
        lcLog('Live chat END received, cleaning up...');

        if (payload?.text) {
          addLiveChatMessage(queryClient, sid, payload.text, [
            'Live Chat: Connection Ended',
          ], chatKey);
        }

        // Clean up immediately (not after delay) to ensure isConnected() returns false
        try {
          socket.removeAllListeners();
          if (socket.io?.opts) socket.io.opts.reconnection = false;
          socket.disconnect();
          lcLog('Socket disconnected');
        } catch (e) {
          lcWarn('Error disconnecting socket:', e);
        }

        try {
          const usr = raw?.user_id ?? '';
          const key = makeKey(sid, usr);
          socketMap.delete(key);
          listenerAttached.delete(key);
          lcLog('Socket removed from map:', key);
        } catch {}

        // Clear the live chat trigger to prevent reconnection attempts
        try {
          queryClient.removeQueries({
            queryKey: ['liveChatTrigger', sid],
            exact: true,
          });
          lcLog('Live chat trigger cleared for session:', sid);
        } catch {}

        // Update connection status in query cache
        try {
          queryClient.setQueryData(
            ['liveChatConnection', sid],
            {
              connected: false,
              reason: 'livechat_end',
              at: Date.now(),
            }
          );
        } catch {}

        safeSet({
          wasDisconnected: true,
          initAgentMessageRecieved: false,
          activeLiveChatSession: null,
          hasConnectedOnce: false,
        });

        try {
          raw?.endLiveChat?.('00:00');
        } catch {}

        lcLog('Live chat cleanup completed');
        return;
      }

      // Regular message
      safeSet({ initAgentMessageRecieved: true });

      if (payload?.type === 'text') {
        if (/agent\s+has\s+joined/i.test(payload.text || '')) {
          addLiveChatMessage(queryClient, sid, payload.text, [
            'Live Chat: Routing',
            'Live Chat: Agent Found',
            'Live Chat: Connecting',
            'Live Chat: Connected',
            'Live Chat: Agent',
          ], chatKey);
          // Notify when agent joins (useful when app is in background)
          notifyLiveAgentMessage(payload.text, sid);
        } else {
          addLiveChatMessage(queryClient, sid, payload.text, ['Live Chat: Agent'], chatKey);
          // Show notification for agent messages when app is in background
          if (payload.text) {
            notifyLiveAgentMessage(payload.text, sid);
          }
        }
      } else if (payload?.type === 'card') {
        addLiveChatMessage(queryClient, sid, '[Interactive Card Received]', [
          'Live Chat: Card',
        ], chatKey);
        // Notify about card received
        notifyLiveAgentMessage('You received an interactive card from the agent', sid);
      } else {
        addLiveChatMessage(queryClient, sid, payload?.text ?? '', [
          'Live Chat: Agent',
        ], chatKey);
        // Show notification for other message types
        if (payload?.text) {
          notifyLiveAgentMessage(payload.text, sid);
        }
      }
    } catch (e) {
      lcWarn('bot_response handler error', e);
    }
  });
}

/**
 * Destroy socket for a given key
 */
function destroySocketForKey(localKey: string) {
  const s = socketMap.get(localKey);
  if (!s) {
    socketMap.delete(localKey);
    listenerAttached.delete(localKey);
    return;
  }
  try {
    if (s.io?.opts) s.io.opts.reconnection = false;
    s.removeAllListeners();
    s.disconnect();
  } catch (e) {
    lcWarn('destroySocketForKey error', e);
  }
  socketMap.delete(localKey);
  listenerAttached.delete(localKey);
}

export interface LiveChatApi {
  data: () => LiveChatCache;
  connect: (opts?: {
    session_id?: string;
    user_id?: string;
    endLiveChat?: (duration: string) => void;
    forceNew?: boolean;
    reason?: 'explicit-start' | 'manual';
    /** The chat cache key to write messages to */
    chatKey?: readonly unknown[];
  }) => Promise<LiveChatCache>;
  sendMessage: (
    message: string,
    opts?: { original_session_id?: string; includePublicUrls?: boolean }
  ) => boolean;
  disconnect: () => void;
  cleanUp: () => void;
  reconnectFresh: () => Promise<LiveChatCache>;
  isConnected: () => boolean;
  /** Set the chat cache key for message routing */
  setChatKey: (chatKey: readonly unknown[]) => void;
  _getSocket: () => Socket | null;
  _getRawCache: () => LiveChatCache;
  _setRawCache: SetRaw;
}

/**
 * Main hook for live chat WebSocket connection
 */
export const useLiveChatQuery = (
  session_id?: string | null,
  user_id?: string,
  endLiveChat?: (duration: string) => void,
  strictConnectOnly = false
): LiveChatApi => {
  const queryClient = useQueryClient();
  const localKey = useMemo(
    () => makeKey(session_id || '', user_id),
    [session_id, user_id]
  );
  const socketRef = useRef<Socket | null>(socketMap.get(localKey) ?? null);

  const queryKey = useMemo(
    () => ['liveChat', session_id ?? 'no-session', user_id ?? 'no-user'],
    [session_id, user_id]
  );

  const initialData: LiveChatCache = useMemo(
    () => ({
      messages: [],
      user_id: user_id ?? '',
      session_id: session_id ?? '',
      hasConnectedOnce: false,
      wasDisconnected: false,
      connectionError: false,
      sessionStartTime: null,
      sessionEndTime: null,
      initAgentMessageRecieved: false,
      displayFirstAgentMessage: true,
      latestStatus: undefined,
      endLiveChat,
      activeLiveChatSession: null,
      initAgentPayload: undefined,
    }),
    [session_id, user_id, endLiveChat]
  );

  const getRaw = useCallback(
    (): LiveChatCache =>
      queryClient.getQueryData<LiveChatCache>(queryKey) ?? initialData,
    [queryClient, queryKey, initialData]
  );

  const setRaw = useCallback(
    (
      patch:
        | Partial<LiveChatCache>
        | ((prev?: LiveChatCache) => Partial<LiveChatCache>)
    ) => {
      queryClient.setQueryData<LiveChatCache>(
        queryKey,
        (old?: LiveChatCache) => {
          const prev = old ?? initialData;
          const next = typeof patch === 'function' ? patch(prev) : patch;
          return { ...prev, ...next };
        }
      );
    },
    [queryClient, queryKey, initialData]
  );

  const getWithSocket = useCallback(() => {
    const raw = getRaw();
    const s = socketMap.get(localKey) ?? null;
    socketRef.current = s;
    return { ...raw, socket: s } as LiveChatCache & { socket?: Socket | null };
  }, [getRaw, localKey]);

  const getPublicData = useCallback(() => getRaw(), [getRaw]);

  const connect = useCallback(
    async (opts?: {
      session_id?: string;
      user_id?: string;
      endLiveChat?: (duration: string) => void;
      forceNew?: boolean;
      reason?: 'explicit-start' | 'manual';
      chatKey?: readonly unknown[];
    }) => {
      const sid = opts?.session_id ?? session_id;
      const uid = opts?.user_id ?? user_id;
      const endFn = opts?.endLiveChat ?? endLiveChat;
      const forceNew = !!opts?.forceNew;
      const reason = opts?.reason ?? 'manual';
      const chatKeyToUse = opts?.chatKey;

      lcLog('connect() called', {
        sid,
        uid,
        reason,
        forceNew,
        chatKey: JSON.stringify(chatKeyToUse),
      });

      if (!sid || !uid) {
        setRaw({ connectionError: true });
        throw new Error('Missing userId or sessionId. Cannot connect');
      }

      if (strictConnectOnly && reason !== 'explicit-start') {
        lcLog('Strict mode: connect ignored', { reason, sid, uid });
        return getPublicData();
      }

      if (forceNew) {
        lcLog('Force new socket requested');
        destroySocketForKey(localKey);
      }

      let existing = socketMap.get(localKey);
      lcLog('connect() socket state', {
        hasExisting: !!existing,
        existingConnected: existing?.connected,
      });

      if (existing?.connected) {
        socketRef.current = existing;
        setRaw({
          user_id: uid,
          session_id: sid,
          endLiveChat: endFn,
          connectionError: false,
          wasDisconnected: false,
          hasConnectedOnce: true,
          chatKey: chatKeyToUse,
        });
        return getPublicData();
      }

      if (existing && existing.io?.opts?.reconnection) {
        try {
          // Get IAP token for reconnection
          const iapToken = await getOrFetchJwt();
          (existing as any).auth = {
            session_id: sid,
            user_id: uid,
            iap: iapToken,
          };
          existing.io.opts.reconnection = true;
          existing.connect();
          lcLog('Reconnecting existing socket', { id: existing.id, hasIap: !!iapToken });
        } catch (e) {
          lcWarn('Reconnect error', e);
        }
        socketRef.current = existing;
        setRaw({
          user_id: uid,
          session_id: sid,
          endLiveChat: endFn,
          connectionError: !existing.connected,
          wasDisconnected: false,
          hasConnectedOnce: !!(existing as any).__hasConnectedOnce,
          chatKey: chatKeyToUse,
        });
        return getPublicData();
      }

      if (existing) {
        lcLog('Destroying stale socket', { id: existing.id });
        destroySocketForKey(localKey);
        existing = undefined;
      }

      // Create new socket connection
      // First, get the IAP JWT token for authentication
      lcLog('Fetching IAP JWT token...');
      const iapToken = await getOrFetchJwt();
      lcLog('IAP token obtained:', iapToken ? 'yes' : 'no');

      lcLog('========== CREATING NEW SOCKET CONNECTION ==========');
      lcLog('Target URL:', API_BASE_URL);
      lcLog('Socket.IO path (default):', '/socket.io/');
      lcLog('Auth params:', { session_id: sid, user_id: uid, hasIap: !!iapToken });
      lcLog('Headers:', { 'ngrok-skip-browser-warning': 'true' });
      lcLog('Transport:', 'websocket');
      lcLog('===================================================');

      const socket = io(API_BASE_URL, {
        auth: {
          session_id: sid,
          user_id: uid,
          iap: iapToken, // JWT token for IAP authentication
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        // Extra headers to bypass ngrok interstitial and for auth
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
        },
        // Timeout settings for debugging
        timeout: 20000,
        ...(forceNew ? { forceNew: true } : {}),
      });

      // Add raw transport-level debugging
      socket.io.on('error', (err) => {
        lcError('Transport-level error:', err);
      });

      socket.io.on('ping', () => {
        lcLog('Ping sent to server');
      });

      socket.io.on('reconnect_attempt', (attempt) => {
        lcLog('Transport reconnect attempt:', attempt);
      });

      (socket as any).__sid = sid;
      (socket as any).__uid = uid;

      socketMap.set(localKey, socket);
      socketRef.current = socket;

      setRaw({
        user_id: uid,
        session_id: sid,
        endLiveChat: endFn,
        connectionError: false,
        wasDisconnected: false,
        chatKey: chatKeyToUse,
      });

      lcLog('Created new socket instance', {
        reason,
        chatKey: JSON.stringify(chatKeyToUse),
        socketId: socket.id,
        connected: socket.connected,
        disconnected: socket.disconnected,
        nsp: socket.nsp,
      });

      // Log connection state after a short delay to see initial connection attempt
      setTimeout(() => {
        lcLog('Socket state after 2s:', {
          connected: socket.connected,
          disconnected: socket.disconnected,
          id: socket.id,
          hasEngine: !!socket.io?.engine,
          engineReadyState: socket.io?.engine?.readyState,
          transport: socket.io?.engine?.transport?.name,
        });
      }, 2000);

      // Log state after 5 seconds
      setTimeout(() => {
        lcLog('Socket state after 5s:', {
          connected: socket.connected,
          disconnected: socket.disconnected,
          id: socket.id,
          hasEngine: !!socket.io?.engine,
          engineReadyState: socket.io?.engine?.readyState,
          transport: socket.io?.engine?.transport?.name,
        });
      }, 5000);

      setupSocketListeners(socket, {
        set: setRaw,
        get: getWithSocket,
        queryClient,
      });
      listenerAttached.add(localKey);

      return getPublicData();
    },
    [
      endLiveChat,
      getPublicData,
      getWithSocket,
      localKey,
      queryClient,
      setRaw,
      session_id,
      user_id,
      strictConnectOnly,
    ]
  );

  const sendMessage = useCallback(
    (
      message: string,
      opts?: {
        original_session_id?: string;
        includePublicUrls?: boolean;
      }
    ) => {
      const state = getRaw();
      const socket = socketMap.get(localKey) ?? socketRef.current;

      if (!socket?.connected) {
        lcWarn('sendMessage aborted; socket not connected', {
          session: state.session_id,
          user: state.user_id,
        });
        return false;
      }

      const payload: any = {
        event: 'user_message',
        user_id: state.user_id,
        message,
        session_id: state.session_id,
      };

      if (opts?.original_session_id) {
        payload.original_session_id = opts.original_session_id;
      }

      try {
        socket.emit('user_message', payload, (ack?: { ok?: boolean }) => {
          lcLog('user_message ack', ack);
        });
      } catch (e) {
        lcWarn('socket emit error', e);
        return false;
      }

      return true;
    },
    [getRaw, localKey]
  );

  const cleanUp = useCallback(() => {
    const socket = socketMap.get(localKey) ?? socketRef.current;
    if (socket) {
      try {
        socket.io.opts.reconnection = false;
        socket.removeAllListeners();
        socket.disconnect();
      } catch (err) {
        lcWarn('Error during socket cleanup', err);
      } finally {
        socketMap.delete(localKey);
        listenerAttached.delete(localKey);
        socketRef.current = null;
      }
    }

    setRaw({
      hasConnectedOnce: false,
      connectionError: false,
      wasDisconnected: true,
      activeLiveChatSession: null,
    });
    lcLog('cleanup completed', { key: localKey });
  }, [localKey, setRaw]);

  const disconnect = useCallback(() => {
    lcLog('disconnect invoked', { key: localKey });
    cleanUp();
    setRaw({ wasDisconnected: true });
    const state = getRaw();
    state.endLiveChat?.('00:00');
  }, [cleanUp, getRaw, setRaw, localKey]);

  const reconnectFresh = useCallback(
    () =>
      connect({
        session_id: session_id ?? undefined,
        user_id,
        endLiveChat,
        forceNew: true,
        reason: strictConnectOnly ? 'explicit-start' : 'manual',
      }),
    [connect, session_id, user_id, endLiveChat, strictConnectOnly]
  );

  const isConnected = useCallback(() => {
    const socket = socketMap.get(localKey) ?? socketRef.current;
    return !!socket?.connected;
  }, [localKey]);

  // Set the chat key for message routing
  const setChatKey = useCallback(
    (chatKey: readonly unknown[]) => {
      lcLog('setChatKey:', JSON.stringify(chatKey));
      setRaw({ chatKey });
    },
    [setRaw]
  );

  // Update socket ref when localKey changes
  useEffect(() => {
    socketRef.current = socketMap.get(localKey) ?? null;
  }, [localKey]);

  return {
    data: getPublicData,
    connect,
    sendMessage,
    disconnect,
    cleanUp,
    reconnectFresh,
    isConnected,
    setChatKey,
    _getSocket: () => socketMap.get(localKey) ?? null,
    _getRawCache: getRaw,
    _setRawCache: setRaw,
  };
};
