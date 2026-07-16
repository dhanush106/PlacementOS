import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import Quote from '../models/Quote.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/PlacementOS';
let reconnectTimer = null;

const initialQuotes = [
  { text: 'Your consistency today is your competitive advantage tomorrow.', author: 'TrackForge' },
  { text: 'Every problem solved brings you closer to your dream role.', author: 'TrackForge' },
  { text: 'Progress is progress, no matter how small.', author: 'TrackForge' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
  { text: 'Don’t watch the clock; do what it does. Keep going.', author: 'Sam Levenson' },
  { text: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
  { text: 'Believe you can and you are halfway there.', author: 'Theodore Roosevelt' }
];

async function seedQuotes() {
  try {
    const count = await Quote.countDocuments();
    if (count === 0) {
      await Quote.insertMany(initialQuotes);
      logger.info('Predefined motivation quotes seeded successfully.');
    }
  } catch (err) {
    logger.error('Failed to seed motivation quotes:', err);
  }
}
export const connectDB = async () => {
  console.log("VERCEL:", process.env.VERCEL);
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
  console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
  console.log("Connecting to MongoDB...");

  if (mongoose.connection.readyState === 1) {
    console.log("Already connected");
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2) {
    console.log("Already connecting");
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB Connected");
    console.log("Host:", conn.connection.host);

    await seedQuotes();

    return conn;
  } catch (err) {
    console.error("❌ MongoDB Error:", err);
    throw err;
  }
};


export const checkDatabaseHealth = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    status: state === 1 ? 'healthy' : 'unhealthy',
    state: states[state],
    dbName: mongoose.connection.name
  };
};
