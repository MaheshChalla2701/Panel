import React, { useState } from 'react';
import { useAuth } from '../../app/providers/AuthContext';
import { repository } from '../../services/api/repository';
import {
  Bell,
  ChevronDown,
  Check,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  const { currentUser, switchUser, availableUsers } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifications = repository.getNotifications(currentUser.id);
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handleMarkAllRead = () => {
    repository.markAllNotificationsRead(currentUser.id);
  };

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-zinc-200/80 sticky top-0 z-30">
      <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center font-bold tracking-tight text-xs shadow-xs">
              G
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-950 text-sm tracking-tight">
                GRIT Interview Hub
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                NIAT
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Track Context */}
        <div className="hidden md:flex items-center text-[11px] text-zinc-500 gap-1.5 font-medium">
          <span className="text-zinc-400">Track:</span>
          <span className="text-zinc-800">AI Models Mastery</span>
          <span className="text-zinc-300">•</span>
          <span className="text-zinc-500">Cohort 2026</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Notification Centre */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-zinc-900 rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-elevated border border-zinc-200 py-1 z-50 animate-in fade-in-50">
                <div className="px-3 py-2 border-b border-zinc-100 flex items-center justify-between">
                  <span className="font-medium text-xs text-zinc-900">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-zinc-500 hover:text-zinc-900"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-400">No new notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => repository.markNotificationRead(n.id)}
                        className={`p-3 hover:bg-zinc-50/80 transition cursor-pointer text-left ${
                          !n.readAt ? 'bg-zinc-50/50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-medium text-zinc-900">{n.title}</span>
                          <span className="text-[10px] text-zinc-400">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 leading-snug">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Demo Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors border border-zinc-200/80"
            >
              <div className="w-5 h-5 rounded-full bg-zinc-900 text-white font-medium text-[10px] flex items-center justify-center overflow-hidden">
                {currentUser.fullName.slice(0, 1).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-medium text-zinc-900 leading-tight">{currentUser.fullName}</div>
              </div>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-elevated border border-zinc-200 py-1.5 z-50 animate-in fade-in-50 text-xs">
                <div className="px-3 py-2 border-b border-zinc-100">
                  <div className="font-medium text-zinc-900">{currentUser.fullName}</div>
                  <div className="text-[11px] text-zinc-500">{currentUser.email}</div>
                  <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700">
                    <span className="w-1 h-1 rounded-full bg-zinc-500"></span>
                    {currentUser.role}
                  </div>
                </div>

                <div className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                  Switch Demo Account
                </div>

                <div className="max-h-60 overflow-y-auto">
                  {availableUsers.slice(0, 6).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-zinc-50 transition-colors ${
                        u.id === currentUser.id ? 'bg-zinc-50 font-medium text-zinc-950' : 'text-zinc-600'
                      }`}
                    >
                      <div className="truncate">
                        <div className="text-xs">{u.fullName}</div>
                        <div className="text-[10px] text-zinc-400 capitalize">{u.role.toLowerCase()}</div>
                      </div>
                      {u.id === currentUser.id && <Check className="w-3.5 h-3.5 text-zinc-900" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
