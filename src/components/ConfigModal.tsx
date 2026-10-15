import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Globe,
  School,
  Hash,
  Calendar,
  MapPin,
  UserCheck,
  Image,
  Link,
  Wrench,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Palette,
  Sun,
  Moon,
  Upload,
  Layers,
  Check,
  Building
} from 'lucide-react';
import { SchoolConfig, DatabaseStatus, AppTheme } from '../types';
import { TIMEZONE_OPTIONS, PRESET_LOGOS } from '../constants/defaultData';
import { testGasConnection, uploadLogoToDriveViaGAS } from '../services/gasApi';
import { useTheme } from '../context/ThemeContext';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SchoolConfig;
  apiUrl: string;
  onSave: (newConfig: SchoolConfig, newApiUrl: string) => Promise<boolean>;
  onInitSheets: (apiUrl: string) => Promise<boolean>;
  isSaving: boolean;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  apiUrl,
  onSave,
  onInitSheets,
  isSaving
}) => {
  const { theme, setTheme, themeClasses } = useTheme();
  const [activeTab, setActiveTab] = useState<'identity' | 'theme' | 'connection' | 'presets'>('identity');
  const [formData, setFormData] = useState<SchoolConfig>({
    ...config,
    semester: config.semester || 'Ganjil',
    nipKepalaSekolah: config.nipKepalaSekolah || '',
    theme: config.theme || theme || 'emerald'
  });
  const [customApiUrl, setCustomApiUrl] = useState<string>(apiUrl);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadMsg, setLogoUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Test connection state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    latencyMs?: number;
    error?: string;
  } | null>(null);

  // Init sheets state
  const [isInitializingSheets, setIsInitializingSheets] = useState(false);
  const [initFeedback, setInitFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...config,
        semester: config.semester || 'Ganjil',
        nipKepalaSekolah: config.nipKepalaSekolah || '',
        theme: config.theme || theme || 'emerald'
      });
      setCustomApiUrl(apiUrl);
      setTestResult(null);
      setInitFeedback(null);
      setLogoUploadMsg(null);
    }
  }, [isOpen, config, apiUrl, theme]);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof SchoolConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectTheme = (selectedTheme: AppTheme) => {
    setTheme(selectedTheme);
    setFormData(prev => ({
      ...prev,
      theme: selectedTheme
    }));
  };

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoUploadMsg({ type: 'error', text: 'Format file harus berupa gambar (PNG, JPG, JPEG, WEBP, SVG).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoUploadMsg({ type: 'error', text: 'Ukuran file maksimal 5 MB.' });
      return;
    }

    setIsUploadingLogo(true);
    setLogoUploadMsg(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        if (!customApiUrl) {
          // If no API URL yet, use base64 data URL directly
          handleInputChange('logoUrl', base64Data);
          setLogoUploadMsg({ type: 'success', text: 'Logo berhasil dimuat.' });
          setIsUploadingLogo(false);
          return;
        }

        const res = await uploadLogoToDriveViaGAS(customApiUrl, {
          fileName: file.name,
          base64Data,
          mimeType: file.type
        });

        if (res.success && res.url) {
          handleInputChange('logoUrl', res.url);
          setLogoUploadMsg({ type: 'success', text: '✅ Logo berhasil diunggah ke Google Drive & disimpan ke Cloud!' });
        } else {
          // Fallback to data URI if upload failed
          handleInputChange('logoUrl', base64Data);
          setLogoUploadMsg({ type: 'error', text: res.error || 'Gagal upload ke Drive, menggunakan logo lokal sementara.' });
        }
      } catch (err: any) {
        setLogoUploadMsg({ type: 'error', text: 'Error: ' + err.message });
      } finally {
        setIsUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testGasConnection(customApiUrl);
      setTestResult({
        tested: true,
        success: res.success,
        message: res.message,
        latencyMs: res.latencyMs,
        error: res.error
      });
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        message: 'Gagal menguji koneksi.',
        error: err.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunInitSheets = async () => {
    if (!customApiUrl) return;
    setIsInitializingSheets(true);
    setInitFeedback(null);
    try {
      const success = await onInitSheets(customApiUrl);
      if (success) {
        setInitFeedback('Inisialisasi 7 sheet berhasil dijalankan!');
      } else {
        setInitFeedback('Gagal melakukan inisialisasi sheet. Periksa izin eksekusi Web App.');
      }
    } catch (err: any) {
      setInitFeedback('Error: ' + err.message);
    } finally {
      setIsInitializingSheets(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSave(formData, customApiUrl);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className={`relative w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh] ${themeClasses.cardBg}`}>
        
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${themeClasses.cardSubtleBg} ${themeClasses.border}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">
                Konfigurasi Sistem &amp; Tema
              </h3>
              <p className="text-xs text-slate-400">
                Atur identitas lembaga, preferensi tema tampilan, dan koneksi Google Spreadsheet
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

        {/* Modal Tabs */}
        <div className={`flex border-b px-6 gap-2 overflow-x-auto ${themeClasses.cardSubtleBg} ${themeClasses.border}`}>
          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'identity'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <School className="w-4 h-4" />
            <span>Identitas Sekolah</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'theme'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Tema Tampilan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('connection')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'connection'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link className="w-4 h-4" />
            <span>Koneksi Spreadsheet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'presets'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Pilihan Logo</span>
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: IDENTITAS SEKOLAH */}
          {activeTab === 'identity' && (
            <div className="space-y-5 animate-fade-in">
              
              {/* Nama Sekolah */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nama Sekolah / Madrasah *</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaSekolah}
                  onChange={(e) => handleInputChange('namaSekolah', e.target.value)}
                  placeholder="Contoh: MTs Al Islam Ngleses / SMA Negeri 1 Nusantara"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm ${themeClasses.inputBg}`}
                />
              </div>

              {/* NPSN/NSM & Tahun Pelajaran & Semester */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-indigo-400" />
                    <span>NPSN / NSM *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.npsnNsm}
                    onChange={(e) => handleInputChange('npsnNsm', e.target.value)}
                    placeholder="Contoh: 20123456 / 131234567890"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono ${themeClasses.inputBg}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tahun Pelajaran *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tahunPelajaran}
                    onChange={(e) => handleInputChange('tahunPelajaran', e.target.value)}
                    placeholder="Contoh: 2026/2027"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm ${themeClasses.inputBg}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Semester *</span>
                  </label>
                  <select
                    value={formData.semester || 'Ganjil'}
                    onChange={(e) => handleInputChange('semester', e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm ${themeClasses.inputBg}`}
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>

              {/* Kepala Sekolah & NIP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                    <span>Nama Kepala Sekolah / Madrasah *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.kepalaSekolah}
                    onChange={(e) => handleInputChange('kepalaSekolah', e.target.value)}
                    placeholder="Contoh: Drs. H. Ahmad Dahlan, M.Pd."
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm ${themeClasses.inputBg}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    <span>NIP / NUPTK Kepala Sekolah</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nipKepalaSekolah || ''}
                    onChange={(e) => handleInputChange('nipKepalaSekolah', e.target.value)}
                    placeholder="Contoh: 19750101 200003 1 001"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono ${themeClasses.inputBg}`}
                  />
                </div>
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Alamat Lengkap Institusi *</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.alamat}
                  onChange={(e) => handleInputChange('alamat', e.target.value)}
                  placeholder="Contoh: Jl. Pendidikan No. 45, Kompleks Madrasah Terpadu, Jakarta"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm resize-none ${themeClasses.inputBg}`}
                />
              </div>

              {/* Zona Waktu */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Zona Waktu Operasional *</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <label
                      key={tz.value}
                      className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                        formData.zonaWaktu === tz.value
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{tz.short}</span>
                        <input
                          type="radio"
                          name="zonaWaktu"
                          value={tz.value}
                          checked={formData.zonaWaktu === tz.value}
                          onChange={(e) => handleInputChange('zonaWaktu', e.target.value as any)}
                          className="accent-emerald-500"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                        {tz.city}
                      </p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Logo URL & File Upload to Drive */}
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5 text-purple-400" />
                    <span>Logo Resmi Sekolah / Madrasah</span>
                  </label>
                  <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                    <Upload className={`w-3.5 h-3.5 ${isUploadingLogo ? 'animate-spin' : ''}`} />
                    <span>{isUploadingLogo ? 'Mengunggah...' : 'Unggah Logo ke Google Drive'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileUpload}
                      disabled={isUploadingLogo}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex gap-3 items-center">
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                    placeholder="https://... (URL gambar logo PNG / JPG / Google Drive)"
                    className={`flex-1 px-3.5 py-2.5 rounded-xl text-sm ${themeClasses.inputBg}`}
                  />
                  {formData.logoUrl ? (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
                      <img
                        src={formData.logoUrl}
                        alt="Preview"
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : null}
                </div>

                {logoUploadMsg && (
                  <p className={`text-xs ${logoUploadMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {logoUploadMsg.text}
                  </p>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: PEMILIH TEMA TAMPILAN */}
          {activeTab === 'theme' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Palette className="w-4 h-4 text-emerald-400" />
                  <span>Pilih Tema Tampilan Aplikasi (Tersinkron Cloud)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Tema yang Anda pilih akan disimpan ke Google Spreadsheet sehingga seluruh perangkat (Laptop, HP, PC, Tablet) menggunakan tema yang konsisten.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* 1. Emerald / Madrasah Theme */}
                <button
                  type="button"
                  onClick={() => handleSelectTheme('emerald')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all relative overflow-hidden ${
                    (formData.theme || theme) === 'emerald'
                      ? 'bg-[#0B2C22] border-emerald-500 shadow-lg ring-2 ring-emerald-500/40 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-emerald-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      <span>Emerald Madrasah</span>
                    </span>
                    {(formData.theme || theme) === 'emerald' && (
                      <span className="p-1 rounded-full bg-emerald-500 text-slate-950">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div className="h-12 w-full rounded-xl bg-[#061B14] border border-emerald-800/80 p-2 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 w-16 bg-emerald-600/50 rounded"></div>
                      <div className="h-1.5 w-10 bg-emerald-700/40 rounded"></div>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-200/80">Nuansa hijau botani islami resmi khas Kementerian Agama & Madrasah.</p>
                </button>

                {/* 2. Dark Theme */}
                <button
                  type="button"
                  onClick={() => handleSelectTheme('dark')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all relative overflow-hidden ${
                    (formData.theme || theme) === 'dark'
                      ? 'bg-slate-900 border-indigo-500 shadow-lg ring-2 ring-indigo-500/40 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                      <Moon className="w-4 h-4" />
                      <span>Dark Modern</span>
                    </span>
                    {(formData.theme || theme) === 'dark' && (
                      <span className="p-1 rounded-full bg-indigo-500 text-white">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div className="h-12 w-full rounded-xl bg-slate-950 border border-slate-800 p-2 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 w-16 bg-slate-700 rounded"></div>
                      <div className="h-1.5 w-10 bg-slate-800 rounded"></div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">Gaya gelap elegan nyaman untuk monitor ruang operator dan laptop.</p>
                </button>

                {/* 3. Light Theme */}
                <button
                  type="button"
                  onClick={() => handleSelectTheme('light')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all relative overflow-hidden ${
                    (formData.theme || theme) === 'light'
                      ? 'bg-slate-100 border-amber-500 shadow-lg ring-2 ring-amber-500/40 text-slate-900'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-600 flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      <span>Light Bersih</span>
                    </span>
                    {(formData.theme || theme) === 'light' && (
                      <span className="p-1 rounded-full bg-amber-500 text-white">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div className="h-12 w-full rounded-xl bg-white border border-slate-200 p-2 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 w-16 bg-slate-300 rounded"></div>
                      <div className="h-1.5 w-10 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">Tampilan terang dengan kontras bersih untuk ruangan kelas dan siang hari.</p>
                </button>

              </div>
            </div>
          )}

          {/* TAB 3: KONEKSI GOOGLE SPREADSHEET */}
          {activeTab === 'connection' && (
            <div className="space-y-5 animate-fade-in">
              
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-700/40 text-xs text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Koneksi Google Apps Script API (100% Cloud)</span>
                </div>
                <p>
                  Seluruh data disimpan langsung ke 7 lembar kerja Google Spreadsheet dan Google Drive.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-cyan-400" />
                  <span>URL Web App Google Apps Script *</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customApiUrl}
                    onChange={(e) => setCustomApiUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono ${themeClasses.inputBg}`}
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || !customApiUrl}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-all flex-shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
                  </button>
                </div>
              </div>

              {/* Test Result Box */}
              {testResult && (
                <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                  testResult.success
                    ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-600/60 text-rose-200'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold">{testResult.message}</p>
                    {testResult.latencyMs && (
                      <p className="text-[11px] text-emerald-400">Latensi Respons: {testResult.latencyMs} ms</p>
                    )}
                    {testResult.error && (
                      <p className="text-[11px] text-rose-300 font-mono mt-1">{testResult.error}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Init 7 Sheets Section */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-amber-400" />
                      <span>Inisialisasi Otomatis 7 Lembar Kerja</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Membuat otomatis sheet Pengaturan, JadwalBel, SuaraBel, HariAktif, HariLibur, RiwayatBel, &amp; Pengguna.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunInitSheets}
                    disabled={isInitializingSheets || !customApiUrl}
                    className="px-3 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-all flex-shrink-0"
                  >
                    <Wrench className={`w-3.5 h-3.5 ${isInitializingSheets ? 'animate-spin' : ''}`} />
                    <span>{isInitializingSheets ? 'Memproses...' : 'Inisialisasi 7 Sheet'}</span>
                  </button>
                </div>

                {initFeedback && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-cyan-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>{initFeedback}</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs text-slate-400">
                Pilih logo institusi sekolah/madrasah siap pakai jika Anda belum memiliki tautan logo khusus:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_LOGOS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      handleInputChange('logoUrl', item.url);
                      setActiveTab('identity');
                    }}
                    className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      formData.logoUrl === item.url
                        ? 'bg-emerald-950/60 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 uppercase">
                        {item.type}
                      </span>
                      <p className="text-xs font-bold text-white truncate mt-1">{item.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className={`pt-4 border-t flex items-center justify-between gap-3 ${themeClasses.border}`}>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              * Perubahan identitas langsung tersimpan ke Google Spreadsheet.
            </span>

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all disabled:opacity-50"
              >
                <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
