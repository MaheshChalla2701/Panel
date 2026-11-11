import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../../components/navigation/Header';
import { Sidebar } from '../../components/navigation/Sidebar';
import { BeforeAfterDemoBar } from '../../components/common/BeforeAfterDemoBar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Interactive Demonstration Switcher Bar (Part 6) */}
      <BeforeAfterDemoBar />

      {/* Main App Header */}
      <Header />

      {/* Body with Sidebar and Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
