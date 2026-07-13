import mongoose from 'mongoose';

const SubtaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false }
});

const TaskSchema = new mongoose.Schema(
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
      default: '',
      trim: true
    },
    timeSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      required: true
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started'
    },
    kanbanColumn: {
      type: String,
      enum: ['Backlog', 'Today', 'In Progress', 'Review', 'Completed'],
      default: 'Backlog'
    },
    estimatedTime: {
      type: Number, // in minutes
      default: 0
    },
    actualTime: {
      type: Number, // in minutes
      default: 0
    },
    deadline: {
      type: Date
    },
    subtasks: [SubtaskSchema],
    completionPercentage: {
      type: Number,
      default: 0
    },
    pomodoroSessions: {
      type: Number,
      default: 0
    },
    recurring: {
      pattern: { type: String, enum: ['daily', 'weekdays', 'weekends', 'weekly', 'monthly', 'none'], default: 'none' },
      endDate: { type: Date }
    },
    order: {
      type: Number,
      default: 0
    },
    isRecurringTemplate: {
      type: Boolean,
      default: false
    },
    recurrenceParentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null
    },
    recurrenceDate: {
      type: Date,
      default: null
    },
    variancePercentage: {
      type: Number,
      default: 0
    },
    tags: {
      type: [String],
      default: []
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

TaskSchema.index({ userId: 1, deadline: 1 });
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, createdAt: -1 });

// Automatically compute completionPercentage and variance before save
TaskSchema.pre('save', function (next) {
  if (this.subtasks && this.subtasks.length > 0) {
    const completedCount = this.subtasks.filter(sub => sub.completed).length;
    this.completionPercentage = Math.round((completedCount / this.subtasks.length) * 100);
  } else {
    this.completionPercentage = this.status === 'Completed' ? 100 : 0;
  }
  
  if (this.status === 'Completed' && this.estimatedTime > 0) {
    this.variancePercentage = Math.round(((this.actualTime - this.estimatedTime) / this.estimatedTime) * 100);
  } else {
    this.variancePercentage = 0;
  }
  next();
});

const Task = mongoose.model('Task', TaskSchema);
export default Task;
