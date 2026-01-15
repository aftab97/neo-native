// API Configuration
// Configure based on environment - update these URLs for your BFF

const DEV_API_URL = 'https://nonseclusive-charlena-unlustful.ngrok-free.dev';
const PROD_API_URL = 'https://nonseclusive-charlena-unlustful.ngrok-free.dev';

export const API_BASE_URL = DEV_API_URL;

// API Endpoints
export const ENDPOINTS = {
  // Chat
  CHAT: '/api/v1/session/chat',
  CHAT_CANCEL: '/api/v1/session/chat/cancel',

  // History
  HISTORY: '/api/v1/session/history',
  HISTORY_TITLES: '/api/v1/session/history/titles',
  HISTORY_RENAME: '/api/v1/session/history/rename',

  // Session
  DELETE_SESSION: '/api/v1/session/session',
  DELETE_ALL_SESSIONS: '/api/v1/session/sessions',

  // User
  USER_INFO: '/api/v1/session/userinfo',

  // Files
  PROCESS_FILE: '/api/v1/session/file/processFile',

  // Feedback
  FEEDBACK: '/api/v1/session/feedback',

  // App Library
  APP_LIBRARY: '/api/v1/session/appLibrary',

  // Daily News
  DAILY_NEWS: '/api/v1/session/getDailyNews',
} as const;
