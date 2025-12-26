/**
 * Core type definitions for FlowCraft
 */

/**
 * HTTP methods supported by FlowCraft
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

/**
 * Resource types that can be intercepted
 */
export enum ResourceType {
  MAIN_FRAME = 'main_frame',
  SUB_FRAME = 'sub_frame',
  STYLESHEET = 'stylesheet',
  SCRIPT = 'script',
  IMAGE = 'image',
  FONT = 'font',
  OBJECT = 'object',
  XMLHTTPREQUEST = 'xmlhttprequest',
  PING = 'ping',
  CSP_REPORT = 'csp_report',
  MEDIA = 'media',
  WEBSOCKET = 'websocket',
  OTHER = 'other',
}

/**
 * Types of rules supported by FlowCraft
 */
export enum RuleType {
  HEADER_MODIFICATION = 'header_modification',
  URL_REDIRECT = 'url_redirect',
  MOCK_RESPONSE = 'mock_response',
  SCRIPT_INJECTION = 'script_injection',
  QUERY_PARAM = 'query_param',
  REQUEST_BLOCK = 'request_block',
}

/**
 * URL matching strategies
 */
export type UrlMatcherType = 'exact' | 'wildcard' | 'regex';

/**
 * URL matcher configuration
 */
export interface UrlMatcher {
  type: UrlMatcherType;
  pattern: string;
  methods?: HttpMethod[];
  resourceTypes?: ResourceType[];
}

/**
 * Header modification operations
 */
export enum HeaderOperation {
  ADD = 'add',
  MODIFY = 'modify',
  REMOVE = 'remove',
}

/**
 * Header modification configuration
 */
export interface HeaderModification {
  operation: HeaderOperation;
  name: string;
  value?: string;
}

/**
 * Mock response configuration
 */
export interface MockResponse {
  statusCode: number;
  statusText?: string;
  headers: Record<string, string>;
  body?: string;
  delay?: number;
}

/**
 * Script injection configuration
 */
export interface ScriptInjection {
  code: string;
  runAt: 'document_start' | 'document_end' | 'document_idle';
}

/**
 * Query parameter modification
 */
export interface QueryParamModification {
  operation: 'add' | 'modify' | 'remove';
  name: string;
  value?: string;
}

/**
 * Rule action based on rule type
 */
export type RuleAction =
  | { type: RuleType.HEADER_MODIFICATION; headers: HeaderModification[] }
  | { type: RuleType.URL_REDIRECT; redirectUrl: string }
  | { type: RuleType.MOCK_RESPONSE; mockResponse: MockResponse }
  | { type: RuleType.SCRIPT_INJECTION; script: ScriptInjection }
  | { type: RuleType.QUERY_PARAM; params: QueryParamModification[] }
  | { type: RuleType.REQUEST_BLOCK };

/**
 * Core Rule interface
 */
export interface Rule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  matcher: UrlMatcher;
  action: RuleAction;
  createdAt: number;
  updatedAt: number;
  groupId?: string;
}

/**
 * Rule group for organization
 */
export interface RuleGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: number;
}

/**
 * HTTP request representation
 */
export interface HttpRequest {
  id: string;
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  resourceType: ResourceType;
  tabId?: number;
  frameId?: number;
}

/**
 * HTTP response representation
 */
export interface HttpResponse {
  requestId: string;
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
}

/**
 * Log action types - what happened to the request
 */
export enum LogActionType {
  ORIGINAL = 'original', // Request proceeded normally
  MOCKED = 'mocked', // Response was mocked
  MODIFIED = 'modified', // Headers/params were modified
  BLOCKED = 'blocked', // Request was blocked
  REDIRECTED = 'redirected', // Request was redirected
  SCRIPT_INJECTED = 'script_injected', // Script was injected
}

/**
 * Comprehensive HTTP log entry combining request, response, and interception data
 */
export interface HttpLog {
  // Unique identifier
  id: string;

  // Request details
  url: string;
  method: HttpMethod;
  resourceType?: ResourceType;
  requestHeaders?: Record<string, string>;
  requestBody?: string;

  // Response details
  responseStatus?: number;
  responseStatusText?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;

  // Interception metadata
  action: LogActionType;
  matchedRuleId?: string;
  matchedRuleName?: string;
  actionDetails?: {
    // For MODIFIED: which headers/params were changed
    modifiedHeaders?: string[];
    modifiedParams?: string[];
    // For REDIRECTED: where it was redirected to
    redirectUrl?: string;
    // For SCRIPT_INJECTED: script details
    injectedScriptSize?: number;
  };

  // Timing information
  timestamp: number; // When the request was initiated
  startTime: number; // Performance.now() when intercepted
  endTime?: number; // Performance.now() when completed
  duration?: number; // Milliseconds
  mockDelay?: number; // Artificial delay for mocked responses

  // Context
  tabId?: number;
  frameId?: number;

  // Flags
  isMocked: boolean; // Quick check if response was mocked
  isBlocked: boolean; // Quick check if request was blocked
}

/**
 * Storage schema for extension data
 */
export interface StorageSchema {
  rules: Rule[];
  groups: RuleGroup[];
  settings: Settings;
  requestHistory?: HttpRequest[]; // Legacy, kept for backwards compatibility
  httpLogs?: HttpLog[]; // New comprehensive logging
}

/**
 * Export/Import format with metadata and versioning
 */
export interface ExportData {
  version: string; // FlowCraft version
  exportDate: number; // Timestamp
  exportFormat: number; // Format version for backwards compatibility
  data: {
    rules: Rule[];
    groups?: RuleGroup[];
    settings?: Partial<Settings>; // Optional: allow importing just rules
  };
  metadata?: {
    rulesCount: number;
    groupsCount: number;
    includesSettings: boolean;
  };
}

/**
 * Import options
 */
export interface ImportOptions {
  overwriteExisting?: boolean; // If false, merge with existing rules
  importSettings?: boolean; // Import settings along with rules
  importGroups?: boolean; // Import groups along with rules
  preserveIds?: boolean; // Keep original IDs (may cause conflicts) or generate new ones
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  rulesImported: number;
  groupsImported: number;
  settingsImported: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Rule template categories
 */
export enum TemplateCategory {
  DEVELOPMENT = 'development',
  PRIVACY = 'privacy',
  PERFORMANCE = 'performance',
  TESTING = 'testing',
  SECURITY = 'security',
  CORS = 'cors',
  API = 'api',
  GENERAL = 'general',
}

/**
 * Rule template interface
 */
export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  rule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>; // Template without runtime fields
  customizable: {
    // Fields that users can/should customize
    pattern?: boolean;
    redirectUrl?: boolean;
    headers?: boolean;
    mockResponse?: boolean;
    script?: boolean;
    params?: boolean;
  };
  examples?: string[]; // Usage examples
}

/**
 * Rule conflict types
 */
export enum ConflictType {
  PATTERN_OVERLAP = 'pattern_overlap', // Rules match same URLs
  ACTION_CONFLICT = 'action_conflict', // Incompatible actions (block + redirect)
  PRIORITY_CONFLICT = 'priority_conflict', // Same priority with overlapping patterns
  HEADER_CONFLICT = 'header_conflict', // Multiple rules modify same header
  SHADOWING = 'shadowing', // Higher priority rule makes lower one unreachable
  REDUNDANT = 'redundant', // Duplicate or redundant rules
}

/**
 * Rule conflict severity
 */
export enum ConflictSeverity {
  ERROR = 'error', // Critical conflict, rules won't work as expected
  WARNING = 'warning', // Potential issue, may cause unexpected behavior
  INFO = 'info', // Informational, rules work but could be optimized
}

/**
 * Rule conflict detection result
 */
export interface RuleConflict {
  id: string; // Unique conflict ID
  type: ConflictType;
  severity: ConflictSeverity;
  ruleIds: string[]; // IDs of conflicting rules (2 or more)
  message: string; // Human-readable conflict description
  suggestion?: string; // Suggestion for resolving the conflict
  affectedUrls?: string[]; // Example URLs that would be affected
  details?: {
    // Type-specific details
    overlappingPattern?: string;
    conflictingHeaders?: string[];
    conflictingActions?: RuleType[];
    priority?: number;
  };
}

/**
 * Extension settings
 */
export interface Settings {
  enabled: boolean; // Global extension on/off toggle
  theme: 'light' | 'dark' | 'system';
  enableRequestHistory: boolean; // Legacy, kept for backwards compatibility
  maxHistorySize: number; // Legacy, kept for backwards compatibility
  enableNotifications: boolean;
  autoEnableNewRules: boolean;

  // HTTP Logger settings
  logger: {
    enabled: boolean; // Enable/disable request/response logging
    maxLogSize: number; // Maximum number of logs to keep (circular buffer)
    captureHeaders: boolean; // Capture request/response headers
    captureRequestBody: boolean; // Capture request bodies (may contain sensitive data)
    captureResponseBody: boolean; // Capture response bodies (increases storage)
    maxBodySize: number; // Maximum body size to capture (bytes, 0 = unlimited)
    preserveOnDisable: boolean; // Keep logs when logger is disabled
    urlFilters: string[]; // URL patterns to exclude from logging (e.g., ['*.google-analytics.com/*'])
  };
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: Settings = {
  enabled: true, // Extension enabled by default
  theme: 'system',
  enableRequestHistory: false,
  maxHistorySize: 100,
  enableNotifications: true,
  autoEnableNewRules: true,
  logger: {
    enabled: false, // Disabled by default for privacy/performance
    maxLogSize: 500, // Keep last 500 requests
    captureHeaders: true,
    captureRequestBody: false, // Disabled by default for privacy
    captureResponseBody: true, // Enabled to see mocked responses
    maxBodySize: 1024 * 100, // 100KB max body size
    preserveOnDisable: false, // Clear logs when disabled
    urlFilters: [
      '*://*/favicon.ico', // Exclude favicon requests
      '*://*.google-analytics.com/*', // Exclude analytics
      '*://*.googletagmanager.com/*',
      '*://*/ping', // Exclude ping requests
    ],
  },
};
