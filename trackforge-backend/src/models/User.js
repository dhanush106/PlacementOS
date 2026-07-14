import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters']
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    college: {
      type: String,
      trim: true
    },
    batchYear: {
      type: Number
    },
    targetRole: {
      type: String,
      trim: true
    },
    targetPackage: {
      type: String,
      trim: true
    },
    targetCompanies: {
      type: [String],
      default: []
    },
    preferredInterviewDate: {
      type: Date
    },
    bio: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    interviewTopics: {
      type: [String],
      default: []
    },
    leetcodeUsername: {
      type: String,
      default: ''
    },
    leetcodeStats: {
      totalSolved: { type: Number, default: 0 },
      easySolved: { type: Number, default: 0 },
      mediumSolved: { type: Number, default: 0 },
      hardSolved: { type: Number, default: 0 },
      ranking: { type: Number, default: 0 },
      acceptanceRate: { type: Number, default: 0 },
      totalSubmissions: { type: Number, default: 0 },
      lastSynced: { type: Date }
    },
    leetcodeSyncStartDate: {
      type: Date,
      default: null
    },
    leetcodeLastSubmissionSyncAt: {
      type: Date,
      default: null
    },
    leetcodeStreak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastSolvedDate: { type: Date, default: null }
    },
    leetcodeXP: {
      type: Number,
      default: 0
    },
    leetcodeDailyGoal: {
      type: Number,
      default: 7
    },
    leetcodeSyncHistory: [{
      syncedAt: { type: Date },
      totalSolved: { type: Number },
      newProblemsDetected: { type: Number, default: 0 }
    }],
    chosenLeetcodeTopics: {
      type: [String],
      default: []
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    verificationCode: {
      type: String
    },
    verificationExpires: {
      type: Date
    },
    passwordResetCode: {
      type: String
    },
    passwordResetExpires: {
      type: Date
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date
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

// Indexes
UserSchema.index({ createdAt: -1 });

// Pre-save hook to hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Override toJSON to omit password and other sensitive fields
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationCode;
  delete obj.verificationExpires;
  delete obj.passwordResetCode;
  delete obj.passwordResetExpires;
  return obj;
};

const User = mongoose.model('User', UserSchema);
export default User;
