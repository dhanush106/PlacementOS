# TrackForge - Implementation Guide & Development Prompts

**Version:** 1.0  
**Stack:** MERN (MongoDB, Express, React, Node.js)  
**Styling:** Tailwind CSS + Shadcn UI  
**Status:** Ready to Implement  
**Last Updated:** 2026-07-12  

---

## Table of Contents

1. [Tech Stack Overview](#tech-stack-overview)
2. [Project Setup & Environment](#project-setup--environment)
3. [Phase-by-Phase Implementation Prompts](#phase-by-phase-implementation-prompts)
4. [Design Inspirations & Files](#design-inspirations--files)
5. [Git Commit Message Guide](#git-commit-message-guide)
6. [Daily Task Breakdown](#daily-task-breakdown)
7. [Testing & Quality Checklist](#testing--quality-checklist)

---

## Tech Stack Overview

### Frontend
```
- React 18.3.1 (Latest)
- Vite (build tool)
- Tailwind CSS 3.4.1
- Shadcn UI (component library)
- Framer Motion 10.16.16 (animations)
- React Router v6
- React Query (@tanstack/react-query)
- Recharts 2.10.3 (charts)
- dnd-kit 8.0.0 (drag & drop)
- Lucide React 0.378.0 (icons)
- Axios 1.6.5 (HTTP client)
```

### Backend
```
- Node.js 20 LTS
- Express.js 4.18.2
- MongoDB 8.0 + Mongoose
- JWT (jsonwebtoken 9.1.2)
- Bcryptjs 2.4.3 (password hashing)
- Dotenv 16.3.1
- Cors 2.8.5
- Helmet 7.1.0 (security)
- Express-validator 7.0.0
- Joi 17.11.0 (validation)
- Nodemailer 6.9.7 (email service)
- Jest (testing)
```

### Development Tools
```
- Git & GitHub
- GitHub Actions (CI/CD)
- Postman (API testing)
- MongoDB Compass (DB management)
- VS Code with extensions
```

---

## Project Setup & Environment

### Frontend Setup

**Task 1.1: Create React + Vite Project**

```bash
# Terminal command
npm create vite@latest trackforge-frontend -- --template react-ts

# Navigate to project
cd trackforge-frontend

# Install dependencies
npm install

# Install UI libraries
npm install tailwindcss postcss autoprefixer
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install additional dependencies
npm install react-router-dom axios @tanstack/react-query framer-motion
npm install dnd-kit recharts lucide-react
npm install -D @types/node
```

**Commit Message:**
```
feat: initialize react vite project with typescript and tailwind

- Set up Vite with React 18 and TypeScript
- Configure Tailwind CSS and PostCSS
- Install core dependencies (routing, HTTP, state management)
- Install animation and UI libraries (Framer Motion, dnd-kit, Recharts)
- Configure Tailwind config.js for dark mode first approach
```

---

### Backend Setup

**Task 1.2: Create Node + Express Server**

```bash
# Create backend folder
mkdir trackforge-backend
cd trackforge-backend

# Initialize node project
npm init -y

# Install dependencies
npm install express mongoose jsonwebtoken bcryptjs dotenv cors helmet joi express-validator
npm install --save-dev typescript @types/express @types/node jest ts-jest @types/jest

# Create TypeScript config
npx tsc --init

# Create folder structure
mkdir src
mkdir src/{config,controllers,models,routes,middleware,services,utils,validators}
mkdir tests
touch .env .env.example
```

**Commit Message:**
```
feat: initialize express server with typescript configuration

- Set up Node.js + Express.js project with TypeScript
- Configure environment variables (.env)
- Install MongoDB + Mongoose for database
- Install authentication libraries (JWT, bcryptjs)
- Install validation and security libraries
- Create folder structure for MVC architecture
```

---

## Phase-by-Phase Implementation Prompts

---

# PHASE 1: FOUNDATION (Weeks 1-2)

## Task 1.1: Database Schema & Models

**Prompt:**
```
Create MongoDB Mongoose models for TrackForge backend using TypeScript.
Requirements:
- Users model: email, password (hashed), name, college, batchYear, targetRole, etc.
- Sessions model: for tracking user logins and audit
- AuditLogs model: immutable logging of all events
- Add timestamps (createdAt, updatedAt) to all models
- Configure proper indexes for performance
- Use TypeScript interfaces for type safety
- Add validation at model level where applicable
- Implement soft delete support (deletedAt field)

Path: src/models/
Files needed:
- User.ts (with pre-hooks for password hashing)
- Session.ts
- AuditLog.ts

Technology: Mongoose, TypeScript, MongoDB
```

**Implementation Details:**
```typescript
// Example User Model
interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  emailVerified: boolean;
  // ... other fields
  comparePassword(candidatePassword: string): Promise<boolean>;
  toJSON(): Omit<IUser, 'password'>;
}

// Pre-save hook to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
```

**Commit Message:**
```
feat(database): create mongodb mongoose models with typescript

- Create User model with email verification, profile data
- Add Session model for session tracking and audit
- Create AuditLog model for immutable event logging
- Implement password hashing middleware
- Add proper indexes for userId, email, timestamp queries
- Configure soft delete support with deletedAt field
- Add TypeScript interfaces for all models
- Set up validation rules at model level
```

---

## Task 1.2: Database Configuration

**Prompt:**
```
Create database connection configuration and seed initial data.

Requirements:
- Connect to MongoDB Atlas or local MongoDB
- Handle connection errors gracefully
- Seed initial data (predefined habits, motivation quotes, system subjects)
- Create database migration system
- Set up connection pooling
- Add database health check endpoint

Path: src/config/
Files needed:
- database.ts (connection setup)
- seed.ts (initial data)
```

**Commit Message:**
```
feat(config): setup mongodb connection and database initialization

- Create MongoDB connection with error handling
- Implement connection pooling and retry logic
- Create seed data for habits, quotes, subjects
- Add database health check function
- Configure proper timeout and keepAlive settings
- Add migration support for future schema changes
```

---

## Task 1.3: Express Server Setup

**Prompt:**
```
Create Express server with middleware, CORS, helmet security.

Requirements:
- Basic Express app with TypeScript
- CORS configuration for frontend
- Helmet for security headers
- Request logging middleware
- Error handling middleware
- Environment variable validation
- Health check endpoint

Path: src/
Files needed:
- app.ts (Express app)
- server.ts (startup)
- middleware/errorHandler.ts
- utils/logger.ts
```

**Commit Message:**
```
feat(server): initialize express app with security and logging middleware

- Set up Express server with TypeScript
- Configure CORS for frontend development
- Add Helmet for security headers (XSS, CSRF protection)
- Implement request logging middleware (Winston)
- Create error handling middleware
- Add health check endpoint for monitoring
- Configure environment variables validation
```

---

## Task 1.4: Authentication Middleware

**Prompt:**
```
Create JWT authentication and authorization middleware.

Requirements:
- Create middleware to verify JWT tokens
- Implement role-based access control (RBAC)
- Create protected route wrapper
- Add rate limiting middleware
- Create admin authentication middleware
- Handle token expiry and refresh

Path: src/middleware/
Files needed:
- auth.ts (JWT verification)
- rbac.ts (role-based access)
- rateLimit.ts
- adminAuth.ts
```

**Commit Message:**
```
feat(middleware): implement jwt authentication and rbac

- Create authenticate middleware for JWT token verification
- Implement role-based access control (RBAC)
- Create protected route wrapper for authorization
- Add rate limiting middleware (1000 req/hour)
- Implement admin authentication middleware
- Create error responses for auth failures
- Add support for refresh token validation
```

---

## Task 1.5: API Error Handling

**Prompt:**
```
Create standardized error handling and response format.

Requirements:
- Define error types (validation, auth, server, etc.)
- Create custom error classes
- Standardize API response format
- Create error logging system
- Add status codes for each error type

Path: src/utils/
Files needed:
- errors.ts (custom error classes)
- response.ts (response formatter)
- logger.ts (logging)
```

**Commit Message:**
```
feat(utils): implement standardized error handling and response format

- Create custom error classes (ValidationError, AuthError, etc.)
- Define standardized response format for all endpoints
- Implement error logging with Winston
- Add error middleware for catching and formatting errors
- Create error code reference system
- Add request ID tracking for debugging
```

---

# PHASE 2: AUTHENTICATION (Weeks 2-3)

## Task 2.1: User Registration Endpoint

**Prompt:**
```
Implement user registration API endpoint with validation and email verification.

Requirements:
- Create POST /api/auth/register endpoint
- Validate email format and password strength (min 8 chars, 1 uppercase, 1 number, 1 special)
- Check for duplicate email
- Hash password using bcryptjs
- Generate OTP for email verification
- Send verification email via Nodemailer
- Return JWT tokens and user info
- Add rate limiting (5 attempts per minute)

Path: src/routes/auth.ts and src/controllers/authController.ts
```

**Implementation Notes:**
```
Password validation rules:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)

Email OTP:
- 6-digit code
- Expires in 24 hours
- Can be resent after 1 minute

Response includes:
- userId, email, name
- accessToken (expires 15 min)
- refreshToken (expires 7 days)
```

**Commit Message:**
```
feat(auth): implement user registration with email verification

- Create POST /api/auth/register endpoint with validation
- Implement email duplicate check
- Add password strength validation rules
- Implement OTP generation and expiry
- Set up Nodemailer for email sending
- Generate and return JWT tokens
- Add rate limiting to prevent abuse
- Create email template for verification
- Add error handling for duplicate emails
```

---

## Task 2.2: Email Verification Endpoint

**Prompt:**
```
Implement email verification endpoint to complete user registration.

Requirements:
- Create POST /api/auth/verify-email endpoint
- Validate OTP against stored value
- Check OTP expiry (24 hours)
- Mark user as verified
- Optionally auto-login after verification
- Handle invalid/expired OTP

Path: src/routes/auth.ts and src/controllers/authController.ts
```

**Commit Message:**
```
feat(auth): implement email verification endpoint

- Create POST /api/auth/verify-email endpoint
- Validate OTP and check expiry
- Mark user email as verified
- Remove OTP from database after use
- Optionally return new tokens for auto-login
- Add error handling for invalid/expired OTP
```

---

## Task 2.3: User Login Endpoint

**Prompt:**
```
Implement user login with credentials and remember-me option.

Requirements:
- Create POST /api/auth/login endpoint
- Validate email and password
- Implement account lockout after 5 failed attempts (15 min)
- Generate access and refresh tokens
- Store session info for audit trail
- Support remember-me option (extends refresh token to 30 days)
- Return user profile and tokens

Path: src/routes/auth.ts and src/controllers/authController.ts
```

**Commit Message:**
```
feat(auth): implement login endpoint with account security

- Create POST /api/auth/login endpoint
- Validate credentials against hashed password
- Implement account lockout (5 attempts → 15 min lockout)
- Store login session for audit trail
- Generate JWT tokens (access: 15min, refresh: 7days)
- Support remember-me option (extends refresh to 30 days)
- Add failed login attempt tracking
- Return user profile data in response
```

---

## Task 2.4: Token Refresh Endpoint

**Prompt:**
```
Implement JWT token refresh mechanism.

Requirements:
- Create POST /api/auth/refresh endpoint
- Validate refresh token
- Check if token is blacklisted
- Generate new access token
- Optional: rotate refresh token

Path: src/routes/auth.ts and src/controllers/authController.ts
```

**Commit Message:**
```
feat(auth): implement token refresh mechanism

- Create POST /api/auth/refresh endpoint
- Validate refresh token signature and expiry
- Check token against blacklist
- Generate new access token (15 min expiry)
- Return new access token in response
- Add error handling for invalid tokens
```

---

## Task 2.5: Logout and Token Blacklist

**Prompt:**
```
Implement logout functionality and token blacklisting.

Requirements:
- Create POST /api/auth/logout endpoint
- Add tokens to blacklist collection
- Clear refresh token cookie
- Support logout all sessions option

Path: src/routes/auth.ts and src/controllers/authController.ts
```

**Commit Message:**
```
feat(auth): implement logout and token blacklisting

- Create POST /api/auth/logout endpoint
- Add tokens to blacklist collection
- Set expiry on blacklist entries matching token expiry
- Clear HTTP-only cookies
- Support logout-all-sessions option for security
- Add session cleanup after logout
```

---

## Task 2.6: Password Reset Flow

**Prompt:**
```
Implement complete password reset flow with email and OTP.

Requirements:
- Create POST /api/auth/password-reset endpoint (request)
- Create POST /api/auth/password-reset/verify endpoint (verify OTP)
- Create POST /api/auth/password-reset/complete endpoint (set new password)
- Generate reset token and OTP
- Add rate limiting (3 resets per 24 hours)
- Validate new password meets requirements
- Ensure new password differs from old

Path: src/routes/auth.ts and src/controllers/authController.ts
```

**Commit Message:**
```
feat(auth): implement complete password reset flow

- Create POST /api/auth/password-reset endpoint
- Generate secure reset token and OTP
- Send reset link via email with 1-hour expiry
- Create POST /api/auth/password-reset/verify for OTP validation
- Create POST /api/auth/password-reset/complete for new password
- Validate new password meets strength requirements
- Prevent reuse of old password
- Add rate limiting (3 resets per 24 hours)
- Invalidate all existing sessions after reset
```

---

## Task 2.7: Frontend Auth Pages

**Prompt:**
```
Create registration, login, and password reset pages in React.

Requirements:
- Create /register page with form validation
- Create /login page with remember-me option
- Create /verify-email page with OTP input
- Create /forgot-password page
- Create /reset-password page
- Add form validation (client-side)
- Add loading and error states
- Create success toasts
- Handle redirects based on auth state

Path: frontend/src/pages/Auth/
Files needed:
- Register.tsx
- Login.tsx
- VerifyEmail.tsx
- ForgotPassword.tsx
- ResetPassword.tsx

Also create:
- frontend/src/components/auth/AuthLayout.tsx
- frontend/src/components/auth/PasswordStrengthIndicator.tsx
- frontend/src/hooks/useAuth.ts
```

**Design Inspiration:**
```
Look for inspiration in design/ folder:
- Linear.app (minimal, clean)
- Vercel Dashboard (modern, smooth)
- GitHub (professional)
- Apple HIG (accessible, beautiful)

Color scheme (Dark Mode First):
- Background: #0f172a (slate-950)
- Card: #1e293b (slate-900)
- Border: #334155 (slate-700)
- Primary: #6366f1 (indigo-500)
- Text: #f1f5f9 (slate-100)
- Success: #10b981 (emerald-500)
- Error: #ef4444 (red-500)
```

**Commit Message:**
```
feat(frontend-auth): create registration and login pages with validation

- Create Register page with form validation and strength indicator
- Implement email verification page with OTP input
- Create Login page with remember-me checkbox
- Implement password reset flow (request, verify, complete)
- Add Zod schema validation for all forms
- Create auth layout component with branding
- Implement loading and error states
- Add success notifications with toast
- Create useAuth hook for auth context
- Add protected route wrapper for post-login pages
```

---

# PHASE 3: DASHBOARD (Weeks 3-4)

## Task 3.1: User Profile Endpoint

**Prompt:**
```
Create endpoints for user profile management.

Requirements:
- Create GET /api/users/profile endpoint
- Create PATCH /api/users/profile endpoint
- Create POST /api/users/avatar endpoint (file upload)
- Create POST /api/users/change-email endpoint
- Create DELETE /api/users/account endpoint (soft delete)

Path: src/routes/users.ts and src/controllers/userController.ts
```

**Commit Message:**
```
feat(backend): implement user profile management endpoints

- Create GET /api/users/profile to fetch user details
- Implement PATCH /api/users/profile for profile updates
- Create POST /api/users/avatar for avatar upload (max 5MB)
- Add POST /api/users/change-email with verification
- Implement DELETE /api/users/account for soft delete (30-day grace)
- Add validation for profile updates
- Store avatars in file system or cloud storage
- Return updated user profile in responses
```

---

## Task 3.2: Dashboard Metrics Calculation

**Prompt:**
```
Create service to calculate real-time dashboard metrics.

Requirements:
- Calculate daily progress percentage
- Calculate study hours from pomodoro sessions
- Count leetcode problems completed today
- Calculate habit completion percentage
- Generate daily motivation quote (different each day)
- Fetch priority task
- Generate weekly heatmap data

Path: src/services/dashboardService.ts
```

**Commit Message:**
```
feat(backend): implement dashboard metrics calculation service

- Create calculateDailyProgress() function
- Implement getStudyHoursToday() from pomodoro sessions
- Add getLeetcodeProgressToday() function
- Calculate getHabitCompletionPercentage()
- Implement getDailyMotivationQuote() (rotates daily)
- Add getPriorityTask() by priority and deadline
- Generate getWeeklyHeatmap() data
- Cache metrics for 30 seconds to optimize queries
- Add error handling for missing data
```

---

## Task 3.3: Dashboard API Endpoint

**Prompt:**
```
Create GET /api/dashboard/overview endpoint.

Requirements:
- Fetch all dashboard metrics
- Return today's date and greeting
- Include recent activity (last 5 items)
- Return weekly heatmap
- Include metrics for quick actions

Path: src/routes/dashboard.ts and src/controllers/dashboardController.ts
```

**Commit Message:**
```
feat(backend): create dashboard overview endpoint

- Implement GET /api/dashboard/overview endpoint
- Aggregate all metrics using dashboardService
- Include today's date and time-based greeting
- Return recent activity items (last 5 completed)
- Add weekly heatmap data
- Include action buttons state
- Cache response for performance
```

---

## Task 3.4: Frontend Dashboard Page

**Prompt:**
```
Create dashboard page in React with all widgets.

Requirements:
- Create Dashboard layout component
- Create metric cards (progress, study hours, problems, habits, pomodoro)
- Create today's priority task widget
- Create weekly heatmap visualization
- Create recent activity feed
- Create quick action buttons
- Implement real-time metric updates (30-second polling)
- Add loading skeleton

Path: frontend/src/pages/Dashboard.tsx
Components needed:
- DashboardLayout.tsx
- MetricsCard.tsx
- PriorityTaskCard.tsx
- WeeklyHeatmap.tsx
- RecentActivityFeed.tsx
- QuickActionsBar.tsx
- LoadingSkeleton.tsx
```

**Design Inspiration:**
```
Reference:
- Linear.app dashboard (clean metric cards)
- GitHub dashboard (activity feed)
- Notion dashboard (cards with hover effects)
- Raycast search aesthetic (minimal, focused)

Key design elements:
- Rounded cards with subtle shadow
- Gradient background for metrics (indigo-600 to purple-600)
- Smooth animations on load (Framer Motion)
- Responsive grid (4 cols desktop, 2 cols tablet, 1 col mobile)
- Dark mode with proper contrast
```

**Commit Message:**
```
feat(frontend): create dashboard page with metric widgets

- Implement Dashboard page layout with grid system
- Create MetricCard components for key metrics
- Build PriorityTaskCard with clickable actions
- Implement WeeklyHeatmap visualization component
- Add RecentActivityFeed component
- Create QuickActionsBar with buttons
- Implement real-time updates (30-second polling)
- Add loading skeleton screens
- Create responsive design (mobile, tablet, desktop)
- Add Framer Motion animations
```

---

# PHASE 4: DAILY PLANNER (Weeks 4-6)

## Task 4.1: Task Management Endpoints

**Prompt:**
```
Create all task CRUD endpoints with advanced filtering.

Requirements:
- Create POST /api/planner/tasks (create task)
- Create GET /api/planner/tasks (list with filters)
- Create PATCH /api/planner/tasks/:id (update)
- Create POST /api/planner/tasks/:id/complete (mark complete)
- Create DELETE /api/planner/tasks/:id (delete)
- Create POST /api/planner/tasks/:id/subtasks (add subtask)
- Support filtering by date, timeSlot, priority, status
- Support sorting and pagination

Path: src/routes/planner.ts and src/controllers/plannerController.ts
Database: tasks collection
```

**Commit Message:**
```
feat(backend): implement task management endpoints with filtering

- Create POST /api/planner/tasks for task creation
- Implement GET /api/planner/tasks with date/timeSlot/priority filters
- Add PATCH /api/planner/tasks/:id for updates
- Create POST /api/planner/tasks/:id/complete action
- Implement DELETE /api/planner/tasks/:id with soft delete
- Add POST /api/planner/tasks/:id/subtasks for nested tasks
- Support pagination and sorting
- Calculate task completionPercentage based on subtasks
- Validate priority levels and time slots
```

---

## Task 4.2: Recurring Tasks System

**Prompt:**
```
Implement recurring task functionality.

Requirements:
- Support patterns: daily, weekdays, weekends, weekly, bi-weekly, monthly
- Auto-generate instances on their scheduled day
- Support end date and max occurrences
- Allow editing single or all future instances
- Handle completion without breaking recurrence

Path: src/services/recurringTaskService.ts
```

**Commit Message:**
```
feat(backend): implement recurring task system

- Create recurring task patterns (daily, weekly, monthly, etc)
- Implement task instance generation algorithm
- Support end date and max occurrences configuration
- Allow edit single vs edit all future instances
- Handle task completion without affecting recurrence
- Add cron job for daily instance generation
- Create migration for existing recurring tasks
```

---

## Task 4.3: Task Drag-and-Drop Backend

**Prompt:**
```
Create endpoint for task reordering and moving between time slots.

Requirements:
- Create POST /api/planner/tasks/reorder endpoint
- Handle moving within same time slot
- Handle moving between time slots
- Handle moving between kanban columns
- Update task order in database

Path: src/routes/planner.ts
```

**Commit Message:**
```
feat(backend): implement task reordering and movement

- Create POST /api/planner/tasks/reorder endpoint
- Support reordering within time slot
- Handle moving between time slots
- Support kanban column movement
- Update order field in database
- Maintain consistent ordering
```

---

## Task 4.4: Frontend Daily Planner

**Prompt:**
```
Create Daily Planner page with drag-and-drop tasks.

Requirements:
- Create DailyPlanner page with time slots (Morning/Afternoon/Evening/Night)
- Create TaskCard component with drag-and-drop
- Create TaskForm modal (create/edit)
- Create time tracking visualization (estimated vs actual)
- Implement priority color coding
- Create quick task completion checkbox
- Show task deadlines with warnings
- Create subtask list within task

Path: frontend/src/pages/DailyPlanner.tsx
Components needed:
- DailyPlannerLayout.tsx
- TimeSlotContainer.tsx
- TaskCard.tsx
- TaskForm.tsx
- SubtaskList.tsx
- RecurringTaskDialog.tsx

Libraries: dnd-kit, react-hook-form
```

**Design Inspiration:**
```
Reference:
- Linear.app task management (clean, minimal)
- Jira kanban view (familiar workflow)
- Notion database views (flexible, powerful)
- Things app (beautiful, simple)

Design elements:
- Time slot sections with subtle background color
- Color-coded priority badges (red/yellow/gray)
- Drag preview with opacity change
- Drop zone highlights
- Smooth animations
- Task estimated time display
- Deadline badges with warning colors
```

**Commit Message:**
```
feat(frontend): implement daily planner with drag-drop tasks

- Create DailyPlanner page with time slot sections
- Implement drag-and-drop using dnd-kit library
- Create TaskCard component with all metadata
- Build TaskForm modal with date/priority selectors
- Add SubtaskList component with checkboxes
- Implement recurring task dialog
- Add time tracking visualization (est vs actual)
- Create priority color system (red/yellow/gray)
- Add deadline warning indicators
- Implement quick complete action
```

---

## Task 4.5: Task Time Tracking

**Prompt:**
```
Implement time tracking for tasks (estimated vs actual).

Requirements:
- Store estimated time on task creation
- Store actual time when task is completed
- Calculate variance percentage
- Track historical accuracy
- Show variance warnings if >30% over

Path: src/services/timeTrackingService.ts
```

**Commit Message:**
```
feat(backend): implement task time tracking

- Add timeTracking to task model
- Store estimated time on creation
- Track actual time on completion
- Calculate variance percentage formula
- Create historical accuracy tracking
- Add warning if >30% over estimate
```

---

# PHASE 5: HABIT TRACKER (Weeks 6-7)

## Task 5.1: Habit Management Endpoints

**Prompt:**
```
Create habit CRUD endpoints and daily completion logging.

Requirements:
- Create POST /api/habits (create habit)
- Create GET /api/habits (list habits)
- Create PATCH /api/habits/:id (update)
- Create DELETE /api/habits/:id (delete)
- Create POST /api/habits/:id/complete (log completion)
- Calculate streaks, consistency %
- Return heatmap data

Path: src/routes/habits.ts and src/controllers/habitController.ts
Database: habits collection
```

**Commit Message:**
```
feat(backend): implement habit tracking endpoints

- Create POST /api/habits for habit creation
- Implement GET /api/habits with period filtering
- Add PATCH /api/habits/:id for habit updates
- Create DELETE /api/habits/:id for habit deletion
- Implement POST /api/habits/:id/complete for daily logging
- Calculate currentStreak and longestStreak
- Compute consistency percentage (30-day)
- Generate heatmap data structure
```

---

## Task 5.2: Streak Calculation Engine

**Prompt:**
```
Create service to calculate and track habit streaks.

Requirements:
- Calculate current streak (consecutive days)
- Calculate longest streak (all-time)
- Handle grace period (freeze feature)
- Track streak history
- Generate notifications for milestones (7, 14, 30, 100)

Path: src/services/streakService.ts
```

**Commit Message:**
```
feat(backend): implement streak calculation engine

- Create calculateCurrentStreak() function
- Implement getLongestStreak() tracking
- Add freeze feature (once per month)
- Track streak history with dates
- Generate milestone notifications (7, 14, 30, 100 days)
- Handle timezone-aware streak calculation
- Add streak badges and achievements
```

---

## Task 5.3: Habit Heatmap Generation

**Prompt:**
```
Create heatmap data generation for GitHub-style visualization.

Requirements:
- Generate 52-week heatmap data
- Calculate color intensity based on completion
- Support multiple periods (week, month, year)
- Include hover data (date, count, streak)

Path: src/services/heatmapService.ts
```

**Commit Message:**
```
feat(backend): implement heatmap data generation

- Create generateHeatmap() for 52-week view
- Calculate color intensity (0-4 levels)
- Support period filtering (week, month, year)
- Generate detailed cell data (date, count, metadata)
- Optimize query for performance
```

---

## Task 5.4: Frontend Habit Tracker

**Prompt:**
```
Create Habit Tracker page with heatmap visualization.

Requirements:
- Create HabitTracker page showing all habits
- Create HabitCard component with status
- Create HabitForm modal
- Create GitHub-style heatmap component
- Show streak badges
- Show consistency percentage
- Create habit analytics view

Path: frontend/src/pages/HabitTracker.tsx
Components needed:
- HabitTracker.tsx (main page)
- HabitCard.tsx
- HabitForm.tsx
- HabitHeatmap.tsx
- HeatmapCell.tsx
- StreakBadge.tsx
- HabitAnalytics.tsx
```

**Design Inspiration:**
```
Reference:
- GitHub contributions heatmap (classic)
- Habitica (gamified)
- Streaks app (beautiful, minimal)
- Done app (simple, elegant)

Design elements:
- Square cells for each day (GitHub style)
- Color intensity: #262626 → #0e4429 → #006d32 → #26a641 → #39d353
- Hover tooltip with date and completion status
- Habit cards with progress ring
- Streak counter with flame emoji 🔥
- Consistency % display
- Quick complete button on card
```

**Commit Message:**
```
feat(frontend): create habit tracker with github-style heatmap

- Implement HabitTracker page layout
- Create HabitCard component with quick actions
- Build HabitHeatmap component (52-week view)
- Implement color intensity mapping for cells
- Create HeatmapCell with hover tooltip
- Add StreakBadge with emoji
- Build HabitForm modal for create/edit
- Implement habit analytics view
- Add consistency percentage visualization
- Create responsive heatmap (mobile friendly)
```

---

# PHASE 6: LEETCODE TRACKER (Weeks 7-9)

## Task 6.1: Problem Logging Endpoints

**Prompt:**
```
Create Leetcode problem tracking endpoints.

Requirements:
- Create POST /api/leetcode/problems (log problem)
- Create GET /api/leetcode/problems (list with filters)
- Create PATCH /api/leetcode/problems/:id (update)
- Create DELETE /api/leetcode/problems/:id (delete)
- Support filtering by difficulty, topic, status
- Support sorting and pagination

Path: src/routes/leetcode.ts and src/controllers/leetcodeController.ts
Database: leetcodeProblems collection
```

**Commit Message:**
```
feat(backend): implement leetcode problem tracking endpoints

- Create POST /api/leetcode/problems for logging problems
- Implement GET /api/leetcode/problems with filtering
- Add difficulty, topic, status, date filters
- Support sorting by time, difficulty, date
- Create PATCH /api/leetcode/problems/:id for updates
- Implement DELETE /api/leetcode/problems/:id
- Add pagination support
- Validate problem data and relationships
```

---

## Task 6.2: Daily Goal Tracking

**Prompt:**
```
Create daily goal tracking and progress calculation.

Requirements:
- Create POST /api/leetcode/daily-goal endpoint
- Create GET /api/leetcode/daily-goal endpoint
- Calculate progress vs goal (total and by difficulty)
- Support goal customization (5-20 problems)
- Track difficulty distribution targets

Path: src/routes/leetcode.ts and src/services/goalService.ts
Database: leetcodeGoals collection
```

**Commit Message:**
```
feat(backend): implement daily goal tracking

- Create POST /api/leetcode/daily-goal for goal management
- Implement GET /api/leetcode/daily-goal for progress tracking
- Calculate completed vs goal problems
- Track difficulty distribution (Easy/Medium/Hard)
- Support customizable daily goals (5-20)
- Generate target distribution suggestions
- Calculate progress percentage
```

---

## Task 6.3: Analytics Calculation Service

**Prompt:**
```
Create comprehensive analytics calculation service.

Requirements:
- Calculate total solved, attempted, revision counts
- Calculate acceptance rate
- Calculate average time per problem
- Calculate difficulty breakdown
- Calculate topic breakdown
- Generate submission calendar
- Track current and longest streaks
- Generate weekly and monthly trends

Path: src/services/leetcodeAnalyticsService.ts
```

**Commit Message:**
```
feat(backend): implement leetcode analytics service

- Create calculateMetrics() for comprehensive stats
- Implement acceptanceRate calculation
- Add averageTimePerProblem calculation
- Calculate difficultyBreakdown and topicBreakdown
- Generate submissionHeatmap data
- Track currentStreak and longestStreak
- Create weeklyTrend and monthlyTrend data
- Optimize queries with aggregation pipeline
```

---

## Task 6.4: Revision Queue System

**Prompt:**
```
Create revision queue and tracking system.

Requirements:
- Create GET /api/leetcode/revision-queue endpoint
- Get problems marked for revision
- Sort by last attempt and confidence level
- Calculate next review date using spaced repetition

Path: src/routes/leetcode.ts and src/services/revisionService.ts
```

**Commit Message:**
```
feat(backend): implement revision queue system

- Create GET /api/leetcode/revision-queue endpoint
- Filter problems with status=revision
- Sort by lastAttempt and confidence level
- Calculate nextReviewDate using spaced repetition
- Support revision history tracking
- Add confidence level updates
```

---

## Task 6.5: Frontend Leetcode Tracker

**Prompt:**
```
Create Leetcode Tracker page with analytics dashboard.

Requirements:
- Create LeetcodeTracker page
- Create problem list/grid view
- Create ProblemCard component
- Create DailyGoalWidget
- Create analytics section with charts
- Create revision queue view
- Implement filtering and search

Path: frontend/src/pages/LeetcodeTracker.tsx
Components needed:
- LeetcodeTracker.tsx
- ProblemCard.tsx
- ProblemForm.tsx
- DailyGoalWidget.tsx
- RevisionQueue.tsx
- ProgressChart.tsx
- DifficultyChart.tsx
- SubmissionHeatmap.tsx

Libraries: Recharts for charts
```

**Design Inspiration:**
```
Reference:
- Leetcode progress dashboard
- Codeforces submission graph
- HackerRank achievements
- CodeSignal dashboard

Design elements:
- Problem list with status badges
- Difficulty color coding (Easy: green, Medium: yellow, Hard: red)
- Daily goal progress bar
- Problem grid for visual overview
- Charts for trends and distributions
- Revision queue highlighted
- Quick add button for logging problems
```

**Commit Message:**
```
feat(frontend): create leetcode tracker with analytics

- Implement LeetcodeTracker page layout
- Create ProblemCard component with metadata
- Build DailyGoalWidget with progress visualization
- Implement problem filtering and search
- Create analytics section with multiple charts
- Build RevisionQueue view with sorting
- Add ProblemForm modal for logging
- Implement Recharts for visualizations
- Create responsive design for all screen sizes
- Add difficulty color coding system
```

---

# PHASE 7: CORE SUBJECTS (Weeks 9-10)

## Task 7.1: Subject Endpoints

**Prompt:**
```
Create subject tracking endpoints.

Requirements:
- Create GET /api/subjects (list all subjects)
- Create GET /api/subjects/:id (subject detail)
- Create PATCH /api/subjects/:subjectId/topics/:topicId (update topic)
- Support topic status updates (learning, revising, confident)
- Calculate progress percentages

Path: src/routes/subjects.ts and src/controllers/subjectController.ts
Database: subjects collection
```

**Commit Message:**
```
feat(backend): implement subject tracking endpoints

- Create GET /api/subjects for all subjects with topics
- Implement GET /api/subjects/:id for subject detail
- Add PATCH endpoint for topic status updates
- Calculate topicProgressPercentage from subtopics
- Support filtering by status and difficulty
- Implement topic search functionality
```

---

## Task 7.2: Revision Scheduling

**Prompt:**
```
Create spaced repetition revision scheduling.

Requirements:
- Implement spaced repetition algorithm
- Schedule reviews at: 1 day, 3 days, 7 days, 14 days
- Create POST /api/subjects/:id/topics/:id/mark-revision
- Generate revision queue
- Track revision count

Path: src/services/revisionScheduler.ts
```

**Commit Message:**
```
feat(backend): implement spaced repetition revision scheduler

- Create calculateNextReview() function
- Implement intervals: 1, 3, 7, 14, 30 days
- Track revisionCount and nextReviewDate
- Create revision queue based on due dates
- Support marking topic for revision
- Generate due revisions list
```

---

## Task 7.3: Frontend Subject Tracker

**Prompt:**
```
Create Subject Tracker page with multiple views.

Requirements:
- Create SubjectTracker page
- Implement List View
- Implement Checklist View
- Implement Timeline View (Gantt-style)
- Implement Card View
- Create filtering and sorting
- Show progress bars

Path: frontend/src/pages/CoreSubjects.tsx
Components needed:
- CoreSubjects.tsx
- SubjectCard.tsx
- TopicList.tsx
- ChecklistView.tsx
- TimelineView.tsx
- CardView.tsx
- TopicForm.tsx
```

**Design Inspiration:**
```
Reference:
- Notion database views
- Todoist project views
- Asana project timeline
- Microsoft Project Gantt

Design elements:
- Subject grid with progress rings
- Topic list with status badges
- Checklist with strikethrough for completed
- Timeline showing target completion dates
- Card view with confidence indicators
- Color-coded status (not started/learning/revising/confident)
```

**Commit Message:**
```
feat(frontend): create core subjects tracker with multiple views

- Implement CoreSubjects page with view selector
- Create SubjectCard component with progress ring
- Build ListView for comprehensive topic list
- Implement ChecklistView with strikethrough
- Create TimelineView with Gantt-style chart
- Add CardView for visual overview
- Implement filtering and sorting
- Create TopicForm modal
- Add topic progress calculation
- Support multi-view state management
```

---

# PHASE 8: SYSTEM DESIGN (Weeks 10-11)

## Task 8.1: System Design Endpoints

**Prompt:**
```
Create system design topic tracking endpoints.

Requirements:
- Create POST /api/system-design (create topic)
- Create GET /api/system-design (list topics)
- Create PATCH /api/system-design/:id (update)
- Create DELETE /api/system-design/:id (delete)
- Support kanban column status
- Track time spent and pomodoro count

Path: src/routes/systemDesign.ts and src/controllers/systemDesignController.ts
Database: systemDesignTopics collection
```

**Commit Message:**
```
feat(backend): implement system design tracking endpoints

- Create POST /api/system-design for topic creation
- Implement GET /api/system-design with status filtering
- Add PATCH /api/system-design/:id for updates
- Create DELETE /api/system-design/:id
- Support status transitions (not_started → learning → revising → confident → mastered)
- Track timeSpent and pomodoroCount
- Calculate completionPercentage
```

---

## Task 8.2: Frontend System Design Tracker

**Prompt:**
```
Create System Design Tracker with Kanban and Timeline views.

Requirements:
- Create SystemDesign page
- Implement Kanban board (4 columns)
- Implement Timeline view
- Create topic cards with progress
- Support drag-and-drop between columns
- Show resources and notes

Path: frontend/src/pages/SystemDesign.tsx
Components needed:
- SystemDesign.tsx
- KanbanBoard.tsx
- Column.tsx
- TopicCard.tsx
- TimelineView.tsx
- TopicForm.tsx
```

**Commit Message:**
```
feat(frontend): create system design tracker with kanban view

- Implement SystemDesign page with view toggle
- Create KanbanBoard component with 4 columns
- Build Column component for kanban columns
- Implement drag-drop between columns
- Create TopicCard with metadata
- Build TimelineView with target dates
- Add TopicForm modal
- Implement status transitions
- Create resource/notes panel
```

---

# PHASE 9: KANBAN & POMODORO (Weeks 11-12)

## Task 9.1: Kanban Board Endpoints

**Prompt:**
```
Create kanban board endpoints (unified task board).

Requirements:
- Create GET /api/kanban/board (get board state)
- Create POST /api/kanban/tasks/:id/move (move between columns)
- Create POST /api/kanban/tasks/:id/subtasks (add subtask)
- Support 5 columns: Backlog, Today, In Progress, Review, Completed

Path: src/routes/kanban.ts and src/controllers/kanbanController.ts
```

**Commit Message:**
```
feat(backend): implement kanban board endpoints

- Create GET /api/kanban/board to fetch board state
- Implement POST /api/kanban/tasks/:id/move for column movement
- Add subtask management endpoints
- Support 5-column board state
- Maintain column order and task order
- Auto-move completed tasks to Completed column
```

---

## Task 9.2: Pomodoro Timer Endpoints

**Prompt:**
```
Create pomodoro session tracking endpoints.

Requirements:
- Create POST /api/pomodoro/sessions (start session)
- Create POST /api/pomodoro/sessions/:id/complete (end session)
- Create GET /api/pomodoro/stats (session statistics)
- Support different session types (work, break)
- Track focus time and break time

Path: src/routes/pomodoro.ts and src/controllers/pomodoroController.ts
Database: pomodoroSessions collection
```

**Commit Message:**
```
feat(backend): implement pomodoro session tracking

- Create POST /api/pomodoro/sessions to start timer
- Implement POST /api/pomodoro/sessions/:id/complete
- Create GET /api/pomodoro/stats for statistics
- Track sessionType (work, break), duration, focusQuality
- Calculate totalFocusTime and totalBreakTime
- Generate daily/weekly/monthly statistics
```

---

## Task 9.3: Frontend Kanban Board

**Prompt:**
```
Create Kanban Board page with drag-and-drop.

Requirements:
- Create KanbanBoard page
- Implement 5-column board
- Create draggable task cards
- Support subtasks
- Create task detail view
- Show priority and deadline

Path: frontend/src/pages/KanbanBoard.tsx
Components needed:
- KanbanBoard.tsx
- Board.tsx
- Column.tsx
- TaskCard.tsx
- TaskDetail.tsx
```

**Design Inspiration:**
```
Reference:
- Jira kanban board
- Trello board
- Linear kanban view
- Asana board

Design elements:
- Column headers with task count
- Draggable task cards with smooth animation
- Drop zone highlighting
- Task preview on drag
- Card colors by priority
- Deadline badges
- Progress indicators for subtasks
```

**Commit Message:**
```
feat(frontend): create kanban board with drag-drop support

- Implement KanbanBoard page layout
- Create 5-column board (Backlog, Today, In Progress, Review, Completed)
- Build draggable task cards with dnd-kit
- Implement drop zone highlighting
- Create TaskDetail panel for editing
- Add subtask list within cards
- Implement priority color system
- Create deadline badges
- Add responsive design for mobile
```

---

## Task 9.4: Frontend Pomodoro Timer

**Prompt:**
```
Create Pomodoro Timer component with full functionality.

Requirements:
- Create Pomodoro timer page/modal
- Implement 25-minute work, 5-minute break cycle
- Support custom durations
- Create progress ring visualization
- Show session counter
- Support pause/resume/skip
- Play audio alert on completion
- Track statistics

Path: frontend/src/pages/Pomodoro.tsx or frontend/src/components/PomodoroTimer.tsx
Components needed:
- PomodoroTimer.tsx (main timer)
- CircleProgress.tsx (progress ring)
- SessionCounter.tsx
- BreakTimer.tsx
- PomodoroStats.tsx
- SessionHistory.tsx
```

**Design Inspiration:**
```
Reference:
- Be Focused app
- Marinara Timer
- Focus@Will timer
- Forest app

Design elements:
- Large circular progress indicator
- MM:SS time display (large font)
- Session type indicator (Work/Break)
- Progress ring with color change
- Play/Pause/Skip buttons
- Session counter display
- Statistics panel
- Daily focus time tracker
```

**Commit Message:**
```
feat(frontend): implement pomodoro timer with full functionality

- Create PomodoroTimer component with 25/5 cycle
- Implement CircleProgress component (SVG)
- Add pause/resume/skip functionality
- Support custom durations
- Implement audio alert on completion
- Create SessionCounter display
- Build statistics view (daily/weekly/monthly)
- Add session history tracking
- Implement keyboard shortcuts (space to start/pause)
- Add responsive design
```

---

# PHASE 10: ANALYTICS (Weeks 12-13)

## Task 10.1: Analytics Aggregation Service

**Prompt:**
```
Create analytics aggregation and calculation service.

Requirements:
- Aggregate metrics from all modules
- Calculate trends over time
- Generate insights
- Create time-based comparisons
- Optimize with aggregation pipeline

Path: src/services/analyticsService.ts
```

**Commit Message:**
```
feat(backend): implement analytics aggregation service

- Create aggregateMetrics() for comprehensive stats
- Implement weeklyStudy calculation
- Add productivityTrend calculation
- Create difficultyBreakdown for Leetcode
- Calculate habitConsistency percentage
- Generate timeDistribution breakdown
- Create weeklyComparison logic
- Implement trend analysis (improving/declining)
```

---

## Task 10.2: Analytics Endpoints

**Prompt:**
```
Create analytics dashboard endpoints.

Requirements:
- Create GET /api/analytics/dashboard (main analytics)
- Create GET /api/analytics/charts/:type (specific chart data)
- Create GET /api/analytics/heatmap/:type (heatmap data)
- Support period filtering (week, month, year)

Path: src/routes/analytics.ts and src/controllers/analyticsController.ts
```

**Commit Message:**
```
feat(backend): implement analytics endpoints

- Create GET /api/analytics/dashboard for overview
- Implement GET /api/analytics/charts/:type for chart data
- Add GET /api/analytics/heatmap/:type for heatmaps
- Support period filtering (week, month, year)
- Cache analytics responses for performance
- Generate insights from data
```

---

## Task 10.3: Frontend Analytics Dashboard

**Prompt:**
```
Create comprehensive Analytics page with charts.

Requirements:
- Create Analytics page
- Implement multiple chart types
- Create chart components for each metric
- Support period selection
- Create insights section
- Add export functionality

Path: frontend/src/pages/Analytics.tsx
Components needed:
- Analytics.tsx
- StudyChart.tsx
- ProductivityChart.tsx
- LeetcodeChart.tsx
- HabitChart.tsx
- TimeDistributionChart.tsx
- HeatmapView.tsx
- InsightsSection.tsx

Libraries: Recharts, date-fns
```

**Design Inspiration:**
```
Reference:
- GitHub insights
- Spotify Wrapped (data visualization)
- Fitbit dashboard
- Toggl reporting

Design elements:
- Multiple chart types (line, area, bar, pie, radar)
- Chart legend with toggleable series
- Interactive tooltips
- Period selector (week/month/year)
- Comparison metrics (vs last period)
- Trend indicators (↑ ↓ →)
- Color-coded data series
- Responsive charts (resize with container)
```

**Commit Message:**
```
feat(frontend): create analytics dashboard with recharts

- Implement Analytics page layout
- Create StudyChart (line chart with trend)
- Build ProductivityChart (area chart)
- Implement LeetcodeChart (stacked bar)
- Create HabitChart (radar chart)
- Add TimeDistributionChart (pie chart)
- Build HeatmapView component
- Implement InsightsSection with auto-generated tips
- Add period selector (week/month/year)
- Create export to PDF/CSV functionality
```

---

# PHASE 11: ADMIN PANEL (Weeks 13-14)

## Task 11.1: Admin Authentication

**Prompt:**
```
Create admin-specific authentication system.

Requirements:
- Create POST /api/admin/auth/login endpoint
- Support access code + email authentication
- Generate admin JWT tokens
- Implement admin role verification
- Support 2FA (TOTP)
- Track admin sessions
- Implement rate limiting

Path: src/routes/admin.ts and src/controllers/adminAuthController.ts
Database: admins collection
```

**Commit Message:**
```
feat(backend): implement admin authentication system

- Create POST /api/admin/auth/login endpoint
- Implement access code validation
- Generate admin-specific JWT tokens (4-hour expiry)
- Add optional TOTP 2FA support
- Implement admin session tracking
- Add rate limiting (5 attempts per 15 minutes)
- Create admin audit logging for all logins
- Support admin logout and token blacklisting
```

---

## Task 11.2: User Management Admin Endpoints

**Prompt:**
```
Create admin endpoints for user management.

Requirements:
- Create GET /api/admin/users (list users with filters)
- Create GET /api/admin/users/:id (user details)
- Create PATCH /api/admin/users/:id (edit user)
- Create POST /api/admin/users/:id/ban (ban user)
- Create POST /api/admin/users/:id/unban (unban user)
- Create DELETE /api/admin/users/:id (delete user)
- Create POST /api/admin/users/:id/send-message

Path: src/routes/admin.ts and src/controllers/adminController.ts
```

**Commit Message:**
```
feat(backend): implement admin user management endpoints

- Create GET /api/admin/users with pagination and filtering
- Implement GET /api/admin/users/:id for user details
- Add PATCH /api/admin/users/:id for editing
- Create POST /api/admin/users/:id/ban with reason
- Implement POST /api/admin/users/:id/unban
- Add DELETE /api/admin/users/:id (soft delete)
- Create POST /api/admin/users/:id/send-message
- Add all operations to audit log
```

---

## Task 11.3: Admin Dashboard Endpoints

**Prompt:**
```
Create admin dashboard metrics endpoints.

Requirements:
- Create GET /api/admin/dashboard/overview
- Create GET /api/admin/analytics/overview
- Create GET /api/admin/logs (audit logs)
- Create GET /api/admin/system/status

Path: src/routes/admin.ts and src/controllers/adminController.ts
```

**Commit Message:**
```
feat(backend): implement admin dashboard endpoints

- Create GET /api/admin/dashboard/overview
- Add user statistics (total, active, new today)
- Implement GET /api/admin/analytics/overview
- Create GET /api/admin/logs for audit trail
- Add GET /api/admin/system/status for health
- Calculate system metrics (uptime, error rate)
- Generate recent activity list
```

---

## Task 11.4: Admin Announcements

**Prompt:**
```
Create announcement management endpoints.

Requirements:
- Create POST /api/admin/announcements (create)
- Create GET /api/admin/announcements (list)
- Create PATCH /api/admin/announcements/:id (update)
- Create DELETE /api/admin/announcements/:id (delete)
- Support scheduling

Path: src/routes/admin.ts and src/controllers/announcementController.ts
Database: announcements collection
```

**Commit Message:**
```
feat(backend): implement announcement management

- Create POST /api/admin/announcements for creation
- Implement scheduling with cron jobs
- Add GET /api/admin/announcements for listing
- Create PATCH and DELETE endpoints
- Track announcement engagement (views, clicks)
- Support multi-channel sending (in-app, email)
- Add announcement history archive
```

---

## Task 11.5: Frontend Admin Panel

**Prompt:**
```
Create complete admin panel with dashboard and management.

Requirements:
- Create AdminPanel page with protected route
- Create Dashboard with key metrics
- Create UserManagement page
- Create AuditLogs viewer
- Create Announcements management
- Create Settings page

Path: frontend/src/pages/AdminPanel/
Components needed:
- AdminPanel.tsx (main layout)
- AdminDashboard.tsx
- UserList.tsx
- UserDetail.tsx
- AuditLogs.tsx
- AnnouncementManager.tsx
- AdminSettings.tsx

Libraries: react-table for data tables
```

**Design Inspiration:**
```
Reference:
- Railway dashboard
- Vercel admin panel
- GitHub admin settings
- Linear team settings

Design elements:
- Sidebar navigation for admin sections
- Key metrics cards at top
- Data tables with search/filter/sort
- User detail sidebar
- Audit log viewer with timeline
- Announcement editor with preview
- Settings panel with toggles
- Action confirmation dialogs
```

**Commit Message:**
```
feat(frontend): create admin panel with full management features

- Implement AdminPanel layout with protected route
- Create AdminDashboard with key metrics
- Build UserManagement page with data table
- Implement UserDetail sidebar
- Create AuditLogs viewer with filtering
- Build AnnouncementManager with editor
- Implement AdminSettings page
- Add role-based access control (RBAC)
- Create confirmation dialogs for destructive actions
- Add responsive design for admin workflows
```

---

# PHASE 12: POLISH & DEPLOY (Weeks 14-16)

## Task 12.1: Testing - Backend Unit Tests

**Prompt:**
```
Write unit tests for backend services and utilities.

Requirements:
- Test auth service (password hashing, token generation)
- Test validation functions
- Test streak calculation
- Test analytics calculations
- Target: 60% coverage of services

Path: backend/tests/unit/
Framework: Jest
```

**Commit Message:**
```
test(backend): add unit tests for services

- Test authService (password hashing, token generation)
- Test streakCalculation engine
- Test timeTrackingService calculations
- Test analyticsService aggregation
- Add validation function tests
- Achieve 60% service coverage
- Add test fixtures for consistent data
```

---

## Task 12.2: Testing - Backend Integration Tests

**Prompt:**
```
Write integration tests for API endpoints.

Requirements:
- Test auth flow (register → verify → login)
- Test task CRUD operations
- Test recurring task generation
- Test admin operations
- Target: 50% coverage of endpoints

Path: backend/tests/integration/
Framework: Jest + Supertest
```

**Commit Message:**
```
test(backend): add integration tests for api endpoints

- Test registration and verification flow
- Test login and token refresh
- Test task CRUD operations
- Test recurring task generation
- Test admin user management
- Test analytics endpoint calculations
- Achieve 50% endpoint coverage
```

---

## Task 12.3: Testing - Frontend Unit Tests

**Prompt:**
```
Write unit tests for frontend components and hooks.

Requirements:
- Test components with React Testing Library
- Test custom hooks
- Test utility functions
- Target: 40% coverage

Path: frontend/src/tests/unit/
Framework: Vitest + React Testing Library
```

**Commit Message:**
```
test(frontend): add unit tests for components and hooks

- Test component rendering and interactions
- Test custom hooks (useAuth, useMetrics)
- Test utility functions and formatters
- Test form validation
- Achieve 40% component coverage
```

---

## Task 12.4: E2E Testing

**Prompt:**
```
Write end-to-end tests for critical user flows.

Requirements:
- Test registration → login → dashboard flow
- Test create task → complete task flow
- Test admin login and user management
- Test habit tracking flow

Path: frontend/tests/e2e/
Framework: Playwright
```

**Commit Message:**
```
test(frontend): add e2e tests with playwright

- Test registration and login flow
- Test daily planner workflow
- Test habit tracking completion
- Test admin panel access
- Test task completion and analytics update
- Add visual regression tests
```

---

## Task 12.5: Performance Optimization

**Prompt:**
```
Optimize frontend and backend performance.

Requirements:
- Frontend:
  - Code splitting per route
  - Image optimization
  - Bundle size <500KB gzipped
  - Lighthouse score >90

- Backend:
  - Database query optimization
  - Add Redis caching
  - API response <200ms
  - Support 1000 concurrent users

Path: Various files
```

**Commit Message:**
```
perf: optimize frontend and backend performance

- Frontend optimizations:
  - Implement code splitting with React.lazy
  - Optimize images with responsive srcset
  - Reduce bundle size to <500KB gzipped
  - Achieve Lighthouse score 95+

- Backend optimizations:
  - Add Redis caching for analytics
  - Optimize MongoDB queries with indexes
  - Implement response caching headers
  - Achieve <200ms API response time
  - Support 1000 concurrent connections
```

---

## Task 12.6: Security Hardening

**Prompt:**
```
Implement security measures and fixes.

Requirements:
- Input validation and sanitization
- SQL injection prevention (MongoDB)
- XSS protection
- CSRF protection
- Rate limiting on all endpoints
- Secure password policy
- Admin panel IP whitelisting
- HTTPS enforcement

Path: Various files
```

**Commit Message:**
```
security: implement comprehensive security measures

- Add input validation and sanitization
- Implement XSS protection
- Add CSRF token validation
- Enable rate limiting on all endpoints
- Enforce HTTPS only
- Add security headers (CSP, X-Frame-Options)
- Implement admin panel IP whitelisting
- Add password policy validation
- Regular security dependency audits
```

---

## Task 12.7: Deployment Setup

**Prompt:**
```
Set up deployment infrastructure and CI/CD.

Requirements:
- Deploy frontend to Vercel
- Deploy backend to Railway
- Set up MongoDB Atlas
- Configure GitHub Actions for CI/CD
- Set up monitoring (Sentry, Datadog)
- Configure environment variables

Path: .github/workflows/, deployment configs
```

**Commit Message:**
```
ci/cd: setup deployment pipeline and monitoring

- Configure GitHub Actions for backend tests
- Set up GitHub Actions for frontend build
- Configure Vercel deployment for frontend
- Set up Railway deployment for backend
- Configure MongoDB Atlas connection
- Set up Sentry for error tracking
- Configure Datadog for monitoring
- Add environment variable management
- Set up database backups
- Configure custom domains
```

---

## Task 12.8: Documentation

**Prompt:**
```
Create comprehensive documentation.

Requirements:
- API documentation (Swagger/OpenAPI)
- User guide and features documentation
- Developer setup guide
- Architecture documentation
- Database schema documentation

Path: docs/
```

**Commit Message:**
```
docs: create comprehensive project documentation

- Generate Swagger/OpenAPI documentation
- Create user guide for all features
- Write developer setup guide
- Document API endpoints with examples
- Create database schema documentation
- Add architecture decision records
- Write troubleshooting guide
- Create feature tutorials
```

---

## Task 12.9: Launch & Monitoring

**Prompt:**
```
Launch application and set up monitoring.

Requirements:
- Deploy to production
- Set up monitoring and alerting
- Create user feedback system
- Set up analytics
- Monitor performance metrics
- Prepare for scaling

Path: Production deployment
```

**Commit Message:**
```
launch: deploy to production with monitoring

- Deploy frontend to production
- Deploy backend to production
- Configure production environment variables
- Set up Sentry error tracking
- Configure Datadog monitoring
- Set up performance alerts
- Enable user feedback collection
- Configure analytics tracking
- Set up database backup schedule
- Create runbook for common issues
```

---

# Git Workflow & Commit Strategy

## Branch Naming Convention

```
main              → Production branch (protected)
develop           → Development branch (integration)
feature/*         → Feature branches
bugfix/*          → Bug fix branches
hotfix/*          → Production hotfixes
refactor/*        → Refactoring work
test/*            → Testing work
```

## Commit Message Format

### Standard Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes (formatting, missing semicolons, etc)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `ci`: CI/CD configuration
- `chore`: Maintenance tasks
- `security`: Security fixes

### Examples

**Feature:**
```
feat(auth): implement user registration with email verification

- Add POST /api/auth/register endpoint
- Implement OTP generation and validation
- Set up email sending with Nodemailer
- Add password strength validation
- Return JWT tokens on successful registration
```

**Bug Fix:**
```
fix(dashboard): correct daily progress calculation

- Fix calculation logic for progress percentage
- Handle edge case when no tasks exist
- Add proper null checking
- Update unit tests
```

**Performance:**
```
perf(analytics): optimize dashboard query performance

- Add MongoDB aggregation pipeline
- Implement Redis caching (30s TTL)
- Reduce query execution time from 800ms to 150ms
- Add database indexes for timestamp fields
```

---

# Git Commit Template

Create `.gitmessage` in project root:

```
# <type>(<scope>): <subject>
# |     |          |
# |     |          +-> subject in imperative mood, lowercase, no period
# |     +-> scope of change (auth, dashboard, etc)
# +-> type: feat|fix|docs|style|refactor|perf|test|ci|chore|security

# Body (optional): Explain what and why, not how
# - Use bullet points for multiple changes
# - Reference issue numbers if applicable
# - Keep lines under 72 characters

# Footer (optional): Reference issues and breaking changes
# Closes #123
# BREAKING CHANGE: description
```

Configure globally:
```bash
git config --global commit.template ~/.gitmessage
```

---

# Development Timeline

## Week-by-Week Schedule

### Week 1-2: Foundation
- Day 1-2: Project setup & database design
- Day 3-4: Express server & middleware
- Day 5: Authentication middleware setup
- Day 6-7: Error handling & response formatting

### Week 2-3: Authentication
- Day 8-9: Registration & email verification
- Day 10: Login & token management
- Day 11: Password reset flow
- Day 12-13: Frontend auth pages
- Day 14: Testing auth endpoints

### Week 3-4: Dashboard
- Day 15-16: User profile endpoints
- Day 17: Dashboard metrics calculation
- Day 18: Dashboard API endpoint
- Day 19-20: Frontend dashboard page
- Day 21: Design refinement & animations

### Week 4-6: Daily Planner
- Day 22-25: Task management endpoints
- Day 26: Recurring tasks system
- Day 27-28: Frontend task management
- Day 29-30: Time tracking features
- Day 31-32: Testing & optimizations
- Day 33-35: Design polish & animations

### Week 6-7: Habits
- Day 36-38: Habit endpoints & streak calculation
- Day 39-40: Heatmap generation
- Day 41-42: Frontend habit tracker
- Day 43: Design & animations
- Day 44: Testing

### Week 7-9: Leetcode
- Day 45-48: Problem tracking endpoints
- Day 49-50: Goal tracking & analytics
- Day 51-52: Frontend tracker & charts
- Day 53-54: Revision queue system
- Day 55-56: Testing & optimization

### Week 9-10: Core Subjects
- Day 57-58: Subject endpoints
- Day 59-60: Revision scheduling
- Day 61-62: Frontend subject tracker
- Day 63: Design & testing

### Week 10-11: System Design
- Day 64-65: System design endpoints
- Day 66-67: Frontend tracker & views
- Day 68: Testing

### Week 11-12: Kanban & Pomodoro
- Day 69-70: Kanban board endpoints
- Day 71-72: Frontend kanban board
- Day 73-74: Pomodoro endpoints
- Day 75-76: Frontend pomodoro timer

### Week 12-13: Analytics
- Day 77-79: Analytics aggregation
- Day 80-81: Frontend analytics dashboard
- Day 82-83: Chart implementation

### Week 13-14: Admin Panel
- Day 84-85: Admin auth & user management
- Day 86-87: Frontend admin panel
- Day 88: Audit logs & settings

### Week 14-16: Polish & Deploy
- Day 89-93: Testing (unit, integration, E2E)
- Day 94-95: Performance optimization
- Day 96-97: Security hardening
- Day 98-99: Documentation
- Day 100: Deployment & launch

---

# Technology Versions & Setup Commands

## Frontend Setup (Complete)

```bash
# Create project
npm create vite@latest trackforge-frontend -- --template react-ts
cd trackforge-frontend

# Install all dependencies at once
npm install \
  react-router-dom \
  axios \
  @tanstack/react-query \
  framer-motion \
  dnd-kit \
  recharts \
  lucide-react \
  tailwindcss \
  postcss \
  autoprefixer \
  -D typescript \
  @types/node \
  @types/react \
  @types/react-dom \
  tailwindcss

# Initialize tailwind
npx tailwindcss init -p

# Create folder structure
mkdir -p src/{pages,components,hooks,services,context,types,styles,utils,tests}
```

## Backend Setup (Complete)

```bash
# Create backend
mkdir trackforge-backend
cd trackforge-backend

# Initialize
npm init -y

# Install all dependencies
npm install \
  express \
  mongoose \
  jsonwebtoken \
  bcryptjs \
  dotenv \
  cors \
  helmet \
  joi \
  express-validator \
  nodemailer \
  winston \
  --save-dev \
  typescript \
  @types/express \
  @types/node \
  jest \
  ts-jest \
  @types/jest \
  supertest \
  @types/supertest

# Initialize TypeScript
npx tsc --init

# Create folder structure
mkdir -p src/{config,controllers,models,routes,middleware,services,utils,validators}
mkdir -p tests/{unit,integration}
```

---

# Design System Specifications

## Color Palette (Dark Mode First)

```
Primary Colors:
- Background: #0f172a (slate-950)
- Surface: #1e293b (slate-900)
- Elevated: #334155 (slate-800)
- Border: #475569 (slate-600)

Accent Colors:
- Primary: #6366f1 (indigo-500)
- Primary Dark: #4f46e5 (indigo-600)
- Primary Light: #818cf8 (indigo-400)

Semantic Colors:
- Success: #10b981 (emerald-500)
- Warning: #f59e0b (amber-500)
- Error: #ef4444 (red-500)
- Info: #0ea5e9 (cyan-500)

Text Colors:
- Primary: #f1f5f9 (slate-100)
- Secondary: #cbd5e1 (slate-300)
- Tertiary: #94a3b8 (slate-400)

UI Elements:
- Hover: rgba(99, 102, 241, 0.1) (indigo with 10% opacity)
- Focus: #6366f1 (indigo-500)
```

## Typography

```
Font Family: 'Inter', system-ui, sans-serif

Sizes:
- xs: 0.75rem (12px)
- sm: 0.875rem (14px)
- base: 1rem (16px)
- lg: 1.125rem (18px)
- xl: 1.25rem (20px)
- 2xl: 1.5rem (24px)
- 3xl: 1.875rem (30px)
- 4xl: 2.25rem (36px)

Font Weights:
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

Line Heights:
- Tight: 1.25
- Snug: 1.375
- Normal: 1.5
- Relaxed: 1.625
- Loose: 2
```

## Spacing System

```
xs: 4px (0.25rem)
sm: 8px (0.5rem)
md: 16px (1rem)
lg: 24px (1.5rem)
xl: 32px (2rem)
2xl: 48px (3rem)
3xl: 64px (4rem)
```

## Border Radius

```
sm: 4px
md: 8px
lg: 12px
xl: 16px
2xl: 24px
full: 9999px
```

## Shadows

```
sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

## Animations

```
Duration:
- fast: 150ms
- normal: 300ms
- slow: 500ms

Easing:
- ease-in: cubic-bezier(0.4, 0, 1, 1)
- ease-out: cubic-bezier(0, 0, 0.2, 1)
- ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
```

---

# Database Index Strategy

## Users Collection
```mongodb
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ createdAt: -1 })
db.users.createIndex({ status: 1 })
```

## Tasks Collection
```mongodb
db.tasks.createIndex({ userId: 1, deadline: 1 })
db.tasks.createIndex({ userId: 1, createdAt: -1 })
db.tasks.createIndex({ userId: 1, status: 1 })
```

## Habits Collection
```mongodb
db.habits.createIndex({ userId: 1, createdAt: -1 })
db.habits.createIndex({ userId: 1, name: 1 })
```

## Leetcode Problems Collection
```mongodb
db.leetcodeProblems.createIndex({ userId: 1, submissionDate: -1 })
db.leetcodeProblems.createIndex({ userId: 1, difficulty: 1 })
db.leetcodeProblems.createIndex({ userId: 1, topic: 1 })
```

## Audit Logs Collection
```mongodb
db.auditLogs.createIndex({ timestamp: -1 })
db.auditLogs.createIndex({ userId: 1, timestamp: -1 })
db.auditLogs.createIndex({ eventType: 1 })
```

---

# Conclusion

This comprehensive guide provides:

✅ **Complete implementation prompts** for all 12 phases  
✅ **Detailed commit messages** for version control  
✅ **Technology specifications** with exact versions  
✅ **Git workflow** and naming conventions  
✅ **Design system** specifications  
✅ **Database indexing** strategy  
✅ **Development timeline** week-by-week  
✅ **Setup commands** ready to copy-paste  

## Next Steps

1. ✅ Create frontend project with `npm create vite`
2. ✅ Create backend project with `npm init`
3. ✅ Start Phase 1: Database design and Express setup
4. ✅ Follow commit message format religiously
5. ✅ Push to GitHub and start CI/CD pipeline

**Ready to build TrackForge! 🚀**

