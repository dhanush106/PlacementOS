import './config/env.js';
import app from './app.js';
import { connectDB } from './config/database.js';
import logger from './utils/logger.js';

import { startRecurringTaskScheduler } from './services/recurringTaskService.js';

const PORT = process.env.PORT || 5000;

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

// Start Database & Server
const startServer = async () => {
  await connectDB();
  
  // Start background recurring task generation
  startRecurringTaskScheduler();
  
  const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });

  // Handle Unhandled Rejections
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', err);
    server.close(() => {
      process.exit(1);
    });
  });
};

startServer();
