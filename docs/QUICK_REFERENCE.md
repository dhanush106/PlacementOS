# TrackForge - Quick Reference Prompt Guide

**Last Updated:** 2026-07-12  
**Status:** Ready for Development  

---

## 🚀 Quick Start Commands

### Frontend Project Setup
```bash
npm create vite@latest trackforge-frontend -- --template react-ts
cd trackforge-frontend
npm install react-router-dom axios @tanstack/react-query framer-motion dnd-kit recharts lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
mkdir -p src/{pages,components,hooks,services,context,types,styles,utils,tests}
code .
```

### Backend Project Setup
```bash
mkdir trackforge-backend && cd trackforge-backend
npm init -y
npm install express mongoose jsonwebtoken bcryptjs dotenv cors helmet joi express-validator nodemailer winston
npm install -D typescript @types/express @types/node jest ts-jest @types/jest supertest
npx tsc --init
mkdir -p src/{config,controllers,models,routes,middleware,services,utils,validators} tests/{unit,integration}
code .
```

---

## 📋 Phase Prompts Index

### PHASE 1: Foundation (Weeks 1-2)

**1.1 Database Models (Backend)**
```
Create MongoDB Mongoose models for TrackForge with TypeScript.
- User model: email, password (hashed), profile fields
- Session model: for audit trails
- AuditLog model: immutable event logging
- Add timestamps and indexes
- Include proper validation and type safety
```

**1.2 Database Connection (Backend)**
```
Set up MongoDB connection, error handling, seed data.
- Connect to MongoDB Atlas
- Handle reconnection with retries
- Seed predefined data (habits, quotes, subjects)
- Implement health check
- Configure connection pooling
```

**1.3 Express Server (Backend)**
```
Create Express app with middleware setup.
- Initialize with TypeScript
- Configure CORS for frontend
- Add Helmet security headers
- Implement request logging (Winston)
- Create error handling middleware
```

**1.4 Authentication Middleware (Backend)**
```
Create JWT verification and RBAC middleware.
- Implement authenticate() middleware
- Create admin authentication
- Add rate limiting
- Support role-based access control
```

**1.5 Error Handling (Backend)**
```
Create standardized error handling system.
- Define custom error classes
- Standardize API response format
- Implement error logging
- Create error code reference
```

---

### PHASE 2: Authentication (Weeks 2-3)

**2.1 Registration Endpoint (Backend)**
```
Create POST /api/auth/register with validation.
- Email format validation
- Password strength rules (8 chars, 1 upper, 1 number, 1 special)
- Duplicate email check
- OTP generation and email sending
- Return JWT tokens
- Rate limiting: 5 attempts/min
```

**2.2 Email Verification (Backend)**
```
Create POST /api/auth/verify-email endpoint.
- Validate OTP
- Check 24-hour expiry
- Mark user as verified
- Auto-login or return tokens
```

**2.3 Login Endpoint (Backend)**
```
Create POST /api/auth/login endpoint.
- Credential validation
- Account lockout: 5 failed attempts → 15 min lockout
- Session tracking for audit
- Remember-me support (extends token to 30 days)
```

**2.4 Token Refresh (Backend)**
```
Create POST /api/auth/refresh endpoint.
- Validate refresh token
- Check blacklist
- Generate new access token
```

**2.5 Logout (Backend)**
```
Create POST /api/auth/logout endpoint.
- Add tokens to blacklist
- Clear cookies
- Support logout-all-sessions
```

**2.6 Password Reset (Backend)**
```
Create password reset flow with 3 endpoints:
- POST /api/auth/password-reset (request)
- POST /api/auth/password-reset/verify (verify OTP)
- POST /api/auth/password-reset/complete (set password)
- Rate limit: 3 resets per 24 hours
- Token expires: 1 hour
```

**2.7 Frontend Auth Pages (Frontend)**
```
Create React auth pages with validation.
- Register.tsx with password strength indicator
- Login.tsx with remember-me
- VerifyEmail.tsx with OTP input
- ForgotPassword.tsx
- ResetPassword.tsx
- useAuth hook for context
- Protected routes wrapper
```

---

### PHASE 3: Dashboard (Weeks 3-4)

**3.1 User Profile Endpoints (Backend)**
```
Create profile management endpoints.
- GET /api/users/profile
- PATCH /api/users/profile
- POST /api/users/avatar (file upload, max 5MB)
- POST /api/users/change-email
- DELETE /api/users/account (soft delete)
```

**3.2 Dashboard Metrics Service (Backend)**
```
Create dashboardService.ts with calculation functions.
- calculateDailyProgress()
- getStudyHoursToday()
- getLeetcodeProgressToday()
- getHabitCompletionPercentage()
- getDailyMotivationQuote()
- getPriorityTask()
- getWeeklyHeatmap()
- Cache results for 30 seconds
```

**3.3 Dashboard API (Backend)**
```
Create GET /api/dashboard/overview endpoint.
- Aggregate all metrics
- Include recent activity (last 5)
- Return weekly heatmap
- Cache for performance
```

**3.4 Frontend Dashboard (Frontend)**
```
Create Dashboard.tsx with all widgets.
- MetricCard components (4-column grid)
- PriorityTaskCard widget
- WeeklyHeatmap visualization
- RecentActivityFeed (last 5 items)
- QuickActionsBar buttons
- LoadingSkeleton on load
- Real-time updates (30s polling)
- Responsive design (mobile/tablet/desktop)
```

---

### PHASE 4: Daily Planner (Weeks 4-6)

**4.1 Task Management (Backend)**
```
Create comprehensive task endpoints.
- POST /api/planner/tasks (create)
- GET /api/planner/tasks (list with filters)
- PATCH /api/planner/tasks/:id (update)
- POST /api/planner/tasks/:id/complete
- DELETE /api/planner/tasks/:id
- POST /api/planner/tasks/:id/subtasks
- Support filters: date, timeSlot, priority, status
- Support sorting and pagination
```

**4.2 Recurring Tasks (Backend)**
```
Implement recurring task system.
- Support patterns: daily, weekdays, weekends, weekly, bi-weekly, monthly
- Auto-generate instances on schedule
- Support end date and max occurrences
- Allow edit single or all future instances
- Cron job for daily generation
```

**4.3 Task Reordering (Backend)**
```
Create POST /api/planner/tasks/reorder endpoint.
- Handle reorder within time slot
- Handle movement between time slots
- Handle kanban column movement
- Update order in database
```

**4.4 Frontend Daily Planner (Frontend)**
```
Create DailyPlanner.tsx with drag-drop.
- TimeSlotContainer for each time period
- TaskCard with all metadata
- TaskForm modal for create/edit
- Drag-and-drop with dnd-kit
- Subtask list component
- RecurringTaskDialog
- Priority color coding
- Time tracking visualization
- Responsive grid layout
```

**4.5 Time Tracking (Backend)**
```
Implement task time tracking.
- Store estimated time on creation
- Track actual time on completion
- Calculate variance percentage
- Historical accuracy tracking
- Warning if >30% over estimate
```

---

### PHASE 5: Habit Tracker (Weeks 6-7)

**5.1 Habit Endpoints (Backend)**
```
Create habit CRUD and completion logging.
- POST /api/habits (create)
- GET /api/habits (list with period filter)
- PATCH /api/habits/:id (update)
- DELETE /api/habits/:id (delete)
- POST /api/habits/:id/complete (daily logging)
- Calculate streaks and consistency %
```

**5.2 Streak Calculation (Backend)**
```
Create streakService.ts for streak tracking.
- calculateCurrentStreak() function
- getLongestStreak() tracking
- Freeze feature (once per month)
- Milestone notifications (7, 14, 30, 100 days)
- Timezone-aware calculation
```

**5.3 Heatmap Generation (Backend)**
```
Create heatmapService.ts for visualization.
- generateHeatmap() for 52-week view
- Calculate color intensity (0-4 levels)
- Support period filtering
- Generate cell data with details
- Optimize for performance
```

**5.4 Frontend Habit Tracker (Frontend)**
```
Create HabitTracker.tsx with heatmap.
- HabitCard components with status
- GitHub-style heatmap visualization
- HeatmapCell with hover tooltip
- StreakBadge with flame emoji
- HabitForm modal
- Habit analytics view
- Consistency percentage display
- Responsive mobile design
```

---

### PHASE 6: Leetcode Tracker (Weeks 7-9)

**6.1 Problem Logging (Backend)**
```
Create Leetcode problem endpoints.
- POST /api/leetcode/problems (log problem)
- GET /api/leetcode/problems (list with filters)
- PATCH /api/leetcode/problems/:id (update)
- DELETE /api/leetcode/problems/:id (delete)
- Support filtering: difficulty, topic, status
- Support sorting and pagination
```

**6.2 Daily Goal Tracking (Backend)**
```
Create daily goal endpoints.
- POST /api/leetcode/daily-goal (set goal)
- GET /api/leetcode/daily-goal (progress)
- Calculate problems vs goal
- Track difficulty distribution
- Support customizable goals (5-20)
```

**6.3 Analytics Service (Backend)**
```
Create leetcodeAnalyticsService.ts.
- calculateMetrics() for all stats
- acceptanceRate calculation
- averageTimePerProblem
- difficultyBreakdown
- topicBreakdown
- submissionHeatmap data
- Streaks (current and longest)
- Weekly and monthly trends
```

**6.4 Revision Queue (Backend)**
```
Create GET /api/leetcode/revision-queue.
- Filter problems with status=revision
- Sort by lastAttempt and confidence
- Calculate nextReviewDate
- Support spaced repetition
```

**6.5 Frontend Leetcode Tracker (Frontend)**
```
Create LeetcodeTracker.tsx with analytics.
- ProblemCard component
- ProblemForm modal
- DailyGoalWidget with progress bar
- Analytics charts (Recharts):
  - Progress line chart
  - Difficulty stacked bar
  - Topic distribution pie
  - Submission heatmap
- RevisionQueue view
- Filtering and search
- Difficulty color coding
```

---

### PHASE 7: Core Subjects (Weeks 9-10)

**7.1 Subject Endpoints (Backend)**
```
Create subject tracking endpoints.
- GET /api/subjects (list all)
- GET /api/subjects/:id (detail)
- PATCH /api/subjects/:id/topics/:id (update topic)
- Support topic status updates
- Calculate progress %
```

**7.2 Revision Scheduling (Backend)**
```
Implement spaced repetition.
- calculateNextReview() function
- Schedule at: 1, 3, 7, 14, 30 days
- POST /api/subjects/:id/topics/:id/mark-revision
- Track revisionCount
- Generate revision queue
```

**7.3 Frontend Subject Tracker (Frontend)**
```
Create CoreSubjects.tsx with multiple views.
- ListView: comprehensive topic list
- ChecklistView: simple checkboxes
- TimelineView: Gantt-style chart
- CardView: visual overview
- SubjectCard component
- TopicForm modal
- Filtering and sorting
- Progress indicators
```

---

### PHASE 8: System Design (Weeks 10-11)

**8.1 System Design Endpoints (Backend)**
```
Create system design tracking.
- POST /api/system-design (create topic)
- GET /api/system-design (list with filters)
- PATCH /api/system-design/:id (update)
- DELETE /api/system-design/:id (delete)
- Support kanban column status
- Track timeSpent and pomodoroCount
```

**8.2 Frontend System Design (Frontend)**
```
Create SystemDesign.tsx with views.
- KanbanBoard with 4 columns
- Drag-drop between columns
- TimelineView with target dates
- TopicCard components
- TopicForm modal
- Progress visualization
- Resource/notes panel
```

---

### PHASE 9: Kanban & Pomodoro (Weeks 11-12)

**9.1 Kanban Endpoints (Backend)**
```
Create kanban board endpoints.
- GET /api/kanban/board (board state)
- POST /api/kanban/tasks/:id/move (move between columns)
- POST /api/kanban/tasks/:id/subtasks (add subtask)
- Support 5 columns: Backlog, Today, In Progress, Review, Completed
```

**9.2 Pomodoro Endpoints (Backend)**
```
Create pomodoro tracking.
- POST /api/pomodoro/sessions (start)
- POST /api/pomodoro/sessions/:id/complete (end)
- GET /api/pomodoro/stats (statistics)
- Track focus time and break time
```

**9.3 Frontend Kanban (Frontend)**
```
Create KanbanBoard.tsx.
- 5-column board layout
- Draggable task cards
- Drop zone highlighting
- TaskDetail panel
- Subtask list
- Priority color system
- Deadline badges
```

**9.4 Frontend Pomodoro (Frontend)**
```
Create PomodoroTimer.tsx.
- 25-min work / 5-min break cycle
- Circular progress indicator
- MM:SS time display
- Play/pause/skip buttons
- Session counter
- Audio alert on completion
- Statistics view
- Session history
```

---

### PHASE 10: Analytics (Weeks 12-13)

**10.1 Analytics Service (Backend)**
```
Create analyticsService.ts.
- aggregateMetrics() for all stats
- Calculate weeklyStudy
- Compute productivityTrend
- Generate insights
- Create time-based comparisons
```

**10.2 Analytics Endpoints (Backend)**
```
Create analytics endpoints.
- GET /api/analytics/dashboard (overview)
- GET /api/analytics/charts/:type (chart data)
- GET /api/analytics/heatmap/:type (heatmap data)
- Support period filtering
- Cache responses
```

**10.3 Frontend Analytics (Frontend)**
```
Create Analytics.tsx with charts.
- StudyChart (line chart with trend)
- ProductivityChart (area chart)
- LeetcodeChart (stacked bar)
- HabitChart (radar chart)
- TimeDistributionChart (pie)
- HeatmapView component
- InsightsSection with tips
- Period selector (week/month/year)
- Export to PDF/CSV
```

---

### PHASE 11: Admin Panel (Weeks 13-14)

**11.1 Admin Authentication (Backend)**
```
Create admin auth system.
- POST /api/admin/auth/login
- Support access code + email
- Optional 2FA (TOTP)
- Admin session tracking
- Rate limiting (5 attempts/15 min)
```

**11.2 User Management (Backend)**
```
Create admin user endpoints.
- GET /api/admin/users (list with filters)
- GET /api/admin/users/:id (details)
- PATCH /api/admin/users/:id (edit)
- POST /api/admin/users/:id/ban
- POST /api/admin/users/:id/unban
- DELETE /api/admin/users/:id
- POST /api/admin/users/:id/send-message
```

**11.3 Admin Dashboard (Backend)**
```
Create admin dashboard endpoints.
- GET /api/admin/dashboard/overview
- GET /api/admin/analytics/overview
- GET /api/admin/logs (audit logs)
- GET /api/admin/system/status
```

**11.4 Announcements (Backend)**
```
Create announcement management.
- POST /api/admin/announcements (create)
- GET /api/admin/announcements (list)
- PATCH /api/admin/announcements/:id (update)
- DELETE /api/admin/announcements/:id
- Support scheduling
```

**11.5 Frontend Admin Panel (Frontend)**
```
Create AdminPanel.tsx.
- AdminDashboard with metrics
- UserManagement page (data table)
- UserDetail sidebar
- AuditLogs viewer
- AnnouncementManager
- AdminSettings page
- RBAC implementation
- Confirmation dialogs
```

---

### PHASE 12: Polish & Deploy (Weeks 14-16)

**12.1 Backend Unit Tests**
```
Write unit tests for services.
- Test authService
- Test streakCalculation
- Test analytics calculations
- Target: 60% coverage
- Framework: Jest
```

**12.2 Backend Integration Tests**
```
Write integration tests.
- Test auth flow (register → verify → login)
- Test task CRUD
- Test recurring tasks
- Test admin operations
- Target: 50% coverage
- Framework: Jest + Supertest
```

**12.3 Frontend Unit Tests**
```
Write component and hook tests.
- Test components
- Test custom hooks
- Test utilities
- Target: 40% coverage
- Framework: Vitest + React Testing Library
```

**12.4 E2E Tests**
```
Write end-to-end tests.
- Test registration flow
- Test daily planner workflow
- Test habit tracking
- Test admin access
- Framework: Playwright
```

**12.5 Performance Optimization**
```
Optimize frontend and backend.
Frontend:
- Code splitting per route
- Image optimization
- Bundle <500KB gzipped
- Lighthouse >90

Backend:
- Query optimization
- Redis caching
- <200ms response time
- Support 1000 concurrent users
```

**12.6 Security Hardening**
```
Implement security measures.
- Input validation and sanitization
- XSS protection
- CSRF protection
- Rate limiting on all endpoints
- Enforce HTTPS
- Security headers
- Admin IP whitelisting
```

**12.7 Deployment Setup**
```
Set up CI/CD pipeline.
- GitHub Actions for testing
- Vercel for frontend
- Railway for backend
- MongoDB Atlas
- Environment variables
- Error tracking (Sentry)
- Monitoring (Datadog)
```

**12.8 Documentation**
```
Create comprehensive docs.
- Swagger/OpenAPI documentation
- User guide
- Developer setup guide
- API documentation
- Database schema docs
- Architecture decisions
- Troubleshooting guide
```

**12.9 Launch & Monitoring**
```
Deploy to production.
- Frontend to production
- Backend to production
- Set up monitoring
- Configure alerts
- Enable analytics
- Create runbook
- Prepare for scaling
```

---

## 🔄 Git Commit Templates by Phase

### Phase 1
```
feat(database): create mongodb mongoose models with typescript
feat(config): setup mongodb connection and database initialization
feat(server): initialize express app with security middleware
feat(middleware): implement jwt authentication and rbac
feat(utils): implement standardized error handling
```

### Phase 2
```
feat(auth): implement user registration with email verification
feat(auth): implement email verification endpoint
feat(auth): implement login endpoint with account security
feat(auth): implement token refresh mechanism
feat(auth): implement logout and token blacklisting
feat(auth): implement complete password reset flow
feat(frontend-auth): create registration and login pages
```

### Phase 3
```
feat(backend): implement user profile management endpoints
feat(backend): implement dashboard metrics calculation service
feat(backend): create dashboard overview endpoint
feat(frontend): create dashboard page with metric widgets
```

### Phase 4
```
feat(backend): implement task management endpoints with filtering
feat(backend): implement recurring task system
feat(backend): implement task reordering and movement
feat(frontend): implement daily planner with drag-drop tasks
feat(backend): implement task time tracking
```

### Phase 5
```
feat(backend): implement habit tracking endpoints
feat(backend): implement streak calculation engine
feat(backend): implement heatmap data generation
feat(frontend): create habit tracker with github-style heatmap
```

### Phase 6
```
feat(backend): implement leetcode problem tracking endpoints
feat(backend): implement daily goal tracking
feat(backend): implement leetcode analytics service
feat(backend): implement revision queue system
feat(frontend): create leetcode tracker with analytics
```

### Phase 7
```
feat(backend): implement subject tracking endpoints
feat(backend): implement spaced repetition revision scheduler
feat(frontend): create core subjects tracker with multiple views
```

### Phase 8
```
feat(backend): implement system design tracking endpoints
feat(frontend): create system design tracker with kanban view
```

### Phase 9
```
feat(backend): implement kanban board endpoints
feat(backend): implement pomodoro session tracking
feat(frontend): create kanban board with drag-drop support
feat(frontend): implement pomodoro timer with full functionality
```

### Phase 10
```
feat(backend): implement analytics aggregation service
feat(backend): implement analytics endpoints
feat(frontend): create analytics dashboard with recharts
```

### Phase 11
```
feat(backend): implement admin authentication system
feat(backend): implement admin user management endpoints
feat(backend): implement admin dashboard endpoints
feat(backend): implement announcement management
feat(frontend): create admin panel with full management features
```

### Phase 12
```
test(backend): add unit tests for services
test(backend): add integration tests for api endpoints
test(frontend): add unit tests for components and hooks
test(frontend): add e2e tests with playwright
perf: optimize frontend and backend performance
security: implement comprehensive security measures
ci/cd: setup deployment pipeline and monitoring
docs: create comprehensive project documentation
launch: deploy to production with monitoring
```

---

## 📁 File Structure Reference

```
trackforge/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── planner/
│   │   │   ├── habits/
│   │   │   ├── leetcode/
│   │   │   ├── subjects/
│   │   │   ├── systemDesign/
│   │   │   ├── kanban/
│   │   │   ├── pomodoro/
│   │   │   ├── analytics/
│   │   │   └── admin/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   ├── types/
│   │   ├── styles/
│   │   ├── utils/
│   │   └── tests/
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   └── app.ts
│   ├── tests/
│   └── tsconfig.json
│
└── docs/
    ├── specifications/
    ├── architecture/
    └── design/
```

---

## 🎨 Design Inspiration Files

Check these in `design/` folder for reference:
- Figma links to Linear.app, Vercel, GitHub
- Color schemes and typography
- Component library examples
- Animation references
- Mobile and desktop layouts

---

## ✅ Pre-Development Checklist

- [ ] Fork/clone repository
- [ ] Create `.env` and `.env.example` files
- [ ] Install Node.js 20 LTS
- [ ] Install MongoDB locally or create Atlas account
- [ ] Set up GitHub repository
- [ ] Configure Git commit template
- [ ] Install VS Code extensions (ESLint, Prettier, Thunder Client/Postman)
- [ ] Create development branch from main
- [ ] Set up local development environment
- [ ] Test database connection
- [ ] Run initial tests
- [ ] Create feature branches for each phase

---

## 🚀 Development Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/auth-registration
   ```

2. **Work on feature using prompts:**
   - Read prompt for the task
   - Write code following specifications
   - Write tests as you go
   - Commit frequently with proper messages

3. **Make commits:**
   ```bash
   git add .
   git commit -m "feat(auth): implement registration endpoint"
   ```

4. **Create Pull Request:**
   - Push to GitHub
   - Create PR with detailed description
   - Reference related issue if applicable
   - Wait for code review

5. **Merge to develop:**
   ```bash
   git checkout develop
   git pull origin develop
   git merge feature/auth-registration
   git push origin develop
   ```

---

## 📞 Support & References

- **Backend:** Express.js Docs, Mongoose Docs, Node.js Docs
- **Frontend:** React Docs, Tailwind CSS Docs, Framer Motion Docs
- **Database:** MongoDB Docs, Mongoose Query API
- **Testing:** Jest Docs, Playwright Docs, React Testing Library
- **Deployment:** Vercel Docs, Railway Docs, GitHub Actions

---

**Happy coding! 🎉 Follow each prompt carefully and commit regularly.**

