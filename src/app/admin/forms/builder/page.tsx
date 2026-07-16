'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createFormTemplate } from '@/app/actions/forms';

type BlockType = 'heading' | 'paragraph' | 'input' | 'signature' | 'date';

interface Block {
  id: string;
  type: BlockType;
  content?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  assignedRole?: string;
}

export default function DocumentBuilderPage() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([
    { id: '1', type: 'heading', content: 'แบบฟอร์มขอเบิกค่าใช้จ่าย' },
    { id: '2', type: 'paragraph', content: 'โปรดกรอกข้อมูลให้ครบถ้วนและแนบใบเสร็จทุกครั้ง' },
    { id: '3', type: 'input', label: 'ชื่อ-นามสกุล ผู้เบิก', placeholder: 'นายสมชาย ใจดี', required: true, assignedRole: 'ผู้ใช้ทั่วไป (User)' },
  ]);
  
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('แบบฟอร์มขอเบิกค่าใช้จ่าย (ฉบับใหม่)');
  const [isSaving, setIsSaving] = useState(false);
  const [workflowJson, setWorkflowJson] = useState('[]');

  useEffect(() => {
    // Load temporary workflow from localStorage
    const savedWorkflow = localStorage.getItem('tempWorkflow');
    if (savedWorkflow) {
      setWorkflowJson(savedWorkflow);
    }
  }, []);

  const availableRoles = ['ผู้ใช้ทั่วไป (User)', 'หัวหน้างาน / HR', 'ผู้บริหาร (Executive)'];

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: type === 'heading' ? 'หัวข้อใหม่' : type === 'paragraph' ? 'พิมพ์ข้อความที่นี่...' : '',
      label: type === 'input' || type === 'signature' || type === 'date' ? 'หัวข้อฟิลด์ใหม่' : undefined,
      placeholder: type === 'input' ? 'คำแนะนำการกรอก...' : undefined,
      required: false,
      assignedRole: 'ผู้ใช้ทั่วไป (User)',
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const handleSaveAndPublish = async () => {
    if (!formTitle.trim()) {
      toast.error('กรุณาตั้งชื่อฟอร์มก่อนบันทึก');
      return;
    }
    
    setIsSaving(true);
    const blocksJson = JSON.stringify(blocks);
    
    const res = await createFormTemplate(
      formTitle,
      'สร้างจาก Web Builder',
      blocksJson,
      workflowJson
    );

    if (res.success) {
      toast.success('บันทึกแบบฟอร์มลงฐานข้อมูลสำเร็จ! 🎉');
      localStorage.removeItem('tempWorkflow');
      router.push('/admin/forms');
    } else {
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setIsSaving(false);
    }
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/admin/forms" className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            &larr;
          </Link>
          <div className="h-6 w-px bg-slate-200"></div>
          <input 
            type="text" 
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="ตั้งชื่อแบบฟอร์มที่นี่..."
            className="text-lg font-bold text-slate-800 outline-none border-b border-transparent focus:border-blue-500 bg-transparent px-1 transition-colors min-w-[300px]"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="text-slate-600 hover:text-slate-800 font-medium text-sm px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
            ดูตัวอย่าง (Preview)
          </button>
          <button 
            onClick={handleSaveAndPublish}
            disabled={isSaving}
            className={`${isSaving ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2`}
          >
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกและเผยแพร่'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto z-10">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">ส่วนประกอบเอกสาร</h3>
            <p className="text-xs text-slate-500">คลิกเพื่อเพิ่มลงในกระดาษ</p>
          </div>
          
          <div className="p-4 space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">ข้อความ (Text)</h4>
              <div className="space-y-2">
                <button onClick={() => addBlock('heading')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 transition-all text-left">
                  <div className="w-8 h-8 bg-white rounded shadow-sm border border-slate-100 flex items-center justify-center font-bold text-lg">H</div>
                  <span className="text-sm font-medium">หัวข้อ (Heading)</span>
                </button>
                <button onClick={() => addBlock('paragraph')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 transition-all text-left">
                  <div className="w-8 h-8 bg-white rounded shadow-sm border border-slate-100 flex items-center justify-center font-serif">P</div>
                  <span className="text-sm font-medium">ย่อหน้า (Paragraph)</span>
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">ช่องกรอกข้อมูล (Inputs)</h4>
              <div className="space-y-2">
                <button onClick={() => addBlock('input')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50 text-slate-700 transition-all text-left">
                  <div className="w-8 h-8 bg-white rounded shadow-sm border border-slate-100 flex items-center justify-center text-lg">📝</div>
                  <span className="text-sm font-medium">ช่องพิมพ์ข้อความสั้น</span>
                </button>
                <button onClick={() => addBlock('date')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50 text-slate-700 transition-all text-left">
                  <div className="w-8 h-8 bg-white rounded shadow-sm border border-slate-100 flex items-center justify-center text-lg">📅</div>
                  <span className="text-sm font-medium">ช่องเลือกวันที่</span>
                </button>
                <button onClick={() => addBlock('signature')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-green-400 hover:bg-green-50 text-slate-700 transition-all text-left">
                  <div className="w-8 h-8 bg-white rounded shadow-sm border border-slate-100 flex items-center justify-center text-lg">✒️</div>
                  <span className="text-sm font-medium">ลายเซ็นอิเล็กทรอนิกส์</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center custom-scrollbar">
          <div id="a4-canvas" className="w-[794px] min-h-[1123px] bg-white shadow-lg rounded-sm p-12 mb-12 flex flex-col gap-1 ring-1 ring-slate-200">
            {blocks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <div className="text-6xl mb-4">📄</div>
                <h2 className="text-xl font-bold mb-2">หน้ากระดาษว่างเปล่า</h2>
                <p>คลิกเลือกส่วนประกอบด้านซ้ายเพื่อเริ่มสร้างฟอร์ม</p>
              </div>
            ) : (
              blocks.map((block) => (
                <div 
                  key={block.id} 
                  onClick={() => setSelectedBlockId(block.id)}
                  className={`relative p-4 rounded-xl border-2 border-transparent hover:border-blue-200 transition-all cursor-pointer group ${selectedBlockId === block.id ? '!border-blue-500 bg-blue-50/30' : ''}`}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                    className={`absolute -top-3 -right-3 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10 hover:bg-red-200 ${selectedBlockId === block.id ? 'opacity-100' : ''}`}
                  >
                    ✕
                  </button>

                  {block.type === 'heading' && (
                    <h1 className="text-3xl font-bold text-slate-900">{block.content}</h1>
                  )}
                  {block.type === 'paragraph' && (
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{block.content}</p>
                  )}
                  {block.type === 'input' && (
                    <div className="w-full">
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        {block.label} {block.required && <span className="text-red-500">*</span>}
                      </label>
                      <div className="w-full border-b border-dashed border-slate-400 pb-1 text-slate-400 text-sm">
                        {block.placeholder || 'พื้นที่สำหรับให้ User พิมพ์...'}
                      </div>
                    </div>
                  )}
                  {block.type === 'date' && (
                    <div className="w-1/2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        {block.label} {block.required && <span className="text-red-500">*</span>}
                      </label>
                      <div className="w-full border-b border-dashed border-slate-400 pb-1 text-slate-400 text-sm flex items-center gap-2">
                        📅 ดด/วว/ปปปป
                      </div>
                    </div>
                  )}
                  {block.type === 'signature' && (
                    <div className="mt-8 mb-4">
                      <div className="w-64 mx-auto flex flex-col items-center">
                        <div className="w-full h-24 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 bg-slate-50 mb-2">
                          <span className="text-sm">✒️ กล่องลายเซ็น ({block.assignedRole})</span>
                        </div>
                        <div className="text-sm font-bold text-slate-700">{block.label}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </main>

        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto z-10 shadow-[-4px_0_15px_rgb(0,0,0,0.02)]">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">ตั้งค่าส่วนประกอบ (Properties)</h3>
          </div>
          
          <div className="p-6">
            {!selectedBlock ? (
              <div className="text-center text-slate-500 mt-10">
                <div className="text-3xl mb-2">👆</div>
                <p>คลิกเลือกส่วนประกอบบนกระดาษ<br/>เพื่อตั้งค่ารายละเอียด</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                  ประเภท: {selectedBlock.type}
                </div>

                {(selectedBlock.type === 'heading' || selectedBlock.type === 'paragraph') && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">ข้อความ</label>
                    <textarea 
                      value={selectedBlock.content}
                      onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 min-h-[100px]"
                    />
                  </div>
                )}

                {(selectedBlock.type === 'input' || selectedBlock.type === 'signature' || selectedBlock.type === 'date') && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อหัวข้อ (Label)</label>
                    <input 
                      type="text" 
                      value={selectedBlock.label}
                      onChange={(e) => updateBlock(selectedBlock.id, { label: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                {selectedBlock.type === 'input' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">คำแนะนำในช่องกรอก (Placeholder)</label>
                    <input 
                      type="text" 
                      value={selectedBlock.placeholder}
                      onChange={(e) => updateBlock(selectedBlock.id, { placeholder: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                {(selectedBlock.type === 'input' || selectedBlock.type === 'signature' || selectedBlock.type === 'date') && (
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                      🔒 สิทธิ์การกรอกข้อมูล
                    </label>
                    <p className="text-xs text-indigo-600/80 mb-3 leading-relaxed">
                      กำหนดว่าใคร (ในสายอนุมัติ) เป็นผู้รับผิดชอบกรอกช่องนี้
                    </p>
                    <div className="relative">
                      <select 
                        value={selectedBlock.assignedRole}
                        onChange={(e) => updateBlock(selectedBlock.id, { assignedRole: e.target.value })}
                        className="w-full appearance-none bg-white border border-indigo-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 text-sm font-medium text-slate-800 cursor-pointer shadow-sm"
                      >
                        {availableRoles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-indigo-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                )}

                {(selectedBlock.type === 'input' || selectedBlock.type === 'signature' || selectedBlock.type === 'date') && (
                  <label className="flex items-center gap-3 cursor-pointer mt-4">
                    <input 
                      type="checkbox" 
                      checked={selectedBlock.required}
                      onChange={(e) => updateBlock(selectedBlock.id, { required: e.target.checked })}
                      className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                    />
                    <span className="text-slate-700 font-medium text-sm">จำเป็นต้องกรอก (Required)</span>
                  </label>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
