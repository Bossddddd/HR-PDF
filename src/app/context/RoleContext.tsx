'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUsers } from '@/app/actions/users';
import { getRoles } from '@/app/actions/roles';

export interface Role {
  id: string;
  name: string;
  description: string | null;
  level: number;
  permissions: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  roleId: string;
  role: Role;
}

interface RoleContextType {
  user: User | null;
  users: User[];
  role: Role | null;
  roles: Role[];
  setUser: (username: string) => void;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [role, setRoleState] = useState<Role | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [usersRes, rolesRes] = await Promise.all([getUsers(), getRoles()]);
      
      if (rolesRes.success && rolesRes.roles) {
        setRoles(rolesRes.roles);
      }

      if (usersRes.success && usersRes.users && usersRes.users.length > 0) {
        setUsers(usersRes.users);
        const savedUsername = localStorage.getItem('mockUser');
        const found = usersRes.users.find((u: User) => u.username === savedUsername);
        
        if (found) {
          setUserState(found);
          setRoleState(found.role);
        } else {
          // Default to the first user
          const defaultUser = usersRes.users[0];
          setUserState(defaultUser);
          setRoleState(defaultUser.role);
          localStorage.setItem('mockUser', defaultUser.username);
        }
      } else {
        // Fallback if no users exist: Admin mock role
        const fallbackRole = {
          id: 'mock-admin',
          name: 'ผู้ดูแลระบบ (Admin)',
          description: 'Mock System Admin',
          level: 100,
          permissions: '[]'
        };
        setRoleState(fallbackRole);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const setUser = (newUsername: string) => {
    const found = users.find(u => u.username === newUsername);
    if (found) {
      setUserState(found);
      setRoleState(found.role);
      localStorage.setItem('mockUser', newUsername);
      window.location.reload();
    }
  };

  return (
    <RoleContext.Provider value={{ user, users, role, roles, setUser, isLoading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
