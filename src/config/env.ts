/**
 * Environment configuration
 * Single source of truth for environment and API URLs
 */

export type Environment = 'DEV' | 'QA' | 'PROD';

// API URLs for each environment
export const ENV_URLS: Record<Environment, string> = {
  DEV: 'http://localhost:8010',
  QA: 'https://qa-api.example.com', // Update with actual QA URL
  PROD: 'https://prod-api.example.com', // Update with actual PROD URL
};

// WordPress URLs for each environment (for support/help content)
export const WORDPRESS_URLS: Record<Environment, string> = {
  DEV: 'https://neo-dev-wordpress.capgemini.com',
  QA: 'https://neo-qua-wordpress.capgemini.com',
  PROD: 'https://neo-wordpress.capgemini.com',
};

// ServiceNow URLs for reporting issues
export const SERVICE_NOW_URLS: Record<Environment, string> = {
  DEV: 'https://cgituat.service-now.com/sc?id=sc_cat_item&sys_id=fa1204ab97bbee902bfa71300153afe1',
  QA: 'https://cgituat.service-now.com/sc?id=sc_cat_item&sys_id=fa1204ab97bbee902bfa71300153afe1',
  PROD: 'https://servicecentral.capgemini.com/sc?id=sc_cat_item&sys_id=fa1204ab97bbee902bfa71300153afe1',
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

/**
 * WordPress URL for the current environment
 */
export const WORDPRESS_URL = WORDPRESS_URLS[CURRENT_ENV];

/**
 * ServiceNow URL for the current environment
 */
export const SERVICE_NOW_URL = SERVICE_NOW_URLS[CURRENT_ENV];
