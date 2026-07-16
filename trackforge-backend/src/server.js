import './config/env.js';
import serverless from 'serverless-http';
import app from './app.js';
import mongoose from "mongoose";
import { connectDB } from './config/database.js';
import logger from './utils/logger.js';
import { startRecurringTaskScheduler } from './services/recurringTaskService.js';

const isVercelRuntime = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
const isDirectRun = process.argv[1] && process.argv[1].endsWith('server.js');

let dbInitialized = false;
let schedulerStarted = false;

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

// export const ensureDatabaseConnection = async () => {
//   if (dbInitialized) return;

//   dbInitialized = true;

//   try {
//     await connectDB();
//   } catch (error) {
//     logger.error('Database initialization failed:', error);
//   }
// };
export const ensureDatabaseConnection = async () => {
  if (dbInitialized && mongoose.connection.readyState === 1) {
    return;
  }

  console.log("Connecting to MongoDB...");

  try {
    await connectDB();

    dbInitialized = true;

    console.log("✅ MongoDB connected");
  } catch (error) {
    dbInitialized = false;

    console.error("❌ MongoDB connection failed:", error);

    logger.error("Database initialization failed:", error);

    throw error;
  }
};

export const startBackgroundServices = async () => {
  if (schedulerStarted) return;

  schedulerStarted = true;

  if (!isVercelRuntime) {
    startRecurringTaskScheduler();
  }
};

const serverlessHandler = serverless(app);

export const handler = async (req, res) => {
  await ensureDatabaseConnection();
  return serverlessHandler(req, res);
};

if (isDirectRun) {
  const PORT = Number(process.env.PORT || 5000);

  const startServer = async () => {
    await ensureDatabaseConnection();
    await startBackgroundServices();

    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });

    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! Shutting down...', err);
      server.close(() => {
        process.exit(1);
      });
    });
  };

  startServer().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default handler;
