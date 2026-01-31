# Authentication & Session

## Overview
IAP JWT token authentication with session management.

## Files
| File | Purpose |
|------|---------|
| `src/api/sessionToken.ts` | IAP JWT fetching, caching |
| `src/api/fetch.ts` | Auth headers injection |
| `src/store/sessionStore.ts` | Session state |

## Features

### IAP JWT Token
- 12-hour cache duration
- Pre-fetched on app startup
- Used for WebSocket authentication

### Session Management
- Session ID generated client-side
- Session expiration tracking
- Token refresh on expiry

## Token Flow

```
App Launch
    │
    ▼
getOrFetchJwt()
    │
    ├─ Cache hit? Return cached
    │
    └─ Cache miss? Fetch new token
         │
         ▼
    Store in cache with timestamp
```

## Edge Cases & Behaviors

### Don't Break These:

1. **Token cache duration**
   ```typescript
   const TOKEN_CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours
   ```

2. **Pre-fetch on startup**
   ```typescript
   // In App.tsx or provider
   useEffect(() => {
     getOrFetchJwt(); // Warm cache
   }, []);
   ```

3. **WebSocket auth**
   ```typescript
   io(API_BASE_URL, {
     auth: {
       session_id,
       user_id,
       iap: await getOrFetchJwt()
     }
   });
   ```

4. **Session ID persistence**
   ```typescript
   // Created on first chat/file upload
   const activeSessionId = currentSessionId || createSessionId();
   setCurrentSessionId(activeSessionId);
   ```

5. **Session expired handling**
   ```typescript
   if (sessionStore.sessionExpired) {
     // Show re-auth UI
   }
   ```

6. **Bearer token header**
   ```typescript
   headers: {
     'Authorization': `Bearer ${token}`,
   }
   ```

## Session ID Generation

```typescript
export const createSessionId = (): string => {
  return generateUUID(); // UUID v4
};
```

Session IDs are:
- Generated client-side
- Persisted in Zustand store
- Used as cache key partition
- Sent with all chat requests

## Security Headers

```typescript
{
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
  'Authorization': `Bearer ${iapToken}`, // When required
}
```
