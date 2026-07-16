console.log("APP.JS IS LOADED");

import express from "express";
import cors from "cors";
import helmet from "helmet";

import logger from "./utils/logger.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import dashboardRoutes from "./routes/dashboard.js";
import plannerRoutes from "./routes/planner.js";
import habitRoutes from "./routes/habits.js";
import leetcodeRoutes from "./routes/leetcode.js";
import subjectRoutes from "./routes/subjects.js";
import pomodoroRoutes from "./routes/pomodoro.js";
import systemDesignRoutes from "./routes/systemDesign.js";
import kanbanRoutes from "./routes/kanban.js";
import analyticsRoutes from "./routes/analytics.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { checkDatabaseHealth } from "./config/database.js";

const app = express();

/* -------------------------------------------------------------------------- */
/*                                  CORS                                      */
/* -------------------------------------------------------------------------- */

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const vercelRegex = /^https:\/\/.*\.vercel\.app$/;

const corsOptions = {
  origin(origin, callback) {
    // Allow Postman, mobile apps, curl, etc.
    if (!origin) {
      return callback(null, true);
    }

    if (
      allowedOrigins.includes(origin) ||
      vercelRegex.test(origin)
    ) {
      return callback(null, true);
    }

    logger.warn(`Blocked CORS request from: ${origin}`);

    return callback(new Error("Not allowed by CORS"));
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

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* -------------------------------------------------------------------------- */
/*                               SECURITY                                     */
/* -------------------------------------------------------------------------- */

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

/* -------------------------------------------------------------------------- */
/*                               BODY PARSER                                  */
/* -------------------------------------------------------------------------- */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* -------------------------------------------------------------------------- */
/*                              REQUEST LOGGER                                */
/* -------------------------------------------------------------------------- */

app.use((req, res, next) => {
  logger.http(`${req.method} ${req.originalUrl} | ${req.ip}`);
  next();
});

/* -------------------------------------------------------------------------- */
/*                               HEALTH CHECK                                 */
/* -------------------------------------------------------------------------- */

app.get("/api/health", (req, res) => {
  const dbHealth = checkDatabaseHealth();

  return res.status(dbHealth.status === "healthy" ? 200 : 503).json({
    success: dbHealth.status === "healthy",
    timestamp: new Date().toISOString(),
    services: {
      server: "healthy",
      database: dbHealth,
    },
  });
});

/* -------------------------------------------------------------------------- */
/*                                  ROOT                                      */
/* -------------------------------------------------------------------------- */

app.get("/", (req, res) => {
  console.log("Root endpoint hit");
  res.status(200).json({
    success: true,
    message: "TrackForge API is running 🚀",
    version: "1.0.0",
  });
});

/* -------------------------------------------------------------------------- */
/*                                 ROUTES                                     */
/* -------------------------------------------------------------------------- */

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/planner", plannerRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/leetcode", leetcodeRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/pomodoro", pomodoroRoutes);
app.use("/api/system-design", systemDesignRoutes);
app.use("/api/kanban", kanbanRoutes);
app.use("/api/analytics", analyticsRoutes);

/* -------------------------------------------------------------------------- */
/*                                   404                                      */
/* -------------------------------------------------------------------------- */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
});

/* -------------------------------------------------------------------------- */
/*                             GLOBAL ERROR HANDLER                           */
/* -------------------------------------------------------------------------- */

app.use(errorHandler);

export default app;