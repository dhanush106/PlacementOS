import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, default: '' },
  type: { type: String, enum: ['article', 'video', 'book', 'course', 'other'], default: 'article' }
});

const SystemDesignTopicSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['not_started', 'learning', 'revising', 'confident', 'mastered'],
      default: 'not_started'
    },
    // Kanban column maps to status
    column: {
      type: String,
      enum: ['Backlog', 'Learning', 'Revising', 'Mastered'],
      default: 'Backlog'
    },
    tags: {
      type: [String],
      default: []
    },
    notes: {
      type: String,
      default: ''
    },
    resources: [ResourceSchema],
    timeSpent: {
      type: Number,
      default: 0  // in minutes
    },
    pomodoroCount: {
      type: Number,
      default: 0
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    targetDate: {
      type: Date
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

SystemDesignTopicSchema.index({ userId: 1, column: 1, order: 1 });

const SystemDesignTopic = mongoose.model('SystemDesignTopic', SystemDesignTopicSchema);
export default SystemDesignTopic;
