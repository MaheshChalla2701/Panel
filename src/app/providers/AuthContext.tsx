import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { repository } from '../../services/api/repository';

interface AuthContextType {
  currentUser: User;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  availableUsers: User[];
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'Panel_current_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(repository.getUsers());
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem(CURRENT_USER_KEY) || 'user-stu-1';
  });

  useEffect(() => {
    return repository.subscribe(() => {
      setUsers(repository.getUsers());
    });
  }, []);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
    localStorage.setItem(CURRENT_USER_KEY, userId);
  };

  const switchRole = (role: UserRole) => {
    // Pick the primary demo persona for this role
    let targetUser: User | undefined;
    if (role === 'STUDENT') {
      targetUser = users.find((u) => u.id === 'user-stu-1');
    } else if (role === 'INTERVIEWER') {
      targetUser = users.find((u) => u.id === 'user-int-1');
    } else if (role === 'ADMIN') {
      targetUser = users.find((u) => u.id === 'user-adm-1');
    }
    if (targetUser) {
      switchUser(targetUser.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchUser,
        switchRole,
        availableUsers: users,
        isDemoMode: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

