# TrackForge - API Routes & Endpoints Specification

**Version:** 1.0  
**Status:** Phase 1 - Foundation  
**Last Updated:** 2026-07-12  

---

## Overview

This document specifies all REST API endpoints for TrackForge backend. The API follows RESTful conventions with JWT-based authentication.

**Base URL:** `https://api.trackforge.com/api`  
**API Version:** v1  
**Authentication:** Bearer token (JWT)  
**Response Format:** JSON  
**Rate Limiting:** 1000 requests per hour per user

---

## General Response Format

### Success Response (2xx)
```json
{
  "status": "success",
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

### Error Response (4xx, 5xx)
```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { /* additional error details */ }
  }
}
```

### Pagination
```json
{
  "status": "success",
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 250,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 1. AUTHENTICATION ENDPOINTS

### 1.1 User Registration
```
POST /auth/register
Content-Type: application/json

Request Body:
{
  "email": "student@example.com",
  "name": "John Doe",
  "password": "SecurePass123!",
  "college": "IIT Delhi",
  "targetRole": "Senior SDE"
}

Response (201 Created):
{
  "status": "success",
  "data": {
    "userId": "user_123abc",
    "email": "student@example.com",
    "name": "John Doe",
    "verificationEmailSent": true,
    "verificationExpiresIn": "24h"
  },
  "message": "Registration successful. Check email for verification."
}

Error (409 Conflict - Email exists):
{
  "status": "error",
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "Email already registered"
  }
}

Error (400 Bad Request - Validation):
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "password": "Password must contain uppercase letter, number, and special character"
    }
  }
}
```

---

### 1.2 Email Verification
```
POST /auth/verify-email
Content-Type: application/json

Request Body:
{
  "email": "student@example.com",
  "otp": "123456"
}

Response (200 OK):
{
  "status": "success",
  "data": {
    "userId": "user_123abc",
    "email": "student@example.com",
    "verified": true
  },
  "message": "Email verified successfully"
}

Error (400 Bad Request - Invalid OTP):
{
  "status": "error",
  "error": {
    "code": "INVALID_OTP",
    "message": "OTP is invalid or expired"
  }
}
```

---

### 1.3 User Login
```
POST /auth/login
Content-Type: application/json

Request Body:
{
  "email": "student@example.com",
  "password": "SecurePass123!",
  "rememberMe": false
}

Response (200 OK):
{
  "status": "success",
  "data": {
    "userId": "user_123abc",
    "email": "student@example.com",
    "name": "John Doe",
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900,
    "userRole": "user",
    "profileComplete": true
  },
  "message": "Login successful"
}

Error (401 Unauthorized - Invalid credentials):
{
  "status": "error",
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}

Error (423 Locked - Account locked):
{
  "status": "error",
  "error": {
    "code": "ACCOUNT_LOCKED",
    "message": "Account locked due to multiple failed login attempts. Try again in 15 minutes."
  }
}
```

---

### 1.4 Token Refresh
```
POST /auth/refresh
Authorization: Bearer {refreshToken}

Response (200 OK):
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGc...",
    "expiresIn": 900
  },
  "message": "Token refreshed"
}

Error (401 Unauthorized):
{
  "status": "error",
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Refresh token is invalid or expired"
  }
}
```

---

### 1.5 User Logout
```
POST /auth/logout
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "refreshToken": "eyJhbGc..."
}

Response (200 OK):
{
  "status": "success",
  "data": null,
  "message": "Logout successful"
}
```

---

### 1.6 Password Reset Request
```
POST /auth/password-reset
Content-Type: application/json

Request Body:
{
  "email": "student@example.com"
}

Response (200 OK):
{
  "status": "success",
  "data": null,
  "message": "Password reset link sent to email"
}
```

---

### 1.7 Password Reset Verify
```
POST /auth/password-reset/verify
Content-Type: application/json

Request Body:
{
  "token": "reset_token_123",
  "otp": "123456"
}

Response (200 OK):
{
  "status": "success",
  "data": {
    "resetToken": "verified_token_123"
  },
  "message": "Identity verified"
}
```

---

### 1.8 Password Reset Complete
```
POST /auth/password-reset/complete
Content-Type: application/json

Request Body:
{
  "resetToken": "verified_token_123",
  "newPassword": "NewSecurePass456!"
}

Response (200 OK):
{
  "status": "success",
  "data": null,
  "message": "Password reset successful. Please log in with new password."
}
```

---

## 2. USER PROFILE ENDPOINTS

### 2.1 Get User Profile
```
GET /users/profile
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "status": "success",
  "data": {
    "userId": "user_123abc",
    "email": "student@example.com",
    "name": "John Doe",
    "college": "IIT Delhi",
    "batchYear": 2024,
    "targetRole": "Senior SDE",
    "targetPackage": "₹50 LPA",
    "targetCompanies": ["Google", "Microsoft"],
    "preferredInterviewDate": "2024-07-15",
    "avatar": "https://cdn.trackforge.com/avatars/user_123abc.jpg",
    "bio": "Passionate about problem solving",
    "phone": "+91-9876543210",
    "location": "Delhi, India",
    "interviewTopics": ["DSA", "System Design"],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-06-20T15:45:00Z"
  }
}
```

---

### 2.2 Update User Profile
```
PATCH /users/profile
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "name": "John Doe",
  "targetRole": "Staff SDE",
  "targetPackage": "₹80 LPA",
  "bio": "Updated bio",
  "location": "Bangalore, India"
}

Response (200 OK):
{
  "status": "success",
  "data": { /* updated profile */ },
  "message": "Profile updated successfully"
}
```

---

### 2.3 Upload Avatar
```
POST /users/avatar
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

Form Data:
- file: [binary image file, max 5MB, jpg/png]

Response (200 OK):
{
  "status": "success",
  "data": {
    "avatarUrl": "https://cdn.trackforge.com/avatars/user_123abc.jpg",
    "uploadedAt": "2024-06-20T15:45:00Z"
  },
  "message": "Avatar uploaded successfully"
}
```

---

### 2.4 Change Email
```
POST /users/change-email
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "newEmail": "newemail@example.com",
  "password": "SecurePass123!"
}

Response (200 OK):
{
  "status": "success",
  "data": null,
  "message": "Verification email sent to new email address"
}
```

---

### 2.5 Verify New Email
```
POST /users/verify-email-change
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "otp": "123456"
}

Response (200 OK):
{
  "status": "success",
  "data": {
    "email": "newemail@example.com"
  },
  "message": "Email changed successfully"
}
```

---

### 2.6 Delete Account (Soft Delete)
```
DELETE /users/account
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "password": "SecurePass123!",
  "reason": "Personal reasons"
}

Response (200 OK):
{
  "status": "success",
  "data": {
    "deletionScheduledFor": "2024-07-20T15:45:00Z",
    "gracePeriodDays": 30
  },
  "message": "Account will be deleted in 30 days. You can recover it anytime."
}
```

---

### 2.7 Cancel Account Deletion
```
POST /users/account/cancel-deletion
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "status": "success",
  "data": null,
  "message": "Account deletion cancelled"
}
```

---

## 3. DASHBOARD ENDPOINTS

### 3.1 Get Dashboard Overview
```
GET /dashboard/overview
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "status": "success",
  "data": {
    "dailyProgress": 75,
    "studyHoursToday": 4.5,
    "leetcodeProblemsToday": 5,
    "habitCompletionPercentage": 80,
    "todaysPriorityTask": {
      "id": "task_123",
      "title": "LeetCode Daily",
      "priority": "High",
      "deadline": "2024-06-20T23:59:59Z",
      "status": "In Progress"
    },
    "pomodoroSessionsToday": 9,
    "dailyMotivationQuote": "Your consistency today is your competitive advantage tomorrow.",
    "weeklyHeatmap": [
      { "date": "2024-06-14", "value": 45 },
      { "date": "2024-06-15", "value": 62 },
      /* ... 5 more days ... */
    ],
    "recentActivity": [
      {
        "type": "task_completed",
        "description": "Completed 'System Design Interview'",
        "timestamp": "2024-06-20T14:30:00Z"
      },
      /* ... 4 more activities ... */
    ]
  }
}
```

---

## 4. DAILY PLANNER ENDPOINTS

### 4.1 Get Today's Tasks
```
GET /planner/tasks?date=2024-06-20&timeSlot=all
Authorization: Bearer {accessToken}

Query Parameters:
- date: YYYY-MM-DD (optional, default today)
- timeSlot: morning|afternoon|evening|night|all (optional)
- status: not_started|in_progress|completed|all (optional)
- priority: high|medium|low|all (optional)

Response (200 OK):
{
  "status": "success",
  "data": {
    "morning": [
      {
        "id": "task_123",
        "title": "LeetCode Daily",
        "description": "Complete 10 problems",
        "timeSlot": "morning",
        "priority": "High",
        "status": "In Progress",
        "estimatedTime": 90,
        "actualTime": 45,
        "deadline": "2024-06-20T23:59:59Z",
        "subtasks": [
          { "id": "subtask_1", "title": "Easy problems", "completed": true },
          { "id": "subtask_2", "title": "Medium problems", "completed": false }
        ],
        "completionPercentage": 50,
        "pomodoroSessions": 3,
        "tags": ["DSA", "Daily"],
        "createdAt": "2024-06-20T08:00:00Z",
        "updatedAt": "2024-06-20T10:30:00Z"
      },
      /* ... more tasks ... */
    ],
    "afternoon": [ /* ... */ ],
    "evening": [ /* ... */ ],
    "night": [ /* ... */ ]
  }
}
```

---

### 4.2 Create Task
```
POST /planner/tasks
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "title": "LeetCode Daily",
  "description": "Complete 10 problems - Mix of Easy, Medium, Hard",
  "timeSlot": "morning",
  "priority": "High",
  "estimatedTime": 90,
  "deadline": "2024-06-20T23:59:59Z",
  "recurring": {
    "pattern": "daily",
    "endDate": "2024-12-31"
  },
  "tags": ["DSA", "Daily"],
  "pomodoroSessions": 3
}

Response (201 Created):
{
  "status": "success",
  "data": {
    "id": "task_123",
    /* ... task data ... */
  },
  "message": "Task created successfully"
}
```

---

### 4.3 Update Task
```
PATCH /planner/tasks/:id
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "status": "In Progress",
  "actualTime": 45
}

Response (200 OK):
{
  "status": "success",
  "data": { /* updated task */ },
  "message": "Task updated successfully"
}
```

---

### 4.4 Complete Task
```
POST /planner/tasks/:id/complete
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "actualTime": 90,
  "notes": "Completed 12 problems instead of 10"
}

Response (200 OK):
{
  "status": "success",
  "data": { /* completed task */ },
  "message": "Task marked as completed"
}
```

---

### 4.5 Delete Task
```
DELETE /planner/tasks/:id
Authorization: Bearer {accessToken}

Query Parameters:
- deleteAllRecurring: true|false (if recurring task)

Response (200 OK):
{
  "status": "success",
  "data": null,
  "message": "Task deleted successfully"
}
```

---

### 4.6 Reorder Tasks (Drag & Drop)
```
POST /planner/tasks/reorder
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "taskId": "task_123",
  "newPosition": 2,
  "newTimeSlot": "afternoon"
}

Response (200 OK):
{
  "status": "success",
  "data": { /* reordered tasks list */ },
  "message": "Task reordered successfully"
}
```

---

## 5. HABIT TRACKER ENDPOINTS

### 5.1 Get All Habits
```
GET /habits?period=month
Authorization: Bearer {accessToken}

Query Parameters:
- period: day|week|month|year (optional, default month)

Response (200 OK):
{
  "status": "success",
  "data": [
    {
      "id": "habit_123",
      "name": "Gym",
      "category": "fitness",
      "color": "#FF6B6B",
      "icon": "dumbbell",
      "goal": 1,
      "goalType": "times_per_day",
      "currentStreak": 14,
      "longestStreak": 45,
      "consistency": 85,
      "completedToday": true,
      "completedThisWeek": 6,
      "completedThisMonth": 25,
      "heatmap": [ /* 30 days of data */ ],
      "createdAt": "2024-01-15T10:30:00Z"
    },
    /* ... more habits ... */
  ]
}
```

---

### 5.2 Create Habit
```
POST /habits
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "name": "Meditation",
  "category": "wellness",
  "color": "#4ECDC4",
  "icon": "heart",
  "goal": 1,
  "goalType": "times_per_day",
  "reminder": {
    "time": "07:00",
    "enabled": true
  }
}

Response (201 Created):
{
  "status": "success",
  "data": { /* created habit */ },
  "message": "Habit created successfully"
}
```

---

### 5.3 Log Habit Completion
```
POST /habits/:id/complete
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "date": "2024-06-20",
  "count": 1,
  "notes": "Completed 30 minutes meditation"
}

Response (200 OK):
{
  "status": "success",
  "data": {
    "habit": { /* updated habit */ },
    "completion": {
      "date": "2024-06-20",
      "count": 1,
      "streak": 15
    }
  },
  "message": "Habit logged successfully"
}
```

---

### 5.4 Get Habit Heatmap
```
GET /habits/:id/heatmap?year=2024
Authorization: Bearer {accessToken}

Query Parameters:
- year: YYYY (optional, default current year)

Response (200 OK):
{
  "status": "success",
  "data": {
    "habitId": "habit_123",
    "habitName": "Gym",
    "year": 2024,
    "heatmap": [
      { "date": "2024-01-01", "value": 0 },
      { "date": "2024-01-02", "value": 1 },
      /* ... full year data ... */
    ],
    "stats": {
      "totalDays": 365,
      "completedDays": 240,
      "streak": 14,
      "longestStreak": 45,
      "consistency": 65.75
    }
  }
}
```

---

### 5.5 Delete Habit
```
DELETE /habits/:id
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "status": "success",
  "data": null,
  "message": "Habit deleted successfully"
}
```

---

### 5.6 Get Habit Analytics
```
GET /habits/analytics/summary
Authorization: Bearer {accessToken}

Query Parameters:
- period: week|month|all (optional, default month)

Response (200 OK):
{
  "status": "success",
  "data": {
    "totalHabits": 8,
    "completedToday": 6,
    "averageStreak": 18,
    "bestHabit": {
      "name": "Gym",
      "consistency": 92
    },
    "worstHabit": {
      "name": "Reading",
      "consistency": 45
    },
    "weeklyBreakdown": [
      { "day": "Monday", "completed": 7 },
      /* ... rest of week ... */
    ]
  }
}
```

---

## 6. LEETCODE TRACKER ENDPOINTS

### 6.1 Get All Leetcode Problems
```
GET /leetcode/problems?status=all&difficulty=all&topic=all&page=1&limit=25
Authorization: Bearer {accessToken}

Query Parameters:
- status: solved|attempted|revision|all
- difficulty: easy|medium|hard|all
- topic: arrays|strings|dp|graphs|trees|all
- page: 1-n
- limit: 10|25|50
- sortBy: createdAt|difficulty|timeSpent (default createdAt)
- sortOrder: asc|desc

Response (200 OK):
{
  "status": "success",
  "data": [
    {
      "id": "problem_123",
      "title": "Two Sum",
      "problemNumber": 1,
      "difficulty": "Easy",
      "topic": "Arrays",
      "status": "Solved",
      "estimatedTime": 30,
      "actualTime": 25,
      "pomodoroSessions": 1,
      "submissionDate": "2024-06-20",
      "submissionTime": "14:30:00",
      "notes": "Used HashMap for O(n) solution",
      "directLink": "https://leetcode.com/problems/two-sum",
      "favorite": false,
      "confidenceLevel": 4,
      "revisionCount": 0,
      "createdAt": "2024-06-20T14:30:00Z"
    },
    /* ... more problems ... */
  ],
  "pagination": { /* ... */ }
}
```

---

### 6.2 Create Leetcode Problem Entry
```
POST /leetcode/problems
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "title": "Two Sum",
  "problemNumber": 1,
  "difficulty": "Easy",
  "topic": "Arrays",
  "estimatedTime": 30,
  "actualTime": 25,
  "pomodoroSessions": 1,
  "status": "Solved",
  "notes": "Used HashMap for O(n) solution",
  "directLink": "https://leetcode.com/problems/two-sum",
  "favorite": false,
  "confidenceLevel": 4
}

Response (201 Created):
{
  "status": "success",
  "data": { /* created problem */ },
  "message": "Problem logged successfully"
}
```

---

### 6.3 Update Problem
```
PATCH /leetcode/problems/:id
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "status": "Revision",
  "confidenceLevel": 3,
  "notes": "Need to optimize for space complexity"
}

Response (200 OK):
{
  "status": "success",
  "data": { /* updated problem */ },
  "message": "Problem updated successfully"
}
```

---

### 6.4 Delete Problem
```
DELETE /leetcode/problems/:id
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "status": "success",
  "data": null,
  "message": "Problem deleted successfully"
}
```

---

### 6.5 Get Daily Goal Progress
```
GET /leetcode/daily-goal
Authorization: Bearer {accessToken}

Query Parameters:
- date: YYYY-MM-DD (optional, default today)

Response (200 OK):
{
  "status": "success",
  "data": {
    "date": "2024-06-20",
    "dailyGoal": 10,
    "completed": {
      "easy": 3,
      "medium": 4,
      "hard": 1,
      "total": 8
    },
    "targetDistribution": {
      "easy": 30,
      "medium": 40,
      "hard": 30
    },
    "progressPercentage": 80,
    "problemsNeeded": 2
  }
}
```

---

### 6.6 Get Leetcode Analytics
```
GET /leetcode/analytics?period=month
Authorization: Bearer {accessToken}

Query Parameters:
- period: week|month|year|all

Response (200 OK):
{
  "status": "success",
  "data": {
    "period": "month",
    "totalSolved": 45,
    "weeklyGoalCompletion": 92,
    "acceptanceRate": 85.5,
    "averageTimePerProblem": 28.5,
    "fastestProblem": {
      "title": "Two Sum",
      "time": 12
    },
    "slowestProblem": {
      "title": "Word Ladder II",
      "time": 120
    },
    "difficultyBreakdown": {
      "easy": 15,
      "medium": 20,
      "hard": 10
    },
    "topicBreakdown": {
      "arrays": 8,
      "strings": 7,
      "dp": 12,
      "graphs": 10,
      "trees": 8
    },
    "currentStreak": 23,
    "longestStreak": 45,
    "weeklyTrend": [
      { "week": "Week 1", "count": 8 },
      /* ... rest of weeks ... */
    ],
    "submissionHeatmap": [ /* 30 days or 52 weeks */ ]
  }
}
```

---

### 6.7 Get Revision Queue
```
GET /leetcode/revision-queue
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "status": "success",
  "data": [
    {
      "id": "problem_456",
      "title": "Word Ladder",
      "difficulty": "Hard",
      "topic": "BFS/DFS",
      "lastAttempt": "2024-06-10",
      "revisionCount": 2,
      "confidenceLevel": 2,
      "nextReviewDate": "2024-06-21"
    },
    /* ... more problems ... */
  ]
}
```

---

## 7. KANBAN BOARD ENDPOINTS

### 7.1 Get Kanban Board
```
GET /kanban/board
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "status": "success",
  "data": {
    "backlog": [
      {
        "id": "task_123",
        "title": "Learn System Design",
        "description": "Complete 10 design patterns",
        "priority": "High",
        "deadline": "2024-07-15",
        "tags": ["System Design"],
        "subtasks": 0,
        "completedSubtasks": 0
      },
      /* ... more tasks ... */
    ],
    "today": [ /* ... */ ],
    "inProgress": [ /* ... */ ],
    "review": [ /* ... */ ],
    "completed": [ /* ... */ ]
  }
}
```

---

### 7.2 Move Task Between Columns
```
POST /kanban/tasks/:id/move
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "targetColumn": "in_progress",
  "position": 2
}

Response (200 OK):
{
  "status": "success",
  "data": { /* updated board state */ },
  "message": "Task moved successfully"
}
```

---

### 7.3 Add Subtask
```
POST /kanban/tasks/:id/subtasks
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "title": "Learn caching strategies",
  "position": 1
}

Response (201 Created):
{
  "status": "success",
  "data": {
    "subtaskId": "subtask_123",
    "title": "Learn caching strategies"
  }
}
```

---

### 7.4 Complete Subtask
```
POST /kanban/tasks/:id/subtasks/:subtaskId/complete
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "status": "success",
  "data": { /* updated task */ },
  "message": "Subtask completed successfully"
}
```

---

## 8. POMODORO ENDPOINTS

### 8.1 Create Pomodoro Session
```
POST /pomodoro/sessions
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "taskId": "task_123",
  "duration": 25,
  "sessionType": "work",
  "linkedTo": "task|leetcode|habit",
  "linkedItemId": "item_123"
}

Response (201 Created):
{
  "status": "success",
  "data": {
    "sessionId": "session_123",
    "duration": 25,
    "startedAt": "2024-06-20T14:00:00Z",
    "status": "active"
  }
}
```

---

### 8.2 Complete Pomodoro Session
```
POST /pomodoro/sessions/:id/complete
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "actualDuration": 25,
  "notes": "Focused session, no distractions"
}

Response (200 OK):
{
  "status": "success",
  "data": {
    "sessionId": "session_123",
    "completedAt": "2024-06-20T14:25:00Z",
    "focusTime": 25
  }
}
```

---

### 8.3 Get Pomodoro Statistics
```
GET /pomodoro/stats?period=week
Authorization: Bearer {accessToken}

Query Parameters:
- period: day|week|month

Response (200 OK):
{
  "status": "success",
  "data": {
    "period": "week",
    "sessionCount": 28,
    "totalFocusTime": 700,
    "averageSessionsPerDay": 4,
    "completionRate": 96.5,
    "totalBreakTime": 140,
    "mostProductiveDay": "Friday",
    "dailyBreakdown": [
      { "day": "Monday", "sessions": 4, "focusTime": 100 },
      /* ... rest of week ... */
    ],
    "moduleBreakdown": {
      "tasks": { "sessions": 12, "time": 300 },
      "leetcode": { "sessions": 10, "time": 250 },
      "habits": { "sessions": 6, "time": 150 }
    }
  }
}
```

---

## 9. CORE SUBJECT ENDPOINTS

### 9.1 Get All Subjects
```
GET /subjects
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "status": "success",
  "data": [
    {
      "id": "subject_dbms",
      "name": "DBMS",
      "progressPercentage": 65,
      "topicsTotal": 20,
      "topicsCompleted": 13,
      "studyHours": 45,
      "expectedCompletionDate": "2024-07-15",
      "revisionCount": 2,
      "confidence": 3,
      "topics": [
        {
          "id": "topic_sql",
          "title": "SQL Basics",
          "status": "Confident",
          "progressPercentage": 100,
          "studyHours": 5,
          "confidence": 4,
          "difficulty": 2,
          "revisionCount": 1,
          "subtopics": [
            { "title": "SELECT statements", "completed": true },
            /* ... more subtopics ... */
          ]
        },
        /* ... more topics ... */
      ]
    },
    /* ... more subjects ... */
  ]
}
```

---

### 9.2 Update Topic Status
```
PATCH /subjects/:subjectId/topics/:topicId
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "status": "Learning",
  "confidence": 3,
  "studyHours": 3,
  "difficulty": 3
}

Response (200 OK):
{
  "status": "success",
  "data": { /* updated topic */ },
  "message": "Topic updated successfully"
}
```

---

### 9.3 Mark Topic for Revision
```
POST /subjects/:subjectId/topics/:topicId/mark-revision
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "status": "success",
  "data": {
    "topic": { /* updated topic */ },
    "nextReviewDate": "2024-06-21"
  },
  "message": "Topic marked for revision"
}
```

---

## 10. SYSTEM DESIGN ENDPOINTS

### 10.1 Get System Design Topics
```
GET /system-design?status=all&priority=all&page=1&limit=25
Authorization: Bearer {accessToken}

Query Parameters:
- status: not_started|learning|revising|confident|mastered|all
- priority: high|medium|low|all
- page: 1-n
- limit: 10|25|50
- sortBy: addedDate|targetCompletion|priority (default addedDate)

Response (200 OK):
{
  "status": "success",
  "data": [
    {
      "id": "sd_123",
      "title": "Design URL Shortener",
      "status": "Learning",
      "priority": "High",
      "notes": "Key learnings: Hashing, database design",
      "resources": [
        {
          "title": "System Design Interview",
          "url": "https://example.com",
          "type": "article"
        }
      ],
      "timeSpent": 5,
      "pomodoroCount": 12,
      "completionPercentage": 40,
      "addedDate": "2024-06-15",
      "targetCompletion": "2024-06-25"
    },
    /* ... more topics ... */
  ],
  "pagination": { /* ... */ }
}
```

---

### 10.2 Create System Design Topic
```
POST /system-design
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "title": "Design URL Shortener",
  "status": "Not Started",
  "priority": "High",
  "notes": "Focus on hashing, scalability",
  "resources": [
    {
      "title": "System Design Primer",
      "url": "https://example.com",
      "type": "article"
    }
  ],
  "targetCompletion": "2024-06-25"
}

Response (201 Created):
{
  "status": "success",
  "data": { /* created topic */ },
  "message": "Topic created successfully"
}
```

---

### 10.3 Update Topic Progress
```
PATCH /system-design/:id
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "status": "Learning",
  "completionPercentage": 40,
  "timeSpent": 5,
  "pomodoroCount": 12
}

Response (200 OK):
{
  "status": "success",
  "data": { /* updated topic */ },
  "message": "Topic updated successfully"
}
```

---

## 11. ANALYTICS ENDPOINTS

### 11.1 Get Dashboard Analytics
```
GET /analytics/dashboard?period=month
Authorization: Bearer {accessToken}

Query Parameters:
- period: week|month|year

Response (200 OK):
{
  "status": "success",
  "data": {
    "studyOverview": {
      "weeklyHours": 42,
      "monthlyHours": 180,
      "dailyAverage": 6,
      "trend": "up"
    },
    "productivity": {
      "dailyCompletionRate": 75,
      "taskCompletionTrend": [ /* 30 days */ ],
      "bestDay": "Friday",
      "averageTasksPerDay": 5
    },
    "leetcode": {
      "problemsPerWeek": 52,
      "currentStreak": 23,
      "difficultyDistribution": {
        "easy": 25,
        "medium": 40,
        "hard": 35
      },
      "topicCoverage": [ /* list of topics */ ]
    },
    "habits": {
      "consistencyPercentage": 82,
      "bestHabit": "Gym",
      "worstHabit": "Reading",
      "averageStreak": 18
    },
    "timeDistribution": {
      "tasks": 30,
      "leetcode": 35,
      "subjects": 20,
      "pomodoro": 15
    },
    "weeklyComparison": {
      "currentWeek": 42,
      "lastWeek": 38,
      "bestWeek": 50,
      "trend": "up"
    }
  }
}
```

---

### 11.2 Get Detailed Charts Data
```
GET /analytics/charts/:type?period=month
Authorization: Bearer {accessToken}

Query Parameters:
- type: study_trend|completion_rate|difficulty_split|time_distribution|habit_progress
- period: week|month|year

Response (200 OK):
{
  "status": "success",
  "data": {
    "chartType": "study_trend",
    "period": "month",
    "data": [
      { "date": "2024-05-20", "value": 4 },
      { "date": "2024-05-21", "value": 6 },
      /* ... rest of month ... */
    ],
    "average": 5.5,
    "max": 8,
    "min": 2,
    "trend": "up"
  }
}
```

---

### 11.3 Get Heatmap Data
```
GET /analytics/heatmap/:type?year=2024
Authorization: Bearer {accessToken}

Query Parameters:
- type: study|leetcode|habits|pomodoro
- year: YYYY

Response (200 OK):
{
  "status": "success",
  "data": {
    "type": "study",
    "year": 2024,
    "heatmap": [
      { "date": "2024-01-01", "value": 0 },
      { "date": "2024-01-02", "value": 5 },
      /* ... full year ... */
    ],
    "stats": {
      "totalDays": 365,
      "activeDays": 280,
      "maxValue": 10,
      "averageValue": 5.2
    }
  }
}
```

---

## 12. SETTINGS ENDPOINTS

### 12.1 Get User Settings
```
GET /settings
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "status": "success",
  "data": {
    "theme": "dark",
    "accentColor": "#6366F1",
    "fontSize": "normal",
    "goals": {
      "dailyStudy": 6,
      "weeklyStudy": 40,
      "dailyLeetcode": 10,
      "weeklyLeetcode": 50,
      "habitConsistency": 80
    },
    "placement": {
      "targetRole": "Senior SDE",
      "targetPackage": "₹80 LPA",
      "targetCompanies": ["Google", "Microsoft"],
      "preferredInterviewDate": "2024-07-15",
      "graduationDate": "2024-05-2025"
    },
    "notifications": {
      "taskReminder": true,
      "dailyBriefing": true,
      "eveningSummary": true,
      "habitReminder": true,
      "streakMilestone": true,
      "weeklyReport": true,
      "quietHours": {
        "enabled": true,
        "start": "21:00",
        "end": "07:00"
      }
    }
  }
}
```

---

### 12.2 Update Settings
```
PATCH /settings
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "theme": "light",
  "goals": {
    "dailyStudy": 7
  }
}

Response (200 OK):
{
  "status": "success",
  "data": { /* updated settings */ },
  "message": "Settings updated successfully"
}
```

---

### 12.3 Export User Data
```
GET /settings/export-data
Authorization: Bearer {accessToken}

Response (200 OK - Downloads JSON file)
{
  "users": { /* user profile */ },
  "tasks": [ /* all tasks */ ],
  "habits": [ /* all habits */ ],
  "leetcode": [ /* all problems */ ],
  "subjects": [ /* subject data */ ],
  "analytics": { /* aggregated analytics */ },
  "exportDate": "2024-06-20T15:45:00Z"
}
```

---

## 13. ADMIN ENDPOINTS

All admin endpoints require valid admin JWT token and admin role.

### 13.1 Admin Authentication

```
POST /admin/auth/login
Content-Type: application/json

Request Body:
{
  "accessCode": "ADMIN123ABC",
  "email": "admin@trackforge.com"
}

Response (200 OK):
{
  "status": "success",
  "data": {
    "adminId": "admin_123",
    "accessCode": "ADMIN123ABC",
    "role": "super_admin",
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 14400,
    "sessionId": "session_456"
  },
  "message": "Admin login successful"
}

Error (401 Unauthorized):
{
  "status": "error",
  "error": {
    "code": "INVALID_ACCESS_CODE",
    "message": "Invalid admin access code"
  }
}
```

---

### 13.2 Get Admin Dashboard
```
GET /admin/dashboard/overview
Authorization: Bearer {adminAccessToken}

Response (200 OK):
{
  "status": "success",
  "data": {
    "userStats": {
      "totalUsers": 2500,
      "activeUsersToday": 1200,
      "activeUsersThisWeek": 1800,
      "newUsersToday": 45,
      "newUsersThisWeek": 320
    },
    "systemHealth": {
      "serverStatus": "healthy",
      "databaseSize": "450 MB",
      "averageResponseTime": "125 ms",
      "errorRate": 0.02,
      "uptime": 99.98
    },
    "platformMetrics": {
      "totalTasksCreated": 125000,
      "totalHabitsTracked": 45000,
      "totalLeetcodeProblems": 85000,
      "averageStudyTime": 5.2
    },
    "recentActivities": [
      {
        "type": "user_registered",
        "user": "user_123",
        "timestamp": "2024-06-20T15:30:00Z"
      },
      /* ... 9 more activities ... */
    ],
    "alerts": [
      {
        "type": "high_error_rate",
        "severity": "warning",
        "message": "Error rate spike detected"
      }
    ]
  }
}
```

---

### 13.3 Get Users List
```
GET /admin/users?page=1&limit=25&search=&status=all&sortBy=createdAt&sortOrder=desc
Authorization: Bearer {adminAccessToken}

Query Parameters:
- page: 1-n
- limit: 25|50|100
- search: search by email/name/college
- status: active|inactive|banned|all
- batchYear: YYYY (optional)
- sortBy: email|name|createdAt|lastLogin
- sortOrder: asc|desc

Response (200 OK):
{
  "status": "success",
  "data": [
    {
      "userId": "user_123",
      "email": "student@example.com",
      "name": "John Doe",
      "college": "IIT Delhi",
      "batchYear": 2024,
      "createdDate": "2024-01-15",
      "lastLogin": "2024-06-20",
      "status": "active",
      "emailVerified": true,
      "profileComplete": true
    },
    /* ... more users ... */
  ],
  "pagination": { /* ... */ }
}
```

---

### 13.4 Get User Details (Admin)
```
GET /admin/users/:userId
Authorization: Bearer {adminAccessToken}

Response (200 OK):
{
  "status": "success",
  "data": {
    "userId": "user_123",
    "email": "student@example.com",
    "name": "John Doe",
    "college": "IIT Delhi",
    "batchYear": 2024,
    "targetRole": "Senior SDE",
    "targetPackage": "₹80 LPA",
    "targetCompanies": ["Google", "Microsoft"],
    "preferredInterviewDate": "2024-07-15",
    "accountStatus": "active",
    "emailVerified": true,
    "createdDate": "2024-01-15",
    "lastLogin": "2024-06-20",
    "activity": {
      "tasksCreated": 120,
      "tasksCompleted": 95,
      "habitTracked": 8,
      "leetcodeProblems": 85,
      "totalStudyHours": 450,
      "pomodoroSessions": 1080
    },
    "preferences": {
      "theme": "dark",
      "notificationsEnabled": true
    },
    "ban": null
  }
}
```

---

### 13.5 Ban/Unban User
```
POST /admin/users/:userId/ban
Authorization: Bearer {adminAccessToken}
Content-Type: application/json

Request Body:
{
  "reason": "Spam activity",
  "durationDays": 7,
  "permanent": false
}

Response (200 OK):
{
  "status": "success",
  "data": {
    "userId": "user_123",
    "banStatus": "banned",
    "reason": "Spam activity",
    "banExpires": "2024-06-27T15:45:00Z"
  },
  "message": "User banned successfully"
}
```

---

### 13.6 View Audit Logs
```
GET /admin/logs?page=1&limit=50&eventType=all&userId=&dateFrom=&dateTo=&sortBy=timestamp&sortOrder=desc
Authorization: Bearer {adminAccessToken}

Query Parameters:
- page: 1-n
- limit: 25|50|100
- eventType: user_registration|user_login|admin_login|data_change|user_ban|data_export|etc
- userId: filter by user
- adminId: filter by admin
- dateFrom: YYYY-MM-DD
- dateTo: YYYY-MM-DD
- status: success|failure|all
- sortBy: timestamp
- sortOrder: asc|desc

Response (200 OK):
{
  "status": "success",
  "data": [
    {
      "logId": "log_123",
      "timestamp": "2024-06-20T15:30:00Z",
      "eventType": "user_registration",
      "userId": "user_123",
      "adminId": null,
      "details": {
        "email": "student@example.com",
        "college": "IIT Delhi"
      },
      "ipAddress": "192.168.1.1",
      "status": "success"
    },
    /* ... more logs ... */
  ],
  "pagination": { /* ... */ }
}
```

---

### 13.7 Send Broadcast Announcement
```
POST /admin/announcements
Authorization: Bearer {adminAccessToken}
Content-Type: application/json

Request Body:
{
  "title": "New Feature Launch",
  "message": "We've launched System Design Tracker!",
  "type": "success",
  "targetAudience": "all",
  "targetBatchYear": null,
  "channels": ["in_app", "email"],
  "scheduleFor": "2024-06-20T10:00:00Z",
  "sendImmediately": false
}

Response (201 Created):
{
  "status": "success",
  "data": {
    "announcementId": "announce_123",
    "status": "scheduled",
    "scheduledFor": "2024-06-20T10:00:00Z"
  },
  "message": "Announcement created successfully"
}
```

---

### 13.8 Export All User Data
```
GET /admin/export/users
Authorization: Bearer {adminAccessToken}

Query Parameters:
- format: json|csv

Response (200 OK - Downloads file)
```

---

### 13.9 System Settings (Super Admin only)
```
GET /admin/system/settings
Authorization: Bearer {adminAccessToken}

Response (200 OK):
{
  "status": "success",
  "data": {
    "maintenanceMode": false,
    "newRegistrationsAllowed": true,
    "emailVerificationRequired": true,
    "sessionTimeout": 14400,
    "maxConcurrentSessions": 3,
    "rateLimit": 1000
  }
}

---

PATCH /admin/system/settings
Authorization: Bearer {adminAccessToken}
Content-Type: application/json

Request Body:
{
  "maintenanceMode": true,
  "maintenanceMessage": "Scheduled maintenance until 10 PM"
}

Response (200 OK):
{
  "status": "success",
  "data": { /* updated settings */ },
  "message": "Settings updated successfully"
}
```

---

## Error Codes Reference

| Code | Status | Description |
|------|--------|-------------|
| INVALID_CREDENTIALS | 401 | Email or password is incorrect |
| EMAIL_EXISTS | 409 | Email already registered |
| ACCOUNT_LOCKED | 423 | Account locked due to failed attempts |
| INVALID_TOKEN | 401 | JWT token invalid or expired |
| INSUFFICIENT_PERMISSIONS | 403 | User lacks required permissions |
| RESOURCE_NOT_FOUND | 404 | Requested resource not found |
| VALIDATION_ERROR | 400 | Request validation failed |
| SERVER_ERROR | 500 | Internal server error |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| MAINTENANCE_MODE | 503 | Server in maintenance mode |

---

## Rate Limiting

**Default:** 1000 requests per hour per user

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1624284600
```

**When exceeded (429):**
```json
{
  "status": "error",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again after 1 hour.",
    "retryAfter": 3600
  }
}
```

---

## Authentication

### JWT Token Structure

**Access Token Payload:**
```json
{
  "userId": "user_123",
  "email": "student@example.com",
  "role": "user",
  "iat": 1624280000,
  "exp": 1624281000
}
```

**Admin Access Token Payload:**
```json
{
  "adminId": "admin_123",
  "role": "super_admin",
  "iat": 1624280000,
  "exp": 1624294000
}
```

### Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## CORS Configuration

**Allowed Origins:**
- https://trackforge.com
- https://www.trackforge.com
- http://localhost:3000 (development only)

**Allowed Methods:**
- GET, POST, PUT, PATCH, DELETE, OPTIONS

**Allowed Headers:**
- Content-Type
- Authorization
- Accept

**Max Age:** 3600 seconds

---

## Conclusion

This API specification covers all endpoints needed for TrackForge MVP + Admin Panel. Each endpoint is:
- ✓ RESTful
- ✓ Documented with request/response examples
- ✓ Error-handled
- ✓ Authenticated (where applicable)
- ✓ Ready for implementation

**Next Steps:**
1. Backend implementation (Node.js + Express)
2. Frontend integration
3. Testing (Unit, Integration, E2E)
4. Deployment

