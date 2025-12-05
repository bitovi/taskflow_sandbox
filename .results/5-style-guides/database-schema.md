# Database Schema Style Guide

## Unique Patterns

### 1. Generated Client Output Location
Prisma client is generated to a custom location:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../app/generated/prisma"
  engineType = "binary"
}
```

**Key Convention**: Client is in `app/generated/prisma`, not default location.

### 2. SQLite for Local Development
Uses SQLite with file-based database:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:app.db"
}
```

### 3. Self-Referential Relations
Task model has two user relations (creator and assignee):

```prisma
model Task {
  assigneeId  Int?
  assignee    User?    @relation("AssignedTasks", fields: [assigneeId], references: [id])
  creatorId   Int
  creator     User     @relation("CreatedTasks", fields: [creatorId], references: [id])
}

model User {
  createdTasks  Task[] @relation("CreatedTasks")
  assignedTasks Task[] @relation("AssignedTasks")
}
```

**Key Convention**: Named relations with @relation("RelationName") for clarity.

### 4. Optional vs Required Fields
- Optional fields use `?`: `assigneeId Int?`, `dueDate DateTime?`
- Required fields have no marker: `creatorId Int`

### 5. Timestamps Pattern
Standard timestamp fields:

```prisma
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
```

## Database Scripts

### Seeding Pattern
```javascript
// prisma/seed.js
import { PrismaClient } from '../app/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await prisma.user.upsert({
        where: { email: 'alice@example.com' },
        update: {},
        create: {
            email: 'alice@example.com',
            password: hashedPassword,
            name: 'Alice Smith'
        }
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

### Clear Script Pattern
```javascript
// prisma/clear.js
import { PrismaClient } from '../app/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
    await prisma.task.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

## NPM Scripts
```json
{
  "db:setup": "npx prisma db push && npm run db:reset",
  "db:clear": "node prisma/clear.js",
  "db:seed": "node prisma/seed.js",
  "db:reset": "npm run db:clear && npm run db:seed"
}
```
