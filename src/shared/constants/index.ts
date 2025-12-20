/**
 * Application constants
 */

export const APP_NAME = 'FlowCraft';
export const APP_VERSION = '1.0.0';

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  RULES: 'rules',
  GROUPS: 'groups',
  SETTINGS: 'settings',
  REQUEST_HISTORY: 'requestHistory',
} as const;

/**
 * Common HTTP headers
 */
export const COMMON_HEADERS = [
  'Accept',
  'Accept-Encoding',
  'Accept-Language',
  'Access-Control-Allow-Origin',
  'Access-Control-Allow-Methods',
  'Access-Control-Allow-Headers',
  'Authorization',
  'Cache-Control',
  'Content-Type',
  'Content-Length',
  'Cookie',
  'Origin',
  'Referer',
  'User-Agent',
  'X-Requested-With',
] as const;

/**
 * Default priorities for rules
 */
export const DEFAULT_RULE_PRIORITY = 100;

/**
 * Maximum number of rules
 */
export const MAX_RULES = 1000;

/**
 * Maximum request history size
 */
export const MAX_REQUEST_HISTORY = 500;
