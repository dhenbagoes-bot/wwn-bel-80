import React, { useState, useRef } from 'react';
import {
  Music,
  Plus,
  Play,
  Square,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Volume2,
  Sparkles,
  Save,
  X,
  Link,
  FileAudio,
  Upload,
  Zap,
  Info,
  Clock,
  Cloud,
  HardDrive
} from 'lucide-react';
import { SuaraBelItem } from '../types';
import { DEFAULT_SAMPLE_SOUNDS } from '../constants/defaultData';
import { processAndOptimizeAudio, AudioInspectionResult } from '../utils/audioOptimizer';
import { registerSessionAudio } from '../utils/audioPlayer';
import { useTheme } from '../context/ThemeContext';

interface SoundManagementViewProps {
  suaraList: SuaraBelItem[];
  onSaveAll: (items: SuaraBelItem[]) => Promise<boolean>;
  onUploadAudioToDrive?: (params: {
    fileName: string;
    base64Data: string;
    mimeType: string;
    namaSuara: string;
    tipe: string;
    keterangan: string;
    ukuran?: string;
  }) => Promise<{ success: boolean; url?: string; message?: string }>;
  onPlayPreview: (url: string) => Promise<boolean>;
  onStopPreview: () => void;
  playingSoundUrl: string | null;
  isSaving: boolean;
  onRefresh: () => void;
  onActivateAudio: () => void;
  isAudioActive: boolean;
  isCloudConnected?: boolean;
}

export const SoundManagementView: React.FC<SoundManagementViewProps> = ({
  suaraList,
  onSaveAll,
  onUploadAudioToDrive,
  onPlayPreview,
  onStopPreview,
  playingSoundUrl,
  isSaving,
  onRefresh,
  onActivateAudio,
  isAudioActive,
  isCloudConnected = true
}) => {
  const { themeClasses, isLight, isEmerald } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SuaraBelItem | null>(null);

  // Sound Source Mode in Modal: 'upload' | 'preset' | 'url'
  const [soundSourceMode, setSoundSourceMode] = useState<'upload' | 'preset' | 'url'>('upload');

  // Form Fields
  const [formNama, setFormNama] = useState('');
  const [formUrl, setFormUrl] = useState('preset:westminster');
  const [formTipe, setFormTipe] = useState('Bel Standar');
  const [formStatus, setFormStatus] = useState(true);
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingMsg, setProcessingMsg] = useState<string | null>(null);
  const [uploadedAudioInfo, setUploadedAudioInfo] = useState<AudioInspectionResult | null>(null);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<SuaraBelItem | null>(null);

  const filteredSounds = suaraList.filter(s =>
    s.namaSuara.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.keterangan && s.keterangan.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setSoundSourceMode('upload');
    setFormNama('');
    setFormUrl('preset:westminster');
    setFormTipe('Bel Standar');
    setFormStatus(true);
    setFormKeterangan('');
    setUploadedAudioInfo(null);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item: SuaraBelItem) => {
    setEditingItem(item);
    if (item.urlFile.startsWith('preset:')) {
      setSoundSourceMode('preset');
    } else if (item.urlFile.includes('drive.google.com') || item.urlFile.startsWith('http')) {
      setSoundSourceMode('url');
    } else {
      setSoundSourceMode('upload');
    }
    setFormNama(item.namaSuara);
    setFormUrl(item.urlFile);
    setFormTipe(item.tipe);
    setFormStatus(item.statusAktif);
    setFormKeterangan(item.keterangan || '');
    setUploadedAudioInfo(null);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Handle Local File Selection & Audio Inspection/Optimization
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setProcessingMsg(null);
    setFormError(null);

    try {
      const result = await processAndOptimizeAudio(file, (msg) => {
        setProcessingMsg(msg);
      });

      setUploadedAudioInfo(result);
      if (result.dataUrl) {
        registerSessionAudio(file.name, result.dataUrl);
      }

      // Auto-populate nama suara jika belum diisi
      if (!formNama.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setFormNama(`Bel ${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}`);
      }

      // Auto-set keterangan dengan detail ukuran & durasi
      const compressionNote = result.isCompressed
        ? ` (${result.format}, ${result.optimizedSizeStr}, durasi: ${result.durationFormatted}, dioptimalkan hemat ${result.reductionPercentage}%)`
        : ` (${result.format}, ${result.originalSizeStr}, durasi: ${result.durationFormatted})`;

      if (!formKeterangan) {
        setFormKeterangan(`Google Drive Audio${compressionNote}`);
      }

    } catch (err: any) {
      setFormError(err.message || 'Gagal memproses berkas audio.');
      setUploadedAudioInfo(null);
    } finally {
      setIsProcessingFile(false);
      setProcessingMsg(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formNama.trim()) {
      setFormError('Nama suara bel wajib diisi.');
      return;
    }

    // 1. Jika mode Upload File ke Google Drive
    if (soundSourceMode === 'upload') {
      if (uploadedAudioInfo && onUploadAudioToDrive) {
        setIsUploadingToDrive(true);
        try {
          const uploadRes = await onUploadAudioToDrive({
            fileName: uploadedAudioInfo.fileName,
            base64Data: uploadedAudioInfo.dataUrl,
            mimeType: uploadedAudioInfo.format === 'WAV' ? 'audio/wav' : 'audio/mpeg',
            namaSuara: formNama.trim(),
            tipe: formTipe,
            keterangan: formKeterangan.trim(),
            ukuran: uploadedAudioInfo.optimizedSizeStr || uploadedAudioInfo.originalSizeStr
          });

          if (uploadRes.success) {
            if (uploadRes.url) {
              registerSessionAudio(uploadRes.url, uploadedAudioInfo.dataUrl);
            }
            setIsFormModalOpen(false);
            return;
          } else {
            setFormError(uploadRes.message || 'Gagal mengunggah file ke Google Drive.');
            return;
          }
        } catch (upErr: any) {
          setFormError('Error unggah Google Drive: ' + upErr.message);
          return;
        } finally {
          setIsUploadingToDrive(false);
        }
      } else if (!uploadedAudioInfo && !editingItem) {
        setFormError('Harap pilih file audio MP3/WAV dari perangkat Anda.');
        return;
      }
    }

    // 2. Mode Preset atau URL Eksternal
    let finalUrl = formUrl.trim();
    if (soundSourceMode === 'preset') {
      if (!formUrl.startsWith('preset:')) {
        finalUrl = 'preset:westminster';
      }
    } else if (soundSourceMode === 'url') {
      if (!formUrl.trim().startsWith('http') && !formUrl.trim().startsWith('data:')) {
        setFormError('URL audio harus diawali dengan http:// atau https://');
        return;
      }
    }

    let soundId = editingItem ? editingItem.id : `SB-${String(suaraList.length + 1).padStart(3, '0')}`;
    if (!editingItem && suaraList.some(s => s.id === soundId)) {
      soundId = `SB-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;
    }
    const newItem: SuaraBelItem = {
      id: soundId,
      namaSuara: formNama.trim(),
      urlFile: finalUrl,
      tipe: formTipe,
      statusAktif: formStatus,
      keterangan: formKeterangan.trim(),
      format: soundSourceMode === 'upload' ? uploadedAudioInfo?.format : undefined,
      ukuran: soundSourceMode === 'upload' ? (uploadedAudioInfo?.optimizedSizeStr || uploadedAudioInfo?.originalSizeStr) : undefined
    };

    let updatedList: SuaraBelItem[];
    if (editingItem) {
      updatedList = suaraList.map(s => (s.id === editingItem.id ? newItem : s));
    } else {
      updatedList = [...suaraList, newItem];
    }

    const success = await onSaveAll(updatedList);
    if (success) {
      setIsFormModalOpen(false);
    } else {
      setFormError('Gagal menyimpan suara ke Google Spreadsheet.');
    }
  };

  const handleToggleStatus = async (id: string, newStatus: boolean) => {
    const updatedList = suaraList.map(s => (s.id === id ? { ...s, statusAktif: newStatus } : s));
    await onSaveAll(updatedList);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const updatedList = suaraList.filter(s => s.id !== itemToDelete.id);
    const success = await onSaveAll(updatedList);
    if (success) {
      setItemToDelete(null);
    }
  };

  const handleLoadSampleSounds = async () => {
    if (confirm('Muat 5 nada suara bel standar ke Google Spreadsheet?')) {
      await onSaveAll(DEFAULT_SAMPLE_SOUNDS);
    }
  };

  const handlePreviewClick = async (url: string) => {
    if (playingSoundUrl === url) {
      onStopPreview();
    } else {
      if (!isAudioActive) {
        onActivateAudio();
      }
      await onPlayPreview(url);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Summary */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 text-cyan-400">
              <Music className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Manajemen Suara Bel</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  100% Cloud (Drive & Spreadsheet)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Kelola file audio MP3/WAV (disimpan di Google Drive) dan nada synthesizer bawaan untuk bel otomatis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleLoadSampleSounds}
              disabled={isSaving}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Muat Nada Standar</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-950/60 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah / Upload Suara</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className={`rounded-2xl border shadow-xl overflow-hidden ${themeClasses.cardBg}`}>
        {/* Table Controls */}
        <div className={`p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${themeClasses.cardSubtleBg} ${themeClasses.border}`}>
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama suara, keterangan, atau Drive ID..."
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${themeClasses.inputBg}`}
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-slate-400 font-medium">
              Total: <strong className="text-white">{filteredSounds.length}</strong> Suara
            </span>
            <button
              onClick={onRefresh}
              disabled={isSaving}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Perbarui data dari Google Spreadsheet"
            >
              <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className={`text-[11px] uppercase tracking-wider font-bold border-b ${themeClasses.cardSubtleBg} text-slate-400 ${themeClasses.border}`}>
              <tr>
                <th className="py-3 px-4 text-center w-12">No</th>
                <th className="py-3 px-4">Nama Suara</th>
                <th className="py-3 px-4">Tipe / Kategori</th>
                <th className="py-3 px-4">Sumber Audio (Cloud / Preset)</th>
                <th className="py-3 px-4 text-center">Preview</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSounds.length > 0 ? (
                filteredSounds.map((sound, idx) => {
                  const isPlaying = playingSoundUrl === sound.urlFile;
                  const isPreset = sound.urlFile.startsWith('preset:');
                  const isDrive = sound.urlFile.includes('drive.google.com');

                  return (
                    <tr
                      key={`${sound.id || 'sound'}-${idx}`}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        !sound.statusAktif ? 'opacity-60 bg-slate-950/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Nama Suara & Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl ${
                            isPreset
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : isDrive
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          }`}>
                            <Music className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs">{sound.namaSuara}</span>
                              {sound.format && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                                  {sound.format}
                                </span>
                              )}
                            </div>
                            {sound.keterangan && (
                              <p className="text-[11px] text-slate-400 truncate max-w-xs">{sound.keterangan}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Tipe / Kategori */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-200">
                          {sound.tipe || 'Bel Standar'}
                        </span>
                      </td>

                      {/* Sumber Audio */}
                      <td className="py-3.5 px-4">
                        {isPreset ? (
                          <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px]">
                            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Preset Synthesizer: {sound.urlFile.replace('preset:', '')}</span>
                          </div>
                        ) : isDrive ? (
                          <div className="flex items-center gap-1.5 text-blue-400 font-mono text-[11px] truncate max-w-xs">
                            <Cloud className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">Google Drive Audio Cloud</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[11px] truncate max-w-xs">
                            <Link className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{sound.urlFile}</span>
                          </div>
                        )}
                      </td>

                      {/* Preview Button */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handlePreviewClick(sound.urlFile)}
                          className={`p-2 rounded-xl border transition-all inline-flex items-center gap-1.5 text-xs font-bold ${
                            isPlaying
                              ? 'bg-rose-600 hover:bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-950 animate-pulse'
                              : 'bg-slate-800 hover:bg-cyan-600 border-slate-700 text-slate-200 hover:text-white'
                          }`}
                          title={isPlaying ? 'Hentikan Suara' : 'Dengarkan Suara'}
                        >
                          {isPlaying ? (
                            <>
                              <Square className="w-3.5 h-3.5 fill-white" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Play</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(sound.id, !sound.statusAktif)}
                          disabled={isSaving}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 mx-auto ${
                            sound.statusAktif
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                          }`}
                        >
                          {sound.statusAktif ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(sound)}
                            disabled={isSaving}
                            title="Edit Suara"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setItemToDelete(sound)}
                            disabled={isSaving}
                            title="Hapus Suara"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 border border-slate-700 hover:border-rose-800/60 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Music className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs">Belum ada suara bel terdaftar.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT SUARA */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className={`relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col ${themeClasses.cardBg}`}>
            
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${themeClasses.cardSubtleBg} ${themeClasses.border}`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingItem ? 'Edit Suara Bel' : 'Tambah & Upload Suara Bel (Cloud)'}
                  </h3>
                  <p className="text-xs text-slate-400">Disimpan ke Google Drive & Google Spreadsheet</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-600/50 text-xs text-rose-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p>{formError}</p>
                </div>
              )}

              {/* Source Mode Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Pilih Sumber Audio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSoundSourceMode('upload')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      soundSourceMode === 'upload'
                        ? 'bg-cyan-600 text-white border-cyan-500 shadow-md'
                        : 'border-slate-700 bg-slate-950/50 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Drive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSoundSourceMode('preset')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      soundSourceMode === 'preset'
                        ? 'bg-cyan-600 text-white border-cyan-500 shadow-md'
                        : 'border-slate-700 bg-slate-950/50 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Preset Chime</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSoundSourceMode('url')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      soundSourceMode === 'url'
                        ? 'bg-cyan-600 text-white border-cyan-500 shadow-md'
                        : 'border-slate-700 bg-slate-950/50 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Link className="w-3.5 h-3.5" />
                    <span>URL Web</span>
                  </button>
                </div>
              </div>

              {/* SECTION: 1. UPLOAD FILE KE GOOGLE DRIVE */}
              {soundSourceMode === 'upload' && (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-5 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all hover:border-cyan-500/80 ${
                      uploadedAudioInfo
                        ? 'border-emerald-500/60 bg-emerald-500/5'
                        : 'border-slate-700 hover:bg-slate-950/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/mp3,audio/mpeg,audio/wav,audio/x-wav,.mp3,.wav"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-2.5">
                      <Cloud className="w-6 h-6" />
                    </div>

                    <p className="text-xs font-bold text-white">
                      {isProcessingFile
                        ? 'Sedang Memeriksa Berkas Audio...'
                        : 'Pilih File Suara (MP3 / WAV) untuk Diunggah ke Drive'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      File akan disimpan ke Google Drive dan dapat diakses dari seluruh perangkat (Laptop/HP/Tablet)
                    </p>
                  </div>

                  {/* Progress Compression Message */}
                  {processingMsg && (
                    <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-600/50 text-xs text-amber-200 flex items-center gap-2 animate-pulse">
                      <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>{processingMsg}</span>
                    </div>
                  )}

                  {/* Upload Inspection & Compression Details Card */}
                  {uploadedAudioInfo && (
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileAudio className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white truncate max-w-[200px]">
                            {uploadedAudioInfo.fileName}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                          {uploadedAudioInfo.format}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">DURASI</span>
                          <strong className="text-white font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            {uploadedAudioInfo.durationFormatted}
                          </strong>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">UKURAN AWAL</span>
                          <strong className="text-slate-300 font-mono">{uploadedAudioInfo.originalSizeStr}</strong>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
                          <span className="text-[10px] text-slate-400 block">UKURAN CLOUD</span>
                          <strong className="text-emerald-400 font-mono flex items-center gap-1">
                            {uploadedAudioInfo.isCompressed ? <Zap className="w-3 h-3 text-amber-400" /> : null}
                            {uploadedAudioInfo.optimizedSizeStr}
                          </strong>
                        </div>
                      </div>

                      {/* Preview Button for Uploaded File */}
                      <button
                        type="button"
                        onClick={() => handlePreviewClick(uploadedAudioInfo.dataUrl)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                          playingSoundUrl === uploadedAudioInfo.dataUrl
                            ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                            : 'bg-cyan-600 hover:bg-cyan-500 border-cyan-500 text-white'
                        }`}
                      >
                        {playingSoundUrl === uploadedAudioInfo.dataUrl ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-white" />
                            <span>Hentikan Preview</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Preview Suara Sebelum Disimpan</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: 2. PRESET CHIME */}
              {soundSourceMode === 'preset' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Pilih Melodi Synthesizer Bawaan
                  </label>
                  <select
                    value={formUrl.startsWith('preset:') ? formUrl : 'preset:westminster'}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 ${themeClasses.inputBg}`}
                  >
                    <option value="preset:westminster">Melodi Westminster (Klasik 4 Nada - Masuk / Pulang)</option>
                    <option value="preset:triple_chime">Triple Chime Ceria (3 Tingkat - Istirahat / Dhuha)</option>
                    <option value="preset:ding_dong">Bel Ding Dong Lembut (Pergantian Jam Pelajaran)</option>
                    <option value="preset:siren">Nada Peringatan / Sirine Apel Pagi</option>
                  </select>
                </div>
              )}

              {/* SECTION: 3. URL WEB EKSTERNAL */}
              {soundSourceMode === 'url' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    URL File Audio (MP3 / WAV / Google Drive Link)
                  </label>
                  <input
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://drive.google.com/uc?export=download&id=... atau URL MP3"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 ${themeClasses.inputBg}`}
                  />
                </div>
              )}

              {/* Nama Suara Bel */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nama Suara Bel *
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Bel Masuk KBM / Nada Istirahat"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 ${themeClasses.inputBg}`}
                />
              </div>

              {/* Kategori & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Kategori / Tipe
                  </label>
                  <select
                    value={formTipe}
                    onChange={(e) => setFormTipe(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 ${themeClasses.inputBg}`}
                  >
                    <option value="Bel Standar">Bel Standar</option>
                    <option value="Nada Chime">Nada Chime</option>
                    <option value="Lagu/Mars">Lagu / Mars</option>
                    <option value="Sirine">Sirine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Status Aktif
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormStatus(!formStatus)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      formStatus
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {formStatus ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Keterangan Tambahan
                </label>
                <input
                  type="text"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Contoh: Digunakan untuk bel pergantian jam dan bel masuk"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 ${themeClasses.inputBg}`}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingToDrive || isProcessingFile}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-950/60 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isUploadingToDrive
                      ? 'Mengunggah ke Drive...'
                      : isSaving
                      ? 'Menyimpan ke Cloud...'
                      : 'Simpan ke Google Cloud'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-900/60 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Hapus Suara Bel</h4>
                <p className="text-xs text-slate-400">Perubahan akan langsung disimpan ke Cloud</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Apakah Anda yakin ingin menghapus suara <strong>"{itemToDelete.namaSuara}"</strong> dari daftar suara bel?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
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
