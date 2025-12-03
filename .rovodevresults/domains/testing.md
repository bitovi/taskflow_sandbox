# Testing Domain Implementation

## Overview
TaskFlow implements a comprehensive testing strategy with Jest for unit tests, Playwright for end-to-end tests, and Testing Library for component testing with accessibility-focused assertions.

## Testing Architecture

### Test Structure
```
tests/
├── unit/                    # Component and utility unit tests
│   ├── button.test.tsx
│   ├── create-task-form.test.tsx
│   ├── date-utils.test.ts
│   ├── input.test.tsx
│   ├── login-actions.test.ts
│   ├── seed-helpers.test.js
│   ├── tasks-actions.test.ts
│   └── utils-cn.test.ts
├── e2e/                     # End-to-end workflow tests
│   ├── auth.spec.ts
│   ├── global-setup.js
│   ├── global-teardown.js
│   ├── kanban.spec.ts
│   └── tasks.spec.ts
├── jest.setup.ts           # Global Jest configuration
└── test-results/           # Generated test artifacts
```

### Configuration Files
```javascript
// jest.config.cjs
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

## Required Patterns

### 1. Component Testing with Testing Library
Use React Testing Library for component testing with accessibility focus:

```tsx
// tests/unit/button.test.tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button component', () => {
    test('renders with children and is enabled by default', () => {
        render(<Button>Click me</Button>)
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    test('supports disabled prop', () => {
        render(<Button disabled>Disabled</Button>)
        expect(screen.getByRole('button', { name: /disabled/i })).toBeDisabled()
    })
})
```

### 2. Server Action Testing
Test server actions with proper mocking and error scenarios:

```typescript
// tests/unit/tasks-actions.test.ts
import { createTask, deleteTask, updateTaskStatus } from '@/app/(dashboard)/tasks/actions';
import { getCurrentUser } from '@/app/login/actions';

// Mock dependencies
jest.mock('@/app/login/actions');
jest.mock('@/app/generated/prisma', () => ({
    PrismaClient: jest.fn(() => ({
        task: {
            create: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
        }
    }))
}));

describe('Tasks Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('createTask returns error when not authenticated', async () => {
        (getCurrentUser as jest.Mock).mockResolvedValue(null);
        
        const formData = new FormData();
        formData.append('title', 'Test Task');
        
        const result = await createTask(formData);
        
        expect(result).toEqual({
            error: "Not authenticated.",
            success: false,
            message: "Not authenticated."
        });
    });
});
```

### 3. E2E Testing with Playwright
Use Playwright for complete user workflow testing:

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Auth flows', () => {
    test('signup, see avatar, and logout', async ({ page }) => {
        const email = `e2e-${Date.now()}@example.com`;
        await page.goto('/signup');

        await page.fill('input#name', 'E2E Tester');
        await page.fill('input#email', email);
        await page.fill('input#password', 'testpassword');
        await Promise.all([
            page.waitForNavigation(),
            page.click('button:has-text("Sign Up")'),
        ]);

        // After signup we should be redirected to home and see the avatar
        await expect(page).toHaveURL(/\//);

        const avatarTrigger = page.locator('[data-testid="auth-avatar"]');
        await expect(avatarTrigger).toBeVisible({ timeout: 5000 });
        await avatarTrigger.first().click();
        await page.click('text=Log out');
        await expect(page).toHaveURL(/\/login/);
    });
});
```

### 4. Test Data Management
Use stable test selectors with data-testid attributes:

```tsx
// components/task-list.tsx
<Card data-testid={`task-card-${task.id}`}>
    <Button data-testid={`task-menu-${task.id}`} variant="ghost" size="icon">
        <MoreHorizontal className="h-4 w-4" />
    </Button>
</Card>

// In tests
const taskCard = page.locator('[data-testid="task-card-1"]');
await expect(taskCard).toBeVisible();
```

## Testing Utilities

### Global Test Setup
```typescript
// jest.setup.ts
import '@testing-library/jest-dom'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn()
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '';
  }
}));
```

### E2E Test Setup and Teardown
```javascript
// tests/e2e/global-setup.js
const { chromium } = require('@playwright/test');

module.exports = async config => {
    console.log('🧪 Setting up E2E tests...');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Any global setup needed
    await page.goto('http://localhost:3000');
    
    await browser.close();
    console.log('✅ E2E setup complete');
};

// tests/e2e/global-teardown.js
module.exports = async config => {
    console.log('🧹 Cleaning up E2E tests...');
    // Any cleanup needed
    console.log('✅ E2E cleanup complete');
};
```

## Test Categories and Patterns

### Unit Tests for UI Components
Test component rendering and user interactions:

```tsx
// tests/unit/input.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input component', () => {
    test('renders input element', () => {
        render(<Input placeholder="Test input" />);
        expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
    });

    test('handles user input', async () => {
        const user = userEvent.setup();
        render(<Input placeholder="Type here" />);
        
        const input = screen.getByPlaceholderText('Type here');
        await user.type(input, 'Hello world');
        
        expect(input).toHaveValue('Hello world');
    });
});
```

### Unit Tests for Utilities
Test utility functions with edge cases:

```typescript
// tests/unit/date-utils.test.ts
import { parseDateString, formatDateForInput, formatDateForDisplay } from '@/lib/date-utils';

describe('Date utilities', () => {
    test('parseDateString converts YYYY-MM-DD to Date at local noon', () => {
        const result = parseDateString('2023-12-25');
        expect(result.getFullYear()).toBe(2023);
        expect(result.getMonth()).toBe(11); // December (0-indexed)
        expect(result.getDate()).toBe(25);
        expect(result.getHours()).toBe(12);
    });

    test('formatDateForDisplay returns month abbreviation and day', () => {
        const date = new Date(2023, 11, 25); // December 25, 2023
        expect(formatDateForDisplay(date)).toBe('Dec 25');
    });
});
```

### E2E Tests for User Workflows
Test complete user journeys:

```typescript
// tests/e2e/tasks.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Task management', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/login');
        await page.fill('input#email', 'alice@example.com');
        await page.fill('input#password', 'password123');
        await page.click('button:has-text("Log In")');
        await expect(page).toHaveURL(/\//);
    });

    test('creates a new task', async ({ page }) => {
        await page.goto('/tasks/new');
        
        await page.fill('input[name="title"]', 'E2E Test Task');
        await page.fill('textarea[name="description"]', 'This is a test task');
        await page.selectOption('select[name="priority"]', 'high');
        
        await page.click('button:has-text("Create Task")');
        
        // Should redirect to tasks page and show success
        await expect(page).toHaveURL('/tasks');
        await expect(page.locator('text=E2E Test Task')).toBeVisible();
    });
});
```

## Testing Configuration

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  globalSetup: require.resolve('./tests/e2e/global-setup.js'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.js'),
});
```

## Test Data and Mocking

### Database Seeding for Tests
```javascript
// tests/unit/seed-helpers.test.js
const { getRandomElement, getRandomDate } = require('../../prisma/seed');

describe('Seed helpers', () => {
    test('getRandomElement returns item from array', () => {
        const items = ['a', 'b', 'c'];
        const result = getRandomElement(items);
        expect(items).toContain(result);
    });

    test('getRandomDate returns date between bounds', () => {
        const start = new Date('2023-01-01');
        const end = new Date('2023-12-31');
        const result = getRandomDate(start, end);
        
        expect(result.getTime()).toBeGreaterThanOrEqual(start.getTime());
        expect(result.getTime()).toBeLessThanOrEqual(end.getTime());
    });
});
```

### Mocking Patterns
```typescript
// Mock Prisma client
jest.mock('@/app/generated/prisma', () => ({
    PrismaClient: jest.fn(() => ({
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        task: {
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    }))
}));

// Mock Next.js functions
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));
```

## Accessibility Testing Integration

### Testing Library Accessibility Queries
Use semantic queries that match how users interact:

```tsx
// Use role-based queries
expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
expect(screen.getByRole('textbox', { name: /task name/i })).toBeInTheDocument();
expect(screen.getByRole('checkbox', { checked: true })).toBeInTheDocument();

// Use accessible name queries
expect(screen.getByLabelText(/task priority/i)).toBeInTheDocument();
```

### E2E Accessibility Testing
```typescript
test('form is accessible', async ({ page }) => {
    await page.goto('/tasks/new');
    
    // Check for proper labels
    await expect(page.locator('label[for="title"]')).toBeVisible();
    await expect(page.locator('label[for="description"]')).toBeVisible();
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="title"]')).toBeFocused();
});
```