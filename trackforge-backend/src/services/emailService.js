import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@trackforge.com';

let transporter;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587'),
    secure: parseInt(SMTP_PORT || '587') === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
  logger.info('SMTP Email Transporter configured.');
} else {
  logger.info('SMTP credentials not fully set. Email service will run in Console/Mock mode.');
}

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (transporter) {
      const info = await transporter.sendMail({
        from: SMTP_FROM,
        to,
        subject,
        text,
        html
      });
      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } else {
      logger.info(`[MOCK EMAIL SENT]
========================================
To: ${to}
Subject: ${subject}
Text: ${text || 'See HTML body'}
----------------------------------------
HTML Content:
${html}
========================================`);
      return { messageId: 'mock_message_id_123' };
    }
  } catch (error) {
    logger.error(`Error sending email to ${to}: ${error.message}`);
    throw error;
  }
};

export const sendVerificationEmail = async (email, name, otp) => {
  const subject = 'Verify your TrackForge Account';
  const text = `Hi ${name}, your verification code is ${otp}. It will expire in 24 hours.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #0f172a; color: #f1f5f9;">
      <h2 style="color: #6366f1; text-align: center;">Welcome to TrackForge!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for registering. Please use the verification code below to verify your account and get started on your placement preparation operating system:</p>
      <div style="font-size: 28px; font-weight: bold; text-align: center; letter-spacing: 4px; padding: 15px; margin: 20px 0; background-color: #1e293b; border-radius: 6px; color: #818cf8; border: 1px solid #334155;">
        ${otp}
      </div>
      <p style="font-size: 14px; color: #94a3b8; text-align: center;">This code will expire in 24 hours.</p>
    </div>
  `;
  return sendEmail({ to: email, subject, text, html });
};

export const sendPasswordResetEmail = async (email, name, otp) => {
  const subject = 'Reset your TrackForge Password';
  const text = `Hi ${name}, your password reset verification code is ${otp}. It will expire in 1 hour.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #0f172a; color: #f1f5f9;">
      <h2 style="color: #ef4444; text-align: center;">Reset your Password</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Please use the verification code below to authorize the password reset:</p>
      <div style="font-size: 28px; font-weight: bold; text-align: center; letter-spacing: 4px; padding: 15px; margin: 20px 0; background-color: #1e293b; border-radius: 6px; color: #f87171; border: 1px solid #334155;">
        ${otp}
      </div>
      <p style="font-size: 14px; color: #94a3b8; text-align: center;">This code will expire in 1 hour.</p>
      <p style="font-size: 12px; color: #64748b;">If you did not request this, you can ignore this email.</p>
    </div>
  `;
  return sendEmail({ to: email, subject, text, html });
};
