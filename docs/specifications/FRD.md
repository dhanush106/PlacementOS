# TrackForge - Functional Requirements Document (FRD)

**Version:** 1.0  
**Status:** Phase 1 - Foundation  
**Last Updated:** 2026-07-12  

---

## Document Structure

This FRD details all functional requirements organized by feature module, with specific behaviors, user interactions, and acceptance criteria.

---

## 1. AUTHENTICATION & USER MANAGEMENT

### 1.1 User Registration

**Requirement ID:** AUTH-1.1  
**Priority:** P0 (Critical)  
**User Story:** As a student, I want to create an account so I can start tracking my placement preparation.

**Functional Requirements:**

| Requirement | Details |
|-------------|---------|
| **Input Fields** | Email, Full Name, Password, Password Confirm, College, Target Role |
| **Validation** | Email format, password strength (min 8 chars, 1 uppercase, 1 number, 1 special char) |
| **Duplicate Check** | Prevent duplicate email registration |
| **Security** | Password hashing using bcrypt, rate limiting (5 attempts/min) |
| **Email Verification** | Send verification email with OTP (valid for 24 hours) |
| **Response** | JWT tokens (access + refresh), user profile object |
| **Error Handling** | Clear error messages for each validation failure |
| **UI Feedback** | Loading state, success toast, error alert |

**Acceptance Criteria:**
- ✓ User can register with valid credentials
- ✓ Duplicate email rejected
- ✓ Weak password rejected
- ✓ Verification email sent within 2 seconds
- ✓ OTP expires after 24 hours
- ✓ User cannot log in until verified

---

### 1.2 User Login

**Requirement ID:** AUTH-1.2  
**Priority:** P0 (Critical)

**Functional Requirements:**

| Requirement | Details |
|-------------|---------|
| **Input Fields** | Email, Password |
| **Authentication** | Compare hashed passwords using bcrypt |
| **Session Management** | Generate JWT access token (15 min expiry) and refresh token (7 days) |
| **Remember Me** | Optional: extend refresh token to 30 days |
| **Account Lock** | Lock account after 5 failed attempts for 15 minutes |
| **Response** | Tokens, user profile, onboarding status |
| **Redirect** | To dashboard if not onboarded, to onboarding flow if new user |
| **Error Handling** | Rate limiting, account lockout messages |

**Acceptance Criteria:**
- ✓ Valid credentials return tokens
- ✓ Invalid credentials show appropriate error
- ✓ Account locks after 5 failed attempts
- ✓ Access token refreshes automatically
- ✓ User stays logged in across sessions (with refresh token)

---

### 1.3 JWT Token Management

**Requirement ID:** AUTH-1.3  
**Priority:** P0 (Critical)

**Functional Requirements:**

| Requirement | Details |
|-------------|---------|
| **Access Token** | Payload: userId, email, role; Expiry: 15 minutes |
| **Refresh Token** | Payload: userId; Expiry: 7 days |
| **Token Refresh** | Endpoint to refresh access token using refresh token |
| **Token Blacklist** | Logout invalidates both tokens (add to blacklist) |
| **Signature** | HS256 algorithm with secure secret key |
| **CORS** | Include credentials in all requests |
| **Storage** | Access token in memory, Refresh token in httpOnly cookie |

**Acceptance Criteria:**
- ✓ Access token refreshes before expiry
- ✓ Expired tokens rejected
- ✓ Logout removes refresh token
- ✓ Token signature verified on each request

---

### 1.4 Password Reset

**Requirement ID:** AUTH-1.4  
**Priority:** P1 (High)

**Functional Requirements:**

| Requirement | Details |
|-------------|---------|
| **Request** | User enters email, receives password reset link |
| **Reset Link** | Valid for 1 hour, includes unique token |
| **Verification** | User opens link, verifies identity via OTP |
| **New Password** | Set new password with same validation rules as registration |
| **Confirmation** | Email sent confirming password change |
| **Security** | Rate limit to 3 resets per email per 24 hours |

**Acceptance Criteria:**
- ✓ Reset email sent within 2 seconds
- ✓ Link expires after 1 hour
- ✓ Invalid token rejected
- ✓ New password must differ from old password
- ✓ User can log in with new password

---

### 1.5 User Profile Management

**Requirement ID:** AUTH-1.5  
**Priority:** P1 (High)

**Functional Requirements:**

| Requirement | Details |
|-------------|---------|
| **Profile Fields** | Name, Email, College, Batch Year, Target Role, Target Package, Target Companies, Interview Date |
| **Avatar** | Upload profile picture (max 5MB, JPG/PNG) |
| **Edit Profile** | Change any field except email (requires re-verification) |
| **Preferences** | Dark mode, notification settings, export options |
| **Profile Privacy** | Public/Private visibility settings |
| **Account Deletion** | Option to permanently delete account (30-day grace period) |
| **Activity Log** | View login history and security events |

**Acceptance Criteria:**
- ✓ Profile fields update immediately
- ✓ Avatar uploads and displays correctly
- ✓ Email change requires verification
- ✓ Account deletion is reversible within 30 days

---

## 2. DASHBOARD

### 2.1 Dashboard Overview

**Requirement ID:** DASH-2.1  
**Priority:** P0 (Critical)

**Purpose:** Daily command center showing key metrics and quick actions.

**Layout:** 4-column responsive grid

**Functional Requirements:**

| Component | Details |
|-----------|---------|
| **Header Section** | Today's date, user greeting ("Good Morning, [Name]"), daily motivation quote |
| **Metrics Row 1** | Daily Progress %, Study Hours Today, Leetcode Problems Today |
| **Metrics Row 2** | Habit Completion %, Today's Priority Task, Pomodoro Sessions |
| **Weekly Heatmap** | 7-day heatmap showing activity (Contribution style) |
| **Quick Actions** | Buttons: Start Pomodoro, Add Task, Log Habit, Log Leetcode |
| **Recent Activity** | Last 5 completed items with timestamps |
| **Today's Focus** | Highest priority task card with edit/complete buttons |

---

### 2.2 Dashboard Metrics

**Requirement ID:** DASH-2.2  
**Priority:** P0 (Critical)

**Real-time Calculation:**

```
Daily Progress % = (Tasks Completed + Habits Completed + Leetcode Completed) / 
                   (Total Tasks + Total Habits + Leetcode Daily Goal) * 100
```

**Study Hours Today:**
- Sum of all Pomodoro sessions completed today
- 1 Pomodoro = 25 minutes
- Calculation: `Total Pomodoro Sessions * 25 / 60`

**Leetcode Problems Today:**
- Count of problems submitted today
- Include: solved, attempted, revision

**Habit Completion %:**
- `(Habits Completed Today / Total Habits Created) * 100`

**Update Trigger:** Real-time on every task/habit/problem completion

**Acceptance Criteria:**
- ✓ Metrics update within 1 second of action
- ✓ Calculations accurate
- ✓ No metric shows >100%
- ✓ Metrics accessible for navigation to detail pages

---

### 2.3 Daily Motivation Quote

**Requirement ID:** DASH-2.3  
**Priority:** P2 (Medium)

**Functional Requirements:**

| Requirement | Details |
|-------------|---------|
| **Quote Source** | Curated list of 500+ placement & motivation quotes |
| **Daily Rotation** | New quote every day (same for all users) |
| **Time-based Greeting** | Morning (5-12), Afternoon (12-17), Evening (17-21), Night (21-5) |
| **Personalization** | User can refresh to see new quote |
| **Animation** | Fade-in animation on page load |

**Quote Examples:**
- "Your consistency today is your competitive advantage tomorrow."
- "Every problem solved brings you closer to your dream role."
- "Progress is progress, no matter how small."

---

### 2.4 Dashboard Interactivity

**Requirement ID:** DASH-2.4  
**Priority:** P1 (High)

**Card Click Actions:**

| Card | Action |
|------|--------|
| **Daily Progress** | Navigate to today's tasks with time breakdown |
| **Study Hours** | Show Pomodoro summary for today |
| **Leetcode Problems** | Show problems completed today |
| **Habit Completion** | Show which habits completed/missed |
| **Weekly Heatmap** | Expand to month view or show daily details |
| **Priority Task** | Open task detail modal for editing |

**Acceptance Criteria:**
- ✓ All cards clickable and respond within 200ms
- ✓ Proper navigation to detailed views
- ✓ Back button returns to dashboard

---

## 3. DAILY PLANNER

### 3.1 Task Management

**Requirement ID:** PLAN-3.1  
**Priority:** P0 (Critical)

**Functional Requirements:**

| Requirement | Details |
|-------------|---------|
| **Task Structure** | Title, Description, Time Slot (Morning/Afternoon/Evening/Night), Priority (H/M/L) |
| **Time Tracking** | Estimated Time, Actual Time, Status (Not Started/In Progress/Completed) |
| **Metadata** | Deadline, Tags, Subtasks, Assigned Pomodoro Sessions |
| **Checklist** | Subtasks with completion tracking |
| **Progress** | Completion % based on subtasks |
| **Status Colors** | Green (Completed), Yellow (In Progress), Gray (Not Started), Red (Overdue) |

**Persistence:**
- Save to database on create/update
- Real-time sync across tabs
- Optimistic UI updates

**Acceptance Criteria:**
- ✓ Task created with all fields
- ✓ Tasks persist across sessions
- ✓ Completion % accurate
- ✓ Deadline shows warning if overdue

---

### 3.2 Priority System

**Requirement ID:** PLAN-3.2  
**Priority:** P1 (High)

**Priority Levels:**

| Level | Color | Weight | Definition |
|-------|-------|--------|-----------|
| **High** | Red | 3 | Critical for placement, interview prep, deadlines <7 days |
| **Medium** | Yellow | 2 | Important, interview prep, general study |
| **Low** | Gray | 1 | Nice-to-do, optional learning |

**Features:**
- Color-coded cards
- Visual priority indicator (⬤⬤ for High, ⬤ for Medium, ○ for Low)
- Filter by priority
- Sort tasks by priority (High → Low)
- Smart ranking: (Priority Weight × Due Soon Factor) / Time Estimate

**Acceptance Criteria:**
- ✓ Priority visually distinct
- ✓ Tasks automatically sorted by smart ranking
- ✓ Priority changeable via drag-and-drop or edit

---

### 3.3 Drag and Drop

**Requirement ID:** PLAN-3.3  
**Priority:** P1 (High)

**Using:** dnd-kit library

**Drag Functionality:**

| Capability | Details |
|-----------|---------|
| **Reorder within section** | Move tasks up/down in same time slot |
| **Move between sections** | Move task from Morning to Afternoon, etc. |
| **Timeline view** | Drag task to calendar day |
| **Kanban view** | Drag to different columns (Backlog → Today, etc.) |
| **Visual feedback** | Hover highlighting, drag preview, drop zone highlight |
| **Accessibility** | Keyboard support (Tab, Arrow keys) |

**Constraints:**
- Cannot drag completed tasks
- Cannot move past deadline date

**Acceptance Criteria:**
- ✓ Smooth drag animation
- ✓ Drop zones clearly indicated
- ✓ Changes persist immediately
- ✓ Works on mobile (touch support)

---

### 3.4 Recurring Tasks

**Requirement ID:** PLAN-3.4  
**Priority:** P1 (High)

**Functional Requirements:**

| Requirement | Details |
|-------------|---------|
| **Pattern** | Daily, Weekdays, Weekends, Weekly, Bi-weekly, Monthly |
| **Recurrence Rules** | End date, max occurrences, skip rules |
| **Instance Creation** | Auto-create instances on their scheduled day |
| **Modification** | Edit this instance or all future instances |
| **Completion Tracking** | Track individual instance completions |
| **Editing** | Change time slot, priority, estimated time |

**Example:**
```
Task: "Leetcode Daily"
Pattern: Daily
Time: Morning
Estimated: 90 minutes
```

**Acceptance Criteria:**
- ✓ Instances auto-created at start of day
- ✓ Can modify single or recurring
- ✓ Completion doesn't break recurrence
- ✓ Can end recurring task anytime

---

### 3.5 Time Tracking

**Requirement ID:** PLAN-3.5  
**Priority:** P1 (High)

**Functional Requirements:**

| Requirement | Details |
|-------------|---------|
| **Estimated Time** | User enters in minutes |
| **Actual Time** | Tracked via Pomodoro or manual entry |
| **Comparison** | Display Est. vs Actual side-by-side |
| **Variance** | Calculate time variance (% over/under estimate) |
| **Accuracy Insights** | Show user's estimation accuracy over time |
| **Alerts** | Warn if task running 30% over estimate |

**Calculations:**
```
Variance % = ((Actual - Estimated) / Estimated) * 100
```

**Acceptance Criteria:**
- ✓ Time tracked accurately
- ✓ Variance calculated correctly
- ✓ Historical accuracy data stored

---

### 3.6 Task Notifications

**Requirement ID:** PLAN-3.6  
**Priority:** P2 (Medium)

**Notification Types:**

| Trigger | Notification |
|---------|--------------|
| **Task Deadline 1 hour before** | "Your [Task] is due in 1 hour" |
| **Overdue Task** | "[Task] is now overdue" |
| **Daily Briefing (9 AM)** | "You have [n] tasks today" |
| **Evening Summary (9 PM)** | "[n] tasks completed, [n] pending" |

**User Controls:**
- Enable/disable per notification type
- Quiet hours (e.g., no notifications 9 PM - 7 AM)
- Desktop, email, or both
- SMS for urgent (premium feature)

**Acceptance Criteria:**
- ✓ Notifications sent on schedule
- ✓ User can customize timing
- ✓ Notifications actionable (direct link to task)

---

## 4. HABIT TRACKER

### 4.1 Habit Management

**Requirement ID:** HABIT-4.1  
**Priority:** P0 (Critical)

**Predefined Habits:**
- Gym (physical fitness)
- Meditation (mental health)
- Walking (exercise)
- Water (hydration)
- Reading (knowledge)
- Sleep (8+ hours)
- Wake up (morning routine)
- Coding (skill)

**Functional Requirements:**

| Requirement | Details |
|-------------|---------|
| **Habit Creation** | Name, Category, Goal (times/day or yes/no), Reminders, Color |
| **Daily Completion** | Checkbox for each day, timestamp of completion |
| **Streak Calculation** | Current streak, longest streak, broken streaks |
| **Consistency %** | `(Days Completed Last 30 Days / 30) * 100` |
| **Custom Habits** | Create unlimited custom habits with custom colors |
| **Habit Icons** | Lucide React icons, user can choose |
| **Habit Goals** | Specify numerical goals (e.g., "Gym 4x per week") |

**Acceptance Criteria:**
- ✓ Habit can be marked complete/incomplete daily
- ✓ Streaks calculate correctly
- ✓ Custom habits work same as predefined
- ✓ Habits deleted after confirmation

---

### 4.2 Habit Heatmap

**Requirement ID:** HABIT-4.2  
**Priority:** P0 (Critical)

**Design:** GitHub contribution style heatmap

**Features:**

| Feature | Details |
|---------|---------|
| **Grid Layout** | 52 weeks × 7 days (year view) |
| **Color Intensity** | Light gray (no activity) → Dark green (completed) |
| **Hover Details** | Show date, completion status, streak info |
| **Monthly View** | Clickable to zoom to specific month |
| **Legend** | Explain color meaning |
| **Animations** | Hover highlight, fade-in on load |

**Interaction:**
- Click day to mark complete/incomplete (if editing mode on)
- Hover shows tooltip with details
- Export as image

**Acceptance Criteria:**
- ✓ Heatmap visually accurate
- ✓ Accurate color intensity mapping
- ✓ Performance: <100ms render for full year
- ✓ Mobile: responsive grid layout

---

### 4.3 Streak System

**Requirement ID:** HABIT-4.3  
**Priority:** P1 (High)

**Streak Rules:**

```
Current Streak:
- Increments when habit completed today
- Breaks if not completed by midnight
- Allows 1 day grace period (optional "freeze" feature)
- Shows 🔥 emoji for motivation

Longest Streak:
- Historical record of longest unbroken streak
- Never resets
- Used for motivation

Consistency %:
- (Days Completed Last 30 Days / 30) * 100
- Shows trend: up/down/stable
```

**Features:**
- Streak counter on habit card
- Motivational notification on milestone streaks (7, 14, 30, 100)
- Freeze feature (once per month) to preserve streak
- Comparison: user's best streak vs average

**Acceptance Criteria:**
- ✓ Streak increments on daily completion
- ✓ Streak breaks on missed day
- ✓ Freeze prevents break (once/month)
- ✓ Milestones celebrated

---

### 4.4 Habit Analytics

**Requirement ID:** HABIT-4.4  
**Priority:** P2 (Medium)

**Analytics Dashboard:**

| Metric | Calculation |
|--------|-----------|
| **Completion Rate** | (Completions / Expected Days) * 100 |
| **Average Streak** | Sum of all streaks / Number of streaks |
| **Best Habit** | Highest consistency % |
| **Most Skipped** | Lowest consistency % |
| **Weekly Completion** | Stacked bar chart |
| **Trends** | 4-week and 12-week trends |

**Visualizations:**
- Line chart: consistency over time
- Bar chart: weekly completion
- Radar chart: all habits at once
- Pie chart: time split between habits

**Acceptance Criteria:**
- ✓ Analytics calculate correctly
- ✓ Charts render smoothly
- ✓ Data exports to CSV

---

## 5. LEETCODE TRACKER

### 5.1 Problem Logging

**Requirement ID:** LEET-5.1  
**Priority:** P0 (Critical)

**Problem Entry Fields:**

| Field | Type | Required | Details |
|-------|------|----------|---------|
| **Title** | String | Yes | Problem title from LeetCode |
| **Problem Number** | Integer | No | LeetCode problem ID |
| **Difficulty** | Enum | Yes | Easy, Medium, Hard |
| **Topic** | String | Yes | Array, String, DP, Graph, etc. |
| **Submission Date** | Date | Auto | Today's date |
| **Submission Time** | Time | Auto | Completion time |
| **Estimated Time** | Integer | No | Minutes estimated |
| **Actual Time** | Integer | Auto | Time from start to completion |
| **Pomodoro Sessions** | Integer | Auto | Number of 25-min sessions used |
| **Status** | Enum | Yes | Solved, Attempted, Revision |
| **Notes** | Text | No | Solution approach, key insights, mistakes |
| **Direct Link** | URL | No | Link to problem |
| **Favorite** | Boolean | No | Mark for revision/interview prep |

**Validation:**
- Title not empty
- Difficulty must be valid
- Problem must not be duplicate (same title + today's date)
- Actual time <= 4 hours

**Acceptance Criteria:**
- ✓ Problem logged successfully
- ✓ Data persists correctly
- ✓ Time calculations accurate
- ✓ Automatic daily goal tracking

---

### 5.2 Daily Goal System

**Requirement ID:** LEET-5.2  
**Priority:** P1 (High)

**Functional Requirements:**

| Requirement | Details |
|-------------|---------|
| **Default Goal** | 10 problems per day |
| **Customizable** | User can set 5-20 problems |
| **Difficulty Target** | E:M:H ratio (e.g., 30:40:30) |
| **Tracking** | Display goal progress vs actual |
| **Daily Reset** | Counter resets at midnight |
| **Motivational UI** | Progress bar with celebration at 100% |
| **Historical** | Track goal completion rate per day |
| **Analytics** | Show "Best Day" (most problems solved) |

**Goal UI:**
```
Today's Leetcode Goal
[████████░░] 8/10 problems
Easy: 3/3 | Medium: 4/4 | Hard: 1/3
```

**Acceptance Criteria:**
- ✓ Daily goal tracked accurately
- ✓ Difficulty distribution shown
- ✓ Goal resets daily at midnight
- ✓ User can adjust goal settings

---

### 5.3 Difficulty Distribution

**Requirement ID:** LEET-5.3  
**Priority:** P1 (High)

**Tracking:**

| Metric | Calculation |
|--------|-----------|
| **Easy Solved** | Count of problems with difficulty=Easy, status=Solved |
| **Medium Solved** | Count of problems with difficulty=Medium, status=Solved |
| **Hard Solved** | Count of problems with difficulty=Hard, status=Solved |
| **Total Solved** | Sum of Easy + Medium + Hard |
| **Distribution %** | (Category / Total) * 100 |
| **Daily Distribution** | Breaking down by day of week |

**Visualization:**
- Donut chart: current distribution
- Stacked bar: weekly trend
- Target indicator: vs recommended ratio
- Progress: what % toward goal for each difficulty

**Acceptance Criteria:**
- ✓ Distribution accurate
- ✓ Charts update in real-time
- ✓ Target ratio customizable

---

### 5.4 Problem Status Tracking

**Requirement ID:** LEET-5.4  
**Priority:** P1 (High)

**Status Types:**

| Status | Definition | Tracking |
|--------|-----------|----------|
| **Solved** | Accepted solution on first submission | Date, time |
| **Attempted** | Tried but not yet solved | Retry count |
| **Revision** | Need to revisit and master | Review count, confidence |

**Features:**
- Filter by status
- Revision queue (problems marked for revision)
- Revision history: show attempts and dates
- Confidence level (1-5 stars)
- Time to solve vs average for problem

**Acceptance Criteria:**
- ✓ Status changes reflected immediately
- ✓ Revision queue accurately populated
- ✓ Confidence tracking optional

---

### 5.5 LeetCode API Sync (Future)

**Requirement ID:** LEET-5.5  
**Priority:** P2 (Medium) for MVP

**Architecture (for future Leetcode API integration):**

```
Manual Entry → Clean Abstraction Layer → (Future) API Sync
   ↓
   Database (source of truth)
   ↓
   Dashboard (always synced)
```

**Future Implementation:**
- Check official LeetCode GraphQL API availability
- If unavailable: design browser extension layer
- If available: implement OAuth flow
- Sync trigger: on-demand + daily cron

**Current MVP:**
- Users manually log problems
- Clean data model ready for future sync
- No tight coupling to any specific API

---

### 5.6 Leetcode Analytics

**Requirement ID:** LEET-5.6  
**Priority:** P1 (High)

**Metrics:**

| Metric | Details |
|--------|---------|
| **Total Solved** | Count of solved problems all-time |
| **Weekly Goal Completion** | % of weekly goals met |
| **Acceptance Rate** | (Solved / (Solved + Attempted)) * 100 |
| **Average Time per Problem** | (Total Time / Count) in minutes |
| **Fastest Problem** | Solved in least time |
| **Slowest Problem** | Solved in most time |
| **Most Attempted Topic** | Topic with most problems |
| **Strongest Topic** | Highest accuracy in topic |
| **Current Streak** | Consecutive days with ≥1 problem |
| **Submission Calendar** | GitHub-style contribution calendar |

**Charts:**
- Line chart: problems/week over time
- Stacked bar: Easy/Medium/Hard per week
- Heatmap: submission calendar
- Radar chart: topic coverage
- Pie chart: difficulty distribution

**Acceptance Criteria:**
- ✓ All metrics calculate accurately
- ✓ Charts render with proper scaling
- ✓ Performance: <200ms to load analytics

---

## 6. KANBAN BOARD

### 6.1 Board Structure

**Requirement ID:** KANBAN-6.1  
**Priority:** P1 (High)

**Columns:**

| Column | Definition | Auto-populated | Color |
|--------|-----------|-----------------|-------|
| **Backlog** | Future tasks, ideas | No | Gray |
| **Today** | Tasks scheduled for today | Partially (from Daily Planner) | Blue |
| **In Progress** | Currently being worked on | Manual drag | Yellow |
| **Review** | Waiting for review/feedback | Manual drag | Purple |
| **Completed** | Finished tasks | Auto (on completion) | Green |

**Features:**
- Drag-and-drop between columns
- Nested tasks (subtasks)
- Priority tags
- Deadline indicators
- Search across all tasks
- Filters: by priority, deadline, assigned pomodoro

**Acceptance Criteria:**
- ✓ Tasks drag smoothly between columns
- ✓ Column state persists
- ✓ Auto-completed tasks move to Completed column

---

### 6.2 Task Cards

**Requirement ID:** KANBAN-6.2  
**Priority:** P1 (High)

**Card Display:**

```
┌─────────────────────────────┐
│ 🔴 Leetcode Daily           │
│                             │
│ Complete 10 problems        │
│                             │
│ ⏱ 2h 30m | 📌 High | ...    │
│                             │
│ [████████░░] 8/10           │
└─────────────────────────────┘
```

**Card Elements:**
- Title
- Description
- Estimated time (if set)
- Priority indicator (color + icon)
- Deadline badge (if set)
- Tags/labels
- Subtask progress bar
- Assignee (future: team feature)

**Card Interactions:**
- Click to open detail modal
- Drag to move to another column
- Right-click for context menu (delete, duplicate, assign)
- Hover shows full description

**Acceptance Criteria:**
- ✓ All information visible at glance
- ✓ Card responsive to various content lengths
- ✓ Animations smooth on hover/drag

---

### 6.3 Nested Tasks/Subtasks

**Requirement ID:** KANBAN-6.3  
**Priority:** P1 (High)

**Features:**

| Feature | Details |
|---------|---------|
| **Add Subtask** | Within task detail modal |
| **Subtask Tracking** | Individual completion checkbox |
| **Progress Calculation** | (Completed Subtasks / Total) * 100 |
| **Expand/Collapse** | Show/hide subtasks in card view |
| **Subtask Move** | Move subtask between parent tasks |
| **Recursive Depth** | Allow up to 2 levels (subtask of subtask) |

**UI:**
```
Main Task
├─ Subtask 1 [✓]
├─ Subtask 2 [ ]
└─ Subtask 3 [✓]
```

**Acceptance Criteria:**
- ✓ Subtasks created and tracked
- ✓ Progress calculated correctly
- ✓ Expand/collapse works smoothly
- ✓ Nested structure persists

---

## 7. POMODORO SYSTEM

### 7.1 Pomodoro Timer

**Requirement ID:** POMO-7.1  
**Priority:** P1 (High)

**Timer Configuration:**

| Setting | Default | Range |
|---------|---------|-------|
| **Work Session** | 25 min | 5-60 min |
| **Short Break** | 5 min | 2-15 min |
| **Long Break** | 15 min | 5-30 min |
| **Sessions Before Long Break** | 4 | 1-8 |

**Functional Requirements:**

| Requirement | Details |
|-------------|---------|
| **Timer Display** | MM:SS format, large readable |
| **Progress Ring** | Circular progress indicator |
| **Sound Alert** | Beep when time expires (can disable) |
| **Browser Notification** | Desktop notification on session end |
| **Pause/Resume** | Pause timer, resume from same point |
| **Skip** | Skip current session (confirmed) |
| **Custom Duration** | Set any duration for current session |

**Session Flow:**
```
Work (25m) → Short Break (5m) → Work (25m) → ... 
           → Long Break (15m) after 4 sessions
```

**Acceptance Criteria:**
- ✓ Timer counts down accurately
- ✓ Alerts trigger on time
- ✓ Pause/resume works correctly
- ✓ Session count increments

---

### 7.2 Pomodoro Tracking

**Requirement ID:** POMO-7.2  
**Priority:** P1 (High)

**Tracking Data:**

| Data Point | Details |
|-----------|---------|
| **Session Count** | Number of Pomodoro sessions today |
| **Focus Time** | Total minutes in work sessions today |
| **Break Time** | Total minutes in breaks today |
| **Estimated vs Actual** | Pomodoro sessions estimated vs actual for task |
| **Module Breakdown** | Which module each Pomodoro was for |

**Calculations:**
```
Daily Focus Time = Session Count * 25 minutes
(assuming standard 25-min sessions)
```

**Features:**
- Link Pomodoro to task/habit/Leetcode problem
- Auto-log Pomodoro on completion
- Manual session entry (for retrospective logging)
- Pomodoro history with timestamps

**Acceptance Criteria:**
- ✓ Sessions tracked accurately
- ✓ Time calculations correct
- ✓ Can assign to task or log standalone
- ✓ Historical data accessible

---

### 7.3 Pomodoro Statistics

**Requirement ID:** POMO-7.3  
**Priority:** P2 (Medium)

**Statistics:**

| Metric | Calculation |
|--------|-----------|
| **Daily Focus Time** | Session Count * Session Duration |
| **Weekly Focus Time** | Sum of daily across last 7 days |
| **Monthly Focus Time** | Sum of daily across last 30 days |
| **Most Productive Day** | Day with most focus time |
| **Average Sessions/Day** | Total sessions / Days tracked |
| **Completion Rate** | (Completed Sessions / Started Sessions) * 100 |

**Visualizations:**
- Line chart: focus time trend over month
- Bar chart: sessions per day
- Gauge chart: daily vs weekly goals
- Pie chart: time spent per module

**Acceptance Criteria:**
- ✓ Statistics calculate correctly
- ✓ Charts scale properly
- ✓ Data exports to CSV

---

## 8. CORE SUBJECT TRACKER

### 8.1 Subject Structure

**Requirement ID:** SUBJ-8.1  
**Priority:** P1 (High)

**Predefined Subjects:**
1. DBMS (Database Management Systems)
2. Operating Systems
3. Computer Networks
4. Computer Organization & Architecture

**Per Subject Data:**

| Field | Type | Details |
|-------|------|---------|
| **Name** | String | Subject name |
| **Topics** | Array | List of topics in subject |
| **Progress %** | Auto | % of topics completed |
| **Study Hours** | Integer | Total hours spent |
| **Expected Completion** | Date | Target date to finish |
| **Revision Count** | Integer | How many times revised |
| **Confidence** | 1-5 | User's confidence (1=weak, 5=expert) |
| **Notes** | Text | Key learning points, resources |

**Acceptance Criteria:**
- ✓ All 4 subjects loaded on first view
- ✓ Progress calculated as % topics completed
- ✓ Subjects editable

---

### 8.2 Topic Management

**Requirement ID:** SUBJ-8.2  
**Priority:** P1 (High)

**Topic Fields:**

| Field | Type | Details |
|-------|------|---------|
| **Title** | String | Topic name |
| **Subtopics** | Array | Nested breakdown |
| **Status** | Enum | Not Started, Learning, Revising, Confident |
| **Progress %** | Integer | Based on subtopics completed |
| **Study Hours** | Integer | Time spent on this topic |
| **Difficulty** | 1-5 | Perceived difficulty |
| **Confidence** | 1-5 | User's confidence |
| **Revision Count** | Integer | Times revisited |
| **Expected Completion** | Date | Target date |
| **Resources** | Array | Links to videos, notes, books |
| **Notes** | Text | Learning notes |

**Subtopic Fields:**
- Title
- Completed (checkbox)
- Study hours
- Confidence level

**Acceptance Criteria:**
- ✓ Topics created and tracked
- ✓ Subtopics managed within topics
- ✓ Progress hierarchy works (topic % based on subtopics)

---

### 8.3 Topic Views

**Requirement ID:** SUBJ-8.3  
**Priority:** P1 (High)

**View Types:**

| View | Purpose | Features |
|------|---------|----------|
| **List View** | Comprehensive topic list | Inline editing, status badges, progress bars |
| **Checklist View** | Mark topics complete | Simple checkboxes, strikethrough completed |
| **Timeline View** | Visual progress tracking | Gantt-style chart showing expected vs actual completion |
| **Card View** | Visual topic overview | Cards with progress ring, difficulty, confidence |

**Features:**
- Filter by status (Not Started, Learning, Revising, Confident)
- Sort by: name, progress, difficulty, confidence
- Search topics and subtopics
- Bulk update status for multiple topics

**Acceptance Criteria:**
- ✓ All views render correctly
- ✓ Filters and sorts work
- ✓ Smooth transitions between views

---

### 8.4 Revision Planner

**Requirement ID:** SUBJ-8.4  
**Priority:** P2 (Medium)

**Features:**

| Feature | Details |
|---------|---------|
| **Revision Schedule** | Algorithm-based optimal revision timing |
| **Spaced Repetition** | First review: 1 day, second: 3 days, third: 7 days, fourth: 14 days |
| **Due Revisions** | Show topics due for revision |
| **Revision Logging** | Mark topic as revised with timestamp |
| **Revision Tracker** | Display revision count per topic |
| **Next Review Date** | Calculated and shown on topic card |

**Acceptance Criteria:**
- ✓ Revision schedule generated
- ✓ Revision dates calculated correctly
- ✓ Can complete revision and see next date

---

## 9. SYSTEM DESIGN TRACKER

### 9.1 System Design Roadmap

**Requirement ID:** SYSDES-9.1  
**Priority:** P1 (High)

**Topic Structure:**

| Field | Type | Details |
|-------|------|---------|
| **Title** | String | System design topic (e.g., "Design URL Shortener") |
| **Status** | Enum | Not Started, Learning, Revising, Confident, Mastered |
| **Priority** | Enum | High, Medium, Low |
| **Notes** | Text | Key design decisions, trade-offs |
| **Resources** | Array | Links to articles, videos, case studies |
| **Time Spent** | Integer | Hours spent on this topic |
| **Pomodoro Count** | Integer | Pomodoro sessions used |
| **Completion %** | Integer | Overall progress (0-100) |
| **Added Date** | Date | When topic was added |
| **Target Completion** | Date | When user wants to master it |

**Acceptance Criteria:**
- ✓ Topics created with all fields
- ✓ Status represents learning stage
- ✓ Time tracking accurate

---

### 9.2 System Design Views

**Requirement ID:** SYSDES-9.2  
**Priority:** P1 (High)

**View Types:**

| View | Layout | Features |
|------|--------|----------|
| **Kanban View** | 4 columns: Not Started → Learning → Revising → Confident | Drag-drop between columns, priority tags |
| **Timeline View** | Gantt chart | Target completion dates, progress tracking |
| **List View** | Table format | Sort by status, priority, date |
| **Card View** | Tile layout | Status badge, progress ring, quick edit |

**Features:**
- Filter by status, priority
- Sort by: added date, target completion, priority
- Search topics
- Bulk operations (change status, priority)

**Acceptance Criteria:**
- ✓ All views responsive
- ✓ Drag-drop works smoothly (Kanban)
- ✓ Filters/sorts functional

---

### 9.3 Learning Path Integration

**Requirement ID:** SYSDES-9.3  
**Priority:** P2 (Medium)

**Features:**

| Feature | Details |
|---------|---------|
| **Prerequisite Topics** | Topics that should be learned first |
| **Suggested Order** | Algorithm to suggest learning order |
| **Dependency Chain** | Visualize topic dependencies |
| **Learning Path** | Curated path (e.g., "Beginner → Intermediate → Advanced") |

**Example Path:**
```
Beginner
├─ System Design Basics
├─ Scalability Basics
└─ Distributed Systems 101

Intermediate
├─ Database Design
├─ Caching Strategies
└─ Load Balancing
```

**Acceptance Criteria:**
- ✓ Paths customizable
- ✓ Dependency visualization clear
- ✓ Can follow suggested path

---

## 10. ANALYTICS DASHBOARD

### 10.1 Analytics Overview

**Requirement ID:** ANALYTICS-10.1  
**Priority:** P1 (High)

**Key Sections:**

| Section | Metrics | Visualization |
|---------|---------|----------------|
| **Study Overview** | Weekly/Monthly hours, daily average | Line chart, area chart |
| **Productivity** | Daily completion %, task completion trend | Area chart with target line |
| **Leetcode** | Problems/week, difficulty split, consistency | Stacked bar, heatmap |
| **Habits** | Consistency %, best/worst habits, streaks | Radar chart, table |
| **Time Distribution** | Hours by module (Tasks, Leetcode, Subjects, Pomodoro) | Pie chart, stacked bar |
| **Weekly Comparison** | This week vs last week vs best week | Bar chart with comparisons |

**Update Frequency:** Real-time as data is logged

**Acceptance Criteria:**
- ✓ All metrics calculate accurately
- ✓ Charts render with proper scaling and legends
- ✓ Performance: <300ms to load analytics page

---

### 10.2 Charts & Visualizations

**Requirement ID:** ANALYTICS-10.2  
**Priority:** P1 (High)

**Chart Types:**

| Chart Type | Use Cases | Library |
|-----------|----------|---------|
| **Line Chart** | Study hours trend, problem-solving trend | Recharts |
| **Area Chart** | Cumulative hours, completion tracking | Recharts |
| **Bar Chart** | Daily metrics, weekly comparison | Recharts |
| **Stacked Bar** | Difficulty breakdown, time by module | Recharts |
| **Pie Chart** | Distribution (time, difficulty) | Recharts |
| **Radar Chart** | Multi-dimensional (all habits, subjects) | Recharts |
| **Heatmap** | Calendar visualization (Leetcode, habits) | Custom + react-calendar-heatmap |

**Features:**
- Interactive tooltips
- Click legend to toggle data series
- Zoom/pan on large datasets
- Download chart as PNG
- Dark mode styling

**Acceptance Criteria:**
- ✓ Charts render smoothly
- ✓ Responsive to different screen sizes
- ✓ Tooltips accurate

---

### 10.3 Calendar Views

**Requirement ID:** ANALYTICS-10.3  
**Priority:** P1 (High)

**Calendar Types:**

| Calendar | Purpose | Data |
|----------|---------|------|
| **Submission Calendar** | Leetcode activity | # problems submitted per day |
| **Habit Calendar** | Habit completion | % completion per day |
| **Study Hours Calendar** | Study activity | Hours logged per day |
| **Streak Calendar** | Visual streaks | Consecutive days indicator |

**Features:**
- Day cell color intensity: more activity = darker
- Hover shows details (date, count, metrics)
- Click to filter related data
- Zoom: week → month → year
- Compare years (current vs previous)

**Acceptance Criteria:**
- ✓ Calendar renders accurately
- ✓ Color mapping correct
- ✓ Hover details helpful

---

### 10.4 Insights & Recommendations

**Requirement ID:** ANALYTICS-10.4  
**Priority:** P2 (Medium)

**Insight Types:**

| Insight | Logic |
|---------|-------|
| **Best Day** | Day of week with highest activity |
| **Most Productive Time** | Time slot (Morning/Afternoon/Evening) with best focus |
| **Weak Spots** | Topic/habit with lowest completion % |
| **Momentum** | Trend analysis: improving vs declining |
| **Burnout Risk** | If usage drops >30% vs average |

**Notifications:**
- "You're on 🔥! Longest streak is 14 days"
- "Your best day is Friday, aim for that consistency"
- "Try starting sessions earlier (more productive in mornings)"

**Acceptance Criteria:**
- ✓ Insights calculated correctly
- ✓ Relevant and actionable
- ✓ User can dismiss/snooze insights

---

## 11. SETTINGS & PREFERENCES

### 11.1 Theme & Appearance

**Requirement ID:** SETTINGS-11.1  
**Priority:** P1 (High)

**Theme Options:**

| Option | Details |
|--------|---------|
| **Dark Mode** | Default, eye-friendly |
| **Light Mode** | Alternative |
| **Auto** | Follow system preferences |
| **Accent Color** | Primary color chooser |
| **Font Size** | Small, Normal, Large |

**Persistence:**
- Save to localStorage (immediate)
- Save to database (on next sync)
- Sync across devices

**Acceptance Criteria:**
- ✓ Theme applies to entire app
- ✓ Persists across sessions
- ✓ Smooth transition animation

---

### 11.2 Goal Settings

**Requirement ID:** SETTINGS-11.2  
**Priority:** P1 (High)

**Goal Parameters:**

| Goal | Default | Range | Notes |
|------|---------|-------|-------|
| **Daily Study Goal** | 6 hours | 1-12 hours | Target study hours/day |
| **Weekly Study Goal** | 40 hours | 5-80 hours | Target study hours/week |
| **Daily Leetcode Goal** | 10 problems | 1-30 problems | Target problems/day |
| **Weekly Leetcode Goal** | 50 problems | 5-150 problems | Target problems/week |
| **Habit Goal** | 80% consistency | 0-100% | Target habit completion % |

**Integration:**
- Goals used for dashboard progress calculation
- Alerts if significantly behind
- Analytics shows goal vs actual

**Acceptance Criteria:**
- ✓ Goals editable
- ✓ Goals persisted
- ✓ Integration with dashboard

---

### 11.3 Placement Profile

**Requirement ID:** SETTINGS-11.3  
**Priority:** P1 (High)

**Profile Fields:**

| Field | Type | Purpose |
|-------|------|---------|
| **Target Role** | String | e.g., "Senior SDE", "Product Manager" |
| **Target Package** | String | e.g., "₹50 LPA+" |
| **Target Companies** | Array | Companies aiming for |
| **Preferred Interview Date** | Date | When ready for interviews |
| **Graduation Date** | Date | Batch year |
| **Interview Topics** | Array | Areas focusing on (DSA, System Design, etc.) |

**Features:**
- Used for personalization
- Recommendations based on profile
- Visible on dashboard greeting
- Shareable as profile link (future)

**Acceptance Criteria:**
- ✓ Fields editable
- ✓ Data saved
- ✓ Used for personalization

---

### 11.4 Notification Preferences

**Requirement ID:** SETTINGS-11.4  
**Priority:** P1 (High)

**Notification Settings:**

| Notification | Channel | Time | Toggle |
|--------------|---------|------|--------|
| **Task Reminder** | Desktop, Email | 1 hour before | Yes |
| **Daily Briefing** | Desktop, Email | 9:00 AM | Yes |
| **Evening Summary** | Desktop, Email | 9:00 PM | Yes |
| **Habit Reminder** | Desktop, Email | 7:00 PM | Yes |
| **Streak Milestone** | Desktop, Email | Immediate | Yes |
| **Weekly Report** | Email | Sunday 6:00 PM | Yes |

**Additional Options:**
- Quiet hours (e.g., 9 PM - 7 AM)
- Time zone
- Email frequency (Never, Daily, Weekly)
- Desktop notification permissions

**Acceptance Criteria:**
- ✓ Notifications respect preferences
- ✓ Quiet hours applied
- ✓ User can opt-out of any notification

---

### 11.5 Data Management

**Requirement ID:** SETTINGS-11.5  
**Priority:** P1 (High)

**Options:**

| Option | Details |
|--------|---------|
| **Export Data** | Download all user data as JSON |
| **Export Analytics** | Download charts and metrics as CSV/PDF |
| **Clear Data** | Delete all tasks/logs (with confirmation) |
| **Delete Account** | Permanent account deletion (30-day grace period) |
| **Backup Status** | Show last backup time, option to backup now |

**Features:**
- Confirmation dialogs for destructive actions
- Download progress indicator
- Email sent with backup link
- 30-day recovery window before permanent deletion

**Acceptance Criteria:**
- ✓ Export creates valid JSON/CSV files
- ✓ Delete requires multiple confirmations
- ✓ Recovery window honored

---

## 12. CROSS-CUTTING CONCERNS

### 12.1 Real-time Updates

**Requirement ID:** XC-12.1  
**Priority:** P1 (High)

**Implementation:**
- WebSocket connection for real-time data sync (future)
- Poll-based updates for MVP (30-second intervals)
- Optimistic UI updates (update locally, sync with server)
- Conflict resolution (server takes precedence)

**Update Triggers:**
- Task completion → Dashboard updates
- Habit logged → Heatmap updates
- Leetcode problem added → Analytics refresh
- Pomodoro session → Focus time updates

**Acceptance Criteria:**
- ✓ Dashboard updates within 2 seconds of action
- ✓ No stale data on page
- ✓ Smooth transitions (no flashing)

---

### 12.2 Loading States & Skeletons

**Requirement ID:** XC-12.2  
**Priority:** P1 (High)

**Skeleton Screens:**
- Dashboard: show placeholder cards while loading
- Analytics: show chart placeholders
- Task list: show task card placeholders

**Loading Indicators:**
- Spinner for quick loads (<1s)
- Skeleton for longer loads (1-3s)
- Fallback message if >5s

**Acceptance Criteria:**
- ✓ Skeleton screens match final layout
- ✓ Smooth transition from skeleton to content
- ✓ Never show skeleton + spinner together

---

### 12.3 Empty States

**Requirement ID:** XC-12.3  
**Priority:** P1 (High)

**Empty State Scenarios:**

| Scenario | Display | CTA |
|----------|---------|-----|
| **No Tasks** | Illustration + "No tasks yet" | "Create your first task" |
| **No Habits** | Illustration + "Get started with habits" | "Add a habit" |
| **No Leetcode** | Illustration + "Start coding!" | "Log your first problem" |
| **No Analytics Data** | "Data will appear as you track" | "Go complete a task" |

**Design:**
- Friendly illustration
- Encouraging message
- Clear CTA button
- Secondary action: "Learn more"

**Acceptance Criteria:**
- ✓ Empty states display for each module
- ✓ CTAs navigate correctly
- ✓ Professional, motivating tone

---

### 12.4 Error Handling

**Requirement ID:** XC-12.4  
**Priority:** P1 (High)

**Error Types:**

| Error | User Message | Action |
|-------|--------------|--------|
| **Network Error** | "Unable to reach server. Check connection." | Retry button |
| **Validation Error** | "[Field] is required" or specific error | Highlight field |
| **Permission Error** | "You don't have access to this" | Redirect home |
| **Server Error** | "Something went wrong. Try again later." | Retry, contact support |

**Toast Notifications:**
- Duration: 3-5 seconds
- Position: Top-right
- Color: Red for error, Green for success, Yellow for warning
- Close button

**Acceptance Criteria:**
- ✓ All errors caught and displayed
- ✓ Error messages helpful and actionable
- ✓ Retry functionality works

---

### 12.5 Performance & Accessibility

**Requirement ID:** XC-12.5  
**Priority:** P1 (High)

**Performance:**
- Lighthouse score: >90
- Page load: <2 seconds
- Time to interactive: <3 seconds
- Images optimized, lazy-loaded

**Accessibility (WCAG 2.1 AA):**
- Keyboard navigation (Tab, Enter, Arrow keys)
- Screen reader support (ARIA labels)
- Color contrast ≥4.5:1
- Focus indicators visible
- Alt text on images

**Mobile Responsiveness:**
- Works on screens 320px and up
- Touch-friendly buttons (min 44x44px)
- Readable font size (≥16px)
- Proper viewport meta tag

**Acceptance Criteria:**
- ✓ Lighthouse score ≥90
- ✓ Keyboard fully navigable
- ✓ Mobile responsive (tested on 3+ devices)
- ✓ No accessibility violations

---

## 12. ADMIN PANEL (NEW)

### 12.1 Admin Authentication

**Requirement ID:** ADMIN-12.1  
**Priority:** P0 (Critical)

**Admin Access:**

| Aspect | Details |
|--------|---------|
| **Login Method** | Unique admin access code (6-8 alphanumeric characters) + Optional Email |
| **Access Code** | System-generated, can be rotated by super-admin |
| **Session Duration** | 4 hours (expiry warning at 3.5 hours) |
| **Re-authentication** | Required for sensitive operations (user deletion, data export) |
| **Session Limit** | Maximum 3 concurrent admin sessions |
| **IP Whitelist** | Optional: restrict admin access to specific IPs |
| **Two-Factor Auth** | Optional: add TOTP/SMS for additional security |
| **Audit Trail** | Every admin login/logout tracked |

**Login Form:**
```
┌─────────────────────────────┐
│   TrackForge Admin Portal    │
│                             │
│ Access Code: [_________]    │
│ Email (optional): [_____]   │
│                             │
│         [    Login    ]      │
└─────────────────────────────┘
```

**Acceptance Criteria:**
- ✓ Admin can log in with valid access code
- ✓ Session expires after 4 hours
- ✓ Invalid code resets session counter
- ✓ Login audit trail recorded
- ✓ Rate limiting: max 5 failed attempts per 15 minutes

---

### 12.2 Admin Dashboard

**Requirement ID:** ADMIN-12.2  
**Priority:** P1 (High)

**Dashboard Overview:**

| Widget | Data Shown |
|--------|-----------|
| **User Statistics** | Total users, active users (today), active users (this week), new users (today) |
| **System Health** | Server status, database size, response time, error rate |
| **Platform Metrics** | Total tasks created, total habits tracked, total Leetcode problems, average study time |
| **Recent Activities** | User registrations, profile updates, data exports (last 10) |
| **Alerts & Issues** | System errors, suspicious activities, failed payments (if monetized) |
| **Quick Actions** | Search user, broadcast announcement, system maintenance toggle |

**Analytics on Dashboard:**
- Line chart: user growth over time
- Line chart: daily active users
- Pie chart: user by placement stage
- Bar chart: features used most

**Acceptance Criteria:**
- ✓ Dashboard loads within 3 seconds
- ✓ All metrics update in real-time or near real-time
- ✓ Alerts prominently displayed

---

### 12.3 User Management

**Requirement ID:** ADMIN-12.3  
**Priority:** P0 (Critical)

**User List View:**

| Column | Searchable | Sortable | Details |
|--------|-----------|----------|---------|
| **User ID** | Yes | Yes | Unique identifier |
| **Email** | Yes | Yes | User email |
| **Name** | Yes | Yes | Full name |
| **College** | Yes | Yes | Institution |
| **Batch Year** | No | Yes | Graduation year |
| **Created Date** | No | Yes | Registration date |
| **Last Login** | No | Yes | Last activity timestamp |
| **Status** | Yes | Yes | Active, Inactive, Banned |
| **Verification** | No | Yes | Email verified status |
| **Role** | No | Yes | User/Admin (future team feature) |

**User List Features:**
- Pagination: 25/50/100 users per page
- Search: by email, name, college
- Filter: by status, batch year, created date range
- Bulk actions: Ban/Unban users, Export data, Send message
- Sort: ascending/descending by any column
- Export: as CSV with all fields

**Acceptance Criteria:**
- ✓ User list loads and filters quickly (<500ms)
- ✓ Search returns results in <1 second
- ✓ Can sort by all sortable columns
- ✓ Bulk operations work correctly

---

### 12.4 User Details View

**Requirement ID:** ADMIN-12.4  
**Priority:** P0 (Critical)

**User Profile Page:**

| Section | Data |
|---------|------|
| **Basic Info** | Email, Name, College, Batch Year, Target Role, Target Package, Created Date, Last Login, Status |
| **Profile** | Avatar, Bio, Target Companies, Interview Date, Phone (if provided), Location |
| **Account Status** | Verified (Yes/No), Email verified (Yes/No), Banned (Yes/No), Ban reason (if banned) |
| **Preferences** | Theme, Notification settings, Privacy settings |

**User Activity:**

| Activity | Details |
|----------|---------|
| **Tasks** | Total created, completed, completion %, this month |
| **Habits** | Total habits, current streaks, consistency % |
| **Leetcode** | Total problems, solved, attempted, best difficulty |
| **Study Hours** | Total, this week, daily average |
| **Pomodoro** | Total sessions, total focus time, this week |

**Actions Available:**

| Action | Confirmation | Details |
|--------|--------------|---------|
| **Edit User Info** | No | Change email, name, preferences |
| **Ban User** | Yes | Disable account, reason required |
| **Unban User** | No | Restore access |
| **Reset Password** | No | Send password reset link via email |
| **Verify Email** | No | Manually mark as verified |
| **View Activity Log** | No | See all user actions |
| **Export User Data** | Yes | Download all user data as JSON |
| **Delete Account** | Yes (double confirm) | Soft delete (30-day grace) |
| **Send Message** | No | Send in-app notification |
| **Clear User Data** | Yes | Delete all tasks, habits, etc. (keep profile) |

**Acceptance Criteria:**
- ✓ All user details load correctly
- ✓ Activity metrics calculate accurately
- ✓ Admin actions log correctly
- ✓ Destructive actions require confirmation

---

### 12.5 System Logging & Audit Trail

**Requirement ID:** ADMIN-12.5  
**Priority:** P1 (High)

**Audit Log Events:**

| Event Type | Details Logged |
|-----------|--------|
| **User Registration** | Email, name, college, IP address, timestamp |
| **User Login** | Email, IP address, device, timestamp |
| **Admin Login** | Admin ID, IP, access code (hashed), timestamp |
| **User Data Change** | Admin ID, field changed, old value, new value, timestamp |
| **User Ban/Unban** | Admin ID, reason, timestamp |
| **Data Export** | User ID, admin ID, data type, timestamp |
| **Password Reset** | Email, admin ID (if manual), timestamp |
| **Account Deletion** | User ID, admin ID (if by admin), timestamp |
| **Email Verification** | User ID, method (manual/automatic), timestamp |
| **Error Events** | Error type, error message, user ID (if applicable), timestamp |

**Audit Trail Viewer:**

| Column | Details |
|--------|---------|
| **Timestamp** | Exact time of event |
| **Event Type** | Type of action |
| **User ID** | Affected user (if applicable) |
| **Admin ID** | Admin who performed action (if applicable) |
| **IP Address** | Source IP |
| **Details** | What changed and how |
| **Status** | Success/Failure |

**Features:**
- Filter by: event type, user, admin, date range, status
- Search in details field
- Export audit log as CSV
- Real-time log viewer (last 100 events)
- Pagination for large logs
- Retention: keep logs for 1 year minimum

**Acceptance Criteria:**
- ✓ All events logged automatically
- ✓ Logs not deletable (immutable)
- ✓ Audit trail searchable and filterable
- ✓ Performance: log query <1 second

---

### 12.6 System Analytics

**Requirement ID:** ADMIN-12.6  
**Priority:** P2 (Medium)

**Analytics Sections:**

| Analytics | Metrics |
|----------|---------|
| **User Growth** | Daily registrations, weekly active users, monthly active users, churn rate |
| **Engagement** | Daily active users, avg session duration, feature usage breakdown |
| **Content** | Avg tasks per user, avg habits per user, avg Leetcode problems |
| **Performance** | API response times, error rate, uptime %, slow endpoints |
| **Time-based** | Peak usage hours, most active days, least active times |

**Reports Available:**
- Daily summary report
- Weekly performance report
- Monthly business report
- Custom date range report
- Email scheduled reports (daily/weekly)

**Visualizations:**
- Line charts: user growth, engagement trends
- Bar charts: feature usage, daily metrics
- Pie charts: user distribution by college, batch year
- Heatmap: usage by hour and day of week
- Gauge: system health, uptime

**Acceptance Criteria:**
- ✓ All analytics accurate
- ✓ Charts load within 2 seconds
- ✓ Reports exportable as PDF/CSV
- ✓ Scheduled reports sent on time

---

### 12.7 Content & Notifications Management

**Requirement ID:** ADMIN-12.7  
**Priority:** P2 (Medium)

**Broadcast Announcements:**

| Feature | Details |
|---------|---------|
| **Create Announcement** | Title, message, type (info/warning/success/error), target audience |
| **Audience Targeting** | All users, specific batch year, specific college |
| **Schedule** | Send immediately or schedule for later |
| **Channels** | In-app, email, push notification (optional) |
| **Tracking** | View count, click-through rate, engagement |
| **Archive** | Keep history of sent announcements |

**Motivation Quotes Management:**
- Add new quotes
- Edit existing quotes
- Delete quotes
- Mark as seasonal/featured
- View quotes used (with date)

**System Messages:**
- Maintenance window notifications
- Feature launch announcements
- Bug fix alerts
- Server status updates

**Acceptance Criteria:**
- ✓ Announcements reach users in real-time
- ✓ Scheduling works accurately
- ✓ Engagement metrics tracked
- ✓ Can target specific user groups

---

### 12.8 User Support & Moderation

**Requirement ID:** ADMIN-12.8  
**Priority:** P2 (Medium)

**Support Features:**

| Feature | Details |
|---------|---------|
| **Tickets** | View, manage, and respond to support tickets |
| **Status** | Open, In Progress, Resolved, Closed |
| **Priority** | Low, Medium, High, Urgent |
| **Categories** | Bug report, Feature request, Account issue, Other |

**User Ban Management:**

| Aspect | Details |
|--------|---------|
| **Ban User** | Reason required, can set duration (permanent or temporary) |
| **Ban Reason** | Spam, Abuse, Terms violation, Account compromise, Other |
| **Temporary Ban** | Automatically lifts after specified days |
| **Ban Appeals** | Users can submit appeal (reviewed by admin) |
| **Ban List** | View all banned users with reasons and dates |

**Activity Monitoring:**
- Detect unusual login patterns (multiple IPs, rapid logins)
- Alert on suspicious data exports (bulk downloads)
- Flag accounts with excessive errors
- Monitor for spam behavior

**Acceptance Criteria:**
- ✓ Bans applied immediately
- ✓ Appeals tracked and reviewable
- ✓ Suspicious activities flagged
- ✓ Support tickets properly organized

---

### 12.9 Database Management

**Requirement ID:** ADMIN-12.9  
**Priority:** P1 (High)

**Database Operations:**

| Operation | Details |
|----------|---------|
| **Backup Management** | View backup history, trigger manual backup, restore from backup |
| **Data Export** | Export all data by module (users, tasks, analytics) as JSON/CSV |
| **Data Import** | Import data for testing/migration |
| **Database Cleanup** | Remove soft-deleted accounts (after 30 days), archive old logs |
| **Index Management** | View indexes, reindex collections (MongoDB) |
| **Disk Usage** | Monitor database size, storage trends |

**Backup Strategy:**
- Automatic daily backups
- Retention: keep 30 daily backups, 12 weekly, 3 monthly
- One-click restore to backup point
- Backup verification (test restore)

**Acceptance Criteria:**
- ✓ Backups run automatically
- ✓ Can restore from any backup
- ✓ Database size tracked
- ✓ Cleanup runs automatically

---

### 12.10 Settings & Configuration

**Requirement ID:** ADMIN-12.10  
**Priority:** P2 (Medium)

**System Settings:**

| Setting | Type | Options |
|---------|------|---------|
| **Maintenance Mode** | Toggle | On/Off (when on, show message to users) |
| **New Registrations** | Toggle | Allow/Block |
| **Email Verification Required** | Toggle | Yes/No |
| **Admin Access Codes** | Manage | Generate new code, rotate code, revoke old codes |
| **Rate Limiting** | Configure | Requests per minute (API) |
| **Session Timeout** | Number | Minutes before logout |
| **Max Concurrent Sessions** | Number | Per user |
| **Error Reporting** | Toggle | Enable/Disable error tracking |
| **Analytics Collection** | Toggle | Enable/Disable |

**Feature Flags (A/B Testing):**
- Enable/disable features for specific users
- Enable/disable by percentage (e.g., 20% of users)
- Enable/disable by cohort (batch year, college)
- Track feature usage

**Acceptance Criteria:**
- ✓ Settings apply immediately
- ✓ Changes logged in audit trail
- ✓ Can revert settings to previous state

---

### 12.11 Admin User Management (Multi-Admin)

**Requirement ID:** ADMIN-12.11  
**Priority:** P2 (Medium)

**Admin Roles:**

| Role | Permissions |
|------|-----------|
| **Super Admin** | All permissions, can manage other admins |
| **Admin** | User management, content, support, analytics (no admin management) |
| **Moderator** | Ban/unban users, handle support, view analytics |
| **Analyst** | View-only access to analytics and logs |

**Permissions:**

| Permission | Super | Admin | Mod | Analyst |
|-----------|-------|-------|-----|---------|
| Create/Edit Admin | ✓ | ✗ | ✗ | ✗ |
| Delete User | ✓ | ✓ | ✗ | ✗ |
| Ban User | ✓ | ✓ | ✓ | ✗ |
| View Logs | ✓ | ✓ | ✓ | ✓ |
| Manage Content | ✓ | ✓ | ✗ | ✗ |
| Edit Settings | ✓ | ✗ | ✗ | ✗ |
| Export Data | ✓ | ✓ | ✗ | ✓ |
| Handle Support | ✓ | ✓ | ✓ | ✗ |

**Admin Management:**
- View all admins
- Create new admin (generate code)
- Revoke admin access
- View admin activity log
- Reset admin password

**Acceptance Criteria:**
- ✓ Permissions enforced correctly
- ✓ Role-based access control (RBAC) working
- ✓ Admin audit trail complete

---

### 12.12 Admin Security

**Requirement ID:** ADMIN-12.12  
**Priority:** P1 (High)

**Security Measures:**

| Measure | Details |
|---------|---------|
| **Password Policy** | Min 12 characters, 1 uppercase, 1 number, 1 special char |
| **Session Timeout** | 4 hours inactivity, with 30 min warning |
| **IP Whitelist** | Optional restrict to specific IPs |
| **Two-Factor Auth** | TOTP (Google Authenticator) or SMS |
| **Audit Trail** | All admin actions logged, tamper-proof |
| **Rate Limiting** | Prevent brute force on login (max 5 attempts/15 min) |
| **Encryption** | All sensitive data encrypted at rest |
| **HTTPS Only** | No HTTP access to admin panel |
| **CORS** | Strict origin checking |
| **API Keys** | If programmatic access needed, secure API keys |

**Alerts:**
- Alert on failed login attempts
- Alert on sensitive operations (user delete, data export)
- Alert on unusual access patterns
- Alert on data export requests

**Acceptance Criteria:**
- ✓ Admin panel HTTPS-only
- ✓ All actions logged
- ✓ Brute force prevented
- ✓ Sessions expire correctly

---

### 12.13 Admin API Endpoints

**Requirement ID:** ADMIN-12.13  
**Priority:** P1 (High)

**All admin APIs require:**
- Valid admin JWT token
- Admin role verification
- Request logging

**Endpoints:**

```
Authentication
  POST   /api/admin/auth/login
  POST   /api/admin/auth/logout
  POST   /api/admin/auth/refresh
  POST   /api/admin/auth/2fa/verify

User Management
  GET    /api/admin/users
  GET    /api/admin/users/:id
  PUT    /api/admin/users/:id
  DELETE /api/admin/users/:id
  POST   /api/admin/users/:id/ban
  POST   /api/admin/users/:id/unban
  GET    /api/admin/users/:id/activity
  POST   /api/admin/users/:id/send-message
  POST   /api/admin/users/:id/export-data

Analytics
  GET    /api/admin/analytics/overview
  GET    /api/admin/analytics/users
  GET    /api/admin/analytics/engagement
  GET    /api/admin/analytics/performance
  GET    /api/admin/analytics/features

Audit & Logging
  GET    /api/admin/logs
  GET    /api/admin/logs/filter
  GET    /api/admin/logs/:id

Content Management
  GET    /api/admin/announcements
  POST   /api/admin/announcements
  PUT    /api/admin/announcements/:id
  DELETE /api/admin/announcements/:id
  GET    /api/admin/quotes
  POST   /api/admin/quotes
  PUT    /api/admin/quotes/:id
  DELETE /api/admin/quotes/:id

System Management
  GET    /api/admin/system/status
  GET    /api/admin/system/settings
  PUT    /api/admin/system/settings
  POST   /api/admin/system/backup
  POST   /api/admin/system/maintenance
  GET    /api/admin/system/database-stats

Admin Management (Super Admin only)
  GET    /api/admin/admins
  POST   /api/admin/admins
  PUT    /api/admin/admins/:id
  DELETE /api/admin/admins/:id
  POST   /api/admin/admins/:id/rotate-code
```

**Acceptance Criteria:**
- ✓ All endpoints require authentication
- ✓ All endpoints return appropriate status codes
- ✓ All operations logged

---

## Summary

This FRD provides comprehensive functional specifications for every module of TrackForge, including a complete Admin Panel. Each requirement is:
- ✓ Detailed and specific
- ✓ Measurable (acceptance criteria)
- ✓ Prioritized (P0-P2)
- ✓ Ready for development

**Next Step:** API routes and endpoint specification document.

