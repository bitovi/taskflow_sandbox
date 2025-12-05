# Tech Stack Analysis

## Core Technology Analysis

### Programming Language
- **TypeScript** - Primary language used throughout the application
- Strict mode enabled with ES2017 target
- Path aliases configured (`@/*` points to root)

### Primary Framework
- **Next.js 15.4.6** (App Router architecture)
  - Uses the modern App Router pattern (not Pages Router)
  - Server Actions enabled for form submissions and mutations
  - Turbopack for development builds
  - React Server Components by default

### Secondary/Tertiary Frameworks & Libraries

**UI & Styling:**
- **React 19.1.0** - Latest React version
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - Component system built on Radix UI primitives
- **Radix UI** - Headless, accessible component primitives:
  - Avatar, Checkbox, Dialog, Dropdown Menu, Label, Select, Slot
- **Lucide React** - Icon library (v0.537.0)
- **class-variance-authority** - For component variants

**Data & State Management:**
- **Prisma ORM (v6.13.0)** - Database toolkit
  - SQLite database for local development
  - Custom output directory: `app/generated/prisma`
  - Binary engine type
- **React hooks** - Client-side state (useState, useEffect, useOptimistic, useTransition)
- **Server Actions** - Server-side mutations and data fetching
- No centralized state management library (Redux, Zustand, etc.)

**Data Visualization:**
- **Recharts (v3.1.2)** - Charting library for dashboards

**Drag & Drop:**
- **@hello-pangea/dnd (v18.0.1)** - Drag and drop library (fork of react-beautiful-dnd)

**Utilities:**
- **bcryptjs** - Password hashing
- **date-fns (v4.1.0)** - Date manipulation and formatting

**Testing:**
- **Jest (v29)** - Unit testing framework
  - With ts-jest for TypeScript support
  - jsdom environment for React component testing
- **React Testing Library (v16.3.0)** - Component testing utilities
- **Playwright (v1)** - End-to-end testing

### State Management Approach
- **Server Actions** for data mutations (create, update, delete operations)
- **React hooks** for client-side UI state
- **useOptimistic** for optimistic UI updates (task status changes, deletions)
- **useTransition** for managing loading states during async operations
- **No global state management** - state is colocated with components
- Server-side session management via database (Session model)

### Other Relevant Technologies & Patterns

**Architecture Patterns:**
- Server Components by default with selective client components
- Server Actions for backend operations (`"use server"` directive)
- Optimistic updates pattern for better UX
- Route groups in App Router: `(dashboard)` group
- Colocation of actions with route segments

**Authentication:**
- Custom session-based authentication (no third-party auth library)
- bcryptjs for password hashing
- Session tokens stored in database
- Server-side session validation via cookies

**Database Schema:**
- User model with email/password authentication
- Session model for authentication tokens
- Task model with creator/assignee relationships
- Status values: "todo", "in_progress", "review", "done"
- Priority values: handled as strings

**Form Handling:**
- FormData API with Server Actions
- No form libraries (React Hook Form, Formik, etc.)
- Server-side validation

## Domain Specificity Analysis

### Problem Domain
**Task Management Application** - A modern project and task tracking system designed for team collaboration, similar to tools like Jira, Asana, or Trello.

### Core Business Concepts
1. **Tasks** - Work items that can be:
   - Created by users
   - Assigned to team members
   - Categorized by priority (high, medium, low)
   - Tracked through workflow statuses (todo, in_progress, review, done)
   - Given due dates
   - Described with titles and descriptions

2. **Users & Teams** - People who:
   - Create tasks for others
   - Are assigned tasks to complete
   - Track their workload and team progress

3. **Workflows** - Task progression through statuses:
   - Visual Kanban board representation
   - Drag-and-drop status changes
   - List view with checkbox completion
   - Status-based filtering and organization

4. **Project Tracking** - Management features:
   - Dashboard with analytics (charts, statistics)
   - Task completion metrics
   - Team workload distribution
   - Timeline tracking (due dates, creation dates)

### User Interactions
1. **Task Management Workflows:**
   - Create new tasks with forms (title, description, priority, status, due date, assignee)
   - Edit existing tasks
   - Delete tasks
   - Toggle task completion status (checkbox in list view)
   - Drag and drop tasks between status columns (Kanban board)

2. **Visualization & Monitoring:**
   - View tasks in list format with filtering
   - View tasks in Kanban board with drag-drop
   - Monitor dashboard with charts (bar, pie charts for status, priority, assignee distribution)
   - Track task overview and team statistics
   - View recent tasks

3. **Authentication Workflows:**
   - Sign up (create account)
   - Log in (email/password)
   - Log out (dropdown menu)
   - Session persistence

4. **Navigation:**
   - Sidebar navigation between views (Dashboard, Tasks, Board, Team)
   - Page-based routing structure

### Primary Data Types & Structures

**Core Entities:**
```typescript
// Task entity
{
  id: number
  name: string
  description: string
  priority: string  // "high" | "medium" | "low"
  status: string    // "todo" | "in_progress" | "review" | "done"
  dueDate: DateTime | null
  assigneeId: number | null
  assignee: User | null
  creatorId: number
  creator: User
  createdAt: DateTime
  updatedAt: DateTime
}

// User entity
{
  id: number
  email: string (unique)
  password: string (hashed)
  name: string
  sessions: Session[]
  createdTasks: Task[]
  assignedTasks: Task[]
}

// Session entity
{
  id: number
  token: string (unique)
  userId: number
  user: User
  createdAt: DateTime
}
```

**UI-Specific Types:**
```typescript
// Kanban column structure
{
  id: "todo" | "in_progress" | "review" | "done"
  title: string
  tasks: TaskWithProfile[]
}

// Task with minimal user info for UI
TaskWithProfile = Task & {
  assignee?: Pick<User, "name"> | null
}
```

**Chart/Dashboard Data:**
- Status distribution (count by status)
- Priority distribution (count by priority)
- Assignee distribution (count per team member)
- Creator distribution (count per creator)
- Time-series task creation data (monthly aggregation)

## Application Boundaries

### Features/Functionality Clearly Within Scope

**Core Task Management:**
- ✅ CRUD operations for tasks (create, read, update, delete)
- ✅ Task status workflow (todo → in_progress → review → done)
- ✅ Task assignment to team members
- ✅ Task prioritization (high, medium, low)
- ✅ Due date tracking
- ✅ Task descriptions and titles

**Visualization & Views:**
- ✅ List view of tasks with checkboxes
- ✅ Kanban board with drag-and-drop
- ✅ Dashboard with analytics and charts
- ✅ Task overview cards
- ✅ Team statistics

**User Management:**
- ✅ User signup and login
- ✅ Session-based authentication
- ✅ User profiles (name, email)
- ✅ Task creator and assignee tracking

**UI/UX Patterns:**
- ✅ Optimistic updates for better perceived performance
- ✅ Loading states during transitions
- ✅ Modal dialogs for forms
- ✅ Dropdown menus for actions
- ✅ Badge components for status/metadata
- ✅ Avatar components for users
- ✅ Responsive card-based layouts

### Types of Features Architecturally Inconsistent

**Would NOT fit the current design:**

❌ **Real-time collaboration features:**
- WebSocket connections
- Live cursors or presence indicators
- Real-time notifications
- The app uses Server Actions and standard HTTP, not WebSockets or server-sent events

❌ **Third-party integrations:**
- OAuth providers (Google, GitHub login)
- External API integrations (Slack, Jira sync)
- Webhooks for external services
- The authentication is entirely custom and self-contained

❌ **Complex state management patterns:**
- Redux, Zustand, or other global state libraries
- Complex client-side caching strategies
- The app uses simple React hooks and Server Actions

❌ **Advanced file handling:**
- File uploads for task attachments
- Image processing or storage
- No file upload infrastructure exists

❌ **Rich text editing:**
- WYSIWYG editors for task descriptions
- Markdown rendering
- Descriptions are plain text strings

❌ **Multi-tenancy or organization structure:**
- Organizations/workspaces
- Teams within organizations
- Role-based access control beyond creator/assignee
- The app has a flat user structure

❌ **Advanced search/filtering:**
- Full-text search engines
- Complex query builders
- Saved filters or views
- Current filtering is client-side and basic

❌ **Offline-first capabilities:**
- Service workers
- IndexedDB for local storage
- Sync mechanisms
- The app is fully server-dependent

❌ **Recurring tasks or templates:**
- Task templates
- Recurring task patterns
- Task dependencies
- The data model doesn't support these concepts

❌ **Time tracking:**
- Time logging on tasks
- Estimates vs actuals
- Timesheet views
- No time-related fields beyond due dates

### Specialized Libraries & Domain Constraints

**Libraries Suggesting Constraints:**

1. **@hello-pangea/dnd** - Implies drag-and-drop should remain focused on:
   - Kanban board task movement
   - Single-axis dragging (between columns)
   - Not suitable for complex multi-dimensional drag scenarios

2. **Recharts** - Visualization should use:
   - Bar charts, pie charts, line charts
   - Not complex D3.js visualizations
   - Dashboard-style analytics only

3. **Prisma with SQLite** - Database operations are:
   - Single-server, not distributed
   - Local development focused
   - Simple relational queries
   - No complex database features (full-text search, GIS, etc.)

4. **shadcn/ui + Radix UI** - UI components should:
   - Follow the existing design system
   - Use headless Radix primitives
   - Maintain accessibility standards
   - Not introduce other UI libraries (Material-UI, Ant Design, etc.)

5. **Server Actions** - Data mutations should:
   - Use Next.js Server Actions pattern
   - Not introduce REST API routes unless necessary
   - Keep business logic server-side
   - Use FormData for form submissions

**Domain Constraints:**
- Task workflow is specifically: todo → in_progress → review → done
- Priority is three-tier: high, medium, low
- Authentication is session-based, not JWT
- Dates use date-fns for formatting, not Moment.js or Day.js
- Icons come from Lucide, not Font Awesome or other icon libraries
- Styling is Tailwind-based, not CSS-in-JS or separate CSS modules

### Summary

**This is a focused task management application that:**
- Prioritizes simplicity and clarity over feature breadth
- Uses modern React patterns (Server Components, Server Actions)
- Maintains a clean separation between server and client code
- Focuses on essential task management workflows
- Is designed for team-based task tracking with visual organization tools
- Has room for growth in filtering, search, notifications, and reporting
- Should maintain its simple, performant, Next.js-native architecture
