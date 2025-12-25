/**
 * TemplateBrowser Component
 * Browse and instantiate rule templates
 */

import React, { useState } from 'react';
import { RuleTemplate, TemplateCategory } from '@shared/types';
import { RULE_TEMPLATES, searchTemplates, getTemplatesByCategory } from '@shared/templates';
import { Button } from '@components/Button';

interface TemplateBrowserProps {
  onUseTemplate: (template: RuleTemplate) => void;
  className?: string;
}

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  [TemplateCategory.DEVELOPMENT]: 'Development',
  [TemplateCategory.PRIVACY]: 'Privacy',
  [TemplateCategory.PERFORMANCE]: 'Performance',
  [TemplateCategory.TESTING]: 'Testing',
  [TemplateCategory.SECURITY]: 'Security',
  [TemplateCategory.CORS]: 'CORS',
  [TemplateCategory.API]: 'API',
  [TemplateCategory.GENERAL]: 'General',
};

const CATEGORY_ICONS: Record<TemplateCategory, string> = {
  [TemplateCategory.DEVELOPMENT]: '🔧',
  [TemplateCategory.PRIVACY]: '🔒',
  [TemplateCategory.PERFORMANCE]: '⚡',
  [TemplateCategory.TESTING]: '🧪',
  [TemplateCategory.SECURITY]: '🛡️',
  [TemplateCategory.CORS]: '🌐',
  [TemplateCategory.API]: '📡',
  [TemplateCategory.GENERAL]: '📝',
};

export const TemplateBrowser: React.FC<TemplateBrowserProps> = ({
  onUseTemplate,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<RuleTemplate | null>(null);

  // Filter templates
  const filteredTemplates = searchQuery
    ? searchTemplates(searchQuery)
    : selectedCategory === 'all'
    ? RULE_TEMPLATES
    : getTemplatesByCategory(selectedCategory);

  // Get category counts
  const categoryCounts = Object.values(TemplateCategory).reduce((acc, category) => {
    acc[category] = getTemplatesByCategory(category).length;
    return acc;
  }, {} as Record<TemplateCategory, number>);

  return (
    <div className={`flex gap-6 ${className}`}>
      {/* Sidebar - Categories */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
            Categories
          </h3>

          {/* All Templates */}
          <button
            onClick={() => setSelectedCategory('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
          >
            <span>All Templates</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {RULE_TEMPLATES.length}
            </span>
          </button>

          {/* Category Filters */}
          {Object.values(TemplateCategory).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                selectedCategory === category
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{CATEGORY_ICONS[category]}</span>
                <span>{CATEGORY_LABELS[category]}</span>
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {categoryCounts[category]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              🔍
            </div>
          </div>
        </div>

        {/* Template Grid/List */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              No templates found
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Try adjusting your search or category filter
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className={`bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 cursor-pointer transition-all ${
                  selectedTemplate?.id === template.id
                    ? 'ring-2 ring-primary-500 border-primary-500'
                    : 'hover:border-primary-300 dark:hover:border-primary-700'
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-2xl flex-shrink-0">
                    {CATEGORY_ICONS[template.category]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
                      {template.name}
                    </h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-2 py-0.5 text-xs rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Use Button */}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUseTemplate(template);
                  }}
                  className="w-full"
                >
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Panel (if template selected) */}
      {selectedTemplate && (
        <div className="w-96 flex-shrink-0">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 sticky top-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="text-3xl">
                {CATEGORY_ICONS[selectedTemplate.category]}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                  {selectedTemplate.name}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {CATEGORY_LABELS[selectedTemplate.category]}
                </p>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4">
              {selectedTemplate.description}
            </p>

            {/* Tags */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                Tags
              </h4>
              <div className="flex flex-wrap gap-1">
                {selectedTemplate.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-1 text-xs rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Examples */}
            {selectedTemplate.examples && selectedTemplate.examples.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                  Usage Examples
                </h4>
                <ul className="space-y-1">
                  {selectedTemplate.examples.map((example, index) => (
                    <li
                      key={index}
                      className="text-xs text-neutral-600 dark:text-neutral-400 pl-4 relative before:content-['•'] before:absolute before:left-0"
                    >
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Customizable Fields */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                Customizable
              </h4>
              <div className="flex flex-wrap gap-1">
                {Object.entries(selectedTemplate.customizable)
                  .filter(([_, value]) => value)
                  .map(([key]) => (
                    <span
                      key={key}
                      className="inline-block px-2 py-1 text-xs rounded bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300"
                    >
                      {key}
                    </span>
                  ))}
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => onUseTemplate(selectedTemplate)}
              className="w-full"
            >
              Use This Template
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
