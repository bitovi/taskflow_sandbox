# Testing Domain

## Overview
The project uses Jest + React Testing Library for unit tests and Playwright for end-to-end tests.

## Test Structure

```
tests/
├── unit/                           # Unit and component tests
│   ├── button.test.tsx
│   ├── create-task-form.test.tsx
│   ├── date-utils.test.ts
│   ├── input.test.tsx
│   ├── login-actions.test.ts
│   ├── seed-helpers.test.js
│   ├── tasks-actions.test.ts
│   └── utils-cn.test.ts
└── e2e/                            # End-to-end tests
    ├── auth.spec.ts
    ├── kanban.spec.ts
    ├── tasks.spec.ts
    ├── global-setup.js
    └── global-teardown.js
```

## Unit Testing Patterns

### 1. Component Testing

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

**Key Points:**
- Use `@testing-library/react` for component tests
- Query by role for accessibility
- Test props and behavior

### 2. Utility Function Testing

```typescript
// tests/unit/date-utils.test.ts
import { parseDateString, formatDateForInput, formatDateForDisplay } from '@/lib/date-utils'

describe('Date Utils', () => {
    test('parseDateString creates Date at local noon', () => {
        const result = parseDateString('2024-01-15')
        expect(result.getFullYear()).toBe(2024)
        expect(result.getMonth()).toBe(0) // January
        expect(result.getDate()).toBe(15)
        expect(result.getHours()).toBe(12)
    })

    test('formatDateForInput returns YYYY-MM-DD', () => {
        const date = new Date(2024, 0, 15, 12, 0, 0)
        expect(formatDateForInput(date)).toBe('2024-01-15')
    })
})
```

**Key Points:**
- Test pure functions directly
- Cover edge cases
- Test return values and side effects

### 3. Server Action Testing

```typescript
// tests/unit/login-actions.test.ts
import { login } from '@/app/login/actions'
import { PrismaClient } from '@/app/generated/prisma'

jest.mock('@/app/generated/prisma')
jest.mock('next/navigation', () => ({
    redirect: jest.fn()
}))

describe('login action', () => {
    test('returns error for invalid credentials', async () => {
        const formData = new FormData()
        formData.set('email', 'test@example.com')
        formData.set('password', 'wrongpassword')
        
        const result = await login(formData)
        expect(result.error).toBeDefined()
    })
})
```

**Key Points:**
- Mock Prisma and Next.js modules
- Test error cases
- Use FormData (actual Server Action input)

## E2E Testing Patterns

### 1. Global Setup for Seeding

```javascript
// tests/e2e/global-setup.js
import { PrismaClient } from '@/app/generated/prisma'
import bcrypt from 'bcryptjs'

export default async function globalSetup() {
    const prisma = new PrismaClient()
    
    // Seed test user
    const hashedPassword = await bcrypt.hash('password123', 10)
    await prisma.user.upsert({
        where: { email: 'alice@example.com' },
        update: {},
        create: {
            email: 'alice@example.com',
            password: hashedPassword,
            name: 'Alice Smith'
        }
    })
    
    await prisma.$disconnect()
}
```

**Key Points:**
- Seed consistent test data
- Use `upsert` for idempotency
- Clean up Prisma connection

### 2. Login Helper

```typescript
// tests/e2e/tasks.spec.ts
async function login(page: Page, email = 'alice@example.com', password = 'password123') {
    await page.goto('/login');
    await page.fill('input#email', email);
    await page.fill('input#password', password);
    await Promise.all([
        page.waitForNavigation(),
        page.click('button:has-text("Log\u00A0In")'),
    ]);
    await expect(page).toHaveURL(/\//);
}
```

**Key Points:**
- Reusable login helper
- Wait for navigation
- Verify successful redirect

### 3. E2E Test Example

```typescript
// tests/e2e/tasks.spec.ts
import { test, expect, Page } from '@playwright/test';

test.describe('Task CRUD flows', () => {
    test('create task', async ({ page }) => {
        await login(page);
        
        const title = `E2E Task ${Date.now()}`;
        await page.goto('/tasks/new');
        await page.fill('input#title', title);
        await page.fill('textarea#description', 'Created by e2e test');
        
        await Promise.all([
            page.waitForNavigation(),
            page.click('button:has-text("Create Task")'),
        ]);
        
        await expect(page).toHaveURL(/\/tasks/);
        await expect(page.locator('h3', { hasText: title })).toBeVisible();
    });

    test('edit task via modal form', async ({ page }) => {
        await login(page);
        const title = await createTaskViaUI(page, 'E2E Edit');

        const card = page.locator(`[data-testid^="task-card-"]`)
            .filter({ has: page.locator('h3', { hasText: title }) })
            .first();

        const menuTrigger = card.locator(`[data-testid^="task-menu-"]`).first();
        await menuTrigger.click();
        
        await page.click('text=Edit');
        
        // Edit in modal
        await page.fill('input#title', `${title} EDITED`);
        await page.click('button:has-text("Update Task")');
        
        await expect(page.locator('h3', { hasText: `${title} EDITED` })).toBeVisible();
    });
});
```

**Key Points:**
- Use `data-testid` for stable selectors
- Test full user workflows
- Verify UI updates after actions

### 4. Drag-and-Drop Testing

```typescript
// tests/e2e/kanban.spec.ts
test('drag task between columns', async ({ page }) => {
    await login(page);
    await page.goto('/board');

    const taskCard = page.locator('[data-testid^="task-card-"]').first();
    const taskTitle = await taskCard.locator('h4').textContent();

    const targetColumn = page.locator('[data-testid="column-in_progress"]');
    
    await taskCard.dragTo(targetColumn);
    
    await expect(targetColumn.locator('h4', { hasText: taskTitle })).toBeVisible();
});
```

**Key Points:**
- Use Playwright's `dragTo` method
- Verify task appears in new column
- Test actual DOM manipulation

## Configuration

### Jest Config

```javascript
// jest.config.cjs
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
}
```

### Playwright Config

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:3000',
  },
  globalSetup: './tests/e2e/global-setup.js',
  globalTeardown: './tests/e2e/global-teardown.js',
})
```

## Common Patterns

### Test Data Generation
```typescript
const title = `E2E Task ${Date.now()}`;  // Unique titles
```

### Waiting for Async Actions
```typescript
await Promise.all([
    page.waitForNavigation(),
    page.click('button'),
]);
```

### Scoped Selectors
```typescript
const card = page.locator('[data-testid="task-card-1"]');
await card.locator('button').click();  // Button within card
```

## Constraints
- **data-testid for E2E**: Use `data-testid` attributes for stable E2E selectors
- **No Mocking in E2E**: Test actual Server Actions and database
- **Seed Data**: Use global setup for consistent test data
- **Cleanup**: Reset database state between test runs
- **Jest for Unit**: Use Jest + RTL for components/functions
- **Playwright for E2E**: Use Playwright for full workflows
