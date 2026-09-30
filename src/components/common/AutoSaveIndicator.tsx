import React, { useState } from 'react';
import { 
  Check, 
  Save, 
  RefreshCw, 
  Sparkles, 
  CloudCheck, 
  Clock, 
  RotateCcw, 
  ShieldCheck, 
  X, 
  ChevronDown 
} from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';

export const AutoSaveIndicator: React.FC = () => {
  const { autoSaveMeta, resetAllProgress, studentProgress, journals, mentees } = useProgress();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="relative inline-block text-left" id="autosave-container">
      {/* Trigger Badge Button */}
      <button
        type="button"
        id="btn-toggle-autosave-details"
        onClick={() => setShowDetails(!showDetails)}
        className={`comic-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-all ${
          autoSaveMeta.isSaving
            ? 'bg-amber-300 text-amber-950 animate-pulse'
            : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950'
        }`}
        title="Klik untuk melihat detail penyimpanan otomatis"
      >
        {autoSaveMeta.isSaving ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-amber-900 animate-spin" />
            <span className="hidden sm:inline">Menyimpan...</span>
            <span className="sm:hidden">Save...</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping hidden sm:inline-block" />
            <Save className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
            <span className="hidden md:inline">Progres Tersimpan:</span>
            <span className="font-mono text-[11px] font-extrabold">{autoSaveMeta.lastSavedAt || 'Baru Saja'}</span>
            <ChevronDown className="w-3 h-3 text-emerald-800 ml-0.5" />
          </>
        )}
      </button>

      {/* Popover Detail Penyimpanan Progres */}
      {showDetails && (
        <div 
          id="popover-autosave-details"
          className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border-[2.5px] border-black shadow-[6px_6px_0px_0px_#000] p-4 z-50 animate-fade-in"
        >
          {/* Header Popover */}
          <div className="flex items-center justify-between border-b-2 border-black pb-2.5 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-base">💾</span>
              <div>
                <h4 className="text-xs font-black text-slate-900 tracking-tight leading-none">
                  AUTO-SAVE & FIREBASE AKTIF
                </h4>
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <span>🔥</span>
                  <span>Tersinkron Firestore & Local Storage</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDetails(false)}
              className="w-6 h-6 rounded-lg border border-black bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-black cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ringkasan Data yang Disimpan */}
          <div className="space-y-2 text-xs mb-3.5">
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-300 flex items-center justify-between font-bold text-emerald-950">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                Presensi & Jam Magang
              </span>
              <span className="font-mono font-black">{studentProgress.accumulatedHours} Jam</span>
            </div>

            <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-300 flex items-center justify-between font-bold text-blue-950">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-700" />
                Catatan Jurnal Logbook
              </span>
              <span className="font-mono font-black">{journals.length} Jurnal</span>
            </div>

            <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-300 flex items-center justify-between font-bold text-purple-950">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-purple-700" />
                Hero Murid Bimbingan
              </span>
              <span className="font-mono font-black">{mentees.length} Siswa</span>
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-600 bg-yellow-50 p-2 rounded-xl border border-yellow-300 mb-3 flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Tiap kali kamu Clock-in/out, menulis jurnal, menambah murid, atau review nilai, data langsung tersimpan otomatis. Refresh halaman kapan pun tanpa takut data hilang!
            </span>
          </div>

          {/* Reset Action */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold">
              Aksi terakhir: {autoSaveMeta.lastAction}
            </span>
            <button
              type="button"
              id="btn-reset-simulation-data"
              onClick={() => {
                if (window.confirm('Apakah Anda yakin ingin mereset seluruh progres magang kembali ke data awal simulasi?')) {
                  resetAllProgress();
                  setShowDetails(false);
                }
              }}
              className="text-[10px] font-black text-rose-700 hover:text-rose-900 underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Data Awal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
