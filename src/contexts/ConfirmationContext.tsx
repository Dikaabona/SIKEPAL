import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ConfirmationOptions {
  title: string;
  message: string;
  type?: 'info' | 'danger' | 'warning';
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const ConfirmationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmationOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolvePromise?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolvePromise?.(false);
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <h3 className={`text-xl font-black uppercase tracking-tight ${options.type === 'danger' ? 'text-rose-600' : 'text-slate-900'}`}>
                {options.title}
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                {options.message}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                {options.cancelText || 'BATAL'}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest text-white transition-all shadow-lg active:scale-95 ${
                  options.type === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-100' : 'bg-slate-900 hover:bg-black shadow-slate-100'
                }`}
              >
                {options.confirmText || 'YA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmationContext.Provider>
  );
};

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};
