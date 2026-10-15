import React from 'react';
import {
  LayoutDashboard,
  Bell,
  Music,
  CalendarCheck,
  CalendarX,
  History,
  Settings,
  HardDriveDownload,
  Users,
  Info,
  LogOut,
  X,
  School,
  Shield,
  UserCheck,
  LogIn,
  ExternalLink,
  ChevronRight,
  Palette
} from 'lucide-react';
import { ActiveAppView, AuthSession, DatabaseStatus } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ThemeSwitcher } from './ThemeSwitcher';

interface SidebarProps {
  activeView: ActiveAppView;
  setActiveView: (view: ActiveAppView) => void;
  isOpen: boolean;
  onClose: () => void;
  authSession: AuthSession;
  onOpenLogin: () => void;
  onLogout: () => void;
  totalJadwalCount: number;
  totalSuaraCount: number;
  totalLiburCount: number;
  totalUsersCount: number;
  dbStatus: DatabaseStatus;
  schoolName: string;
  logoUrl?: string;
}

interface NavItem {
  id: ActiveAppView;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
  adminOnly?: boolean;
  category: 'utama' | 'manajemen' | 'sistem';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isOpen,
  onClose,
  authSession,
  onOpenLogin,
  onLogout,
  totalJadwalCount,
  totalSuaraCount,
  totalLiburCount,
  totalUsersCount,
  dbStatus,
  schoolName,
  logoUrl
}) => {
  const { themeClasses, isLight, isEmerald } = useTheme();
  const isAdmin = authSession.user?.role === 'Admin';

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5 text-emerald-400" />,
      category: 'utama'
    },
    {
      id: 'jadwal',
      label: 'Jadwal Bel',
      icon: <Bell className="w-5 h-5 text-amber-400" />,
      badge: totalJadwalCount,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      category: 'utama'
    },
    {
      id: 'suara',
      label: 'Suara Bel',
      icon: <Music className="w-5 h-5 text-cyan-400" />,
      badge: totalSuaraCount,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      category: 'utama'
    },
    {
      id: 'hariAktif',
      label: 'Hari Aktif',
      icon: <CalendarCheck className="w-5 h-5 text-teal-400" />,
      category: 'manajemen'
    },
    {
      id: 'hariLibur',
      label: 'Hari Libur',
      icon: <CalendarX className="w-5 h-5 text-rose-400" />,
      badge: totalLiburCount,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      category: 'manajemen'
    },
    {
      id: 'riwayat',
      label: 'Riwayat Bel',
      icon: <History className="w-5 h-5 text-purple-400" />,
      category: 'manajemen'
    },
    {
      id: 'backup',
      label: 'Backup & Export',
      icon: <HardDriveDownload className="w-5 h-5 text-indigo-400" />,
      category: 'sistem'
    },
    {
      id: 'pengguna',
      label: 'Pengguna',
      icon: <Users className="w-5 h-5 text-blue-400" />,
      badge: totalUsersCount,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      adminOnly: true,
      category: 'sistem'
    },
    {
      id: 'konfigurasi',
      label: 'Konfigurasi Sistem',
      icon: <Settings className="w-5 h-5 text-emerald-400" />,
      category: 'sistem'
    },
    {
      id: 'tentang',
      label: 'Tentang Aplikasi',
      icon: <Info className="w-5 h-5 text-sky-400" />,
      category: 'sistem'
    }
  ];

  const handleSelectNav = (view: ActiveAppView) => {
    setActiveView(view);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 border-r flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          themeClasses.sidebarBg
        } ${themeClasses.border} ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className={`p-4 border-b flex items-center justify-between ${themeClasses.cardSubtleBg} ${themeClasses.border}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center overflow-hidden flex-shrink-0">
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
              <div className={`fallback-icon ${logoUrl ? 'hidden' : ''} text-emerald-400`}>
                <School className="w-5 h-5" />
              </div>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                v5.0 Final
              </span>
              <h2 className={`text-sm font-bold truncate mt-0.5 ${themeClasses.textPrimary}`}>
                Bel Sekolah Digital
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile / Login Session Bar */}
        <div className={`p-3 border-b ${themeClasses.cardSubtleBg} ${themeClasses.border}`}>
          {authSession.isLoggedIn && authSession.user ? (
            <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                  authSession.user.role === 'Admin'
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/50'
                    : 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/50'
                }`}>
                  {(authSession.user.nama || (authSession.user as any).namaLengkap || authSession.user.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${themeClasses.textPrimary}`}>
                    {authSession.user.nama || (authSession.user as any).namaLengkap || authSession.user.username || 'Pengguna'}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                      authSession.user.role === 'Admin'
                        ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                    }`}>
                      {authSession.user.role || 'Operator'}
                    </span>
                    <span className="text-[10px] text-slate-400">@{authSession.user.username}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Keluar / Logout"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/40"
            >
              <LogIn className="w-4 h-4" />
              <span>Login Pengguna</span>
            </button>
          )}
        </div>

        {/* Navigation Menu List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
          {/* Section: Menu Utama */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Menu Utama
            </p>
            <div className="space-y-1">
              {navItems.filter(item => item.category === 'utama').map((item) => {
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNav(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/50'
                        : isLight
                        ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={isActive ? 'text-white' : ''}>
                        {item.icon}
                      </div>
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : item.badgeColor || (isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700')
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Operasional & Kalender */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Jadwal &amp; Kalender
            </p>
            <div className="space-y-1">
              {navItems.filter(item => item.category === 'manajemen').map((item) => {
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNav(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/50'
                        : isLight
                        ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={isActive ? 'text-white' : ''}>
                        {item.icon}
                      </div>
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : item.badgeColor || (isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700')
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Pengaturan & Sistem */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Sistem &amp; Pengaturan
            </p>
            <div className="space-y-1">
              {navItems.filter(item => item.category === 'sistem').map((item) => {
                const isActive = activeView === item.id;
                const isRestricted = item.adminOnly && !isAdmin;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNav(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/50'
                        : isLight
                        ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={isActive ? 'text-white' : ''}>
                        {item.icon}
                      </div>
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isRestricted && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                          Admin
                        </span>
                      )}
                      {item.badge !== undefined && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isActive
                            ? 'bg-white/20 text-white border-white/30'
                            : item.badgeColor || (isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700')
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Database Live Status Indicator Footer */}
        <div className={`p-3 border-t text-xs ${themeClasses.cardSubtleBg} ${themeClasses.border}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Database Sheets</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              dbStatus.connected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              {dbStatus.connected ? 'Online (7 Sheet)' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate max-w-[140px]" title={schoolName}>
              {schoolName}
            </span>
            <span>2026/2027</span>
          </div>
        </div>
      </aside>
    </>
  );
};
