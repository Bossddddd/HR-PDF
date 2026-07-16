'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getDocumentById, updateDocumentContent } from '@/app/actions/documents';
import { getRoles } from '@/app/actions/roles';
import { uploadImage } from '@/app/actions/upload';

type BlockType = 'heading' | 'paragraph' | 'image' | 'input' | 'date' | 'signature';
type BlockWidth = '100%' | '50%' | '33.33%' | '25%';

interface Block {
  id: string;
  type: BlockType;
  width: BlockWidth;
  content?: string;
  label?: string;
  placeholder?: string;
  assignedRole?: string;
  required?: boolean;
}

export default function DocumentBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const docId = resolvedParams.id;

  const [document, setDocument] = useState<any>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const [docRes, roleRes] = await Promise.all([
        getDocumentById(docId),
        getRoles()
      ]);
      
      if (roleRes.success) {
        setRoles(roleRes.roles || []);
      }

      if (docRes.success && docRes.document) {
        setDocument(docRes.document);
        try {
          if (docRes.document.contentJson) {
            setBlocks(JSON.parse(docRes.document.contentJson));
          }
        } catch (e) {
          console.error('Error parsing blocks', e);
        }
      } else {
        toast.error('ไม่พบเอกสาร');
        router.push('/admin/documents');
      }
      setLoading(false);
    }
    loadData();
  }, [docId, router]);

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      width: '100%',
      content: type === 'heading' ? 'หัวข้อใหม่' : type === 'paragraph' ? 'พิมพ์ข้อความที่นี่...' : '',
      label: type === 'input' ? 'คำถามใหม่' : type === 'date' ? 'วันที่' : type === 'signature' ? 'ลายเซ็น' : '',
      required: false,
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= blocks.length) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + direction];
    newBlocks[index + direction] = temp;
    setBlocks(newBlocks);
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await updateDocumentContent(docId, JSON.stringify(blocks));
    if (res.success) {
      toast.success('บันทึกแม่แบบเรียบร้อยแล้ว');
    } else {
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">กำลังโหลด...</div>;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-200">
      
      {/* Left Sidebar: Tools */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-4 border-b border-slate-100">
          <button onClick={() => router.push('/admin/documents')} className="text-blue-600 text-sm font-bold hover:underline mb-2 flex items-center gap-1">
            &larr; กลับคลังเอกสาร
          </button>
          <h2 className="font-bold text-slate-800 text-lg truncate" title={document?.title}>{document?.title}</h2>
          <p className="text-xs text-slate-500">ออกแบบโครงสร้างและฟิลด์</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">ข้อความ (Text)</h3>
            <div className="space-y-2">
              <button onClick={() => addBlock('heading')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 transition-colors bg-white">
                <span className="text-xl">H</span> <span className="font-medium text-sm">หัวข้อ (Heading)</span>
              </button>
              <button onClick={() => addBlock('paragraph')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 transition-colors bg-white">
                <span className="text-xl">¶</span> <span className="font-medium text-sm">ย่อหน้า (Paragraph)</span>
              </button>
              <button onClick={() => addBlock('image')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 transition-colors bg-white">
                <span className="text-xl">🖼️</span> <span className="font-medium text-sm">รูปภาพ / โลโก้</span>
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">ช่องกรอกข้อมูล (Inputs)</h3>
            <div className="space-y-2">
              <button onClick={() => addBlock('input')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 transition-colors bg-white">
                <span className="text-xl">📝</span> <span className="font-medium text-sm">กล่องข้อความ</span>
              </button>
              <button onClick={() => addBlock('date')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 transition-colors bg-white">
                <span className="text-xl">📅</span> <span className="font-medium text-sm">วันที่ (Date)</span>
              </button>
              <button onClick={() => addBlock('signature')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 transition-colors bg-white">
                <span className="text-xl">✍️</span> <span className="font-medium text-sm">ลายเซ็น (Signature)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Canvas A4 */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center pb-32">
        <div className="w-full max-w-[794px] bg-white min-h-[1123px] shadow-lg border border-slate-300 p-10 flex flex-col gap-4 relative">
          
          <div className="flex flex-wrap gap-y-4 -mx-2">
            {blocks.length === 0 ? (
              <div className="w-full h-64 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-xl m-2">
                <span className="text-4xl mb-2">📄</span>
                <p>หน้ากระดาษว่างเปล่า</p>
                <p className="text-sm">คลิกเครื่องมือด้านซ้ายเพื่อเพิ่มเนื้อหา</p>
              </div>
            ) : (
              blocks.map((block, index) => (
                <div 
                  key={block.id} 
                  className="px-2 group relative"
                  style={{ width: block.width }}
                >
                  <div className="border border-transparent group-hover:border-blue-200 group-hover:bg-blue-50/30 p-2 -m-2 rounded-lg transition-colors relative">
                    
                    {/* Controls overlay */}
                    <div className="absolute -top-10 right-0 bg-slate-800 text-white rounded-lg px-2 py-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-xl">
                      <select 
                        value={block.width}
                        onChange={(e) => updateBlock(block.id, { width: e.target.value as BlockWidth })}
                        className="bg-transparent text-xs outline-none cursor-pointer border-r border-slate-600 pr-1"
                        title="ปรับความกว้าง"
                      >
                        <option value="100%" className="text-slate-800">100%</option>
                        <option value="50%" className="text-slate-800">50%</option>
                        <option value="33.33%" className="text-slate-800">33%</option>
                        <option value="25%" className="text-slate-800">25%</option>
                      </select>
                      
                      <button onClick={() => moveBlock(index, -1)} disabled={index === 0} className="p-1 hover:bg-slate-700 rounded disabled:opacity-30" title="เลื่อนขึ้น">↑</button>
                      <button onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} className="p-1 hover:bg-slate-700 rounded disabled:opacity-30" title="เลื่อนลง">↓</button>
                      <button onClick={() => removeBlock(block.id)} className="p-1 hover:bg-red-500 rounded text-red-200 hover:text-white" title="ลบ">✕</button>
                    </div>

                    {/* Rendering based on type */}
                    {block.type === 'heading' && (
                      <input 
                        type="text" 
                        value={block.content} 
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        className="w-full text-2xl font-bold text-slate-800 bg-transparent border-b border-transparent focus:border-blue-300 outline-none p-1"
                        placeholder="พิมพ์หัวข้อ..."
                      />
                    )}

                    {block.type === 'paragraph' && (
                      <textarea 
                        value={block.content} 
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        className="w-full text-slate-600 bg-transparent border border-transparent focus:border-blue-300 outline-none p-1 resize-none"
                        placeholder="พิมพ์ข้อความรายละเอียด..."
                        rows={3}
                      />
                    )}

                    {block.type === 'image' && (
                      <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 relative min-h-[120px]">
                        {block.content ? (
                          <div className="relative group/image">
                            <img src={block.content} alt="Uploaded logo" className="max-h-32 object-contain" />
                            <button onClick={() => updateBlock(block.id, { content: '' })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">✕</button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className="text-3xl block mb-2 opacity-50">🖼️</span>
                            <label className="bg-white border border-slate-300 text-slate-700 font-semibold px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-sm">
                              อัปโหลดรูปภาพ / โลโก้
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  toast.loading('กำลังอัปโหลด...', { id: `upload_${block.id}` });
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  const res = await uploadImage(formData);
                                  if (res.success) {
                                    updateBlock(block.id, { content: res.url });
                                    toast.success('อัปโหลดสำเร็จ', { id: `upload_${block.id}` });
                                  } else {
                                    toast.error('อัปโหลดไม่สำเร็จ', { id: `upload_${block.id}` });
                                  }
                                }} 
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    {block.type === 'input' && (
                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <input 
                          type="text" 
                          value={block.label} 
                          onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                          className="font-bold text-slate-700 text-sm bg-transparent outline-none w-full border-b border-dashed border-slate-300 mb-2 focus:border-blue-400"
                          placeholder="คำถาม / หัวข้อข้อมูล"
                        />
                        <div className="text-slate-400 text-sm italic bg-slate-50 px-3 py-2 rounded border border-slate-100">ช่องกรอกข้อความ (แสดงเฉพาะตอนพนักงานกรอก)</div>
                        
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-xs text-slate-600">
                            <input type="checkbox" checked={block.required} onChange={(e) => updateBlock(block.id, { required: e.target.checked })} />
                            บังคับกรอก (Required)
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 w-24">สิทธิ์ผู้กรอก:</span>
                            <select 
                              value={block.assignedRole || ''} 
                              onChange={(e) => updateBlock(block.id, { assignedRole: e.target.value })}
                              className="text-xs border rounded p-1 flex-1 text-slate-700 bg-white"
                            >
                              <option value="">-- ใครกรอกก็ได้ (ตาม Step) --</option>
                              {roles.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {block.type === 'date' && (
                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <input 
                          type="text" 
                          value={block.label} 
                          onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                          className="font-bold text-slate-700 text-sm bg-transparent outline-none w-full border-b border-dashed border-slate-300 mb-2 focus:border-blue-400"
                          placeholder="ระบุวันที่..."
                        />
                        <div className="text-slate-400 text-sm italic bg-slate-50 px-3 py-2 rounded border border-slate-100 flex items-center gap-2">
                          📅 ช่องเลือกวันที่
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-xs text-slate-600">
                            <input type="checkbox" checked={block.required} onChange={(e) => updateBlock(block.id, { required: e.target.checked })} />
                            บังคับกรอก (Required)
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 w-24">สิทธิ์ผู้กรอก:</span>
                            <select 
                              value={block.assignedRole || ''} 
                              onChange={(e) => updateBlock(block.id, { assignedRole: e.target.value })}
                              className="text-xs border rounded p-1 flex-1 text-slate-700 bg-white"
                            >
                              <option value="">-- ใครกรอกก็ได้ (ตาม Step) --</option>
                              {roles.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {block.type === 'signature' && (
                      <div className="bg-white border border-slate-200 rounded-lg p-3 h-full flex flex-col justify-between">
                        <div>
                          <input 
                            type="text" 
                            value={block.label} 
                            onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                            className="font-bold text-slate-700 text-sm bg-transparent outline-none w-full border-b border-dashed border-slate-300 mb-2 focus:border-blue-400 text-center"
                            placeholder="ตำแหน่งลายเซ็น (เช่น ผู้ขออนุมัติ)"
                          />
                          <div className="text-slate-300 text-center py-6 text-sm italic border-2 border-dashed border-slate-100 rounded-lg bg-slate-50">
                            ✍️ พื้นที่แสดงลายเซ็น
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 w-24">ให้ใครเซ็น?:</span>
                            <select 
                              value={block.assignedRole || ''} 
                              onChange={(e) => updateBlock(block.id, { assignedRole: e.target.value })}
                              className="text-xs border border-blue-300 bg-blue-50 text-blue-700 font-semibold rounded p-1 flex-1"
                            >
                              <option value="">-- ใครกรอกก็ได้ --</option>
                              {roles.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ))
            )}
          </div>
          
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6 z-20">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
        >
          {saving ? 'กำลังบันทึก...' : <>💾 บันทึกแม่แบบเอกสาร</>}
        </button>
      </div>

    </div>
  );
}
