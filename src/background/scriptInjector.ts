/**
 * Script Injector - Handles dynamic script injection for matched URLs
 */

import { Rule, RuleType } from '@shared/types';
import Browser from 'webextension-polyfill';

/**
 * ScriptInjector manages script injection rules
 */
export class ScriptInjector {
  private static scriptRules: Map<string, Rule> = new Map();

  /**
   * Update script injection rules
   */
  static async updateScriptRules(rules: Rule[]): Promise<void> {
    // Clear existing rules
    this.scriptRules.clear();

    // Add new script injection rules
    const scriptRules = rules.filter(
      (rule) => rule.enabled && rule.action.type === RuleType.SCRIPT_INJECTION
    );

    for (const rule of scriptRules) {
      this.scriptRules.set(rule.id, rule);
    }

    console.log(`Updated ${scriptRules.length} script injection rules`);
  }

  /**
   * Check if a URL matches any script injection rules and inject scripts
   */
  static async handleNavigation(
    tabId: number,
    url: string
  ): Promise<void> {
    for (const rule of this.scriptRules.values()) {
      if (this.matchesRule(rule, url)) {
        await this.injectScript(tabId, rule);
      }
    }
  }

  /**
   * Check if URL matches rule pattern
   */
  private static matchesRule(rule: Rule, url: string): boolean {
    const { matcher } = rule;

    try {
      switch (matcher.type) {
        case 'exact':
          return url === matcher.pattern;

        case 'wildcard': {
          const regexPattern = matcher.pattern
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*');
          const regex = new RegExp(`^${regexPattern}$`);
          return regex.test(url);
        }

        case 'regex': {
          const regex = new RegExp(matcher.pattern);
          return regex.test(url);
        }

        default:
          return false;
      }
    } catch (error) {
      console.error(`Error matching URL for rule ${rule.id}:`, error);
      return false;
    }
  }

  /**
   * Inject script into tab
   */
  private static async injectScript(
    tabId: number,
    rule: Rule
  ): Promise<void> {
    if (rule.action.type !== RuleType.SCRIPT_INJECTION) {
      return;
    }

    const { script } = rule.action;

    try {
      // Convert runAt format to Chrome's injectImmediately timing
      const world = 'MAIN' as const; // Inject into page's main world

      await Browser.scripting.executeScript({
        target: { tabId },
        world,
        func: (code: string) => {
          // Execute the user's script
          eval(code);
        },
        args: [script.code],
        injectImmediately: script.runAt === 'document_start',
      });

      console.log(`Injected script from rule ${rule.id} into tab ${tabId}`);
    } catch (error) {
      console.error(`Failed to inject script from rule ${rule.id}:`, error);
    }
  }

  /**
   * Clear all script injection rules
   */
  static clearScriptRules(): void {
    this.scriptRules.clear();
  }
}
