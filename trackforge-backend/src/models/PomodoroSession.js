import mongoose from 'mongoose';

const PomodoroSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    duration: {
      type: Number, // in minutes
      default: 25
    },
    type: {
      type: String,
      enum: ['work', 'break'],
      default: 'work'
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null
    },
    taskLabel: {
      type: String,
      default: ''
    },
    completed: {
      type: Boolean,
      default: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

PomodoroSessionSchema.index({ userId: 1, completedAt: -1 });

const PomodoroSession = mongoose.model('PomodoroSession', PomodoroSessionSchema);
export default PomodoroSession;
