import React, { useState, useMemo, useEffect } from 'react';
import { COAAccount, UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface COAModuleProps {
  accounts: COAAccount[];
  company: string;
  userRole: UserRole;
  onSave: (account: COAAccount) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const CATEGORIES: COAAccount['category'][] = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

const COAModule: React.FC<COAModuleProps> = ({ accounts, company, userRole, onSave, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  
  const [formData, setFormData] = useState<Partial<COAAccount>>({
    code: '',
    name: '',
    category: 'Asset',
    type: 'Detail',
    parentId: ''
  });

  const filteredAccounts = useMemo(() => {
    return accounts
      .filter(a => a.company === company)
      .filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [accounts, company, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredAccounts.length / pageSize);
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAccounts.slice(start, start + pageSize);
  }, [filteredAccounts, currentPage, pageSize]);

  const handleEdit = (account: COAAccount) => {
    setFormData(account);
    setEditingId(account.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.category) {
      alert('Mohon isi semua field wajib');
      return;
    }

    const accountToSave: COAAccount = {
      id: editingId || `coa_${Date.now()}`,
      code: formData.code!,
      name: formData.name!,
      category: formData.category as any,
      type: formData.type || 'Detail',
      parentId: formData.parentId || undefined,
      company,
      createdAt: editingId ? (accounts.find(a => a.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };

    await onSave(accountToSave);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      category: 'Asset',
      type: 'Detail',
      parentId: ''
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] shadow-sm border border-stone-100">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-stone-900 uppercase">Chart of Accounts</h2>
          <p className="text-stone-500 font-medium text-sm">Daftar akun akuntansi perusahaan</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-stone-800 transition-all active:scale-95 shadow-lg shadow-stone-200"
        >
          <span className="material-symbols-outlined">add</span>
          Tambah Akun
        </button>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400">search</span>
          <input
            type="text"
            placeholder="Cari kode atau nama akun..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Kode</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Nama Akun</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Kategori</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Tipe</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {paginatedAccounts.map((account, idx) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={account.id}
                  className="hover:bg-stone-50/50 transition-colors group"
                >
                  <td className="px-6 py-4 text-xs font-black text-stone-900 font-mono">{account.code}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${account.type === 'Header' ? 'text-stone-900 uppercase' : 'text-stone-700'}`}>
                        {account.name}
                      </span>
                      {account.parentId && (
                        <span className="text-[10px] text-stone-400 font-medium">Parent: {accounts.find(a => a.id === account.parentId)?.name}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                      account.category === 'Asset' ? 'bg-blue-100 text-blue-700' :
                      account.category === 'Liability' ? 'bg-red-100 text-red-700' :
                      account.category === 'Equity' ? 'bg-purple-100 text-purple-700' :
                      account.category === 'Revenue' ? 'bg-green-100 text-green-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {account.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${account.type === 'Header' ? 'text-stone-900 underline decoration-stone-200' : 'text-stone-400'}`}>
                      {account.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(account)}
                        className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      {(userRole === 'owner' || userRole === 'admin') && (
                        <button
                          onClick={() => {
                            if (confirm('Hapus akun ini?')) onDelete(account.id);
                          }}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400 font-bold">Belum ada akun di Chart of Accounts</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
              Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredAccounts.length)} dari {filteredAccounts.length} akun
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-stone-200 text-stone-400 disabled:opacity-30 hover:bg-white transition-all"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${
                      currentPage === i + 1 
                        ? 'bg-stone-900 text-white shadow-md' 
                        : 'text-stone-400 hover:bg-white border border-stone-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-stone-200 text-stone-400 disabled:opacity-30 hover:bg-white transition-all"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden relative"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-stone-900 uppercase tracking-tight">
                      {editingId ? 'Edit Akun' : 'Akun Baru'}
                    </h3>
                    <p className="text-stone-500 font-medium">Informasi akun CoA</p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Kode Akun</label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="Contoh: 1101"
                        className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Kategori</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                        className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nama Akun</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Kas Besar"
                      className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-5 bg-stone-900 text-white rounded-[24px] font-black uppercase tracking-widest transition-all hover:bg-stone-800 active:scale-[0.98] mt-4 shadow-xl shadow-stone-200"
                  >
                    Simpan Akun
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default COAModule;
