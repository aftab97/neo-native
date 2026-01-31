// API Configuration
// URL configuration is centralized in env.ts

export { API_BASE_URL } from './env';

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
  ISSUE_SESSION_TOKEN: '/api/v1/session/issue12hSessionToken',

  // User
  USER_INFO: '/api/v1/session/userinfo',
  USER_PROFILE_PICTURE: '/api/v1/session/userProfilePicture',

  // Files
  PROCESS_FILE: '/api/v1/session/file/processFile',
  FRONTEND_PROCESS_FILE: '/api/v1/session/file/frontendProcessFile',
  UPLOAD_QUEUE: '/api/v1/session/upload/queue',
  UPLOAD_LISTEN: '/api/v1/session/upload/listen',

  // Feedback
  FEEDBACK: '/api/v1/session/feedback',

  // App Library
  APP_LIBRARY: '/api/v1/session/appLibrary',

  // Daily News
  DAILY_NEWS: '/api/v1/session/getDailyNews',

  // Stock Price
  STOCK_PRICE: '/api/v1/session/getStockPrice',

  // Notifications
  NOTIFICATIONS: '/api/v1/session/getNotify',
  GTD_NOTIFICATIONS: '/api/v1/session/getGtdNotifications',
  REPLICON_TIMESHEETS: '/api/v1/session/getRepliconOpenTimesheets',
  REPLICON_TIME_OFF: '/api/v1/session/getRepliconTimeOffWaitingForApproval',
  VMS_APPROVALS: '/api/v1/session/getVMSApprovals',

  // Prompt Library
  PROMPT_LIBRARY: '/api/v1/session/promptLibrary',
} as const;
