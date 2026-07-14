import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Trash2, ShieldAlert,
  AlertTriangle, KeyRound, Briefcase, GraduationCap, MapPin, Phone
} from 'lucide-react';

const Settings = () => {
  const { user, loginUser } = useAuth();
  const navigate = useNavigate();

  // Profile Form State
  const [profile, setProfile] = useState({
    name: '', college: '', batchYear: '', targetRole: '', targetPackage: '',
    targetCompanies: '', preferredInterviewDate: '', bio: '', phone: '',
    location: '', interviewTopics: ''
  });

  // Security Credentials State
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [deleteForm, setDeleteForm] = useState({ password: '', reason: '' });

  // UI States
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', error: false });

  const showToast = (msg, error = false) => {
    setToast({ show: true, msg, error });
    setTimeout(() => setToast({ show: false, msg: '', error: false }), 4500);
  };

  // Load User Data
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        college: user.college || '',
        batchYear: user.batchYear || '',
        targetRole: user.targetRole || '',
        targetPackage: user.targetPackage || '',
        targetCompanies: Array.isArray(user.targetCompanies) ? user.targetCompanies.join(', ') : '',
        preferredInterviewDate: user.preferredInterviewDate ? new Date(user.preferredInterviewDate).toISOString().split('T')[0] : '',
        bio: user.bio || '',
        phone: user.phone || '',
        location: user.location || '',
        interviewTopics: Array.isArray(user.interviewTopics) ? user.interviewTopics.join(', ') : ''
      });
    }
  }, [user]);

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const companies = profile.targetCompanies.split(',').map(c => c.trim()).filter(Boolean);
      const topics = profile.interviewTopics.split(',').map(t => t.trim()).filter(Boolean);

      const res = await api.patch('/users/profile', {
        ...profile,
        targetCompanies: companies,
        interviewTopics: topics,
        batchYear: profile.batchYear ? parseInt(profile.batchYear) : undefined
      });

      // Update local storage user profile cache
      const updatedUser = { ...user, ...res.data.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      showToast('Profile updated successfully! ✨');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to update profile';
      showToast(msg, true);
    } finally {
      setLoading(false);
    }
  };

  // Handle Change Email
  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/users/change-email', emailForm);
      showToast('Verification code sent to your new email! Redirecting...', false);
      
      // Clear login session tokens & local cache because email changes unverify account
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      setTimeout(() => {
        navigate('/verify-email', { state: { email: emailForm.newEmail } });
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to request email change';
      showToast(msg, true);
    } finally {
      setLoading(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!window.confirm('WARNING: Are you absolutely sure you want to delete your account? This will schedule deletion in 30 days.')) return;
    
    setLoading(true);
    try {
      await api.delete('/users/account', { data: deleteForm });
      showToast('Account soft deleted. Logging out...', false);
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to delete account';
      showToast(msg, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast Alert */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all ${toast.error ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          Profile Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">Manage your developer profile and account credentials.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Profile Summary */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-4">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-slate-850 border-2 border-slate-800 flex items-center justify-center overflow-hidden mx-auto shadow-inner">
                {user?.name ? (
                  <span className="text-4xl font-black text-primary">{user.name.charAt(0).toUpperCase()}</span>
                ) : (
                  <User size={36} className="text-slate-500" />
                )}
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{user?.name || 'Developer'}</h2>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <div className="pt-4 border-t border-slate-850 grid grid-cols-2 gap-2 text-left">
              <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Target Role</p>
                <p className="text-xs text-slate-200 font-semibold truncate mt-0.5">{user?.targetRole || 'SDE'}</p>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold">College</p>
                <p className="text-xs text-slate-200 font-semibold truncate mt-0.5">{user?.college || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Edit Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Info Form */}
          <form onSubmit={handleUpdateProfile} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
            <h3 className="text-base font-bold text-slate-200 pb-2 border-b border-slate-800 flex items-center gap-2">
              <User size={16} className="text-primary" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Full Name *</label>
                <input type="text" value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">College</label>
                <div className="relative">
                  <GraduationCap size={14} className="absolute left-3 top-3 text-slate-500" />
                  <input type="text" value={profile.college} onChange={e=>setProfile(p=>({...p,college:e.target.value}))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Batch Year</label>
                <input type="number" value={profile.batchYear} onChange={e=>setProfile(p=>({...p,batchYear:e.target.value}))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Target Role</label>
                <div className="relative">
                  <Briefcase size={14} className="absolute left-3 top-3 text-slate-500" />
                  <input type="text" value={profile.targetRole} onChange={e=>setProfile(p=>({...p,targetRole:e.target.value}))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Target Package (LPA/USD)</label>
                <input type="text" value={profile.targetPackage} onChange={e=>setProfile(p=>({...p,targetPackage:e.target.value}))} placeholder="e.g. 15 LPA"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Preferred Interview Date</label>
                <input type="date" value={profile.preferredInterviewDate} onChange={e=>setProfile(p=>({...p,preferredInterviewDate:e.target.value}))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Phone Number</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-3 text-slate-500" />
                  <input type="text" value={profile.phone} onChange={e=>setProfile(p=>({...p,phone:e.target.value}))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Location</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-3 text-slate-500" />
                  <input type="text" value={profile.location} onChange={e=>setProfile(p=>({...p,location:e.target.value}))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Target Companies (comma separated)</label>
              <input type="text" value={profile.targetCompanies} onChange={e=>setProfile(p=>({...p,targetCompanies:e.target.value}))} placeholder="e.g. Google, Microsoft, Amazon"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Interview Topics of Interest (comma separated)</label>
              <input type="text" value={profile.interviewTopics} onChange={e=>setProfile(p=>({...p,interviewTopics:e.target.value}))} placeholder="e.g. System Design, Dynamic Programming, DBMS"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Bio</label>
              <textarea value={profile.bio} onChange={e=>setProfile(p=>({...p,bio:e.target.value}))} rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary resize-none" />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>

          {/* Change Email Form */}
          <form onSubmit={handleChangeEmail} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
            <h3 className="text-base font-bold text-slate-200 pb-2 border-b border-slate-800 flex items-center gap-2">
              <Mail size={16} className="text-indigo-400" /> Change Registered Email
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">New Email Address</label>
                <input type="email" value={emailForm.newEmail} onChange={e=>setEmailForm(p=>({...p,newEmail:e.target.value}))} required placeholder="dev@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Confirm Current Password</label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3 top-3 text-slate-500" />
                  <input type="password" value={emailForm.password} onChange={e=>setEmailForm(p=>({...p,password:e.target.value}))} required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="px-6 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
                {loading ? 'Updating Email...' : 'Request Email Change'}
              </button>
            </div>
          </form>

          {/* Danger Zone: Account Deletion */}
          <form onSubmit={handleDeleteAccount} className="p-6 rounded-2xl border border-red-950 bg-red-950/5 space-y-4">
            <h3 className="text-base font-bold text-red-400 pb-2 border-b border-red-950 flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-400" /> Danger Zone
            </h3>
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-3 text-red-300 text-xs">
              <AlertTriangle className="shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-bold">Deactivating your profile</p>
                <p className="mt-1 leading-relaxed">Deleting your account is soft-coded. Your files, analytics, habits, and tasks will be disabled, but you have 30 days to restore your account before permanent deletion.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Reason for leaving (Optional)</label>
                <input type="text" value={deleteForm.reason} onChange={e=>setDeleteForm(p=>({...p,reason:e.target.value}))} placeholder="e.g. Too busy"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-red-400">Verify Password to Confirm *</label>
                <input type="password" value={deleteForm.password} onChange={e=>setDeleteForm(p=>({...p,password:e.target.value}))} required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5 disabled:opacity-50">
                <Trash2 size={14} /> Delete Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
