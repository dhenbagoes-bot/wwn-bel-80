import React from 'react';
import { Database, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, ShieldCheck, Layers, HelpCircle, Wrench } from 'lucide-react';
import { DatabaseStatus } from '../types';

interface DatabaseStatusCardProps {
  dbStatus: DatabaseStatus;
  apiUrl: string;
  spreadsheetUrl?: string;
  isInitializing: boolean;
  onInitializeSheets: () => void;
  onOpenConfig: () => void;
  onOpenGuide: () => void;
}

export const DatabaseStatusCard: React.FC<DatabaseStatusCardProps> = ({
  dbStatus,
  apiUrl,
  spreadsheetUrl,
  isInitializing,
  onInitializeSheets,
  onOpenConfig,
  onOpenGuide
}) => {
  return (
    <div className="rounded-2xl bg-slate-800/80 border border-slate-700/60 p-6 shadow-xl shadow-slate-950/20 flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border ${
              dbStatus.connected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50">
                  Database Utama
                </span>
                <span className="text-xs text-slate-400 font-mono">Google Spreadsheet</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                {dbStatus.spreadsheetTitle || 'Google Spreadsheet DB'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {spreadsheetUrl ? (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka Google Spreadsheet Langsung"
                className="p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 transition-all flex items-center gap-1.5 text-xs font-medium"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Buka Sheet</span>
                <ExternalLink className="w-3 h-3 text-emerald-400" />
              </a>
            ) : null}

            <button
              onClick={onOpenConfig}
              className="p-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 transition-all text-xs font-medium"
              title="Ubah Konfigurasi URL API"
            >
              Ubah API
            </button>
          </div>
        </div>

        {/* Connection Diagnostics Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            {dbStatus.connected ? (
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{dbStatus.statusText || 'Terhubung & Siap Digunakan'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-400 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Belum Terhubung ke Google Apps Script</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            {dbStatus.latencyMs !== null && (
              <span>Latensi: <strong className="text-slate-200">{dbStatus.latencyMs} ms</strong></span>
            )}
            {dbStatus.lastChecked && (
              <span>Sinkron: <strong className="text-slate-200">{dbStatus.lastChecked}</strong></span>
            )}
          </div>
        </div>

        {/* 5 Required Sheets Status Grid */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Struktur 5 Sheet Database:</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Otomatis & Terproteksi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {dbStatus.sheets.map((sheet) => (
              <div
                key={sheet.name}
                className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/40 flex flex-col justify-between gap-1 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-300">
                    {sheet.name}
                  </span>
                  {sheet.exists ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      <CheckCircle2 className="w-3 h-3" />
                      Ada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                      <AlertCircle className="w-3 h-3" />
                      Perlu Init
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                  {sheet.description || (sheet.exists ? 'Lembar kerja aktif di spreadsheet' : 'Belum dibuat')}
                </p>

                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Baris: {sheet.rowCount ?? 0}</span>
                  <span className="text-[9px] text-slate-400 truncate max-w-[110px]" title={Array.isArray(sheet.headers) ? sheet.headers.join(', ') : ''}>
                    {Array.isArray(sheet.headers) && sheet.headers.length > 0 ? `${sheet.headers.length} Kolom` : (sheet.exists ? 'Tersedia' : 'Siap Dibuat')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Card Footer Actions */}
      <div className="mt-5 pt-4 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Data tersimpan langsung di Google Drive sekolah Anda</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onInitializeSheets}
            disabled={isInitializing || !apiUrl}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40"
          >
            <Wrench className={`w-3.5 h-3.5 ${isInitializing ? 'animate-spin' : ''}`} />
            <span>{isInitializing ? 'Membuat Sheet...' : 'Inisialisasi Sheet'}</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all border border-slate-600/50"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Petunjuk GAS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
