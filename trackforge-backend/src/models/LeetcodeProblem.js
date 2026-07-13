import mongoose from 'mongoose';

const LeetcodeProblemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // ── Core Problem Identity ────────────────────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true
    },
    problemNumber: {
      type: Number
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true
    },
    link: {
      type: String,
      default: ''
    },
    leetcodeTitleSlug: {
      type: String,
      default: '',
      trim: true
    },
    leetcodeSubmissionId: {
      type: String,
      default: '',
      trim: true
    },
    source: {
      type: String,
      enum: ['manual', 'leetcode-sync', 'seed'],
      default: 'manual'
    },

    // ── Taxonomy & Classification ────────────────────────────────────────
    topic: {
      type: String,
      required: true,
      trim: true
    },
    subtopic: {
      type: String,
      default: '',
      trim: true
    },
    pattern: {
      type: String,
      default: '',
      trim: true
    },
    companyTags: {
      type: [String],
      default: []
    },
    tags: {
      type: [String],
      default: []
    },

    // ── Striver A2Z Sheet Mapping ────────────────────────────────────────
    striverSheetId: {
      type: String,
      default: ''
    },
    striverStep: {
      type: Number,
      default: 0
    },
    striverSection: {
      type: String,
      default: ''
    },

    // ── Progress Status ──────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['Not Started', 'Attempted', 'Solved', 'Revised', 'Bookmarked', 'Skipped'],
      default: 'Not Started'
    },
    favorite: {
      type: Boolean,
      default: false
    },

    // ── Time Tracking ────────────────────────────────────────────────────
    estimatedTime: {
      type: Number,
      default: 0
    },
    actualTime: {
      type: Number,
      default: 0
    },

    // ── Submission Tracking ──────────────────────────────────────────────
    attempts: {
      type: Number,
      default: 0
    },
    submissionDate: {
      type: Date,
      default: null
    },
    firstSolvedDate: {
      type: Date,
      default: null
    },

    // ── Rating & Confidence ──────────────────────────────────────────────
    personalRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },

    // ── Revision (Spaced Repetition) ─────────────────────────────────────
    revisionRequired: {
      type: Boolean,
      default: false
    },
    revisionDates: {
      type: [Date],
      default: []
    },
    nextRevisionDate: {
      type: Date,
      default: null
    },
    revisedCount: {
      type: Number,
      default: 0
    },
    revisionHistory: [{
      date: { type: Date },
      confidence: { type: Number, min: 1, max: 5, default: 3 }
    }],

    // ── Notes & Learning ─────────────────────────────────────────────────
    notes: {
      type: String,
      default: ''
    },
    approach: {
      type: String,
      default: ''
    },
    mistakes: {
      type: String,
      default: ''
    },
    timeComplexity: {
      type: String,
      default: ''
    },
    spaceComplexity: {
      type: String,
      default: ''
    },
    codeSnippet: {
      type: String,
      default: ''
    },
    revisionTips: {
      type: String,
      default: ''
    },
    importantPatterns: {
      type: String,
      default: ''
    },

    // ── Pomodoro Link ────────────────────────────────────────────────────
    pomodoroSessions: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────
LeetcodeProblemSchema.index({ userId: 1, submissionDate: -1 });
LeetcodeProblemSchema.index({ userId: 1, difficulty: 1 });
LeetcodeProblemSchema.index({ userId: 1, topic: 1 });
LeetcodeProblemSchema.index({ userId: 1, status: 1 });
LeetcodeProblemSchema.index({ userId: 1, striverSheetId: 1 });
LeetcodeProblemSchema.index({ userId: 1, nextRevisionDate: 1 });
LeetcodeProblemSchema.index({ userId: 1, 'companyTags': 1 });
LeetcodeProblemSchema.index({ userId: 1, problemNumber: 1 });
LeetcodeProblemSchema.index({ userId: 1, leetcodeTitleSlug: 1 });
LeetcodeProblemSchema.index({ userId: 1, leetcodeSubmissionId: 1 });

const LeetcodeProblem = mongoose.model('LeetcodeProblem', LeetcodeProblemSchema);
export default LeetcodeProblem;
