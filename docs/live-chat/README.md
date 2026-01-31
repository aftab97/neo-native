# Live Chat (WebSocket)

## Overview
Real-time WebSocket communication with live agents via socket.io-client.

## Files
| File | Purpose |
|------|---------|
| `src/api/liveChat.ts` | Socket connection, event handlers, message routing |
| `src/hooks/useLiveChatListener.ts` | Auto-connect on trigger, lifecycle management |

## Features

### Connection Management
- Socket pooling via `socketMap` (reuses connections)
- IAP JWT token authentication
- Auto-reconnection with exponential backoff (5 attempts)
- Strict connect mode - only connects on explicit trigger

### Message Types
| Type | Description |
|------|-------------|
| `livechat: 'start'` | Live chat session initiated |
| `livechat: 'end'` | Session ended, triggers cleanup |
| `type: 'text'` | Regular text message |
| `type: 'card'` | Interactive card |

### Connection State
Published to query cache for reactive updates:
```typescript
queryClient.setQueryData(
  ['liveChatConnection', sessionId],
  { connected: true/false, socketId, at: Date.now() }
);
```

## Edge Cases & Behaviors

### Don't Break These:

1. **Trigger validation**
   ```typescript
   const MAX_TRIGGER_AGE_MS = 15000;
   const ALLOWED_START_TYPES = ['legacy', 'metadata', 'init_suffix', 'wait_phrase', 'high_volume', 'join', 'heuristic'];
   ```
   Triggers older than 15s are ignored.

2. **Connection attempt rate limiting**
   ```typescript
   if (connectionAttemptRef.current?.sessionId === sessionId &&
       now - connectionAttemptRef.current.attemptedAt < 10000) {
     return; // Skip - recent attempt already made
   }
   ```
   10-second cooldown per session.

3. **Session change handling**
   ```typescript
   if (prevSessionId && prevSessionId !== sessionId) {
     // Use stored socket reference (not via API)
     const socket = activeSocketRef.current;
     if (socket?.connected) {
       socket.emit('user_message', { message: 'cancel', ... });
       socket.disconnect();
     }
   }
   ```
   Sends 'cancel' and disconnects old session.

4. **Chat key for message routing**
   ```typescript
   const chatKey = raw?.chatKey; // Stored during connect
   addLiveChatMessage(queryClient, sid, payload.text, status, chatKey);
   ```
   Messages routed to correct cache key.

5. **Trigger cleanup on disconnect**
   ```typescript
   queryClient.removeQueries({
     queryKey: ['liveChatTrigger', sessionId],
     exact: true,
   });
   ```
   Prevents reconnection attempts.

6. **Direct socket reference**
   ```typescript
   const activeSocketRef = useRef<Socket | null>(null);
   // Stored on connect event
   socket.on?.('connect', onConnect) => {
     activeSocketRef.current = socket;
   }
   ```
   Allows access after sessionId changes.

7. **Navigation cleanup**
   ```typescript
   useFocusEffect(
     useCallback(() => {
       return () => {
         sendCancelIfActive(); // Screen lost focus
       };
     }, [sendCancelIfActive])
   );
   ```
   Disconnects when navigating away.

### Fallback Trigger Promotion
```typescript
function ensureLiveChatTrigger(queryClient, sessionId) {
  const foundStart = chatHistory.find((m) => m?.isLiveChatStart);
  if (foundStart && !trigger) {
    queryClient.setQueryData(triggerKey, { ... });
  }
}
```
Checks chat history for live chat start marker every 1 second.

### Agent Join Detection
```typescript
if (/agent\s+has\s+joined/i.test(payload.text || '')) {
  addLiveChatMessage(queryClient, sid, payload.text, [
    'Live Chat: Routing',
    'Live Chat: Agent Found',
    'Live Chat: Connecting',
    'Live Chat: Connected',
    'Live Chat: Agent',
  ], chatKey);
  notifyLiveAgentMessage(payload.text, sid);
}
```

### Socket Configuration
```typescript
io(API_BASE_URL, {
  auth: { session_id, user_id, iap: iapToken },
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
  timeout: 20000,
  extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
});
```

## API Contract

### Connection Auth
```typescript
{
  session_id: string,
  user_id: string,
  iap: string  // JWT token
}
```

### User Message Event
```typescript
socket.emit('user_message', {
  event: 'user_message',
  user_id: string,
  message: string,
  session_id: string,
  original_session_id?: string
});
```

### Bot Response Event
```typescript
socket.on('bot_response', (payload) => {
  // payload.livechat: 'start' | 'end' | undefined
  // payload.type: 'text' | 'card'
  // payload.text: string
  // payload.session_id: string
});
```
