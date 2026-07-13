import mongoose from 'mongoose';

const SubtopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const TopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['not_started', 'learning', 'revising', 'confident'],
    default: 'not_started'
  },
  confidence: {
    type: Number,
    min: 1,
    max: 5,
    default: 1
  },
  lastRevised: {
    type: Date
  },
  nextReviewDate: {
    type: Date
  },
  revisionCount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  subtopics: [SubtopicSchema]
});

const ChapterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  topics: [TopicSchema]
});

const SubjectSchema = new mongoose.Schema(
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
    chapters: [ChapterSchema]
  },
  {
    timestamps: true
  }
);

SubjectSchema.index({ userId: 1, name: 1 });

const Subject = mongoose.model('Subject', SubjectSchema);
export default Subject;
