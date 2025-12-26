/**
 * Tests for Rule Templates Library
 */

import { describe, it, expect } from 'vitest';
import {
  RULE_TEMPLATES,
  getTemplatesByCategory,
  searchTemplates,
  getTemplateById,
} from '../templates';
import { TemplateCategory, RuleType } from '../types';

describe('RULE_TEMPLATES', () => {
  it('should have 11 templates', () => {
    expect(RULE_TEMPLATES).toHaveLength(11);
  });

  it('should have unique IDs', () => {
    const ids = RULE_TEMPLATES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have valid categories', () => {
    const validCategories = Object.values(TemplateCategory);
    RULE_TEMPLATES.forEach((template) => {
      expect(validCategories).toContain(template.category);
    });
  });

  it('should have non-empty names and descriptions', () => {
    RULE_TEMPLATES.forEach((template) => {
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.rule.name).toBeTruthy();
    });
  });

  it('should have valid rule types', () => {
    const validTypes = Object.values(RuleType);
    RULE_TEMPLATES.forEach((template) => {
      expect(validTypes).toContain(template.rule.action.type);
    });
  });

  it('should have tags', () => {
    RULE_TEMPLATES.forEach((template) => {
      expect(template.tags).toBeDefined();
      expect(template.tags.length).toBeGreaterThan(0);
    });
  });
});

describe('getTemplatesByCategory', () => {
  it('should return templates for DEVELOPMENT category', () => {
    const templates = getTemplatesByCategory(TemplateCategory.DEVELOPMENT);
    expect(templates.length).toBeGreaterThan(0);
    templates.forEach((t) => {
      expect(t.category).toBe(TemplateCategory.DEVELOPMENT);
    });
  });

  it('should return templates for PRIVACY category', () => {
    const templates = getTemplatesByCategory(TemplateCategory.PRIVACY);
    expect(templates.length).toBeGreaterThan(0);
    templates.forEach((t) => {
      expect(t.category).toBe(TemplateCategory.PRIVACY);
    });
  });

  it('should return templates for CORS category', () => {
    const templates = getTemplatesByCategory(TemplateCategory.CORS);
    expect(templates.length).toBeGreaterThan(0);
    templates.forEach((t) => {
      expect(t.category).toBe(TemplateCategory.CORS);
    });
  });

  it('should return templates for TESTING category', () => {
    const templates = getTemplatesByCategory(TemplateCategory.TESTING);
    expect(templates.length).toBeGreaterThan(0);
    templates.forEach((t) => {
      expect(t.category).toBe(TemplateCategory.TESTING);
    });
  });

  it('should return templates for SECURITY category', () => {
    const templates = getTemplatesByCategory(TemplateCategory.SECURITY);
    expect(templates.length).toBeGreaterThan(0);
    templates.forEach((t) => {
      expect(t.category).toBe(TemplateCategory.SECURITY);
    });
  });

  it('should return templates for API category', () => {
    const templates = getTemplatesByCategory(TemplateCategory.API);
    expect(templates.length).toBeGreaterThan(0);
    templates.forEach((t) => {
      expect(t.category).toBe(TemplateCategory.API);
    });
  });

  it('should return templates for PERFORMANCE category', () => {
    const templates = getTemplatesByCategory(TemplateCategory.PERFORMANCE);
    expect(templates.length).toBeGreaterThan(0);
    templates.forEach((t) => {
      expect(t.category).toBe(TemplateCategory.PERFORMANCE);
    });
  });

  it('should return empty array for GENERAL category if none exist', () => {
    const templates = getTemplatesByCategory(TemplateCategory.GENERAL);
    // GENERAL category may have 0 templates
    templates.forEach((t) => {
      expect(t.category).toBe(TemplateCategory.GENERAL);
    });
  });

  it('should return empty array for non-existent category', () => {
    const templates = getTemplatesByCategory('NON_EXISTENT' as TemplateCategory);
    expect(templates).toEqual([]);
  });
});

describe('searchTemplates', () => {
  it('should find templates by name (case insensitive)', () => {
    const results = searchTemplates('cache');
    expect(results.length).toBeGreaterThan(0);
    const names = results.map((t) => t.name.toLowerCase());
    expect(names.some((n) => n.includes('cache'))).toBe(true);
  });

  it('should find templates by description', () => {
    const results = searchTemplates('localhost');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should find templates by tags', () => {
    const results = searchTemplates('development');
    expect(results.length).toBeGreaterThan(0);
    const tags = results.flatMap((t) => t.tags);
    expect(tags).toContain('development');
  });

  it('should return empty array for non-matching query', () => {
    const results = searchTemplates('xyznonexistent123');
    expect(results).toEqual([]);
  });

  it('should return all templates for empty query', () => {
    const results = searchTemplates('');
    // Empty query returns all templates
    expect(results.length).toBe(RULE_TEMPLATES.length);
  });

  it('should be case insensitive', () => {
    const resultsLower = searchTemplates('cors');
    const resultsUpper = searchTemplates('CORS');
    expect(resultsLower.length).toBeGreaterThan(0);
    expect(resultsLower).toEqual(resultsUpper);
  });

  it('should search across multiple fields', () => {
    const results = searchTemplates('API');
    expect(results.length).toBeGreaterThan(0);
    // Should find templates with "API" in name, description, or tags
  });
});

describe('getTemplateById', () => {
  it('should return template by ID', () => {
    const template = getTemplateById('dev-disable-cache');
    expect(template).toBeDefined();
    expect(template?.id).toBe('dev-disable-cache');
    expect(template?.name).toBe('Disable Browser Cache');
  });

  it('should return undefined for non-existent ID', () => {
    const template = getTemplateById('non-existent-id');
    expect(template).toBeUndefined();
  });

  it('should return different templates for different IDs', () => {
    const template1 = getTemplateById('dev-disable-cache');
    const template2 = getTemplateById('dev-cors-headers');
    expect(template1).toBeDefined();
    expect(template2).toBeDefined();
    expect(template1?.id).not.toBe(template2?.id);
  });

  it('should handle empty string ID', () => {
    const template = getTemplateById('');
    expect(template).toBeUndefined();
  });
});
