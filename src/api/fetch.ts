import { API_BASE_URL } from '../config/api';
import { useSessionStore } from '../store';

type RequestInterceptor = (
  url: string,
  options: RequestInit
) => [string, RequestInit] | Promise<[string, RequestInit]>;

type ResponseInterceptor = (
  response: Response
) => Response | Promise<Response>;

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];

/**
 * Add a request interceptor
 * @returns Unsubscribe function
 */
export const addRequestInterceptor = (interceptor: RequestInterceptor) => {
  requestInterceptors.push(interceptor);
  return () => {
    const index = requestInterceptors.indexOf(interceptor);
    if (index > -1) requestInterceptors.splice(index, 1);
  };
};

/**
 * Add a response interceptor
 * @returns Unsubscribe function
 */
export const addResponseInterceptor = (interceptor: ResponseInterceptor) => {
  responseInterceptors.push(interceptor);
  return () => {
    const index = responseInterceptors.indexOf(interceptor);
    if (index > -1) responseInterceptors.splice(index, 1);
  };
};

// Default response interceptor for handling auth errors
addResponseInterceptor(async (response) => {
  if (response.status === 401) {
    // Session expired
    useSessionStore.getState().setSessionExpired(true);
  }
  return response;
});

/**
 * Fetch wrapper with interceptors
 */
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  let url = `${API_BASE_URL}${endpoint}`;
  let opts: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true', // Bypass ngrok warning page
      ...options.headers,
    },
  };

  // Apply request interceptors
  for (const interceptor of requestInterceptors) {
    const result = await interceptor(url, opts);
    [url, opts] = result;
  }

  let response = await fetch(url, opts);

  // Apply response interceptors
  for (const interceptor of responseInterceptors) {
    response = await interceptor(response);
  }

  return response;
};

/**
 * Typed JSON fetch helper
 */
export const apiFetchJson = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await apiFetch(endpoint, options);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};
