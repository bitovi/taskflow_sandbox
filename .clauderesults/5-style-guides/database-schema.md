# Database Schema Style Guide

## Unique Patterns in This Codebase

### 1. **Custom Prisma Client Output Location**
Prisma generates client to non-standard location:
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../app/generated/prisma"
  engineType = "binary"
}
```
**Note**: Standard location would be `node_modules/.prisma/client`

### 2. **Binary Engine Type**
Explicitly specifies binary engine:
```prisma
engineType = "binary"
```

### 3. **SQLite Database**
Uses SQLite with file-based database:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:app.db"
}
```

### 4. **Autoincrement Primary Keys**
All models use autoincrement integer IDs:
```prisma
model User {
  id            Int @id @default(autoincrement())
}
```

### 5. **Session-Based Authentication**
Dedicated Session model for cookie-based auth:
```prisma
model Session {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}
```

### 6. **Named Relation Pattern**
Relations use descriptive names with @relation:
```prisma
model Task {
  assigneeId  Int?
  assignee    User?    @relation("AssignedTasks", fields: [assigneeId], references: [id])
  creatorId   Int
  creator     User     @relation("CreatedTasks", fields: [creatorId], references: [id])
}
```

### 7. **Inverse Relations on User Model**
User model explicitly defines inverse relations:
```prisma
model User {
  sessions      Session[]
  createdTasks  Task[] @relation("CreatedTasks")
  assignedTasks Task[] @relation("AssignedTasks")
}
```

### 8. **Optional Foreign Keys**
Assignee is optional (Int?):
```prisma
model Task {
  assigneeId  Int?
  assignee    User?    @relation("AssignedTasks", fields: [assigneeId], references: [id])
}
```

### 9. **String Types for Enums**
Status and priority stored as String, not enum:
```prisma
model Task {
  priority    String
  status      String
}
```
**Note**: No Prisma enum definitions. Values enforced at application level.

### 10. **Automatic Timestamps**
Models use @default(now()) and @updatedAt:
```prisma
model Task {
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 11. **Optional DateTime Fields**
Due dates are nullable:
```prisma
model Task {
  dueDate     DateTime?
}
```

### 12. **Unique Constraints**
Email and session tokens have unique constraints:
```prisma
model User {
  email         String @unique
}

model Session {
  token     String   @unique
}
```

### 13. **No Composite Keys**
All models use single integer primary key, no compound keys

### 14. **Plain Text Password Storage Pattern**
```prisma
model User {
  password      String
}
```
**Note**: Schema stores as String, hashing done at application level with bcryptjs

### 15. **Three-Model Structure**
Only three models:
- User (authentication and ownership)
- Session (auth state)
- Task (business entity)

### 16. **No Cascade Deletes**
Schema doesn't specify onDelete behavior, defaults to restrict

### 17. **Relation Field Naming**
- Foreign key field: `assigneeId`, `creatorId`, `userId`
- Relation field: `assignee`, `creator`, `user`
- Pattern: lowercase entity name + Id

## Creating a New Model

### Basic Entity Model
```prisma
model Item {
  id          Int      @id @default(autoincrement())
  name        String
  description String
  status      String
  priority    String
  creatorId   Int
  creator     User     @relation("CreatedItems", fields: [creatorId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Model with Optional Relations
```prisma
model Comment {
  id        Int      @id @default(autoincrement())
  content   String
  taskId    Int
  task      Task     @relation(fields: [taskId], references: [id])
  authorId  Int?
  author    User?    @relation("AuthoredComments", fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Junction/Join Table Model
```prisma
model TaskTag {
  id        Int      @id @default(autoincrement())
  taskId    Int
  task      Task     @relation(fields: [taskId], references: [id])
  tagId     Int
  tag       Tag      @relation(fields: [tagId], references: [id])
  createdAt DateTime @default(now())
}

model Tag {
  id        Int        @id @default(autoincrement())
  name      String     @unique
  taskTags  TaskTag[]
  createdAt DateTime   @default(now())
}
```

### Adding Relations to Existing Models
```prisma
// Add to User model
model User {
  // ... existing fields
  items         Item[]      @relation("CreatedItems")
  comments      Comment[]   @relation("AuthoredComments")
}

// Add to Task model
model Task {
  // ... existing fields
  comments      Comment[]
  taskTags      TaskTag[]
}
```

## Migration Pattern

### After Schema Changes
```bash
# Generate migration
npx prisma migrate dev --name add_new_model

# Generate client
npx prisma generate
```

### Seeding Pattern
After migrations, use seed script:
```javascript
// prisma/seed.js
const { PrismaClient } = require('../app/generated/prisma')
const prisma = new PrismaClient()

async function main() {
  // Create seed data
  await prisma.user.create({
    data: {
      name: "Test User",
      email: "test@example.com",
      password: "hashed_password"
    }
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

## Field Naming Conventions

### Standard Fields
- `id` - Primary key (Int)
- `createdAt` - Creation timestamp (DateTime @default(now()))
- `updatedAt` - Update timestamp (DateTime @updatedAt)
- `name` - Display name/title (String)
- `description` - Long text field (String)

### Foreign Keys
- Pattern: `{entity}Id` (camelCase)
- Examples: `userId`, `taskId`, `creatorId`, `assigneeId`

### Relations
- Pattern: lowercase entity name
- Examples: `user`, `task`, `creator`, `assignee`
- Arrays: plural form (`tasks`, `comments`, `sessions`)

### Status/Enum Fields
- Stored as String type
- Values enforced at application level
- Examples: `status`, `priority`, `type`

## Key Principles

### Database Choice
- SQLite for simplicity (file-based)
- Good for development and small deployments
- Switch to PostgreSQL for production scale

### ID Strategy
- Always use autoincrement integers
- Simple and performant for SQLite
- No UUIDs or custom ID schemes

### Timestamp Strategy
- Always include createdAt with @default(now())
- Include updatedAt with @updatedAt for mutable entities
- Use DateTime? for optional dates (dueDate, completedAt)

### Relation Strategy
- Name all non-trivial relations with @relation("Name")
- Use descriptive names (CreatedTasks vs AssignedTasks)
- Make assignee/author relations optional (Int?)
- Always include inverse relations on referenced model

### String vs Enum
- Use String for status/priority fields
- Avoid Prisma enums for flexibility
- Validate at application level

### Optional vs Required
- Make foreign keys optional only when business logic allows
- Nullable: assigneeId (tasks can be unassigned)
- Required: creatorId (every task has a creator)

### Schema Organization
- Models in alphabetical order (optional)
- Group related models together
- User model first (authentication)
- Session model second (authentication)
- Business entities last

## Generator and Datasource Configuration

### Standard Configuration
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../app/generated/prisma"
  engineType = "binary"
}

datasource db {
  provider = "sqlite"
  url      = "file:app.db"
}
```

### For Production (PostgreSQL)
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Common Patterns Summary

1. **Auth Pattern**: User + Session models
2. **Ownership Pattern**: creator relation on entities
3. **Assignment Pattern**: optional assignee relation
4. **Audit Pattern**: createdAt + updatedAt timestamps
5. **Soft State Pattern**: String fields for status/priority
6. **Named Relations Pattern**: @relation("DescriptiveName")
7. **Optional Relations Pattern**: Int? for optional foreign keys
