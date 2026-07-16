'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Role = 'ผู้ใช้ทั่วไป (User)' | 'หัวหน้างาน / HR' | 'ผู้จัดการ (Manager)' | 'ผู้บริหาร (Executive)' | 'ผู้ดูแลระบบ (Admin)';

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>('ผู้ใช้ทั่วไป (User)');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem('mockRole') as Role;
    if (savedRole) {
      setRoleState(savedRole);
    }
    setMounted(true);
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem('mockRole', newRole);
    window.location.reload(); // Reload to apply layout/protection changes
  };

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <RoleContext.Provider value={{ role, setRole }}>
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
