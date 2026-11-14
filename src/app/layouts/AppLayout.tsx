import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../../components/navigation/Header';
import { Sidebar } from '../../components/navigation/Sidebar';
import { BeforeAfterDemoBar } from '../../components/common/BeforeAfterDemoBar';
import { isSupabaseConfigured } from '../../services/supabase/client';

export const AppLayout: React.FC = () => {
  return (
    <div className="Panel-workspace min-h-screen flex flex-col text-zinc-950">
      {/* Interactive Demonstration Switcher Bar */}
      <BeforeAfterDemoBar />
      {isSupabaseConfigured && (
        <div className="bg-indigo-700 px-4 py-2 text-center text-xs font-medium text-white">
          Assignment demo mode is using safe local scenario data.
          <button type="button" className="ml-3 underline underline-offset-2" onClick={() => { localStorage.removeItem('Panel_assignment_demo_mode'); window.location.reload(); }}>Return to live sign-in</button>
        </div>
      )}

      {/* Main App Header */}
      <Header />

      {/* Body with Sidebar and Main Content */}
      <div className="workspace-body flex-1 flex">
        <Sidebar />
        <main className="workspace-content flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
