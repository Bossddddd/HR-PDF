'use client';

import { useRole, Role } from '@/app/context/RoleContext';

export default function RoleSwitcher() {
  const { role, setRole } = useRole();
  const roles: Role[] = ['ผู้ใช้ทั่วไป (User)', 'หัวหน้างาน / HR', 'ผู้จัดการ (Manager)', 'ผู้บริหาร (Executive)', 'ผู้ดูแลระบบ (Admin)'];

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 bg-white/90 backdrop-blur shadow-2xl border border-slate-200 p-3 rounded-2xl w-64">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
        🔐 จำลองสิทธิ์ (Mock Role)
      </div>
      {roles.map(r => (
        <button
          key={r}
          onClick={() => setRole(r)}
          className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-all ${
            role === r 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
