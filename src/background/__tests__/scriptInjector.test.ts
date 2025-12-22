/**
 * ScriptInjector tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScriptInjector } from '../scriptInjector';
import { Rule, RuleType } from '@shared/types';
import Browser from 'webextension-polyfill';

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => ({
  default: {
    scripting: {
      executeScript: vi.fn(),
    },
  },
}));

describe('ScriptInjector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ScriptInjector.clearScriptRules();
  });

  describe('updateScriptRules', () => {
    it('should store enabled script injection rules', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Inject Script',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://example.com',
          },
          action: {
            type: RuleType.SCRIPT_INJECTION,
            script: {
              code: 'console.log("test");',
              runAt: 'document_end',
            },
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await ScriptInjector.updateScriptRules(rules);

      // Verify rule was stored (will be used in handleNavigation)
      await ScriptInjector.handleNavigation(1, 'https://example.com');
      expect(Browser.scripting.executeScript).toHaveBeenCalled();
    });

    it('should ignore disabled rules', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Disabled Script',
          enabled: false,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://example.com',
          },
          action: {
            type: RuleType.SCRIPT_INJECTION,
            script: {
              code: 'console.log("test");',
              runAt: 'document_end',
            },
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await ScriptInjector.updateScriptRules(rules);

      await ScriptInjector.handleNavigation(1, 'https://example.com');
      expect(Browser.scripting.executeScript).not.toHaveBeenCalled();
    });

    it('should ignore non-script-injection rules', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Header Rule',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://example.com',
          },
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await ScriptInjector.updateScriptRules(rules);

      await ScriptInjector.handleNavigation(1, 'https://example.com');
      expect(Browser.scripting.executeScript).not.toHaveBeenCalled();
    });
  });

  describe('handleNavigation', () => {
    it('should inject script for exact URL match', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Test Script',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://example.com/page',
          },
          action: {
            type: RuleType.SCRIPT_INJECTION,
            script: {
              code: 'alert("Hello");',
              runAt: 'document_end',
            },
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await ScriptInjector.updateScriptRules(rules);
      await ScriptInjector.handleNavigation(123, 'https://example.com/page');

      expect(Browser.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { tabId: 123 },
          world: 'MAIN',
          args: ['alert("Hello");'],
        })
      );
    });

    it('should inject script for wildcard URL match', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Test Script',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'wildcard',
            pattern: 'https://example.com/*',
          },
          action: {
            type: RuleType.SCRIPT_INJECTION,
            script: {
              code: 'console.log("matched");',
              runAt: 'document_end',
            },
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await ScriptInjector.updateScriptRules(rules);
      await ScriptInjector.handleNavigation(123, 'https://example.com/any/path');

      expect(Browser.scripting.executeScript).toHaveBeenCalled();
    });

    it('should inject script for regex URL match', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Test Script',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'regex',
            pattern: '^https://example\\.com/[a-z]+$',
          },
          action: {
            type: RuleType.SCRIPT_INJECTION,
            script: {
              code: 'console.log("regex match");',
              runAt: 'document_end',
            },
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await ScriptInjector.updateScriptRules(rules);
      await ScriptInjector.handleNavigation(123, 'https://example.com/test');

      expect(Browser.scripting.executeScript).toHaveBeenCalled();
    });

    it('should not inject script for non-matching URL', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Test Script',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://example.com',
          },
          action: {
            type: RuleType.SCRIPT_INJECTION,
            script: {
              code: 'console.log("test");',
              runAt: 'document_end',
            },
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await ScriptInjector.updateScriptRules(rules);
      await ScriptInjector.handleNavigation(123, 'https://different.com');

      expect(Browser.scripting.executeScript).not.toHaveBeenCalled();
    });

    it('should inject immediately for document_start', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Test Script',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://example.com',
          },
          action: {
            type: RuleType.SCRIPT_INJECTION,
            script: {
              code: 'console.log("early");',
              runAt: 'document_start',
            },
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await ScriptInjector.updateScriptRules(rules);
      await ScriptInjector.handleNavigation(123, 'https://example.com');

      expect(Browser.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({
          injectImmediately: true,
        })
      );
    });

    it('should not inject immediately for document_end', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Test Script',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://example.com',
          },
          action: {
            type: RuleType.SCRIPT_INJECTION,
            script: {
              code: 'console.log("late");',
              runAt: 'document_end',
            },
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await ScriptInjector.updateScriptRules(rules);
      await ScriptInjector.handleNavigation(123, 'https://example.com');

      expect(Browser.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({
          injectImmediately: false,
        })
      );
    });
  });

  describe('clearScriptRules', () => {
    it('should clear all script rules', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Test Script',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://example.com',
          },
          action: {
            type: RuleType.SCRIPT_INJECTION,
            script: {
              code: 'console.log("test");',
              runAt: 'document_end',
            },
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await ScriptInjector.updateScriptRules(rules);
      ScriptInjector.clearScriptRules();

      await ScriptInjector.handleNavigation(123, 'https://example.com');
      expect(Browser.scripting.executeScript).not.toHaveBeenCalled();
    });
  });
});
