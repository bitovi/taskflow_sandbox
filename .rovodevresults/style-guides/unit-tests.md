# Unit Tests Style Guide

## Unique Patterns and Conventions

### 1. Jest with Testing Library Import Pattern
Standard import structure for component tests:

```typescript
// tests/unit/button.test.tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'
```

### 2. Accessible Query Priority
Use accessibility-focused queries (getByRole, getByLabelText):

```typescript
test('renders with children and is enabled by default', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
})
```

### 3. Server Action Mocking Pattern
Mock server actions and Prisma client consistently:

```typescript
// tests/unit/tasks-actions.test.ts
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
```

### 4. FormData Testing Pattern
Test server actions using FormData construction:

```typescript
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
```

### 5. User Event Setup Pattern
Use userEvent.setup() for interaction testing:

```typescript
test('handles user input', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Type here" />);
    
    const input = screen.getByPlaceholderText('Type here');
    await user.type(input, 'Hello world');
    
    expect(input).toHaveValue('Hello world');
});
```

### 6. beforeEach Cleanup Pattern
Clear mocks between tests:

```typescript
describe('Tasks Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
});
```

### 7. Utility Function Edge Case Testing
Test edge cases and expected behavior:

```typescript
// tests/unit/date-utils.test.ts
test('parseDateString converts YYYY-MM-DD to Date at local noon', () => {
    const result = parseDateString('2023-12-25');
    expect(result.getFullYear()).toBe(2023);
    expect(result.getMonth()).toBe(11); // December (0-indexed)
    expect(result.getDate()).toBe(25);
    expect(result.getHours()).toBe(12);
});
```

### 8. Component State Testing
Test component props and state changes:

```typescript
test('supports disabled prop', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button', { name: /disabled/i })).toBeDisabled()
})
```

### 9. Seed Helper Function Testing
Test utility functions with array operations:

```typescript
// tests/unit/seed-helpers.test.js
test('getRandomElement returns item from array', () => {
    const items = ['a', 'b', 'c'];
    const result = getRandomElement(items);
    expect(items).toContain(result);
});
```

### 10. Class Name Utility Testing
Test utility functions with various input types:

```typescript
// tests/unit/utils-cn.test.ts
test('filters out falsy values', () => {
    expect(cn('class1', undefined, 'class2', false, null)).toBe('class1 class2');
});
```