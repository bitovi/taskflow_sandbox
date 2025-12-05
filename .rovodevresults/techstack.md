# TaskFlow - Technology Stack Analysis

## Core Technology Analysis

### Programming Language(s)
- **TypeScript** (Primary) - Full TypeScript implementation across the entire codebase
- **JavaScript** - Used for configuration files and database utilities

### Primary Framework
- **Next.js 15** with App Router - Modern React framework with server-side rendering and server actions
- **React 19** - Latest React version with concurrent features

### Secondary/Tertiary Frameworks
- **Prisma ORM** - Database ORM for SQLite with type-safe database operations
- **Tailwind CSS 4** - Utility-first CSS framework for styling
- **shadcn/ui** - Component library built on Radix UI primitives
- **Radix UI** - Headless component primitives for accessibility

### State Management Approach
- **React Server Actions** - Primary data mutation pattern using Next.js server actions
- **React Hook State** - Local component state using `useState`, `useOptimistic`, `useTransition`
- **Form State Management** - Using `useActionState` for form handling and validation
- **No Global State Library** - Relies on server state and local component state

### Other Relevant Technologies/Patterns
- **@hello-pangea/dnd** - Drag and drop functionality for Kanban boards
- **Recharts** - Data visualization and charting library
- **bcryptjs** - Password hashing for authentication
- **date-fns** - Date manipulation utilities
- **Jest + Testing Library** - Unit testing framework
- **Playwright** - End-to-end testing
- **ESLint + TypeScript** - Code quality and type checking

## Domain Specificity Analysis

### Problem Domain
**Task Management and Project Collaboration Platform**
- Core focus: Task lifecycle management (creation, assignment, tracking, completion)
- Secondary focus: Team collaboration and project visualization
- Tertiary focus: Analytics and reporting on task performance

### Core Business Concepts
- **Task Management**: CRUD operations for tasks with states (Todo, In Progress, Review, Done)
- **User Management**: Authentication, user roles, and task assignment
- **Project Workflow**: Kanban-style workflow management with drag-and-drop
- **Team Collaboration**: Multi-user task assignment and ownership tracking
- **Analytics**: Task completion metrics, priority distribution, and team performance

### User Interactions Supported
- **Authentication workflows**: Login/signup with session management
- **Task CRUD operations**: Create, read, update, delete tasks with form validation
- **Drag-and-drop interactions**: Kanban board task movement between columns
- **Dashboard analytics**: Interactive charts and metrics visualization
- **Team management**: User role assignment and task delegation
- **Filtering and search**: Task discovery and organization (partially implemented)

### Primary Data Types and Structures
```typescript
// Core entities
User: { id, email, password, name, sessions[], createdTasks[], assignedTasks[] }
Task: { id, name, description, priority, status, dueDate, assigneeId, creatorId }
Session: { id, token, userId, createdAt }

// Enums and constants
TaskStatus: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
TaskPriority: "HIGH" | "MEDIUM" | "LOW"

// UI state types
FormState: { success: boolean, error?: string, message?: string }
OptimisticTask: Task with pending state indicators
```

## Application Boundaries

### Features Clearly Within Scope
- **Task lifecycle management** (CRUD, status changes, priority management)
- **User authentication and session management**
- **Kanban board visualization with drag-and-drop**
- **Dashboard analytics and reporting**
- **Team management and user assignment**
- **Form-based data entry with validation**
- **Real-time UI updates with optimistic rendering**

### Features That Would Be Architecturally Consistent
- **Task search and filtering** (search bar, priority/status filters)
- **Task comments and activity logs**
- **File attachments to tasks**
- **Task templates and bulk operations**
- **Email notifications for task assignments**
- **Time tracking and estimation**
- **Project grouping and organization**
- **Task dependencies and subtasks**

### Features That Would Conflict With Current Design
- **Real-time collaboration** (would require WebSocket infrastructure)
- **Complex project management** (Gantt charts, resource allocation - too enterprise-focused)
- **Third-party integrations** (would require API architecture changes)
- **Multi-tenancy** (current schema is single-tenant focused)
- **Advanced reporting** (would require separate analytics database)
- **Mobile app** (current design is web-optimized only)

### Specialized Libraries and Domain Constraints
- **@hello-pangea/dnd**: Constrains drag-and-drop to specific patterns used in Kanban boards
- **Prisma ORM**: Constrains database operations to type-safe, relation-based queries
- **Server Actions**: Constrains data mutations to server-side form actions
- **shadcn/ui patterns**: Constrains UI components to Radix-based accessibility patterns
- **Recharts**: Constrains data visualization to chart-based representations

### Architectural Philosophy
This application follows a **server-first, type-safe, accessibility-focused** approach:
- Data mutations happen on the server through Next.js server actions
- All database operations are type-safe through Prisma
- UI components prioritize accessibility through Radix primitives
- State management is simplified through server state and optimistic updates
- Authentication is session-based rather than token-based