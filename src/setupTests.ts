import '@testing-library/jest-dom';
import React from 'react';

// Make React available globally for tests
(globalThis as { React: typeof React }).React = React;

// Mock Chrome API for testing
const chromeMock = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  runtime: {
    lastError: null,
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onInstalled: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onStartup: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  declarativeNetRequest: {
    updateDynamicRules: jest.fn(),
    getDynamicRules: jest.fn(),
  },
};

((globalThis as { chrome: typeof chrome }).chrome) = chromeMock as unknown as typeof chrome;
