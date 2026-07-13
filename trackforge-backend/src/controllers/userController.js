import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Session from '../models/Session.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError, ValidationError, AuthError, ConflictError } from '../utils/errors.js';
import { sendVerificationEmail } from '../services/emailService.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.deletedAt) {
      throw new NotFoundError('User profile not found');
    }
    return sendSuccess(res, user, 'Profile fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const allowedUpdates = [
      'name', 'college', 'batchYear', 'targetRole', 'targetPackage',
      'targetCompanies', 'preferredInterviewDate', 'bio', 'phone',
      'location', 'interviewTopics', 'leetcodeUsername', 'leetcodeDailyGoal'
    ];

    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Audit log
    await AuditLog.create({
      userId: user._id,
      eventType: 'profile_update',
      description: `User updated profile settings`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const { password, reason } = req.body;
    if (!password) {
      throw new ValidationError('Password is required to delete account');
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AuthError('Incorrect password', 'INVALID_CREDENTIALS');
    }

    // Soft delete (set deletedAt and schedule deletion in 30 days)
    const gracePeriodDays = 30;
    const deletionDate = new Date(Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000);
    user.deletedAt = new Date();
    await user.save();

    // Invalidate sessions
    await Session.updateMany({ userId: user._id, isValid: true }, { isValid: false });

    // Audit log
    await AuditLog.create({
      userId: user._id,
      eventType: 'account_delete_soft',
      description: `User soft deleted account. Reason: ${reason || 'Not specified'}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, {
      deletionScheduledFor: deletionDate,
      gracePeriodDays
    }, 'Account deleted successfully (soft delete). You can restore it within 30 days.');
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('Please upload an avatar image file');
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarUrl;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      eventType: 'avatar_upload',
      description: 'Uploaded new avatar image',
      ipAddress: req.ip
    });

    return sendSuccess(res, user, 'Avatar uploaded successfully');
  } catch (error) {
    next(error);
  }
};

export const changeEmail = async (req, res, next) => {
  try {
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      throw new ValidationError('New email and password are required');
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser) {
      throw new ConflictError('Email already registered', 'EMAIL_EXISTS');
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AuthError('Incorrect password', 'INVALID_CREDENTIALS');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.email = newEmail.toLowerCase();
    user.emailVerified = false;
    user.verificationCode = otp;
    user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await user.save();

    // Send verification email to the new email address
    await sendVerificationEmail(user.email, user.name, otp);

    // Invalidate other sessions since email changed
    await Session.updateMany({ userId: user._id, isValid: true }, { isValid: false });

    await AuditLog.create({
      userId: user._id,
      eventType: 'email_change_requested',
      description: `Email change requested to ${user.email}`,
      ipAddress: req.ip
    });

    return sendSuccess(res, { email: user.email, emailVerified: false }, 'Email updated. Verification code sent to new email.');
  } catch (error) {
    next(error);
  }
};
