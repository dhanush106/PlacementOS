console.log("APP>JS IS LOADED");
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import logger from './utils/logger.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import dashboardRoutes from './routes/dashboard.js';
import plannerRoutes from './routes/planner.js';
import habitRoutes from './routes/habits.js';
import leetcodeRoutes from './routes/leetcode.js';
import subjectRoutes from './routes/subjects.js';
import pomodoroRoutes from './routes/pomodoro.js';
import systemDesignRoutes from './routes/systemDesign.js';
import kanbanRoutes from './routes/kanban.js';
import analyticsRoutes from './routes/analytics.js';
import { errorHandler } from './middleware/errorHandler.js';
import { checkDatabaseHealth } from './config/database.js';

const app = express();

const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  "http://localhost:5173,http://127.0.0.1:5173,https://placement-os-rmrw.vercel.app,https://placement-os-seven.vercel.app"
)
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    console.log("Incoming Origin:", origin);
    console.log("Allowed Origins:", allowedOrigins);

    if (!origin) {
        console.log("No origin");
        return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
        console.log("✅ Allowed:", origin);
        return callback(null, true);
    }

    console.log("❌ Blocked:", origin);

    callback(new Error("Not allowed by CORS"));
},

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],

  optionsSuccessStatus: 204,
};

// CORS Configuration
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger Middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbHealth = checkDatabaseHealth();
  res.status(dbHealth.status === 'healthy' ? 200 : 503).json({
    status: dbHealth.status === 'healthy' ? 'success' : 'error',
    timestamp: new Date(),
    services: {
      database: dbHealth,
      server: 'healthy'
    }
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TrackForge API is running 🚀",
  });
});

// app.get("/api/health", (req, res) => {
//   const dbHealth = checkDatabaseHealth();
//   res.status(200).json({ ok: true, db: dbHealth });
// });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/leetcode', leetcodeRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/pomodoro', pomodoroRoutes);
app.use('/api/system-design', systemDesignRoutes);
app.use('/api/kanban', kanbanRoutes);
app.use('/api/analytics', analyticsRoutes);

// Catch-all route for unmatched paths (404)
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`
    }
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
