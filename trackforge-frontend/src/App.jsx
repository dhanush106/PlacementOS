import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import VerifyEmail from './pages/Auth/VerifyEmail.jsx';
import ForgotPassword from './pages/Auth/ForgotPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Planner from './pages/Planner.jsx';
import Settings from './pages/Settings.jsx';
import HabitTracker from './pages/HabitTracker.jsx';
import LeetcodeTracker from './pages/leetcode/LeetcodeModule.jsx';
import CoreSubjects from './pages/CoreSubjects.jsx';
import SystemDesign from './pages/SystemDesign.jsx';
import KanbanBoard from './pages/KanbanBoard.jsx';
import Pomodoro from './pages/Pomodoro.jsx';
import Analytics from './pages/Analytics.jsx';
import DashboardLayout from './components/Layout/DashboardLayout.jsx';

// Placeholders for modules not yet implemented (all implemented!)

const PlaceholderPage = ({ name }) => (
  <div className="p-6 border border-slate-800 bg-slate-900/20 rounded-2xl text-center py-20">
    <h2 className="text-xl font-bold text-white mb-2">{name}</h2>
    <p className="text-slate-400 text-sm">This module is part of the placement roadmap. Full implementation coming soon!</p>
  </div>
);

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

// Public Route Wrapper (redirects to home if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Application Routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/planner" element={<ProtectedRoute><Planner /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/habits" element={<ProtectedRoute><HabitTracker /></ProtectedRoute>} />
          <Route path="/leetcode" element={<ProtectedRoute><LeetcodeTracker /></ProtectedRoute>} />
          <Route path="/subjects" element={<ProtectedRoute><CoreSubjects /></ProtectedRoute>} />
          <Route path="/system-design" element={<ProtectedRoute><SystemDesign /></ProtectedRoute>} />
          <Route path="/kanban" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
          <Route path="/pomodoro" element={<ProtectedRoute><Pomodoro /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

          {/* Fallback to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
