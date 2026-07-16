'use client';

import { useState, useEffect } from 'react';
import { getRoles, createRole, updateRole, deleteRole } from '@/app/actions/roles';
import { toast } from 'sonner';
import RoleGuard from '@/components/RoleGuard';

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState(10);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    const res = await getRoles();
    if (res.success && res.roles) {
      setRoles(res.roles);
    }
    setLoading(false);
  };

  const openModal = (role?: any) => {
    if (role) {
      setEditingId(role.id);
      setName(role.name);
      setDescription(role.description || '');
      setLevel(role.level);
      try {
        const perms = typeof role.permissions === 'string' ? JSON.parse(role.permissions || '[]') : (role.permissions || []);
        setPermissions(Array.isArray(perms) ? perms : []);
      } catch (e) {
        setPermissions([]);
      }
    } else {
      setEditingId(null);
      setName('');
      setDescription('');
      setLevel(10);
      setPermissions([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('กรุณาระบุชื่อ Role');
    
    setIsSubmitting(true);
    let res;
    const permsJson = JSON.stringify(permissions);
    if (editingId) {
      res = await updateRole(editingId, name, description, level, permsJson);
    } else {
      res = await createRole(name, description, level, permsJson);
    }

    if (res.success) {
      toast.success(editingId ? 'แก้ไข Role สำเร็จ' : 'สร้าง Role ใหม่สำเร็จ');
      setIsModalOpen(false);
      loadRoles();
    } else {
      toast.error(res.error || 'เกิดข้อผิดพลาด');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, isSystem: boolean) => {
    if (isSystem) {
      return toast.error('ไม่สามารถลบ System Role ได้');
    }
    if (!confirm('ยืนยันการลบ Role นี้? (หากลบแล้วผู้ใช้ที่ใช้ Role นี้อาจมีปัญหา)')) return;
    
    const res = await deleteRole(id);
    if (res.success) {
      toast.success('ลบ Role สำเร็จ');
      loadRoles();
    } else {
      toast.error(res.error || 'เกิดข้อผิดพลาดในการลบ');
    }
  };

  return (
    <RoleGuard requiredLevel={100}>
      <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">จัดการสิทธิ์ (Roles)</h1>
          <p className="text-slate-500 mt-2">จัดการระดับสิทธิ์การเข้าถึง และบทบาทในระบบ</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors"
        >
          + เพิ่ม Role ใหม่
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">กำลังโหลดข้อมูล...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">ชื่อ Role</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">คำอธิบาย</th>
                <th className="p-4 font-medium text-sm text-slate-600">ระดับ (Level)</th>
                <th className="p-4 font-medium text-sm text-slate-600">สิทธิ์เข้าถึง (Permissions)</th>
                <th className="p-4 font-medium text-sm text-slate-600 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roles.map(role => {
                let permCount = 0;
                try {
                  const p = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : (role.permissions || []);
                  permCount = Array.isArray(p) ? p.length : 0;
                } catch (e) {}

                return (
                  <tr key={role.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-800">{role.name}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{role.description || '-'}</td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                        {role.level === 100 ? 'Admin (100)' : `Level ${role.level}`}
                      </span>
                    </td>
                    <td className="p-4">
                      {role.level >= 100 ? (
                        <span className="text-xs text-slate-400">เข้าถึงได้ทุกเมนู</span>
                      ) : (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{permCount} เมนู</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => openModal(role)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                        แก้ไข
                      </button>
                      {!role.isSystem && (
                        <button onClick={() => handleDelete(role.id, role.isSystem)} className="text-red-500 hover:text-red-700 font-medium text-sm">
                          ลบ
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">ยังไม่มี Role ในระบบ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">{editingId ? 'แก้ไข Role' : 'สร้าง Role ใหม่'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">ชื่อ Role <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
                  placeholder="เช่น พนักงานบัญชี"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">คำอธิบาย</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
                  placeholder="รายละเอียดหน้าที่..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">ระดับสิทธิ์ (Level 0 - 100)</label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  value={level}
                  onChange={e => setLevel(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">Level 100 = Admin (เห็นได้ทุกหน้า), Level 10 = User (เห็นเฉพาะเอกสารตัวเอง)</p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">สิทธิ์การเข้าถึงเมนู (Permissions)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {[
                      { id: 'admin_dashboard', label: '📊 หน้าแรก (Dashboard)' },
                      { id: 'admin_workflows', label: '📄 จัดการสายอนุมัติ' },
                      { id: 'admin_documents', label: '📑 คลังแม่แบบเอกสาร' },
                      { id: 'admin_roles', label: '👥 จัดการสิทธิ์' },
                      { id: 'admin_users', label: '🧑‍💼 จัดการพนักงาน' },
                      { id: 'admin_responses', label: '📥 คำตอบและเอกสาร' },
                      { id: 'admin_logs', label: '🕒 บันทึกการใช้งาน' },
                      { id: 'admin_settings', label: '⚙️ ตั้งค่าระบบ' },
                    ].map(perm => (
                      <label key={perm.id} className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 border-slate-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={permissions.includes(perm.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPermissions([...permissions, perm.id]);
                              } else {
                                setPermissions(permissions.filter(p => p !== perm.id));
                              }
                            }}
                          />
                        </div>
                        <span className="text-sm text-slate-700 group-hover:text-slate-900">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </RoleGuard>
  );
}
