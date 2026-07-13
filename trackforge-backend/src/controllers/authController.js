import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Session from '../models/Session.js';
import AuditLog from '../models/AuditLog.js';
import TokenBlacklist from '../models/TokenBlacklist.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { AuthError, ValidationError, ConflictError, LockedError, NotFoundError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_access_token_123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_key_for_refresh_token_456';

const signAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '15m' });
};

const signRefreshToken = (userId, rememberMe) => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: rememberMe ? '30d' : '7d' });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const register = async (req, res, next) => {
  try {
    const { email, name, password, college, targetRole } = req.body;

    // Validate request fields
    if (!email || !name || !password) {
      throw new ValidationError('Email, name, and password are required');
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('Email already registered', 'EMAIL_EXISTS');
    }

    // Generate OTP for email verification
    const otp = generateOTP();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = new User({
      email,
      name,
      password,
      college,
      targetRole,
      verificationCode: otp,
      verificationExpires
    });

    await user.save();

    // Send verification email
    await sendVerificationEmail(email, name, otp);

    // Audit log
    await AuditLog.create({
      userId: user._id,
      eventType: 'auth_register',
      description: `User registered: ${email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // We do NOT return tokens here because "User cannot log in until verified"
    return sendSuccess(res, {
      userId: user._id,
      email: user.email,
      name: user.name,
      verificationEmailSent: true,
      verificationExpiresIn: '24h'
    }, 'Registration successful. Check email for verification code.', 201);
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new ValidationError('Email and OTP are required');
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.emailVerified) {
      return sendSuccess(res, {
        userId: user._id,
        email: user.email,
        verified: true
      }, 'Email is already verified');
    }

    if (user.verificationCode !== otp || Date.now() > user.verificationExpires) {
      throw new ValidationError('OTP is invalid or expired', 'INVALID_OTP');
    }

    // Mark verified
    user.emailVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;

    // Seed default subjects for this user upon verification
    const defaultSubjects = [
      {
        name: 'Database Management Systems (DBMS)',
        topics: [
          { title: 'ER Model & Relational Algebra', status: 'not_started' },
          { title: 'Normalization (1NF, 2NF, 3NF, BCNF)', status: 'not_started' },
          { title: 'SQL Queries, Joins & Subqueries', status: 'not_started' },
          { title: 'Transactions & Concurrency Control (ACID)', status: 'not_started' },
          { title: 'Indexing & Hashing (B/B+ Trees)', status: 'not_started' }
        ]
      },
      {
        name: 'Operating Systems (OS)',
        topics: [
          { title: 'Process Management & CPU Scheduling', status: 'not_started' },
          { title: 'Process Synchronization & Semaphores', status: 'not_started' },
          { title: 'Deadlocks (Prevention, Avoidance, Detection)', status: 'not_started' },
          { title: 'Memory Management & Paging/Virtual Memory', status: 'not_started' },
          { title: 'Disk Scheduling & File Systems', status: 'not_started' }
        ]
      },
      {
        name: 'Computer Networks (CN)',
        topics: [
          { title: 'OSI & TCP/IP Model Layers', status: 'not_started' },
          { title: 'IP Addressing & Subnetting', status: 'not_started' },
          { title: 'Routing Protocols (RIP, OSPF, BGP)', status: 'not_started' },
          { title: 'TCP & UDP (Flow control, Congestion control)', status: 'not_started' },
          { title: 'Application Layer Protocols (HTTP, DNS, DHCP)', status: 'not_started' }
        ]
      },
      {
        name: 'Computer Organization & Architecture (COA)',
        topics: [
          { title: 'Machine Instructions & Addressing Modes', status: 'not_started' },
          { title: 'ALU, Data Path & Control Unit', status: 'not_started' },
          { title: 'Instruction Pipelining & Hazards', status: 'not_started' },
          { title: 'Memory Hierarchy (Cache mapping & coherence)', status: 'not_started' },
          { title: 'I/O Interface & DMA', status: 'not_started' }
        ]
      }
    ];

    // Import Subject model inside to avoid circular reference if any
    const Subject = (await import('../models/Subject.js')).default;
    const SubjectInstances = defaultSubjects.map(sub => ({
      userId: user._id,
      name: sub.name,
      topics: sub.topics
    }));
    await Subject.insertMany(SubjectInstances);

    // Seed default habits for this user upon verification
    const defaultHabits = [
      { name: 'Solve 5 Leetcode Problems', category: 'skill', color: '#10b981', icon: 'code', goal: 5 },
      { name: '45 Mins Core Subject Study', category: 'knowledge', color: '#6366f1', icon: 'book-open', goal: 1 },
      { name: 'Daily Meditation', category: 'wellness', color: '#4ecdc4', icon: 'heart', goal: 1 },
      { name: '8 Hours Sleep', category: 'routine', color: '#cbd5e1', icon: 'moon', goal: 1 }
    ];
    const Habit = (await import('../models/Habit.js')).default;
    const HabitInstances = defaultHabits.map(hab => ({
      userId: user._id,
      name: hab.name,
      category: hab.category,
      color: hab.color,
      icon: hab.icon,
      goal: hab.goal
    }));
    await Habit.insertMany(HabitInstances);

    await user.save();

    // Audit log
    await AuditLog.create({
      userId: user._id,
      eventType: 'auth_verify_email',
      description: `Email verified for: ${email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, {
      userId: user._id,
      email: user.email,
      verified: true
    }, 'Email verified successfully. You can now log in.');
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Check account lock status
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      throw new LockedError(`Account locked due to multiple failed login attempts. Try again in ${remainingTime} minutes.`);
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        user.loginAttempts = 0; // reset attempts
        await user.save();
        throw new LockedError('Account locked due to multiple failed login attempts. Try again in 15 minutes.');
      }
      await user.save();
      throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Check email verification status
    if (!user.emailVerified) {
      throw new AuthError('Email not verified. Please verify your email first.', 'EMAIL_NOT_VERIFIED');
    }

    // Reset attempts and lockout
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Generate tokens
    const accessToken = signAccessToken(user._id, 'user');
    const refreshToken = signRefreshToken(user._id, rememberMe);
    const expiresAt = new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000);

    // Save session
    await Session.create({
      userId: user._id,
      refreshToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt
    });

    // Audit log
    await AuditLog.create({
      userId: user._id,
      eventType: 'auth_login',
      description: `User logged in: ${email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, {
      userId: user._id,
      email: user.email,
      name: user.name,
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 mins in seconds
      userRole: 'user',
      profileComplete: !!(user.college && user.targetRole)
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No refresh token provided', 'NO_REFRESH_TOKEN');
    }
    const refreshToken = authHeader.split(' ')[1];

    // Verify session in database
    const session = await Session.findOne({ refreshToken, isValid: true });
    if (!session || session.expiresAt < Date.now()) {
      throw new AuthError('Invalid or expired session. Please log in again.', 'INVALID_REFRESH_TOKEN');
    }

    // Verify refresh token signature
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    // Generate new access token
    const accessToken = signAccessToken(decoded.userId, 'user');

    return sendSuccess(res, {
      accessToken,
      expiresIn: 900
    }, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new ValidationError('Refresh token is required for logout');
    }

    // Invalidate session in database
    await Session.updateOne({ refreshToken }, { isValid: false });

    // Blacklist access token
    if (req.token) {
      const decoded = jwt.decode(req.token);
      const expiresAt = new Date(decoded.exp * 1000);
      await TokenBlacklist.create({
        token: req.token,
        expiresAt
      });
    }

    // Audit log
    if (req.user) {
      await AuditLog.create({
        userId: req.user.userId,
        eventType: 'auth_logout',
        description: `User logged out: ${req.user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    return sendSuccess(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

export const passwordResetRequest = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new ValidationError('Email is required');
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal if user exists or not, but in dev environment or simple app we can throw.
      // Let's pretend it succeeds to prevent email enumeration.
      return sendSuccess(res, null, 'If that email exists in our system, a password reset code has been sent.');
    }

    // Generate reset OTP
    const otp = generateOTP();
    user.passwordResetCode = otp;
    user.passwordResetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await user.save();

    // Send email
    await sendPasswordResetEmail(email, user.name, otp);

    // Audit log
    await AuditLog.create({
      userId: user._id,
      eventType: 'auth_password_reset_request',
      description: `Password reset requested for: ${email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, null, 'If that email exists in our system, a password reset code has been sent.');
  } catch (error) {
    next(error);
  }
};

export const passwordResetVerify = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw new ValidationError('Email and OTP are required');
    }

    const user = await User.findOne({ email });
    if (!user || user.passwordResetCode !== otp || Date.now() > user.passwordResetExpires) {
      throw new ValidationError('Invalid or expired verification code', 'INVALID_OTP');
    }

    // Generate a secure reset token
    const tempToken = crypto.randomBytes(32).toString('hex');
    // Save temporary reset code as the token to match in the complete phase
    user.passwordResetCode = tempToken;
    await user.save();

    return sendSuccess(res, {
      resetToken: tempToken
    }, 'Identity verified successfully.');
  } catch (error) {
    next(error);
  }
};

export const passwordResetComplete = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      throw new ValidationError('Reset token and new password are required');
    }

    if (newPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    const user = await User.findOne({
      passwordResetCode: resetToken,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Set new password
    user.password = newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = 0; // reset attempts
    user.lockUntil = undefined;

    await user.save();

    // Invalidate all active sessions for this user (force re-login everywhere)
    await Session.updateMany({ userId: user._id, isValid: true }, { isValid: false });

    // Audit log
    await AuditLog.create({
      userId: user._id,
      eventType: 'auth_password_reset_complete',
      description: `Password reset complete for: ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, null, 'Password reset successful. Please log in with your new password.');
  } catch (error) {
    next(error);
  }
};
