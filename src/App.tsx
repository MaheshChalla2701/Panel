import React from 'react';
import { AuthProvider } from './app/providers/AuthContext';
import { ToastProvider } from './app/providers/ToastContext';
import { AppRouter } from './app/router/AppRouter';
import { isSupabaseConfigured } from './services/supabase/client';
import { LiveApp } from './app/LiveApp';

export const App: React.FC = () => {
  const assignmentDemoMode = localStorage.getItem('Panel_assignment_demo_mode') === 'true';

  return (
    <ToastProvider>
      {isSupabaseConfigured && !assignmentDemoMode ? (
        <LiveApp />
      ) : (
        <AuthProvider>
        <AppRouter />
        </AuthProvider>
      )}
    </ToastProvider>
  );
};

export default App;

