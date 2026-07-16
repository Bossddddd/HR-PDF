'use client';

import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '@/app/actions/users';
import { getRoles } from '@/app/actions/roles';
import { toast } from 'sonner';
import RoleGuard from '@/components/RoleGuard';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [usersRes, rolesRes] = await Promise.all([getUsers(), getRoles()]);
    if (usersRes.success && usersRes.users) {
      setUsers(usersRes.users);
    }
    if (rolesRes.success && rolesRes.roles) {
      setRoles(rolesRes.roles);
      if (rolesRes.roles.length > 0 && !roleId) {
        setRoleId(rolesRes.roles[0].id);
      }
    }
    setLoading(false);
  };

  const openModal = (user?: any) => {
    if (user) {
      setEditingId(user.id);
      setName(user.name);
      setUsername(user.username);
      setRoleId(user.roleId);
    } else {
      setEditingId(null);
      setName('');
      setUsername('');
      if (roles.length > 0) setRoleId(roles[0].id);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('กรุณาระบุชื่อ-นามสกุล');
    if (!username.trim()) return toast.error('กรุณาระบุ Username');
    if (!roleId) return toast.error('กรุณาเลือก Role');
    
    setIsSubmitting(true);
    let res;
    if (editingId) {
      res = await updateUser(editingId, name, username, roleId);
    } else {
      res = await createUser(name, username, roleId);
    }

    if (res.success) {
      toast.success(editingId ? 'แก้ไขบัญชีผู้ใช้สำเร็จ' : 'สร้างบัญชีผู้ใช้สำเร็จ');
      setIsModalOpen(false);
      loadData();
    } else {
      toast.error(res.error || 'เกิดข้อผิดพลาด');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`ยืนยันการลบบัญชีของ ${name}?`)) return;
    
    const res = await deleteUser(id);
    if (res.success) {
      toast.success('ลบบัญชีผู้ใช้สำเร็จ');
      loadData();
    } else {
      toast.error(res.error || 'เกิดข้อผิดพลาดในการลบ');
    }
  };

  return (
    <RoleGuard requiredLevel={100}>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">จัดการพนักงาน (Users)</h1>
            <p className="text-slate-500 mt-2">เพิ่ม/ลบ บัญชีผู้ใช้งานระบบ และกำหนด Role</p>
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            เพิ่มพนักงานใหม่
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">กำลังโหลดข้อมูล...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                    <th className="p-4 font-medium">ชื่อ-นามสกุล</th>
                    <th className="p-4 font-medium">Username</th>
                    <th className="p-4 font-medium">ตำแหน่ง (Role)</th>
                    <th className="p-4 font-medium text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">ยังไม่มีบัญชีผู้ใช้งานในระบบ</td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-medium text-slate-800">
                          {user.name}
                        </td>
                        <td className="p-4 text-slate-600">
                          {user.username}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.role?.name || 'ไม่มี Role'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => openModal(user)}
                              className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="แก้ไข"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                            <button 
                              onClick={() => handleDelete(user.id, user.name)}
                              className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="ลบ"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800">
                  {editingId ? 'แก้ไขบัญชีผู้ใช้' : 'เพิ่มบัญชีผู้ใช้ใหม่'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder="เช่น สมชาย ใจดี"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Username <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder="เช่น somchai.j"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ตำแหน่ง (Role) <span className="text-red-500">*</span></label>
                    <select 
                      value={roleId}
                      onChange={e => setRoleId(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white"
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all"
                  >
                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
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
