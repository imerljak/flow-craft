import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Make React available globally for tests
(globalThis as { React: typeof React }).React = React;

// Mock webextension-polyfill - needs to match the chrome API structure
vi.mock('webextension-polyfill', () => {
  return {
    default: {
      storage: {
        local: {
          get: vi.fn((_keys, callback) => {
            callback?.({});
            return Promise.resolve({});
          }),
          set: vi.fn((_items, callback) => {
            callback?.();
            return Promise.resolve();
          }),
          remove: vi.fn(),
          clear: vi.fn(),
        },
        sync: {
          get: vi.fn(),
          set: vi.fn(),
          remove: vi.fn(),
          clear: vi.fn(),
        },
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
      runtime: {
        lastError: null,
        sendMessage: vi.fn(),
        onMessage: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
        onInstalled: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
        onStartup: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
      declarativeNetRequest: {
        updateDynamicRules: vi.fn().mockResolvedValue(undefined),
        getDynamicRules: vi.fn().mockResolvedValue([]),
      },
    },
  };
});

// Mock Chrome API for testing
const chromeMock = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    lastError: null,
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onStartup: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  declarativeNetRequest: {
    updateDynamicRules: vi.fn().mockResolvedValue(undefined),
    getDynamicRules: vi.fn().mockResolvedValue([]),
  },
};

((globalThis as { chrome: typeof chrome }).chrome) = chromeMock as unknown as typeof chrome;
