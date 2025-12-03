# Database Schema Style Guide

## Unique Patterns and Conventions

### 1. Prisma Client Output Configuration
Custom output path for generated Prisma client:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../app/generated/prisma"
  engineType = "binary"
}
```

### 2. SQLite with File Database
Local development uses file-based SQLite:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:app.db"
}
```

### 3. Dual Relation Pattern
User model has both created and assigned tasks with explicit relation names:

```prisma
model User {
  id            Int @id @default(autoincrement())
  email         String @unique
  password      String
  name          String
  sessions      Session[]
  createdTasks  Task[] @relation("CreatedTasks")
  assignedTasks Task[] @relation("AssignedTasks")
}
```

### 4. Optional Assignee Pattern
Tasks support optional assignee with nullable foreign key:

```prisma
model Task {
  assigneeId  Int?
  assignee    User?    @relation("AssignedTasks", fields: [assigneeId], references: [id])
  creatorId   Int
  creator     User     @relation("CreatedTasks", fields: [creatorId], references: [id])
}
```

### 5. String-Based Enums
Use String type for status and priority rather than enum:

```prisma
model Task {
  priority    String    // "high" | "medium" | "low"
  status      String    // "todo" | "in_progress" | "review" | "done"
}
```

### 6. Timestamp Pattern
Include both createdAt and updatedAt with defaults:

```prisma
model Task {
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 7. Session Management
Simple session model with token and user relationship:

```prisma
model Session {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}
```

### 8. Required vs Optional Fields
Careful distinction between required and optional fields:

```prisma
model Task {
  name        String      // Required
  description String      // Required (but could be empty)
  dueDate     DateTime?   // Optional
  assigneeId  Int?        // Optional
}
```

### 9. Foreign Key Naming Convention
Foreign keys use ModelId pattern:

```prisma
assigneeId  Int?
creatorId   Int
userId      Int
```

### 10. Auto-incrementing IDs
All models use auto-incrementing integer primary keys:

```prisma
model User {
  id            Int @id @default(autoincrement())
}

model Task {
  id          Int      @id @default(autoincrement())
}
```