import React from 'react';
import { School, MapPin, UserCheck, Award, Calendar, Hash, Edit3, CheckCircle, ExternalLink } from 'lucide-react';
import { SchoolConfig } from '../types';

interface SchoolIdentityCardProps {
  config: SchoolConfig;
  onEdit: () => void;
}

export const SchoolIdentityCard: React.FC<SchoolIdentityCardProps> = ({ config, onEdit }) => {
  return (
    <div className="rounded-2xl bg-slate-800/80 border border-slate-700/60 p-6 shadow-xl shadow-slate-950/20 flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-700/60">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
              {config.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt="Logo Sekolah"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.querySelector('.school-fallback')?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`school-fallback ${config.logoUrl ? 'hidden' : ''} text-emerald-400`}>
                <School className="w-8 h-8" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50">
                  Identitas Institusi
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1">
                {config.namaSekolah || 'Belum Dikonfigurasi'}
              </h3>
              <p className="text-xs text-slate-400">
                Tahun Ajaran: <span className="text-slate-200 font-semibold">{config.tahunPelajaran || '-'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onEdit}
            title="Edit Identitas Sekolah"
            className="p-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 transition-all flex items-center gap-1.5 text-xs font-medium"
          >
            <Edit3 className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Ubah</span>
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-sm">
          
          {/* NPSN / NSM */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Hash className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-medium">NPSN / NSM</p>
              <p className="text-sm font-semibold text-slate-100 truncate">
                {config.npsnNsm || 'Belum diisi'}
              </p>
            </div>
          </div>

          {/* Kepala Sekolah */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-medium">Kepala Sekolah / Madrasah</p>
              <p className="text-sm font-semibold text-slate-100 truncate">
                {config.kepalaSekolah || 'Belum diisi'}
              </p>
            </div>
          </div>

          {/* Alamat */}
          <div className="sm:col-span-2 flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-medium">Alamat Institusi</p>
              <p className="text-sm text-slate-200 line-clamp-2">
                {config.alamat || 'Belum ada alamat yang tersimpan.'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Card Footer: Metadata info */}
      <div className="pt-3 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Status: Terkonfigurasi</span>
        </div>
        {config.terakhirDiperbarui && (
          <span className="text-slate-400">
            Pembaruan terakhir: {new Date(config.terakhirDiperbarui).toLocaleString('id-ID')}
          </span>
        )}
      </div>
    </div>
  );
};
