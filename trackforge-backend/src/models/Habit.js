import mongoose from 'mongoose';

const CompletionLogSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  count: { type: Number, default: 1 },
  notes: { type: String, default: '' },
  completedAt: { type: Date, default: Date.now }
});

const HabitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['fitness', 'wellness', 'exercise', 'hydration', 'knowledge', 'routine', 'skill', 'custom'],
      default: 'custom'
    },
    color: {
      type: String,
      default: '#6366f1' // indigo
    },
    icon: {
      type: String,
      default: 'activity'
    },
    goal: {
      type: Number,
      default: 1
    },
    goalType: {
      type: String,
      enum: ['times_per_day', 'times_per_week'],
      default: 'times_per_day'
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    completions: [CompletionLogSchema],
    isTemplate: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

HabitSchema.index({ userId: 1, name: 1 });

const Habit = mongoose.model('Habit', HabitSchema);
export default Habit;
