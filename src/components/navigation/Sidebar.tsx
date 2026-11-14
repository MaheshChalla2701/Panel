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
  ShieldCheck,
  CalendarRange,
  History,
  FileCheck2,
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
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/badge-eligibility', label: 'Badge Eligibility', icon: CheckSquare },
    { to: '/book-interview', label: 'Book Interview', icon: Calendar },
    { to: '/my-interviews', label: 'My Interviews', icon: Clock },
    { to: '/badge-status', label: 'Badge & Results', icon: Award },
  ];

  const interviewerLinks: NavItem[] = [
    { to: '/interviewer', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/interviewer/availability', label: 'Manage Availability', icon: CalendarRange },
    { to: '/interviewer/schedule', label: 'Schedule', icon: Calendar },
    { to: '/interviewer/evaluations', label: 'Evaluation Records', icon: FileCheck2 },
  ];

  const adminLinks: NavItem[] = [
    { to: '/admin', label: 'Operations Overview', icon: LayoutDashboard },
    { to: '/admin/eligible-students', label: 'Eligible Students', icon: Users, badge: 'Pipeline' },
    { to: '/admin/interviews', label: 'Schedule Operations', icon: Calendar },
    { to: '/admin/interviewers', label: 'Interviewer Roster', icon: UserCheck },
    { to: '/admin/malpractice', label: 'Malpractice Inquiries', icon: ShieldCheck },
    { to: '/admin/audit-logs', label: 'Audit Log', icon: History },
  ];

  const links = role === 'STUDENT' ? studentLinks : role === 'INTERVIEWER' ? interviewerLinks : adminLinks;

  return (
    <aside className="workspace-sidebar">
      {/* Workspace Role Label */}
      <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
          {role.toLowerCase()}
        </span>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200/60">
          Workspace
        </span>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Workspace navigation" className="flex-1 p-2 space-y-0.5">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/' || link.to === '/interviewer' || link.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-950 font-medium'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-zinc-600" />
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.2 rounded font-medium border border-zinc-200/80">
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Subtle Footer Note */}
      <div className="p-4 border-t border-zinc-100 text-[11px] text-zinc-400">
        <div>GRIT Platform 2026</div>
        <div className="text-[10px] text-zinc-400/80 mt-0.5">NIAT Academic Integrity</div>
      </div>
    </aside>
  );
};
