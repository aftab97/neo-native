/**
 * Environment configuration
 * Single source of truth for environment and API URLs
 */

export type Environment = 'DEV' | 'QA' | 'PROD';

// API URLs for each environment
export const ENV_URLS: Record<Environment, string> = {
  DEV: 'https://nonseclusive-charlena-unlustful.ngrok-free.dev',
  QA: 'https://qa-api.example.com', // Update with actual QA URL
  PROD: 'https://prod-api.example.com', // Update with actual PROD URL
};

/**
 * Current environment
 * Change this to switch between environments
 */
export const CURRENT_ENV: Environment = 'DEV';

/**
 * RBAC bypass toggle
 * When true, all agents are visible regardless of user group membership
 * Useful for development and testing
 */
export const SHOW_ALL_AGENTS = true;

/**
 * Get current environment based on API URL
 */
export const getEnv = (apiUrl?: string): Environment => {
  const url = apiUrl || ENV_URLS[CURRENT_ENV];

  if (url.includes('prod') || url.includes('prd')) {
    return 'PROD';
  }
  if (url.includes('qa') || url.includes('uat')) {
    return 'QA';
  }
  return 'DEV';
};

/**
 * API Base URL for the current environment
 */
export const API_BASE_URL = ENV_URLS[CURRENT_ENV];
