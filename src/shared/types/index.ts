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
 * Storage schema for extension data
 */
export interface StorageSchema {
  rules: Rule[];
  groups: RuleGroup[];
  settings: Settings;
  requestHistory?: HttpRequest[];
}

/**
 * Extension settings
 */
export interface Settings {
  enabled: boolean; // Global extension on/off toggle
  theme: 'light' | 'dark' | 'system';
  enableRequestHistory: boolean;
  maxHistorySize: number;
  enableNotifications: boolean;
  autoEnableNewRules: boolean;
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
};
