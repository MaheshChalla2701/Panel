import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Clock,
  Award,
  Users,
  Settings,
  ShieldCheck,
  FileSpreadsheet,
  CalendarRange,
  History,
  FileCheck2,
  BookOpen,
  UserCheck,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentUser } = useAuth();
  const role = currentUser.role;

  interface NavItem {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  const studentLinks: NavItem[] = [
    { to: '/', label: 'Student Home', icon: LayoutDashboard },
    { to: '/badge-eligibility', label: 'Badge Eligibility', icon: CheckSquare },
    { to: '/book-interview', label: 'Book Interview', icon: Calendar },
    { to: '/my-interviews', label: 'My Interviews', icon: Clock },
    { to: '/badge-status', label: 'Badge & Results', icon: Award },
  ];

  const interviewerLinks: NavItem[] = [
    { to: '/interviewer', label: 'Interviewer Dashboard', icon: LayoutDashboard },
    { to: '/interviewer/availability', label: 'Manage Availability', icon: CalendarRange },
    { to: '/interviewer/schedule', label: 'Daily & Weekly Schedule', icon: Calendar },
    { to: '/interviewer/evaluations', label: 'Evaluation Records', icon: FileCheck2 },
  ];

  const adminLinks: NavItem[] = [
    { to: '/admin', label: 'Operations Overview', icon: LayoutDashboard },
    { to: '/admin/eligible-students', label: 'Eligible Students', icon: Users, badge: 'Key' },
    { to: '/admin/interviews', label: 'Interview Operations', icon: Calendar },
    { to: '/admin/interviewers', label: 'Interviewer Capacity', icon: UserCheck },
    { to: '/admin/malpractice', label: 'Malpractice Inquiries', icon: ShieldCheck },
    { to: '/admin/audit-logs', label: 'System Audit Log', icon: History },
  ];

  const links = role === 'STUDENT' ? studentLinks : role === 'INTERVIEWER' ? interviewerLinks : adminLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col flex-shrink-0 min-h-[calc(100vh-64px)]">
      {/* Role Indicator Banner */}
      <div className="p-4 border-b border-slate-100">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Active Workspace
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900 text-sm capitalize">
            {role.toLowerCase()} Portal
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            v1.0
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/' || link.to === '/interviewer' || link.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer: Quick Documentation Link */}
      <div className="p-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700">NIAT GRIT Program</span>
          <span className="text-emerald-600 font-bold">Live</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-normal">
          AI Models, Applied GenAI, UI Engineering & Data Science Tracks.
        </p>
      </div>
    </aside>
  );
};
