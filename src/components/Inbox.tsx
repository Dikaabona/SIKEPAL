import React from 'react';
import { Submission, Broadcast, Employee, UserRole } from '../types';

interface InboxProps {
  submissions: Submission[];
  onSaveSubmission: (submission: Submission) => void;
  onDeleteSubmission: (submissionId: string) => void;
  employees: Employee[];
  userRole: UserRole;
  currentEmployeeId: string;
}

const Inbox: React.FC<InboxProps> = ({ submissions, onSaveSubmission, onDeleteSubmission, employees, userRole, currentEmployeeId }) => {
  const handleAction = (id: string, status: 'Approved' | 'Rejected') => {
    const submission = submissions.find(sub => sub.id === id);
    if (submission) {
      onSaveSubmission({
        ...submission,
        status,
        approvedBy: currentEmployeeId,
        approvedAt: new Date().toISOString()
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-stone-900 uppercase">Inbox & Approvals</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {submissions.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-stone-200 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-stone-300 text-6xl mb-4">inbox</span>
            <p className="text-stone-500 font-medium">No pending requests at the moment.</p>
          </div>
        ) : (
          submissions.map((sub) => {
            const employee = employees.find(e => e.id === sub.employeeId);
            return (
              <div key={sub.id} className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {employee?.photoUrl ? (
                        <img src={employee.photoUrl} alt={employee.nama} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-stone-400">person</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-stone-900">{employee?.nama || 'Unknown Employee'}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          sub.type === 'Leave' ? 'bg-orange-100 text-orange-700' :
                          sub.type === 'Overtime' ? 'bg-blue-100 text-blue-700' :
                          sub.type === 'Notification' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {sub.type}
                        </span>
                      </div>
                      <p className="text-sm text-stone-500 font-medium">{sub.reason}</p>
                      <p className="text-xs text-stone-400 mt-1">Requested on {new Date(sub.submittedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                   <div className="flex items-center gap-3">
                    {sub.status === 'Pending' ? (
                      <>
                        <button 
                          onClick={() => handleAction(sub.id, 'Rejected')}
                          className="px-4 py-2 text-error font-bold text-sm hover:bg-red-50 rounded-xl transition-colors"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleAction(sub.id, 'Approved')}
                          className="px-6 py-2 bg-primary text-on-primary font-bold text-sm rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                          Approve
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-xl font-bold text-sm ${
                          sub.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {sub.status.toUpperCase()}
                        </span>
                        <button 
                          onClick={() => onDeleteSubmission(sub.id)}
                          className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                          title="Hapus Pengajuan"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Inbox;
