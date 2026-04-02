import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'update'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Detect recovery mode from URL or session event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('update');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLoginSuccess();
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        setMessage('Pendaftaran berhasil! Silakan periksa email Anda untuk verifikasi.');
        setMode('login');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage('Instruksi reset password telah dikirim ke email Anda.');
        setMode('login');
      } else if (mode === 'update') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage('Password berhasil diperbarui! Silakan login kembali.');
        setMode('login');
        await supabase.auth.signOut();
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const bgLogoUrl = "https://lh3.googleusercontent.com/d/1Q7472XkafmLvSyRuz2GGmDtatH22Mztd";

  return (
    <div className="min-h-screen bg-yellow-400 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Logo Pattern */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url(${bgLogoUrl})`,
          backgroundSize: '200px',
          backgroundRepeat: 'repeat',
          filter: 'grayscale(100%) brightness(200%)'
        }}
      ></div>

      {/* Decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-yellow-300 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-white rounded-full blur-3xl opacity-20"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="max-w-md w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border-8 border-white relative z-10"
      >
        <div className="p-10">
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-28 h-28 bg-white rounded-3xl shadow-xl border-4 border-yellow-100 flex items-center justify-center overflow-hidden mb-6 p-2"
            >
              <img 
                src="https://lh3.googleusercontent.com/d/1b-hkPOsHZ8_rW1f9aqABu7R5bw_ZJM0y" 
                alt="Sikepal Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <h1 className="text-4xl font-black text-yellow-600 tracking-tight mb-1">
              {mode === 'login' ? 'Halo Sikepal!' : mode === 'signup' ? 'Daftar Baru' : mode === 'forgot' ? 'Lupa Password' : 'Password Baru'}
            </h1>
            <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">
              {mode === 'login' ? 'Dashboard Management System' : 'Sikepal Premium Nasi Kepal'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-stone-500 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500">person</span>
                      <input 
                        type="text" 
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nama Lengkap"
                        className="w-full pl-12 pr-4 py-4 bg-yellow-50/50 border-2 border-yellow-100 rounded-2xl focus:border-yellow-400 focus:bg-white focus:ring-4 focus:ring-yellow-100 transition-all text-stone-800 font-bold placeholder:text-stone-300"
                      />
                    </div>
                  </div>
                )}

                {mode === 'update' && (
                  <div className="p-4 bg-yellow-50 border-2 border-yellow-100 rounded-2xl mb-4">
                    <p className="text-xs font-bold text-yellow-800">
                      Silakan masukkan password baru Anda di bawah ini.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-black text-stone-500 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500 group-focus-within:scale-110 transition-transform">mail</span>
                    <input 
                      type="email" 
                      required
                      disabled={mode === 'update'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@sikepal.com"
                      className="w-full pl-12 pr-4 py-4 bg-yellow-50/50 border-2 border-yellow-100 rounded-2xl focus:border-yellow-400 focus:bg-white focus:ring-4 focus:ring-yellow-100 transition-all text-stone-800 font-bold placeholder:text-stone-300 disabled:opacity-50"
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-stone-500 uppercase tracking-wider ml-1">
                      {mode === 'update' ? 'New Password' : 'Password'}
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500 group-focus-within:scale-110 transition-transform">lock</span>
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-4 bg-yellow-50/50 border-2 border-yellow-100 rounded-2xl focus:border-yellow-400 focus:bg-white focus:ring-4 focus:ring-yellow-100 transition-all text-stone-800 font-bold placeholder:text-stone-300"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {mode === 'login' && (
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs font-bold text-yellow-600 hover:text-yellow-700 transition-colors"
                >
                  Lupa Password?
                </button>
              </div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-lg">error</span>
                <p className="flex-1">{error}</p>
              </motion.div>
            )}

            {message && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-green-50 border-2 border-green-100 rounded-2xl text-green-600 text-xs font-bold flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-lg">check_circle</span>
                <p className="flex-1">{message}</p>
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-200 text-yellow-900 font-black rounded-2xl shadow-xl shadow-yellow-200/50 transition-all flex items-center justify-center gap-3 group relative overflow-hidden active:scale-95"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-4 border-yellow-900 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="relative z-10">
                    {mode === 'login' ? 'MASUK SEKARANG' : mode === 'signup' ? 'DAFTAR SEKARANG' : mode === 'forgot' ? 'RESET PASSWORD' : 'SIMPAN PASSWORD'}
                  </span>
                  <span className="material-symbols-outlined relative z-10 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>

            <div className="text-center space-y-2">
              {mode === 'login' ? (
                <p className="text-stone-400 text-xs font-bold">
                  Belum punya akun?{' '}
                  <button 
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-yellow-600 hover:underline"
                  >
                    Daftar Sekarang
                  </button>
                </p>
              ) : (
                <p className="text-stone-400 text-xs font-bold">
                  Sudah punya akun?{' '}
                  <button 
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-yellow-600 hover:underline"
                  >
                    Masuk di sini
                  </button>
                </p>
              )}
            </div>
          </form>

          <div className="mt-12 text-center">
            <p className="text-stone-300 text-[10px] font-black uppercase tracking-[0.2em]">
              &copy; 2024 Sikepal Premium Nasi Kepal
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
