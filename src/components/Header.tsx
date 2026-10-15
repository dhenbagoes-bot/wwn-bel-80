import React from 'react';
import {
  Menu,
  Settings,
  Database,
  RefreshCw,
  BookOpen,
  School,
  Bell,
  LayoutDashboard,
  Music,
  CalendarCheck,
  CalendarX,
  History,
  Volume2,
  VolumeX,
  Users,
  HardDriveDownload,
  Info,
  LogIn,
  LogOut,
  ShieldCheck,
  User,
  Palette
} from 'lucide-react';
import { DatabaseStatus, ActiveAppView, AuthSession } from '../types';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  schoolName: string;
  npsnNsm: string;
  logoUrl?: string;
  dbStatus: DatabaseStatus;
  isSyncing: boolean;
  activeView: ActiveAppView;
  setActiveView: (view: ActiveAppView) => void;
  onRefresh: () => void;
  onOpenConfig: () => void;
  onOpenGuide: () => void;
  onToggleSidebar: () => void;
  totalJadwalCount: number;
  totalSuaraCount: number;
  totalLiburCount: number;
  isAudioActive: boolean;
  onActivateAudio: () => void;
  authSession: AuthSession;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenSchoolPicker?: () => void;
  hasSchools?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  schoolName,
  npsnNsm,
  logoUrl,
  dbStatus,
  isSyncing,
  activeView,
  setActiveView,
  onRefresh,
  onOpenConfig,
  onOpenGuide,
  onToggleSidebar,
  totalJadwalCount,
  totalSuaraCount,
  totalLiburCount,
  isAudioActive,
  onActivateAudio,
  authSession,
  onOpenLogin,
  onLogout,
  onOpenSchoolPicker,
  hasSchools
}) => {
  const { themeClasses, isLight } = useTheme();

  return (
    <header className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors ${themeClasses.headerBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-3">
          
          {/* Left: Sidebar Toggle & School Info */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onToggleSidebar}
              className={`p-2 rounded-xl border lg:hidden transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* School Logo */}
            <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center overflow-hidden shadow-inner hidden sm:flex">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`fallback-icon ${logoUrl ? 'hidden' : ''} text-emerald-500`}>
                <School className="w-5 h-5" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider">
                  v5.0 Final
                </span>
                <span className={`text-xs hidden md:inline-block ${themeClasses.textMuted}`}>
                  Bel Sekolah &amp; Madrasah Digital
                </span>
              </div>
              <h1 className={`text-sm sm:text-base font-bold truncate tracking-tight ${themeClasses.textPrimary}`}>
                {schoolName || 'SMA / MA Negeri 1 Nusantara'}
              </h1>
            </div>
          </div>

          {/* Center / Quick View Switcher (Visible on Large Desktops) */}
          <div className={`hidden xl:flex items-center p-1 rounded-xl border gap-1 text-xs ${themeClasses.cardSubtleBg} ${themeClasses.border}`}>
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeView === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveView('jadwal')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeView === 'jadwal'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Jadwal ({totalJadwalCount})</span>
            </button>

            <button
              onClick={() => setActiveView('suara')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeView === 'suara'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Suara ({totalSuaraCount})</span>
            </button>

            <button
              onClick={() => setActiveView('riwayat')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeView === 'riwayat'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            
            {/* Theme Switcher Compact */}
            <ThemeSwitcher variant="compact" />

            {/* Audio Button */}
            <button
              onClick={onActivateAudio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                isAudioActive
                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-rose-950/60 border-rose-500/60 text-rose-300 hover:bg-rose-900/60 animate-pulse'
              }`}
              title={isAudioActive ? 'Audio Aktif & Siap' : 'Klik untuk Mengaktifkan Audio'}
            >
              {isAudioActive ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">🟢 AUDIO AKTIF</span>
                  <span className="sm:hidden">🟢 AKTIF</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">🔴 AUDIO OFF</span>
                  <span className="sm:hidden">🔴 OFF</span>
                </>
              )}
            </button>

            {/* Refresh / Sync */}
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              title="Sinkronisasi Spreadsheet"
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Guide */}
            <button
              onClick={onOpenGuide}
              title="Panduan Google Apps Script"
              className={`p-2 rounded-xl border text-xs font-medium hidden sm:flex items-center gap-1.5 transition-all ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
            </button>

            {/* User Session / Login Button */}
            {authSession.isLoggedIn && authSession.user ? (
              <div className="flex items-center gap-1.5 pl-1">
                <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold ${
                  authSession.user.role === 'Admin'
                    ? 'bg-purple-950/60 border-purple-800/50 text-purple-300'
                    : 'bg-emerald-950/60 border-emerald-800/50 text-emerald-300'
                }`}>
                  {authSession.user.role === 'Admin' ? <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> : <User className="w-3.5 h-3.5 text-emerald-400" />}
                  <span className="truncate max-w-[90px]">{authSession.user.nama || (authSession.user as any).namaLengkap || authSession.user.username || 'Pengguna'}</span>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className={`p-2 rounded-xl border transition-colors ${
                    isLight ? 'bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-600 border-slate-300' : 'bg-slate-800 hover:bg-rose-950/50 text-slate-300 hover:text-rose-400 border-slate-700'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}

            {/* School Picker Button (multi-sekolah) */}
            {hasSchools && onOpenSchoolPicker && (
              <button
                onClick={onOpenSchoolPicker}
                title="Ganti Sekolah / Madrasah"
                className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                <School className="w-4 h-4 text-cyan-400" />
                <span className="hidden lg:inline">Sekolah</span>
              </button>
            )}

            {/* Config Button */}
            <button
              onClick={onOpenConfig}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="Konfigurasi Identitas & Tema"
            >
              <Settings className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline">Konfigurasi</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
