import React from 'react';
import { DailyJournal } from '../../types';
import {
  X,
  FileText,
  Calendar,
  Clock,
  Tag,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface JournalDetailModalProps {
  journal: DailyJournal | null;
  onClose: () => void;
}

export const JournalDetailModal: React.FC<JournalDetailModalProps> = ({
  journal,
  onClose
}) => {
  if (!journal) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-300 text-emerald-950 text-xs font-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-900" />
            DISETUJUI SENSEI ⭐
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-300 text-cyan-950 text-xs font-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]">
            <Clock3 className="w-3.5 h-3.5 text-cyan-900" />
            MENUNGGU REVIEW SENSEI ⏳
          </span>
        );
      case 'revision_requested':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-300 text-amber-950 text-xs font-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]">
            <AlertCircle className="w-3.5 h-3.5 text-amber-900" />
            PERLU REVISI ⚠️
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]">
            DRAF MISI ✏️
          </span>
        );
    }
  };

  return (
    <div
      id="journal-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        id="journal-detail-modal-card"
        className="comic-card bg-white rounded-3xl border-[3.5px] border-black shadow-[8px_8px_0px_0px_#000] max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-[3px] border-black flex items-center justify-between bg-yellow-300 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-black border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
              <FileText className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-950 leading-tight">
                POW! 📜 DETAIL CATATAN MISI JURNAL
              </h3>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {journal.date}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {journal.duration_hours} Jam EXP
                </span>
              </div>
            </div>
          </div>

          <button
            id="btn-close-journal-detail"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white border-2 border-black text-slate-900 hover:bg-rose-300 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#000]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Status & Category */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-black">
            <div>{getStatusBadge(journal.approval_status)}</div>
            {journal.learning_category && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-200 text-purple-950 text-xs font-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]">
                <Tag className="w-3 h-3 text-purple-900" />
                {journal.learning_category}
              </span>
            )}
          </div>

          {/* Title */}
          <div>
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1">
              🎯 Judul Misi Kegiatan:
            </span>
            <h4 className="text-base sm:text-lg font-black text-slate-950 leading-snug">
              {journal.activity_title}
            </h4>
          </div>

          {/* Description */}
          <div>
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1">
              📝 Rincian Catatan Kegiatan:
            </span>
            <div className="p-4 bg-yellow-50/80 rounded-2xl border-2 border-black text-xs sm:text-sm text-slate-900 font-bold leading-relaxed whitespace-pre-line shadow-[2px_2px_0px_0px_#000]">
              {journal.activity_description}
            </div>
          </div>

          {/* Challenges & Solutions */}
          {(journal.challenges || journal.solutions_or_results) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {journal.challenges && (
                <div className="p-3.5 bg-amber-100 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                  <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider block mb-1">
                    👾 Rintangan / Kendala:
                  </span>
                  <p className="text-xs font-bold text-amber-950 leading-relaxed">
                    {journal.challenges}
                  </p>
                </div>
              )}

              {journal.solutions_or_results && (
                <div className="p-3.5 bg-sky-100 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                  <span className="text-[10px] font-black text-blue-950 uppercase tracking-wider block mb-1">
                    💡 Solusi & Pencapaian:
                  </span>
                  <p className="text-xs font-bold text-blue-950 leading-relaxed">
                    {journal.solutions_or_results}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Attachment Preview */}
          {journal.attachment_url && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                📸 Lampiran Bukti Karya:
              </span>
              {journal.attachment_url.startsWith('http') || journal.attachment_url.startsWith('data:image') ? (
                <div className="rounded-2xl overflow-hidden border-2 border-black bg-white max-h-64 flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
                  <img
                    src={journal.attachment_url}
                    alt="Lampiran Jurnal"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                </div>
              ) : (
                <a
                  href={journal.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="comic-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-black bg-white text-blue-700 hover:text-blue-900 text-xs font-black shadow-[2px_2px_0px_0px_#000]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="truncate max-w-sm">{journal.attachment_url}</span>
                </a>
              )}
            </div>
          )}

          {/* Mentor Feedback */}
          {journal.mentor_feedback && (
            <div className="p-4 bg-emerald-200 rounded-2xl border-2 border-black text-emerald-950 space-y-1 shadow-[2px_2px_0px_0px_#000]">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                <MessageSquare className="w-4 h-4 text-emerald-900" />
                <span>Ulasan & Masukan Sensei Pembimbing:</span>
              </div>
              <p className="text-xs font-bold italic text-emerald-950">
                "{journal.mentor_feedback}"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-black bg-slate-50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="comic-btn-primary px-5 py-2 rounded-xl bg-yellow-300 border-2 border-black text-black text-xs font-black hover:bg-yellow-400 cursor-pointer shadow-[2px_2px_0px_0px_#000]"
          >
            TUTUP DOKUMEN 👍
          </button>
        </div>
      </div>
    </div>
  );
};
