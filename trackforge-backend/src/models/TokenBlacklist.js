import mongoose from 'mongoose';

const TokenBlacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
    }
  },
  {
    timestamps: true
  }
);

// Auto-expire documents after expiresAt date passes
TokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TokenBlacklist = mongoose.model('TokenBlacklist', TokenBlacklistSchema);
export default TokenBlacklist;
