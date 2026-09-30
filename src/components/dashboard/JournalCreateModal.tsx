import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { uploadJournalAttachment } from '../../lib/storage';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { DailyJournal, JournalStatus } from '../../types';
import {
  X,
  FileText,
  Calendar,
  Clock,
  Tag,
  Paperclip,
  Upload,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  Trash2
} from 'lucide-react';

interface JournalCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJournalCreated: (newJournal: DailyJournal) => void;
}

const CATEGORY_OPTIONS = [
  'Technical (Coding & Architecture)',
  'UI/UX Design & Prototyping',
  'Testing & Quality Assurance',
  'Database & DevOps',
  'Project Management & Scrum',
  'Analisis & Riset Data',
  'Soft Skills & Presentasi'
];

export const JournalCreateModal: React.FC<JournalCreateModalProps> = ({
  isOpen,
  onClose,
  onJournalCreated
}) => {
  const { profile, internship } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [durationHours, setDurationHours] = useState('8.0');
  const [description, setDescription] = useState('');
  const [challenges, setChallenges] = useState('');
  const [solutions, setSolutions] = useState('');
  const [submitAsDraft, setSubmitAsDraft] = useState(false);

  // Attachment state
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showUrlField, setShowUrlField] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Harap pilih berkas gambar (PNG, JPG, WebP) untuk bukti dokumentasi.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 5MB.');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setFilePreview(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Judul aktivitas kegiatan harian wajib diisi.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Deskripsi rincian kegiatan wajib diisi.');
      return;
    }

    const duration = parseFloat(durationHours);
    if (isNaN(duration) || duration <= 0) {
      setErrorMessage('Durasi jam kerja harus berupa angka lebih dari 0.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalAttachmentUrl = attachmentUrl.trim() || null;

      // Handle upload if file selected
      if (selectedFile) {
        const internId = internship?.id || profile?.id || 'demo-internship';
        const uploadRes = await uploadJournalAttachment(internId, selectedFile);
        if (uploadRes.url) {
          finalAttachmentUrl = uploadRes.url;
        }
      }

      const approvalStatus: JournalStatus = submitAsDraft ? 'draft' : 'submitted';

      const journalId = `jrn-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const newJournal: DailyJournal = {
        id: journalId,
        internship_id: internship?.id || 'demo-internship-uuid-001',
        user_id: profile?.id || 'demo-student-uuid-001',
        date,
        activity_title: title.trim(),
        activity_description: description.trim(),
        challenges: challenges.trim() || null,
        solutions_or_results: solutions.trim() || null,
        attachment_url: finalAttachmentUrl,
        learning_category: category,
        duration_hours: duration,
        approval_status: approvalStatus,
        mentor_feedback: null,
        verified_by: null,
        verified_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: profile || undefined
      };

      // Try inserting into Supabase if configured
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase.from('daily_journals').insert({
            internship_id: newJournal.internship_id,
            user_id: newJournal.user_id,
            date: newJournal.date,
            activity_title: newJournal.activity_title,
            activity_description: newJournal.activity_description,
            challenges: newJournal.challenges,
            solutions_or_results: newJournal.solutions_or_results,
            attachment_url: newJournal.attachment_url,
            learning_category: newJournal.learning_category,
            duration_hours: newJournal.duration_hours,
            approval_status: newJournal.approval_status
          });

          if (error) {
            console.warn('Supabase daily_journals insert warning:', error.message);
          }
        } catch (dbErr) {
          console.warn('Supabase DB error, using local state:', dbErr);
        }
      }

      // Notify parent component
      onJournalCreated(newJournal);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Gagal menyimpan jurnal harian. Coba lagi.');
    }
  };

  return (
    <div
      id="journal-create-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        id="journal-create-modal-card"
        className="comic-card bg-white rounded-3xl border-[3.5px] border-black shadow-[8px_8px_0px_0px_#000] max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b-[3px] border-black flex items-center justify-between bg-yellow-300 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-black border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
              <FileText className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-950 leading-tight">
                POW! 💥 TULIS JURNAL KEGIATAN HARIAN
              </h3>
              <p className="text-xs font-bold text-slate-800">
                Catat misi magang, tantangan teknis, serta bukti hasil karya seru hari ini!
              </p>
            </div>
          </div>
          <button
            id="btn-close-journal-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white border-2 border-black text-slate-900 hover:bg-rose-300 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#000]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-200 border-2 border-black text-rose-950 text-xs font-black flex items-center gap-2 shadow-[2px_2px_0px_0px_#000]">
              <AlertCircle className="w-4 h-4 text-rose-800 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Baris 1: Tanggal, Durasi, Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label
                htmlFor="input-journal-date"
                className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5"
              >
                📅 Tanggal Misi
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-journal-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border-2 border-black bg-white focus:bg-yellow-50 text-slate-900 font-bold shadow-[2px_2px_0px_0px_#000]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="input-journal-duration"
                className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5"
              >
                ⏱️ Durasi Jam Kerja
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-journal-duration"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="16"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border-2 border-black bg-white focus:bg-yellow-50 text-slate-900 font-black font-mono shadow-[2px_2px_0px_0px_#000]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="select-journal-category"
                className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5"
              >
                🏷️ Kategori Ilmu
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="select-journal-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border-2 border-black bg-white focus:bg-yellow-50 text-slate-900 font-bold shadow-[2px_2px_0px_0px_#000]"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Baris 2: Judul Kegiatan */}
          <div>
            <label
              htmlFor="input-journal-title"
              className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5"
            >
              🎯 Judul Misi / Aktivitas Hari Ini <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-journal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Implementasi Tema Komik Seru & Fitur Upload Foto"
              required
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border-2 border-black bg-white focus:bg-yellow-50 text-slate-900 font-bold placeholder:text-slate-400 shadow-[2px_2px_0px_0px_#000]"
            />
          </div>

          {/* Baris 3: Rincian Deskripsi Kegiatan */}
          <div>
            <label
              htmlFor="textarea-journal-description"
              className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5"
            >
              📝 Rincian Aktivitas & Hasil Nyata <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="textarea-journal-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceritakan dengan jelas apa yang kamu kerjakan, fitur apa yang sukses dibuat, atau meeting yang dihadiri..."
              required
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border-2 border-black bg-white focus:bg-yellow-50 text-slate-900 font-medium placeholder:text-slate-400 leading-relaxed resize-y shadow-[2px_2px_0px_0px_#000]"
            />
          </div>

          {/* Baris 4: Kendala & Solusi (2 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="textarea-journal-challenges"
                className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5"
              >
                👾 Kendala / Rintangan (Opsional)
              </label>
              <textarea
                id="textarea-journal-challenges"
                rows={2}
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder="Misal: Bug responsif di mobile, styling css, atau konfigurasi Supabase..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border-2 border-black bg-white focus:bg-yellow-50 text-slate-900 placeholder:text-slate-400 resize-y shadow-[2px_2px_0px_0px_#000]"
              />
            </div>

            <div>
              <label
                htmlFor="textarea-journal-solutions"
                className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5"
              >
                💡 Solusi & Trik Penyelesaian (Opsional)
              </label>
              <textarea
                id="textarea-journal-solutions"
                rows={2}
                value={solutions}
                onChange={(e) => setSolutions(e.target.value)}
                placeholder="Misal: Diskusi dengan mentor tim, membaca dokumentasi, atau menambah CSS helper..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border-2 border-black bg-white focus:bg-yellow-50 text-slate-900 placeholder:text-slate-400 resize-y shadow-[2px_2px_0px_0px_#000]"
              />
            </div>
          </div>

          {/* Baris 5: Bukti Dokumentasi / Foto Lampiran Kerja */}
          <div className="p-4 rounded-2xl border-2 border-black bg-sky-50 space-y-3 shadow-[2px_2px_0px_0px_#000]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-blue-700" />
                <span>📸 Bukti Aksi / Tangkapan Layar (Screenshot)</span>
              </label>
              <span className="text-[11px] font-bold text-slate-600">JPG, PNG, WebP (Maks. 5MB)</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/jpg"
              onChange={handleFileSelect}
              className="hidden"
              id="input-journal-file"
            />

            {/* Preview Box & Button */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {filePreview ? (
                <div className="relative group w-24 h-20 rounded-xl overflow-hidden border-2 border-black bg-white shrink-0 shadow-[2px_2px_0px_0px_#000]">
                  <img
                    src={filePreview}
                    alt="Preview Dokumentasi"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="absolute top-1 right-1 p-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 border border-black shadow-xs cursor-pointer"
                    title="Hapus gambar"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="btn-upload-journal-photo"
                  onClick={() => fileInputRef.current?.click()}
                  className="comic-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-black bg-white hover:bg-yellow-200 text-slate-900 text-xs font-black cursor-pointer shadow-[2px_2px_0px_0px_#000]"
                >
                  <Upload className="w-4 h-4 text-blue-700" />
                  <span>{selectedFile ? 'Ganti Foto Bukti 📸' : 'Pilih Foto dari Galeri 📸'}</span>
                </button>

                {selectedFile && (
                  <span className="text-xs text-emerald-800 font-black bg-emerald-100 px-2 py-1 rounded-md border border-black">
                    ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                )}
              </div>
            </div>

            {/* Tautan URL Eksternal (Opsional) */}
            <div className="pt-1">
              {!showUrlField ? (
                <button
                  type="button"
                  onClick={() => setShowUrlField(true)}
                  className="text-xs text-blue-800 hover:text-blue-950 font-black inline-flex items-center gap-1 cursor-pointer underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Atau tempelkan tautan Figma / GitHub / Dokumen</span>
                </button>
              ) : (
                <div className="space-y-1 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-800">
                      Tautan URL Eksternal Bukti Kerja:
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowUrlField(false)}
                      className="text-[10px] font-black text-slate-600 hover:text-black"
                    >
                      [Tutup]
                    </button>
                  </div>
                  <input
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="https://github.com/my-org/repo/pull/42 atau https://figma.com/..."
                    className="w-full px-3 py-2 text-xs rounded-xl border-2 border-black bg-white focus:bg-yellow-50 text-slate-900 font-bold shadow-[2px_2px_0px_0px_#000]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Opsi Status Pengajuan */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="checkbox-save-draft"
              checked={submitAsDraft}
              onChange={(e) => setSubmitAsDraft(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-2 border-black focus:ring-yellow-400"
            />
            <label htmlFor="checkbox-save-draft" className="text-xs font-black text-slate-800 cursor-pointer">
              Simpan sebagai draf dahulu ✏️ (belum diajukan ke Sensei)
            </label>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-[11px] font-bold text-slate-600">
              {submitAsDraft ? (
                <span>Draf akan tersimpan di arsip logbook pribadi.</span>
              ) : (
                <span>
                  Jurnal akan otomatis masuk ke <strong>Antrean Review Sensei</strong>.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                id="btn-cancel-journal-create"
                onClick={onClose}
                disabled={isSubmitting}
                className="comic-btn-primary px-4 py-2 rounded-xl text-xs font-black text-slate-800 bg-white hover:bg-slate-100 border-2 border-black cursor-pointer shadow-[2px_2px_0px_0px_#000] disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="submit"
                id="btn-submit-journal-entry"
                disabled={isSubmitting}
                className="comic-btn-primary px-5 py-2.5 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-black text-xs font-black border-2 border-black cursor-pointer flex items-center gap-1.5 shadow-[3px_3px_0px_0px_#000] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Jurnal...</span>
                  </>
                ) : submitAsDraft ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Draf ✏️</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>KIRIM KE SENSEI! 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
