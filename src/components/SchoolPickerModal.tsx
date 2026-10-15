import React, { useState, useMemo } from 'react';
import { X, School, Search, CheckCircle2, CloudOff } from 'lucide-react';
import { SchoolEntry } from '../types';
import { useTheme } from '../context/ThemeContext';

interface SchoolPickerModalProps {
  isOpen: boolean;
  schools: SchoolEntry[];
  selectedId: string | null;
  onSelect: (school: SchoolEntry) => void;
  onClose: () => void;
}

export const SchoolPickerModal: React.FC<SchoolPickerModalProps> = ({
  isOpen,
  schools,
  selectedId,
  onSelect,
  onClose
}) => {
  const { isLight } = useTheme();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter(s =>
      s.nama.toLowerCase().includes(q) ||
      (s.kota || '').toLowerCase().includes(q)
    );
  }, [schools, query]);

  // Early return HARUS setelah semua hooks dipanggil (aturan React)
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600/15">
              <School className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Pilih Sekolah / Madrasah
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Satu alamat untuk semua sekolah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        {schools.length > 5 && (
          <div className="px-5 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama sekolah..."
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                    : 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500'
                }`}
              />
            </div>
          </div>
        )}

        {/* List */}
        <div className="p-4 max-h-[50vh] overflow-y-auto space-y-2">
          {filtered.length === 0 ? (
            <div className={`text-center py-10 px-4`}>
              <CloudOff className="w-10 h-10 mx-auto mb-3 text-slate-500" />
              <p className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {schools.length === 0 ? 'Belum ada sekolah terdaftar' : 'Tidak ditemukan'}
              </p>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {schools.length === 0
                  ? 'Tambahkan daftar sekolah di file public/schools.json'
                  : 'Coba kata kunci lain.'}
              </p>
            </div>
          ) : (
            filtered.map((school) => {
              const active = school.id === selectedId;
              return (
                <button
                  key={school.id}
                  onClick={() => onSelect(school)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${
                    active
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : isLight
                        ? 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50'
                        : 'border-slate-700/70 hover:border-emerald-500/60 hover:bg-slate-800/70'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${
                    active ? 'bg-emerald-600/20' : isLight ? 'bg-slate-100' : 'bg-slate-800'
                  }`}>
                    <School className={`w-5 h-5 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {school.nama}
                    </p>
                    {school.kota && (
                      <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {school.kota}
                      </p>
                    )}
                  </div>
                  {active && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={`px-5 py-3 border-t text-xs text-center ${
          isLight ? 'border-slate-200 text-slate-500 bg-slate-50' : 'border-slate-800 text-slate-400 bg-slate-950/50'
        }`}>
          {schools.length} sekolah terdaftar &bull; Data tiap sekolah tersimpan terpisah
        </div>
      </div>
    </div>
  );
};
