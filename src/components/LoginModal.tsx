import React, { useState } from 'react';
import {
  X,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  School,
  LogIn
} from 'lucide-react';
import { PenggunaItem, AuthSession } from '../types';
import { loginUserViaGAS } from '../services/gasApi';
import { useTheme } from '../context/ThemeContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiUrl: string;
  usersList: PenggunaItem[];
  onLoginSuccess: (user: PenggunaItem) => void;
  authSession: AuthSession;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  apiUrl,
  usersList,
  onLoginSuccess,
  authSession
}) => {
  const { themeClasses, isLight } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim()) {
      setErrorMsg('Harap masukkan username Anda.');
      return;
    }
    if (!password) {
      setErrorMsg('Harap masukkan kata sandi / password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Jika API GAS aktif, lakukan verifikasi ke server Google Apps Script
      if (apiUrl && apiUrl.trim().startsWith('http')) {
        const gasRes = await loginUserViaGAS(apiUrl, username.trim(), password);
        if (gasRes.success && gasRes.user) {
          setSuccessMsg(gasRes.message || 'Login berhasil!');
          setTimeout(() => {
            onLoginSuccess(gasRes.user!);
            onClose();
          }, 600);
          return;
        } else if (gasRes.error) {
          // Jika server GAS gagal atau belum ter-setup, coba verifikasi dengan data pengguna lokal
          console.warn('GAS login error, fallback to local users list:', gasRes.error);
        } else {
          setErrorMsg(gasRes.message || 'Username atau kata sandi tidak cocok.');
          setIsLoading(false);
          return;
        }
      }

      // 2. Fallback verifikasi lokal jika offline atau API GAS tidak terjangkau
      const matchedUser = usersList.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (!matchedUser) {
        setErrorMsg(`Pengguna "${username}" tidak ditemukan dalam database.`);
        setIsLoading(false);
        return;
      }

      if (matchedUser.status !== 'Aktif') {
        setErrorMsg(`Akun "${username}" saat ini Nonaktif. Silakan hubungi Administrator.`);
        setIsLoading(false);
        return;
      }

      if (matchedUser.password && matchedUser.password !== password) {
        setErrorMsg('Kata sandi / password yang dimasukkan salah.');
        setIsLoading(false);
        return;
      }

      const verifiedUser: PenggunaItem = {
        ...matchedUser,
        terakhirLogin: new Date().toLocaleString('id-ID')
      };

      setSuccessMsg(`Login berhasil sebagai ${verifiedUser.nama} (${verifiedUser.role})`);
      setTimeout(() => {
        onLoginSuccess(verifiedUser);
        onClose();
      }, 600);

    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat proses login.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickCredential = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className={`border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl ${themeClasses.cardBg}`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${themeClasses.cardSubtleBg} ${themeClasses.border}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${themeClasses.textPrimary}`}>Login Pengguna</h3>
              <p className="text-xs text-slate-400">
                Masuk ke sistem Bel Sekolah / Madrasah Digital
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-600/50 flex items-start gap-2.5 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-600/50 flex items-center gap-2.5 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Username Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin atau operator"
                autoComplete="username"
                className={`w-full pl-10 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.inputBg}`}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Kata Sandi / Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                autoComplete="current-password"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.inputBg}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Credential Helper Buttons */}
          <div className={`p-3 rounded-xl border text-xs ${themeClasses.cardSubtleBg} ${themeClasses.border}`}>
            <p className="text-[11px] font-semibold text-slate-400 mb-2">
              Akun Bawaan Sheet Pengguna:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickCredential('admin', '123')}
                className="px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/50 text-purple-300 text-[11px] font-bold text-left transition-all"
              >
                👑 <strong>admin</strong> (Akses Penuh)
                <span className="block text-[10px] text-purple-400/80 font-normal">pass: 123</span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredential('operator', '123')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-300 text-[11px] font-bold text-left transition-all"
              >
                🎧 <strong>operator</strong> (Harian)
                <span className="block text-[10px] text-emerald-400/80 font-normal">pass: 123</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/60 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Memverifikasi Akun...' : 'Masuk Sekarang'}</span>
          </button>
        </form>

        {/* Footer Note */}
        <div className={`p-3.5 border-t text-center text-[11px] text-slate-400 ${themeClasses.cardSubtleBg} ${themeClasses.border}`}>
          Database pengguna tersinkronisasi dengan sheet <strong>Pengguna</strong> di Google Spreadsheet.
        </div>

      </div>
    </div>
  );
};
