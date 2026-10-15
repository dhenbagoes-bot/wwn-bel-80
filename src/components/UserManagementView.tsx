import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Shield,
  ShieldCheck,
  User,
  KeyRound,
  CheckCircle2,
  XCircle,
  Search,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock,
  Calendar,
  X
} from 'lucide-react';
import { PenggunaItem, UserRole, AuthSession } from '../types';

interface UserManagementViewProps {
  usersList: PenggunaItem[];
  onSaveUsers: (newUsers: PenggunaItem[]) => Promise<void>;
  isSaving: boolean;
  authSession: AuthSession;
  onRefresh: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  usersList,
  onSaveUsers,
  isSaving,
  authSession,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | UserRole>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PenggunaItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<PenggunaItem | null>(null);

  // Form State for Add / Edit Modal
  const [formData, setFormData] = useState<{
    id?: string;
    username: string;
    nama: string;
    password: string;
    role: UserRole;
    status: 'Aktif' | 'Nonaktif';
  }>({
    username: '',
    nama: '',
    password: '',
    role: 'Operator',
    status: 'Aktif'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = authSession.user?.role === 'Admin';

  const filteredUsers = usersList.filter((u) => {
    const uName = (u.nama || u.namaLengkap || u.username || '').toLowerCase();
    const uUser = (u.username || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();
    const matchQuery = uUser.includes(query) || uName.includes(query);
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchQuery && matchRole;
  });

  const openAddModal = () => {
    setFormData({
      username: '',
      nama: '',
      password: '',
      role: 'Operator',
      status: 'Aktif'
    });
    setFormError(null);
    setShowPassword(false);
    setIsAddModalOpen(true);
  };

  const openEditModal = (u: PenggunaItem) => {
    setFormData({
      id: u.id,
      username: u.username,
      nama: u.nama,
      password: u.password || '',
      role: u.role,
      status: u.status
    });
    setEditingUser(u);
    setFormError(null);
    setShowPassword(false);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.username.trim()) {
      setFormError('Username wajib diisi.');
      return;
    }
    if (!formData.nama.trim()) {
      setFormError('Nama lengkap pengguna wajib diisi.');
      return;
    }

    if (editingUser) {
      // Check duplicate username if changed
      const exists = usersList.some(
        (u) =>
          u.id !== editingUser.id &&
          u.username.toLowerCase() === formData.username.trim().toLowerCase()
      );
      if (exists) {
        setFormError('Username sudah digunakan oleh akun lain.');
        return;
      }

      const updated = usersList.map((u) => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            username: formData.username.trim(),
            nama: formData.nama.trim(),
            password: formData.password ? formData.password : u.password,
            role: formData.role,
            status: formData.status
          };
        }
        return u;
      });

      await onSaveUsers(updated);
      setEditingUser(null);
    } else {
      // Add new
      if (!formData.password) {
        setFormError('Kata sandi wajib diisi untuk pengguna baru.');
        return;
      }

      const exists = usersList.some(
        (u) => u.username.toLowerCase() === formData.username.trim().toLowerCase()
      );
      if (exists) {
        setFormError('Username sudah terdaftar. Gunakan username lain.');
        return;
      }

      const newId = 'USR-' + (usersList.length + 1).toString().padStart(3, '0');
      const newUser: PenggunaItem = {
        id: newId,
        username: formData.username.trim(),
        nama: formData.nama.trim(),
        password: formData.password,
        role: formData.role,
        status: formData.status
      };

      await onSaveUsers([...usersList, newUser]);
      setIsAddModalOpen(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    if (deletingUser.id === authSession.user?.id) {
      alert('Anda tidak dapat menghapus akun yang sedang Anda gunakan untuk login!');
      setDeletingUser(null);
      return;
    }

    const adminCount = usersList.filter((u) => u.role === 'Admin').length;
    if (deletingUser.role === 'Admin' && adminCount <= 1) {
      alert('Sistem harus menyisakan minimal 1 Administrator!');
      setDeletingUser(null);
      return;
    }

    const updated = usersList.filter((u) => u.id !== deletingUser.id);
    await onSaveUsers(updated);
    setDeletingUser(null);
  };

  const handleToggleStatus = async (user: PenggunaItem) => {
    if (!isAdmin) return;
    if (user.id === authSession.user?.id) {
      alert('Anda tidak dapat menonaktifkan akun sendiri!');
      return;
    }

    const updated = usersList.map((u) => {
      if (u.id === user.id) {
        return {
          ...u,
          status: u.status === 'Aktif' ? ('Nonaktif' as const) : ('Aktif' as const)
        };
      }
      return u;
    });

    await onSaveUsers(updated);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 text-blue-400">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Manajemen Pengguna (Sheet Pengguna)
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                  {usersList.length} Akun
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Kelola hak akses operator dan administrator sistem bel sekolah yang tersimpan di Google Spreadsheet.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onRefresh}
              disabled={isSaving}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
              title="Refresh Data Pengguna"
            >
              <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {isAdmin && (
              <button
                onClick={openAddModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-950/60 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Pengguna</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau username pengguna..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 whitespace-nowrap">Filter Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">Semua Role</option>
              <option value="Admin">Admin Saja</option>
              <option value="Operator">Operator Saja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-300 uppercase tracking-wider font-bold border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-3.5 px-4">No / ID</th>
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Role Akses</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Terakhir Login</th>
                {isAdmin && <th className="py-3.5 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-8 text-center text-slate-400">
                    Tidak ada pengguna yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const isCurrentUser = user.id === authSession.user?.id;

                  return (
                    <tr
                      key={`${user.id || 'user'}-${idx}`}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCurrentUser ? 'bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        #{idx + 1} <span className="text-[10px] text-slate-400">({user.id})</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            user.role === 'Admin'
                              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                              : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {user.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span>{user.nama}</span>
                            {isCurrentUser && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                                Anda
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">
                        @{user.username}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                          user.role === 'Admin'
                            ? 'bg-purple-950/80 text-purple-300 border-purple-700/60'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                        }`}>
                          {user.role === 'Admin' ? <ShieldCheck className="w-3 h-3 text-purple-400" /> : <User className="w-3 h-3 text-emerald-400" />}
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={!isAdmin || isCurrentUser}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                            user.status === 'Aktif'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          } disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                          {user.status === 'Aktif' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-slate-400" />
                          )}
                          <span>{user.status}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {user.terakhirLogin || 'Belum pernah login'}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 transition-colors"
                            title="Edit Pengguna"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingUser(user)}
                            disabled={isCurrentUser}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-rose-400 border border-slate-700 hover:border-rose-800/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit User */}
      {(isAddModalOpen || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {editingUser ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <h3 className="text-sm font-bold text-white">
                  {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-600/50 text-xs text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. kurikulum, guru_piket"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="e.g. Ustadz Abdullah, S.Pd."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {editingUser ? 'Kata Sandi Baru (Kosongkan jika tidak diubah)' : 'Kata Sandi'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'Biarkan kosong untuk mempertahankan' : 'Masukkan password...'}
                    className="w-full px-3.5 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Role Hak Akses
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Operator">Operator (Harian)</option>
                    <option value="Admin">Admin (Akses Penuh)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Status Akun
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-950/60 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengguna'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-900/60 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Konfirmasi Hapus Pengguna</h4>
                <p className="text-xs text-slate-400">Aksi ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Apakah Anda yakin ingin menghapus akun pengguna <strong>{deletingUser.nama}</strong> (@{deletingUser.username})?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSaving}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-950/60 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Menghapus...' : 'Hapus Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
