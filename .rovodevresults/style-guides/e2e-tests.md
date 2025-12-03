# E2E Tests Style Guide

## Unique Patterns and Conventions

### 1. Playwright Import and Test Structure
Standard Playwright test setup with timeout configuration:

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Auth flows', () => {
    test('signup, see avatar, and logout', async ({ page }) => {
        // Test implementation
    });
});
```

### 2. Navigation Wait Pattern
Use Promise.all for navigation and form submission:

```typescript
await Promise.all([
    page.waitForNavigation(),
    page.click('button:has-text("Log In")'),
]);
```

### 3. Dynamic Email Generation
Generate unique emails for signup tests to avoid conflicts:

```typescript
test('signup, see avatar, and logout', async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    await page.goto('/signup');
    
    await page.fill('input#email', email);
});
```

### 4. Data-TestId Selector Pattern
Use data-testid attributes for stable element selection:

```typescript
const avatarTrigger = page.locator('[data-testid="auth-avatar"]');
await expect(avatarTrigger).toBeVisible({ timeout: 5000 });
```

### 5. Seeded User Login Pattern
Use consistent seeded user credentials for login tests:

```typescript
await page.fill('input#email', 'alice@example.com');
await page.fill('input#password', 'password123');
```

### 6. beforeEach Authentication Setup
Set up authentication state before tests that require login:

```typescript
test.describe('Task management', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/login');
        await page.fill('input#email', 'alice@example.com');
        await page.fill('input#password', 'password123');
        await page.click('button:has-text("Log In")');
        await expect(page).toHaveURL(/\//);
    });
});
```

### 7. URL Regex Matching
Use regex patterns for flexible URL matching:

```typescript
await expect(page).toHaveURL(/\//);  // Dashboard home
await expect(page).toHaveURL(/\/login/);  // Login page
```

### 8. Timeout Configuration
Set explicit timeouts for elements that may take time to appear:

```typescript
await expect(avatarTrigger).toBeVisible({ timeout: 5000 });
```

### 9. Form Field Selection Patterns
Use specific selectors for form elements:

```typescript
await page.fill('input[name="title"]', 'E2E Test Task');
await page.fill('textarea[name="description"]', 'This is a test task');
await page.selectOption('select[name="priority"]', 'high');
```

### 10. Text-Based Element Selection
Use text content for button and link selection:

```typescript
await page.click('button:has-text("Create Task")');
await page.click('text=Log out');
await expect(page.locator('text=E2E Test Task')).toBeVisible();
```

### 11. First() Selector for Multiple Elements
Use first() when multiple elements match:

```typescript
await avatarTrigger.first().click();
```