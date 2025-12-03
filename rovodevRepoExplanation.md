# TaskFlow Repository Explanation

## Overview
TaskFlow is a modern **task management application** built as a demo for AI-driven software development workflows. It's specifically designed to showcase how AI can understand codebases and automatically implement features from Jira tickets.

## Technical Stack
- **Frontend**: Next.js 15 with React 19, TypeScript, and App Router
- **Styling**: Tailwind CSS 4 with shadcn/ui components and Radix UI primitives
- **Database**: SQLite with Prisma ORM for local development
- **UI Components**: Custom component library built on Radix primitives
- **Drag & Drop**: `@hello-pangea/dnd` for Kanban functionality
- **Charts**: Recharts for dashboard visualizations
- **Authentication**: Custom session-based auth with bcrypt
- **Testing**: Jest for unit tests, Playwright for e2e tests

## Core Features

### 1. **Dashboard** (`/`)
- Comprehensive analytics with task statistics
- Visual charts showing:
  - Task status distribution (pie chart)
  - Priority breakdown (bar chart)
  - Tasks by assignee and creator
  - Monthly task creation trends
- Key metrics: total tasks, completion rates, active tasks, team size

### 2. **Task Management** (`/tasks`)
- Full CRUD operations for tasks
- Task properties: name, description, priority (high/medium/low), status, due date, assignee
- Server actions for data mutations
- Real-time task list with optimistic updates

### 3. **Kanban Board** (`/board`)
- Drag-and-drop interface with four columns: Todo, In Progress, Review, Done
- Real-time status updates via drag operations
- Visual task cards with assignee avatars, priorities, and due dates

### 4. **Team Management** (`/team`)
- User management and team statistics
- Role-based task assignments

### 5. **Authentication**
- Login/signup pages with session management
- Secure password hashing with bcryptjs
- Protected dashboard routes

## Database Schema
The app uses a clean relational model with three main entities:

```prisma
- User: id, email, password, name, sessions[], createdTasks[], assignedTasks[]
- Session: id, token, userId, createdAt
- Task: id, name, description, priority, status, dueDate, assigneeId, creatorId, timestamps
```

## Architecture Highlights

### 1. **Server Actions Pattern**
- Uses Next.js 15 server actions for form submissions and data mutations
- Type-safe API layer with Prisma client
- Optimistic UI updates for better UX

### 2. **Component Organization**
- Feature-based structure with reusable UI components
- Separation of client/server components
- Custom component library in `/components/ui/`

### 3. **Type Safety**
- Full TypeScript implementation
- Prisma-generated types for database entities
- Custom type definitions for complex data structures

## Development Workflow
The repository is specifically designed for AI workflow demonstrations:

### **Main Branch**: Baseline application
- Complete task management functionality
- Ready for feature enhancement

### **Feature Branch** (`user-13-search-and-filter`): 
- AI-implemented search and filter functionality
- Demonstrates AI's ability to follow project patterns
- Shows real-world feature development workflow

## Key Files Structure
```
app/(dashboard)/          # Protected dashboard routes
components/ui/           # Reusable UI component library  
lib/                    # Utilities, types, fonts
prisma/                 # Database schema and migrations
tests/                  # Unit and e2e test suites
```

## Demo Purpose
This isn't just a task management app—it's a **sandbox for AI development workflows**:

1. **Codebase Analysis**: AI learns project patterns and conventions
2. **Feature Implementation**: AI implements features from Jira tickets
3. **Code Quality**: AI follows established patterns (server actions, Prisma, accessibility)
4. **Testing**: Comprehensive test coverage for AI-generated code validation

The repository serves as a reference for how AI can effectively contribute to real-world software projects while maintaining code quality and consistency.

## Getting Started

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up database: `npm run db:setup`
4. Start development server: `npm run dev`

### Default Credentials
- Email: `alice@example.com`
- Password: `password123`

### Available Scripts
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run db:setup` - Initialize and seed database
- `npm run db:reset` - Clear and re-seed database

## Branch Comparison
To see the AI-implemented feature:
```bash
git fetch --all
git switch main                    # Baseline
git switch user-13-search-and-filter  # AI feature
git diff main...user-13-search-and-filter  # Compare changes
```

---

*This repository demonstrates the practical application of AI in software development, showcasing how AI agents can understand complex codebases and implement features that follow established patterns and best practices.*