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

The RuleEditor component has comprehensive unit test coverage:

- **RuleEditor.test.tsx**: 13 tests covering rendering, validation, form interaction, and advanced settings
- **HeaderEditor.test.tsx**: 17 tests for header manipulation
- **QueryParamEditor.test.tsx**: 13 tests for query parameter modification
- **ScriptInjectionEditor.test.tsx**: 11 tests for script injection
- **MockResponseEditor.test.tsx**: 18 tests for response mocking

All tests use Vitest and React Testing Library with proper async handling and test-ids.

## Future Enhancements

- Autocomplete for common headers
- Pattern examples and templates
- Rule preview/test
- Duplicate rule detection
- Import from HAR files
