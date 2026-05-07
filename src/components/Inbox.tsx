import React, { useState, useMemo } from 'react';
import { Submission, Employee, UserRole } from '../types';
import { getPaginationRange } from '../lib/utils';

interface InboxProps {
  submissions: Submission[];
  onSaveSubmission: (submission: Submission) => void;
  onDeleteSubmission: (submissionId: string) => void;
  employees: Employee[];
  userRole: UserRole;
  currentEmployeeId: string;
}

const Inbox: React.FC<InboxProps> = ({ submissions, onSaveSubmission, onDeleteSubmission, employees, userRole, currentEmployeeId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const paginatedSubmissions = useMemo(() => {
    const sorted = [...submissions].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIndex, startIndex + itemsPerPage);
  }, [submissions, currentPage]);

  const totalPages = Math.ceil(submissions.length / itemsPerPage);

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
          <>
            {paginatedSubmissions.map((sub) => {
              const employee = employees.find(e => e.id === sub.employeeId);
              return (
                <div key={sub.id} className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {employee?.photoUrl ? (
                          <img src={employee.photoUrl} alt={employee.nama} className="w-full h-full object-cover shadow-inner" referrerPolicy="no-referrer" />
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
                            className="px-4 py-2 text-red-500 font-bold text-sm hover:bg-red-50 rounded-xl transition-colors"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={() => handleAction(sub.id, 'Approved')}
                            className="px-6 py-2 bg-orange-600 text-white font-bold text-sm rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
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
                          {userRole === 'owner' && (
                            <button 
                              onClick={() => {
                                if(window.confirm('Delete this submission?')) {
                                  onDeleteSubmission(sub.id);
                                }
                              }}
                              className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                              title="Hapus Pengajuan"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8 py-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-stone-400 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <span className="material-symbols-outlined uppercase font-black text-xs">arrow_back</span>
                </button>
                
                {getPaginationRange(currentPage, totalPages).map((p, idx) => (
                  p === '...' ? (
                    <span key={`dots-${idx}`} className="px-2 text-stone-400 font-bold">...</span>
                  ) : (
                    <button
                      key={`page-${p}`}
                      onClick={() => setCurrentPage(typeof p === 'number' ? p : currentPage)}
                      className={`min-w-[40px] h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
                        currentPage === p 
                          ? 'bg-stone-900 text-white shadow-lg shadow-stone-200 scale-110' 
                          : 'text-stone-400 hover:bg-stone-100'
                      }`}
                    >
                      {p}
                    </button>
                  )
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-stone-400 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <span className="material-symbols-outlined uppercase font-black text-xs">arrow_forward</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Inbox;

