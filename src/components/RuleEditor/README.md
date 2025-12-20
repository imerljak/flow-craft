# RuleEditor Component

## Overview

The RuleEditor component provides a comprehensive form interface for creating and editing FlowCraft rules.

## Features

- ✅ Rule name and description fields
- ✅ URL pattern input with type selection (exact, wildcard, regex)
- ✅ Pattern validation (URL format, regex syntax)
- ✅ Rule type selection (header modification, redirect, block, etc.)
- ✅ Priority configuration
- ✅ Conditional fields based on rule type
- ✅ HeaderEditor sub-component for managing header modifications
- ✅ Full TypeScript typing
- ✅ Form validation with error messages

## Usage

```typescript
import { RuleEditor } from '@components/RuleEditor';
import { Rule } from '@shared/types';

function MyComponent() {
  const handleSave = (rule: Rule) => {
    // Save logic
  };

  const handleCancel = () => {
    // Cancel logic
  };

  return (
    <RuleEditor
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}

// Edit existing rule
<RuleEditor
  rule={existingRule}
  onSave={handleSave}
  onCancel={handleCancel}
/>
```

## Components

### RuleEditor

Main form component for rule creation/editing.

**Props:**
- `rule?: Rule` - Existing rule to edit (optional)
- `onSave: (rule: Rule) => void` - Callback when rule is saved
- `onCancel: () => void` - Callback when editing is cancelled

### HeaderEditor

Sub-component for managing header modifications.

**Props:**
- `headers: HeaderModification[]` - Current headers
- `onChange: (headers: HeaderModification[]) => void` - Callback when headers change

## Validation

- **Rule name**: Required
- **URL pattern**: Required, format validated based on pattern type
  - Exact: Must be valid URL
  - Wildcard: Allows `*`, otherwise must be valid URL
  - Regex: Must be valid regular expression
- **Redirect URL**: Required for redirect rules, must be valid URL
- **Priority**: Number between 1-1000

## Testing

Note: React component tests require Jest configuration improvements for proper React transformation. This is tracked as a follow-up task.

Core functionality is tested through integration tests and manual QA.

## Future Enhancements

- Autocomplete for common headers
- Pattern examples and templates
- Rule preview/test
- Duplicate rule detection
- Import from HAR files
