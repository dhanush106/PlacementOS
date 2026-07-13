import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import AuthLayout from '../../components/Layout/AuthLayout.jsx';

const VerifyEmail = () => {
  const { verifyEmailOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      setError('Invalid verification link. Missing email parameter.');
    }
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      await verifyEmailOtp(email, otp);
      setSuccess('Email verified successfully! You can now log in.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || 'Verification failed. Please check your code and try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full">
        <h2 className="text-2xl font-bold text-white mb-2">Verify your email</h2>
        <p className="text-slate-400 text-sm mb-6">
          We have sent a 6-digit verification code to <span className="text-white font-semibold">{email}</span>. Please enter it below.
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

        <form onSubmit={handleSubmit} className="space-y-6">
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
              disabled={loading || !email}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-400">
          Didn't receive code? Check your spam folder or server console output. Or{' '}
          <Link to="/register" className="text-primary hover:underline font-semibold">
            try registering again
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
