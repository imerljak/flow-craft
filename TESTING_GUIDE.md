# FlowCraft - Comprehensive Testing Guide

## Pre-Testing Setup

### 1. Install Extension
1. Run `npm run type-check` to ensure no errors
2. Follow instructions in `MANUAL_BUILD.md` to load extension
3. Verify extension appears in `chrome://extensions/`
4. Pin the extension icon to toolbar for easy access

### 2. Test Environment
- **Browser**: Chrome (latest version)
- **Test URLs**:
  - `https://httpbin.org` (for HTTP testing)
  - `https://jsonplaceholder.typicode.com` (for API testing)
  - `https://example.com` (for basic testing)

---

## Feature Testing Checklist

### ✅ Phase 1: Popup UI & Basic Functionality

#### Test 1.1: Extension Popup Opens
- [  ] Click extension icon
- [  ] Popup opens (600x500px)
- [  ] Shows "FlowCraft" title
- [  ] Shows "No rules yet" message (first time)
- [  ] "+ New Rule" button visible
- [  ] "Open Settings" link visible

#### Test 1.2: Create Rule Button
- [  ] Click "+ New Rule" button
- [  ] Modal opens with title "Create New Rule"
- [  ] Form shows all required fields:
  - [  ] Rule Name input
  - [  ] Description input (optional)
  - [  ] URL Pattern input
  - [  ] Pattern Type dropdown (exact/wildcard/regex)
  - [  ] Rule Type dropdown
  - [  ] Priority input
- [  ] "Cancel" and "Save Rule" buttons visible

#### Test 1.3: Cancel Rule Creation
- [  ] Click "+ New Rule"
- [  ] Click "Cancel" button
- [  ] Modal closes
- [  ] No rule created
- [  ] Returns to empty state

---

### ✅ Phase 2: Rule Creation & Validation

#### Test 2.1: Required Field Validation
- [  ] Click "+ New Rule"
- [  ] Click "Save Rule" without filling anything
- [  ] Error: "Rule name is required" appears
- [  ] Click inside Name field, type "Test"
- [  ] Click "Save Rule"
- [  ] Error: "URL pattern is required" appears
- [  ] Errors are displayed in red below fields

#### Test 2.2: URL Pattern Validation (Exact Match)
- [  ] Pattern Type: "Exact Match"
- [  ] Enter invalid URL: "not-a-url"
- [  ] Click "Save Rule"
- [  ] Error: "Invalid URL format"
- [  ] Enter valid URL: "https://httpbin.org/get"
- [  ] Error disappears
- [  ] Can save successfully

#### Test 2.3: URL Pattern Validation (Wildcard)
- [  ] Pattern Type: "Wildcard"
- [  ] Enter: "https://httpbin.org/*"
- [  ] Helper text shows: "Use * as wildcard"
- [  ] Can save successfully

#### Test 2.4: URL Pattern Validation (Regex)
- [  ] Pattern Type: "Regular Expression"
- [  ] Enter invalid regex: "[invalid(regex"
- [  ] Click "Save Rule"
- [  ] Error: "Invalid regex pattern"
- [  ] Enter valid regex: "^https://httpbin\\.org/.*$"
- [  ] Can save successfully

---

### ✅ Phase 3: Rule Types

#### Test 3.1: Header Modification Rule
- [  ] Create new rule
- [  ] Name: "Add Custom Header"
- [  ] URL: "https://httpbin.org/headers"
- [  ] Type: "Header Modification"
- [  ] Click "+ Add Header" button
- [  ] Header editor appears
- [  ] Set:
  - Operation: "Add"
  - Header Name: "X-Test-Header"
  - Header Value: "test-value"
- [  ] Save rule
- [  ] Rule appears in list
- [  ] Rule is enabled by default (toggle ON)

#### Test 3.2: URL Redirection Rule
- [  ] Create new rule
- [  ] Name: "Redirect Example"
- [  ] URL: "https://example.com"
- [  ] Type: "URL Redirection"
- [  ] "Redirect URL" field appears
- [  ] Enter redirect URL: "https://example.org"
- [  ] Save rule
- [  ] Rule appears in list

#### Test 3.3: Block Request Rule
- [  ] Create new rule
- [  ] Name: "Block Tracker"
- [  ] URL: "https://tracker.example.com/*"
- [  ] Type: "Block Request"
- [  ] No additional fields needed
- [  ] Save rule
- [  ] Rule appears in list

---

### ✅ Phase 4: Rule Management

#### Test 4.1: Rule List Display
- [  ] Create 3+ rules
- [  ] Each rule shows:
  - [  ] Toggle switch (enabled/disabled)
  - [  ] Rule name
  - [  ] Description (if set)
  - [  ] URL pattern
  - [  ] Pattern type badge
  - [  ] Rule type badge
  - [  ] Edit button (pencil icon)
  - [  ] Delete button (trash icon)
- [  ] Footer shows: "X of Y active"

#### Test 4.2: Toggle Rule Enable/Disable
- [  ] Click toggle on an enabled rule
- [  ] Toggle switches to disabled (gray)
- [  ] Counter updates: "X of Y active"
- [  ] Click toggle again
- [  ] Toggle switches to enabled (blue)
- [  ] Counter updates

#### Test 4.3: Edit Rule
- [  ] Click edit button (pencil icon)
- [  ] Modal opens with title "Edit Rule"
- [  ] Form is pre-filled with rule data
- [  ] Change rule name
- [  ] Click "Save Rule"
- [  ] Modal closes
- [  ] Rule name updated in list
- [  ] "Updated" timestamp changes

#### Test 4.4: Delete Rule - Cancel
- [  ] Click delete button (trash icon)
- [  ] Confirmation modal appears
- [  ] Shows: "Are you sure you want to delete [name]?"
- [  ] Click "Cancel"
- [  ] Modal closes
- [  ] Rule still exists

#### Test 4.5: Delete Rule - Confirm
- [  ] Click delete button
- [  ] Confirmation modal appears
- [  ] Click "Delete Rule" (red button)
- [  ] Modal closes
- [  ] Rule removed from list
- [  ] Counter updates

---

### ✅ Phase 5: Header Editor Sub-Component

#### Test 5.1: Add Multiple Headers
- [  ] Create/edit header modification rule
- [  ] Click "+ Add Header" 3 times
- [  ] 3 header editors appear
- [  ] Each has:
  - Operation dropdown
  - Header Name input
  - Header Value input (except for REMOVE)
  - "Remove Header" button

#### Test 5.2: Header Operations
- [  ] Add header #1:
  - Operation: "Add"
  - Name: "X-Header-1"
  - Value: "value1"
- [  ] Add header #2:
  - Operation: "Modify"
  - Name: "User-Agent"
  - Value: "Custom-Agent"
- [  ] Add header #3:
  - Operation: "Remove"
  - Name: "Cookie"
  - [  ] Value field NOT shown for Remove
- [  ] Save rule
- [  ] All headers saved correctly

#### Test 5.3: Remove Header from Editor
- [  ] Edit header modification rule
- [  ] Multiple headers shown
- [  ] Click "Remove Header" on middle item
- [  ] Header removed from list
- [  ] Other headers remain
- [  ] Save rule

---

### ✅ Phase 6: Storage & Persistence

#### Test 6.1: Rules Persist After Reload
- [  ] Create 2-3 rules
- [  ] Close popup
- [  ] Open popup again
- [  ] All rules still there
- [  ] Enabled/disabled states preserved

#### Test 6.2: Rules Persist After Extension Reload
- [  ] Create rules
- [  ] Go to `chrome://extensions/`
- [  ] Click reload button on FlowCraft
- [  ] Open popup
- [  ] All rules still there

#### Test 6.3: Rules Persist After Browser Restart
- [  ] Create rules
- [  ] Close Chrome completely
- [  ] Reopen Chrome
- [  ] Open extension popup
- [  ] All rules still there

---

### ✅ Phase 7: Request Interception (Real World Testing)

#### Test 7.1: Header Modification Works
1. **Setup**:
   - Create rule:
     - Name: "Add Test Header"
     - URL: "https://httpbin.org/headers"
     - Pattern Type: "Wildcard"
     - Type: "Header Modification"
     - Add Header: "X-FlowCraft-Test" = "working"
   - Enable rule

2. **Test**:
   - Open new tab
   - Go to: `https://httpbin.org/headers`
   - Response shows all headers
   - [  ] Verify "X-Flowcraft-Test": "working" appears in response

3. **Disable**:
   - Toggle rule off
   - Refresh the page
   - [  ] "X-Flowcraft-Test" NOT in response

#### Test 7.2: URL Redirection Works
1. **Setup**:
   - Create rule:
     - Name: "Redirect Test"
     - URL: "https://example.com"
     - Type: "URL Redirection"
     - Redirect URL: "https://example.org"
   - Enable rule

2. **Test**:
   - Open new tab
   - Try to go to: `https://example.com`
   - [  ] Browser redirects to `https://example.org`
   - URL bar shows example.org

3. **Disable**:
   - Toggle rule off
   - Try going to `https://example.com` again
   - [  ] Stays on example.com (no redirect)

#### Test 7.3: Request Blocking Works
1. **Setup**:
   - Create rule:
     - Name: "Block Scripts"
     - URL: "https://example.com/*.js"
     - Type: "Block Request"
   - Enable rule

2. **Test**:
   - Open new tab
   - Go to a site with JS
   - Open DevTools Network tab
   - [  ] Blocked requests shown as "blocked"
   - [  ] Site may have functionality issues

---

### ✅ Phase 8: Edge Cases & Error Handling

#### Test 8.1: Very Long Rule Name
- [  ] Create rule with 200+ character name
- [  ] Name truncates in list with "..."
- [  ] Full name shown when editing

#### Test 8.2: Special Characters in Pattern
- [  ] URL pattern with unicode: "https://例え.jp"
- [  ] URL pattern with query: "https://site.com?param=value"
- [  ] URL pattern with hash: "https://site.com#section"
- [  ] All save and work correctly

#### Test 8.3: Regex Edge Cases
- [  ] Very complex regex pattern
- [  ] Regex with groups: "(https?://)(.*)"
- [  ] Validates and saves

#### Test 8.4: Priority Edge Cases
- [  ] Priority = 1 (highest)
- [  ] Priority = 1000 (lowest allowed)
- [  ] Try priority = 0 (should use default)
- [  ] Try priority = 9999 (should clamp to max)

---

### ✅ Phase 9: UI/UX Testing

#### Test 9.1: Dark Mode Support
- [  ] System in light mode → extension shows light theme
- [  ] Switch system to dark mode
- [  ] Extension follows dark theme
- [  ] All colors readable
- [  ] No contrast issues

#### Test 9.2: Responsive Behavior
- [  ] Popup maintains 600x500 size
- [  ] Content scrolls if too many rules
- [  ] Scrollbar is thin and styled
- [  ] No horizontal scroll

#### Test 9.3: Loading States
- [  ] On popup open, shows loading spinner briefly
- [  ] Text: "Loading rules..."
- [  ] Then shows rules or empty state

#### Test 9.4: Accessibility
- [  ] Tab through all interactive elements
- [  ] Focus visible on all buttons/inputs
- [  ] Toggle has aria-label
- [  ] Modal can be closed with Escape key
- [  ] Screen reader friendly (if available)

---

### ✅ Phase 10: Performance Testing

#### Test 10.1: Many Rules Performance
- [  ] Create 20+ rules
- [  ] Popup opens quickly (< 1 second)
- [  ] List scrolls smoothly
- [  ] Toggle rule: instant response
- [  ] Edit rule: opens instantly

#### Test 10.2: Rule Application Speed
- [  ] Create rule for frequently visited site
- [  ] Enable rule
- [  ] Visit site
- [  ] Rule applies instantly (no delay)
- [  ] No impact on page load time

---

## Bug Reporting Template

If you find a bug, report it with this format:

```
**Bug**: [Short description]

**Steps to Reproduce**:
1.
2.
3.

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Browser**: Chrome [version]
**Extension Version**: 1.0.0
**Screenshot**: [if applicable]
```

---

## Test Results Template

```
Date: [DATE]
Tester: [NAME]
Browser: Chrome [VERSION]
Extension Version: 1.0.0

Phase 1: [PASS/FAIL] - [Notes]
Phase 2: [PASS/FAIL] - [Notes]
Phase 3: [PASS/FAIL] - [Notes]
Phase 4: [PASS/FAIL] - [Notes]
Phase 5: [PASS/FAIL] - [Notes]
Phase 6: [PASS/FAIL] - [Notes]
Phase 7: [PASS/FAIL] - [Notes]
Phase 8: [PASS/FAIL] - [Notes]
Phase 9: [PASS/FAIL] - [Notes]
Phase 10: [PASS/FAIL] - [Notes]

Total: [X/10] phases passed

Critical Issues Found: [LIST]
Minor Issues Found: [LIST]
```

---

## Next Steps After Testing

1. Fix any critical bugs found
2. Document known issues in README
3. Create GitHub issues for bugs
4. Update user documentation
5. Prepare for production release

---

**Happy Testing! 🧪**
