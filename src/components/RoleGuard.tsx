'use client';

import { useRole } from '@/app/context/RoleContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredLevel?: number;
  requiredPermission?: string;
  fallbackUrl?: string;
}

export default function RoleGuard({ 
  children, 
  requiredLevel = 100, 
  requiredPermission,
  fallbackUrl = '/inbox' 
}: RoleGuardProps) {
  const { role, isLoading } = useRole();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading && role) {
      const level = role.level || 0;
      let hasAccess = level >= requiredLevel;
      
      if (requiredPermission && role.permissions) {
        try {
          const perms = typeof role.permissions === 'string' 
            ? JSON.parse(role.permissions) 
            : role.permissions;
          hasAccess = perms.includes(requiredPermission) || level >= 100;
        } catch (e) {
          hasAccess = false;
        }
      }
      
      setIsAuthorized(hasAccess);
      
      if (!hasAccess) {
        toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        router.replace(fallbackUrl);
      }
    } else if (!isLoading && !role) {
      router.replace('/');
    }
  }, [role, isLoading, router, requiredLevel, requiredPermission, fallbackUrl]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
