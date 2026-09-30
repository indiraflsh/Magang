import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import { DailyJournal } from '../../types';
import { JournalCreateModal } from './JournalCreateModal';
import { JournalDetailModal } from './JournalDetailModal';
import { 
  GraduationCap, 
  Clock, 
  BookOpen, 
  Award, 
  Building2, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  ChevronDown,
  Sparkles,
  FileText,
  Camera,
  Send,
  UserCheck,
  Edit3,
  Plus,
  ExternalLink,
  History,
  Image as ImageIcon,
  Clock3,
  Tag,
  Flame,
  Check
} from 'lucide-react';

interface StudentDashboardProps {
  onOpenProfileEdit?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onOpenProfileEdit }) => {
  const { profile, internship } = useAuth();
  const { 
    studentProgress, 
    journals, 
    clockIn, 
    clockOut, 
    addJournal, 
    deleteJournal,
    autoSaveMeta 
  } = useProgress();

  const [isJournalCreateOpen, setIsJournalCreateOpen] = useState(false);
  const [selectedJournalForDetail, setSelectedJournalForDetail] = useState<DailyJournal | null>(null);
  const [showJournalHistory, setShowJournalHistory] = useState(false);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  const totalRequired = studentProgress.totalRequiredHours || internship?.total_required_hours || 600;
  const accumulated = studentProgress.accumulatedHours;
  const progressPercent = Math.min(100, Math.round((accumulated / totalRequired) * 100));

  const handleClockOutAction = () => {
    clockOut();
    setNotification('💥 POW! Clock-out berhasil! Durasi 8.0 jam kerja otomatis tersimpan ke total akumulasi EXP magang.');
    setTimeout(() => setNotification(null), 5000);
  };

  const handleClockInAction = () => {
    clockIn();
    setNotification('⚡ ZAP! Presensi masuk berhasil dicatat! Status presensi tersimpan otomatis.');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleJournalCreated = (newJournal: DailyJournal) => {
    addJournal(newJournal);
    if (newJournal.approval_status === 'submitted') {
      setNotification(`💥 Jurnal "${newJournal.activity_title}" berhasil dicatat, tersimpan otomatis, & diajukan ke Sensei!`);
    } else {
      setNotification(`✏️ Draf jurnal "${newJournal.activity_title}" tersimpan otomatis di logbook petualangan.`);
    }
    setTimeout(() => setNotification(null), 4500);
  };

  // Active latest journal
  const latestJournal = journals[0];

  return (
    <div id="student-dashboard" className="space-y-6">
      {/* Banner Notifikasi Comic Style */}
      {notification && (
        <div className="p-4 bg-yellow-200 border-2 border-black rounded-2xl text-slate-900 text-xs sm:text-sm font-black flex items-center justify-between shadow-[3px_3px_0px_0px_#000] animate-bounce">
          <div className="flex items-center gap-2">
            <span className="text-xl">💥</span>
            <span>{notification}</span>
          </div>
          <button 
            onClick={() => setNotification(null)} 
            className="px-2.5 py-1 bg-white hover:bg-yellow-300 border-2 border-black rounded-lg text-xs font-black cursor-pointer shadow-[1.5px_1.5px_0px_0px_#000]"
          >
            OKE! 👍
          </button>
        </div>
      )}

      {/* Header Siswa & Profil Magang - Comic Hero Card */}
      <div className="comic-card bg-white p-5 sm:p-7 relative overflow-hidden border-[3px] border-black shadow-[5px_5px_0px_0px_#000]">
        {/* Decorative comic corner badge */}
        <div className="absolute top-0 right-0 bg-yellow-300 text-black border-l-2 border-b-2 border-black font-black text-[11px] px-3 py-1 shadow-xs uppercase tracking-wider rotate-0">
          ⭐ HERO PROFILE #001
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  referrerPolicy="no-referrer"
                  className="w-18 h-18 rounded-2xl object-cover border-[3px] border-black shadow-[3px_3px_0px_0px_#000]"
                />
              ) : (
                <div className="w-18 h-18 rounded-2xl bg-cyan-400 text-black border-[3px] border-black flex items-center justify-center font-black text-3xl shadow-[3px_3px_0px_0px_#000]">
                  {profile?.full_name?.charAt(0) || 'S'}
                </div>
              )}
              <span className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-emerald-300 rounded-full border-2 border-black flex items-center justify-center font-black text-xs shadow-[1.5px_1.5px_0px_0px_#000]">
                ⚡
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-3 py-0.5 rounded-full bg-yellow-300 text-black text-xs font-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]">
                  🎒 Siswa Hero Magang
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-300 text-emerald-950 text-xs font-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] flex items-center gap-1">
                  ⭐ Status: Siap Beraksi!
                </span>
                {internship?.student_id_number && (
                  <span className="text-xs text-slate-800 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-black">
                    NIM: {internship.student_id_number}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {profile?.full_name || 'Muhammad Fauzan Azhim'}
              </h1>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-bold text-slate-700 mt-1.5">
                <span className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  <GraduationCap className="w-4 h-4 text-blue-700" />
                  {internship?.institution_name || profile?.institution || 'Politeknik Negeri Jakarta'}
                  {internship?.major ? ` • ${internship.major}` : ''}
                </span>
                <span className="flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                  <Building2 className="w-4 h-4 text-purple-700" />
                  {internship?.company_name || 'PT Telkom Indonesia (Persero) Tbk'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenProfileEdit && (
              <button
                id="btn-edit-student-profile"
                onClick={onOpenProfileEdit}
                className="comic-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-yellow-200 text-slate-900 text-xs font-black cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-slate-800" />
                <span>Ubah Kostum / Profil</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar Jam Magang - Comic XP / Stamina Style */}
        <div className="mt-6 pt-5 border-t-2 border-dashed border-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>⚡ EXP & STAMINA JAM KERJA MAGANG:</span>
              </span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                <span className="text-blue-700 font-mono font-black text-base bg-blue-100 px-2 py-0.5 rounded border border-black">{accumulated} Jam</span>
                <span className="text-slate-500"> terkumpul dari target </span>
                <span className="font-mono font-bold text-slate-800">{totalRequired} Jam</span>
              </div>
            </div>
            <span className="text-xs font-black font-mono text-black bg-yellow-300 px-3 py-1 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] self-start sm:self-auto">
              🎯 {progressPercent}% LEVEL CLEAR!
            </span>
          </div>

          <div className="w-full bg-white h-5 rounded-full border-2 border-black p-0.5 overflow-hidden shadow-[2px_2px_0px_0px_#000]">
            <div
              className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 h-full rounded-full border-r-2 border-black comic-stripes transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid 3 Kartu Interaktif Siswa - Comic Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Kartu 1: Presensi Hari Ini */}
        <div className="comic-card bg-sky-50 p-5 flex flex-col justify-between space-y-4 border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-600" />
                Misi Presensi Hari Ini ⚡
              </span>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-white border border-black">
                {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-bold">Misi Masuk (Clock In):</span>
                <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                  {studentProgress.clockInTime || '- Belum Absen -'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-bold">Misi Selesai (Clock Out):</span>
                <span className="font-mono font-black text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {studentProgress.clockOutTime || (studentProgress.attendanceStatus === 'clocked_in' ? 'Sedang Bertugas ⚡' : '- Menunggu Pulang -')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                <span className="text-slate-600 font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Streak Kehadiran:
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-950 bg-amber-200 px-2 py-0.5 rounded-md border border-black">
                  🔥 {studentProgress.streakDays} Hari Berturut
                </span>
              </div>
            </div>
          </div>

          <div>
            {studentProgress.attendanceStatus === 'not_clocked_in' && (
              <button
                id="btn-action-clock-in"
                onClick={handleClockInAction}
                className="comic-btn-primary w-full py-3 bg-yellow-300 hover:bg-yellow-400 text-black text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-[3px_3px_0px_0px_#000]"
              >
                <Camera className="w-4 h-4" />
                <span>POW! 💥 CLOCK IN SEKARANG</span>
              </button>
            )}

            {studentProgress.attendanceStatus === 'clocked_in' && (
              <button
                id="btn-action-clock-out"
                onClick={handleClockOutAction}
                className="comic-btn-primary w-full py-3 bg-rose-400 hover:bg-rose-500 text-black text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-[3px_3px_0px_0px_#000]"
              >
                <Clock className="w-4 h-4" />
                <span>FINISH! 🏁 CLOCK OUT PULANG (+8 Jam EXP)</span>
              </button>
            )}

            {studentProgress.attendanceStatus === 'clocked_out' && (
              <div className="space-y-2">
                <div className="text-center p-3 rounded-xl bg-emerald-200 border-2 border-black text-emerald-950 text-xs font-black shadow-[2px_2px_0px_0px_#000]">
                  ⭐ MISI HARI INI SELESAI & TERSIMPAN! (+8.0 JAM)
                </div>
                <button
                  onClick={handleClockInAction}
                  className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-black rounded-lg border border-black cursor-pointer text-center"
                >
                  Absen Ulang / Shift Tambahan ⚡
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowAttendanceHistory(!showAttendanceHistory)}
              className="w-full mt-2 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-950 text-xs font-black rounded-xl border-2 border-black flex items-center justify-center gap-1 shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>{showAttendanceHistory ? 'Tutup Riwayat Presensi' : `Riwayat Presensi (${studentProgress.attendanceHistory.length})`}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAttendanceHistory ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Kartu 2: Jurnal Kegiatan Terbaru */}
        <div className="comic-card bg-amber-50 p-5 flex flex-col justify-between space-y-4 border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-600" />
                Buku Petualangan (Jurnal) 📖
              </span>
              {latestJournal ? (
                latestJournal.approval_status === 'approved' ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-300 text-emerald-950 border border-black flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-800" />
                    ACC SENSEI ⭐
                  </span>
                ) : latestJournal.approval_status === 'submitted' ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-200 text-blue-950 border border-black flex items-center gap-1">
                    <Clock3 className="w-3 h-3 text-blue-800" />
                    DI REVIEW ⏳
                  </span>
                ) : (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-black">
                    DRAF ✏️
                  </span>
                )
              ) : (
                <span className="text-[10px] font-bold text-slate-500">Belum ada</span>
              )}
            </div>

            {latestJournal ? (
              <div 
                onClick={() => setSelectedJournalForDetail(latestJournal)}
                className="p-3.5 bg-white hover:bg-yellow-100 transition-all rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] space-y-2 cursor-pointer group"
                title="Klik untuk membuka komik detail jurnal"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-black bg-yellow-300 px-2 py-0.5 rounded border border-black truncate max-w-[170px]">
                    {latestJournal.learning_category || 'Technical'}
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono font-black shrink-0">
                    {latestJournal.date} • {latestJournal.duration_hours} Jam
                  </span>
                </div>

                <h4 className="text-xs font-black text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                  {latestJournal.activity_title}
                </h4>

                <p className="text-[11px] text-slate-700 line-clamp-2 leading-relaxed font-medium">
                  {latestJournal.activity_description}
                </p>

                {latestJournal.attachment_url && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-bold pt-0.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Ada foto/bukti aksi nyata 📸</span>
                  </div>
                )}

                {latestJournal.mentor_feedback && (
                  <div className="text-[10px] text-slate-700 font-bold pt-1 border-t border-slate-200 truncate">
                    💬 Sensei: "{latestJournal.mentor_feedback}"
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-white rounded-xl border-2 border-dashed border-black text-center text-xs font-bold text-slate-600">
                Belum ada jurnal yang ditulis hari ini. Tekan tombol di bawah untuk mencatat petualangan barumu!
              </div>
            )}
          </div>

          <div className="space-y-2">
            <button
              id="btn-open-journal-create"
              type="button"
              onClick={() => setIsJournalCreateOpen(true)}
              className="comic-btn-primary w-full py-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-[3px_3px_0px_0px_#000]"
            >
              <FileText className="w-4 h-4" />
              <span>TULIS JURNAL HARI INI ✏️</span>
            </button>

            <button
              type="button"
              id="btn-toggle-journal-history"
              onClick={() => setShowJournalHistory(!showJournalHistory)}
              className="w-full py-1.5 text-slate-800 hover:text-black text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-slate-700" />
              <span>{showJournalHistory ? 'Tutup Riwayat Petualangan' : `Buka Riwayat Logbook (${journals.length})`}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-700 transition-transform ${showJournalHistory ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Kartu 3: Pembimbing & Evaluasi Nilai */}
        <div className="comic-card bg-purple-50 p-5 flex flex-col justify-between space-y-4 border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-600" />
                Sensei & Rapor Nilai 🎓
              </span>
              <span className="text-xs font-black text-black bg-yellow-300 px-2.5 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_0px_#000]">
                PREDIKAT A 🌟
              </span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] space-y-2">
              <div className="text-xs font-black text-slate-900">
                Ir. Hendra Kusuma, S.Kom., M.Kom.
              </div>
              <div className="text-[11px] font-bold text-slate-600">
                Lead Software Engineer • Divisi Digital Platform Telkom
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 font-mono">
                <span className="text-slate-600 font-bold">Skor Nilai Siswa:</span>
                <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-300">89.4 / 100</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-yellow-200 rounded-xl border-2 border-black text-center shadow-[1.5px_1.5px_0px_0px_#000]">
            <span className="text-[11px] font-black text-slate-900">
              💬 "Kerja kerasmu luar biasa! Tetap konsisten sampai akhir periode magang!"
            </span>
          </div>
        </div>
      </div>

      {/* Bagian Riwayat Logbook Jurnal Harian (Expandable) - Comic Chapter View */}
      {showJournalHistory && (
        <div id="journal-history-section" className="comic-card bg-white p-5 sm:p-6 border-[2.5px] border-black shadow-[5px_5px_0px_0px_#000] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-black">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="text-lg">📚</span>
                <span>ARSIP CATATAN PETUALANGAN (LOGBOOK)</span>
              </h3>
              <p className="text-xs font-bold text-slate-600 mt-0.5">
                Total {journals.length} entri jurnal tercatat dalam episode magang ini
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsJournalCreateOpen(true)}
              className="comic-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-black text-xs font-black cursor-pointer self-start sm:self-auto shadow-[2px_2px_0px_0px_#000]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jurnal Baru 💥</span>
            </button>
          </div>

          <div className="space-y-3">
            {journals.map((j) => (
              <div
                key={j.id}
                onClick={() => setSelectedJournalForDetail(j)}
                className="p-3.5 bg-slate-50 hover:bg-yellow-50 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                      {j.activity_title}
                    </span>
                    {j.approval_status === 'approved' ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 border border-black">
                        DISETUJUI ⭐
                      </span>
                    ) : j.approval_status === 'submitted' ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-200 text-blue-950 border border-black">
                        REVIEW SENSEI ⏳
                      </span>
                    ) : (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-black">
                        DRAF ✏️
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 font-medium line-clamp-1">
                    {j.activity_description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-700" />
                      {j.date}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-700" />
                      {j.duration_hours} Jam
                    </span>
                    {j.learning_category && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-slate-700" />
                        {j.learning_category}
                      </span>
                    )}
                    {j.attachment_url && (
                      <span className="text-emerald-700 font-black flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Ada Bukti Aksi 📸
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <span className="text-xs font-black text-black bg-white px-2.5 py-1 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000] group-hover:bg-yellow-300 inline-flex items-center gap-1">
                    BACA KOMIK <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bagian Riwayat Presensi Kehadiran (Expandable) */}
      {showAttendanceHistory && (
        <div id="attendance-history-section" className="comic-card bg-white p-5 sm:p-6 border-[2.5px] border-black shadow-[5px_5px_0px_0px_#000] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-black">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="text-lg">⏱️</span>
                <span>LOGBOOK PRESENSI KEHADIRAN (AUTO-SAVED)</span>
              </h3>
              <p className="text-xs font-bold text-slate-600 mt-0.5">
                Total {studentProgress.attendanceHistory.length} sesi presensi tercatat otomatis
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black px-3 py-1 bg-emerald-200 text-emerald-950 border-2 border-black rounded-xl shadow-[1.5px_1.5px_0px_0px_#000]">
                Total: {studentProgress.accumulatedHours} Jam Kerja
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100 border-2 border-black text-slate-900 font-black">
                  <th className="p-2.5">Tanggal & Hari</th>
                  <th className="p-2.5">Jam Masuk</th>
                  <th className="p-2.5">Jam Pulang</th>
                  <th className="p-2.5">Durasi Jam</th>
                  <th className="p-2.5">Status Kehadiran</th>
                  <th className="p-2.5">Lokasi / GPS</th>
                  <th className="p-2.5">Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black">
                {studentProgress.attendanceHistory.map((att) => (
                  <tr key={att.id} className="hover:bg-yellow-50/60 font-bold">
                    <td className="p-2.5 whitespace-nowrap">
                      <span className="font-mono font-black text-slate-900">{att.date}</span>
                      <span className="text-slate-500 block text-[11px] font-normal">{att.dayName}</span>
                    </td>
                    <td className="p-2.5 font-mono text-emerald-700 font-black whitespace-nowrap">
                      {att.clockIn}
                    </td>
                    <td className="p-2.5 font-mono text-slate-800 font-black whitespace-nowrap">
                      {att.clockOut || '-'}
                    </td>
                    <td className="p-2.5 font-mono font-black text-blue-700 whitespace-nowrap">
                      +{att.durationHours} Jam
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border border-black ${
                        att.status === 'Hadir Tepat Waktu' ? 'bg-emerald-200 text-emerald-950' : 'bg-sky-200 text-sky-950'
                      }`}>
                        {att.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600 text-[11px] whitespace-nowrap">
                      📍 {att.location || 'Bandung'}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded border border-black">
                        <Check className="w-3 h-3 text-emerald-700" />
                        Disetujui
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rincian Kontrak Magang Siswa */}
      <div className="comic-card bg-white p-5 sm:p-6 border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
            <span>📜 DOKUMEN KONTRAK MISI MAGANG</span>
          </h3>
          <span className="text-xs font-black text-black bg-yellow-200 px-2 py-0.5 rounded border border-black font-mono">
            ID: {internship?.id || 'MAGANG-2026-001'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-yellow-50 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            <span className="text-slate-500 font-bold block mb-0.5">Mitra Industri</span>
            <span className="font-black text-slate-900">{internship?.company_name || 'PT Telkom Indonesia (Persero) Tbk'}</span>
          </div>

          <div className="p-3 bg-sky-50 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            <span className="text-slate-500 font-bold block mb-0.5">Divisi Skuad</span>
            <span className="font-black text-slate-900">{internship?.department || 'Frontend Engineering Squad'}</span>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            <span className="text-slate-500 font-bold block mb-0.5">Masa Petualangan</span>
            <span className="font-black text-slate-900">
              {internship?.start_date || '01 Agu 2026'} s/d {internship?.end_date || '31 Des 2026'}
            </span>
          </div>

          <div className="p-3 bg-purple-50 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            <span className="text-slate-500 font-bold block mb-0.5">Markas Lokasi</span>
            <span className="font-black text-slate-900 truncate block">
              {internship?.company_address || 'Jl. Japati No. 1, Bandung'}
            </span>
          </div>
        </div>
      </div>

      {/* Modal Buat Jurnal Baru */}
      <JournalCreateModal
        isOpen={isJournalCreateOpen}
        onClose={() => setIsJournalCreateOpen(false)}
        onJournalCreated={handleJournalCreated}
      />

      {/* Modal Detail Jurnal */}
      <JournalDetailModal
        journal={selectedJournalForDetail}
        onClose={() => setSelectedJournalForDetail(null)}
      />
    </div>
  );
};

