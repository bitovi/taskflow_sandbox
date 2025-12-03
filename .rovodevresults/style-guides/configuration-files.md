# Configuration Files Style Guide

## Unique Patterns and Conventions

### 1. TypeScript Config with Next.js Plugin
Modern TypeScript configuration with Next.js integration:

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
}
```

### 2. Next.js Config with Server Actions
Enable server actions with allowed origins:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"]
    }
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};
```

### 3. Jest Config with Next.js Integration
Use Next.js Jest plugin with custom setup:

```javascript
// jest.config.cjs
const nextJest = require('next/jest')

const createJestConfig = nextJest({ dir: './' })

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

### 4. Playwright Config with Multiple Browsers
Configure multiple browser testing with global setup:

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  globalSetup: require.resolve('./tests/e2e/global-setup.js'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.js'),
});
```

### 5. ESLint Flat Config Pattern
Modern ESLint configuration using flat config:

```javascript
// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [...compat.extends("next/core-web-vitals")];
```

### 6. PostCSS with Tailwind
Simple PostCSS configuration for Tailwind:

```javascript
// postcss.config.mjs
const config = {
  plugins: {
    tailwindcss: {},
  },
};

export default config;
```

### 7. Package.json Script Organization
Organized npm scripts with database management:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "setup": "npm i && npm run db:setup",
    "db:setup": "npx prisma db push && npm run db:reset",
    "db:clear": "node prisma/clear.js",
    "db:seed": "node prisma/seed.js",
    "db:reset": "npm run db:clear && npm run db:seed"
  }
}
```

### 8. Development Build Tolerance
Allow builds to continue despite TypeScript/ESLint errors:

```typescript
// next.config.ts
eslint: { ignoreDuringBuilds: true },
typescript: { ignoreBuildErrors: true },
```