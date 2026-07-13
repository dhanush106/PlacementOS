import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import AuthLayout from '../../components/Layout/AuthLayout.jsx';

const ForgotPassword = () => {
  const { requestPasswordReset, verifyPasswordResetOtp, completePasswordReset } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Request, 2: Verify, 3: Complete
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [passwords, setPasswords] = useState({ password: '', confirm: '' });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) return;

    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSuccess('If the email is registered, an OTP code has been sent to it.');
      setTimeout(() => {
        setSuccess('');
        setStep(2);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to request reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp) return;

    setLoading(true);
    try {
      const res = await verifyPasswordResetOtp(email, otp);
      setResetToken(res.data.resetToken);
      setSuccess('Verification successful! You can now set your new password.');
      setTimeout(() => {
        setSuccess('');
        setStep(3);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!passwords.password || !passwords.confirm) return;

    if (passwords.password !== passwords.confirm) {
      setError('Passwords do not match.');
      return;
    }

    if (passwords.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await completePasswordReset(resetToken, passwords.password);
      setSuccess('Password updated successfully. Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full">
        <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
        <p className="text-slate-400 text-sm mb-6">
          {step === 1 && 'Enter your email address to receive a password reset verification code.'}
          {step === 2 && 'Enter the 6-digit code sent to your email to verify identity.'}
          {step === 3 && 'Enter your new secure password.'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            {success}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition"
                placeholder="name@college.edu"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition mt-4 disabled:opacity-50"
            >
              {loading ? 'Sending Code...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">Verification Code (6 Digits)</label>
              <input
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-2xl font-bold tracking-[8px] text-center text-primary-light focus:outline-none focus:border-primary transition"
                placeholder="000000"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleCompleteReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                value={passwords.password}
                onChange={(e) => setPasswords(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !passwords.password || !passwords.confirm}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-xs">
          <Link to="/login" className="text-primary hover:underline font-semibold">
            Back to Log in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
