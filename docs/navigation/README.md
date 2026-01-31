# Navigation & Routing

## Overview
React Navigation with Drawer + Stack pattern.

## Files
| File | Purpose |
|------|---------|
| `src/routes/RootNavigator.tsx` | Main navigator setup |
| `src/routes/types.ts` | Navigation types |

## Structure

```
DrawerNavigator
└── StackNavigator
    ├── Home (HomeScreen)
    ├── Chat (ChatScreen)
    ├── Agent (AgentScreen)
    ├── Support (SupportScreen)
    └── Terms (TermsScreen)
```

## Screen Parameters

### Chat Screen
```typescript
type ChatScreenParams = {
  sessionId?: string;  // Load specific session
  agent?: string;      // Agent context
};
```

### Agent Screen
```typescript
type AgentScreenParams = {
  agentId: string;  // Required agent ID
};
```

### Others
- Home, Support, Terms: No params

## Navigation Patterns

### From Homepage to Chat
```typescript
// User sends message from homepage
navigation.navigate('Chat');  // No params, uses ['chat'] cache
```

### From Agent Card to Agent
```typescript
resetForAgent(agent.id);
navigation.navigate('Agent', { agentId: agent.id });
```

### From History to Chat
```typescript
navigation.navigate('Chat', { sessionId: item.session_id });
```

## Edge Cases & Behaviors

### Don't Break These:

1. **Route context determination**
   ```typescript
   const hasRouteContext = routeAgent !== undefined || routeSessionId !== undefined;
   const useGeneralChat = !hasRouteContext;
   ```
   Homepage = no route params = general chat.

2. **Session ID from route vs store**
   ```typescript
   const activeSessionId = routeSessionId || currentSessionId;
   ```
   Route params take precedence.

3. **Clear agent on history navigation**
   ```typescript
   if (routeSessionId) {
     setCurrentSessionId(routeSessionId);
     setSelectedAgent(null);  // Clear to fix highlighting
   }
   ```

4. **Live chat key derived from context**
   ```typescript
   const liveChatKey = routeSessionId
     ? queryKeys.chatById(routeSessionId)
     : useGeneralChat
     ? queryKeys.chat()
     : queryKeys.chat(activeAgent || undefined);
   ```

5. **Drawer content navigation**
   ```typescript
   navigation.navigate('Chat', { sessionId: item.session_id });
   navigation.closeDrawer();
   ```

## Drawer Configuration

### Custom Drawer Content
- Chat history list (infinite scroll)
- Agent list (RBAC filtered)
- Notifications
- Settings slideout
- Sign out

### Header Configuration
- Custom Header component
- Menu button opens drawer
- Stock price button (optional)
