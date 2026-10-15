import React, { useState } from 'react';
import { X, Copy, Check, FileSpreadsheet, Code2, Layers, CheckCircle2, ShieldAlert, Sparkles, BookOpen, ExternalLink, ArrowRight } from 'lucide-react';
import { GAS_SCRIPT_CODE } from '../constants/gasScriptCode';
import { STANDARD_SHEET_SPECS } from '../constants/defaultData';

interface ScriptGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConfig: () => void;
}

export const ScriptGuideModal: React.FC<ScriptGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenConfig
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'steps' | 'code' | 'structure'>('steps');

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GAS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Panduan Setup Google Spreadsheet & Apps Script
              </h3>
              <p className="text-xs text-slate-400">
                Langkah mudah menghubungkan Google Spreadsheet sebagai Database Utama
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('steps')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'steps'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Langkah Konfigurasi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'code'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Kode Apps Script (Code.gs)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('structure')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'structure'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Struktur 5 Sheet Database</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: STEPS */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                  1
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Buat Spreadsheet Baru di Google Drive</h4>
                  <p className="text-xs text-slate-300">
                    Buka <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline inline-flex items-center gap-1">sheets.new <ExternalLink className="w-3 h-3" /></a> di browser Anda dan beri nama (misal: <em>Database Bel Sekolah Digital</em>).
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                  2
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Buka Apps Script</h4>
                  <p className="text-xs text-slate-300">
                    Di Google Spreadsheet, klik menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                  3
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white">Salin & Tempel Kode Backend</h4>
                  <p className="text-xs text-slate-300">
                    Hapus semua kode bawaan di editor Apps Script, lalu salin kode dari tab <strong>Kode Apps Script</strong> dan tempel (paste) ke editor. Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">Ctrl + S</kbd> untuk menyimpan.
                  </p>
                  <button
                    onClick={handleCopyCode}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-2 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Kode Berhasil Disalin!' : 'Salin Kode Sekarang'}</span>
                  </button>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                  4
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Deploy (Terapkan) sebagai Aplikasi Web</h4>
                  <p className="text-xs text-slate-300">
                    Klik tombol biru <strong>Terapkan (Deploy)</strong> di kanan atas &gt; <strong>Penerapan baru (New deployment)</strong>.
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside mt-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <li>Pilih jenis: <strong>Aplikasi Web (Web App)</strong> (ikon roda gigi)</li>
                    <li>Jalankan sebagai (Execute as): <strong>Saya / Me</strong></li>
                    <li>Yang memiliki akses (Who has access): <strong>Siapa saja / Anyone</strong> <span className="text-amber-400 font-semibold">(Wajib)</span></li>
                  </ul>
                  <p className="text-[11px] text-slate-400 mt-1">
                    *Saat diminta izin akses Google Drive / Spreadsheet, klik <em>Tinjau Izin &gt; Akun Anda &gt; Lanjutan (Advanced) &gt; Buka Project (tidak aman) &gt; Izinkan</em>.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                  5
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white">Salin URL Aplikasi Web & Sambungkan</h4>
                  <p className="text-xs text-slate-300">
                    Salin <strong>URL Aplikasi Web</strong> yang dihasilkan (berakhiran <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">/exec</code>), lalu buka menu <strong>Konfigurasi Sistem</strong> dan simpan.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenConfig();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <span>Buka Menu Konfigurasi Sistem</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CODE GS */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-300">
                  File: <code className="text-emerald-400 font-mono">Code.gs</code> di Google Apps Script:
                </p>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Seluruh Kode'}</span>
                </button>
              </div>

              <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[420px] leading-relaxed">
                  <code>{GAS_SCRIPT_CODE}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: STRUCTURE */}
          {activeTab === 'structure' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Aplikasi ini otomatis membuat 5 lembar kerja (sheet) tanpa merusak atau menimpa data yang sudah ada:
              </p>

              <div className="space-y-3">
                {STANDARD_SHEET_SPECS.map((sheet) => (
                  <div key={sheet.name} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        <span className="font-mono text-sm font-bold text-white">{sheet.name}</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                        {sheet.name === 'Pengaturan' ? 'Aktif di Tahap 1' : 'Struktur Siap'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5">{sheet.description}</p>
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400 font-mono flex-wrap">
                      <span className="text-slate-500">Kolom Header:</span>
                      {sheet.headers.map((h, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Arsitektur Tahap 1: Google Apps Script Web App Endpoint + Sheet Engine
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Tutup Panduan
          </button>
        </div>

      </div>
    </div>
  );
};
