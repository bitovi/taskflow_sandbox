# Tech Stack Analysis

## Core Technology Analysis

**Programming Language:**
- TypeScript (strict mode enabled)
- Target: ES2017

**Primary Framework:**
- **Next.js 15.4.6** (App Router architecture)
  - Server Actions for data mutations
  - Server Components by default
  - Turbopack for development
  - File-based routing in `app/` directory

**Secondary/Tertiary Frameworks:**
- **React 19.1.0** (with React DOM)
- **Prisma 6.13.0** (ORM for database operations)
  - SQLite database for local development
  - Generated client output in `app/generated/prisma`
- **Tailwind CSS 4** (utility-first styling)
- **shadcn/ui + Radix UI** (component library)
  - @radix-ui/react-avatar
  - @radix-ui/react-checkbox
  - @radix-ui/react-dialog
  - @radix-ui/react-dropdown-menu
  - @radix-ui/react-label
  - @radix-ui/react-select
  - @radix-ui/react-slot

**State Management Approach:**
- Server-side state via Server Components and Server Actions
- Client-side state using React hooks (useState, useTransition)
- No global state management library (Redux, Zustand, etc.)
- Optimistic UI updates for drag-and-drop operations

**Other Relevant Technologies:**
- **Authentication:** Custom session-based auth with bcryptjs for password hashing
- **Drag and Drop:** @hello-pangea/dnd for Kanban board interactions
- **Date Management:** date-fns for date utilities
- **Icons:** lucide-react
- **Charts:** recharts for data visualization
- **Testing:**
  - Jest with ts-jest for unit tests
  - @testing-library/react for component testing
  - Playwright for E2E tests
- **Code Quality:** ESLint (with Next.js config)
- **Styling Utilities:** class-variance-authority for component variants

## Domain Specificity Analysis

**Problem Domain:**
- **Task Management and Project Collaboration Platform**
- A modern team-oriented task tracking application with visual board management

**Core Business Concepts:**
- **Task lifecycle management** - Creating, updating, tracking tasks with priorities and statuses
- **User management** - Multi-user system with task assignment and ownership
- **Kanban workflow** - Visual board with drag-and-drop status updates (todo, in-progress, in-review, done)
- **Role-based relationships** - Task creators vs. assignees
- **Session-based authentication** - Token-based user sessions

**User Interactions:**
- **Task CRUD operations** - Create, read, update tasks via forms and actions
- **Drag-and-drop task management** - Moving tasks between status columns
- **Dashboard visualization** - Charts and statistics for task overview
- **Authentication flows** - Login/signup with credential management
- **Navigation** - Sidebar navigation between dashboard views (board, tasks, team)
- **Search and filter** (on feature branch) - Finding tasks by text, priority, status

**Primary Data Types and Structures:**
- `User` - id, email, password, name, sessions, created/assigned tasks
- `Task` - id, name, description, priority, status, dueDate, assignee, creator
- `Session` - id, token, userId, createdAt
- **Task Statuses:** "todo" | "in-progress" | "in-review" | "done"
- **Task Priorities:** Various priority levels (e.g., "low", "medium", "high", "urgent")
- Relational data with foreign keys (assigneeId, creatorId, userId)

## Application Boundaries

**Features/Functionality Within Scope:**
- Task creation, editing, and status management
- Kanban board with drag-and-drop
- User authentication and session management
- Team member viewing and task assignments
- Dashboard analytics and charts
- Task list views with filtering/searching capabilities
- Date-based task tracking (due dates)
- Multi-user task collaboration

**Features Outside Scope (Not Present):**
- Real-time collaboration or WebSockets
- File attachments or document management
- Comments/discussion threads on tasks
- Advanced permissions/role-based access control
- Team/workspace management
- Notifications or email integrations
- Time tracking or task logging
- Subtasks or task hierarchies
- Custom fields or metadata
- API endpoints for external integrations
- Mobile native applications

**Architecturally Inconsistent Features:**
- Client-heavy state management solutions (Redux, MobX) - conflicts with server-first approach
- REST API routes in `/api` - app uses Server Actions instead
- Traditional forms with client-side submission - uses progressive enhancement with Server Actions
- External authentication providers (OAuth) - uses custom session-based auth
- NoSQL databases - designed for relational data with Prisma
- GraphQL layer - not present, uses direct Prisma queries via Server Actions

**Specialized Libraries and Domain Constraints:**
- **Prisma ORM** suggests relational data modeling is the standard
- **@hello-pangea/dnd** indicates drag-and-drop is a core interaction pattern
- **Server Actions pattern** means data mutations should be server-side
- **shadcn/ui + Radix** indicates preference for accessible, unstyled component primitives
- **bcryptjs** indicates password-based authentication is the auth model
- No GraphQL client or API layer suggests direct database access pattern
