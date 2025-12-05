# Testing Domain Implementation

## Overview

The testing strategy employs a comprehensive dual approach with Playwright for end-to-end browser testing and Jest with React Testing Library for unit and component testing. E2E tests validate complete user workflows while unit tests ensure component behavior and business logic correctness.

## Key Technologies

- **Playwright v1.49.1** - E2E browser testing
- **Jest v29.7.0** - JavaScript testing framework
- **React Testing Library v16.1.0** - React component testing
- **ts-jest v29.2.5** - TypeScript support for Jest
- **@testing-library/user-event v14.5.2** - User interaction simulation
- **@testing-library/jest-dom v6.6.3** - DOM matchers

## Test Structure

```
tests/
├── e2e/                          # End-to-end tests
│   ├── auth.spec.ts             # Authentication flows
│   ├── tasks.spec.ts            # Task CRUD operations
│   ├── kanban.spec.ts           # Drag-and-drop interactions
│   ├── global-setup.js          # Database setup
│   └── global-teardown.js       # Database cleanup
└── unit/                         # Unit tests
    ├── button.test.tsx          # Component tests
    ├── create-task-form.test.tsx
    ├── input.test.tsx
    ├── date-utils.test.ts       # Utility tests
    ├── utils-cn.test.ts
    ├── login-actions.test.ts    # Server Action tests
    ├── tasks-actions.test.ts
    └── seed-helpers.test.js
```

## E2E Testing with Playwright

### Configuration

**From playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: 'tests/e2e',
    globalSetup: require.resolve('./tests/e2e/global-setup.js'),
    globalTeardown: require.resolve('./tests/e2e/global-teardown.js'),
    timeout: 30 * 1000,
    expect: { timeout: 5000 },
    fullyParallel: true,
    retries: 0,
    workers: 1,
    use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        actionTimeout: 5000,
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
})
```

**Key configuration:**
- **globalSetup/Teardown** - Database initialization and cleanup
- **timeout** - 30 seconds per test
- **workers: 1** - Serial execution (for database consistency)
- **baseURL** - Test server address
- **trace** - Debugging on failure

### Authentication Tests

**From tests/e2e/auth.spec.ts:**
```typescript
import { test, expect } from '@playwright/test'

test.describe('Auth flows', () => {
    test('signup, see avatar, and logout', async ({ page }) => {
        // Use unique email to avoid conflicts
        const email = `e2e-${Date.now()}@example.com`
        await page.goto('/signup')

        await page.fill('input#name', 'E2E Tester')
        await page.fill('input#email', email)
        await page.fill('input#password', 'testpassword')
        await Promise.all([
            page.waitForNavigation(),
            page.click('button:has-text("Sign Up")'),
        ])

        // After signup, redirected to home
        await expect(page).toHaveURL(/\//)

        // Avatar should be visible
        const avatarTrigger = page.locator('[data-testid="auth-avatar"]')
        await expect(avatarTrigger).toBeVisible({ timeout: 5000 })
        
        // Logout
        await avatarTrigger.first().click()
        await page.click('text=Log out')
        await expect(page).toHaveURL(/\/login/)
    })

    test('login with seeded user and logout', async ({ page }) => {
        await page.goto('/login')
        await page.fill('input#email', 'alice@example.com')
        await page.fill('input#password', 'password123')
        await Promise.all([
            page.waitForNavigation(),
            page.click('button:has-text("Log In")'),
        ])

        await expect(page).toHaveURL(/\//)

        const avatarTrigger = page.locator('[data-testid="auth-avatar"]')
        await expect(avatarTrigger).toBeVisible({ timeout: 5000 })
        await avatarTrigger.first().click()
        await page.click('text=Log out')
        await expect(page).toHaveURL(/\/login/)
    })
})
```

**Pattern elements:**
- **Unique identifiers** - `data-testid` attributes for reliable selection
- **Navigation waits** - `Promise.all([waitForNavigation(), click()])`
- **Timeouts** - Explicit timeouts for async operations
- **Assertions** - URL and element visibility checks

### Task CRUD Tests

**From tests/e2e/tasks.spec.ts:**
```typescript
import { test, expect, Page } from '@playwright/test'

// Helper to log in as a seeded user
async function login(page: Page, email = 'alice@example.com', password = 'password123') {
    await page.goto('/login')
    await page.fill('input#email', email)
    await page.fill('input#password', password)
    await Promise.all([
        page.waitForNavigation(),
        page.click('button:has-text("Log\u00A0In")'),
    ])
    await expect(page).toHaveURL(/\//)
}

// Helper to create a new task via the UI
async function createTaskViaUI(page: Page, titlePrefix = 'E2E Task') {
    const title = `${titlePrefix} ${Date.now()}`
    await page.goto('/tasks/new')
    await page.fill('input#title', title)
    await page.fill('textarea#description', 'Created by e2e test')
    await Promise.all([
        page.waitForNavigation(),
        page.click('button:has-text("Create Task")'),
    ])
    await expect(page).toHaveURL(/\/tasks/)
    await expect(page.locator('h3', { hasText: title }).first()).toBeVisible({ timeout: 5000 })
    return title
}

test.describe('Task CRUD flows', () => {
    test('create task', async ({ page }) => {
        await login(page)
        const title = await createTaskViaUI(page, 'E2E Create')
        await expect(page.locator('h3', { hasText: title })).toBeVisible()
    })

    test('edit task via modal form', async ({ page }) => {
        await login(page)
        const title = await createTaskViaUI(page, 'E2E Edit')

        const card = page.locator(`[data-testid^="task-card-"]`)
            .filter({ has: page.locator('h3', { hasText: title }) })
            .first()

        // Open the dropdown menu and click Edit
        const menuTrigger = card.locator(`[data-testid^="task-menu-"]`).first()
        await expect(menuTrigger).toBeVisible()
        await menuTrigger.click()
        await page.locator('[data-testid^="task-edit-"]:visible').first().click()

        // In the edit dialog, change the title and save
        const newTitle = `${title} (edited)`
        const titleInput = page.locator('input#title').first()
        await expect(titleInput).toBeVisible({ timeout: 5000 })
        await titleInput.fill(newTitle)
        await Promise.all([
            page.waitForResponse((resp) => resp.url().includes('/api') || resp.status() === 200, { timeout: 5000 }).catch(() => true),
            page.click('button:has-text("Save Changes")'),
        ])

        // Verify the updated title is visible
        await expect(page.locator('h3', { hasText: newTitle })).toBeVisible({ timeout: 5000 })
    })

    test('delete task', async ({ page }) => {
        await login(page)
        const title = await createTaskViaUI(page, 'E2E Delete')

        const card = page.locator(`[data-testid^="task-card-"]`)
            .filter({ has: page.locator('h3', { hasText: title }) })
            .first()

        const menuTrigger = card.locator(`[data-testid^="task-menu-"]`).first()
        await expect(menuTrigger).toBeVisible()
        await menuTrigger.click()
        await page.click(`[data-testid^="task-delete-"]`)

        // Task should be removed from the list
        await expect(page.locator('h3', { hasText: title })).toHaveCount(0, { timeout: 5000 })
    })
})
```

**Helper patterns:**
- **Reusable login helper** - DRY principle for auth
- **Task creation helper** - Shared setup logic
- **Unique titles** - Timestamp-based to avoid conflicts
- **Scoped selectors** - Filter by parent to target specific elements

### Drag-and-Drop Tests

**From tests/e2e/kanban.spec.ts:**
```typescript
import { test, expect, type Page, type Locator } from '@playwright/test'

const EMAIL = 'alice@example.com'
const PASSWORD = 'password123'

async function login(page: Page) {
    await page.goto('/login')
    await page.fill('input#email', EMAIL)
    await page.fill('input#password', PASSWORD)
    await Promise.all([
        page.waitForNavigation(),
        page.click('button:has-text("Log\u00A0In")'),
    ])
    await expect(page).toHaveURL(/\//)
}

test.describe('Kanban drag/drop', () => {
    test('drags a card fully into another column', async ({ page }) => {
        await login(page)
        await page.goto('/board')
        
        // Wait for columns to render
        await expect(page.locator('text=To Do')).toBeVisible()

        // Choose a source card
        const sourceCard = page.locator('h4').first()
            .locator('xpath=ancestor::div[contains(@class, "cursor-pointer")]')
        await expect(sourceCard).toBeVisible({ timeout: 5000 })

        // Choose destination column
        const destColumn = page.locator('text=In Progress').first()
        await expect(destColumn).toBeVisible({ timeout: 5000 })
        const destColumnContainer = destColumn
            .locator('xpath=ancestor::div[contains(@class, "w-80")]')
            .first()

        // Compute centers for drag
        const start = await sourceCard.boundingBox()
        const dest = await destColumnContainer.boundingBox()
        if (!start || !dest) throw new Error('Could not measure elements')

        const startX = start.x + start.width / 2
        const startY = start.y + start.height / 2
        const destX = dest.x + dest.width / 2 + 5
        const destY = dest.y + dest.height / 2 + 5

        // Perform drag
        await page.mouse.move(startX, startY)
        await page.mouse.down()
        await page.mouse.move((startX + destX) / 2, (startY + destY) / 2, { steps: 10 })
        await page.mouse.move(destX, destY, { steps: 10 })
        await page.mouse.up()

        // Verify card moved
        const cardText = await sourceCard.locator('h4, h3').first().innerText()
        const destMatch = destColumnContainer.locator(`text=${cardText}`).first()
        await expect(destMatch).toBeVisible({ timeout: 5000 })
    })
})
```

**Drag-and-drop specifics:**
- **Mouse movements** - Low-level mouse control
- **Bounding boxes** - Calculate element positions
- **Stepped movement** - Smooth drag with `steps` parameter
- **Visual verification** - Check element moved to correct column

## Unit Testing with Jest

### Configuration

**From jest.config.cjs:**
```javascript
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: ['/node_modules/', '/.next/', '/tests/e2e/'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }]
    },
    transformIgnorePatterns: ['/node_modules/(?!(.*?))'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '\\.(css|less|sass|scss)$': 'identity-obj-proxy'
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}
```

**Key configuration:**
- **preset: ts-jest** - TypeScript support
- **testEnvironment: jsdom** - Browser-like environment
- **moduleNameMapper** - Resolve `@/` paths and CSS imports
- **setupFilesAfterEnv** - Global test setup

**From jest.setup.ts:**
```typescript
import '@testing-library/jest-dom'
```

### Component Tests

**From tests/unit/button.test.tsx:**
```tsx
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

**Pattern elements:**
- **render()** - Mount component in test environment
- **screen queries** - Find elements by role/text
- **jest-dom matchers** - `toBeInTheDocument()`, `toBeDisabled()`

**From tests/unit/input.test.tsx:**
```tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import { Input } from '@/components/ui/input'

describe('Input component', () => {
    test('renders input element', () => {
        render(<Input placeholder="Enter text" />)
        expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument()
    })

    test('supports type prop', () => {
        render(<Input type="email" />)
        const input = screen.getByRole('textbox')
        expect(input).toHaveAttribute('type', 'email')
    })
})
```

### Form Tests

**From tests/unit/create-task-form.test.tsx:**
```tsx
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock server actions
jest.mock('@/app/(dashboard)/tasks/actions', () => ({
    createTask: jest.fn(async (formData: FormData) => ({ 
        success: true, 
        message: 'ok', 
        error: null 
    }))
}))

jest.mock('@/app/login/actions', () => ({
    getAllUsers: jest.fn(async () => [{ id: 1, name: 'Alice' }])
}))

import { CreateTaskForm } from '@/components/create-task-form'
import { createTask } from '@/app/(dashboard)/tasks/actions'

describe('CreateTaskForm', () => {
    test('renders form fields and submits', async () => {
        render(<CreateTaskForm />)

        // Wait for users to load
        await waitFor(() => expect(createTask).not.toHaveBeenCalled())

        const title = screen.getByLabelText(/title/i)
        await userEvent.type(title, 'New Task')

        const submit = screen.getByRole('button', { name: /create task/i })
        await userEvent.click(submit)

        await waitFor(() => expect(createTask).toHaveBeenCalled())
    })
})
```

**Mocking patterns:**
- **jest.mock()** - Mock entire modules
- **Mock functions** - Return controlled responses
- **userEvent** - Simulate realistic user interactions
- **waitFor()** - Wait for async operations

### Server Action Tests

**From tests/unit/login-actions.test.ts:**
```typescript
import { login, getCurrentUser } from '@/app/login/actions'

jest.mock('@/app/generated/prisma', () => ({
    PrismaClient: jest.fn(() => ({
        user: { 
            findUnique: jest.fn().mockResolvedValue({ 
                id: 1, 
                password: '$2a$10$hashed' 
            }) 
        },
        session: { 
            create: jest.fn().mockResolvedValue(true), 
            deleteMany: jest.fn() 
        },
        $disconnect: jest.fn()
    }))
}))

jest.mock('next/headers', () => ({
    cookies: jest.fn(async () => ({
        set: jest.fn(),
        get: jest.fn(() => ({ value: 'token' })),
    }))
}))

jest.mock('bcryptjs', () => ({ 
    compare: jest.fn(async () => true) 
}))

jest.mock('crypto', () => ({ 
    randomBytes: jest.fn(() => ({ toString: () => 'token' })) 
}))

jest.mock('next/navigation', () => ({ 
    redirect: jest.fn() 
}))

describe('login actions', () => {
    test('login validates missing fields', async () => {
        const res = await login(new FormData())
        expect(res).toHaveProperty('error')
    })

    test('getCurrentUser returns null when no session', async () => {
        const actions = require('@/app/login/actions')
        const cookieModule = require('next/headers')
        cookieModule.cookies = jest.fn(async () => ({ 
            get: () => undefined 
        }))
        const user = await actions.getCurrentUser()
        expect(user).toBeNull()
    })
})
```

**Server Action testing:**
- **Mock dependencies** - Prisma, cookies, bcrypt, crypto, navigation
- **Test validation** - Check error handling
- **Test edge cases** - Missing data, null returns

### Utility Tests

**From tests/unit/utils-cn.test.ts:**
```typescript
import { cn } from '@/lib/utils'

describe('cn utility', () => {
    test('joins class names', () => {
        expect(cn('foo', 'bar')).toBe('foo bar')
    })

    test('filters out falsy values', () => {
        expect(cn('foo', false, 'bar', null, undefined)).toBe('foo bar')
    })

    test('handles conditional classes', () => {
        const isActive = true
        expect(cn('base', isActive && 'active')).toBe('base active')
    })
})
```

**From tests/unit/date-utils.test.ts:**
```typescript
import { formatDateForInput, parseDateString } from '@/lib/date-utils'

describe('date utilities', () => {
    test('formatDateForInput returns YYYY-MM-DD', () => {
        const date = new Date('2024-01-15')
        expect(formatDateForInput(date)).toBe('2024-01-15')
    })

    test('parseDateString converts to Date', () => {
        const result = parseDateString('2024-01-15')
        expect(result).toBeInstanceOf(Date)
        expect(result.getFullYear()).toBe(2024)
    })
})
```

## Test Data Management

### Global Setup

**From tests/e2e/global-setup.js:**
```javascript
// Initialize test database before E2E tests
module.exports = async function globalSetup() {
    // Run migrations
    // Seed test data
    console.log('E2E test setup complete')
}
```

### Global Teardown

**From tests/e2e/global-teardown.js:**
```javascript
// Clean up test database after E2E tests
module.exports = async function globalTeardown() {
    // Clear test data
    console.log('E2E test teardown complete')
}
```

## Running Tests

**Package.json scripts:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:coverage": "jest --coverage"
  }
}
```

**Commands:**
- `npm test` - Run all Jest unit tests
- `npm run test:watch` - Watch mode for development
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:e2e:ui` - Interactive Playwright UI mode
- `npm run test:coverage` - Generate coverage report

## Best Practices

### 1. Use Data Test IDs for E2E

```tsx
// ✅ Good - Stable test selector
<button data-testid="auth-avatar">
  <Avatar />
</button>

// In test
page.locator('[data-testid="auth-avatar"]')

// ❌ Bad - Fragile text selector
page.locator('button:has-text("User Avatar")')
```

### 2. Mock External Dependencies

```typescript
// ✅ Good - Mock Prisma and external modules
jest.mock('@/app/generated/prisma')
jest.mock('next/headers')

// ❌ Bad - Real database calls in unit tests
// (Slow, unreliable, requires database)
```

### 3. Use Helper Functions

```typescript
// ✅ Good - Reusable helpers
async function login(page: Page) {
    await page.goto('/login')
    // ... login logic
}

test('edit task', async ({ page }) => {
    await login(page)
    // ... test logic
})

// ❌ Bad - Duplicate login code in every test
```

### 4. Test User Interactions, Not Implementation

```tsx
// ✅ Good - Test from user perspective
await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
await userEvent.click(screen.getByRole('button', { name: /submit/i }))

// ❌ Bad - Test implementation details
wrapper.find('Input').prop('onChange')({ target: { value: 'test@example.com' } })
wrapper.find('Button').simulate('click')
```

### 5. Use Appropriate Queries

```tsx
// ✅ Good - Semantic queries by role/label
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)

// ❌ Bad - Fragile queries by class/structure
screen.getByClassName('submit-button')
```

### 6. Wait for Async Operations

```typescript
// ✅ Good - Explicit waits
await waitFor(() => expect(mockFn).toHaveBeenCalled())
await expect(element).toBeVisible({ timeout: 5000 })

// ❌ Bad - Fixed delays or no waiting
await page.waitForTimeout(1000)
```

### 7. Test Edge Cases

```typescript
// ✅ Good - Test error conditions
test('shows error when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'))
    // ... test error display
})

// ❌ Bad - Only test happy path
test('logs in successfully', async () => {
    // ... only test successful login
})
```

## Test Coverage

### Coverage Configuration

```javascript
// jest.config.cjs
module.exports = {
    collectCoverageFrom: [
        'app/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
    ],
    coverageThresholds: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },
}
```

## Summary

The testing domain demonstrates comprehensive test coverage:

1. **Playwright E2E** - Full user workflows in real browser
2. **Jest + RTL unit tests** - Component and logic testing
3. **Helper functions** - DRY test code
4. **Mock dependencies** - Isolated, fast unit tests
5. **Data test IDs** - Stable selectors
6. **Async handling** - Proper waits and assertions
7. **User-centric tests** - Test behavior, not implementation
8. **Coverage reporting** - Track test completeness
9. **Global setup/teardown** - Database management
10. **Multiple test types** - Auth, CRUD, drag-and-drop, components

This comprehensive testing strategy ensures application reliability and maintainability.
