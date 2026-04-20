import React, { useState, useMemo } from 'react';
import { COAAccount, AccountingJournal, UserRole, JournalEntry } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { getLocalDateString } from '../lib/utils';

interface AccountingModuleProps {
  journals: AccountingJournal[];
  accounts: COAAccount[];
  company: string;
  userRole: UserRole;
  onSave: (journal: AccountingJournal) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const AccountingModule: React.FC<AccountingModuleProps> = ({ 
  journals, 
  accounts, 
  company, 
  userRole, 
  onSave, 
  onDelete 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(getLocalDateString());

  const [formData, setFormData] = useState<Partial<AccountingJournal>>({
    date: getLocalDateString(),
    description: '',
    reference: '',
    entries: [
      { accountId: '', debit: 0, credit: 0 },
      { accountId: '', debit: 0, credit: 0 }
    ]
  });

  const filteredJournals = useMemo(() => {
    return journals
      .filter(j => j.company === company)
      .filter(j => j.date >= startDate && j.date <= endDate)
      .filter(j => 
        j.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
        j.reference.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [journals, company, searchQuery, startDate, endDate]);

  const detailAccounts = useMemo(() => {
    return accounts.filter(a => a.type === 'Detail' && a.company === company);
  }, [accounts, company]);

  const handleEdit = (journal: AccountingJournal) => {
    setFormData({ ...journal });
    setEditingId(journal.id);
    setIsModalOpen(true);
  };

  const addEntry = () => {
    setFormData(prev => ({
      ...prev,
      entries: [...(prev.entries || []), { accountId: '', debit: 0, credit: 0 }]
    }));
  };

  const removeEntry = (index: number) => {
    setFormData(prev => ({
      ...prev,
      entries: (prev.entries || []).filter((_, i) => i !== index)
    }));
  };

  const updateEntry = (index: number, field: keyof JournalEntry, value: any) => {
    setFormData(prev => {
      const newEntries = [...(prev.entries || [])];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return { ...prev, entries: newEntries };
    });
  };

  const totals = useMemo(() => {
    return (formData.entries || []).reduce((acc, curr) => ({
      debit: acc.debit + (Number(curr.debit) || 0),
      credit: acc.credit + (Number(curr.credit) || 0)
    }), { debit: 0, credit: 0 });
  }, [formData.entries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.description) {
      alert('Mohon isi field wajib');
      return;
    }

    if (totals.debit !== totals.credit) {
      alert('Jurnal tidak balance! Total Debit harus sama dengan Total Kredit.');
      return;
    }

    if (totals.debit === 0) {
      alert('Total jurnal tidak boleh nol.');
      return;
    }

    const journalToSave: AccountingJournal = {
      id: editingId || `journal_${Date.now()}`,
      date: formData.date!,
      description: formData.description!,
      reference: formData.reference || '',
      entries: formData.entries!.map(e => ({
        accountId: e.accountId,
        debit: Number(e.debit),
        credit: Number(e.credit)
      })),
      company,
      createdAt: editingId ? (journals.find(j => j.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };

    await onSave(journalToSave);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      date: getLocalDateString(),
      description: '',
      reference: '',
      entries: [
        { accountId: '', debit: 0, credit: 0 },
        { accountId: '', debit: 0, credit: 0 }
      ]
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] shadow-sm border border-stone-100">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-stone-900 uppercase">General Ledger</h2>
          <p className="text-stone-500 font-medium text-sm">Pencatatan jurnal umum akuntansi</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-stone-800 transition-all active:scale-95 shadow-lg shadow-stone-200"
        >
          <span className="material-symbols-outlined">add</span>
          Buat Jurnal
        </button>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 text-sm">search</span>
            <input
              type="text"
              placeholder="Cari keterangan atau referensi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 bg-stone-50 p-1 rounded-2xl border border-stone-100">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-stone-600 px-3 py-2 text-xs"
            />
            <span className="text-stone-300 font-black text-[10px]">KE</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-stone-600 px-3 py-2 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredJournals.map((journal, idx) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={journal.id}
            className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-black text-stone-400 font-mono tracking-widest">{format(new Date(journal.date), 'dd MMM yyyy')}</span>
                  {journal.reference && (
                    <span className="px-2 py-0.5 bg-stone-100 text-stone-500 rounded text-[9px] font-black uppercase tracking-widest">Ref: {journal.reference}</span>
                  )}
                </div>
                <h4 className="text-base font-black text-stone-900 leading-tight">{journal.description}</h4>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(journal)}
                  className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-xl"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Hapus jurnal ini?')) onDelete(journal.id);
                  }}
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>

            <div className="border-t border-stone-50 pt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[9px] font-black text-stone-400 uppercase tracking-widest text-left">
                    <th className="pb-2">Akun</th>
                    <th className="pb-2 text-right">Debit</th>
                    <th className="pb-2 text-right">Kredit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {journal.entries.map((entry, eIdx) => {
                    const acc = accounts.find(a => a.id === entry.accountId);
                    return (
                      <tr key={eIdx} className="font-medium animate-in fade-in slide-in-from-left-2 transition-all">
                        <td className="py-2 text-stone-600">
                          <span className="font-mono text-[10px] text-stone-400 mr-2">{acc?.code}</span>
                          {acc?.name || 'Account missing'}
                        </td>
                        <td className="py-2 text-right font-black text-stone-900 font-mono">
                          {entry.debit > 0 ? `Rp ${entry.debit.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="py-2 text-right font-black text-stone-900 font-mono">
                          {entry.credit > 0 ? `Rp ${entry.credit.toLocaleString('id-ID')}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        ))}
        {filteredJournals.length === 0 && (
          <div className="bg-white p-12 rounded-[32px] border border-stone-100 shadow-sm text-center">
            <span className="material-symbols-outlined text-5xl text-stone-200 mb-4">history_edu</span>
            <p className="text-stone-400 font-bold">Belum ada jurnal yang tercatat untuk periode ini</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-stone-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-stone-900 uppercase tracking-tight">
                      {editingId ? 'Edit Jurnal' : 'Jurnal Baru'}
                    </h3>
                    <p className="text-stone-500 font-medium text-sm">Input entri jurnal manual</p>
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
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tanggal</label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Referensi / No Voucher</label>
                      <input
                        type="text"
                        value={formData.reference}
                        onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                        placeholder="Contoh: VOC/001"
                        className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Keterangan Jurnal</label>
                    <input
                      type="text"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Apa transaksi ini?"
                      className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Rincian Entri</label>
                      <button
                        type="button"
                        onClick={addEntry}
                        className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-600 hover:text-blue-800 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        Baris Baru
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.entries?.map((entry, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-5">
                            <select
                              required
                              value={entry.accountId}
                              onChange={(e) => updateEntry(idx, 'accountId', e.target.value)}
                              className="w-full px-3 py-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold focus:outline-none"
                            >
                              <option value="">Pilih Akun</option>
                              {detailAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-3">
                            <input
                              type="number"
                              value={entry.debit}
                              onChange={(e) => {
                                updateEntry(idx, 'debit', e.target.value);
                                if (Number(e.target.value) > 0) updateEntry(idx, 'credit', 0);
                              }}
                              placeholder="Debit"
                              className="w-full px-3 py-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold text-right font-mono focus:outline-none"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="number"
                              value={entry.credit}
                              onChange={(e) => {
                                updateEntry(idx, 'credit', e.target.value);
                                if (Number(e.target.value) > 0) updateEntry(idx, 'debit', 0);
                              }}
                              placeholder="Kredit"
                              className="w-full px-3 py-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold text-right font-mono focus:outline-none"
                            />
                          </div>
                          <div className="col-span-1 text-center">
                            {formData.entries!.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeEntry(idx)}
                                className="text-stone-300 hover:text-red-500 transition-all"
                              >
                                <span className="material-symbols-outlined text-lg">cancel</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-stone-50 p-4 rounded-2xl space-y-2 border border-stone-100">
                      <div className="flex justify-between text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">
                        <span>Total Akumulasi</span>
                        <div className="flex gap-12">
                          <span className="w-24 text-right">Debit</span>
                          <span className="w-24 text-right">Kredit</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center px-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${totals.debit === totals.credit && totals.debit > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {totals.debit === totals.credit ? (totals.debit > 0 ? 'Balanced' : 'Empty') : 'Unbalanced'}
                        </span>
                        <div className="flex gap-12 font-mono font-black text-sm text-stone-900">
                          <span className="w-24 text-right">Rp {totals.debit.toLocaleString('id-ID')}</span>
                          <span className="w-24 text-right">Rp {totals.credit.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-5 bg-stone-900 text-white rounded-[24px] font-black uppercase tracking-widest transition-all hover:bg-stone-800 active:scale-[0.98] shadow-xl shadow-stone-200"
                  >
                    Simpan Jurnal
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

export default AccountingModule;
