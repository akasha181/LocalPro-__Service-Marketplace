import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { ChatDrawer } from './ChatDrawer';
import { Wrench, LogOut, Shield, Briefcase, Calendar, Compass, Heart, MessageSquare } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Wrench className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Local<span className="text-blue-600">Pro</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/explore"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4" />
            Explore Services
          </Link>
          {isAuthenticated && user?.role === 'customer' && (
            <Link
              to="/customer/bookings"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              My Bookings
            </Link>
          )}
          {isAuthenticated && user?.role === 'professional' && (
            <Link
              to="/pro/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition flex items-center gap-1.5"
            >
              <Briefcase className="w-4 h-4" />
              Pro Dashboard
            </Link>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <Link
              to="/admin"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition flex items-center gap-1.5 text-amber-600"
            >
              <Shield className="w-4 h-4" />
              Admin Portal
            </Link>
          )}
        </nav>

        {/* User Auth CTAs */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* Messages Trigger */}
              <button
                onClick={() => setIsChatOpen(true)}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                title="Messages"
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              {/* Notification Bell */}
              <NotificationBell />

              <div className="flex items-center gap-2">
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-600/20"
                />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</div>
                  <div className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">{user.role}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Global Messages Drawer */}
      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </header>
  );
};
