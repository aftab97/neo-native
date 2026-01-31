/**
 * Session Token Service
 * Handles fetching and storing the IAP JWT token for WebSocket authentication
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './fetch';
import { ENDPOINTS } from './config';

const IAP_JWT_KEY = 'iap-jwt';
const TOKEN_QUERY_KEY = ['sessionToken'];

interface SessionTokenResponse {
  httpOnlyTokenSet: boolean;
  jwt?: string;
  error?: any;
}

/**
 * Fetch session token from BFF and store it
 */
export const fetchAndStoreSessionToken = async (): Promise<string | null> => {
  try {
    console.log('[sessionToken] Fetching session token from BFF...');

    const response = await apiFetch(ENDPOINTS.ISSUE_SESSION_TOKEN, {
      method: 'POST',
    });

    if (!response.ok) {
      console.error('[sessionToken] Failed to fetch token:', response.status);
      return null;
    }

    const data: SessionTokenResponse = await response.json();

    if (data.jwt) {
      console.log('[sessionToken] Token received, storing...');
      await AsyncStorage.setItem(IAP_JWT_KEY, data.jwt);
      return data.jwt;
    }

    console.warn('[sessionToken] No JWT in response');
    return null;
  } catch (error) {
    console.error('[sessionToken] Error fetching token:', error);
    return null;
  }
};

/**
 * Get stored JWT from AsyncStorage
 */
export const getStoredJwt = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(IAP_JWT_KEY);
    return token;
  } catch (error) {
    console.error('[sessionToken] Error reading stored JWT:', error);
    return null;
  }
};

/**
 * Clear stored JWT
 */
export const clearStoredJwt = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(IAP_JWT_KEY);
    console.log('[sessionToken] JWT cleared');
  } catch (error) {
    console.error('[sessionToken] Error clearing JWT:', error);
  }
};

/**
 * Get JWT, fetching if not available
 */
export const getOrFetchJwt = async (): Promise<string | null> => {
  // First try to get from storage
  let token = await getStoredJwt();

  if (token) {
    console.log('[sessionToken] Using stored token');
    return token;
  }

  // If not stored, fetch from BFF
  console.log('[sessionToken] No stored token, fetching...');
  token = await fetchAndStoreSessionToken();
  return token;
};

/**
 * Hook to manage session token
 */
export const useSessionToken = () => {
  const queryClient = useQueryClient();

  // Query to get current token
  const tokenQuery = useQuery({
    queryKey: TOKEN_QUERY_KEY,
    queryFn: getOrFetchJwt,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 12, // 12 hours
  });

  // Mutation to refresh token
  const refreshMutation = useMutation({
    mutationFn: fetchAndStoreSessionToken,
    onSuccess: (token) => {
      queryClient.setQueryData(TOKEN_QUERY_KEY, token);
    },
  });

  return {
    token: tokenQuery.data,
    isLoading: tokenQuery.isLoading,
    error: tokenQuery.error,
    refresh: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
  };
};

/**
 * Synchronous getter for use in socket.io auth
 * Returns cached token from query client or null
 */
export const getJwtSync = (queryClient: any): string | null => {
  try {
    return queryClient.getQueryData(TOKEN_QUERY_KEY) || null;
  } catch {
    return null;
  }
};
