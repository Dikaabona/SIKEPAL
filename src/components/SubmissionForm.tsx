import React, { useState } from 'react';
import { Employee, SubmissionType, Submission } from '../types';

interface SubmissionFormProps {
  employee: Employee | null;
  company: string;
  onSaveSubmission: (submission: Submission) => void;
  onSuccess: () => void;
  onClose?: () => void;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ employee, company, onSaveSubmission, onSuccess, onClose }) => {
  const [type, setType] = useState<SubmissionType>('Leave');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!employee) {
      alert('Data karyawan tidak ditemukan.');
      return;
    }
    if (!reason.trim()) {
      alert('Mohon isi alasan pengajuan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newSubmission: Submission = {
        id: crypto.randomUUID(),
        employeeId: employee.id,
        company: company,
        type: type,
        reason: reason,
        startDate: startDate,
        endDate: endDate,
        status: 'Pending',
        submittedAt: new Date().toISOString()
      };

      await onSaveSubmission(newSubmission);
      onSuccess();
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[40px] p-10 max-w-xl w-full shadow-2xl space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black tracking-tight text-stone-900 uppercase">Create Request</h2>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex gap-2 p-1 bg-stone-100 rounded-2xl">
            {(['Leave', 'Overtime', 'Reimbursement'] as SubmissionType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  type === t ? 'bg-white text-primary shadow-sm' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Start Date</label>
                <input
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">End Date</label>
                <input
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Reason / Description</label>
              <textarea
                rows={4}
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                placeholder="Describe your request..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              ></textarea>
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-primary text-on-primary font-black py-5 rounded-3xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <span className="material-symbols-outlined">{isSubmitting ? 'sync' : 'send'}</span>
            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionForm;
