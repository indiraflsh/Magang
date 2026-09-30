import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import { 
  Briefcase, 
  Users, 
  Clock, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Calendar, 
  UserCheck, 
  ShieldCheck, 
  MessageSquare,
  AlertCircle,
  Eye,
  Check,
  Edit3,
  UserPlus,
  Search,
  Trash2,
  Phone
} from 'lucide-react';
import { StudentAddModal, NewStudentData } from './StudentAddModal';
import { StudentDetailModal } from './StudentDetailModal';

interface MentorDashboardProps {
  onOpenProfileEdit?: () => void;
}

export const MentorDashboard: React.FC<MentorDashboardProps> = ({ onOpenProfileEdit }) => {
  const { profile } = useAuth();
  const {
    mentees,
    attendanceQueue,
    journalQueue,
    addMentee,
    deleteMentee,
    approveAttendance,
    rejectAttendance,
    approveJournal
  } = useProgress();

  // Modals state
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<NewStudentData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Add new student handler
  const handleStudentAdded = (newStudent: NewStudentData) => {
    addMentee(newStudent);
    setNotification(`💥 YAY! Hero Murid baru ${newStudent.name} (${newStudent.nim}) berhasil direkrut & tersimpan permanen!`);
    setTimeout(() => setNotification(null), 5000);
  };

  // Delete student handler
  const handleDeleteStudent = (studentId: string) => {
    deleteMentee(studentId);
    setNotification('Murid magang berhasil dihapus dari daftar bimbingan (perubahan tersimpan).');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApproveAttendanceAction = (id: string, name: string) => {
    approveAttendance(id, name);
    setNotification(`Presensi siswa ${name} berhasil disetujui! Jam kerja ditambahkan ke profil siswa & tersimpan.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRejectAttendanceAction = (id: string, name: string) => {
    rejectAttendance(id, name);
    setNotification(`Presensi siswa ${name} ditolak. Notifikasi disimpan.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApproveJournalAction = (id: string, name: string) => {
    approveJournal(id, name);
    setNotification(`Jurnal harian siswa ${name} disetujui beserta feedback pembimbing & tersimpan otomatis.`);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div id="mentor-dashboard" className="space-y-6">
      {/* Toast Notifikasi Comic Style */}
      {notification && (
        <div className="p-4 bg-yellow-200 border-2 border-black rounded-2xl text-slate-950 text-xs sm:text-sm font-black flex items-center justify-between shadow-[3px_3px_0px_0px_#000] animate-bounce">
          <div className="flex items-center gap-2">
            <span className="text-xl">💥</span>
            <span>{notification}</span>
          </div>
          <button 
            onClick={() => setNotification(null)} 
            className="px-2.5 py-1 bg-white hover:bg-yellow-300 border-2 border-black rounded-lg text-xs font-black cursor-pointer shadow-[1.5px_1.5px_0px_0px_#000]"
          >
            SIAP! 👍
          </button>
        </div>
      )}

      {/* Header Pembimbing - Comic Master Card */}
      <div className="comic-card bg-white p-5 sm:p-7 relative overflow-hidden border-[3px] border-black shadow-[5px_5px_0px_0px_#000]">
        <div className="absolute top-0 right-0 bg-purple-300 text-black border-l-2 border-b-2 border-black font-black text-[11px] px-3 py-1 shadow-xs uppercase tracking-wider">
          🥋 SENSEI COMMAND CENTER
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
                <div className="w-18 h-18 rounded-2xl bg-purple-400 text-black border-[3px] border-black flex items-center justify-center font-black text-3xl shadow-[3px_3px_0px_0px_#000]">
                  {profile?.full_name?.charAt(0) || 'P'}
                </div>
              )}
              <span className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-yellow-300 rounded-full border-2 border-black flex items-center justify-center font-black text-xs shadow-[1.5px_1.5px_0px_0px_#000]">
                👑
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-3 py-0.5 rounded-full bg-purple-300 text-black text-xs font-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]">
                  🥋 Pembimbing Sensei
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-300 text-emerald-950 text-xs font-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Lisensi Verifikator S-Rank
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {profile?.full_name || 'Ir. Hendra Kusuma, S.Kom., M.Kom.'}
              </h1>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-bold text-slate-700 mt-1.5">
                <span className="flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                  <Building2 className="w-4 h-4 text-purple-700" />
                  {profile?.institution || 'PT Telkom Indonesia (Persero) Tbk'}
                </span>
                <span className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  <Users className="w-4 h-4 text-blue-700" />
                  Mengasuh {mentees.length} Hero Murid Magang Aktif
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="btn-add-student-header"
              onClick={() => setIsAddStudentModalOpen(true)}
              className="comic-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-slate-900 text-xs font-black cursor-pointer shadow-[2px_2px_0px_0px_#000]"
            >
              <UserPlus className="w-4 h-4 text-black" />
              <span>+ Tambah Murid Magang</span>
            </button>

            {onOpenProfileEdit && (
              <button
                id="btn-edit-mentor-profile"
                onClick={onOpenProfileEdit}
                className="comic-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-yellow-200 text-slate-900 text-xs font-black cursor-pointer shadow-[2px_2px_0px_0px_#000]"
              >
                <Edit3 className="w-4 h-4 text-slate-800" />
                <span>Ganti Kostum Sensei</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid 4 Kartu Metrik Pembimbing - Comic Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="comic-card bg-cyan-100 p-4 border-2 border-black shadow-[3px_3px_0px_0px_#000] flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-300 text-black border-2 border-black flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_0px_#000]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">Total Bimbingan</span>
            <div className="text-xl font-black text-slate-950 font-mono">{mentees.length} Murid</div>
          </div>
        </div>

        <div className="comic-card bg-yellow-100 p-4 border-2 border-black shadow-[3px_3px_0px_0px_#000] flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-yellow-300 text-black border-2 border-black flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_0px_#000]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">Presensi Pending</span>
            <div className="text-xl font-black text-amber-900 font-mono">{attendanceQueue.length} Pengajuan</div>
          </div>
        </div>

        <div className="comic-card bg-purple-100 p-4 border-2 border-black shadow-[3px_3px_0px_0px_#000] flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-300 text-black border-2 border-black flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_0px_#000]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">Jurnal Pending</span>
            <div className="text-xl font-black text-purple-950 font-mono">{journalQueue.length} Laporan</div>
          </div>
        </div>

        <div className="comic-card bg-emerald-100 p-4 border-2 border-black shadow-[3px_3px_0px_0px_#000] flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-300 text-black border-2 border-black flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_0px_#000]">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">Rata-rata Nilai</span>
            <div className="text-xl font-black text-emerald-950 font-mono">88.5 / 100 ⭐</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Antrean Verifikasi & Daftar Siswa */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Antrean Presensi & Jurnal */}
        <div className="lg:col-span-7 space-y-5">
          {/* Antrean Verifikasi Presensi */}
          <div className="comic-card bg-white p-5 border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-black text-slate-900">
                  ANTREAN PRESENSI SISWA ({attendanceQueue.length}) ⚡
                </h3>
              </div>
              <span className="text-xs font-black bg-yellow-200 px-2.5 py-0.5 rounded border border-black text-slate-900 font-mono">
                SIAP REVIEW
              </span>
            </div>

            {attendanceQueue.length === 0 ? (
              <div className="text-center py-6 text-xs font-black text-emerald-700 bg-emerald-50 rounded-xl border-2 border-dashed border-emerald-300">
                🎉 Luar biasa! Semua presensi siswa hari ini telah tuntas diverifikasi!
              </div>
            ) : (
              <div className="space-y-3">
                {attendanceQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border-2 border-black bg-yellow-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_2px_0px_0px_#000]"
                  >
                    <div>
                      <div className="text-xs font-black text-slate-900">{item.studentName}</div>
                      <div className="text-[11px] font-bold text-slate-600 mt-0.5">
                        📅 {item.date} • ⏱️ {item.time}
                      </div>
                      <div className="text-[10px] text-emerald-800 font-bold mt-0.5 flex items-center gap-1">
                        <span>📍 {item.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRejectAttendanceAction(item.id, item.studentName)}
                        className="comic-btn-primary px-3 py-1.5 rounded-xl border-2 border-black bg-rose-200 hover:bg-rose-300 text-rose-950 text-xs font-black cursor-pointer flex items-center gap-1 shadow-[1.5px_1.5px_0px_0px_#000]"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Tolak</span>
                      </button>

                      <button
                        onClick={() => handleApproveAttendanceAction(item.id, item.studentName)}
                        className="comic-btn-primary px-3.5 py-1.5 rounded-xl border-2 border-black bg-emerald-300 hover:bg-emerald-400 text-emerald-950 text-xs font-black cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_0px_#000]"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>ACC! 👍</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Antrean Review Jurnal Harian */}
          <div className="comic-card bg-white p-5 border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-black text-slate-900">
                  ANTREAN REVIEW LOGBOOK JURNAL ({journalQueue.length}) 📖
                </h3>
              </div>
            </div>

            {journalQueue.length === 0 ? (
              <div className="text-center py-6 text-xs font-black text-purple-700 bg-purple-50 rounded-xl border-2 border-dashed border-purple-300">
                ⭐ Meja Sensei bersih! Tidak ada laporan jurnal harian yang tertunda.
              </div>
            ) : (
              <div className="space-y-3">
                {journalQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border-2 border-black bg-purple-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_2px_0px_0px_#000]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{item.studentName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-200 text-purple-950 font-black border border-black">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-xs text-slate-800 font-bold mt-1">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                        Diajukan: {item.date}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveJournalAction(item.id, item.studentName)}
                        className="comic-btn-primary px-3.5 py-1.5 rounded-xl border-2 border-black bg-yellow-300 hover:bg-yellow-400 text-black text-xs font-black cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_0px_#000]"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verifikasi & Beri Catatan ⭐</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Daftar Mahasiswa Bimbingan */}
        <div className="lg:col-span-5">
          <div className="comic-card bg-white p-5 border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">
                  DAFTAR HERO MURID ({mentees.length}) 🎒
                </h3>
              </div>
              <button
                type="button"
                id="btn-add-student-panel"
                onClick={() => setIsAddStudentModalOpen(true)}
                className="comic-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-black text-xs font-black cursor-pointer shadow-[2px_2px_0px_0px_#000]"
              >
                <UserPlus className="w-3.5 h-3.5 text-black" />
                <span>+ Tambah Murid</span>
              </button>
            </div>

            {/* Pencarian Murid */}
            {mentees.length > 0 && (
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="input-search-student"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, NIM, atau institusi murid..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border-2 border-black bg-slate-50 focus:bg-white shadow-[2px_2px_0px_0px_#000] text-slate-900 font-bold"
                />
              </div>
            )}

            {/* List Murid */}
            {(() => {
              const filteredMentees = mentees.filter((m) => {
                const q = searchQuery.toLowerCase().trim();
                if (!q) return true;
                return (
                  m.name.toLowerCase().includes(q) ||
                  m.nim.toLowerCase().includes(q) ||
                  m.institution.toLowerCase().includes(q) ||
                  (m.major && m.major.toLowerCase().includes(q)) ||
                  (m.department && m.department.toLowerCase().includes(q))
                );
              });

              if (filteredMentees.length === 0) {
                return (
                  <div className="text-center py-8 px-4 bg-yellow-50 rounded-2xl border-2 border-dashed border-yellow-300 space-y-3">
                    <span className="text-3xl block">🦸</span>
                    <p className="text-xs font-black text-slate-800">
                      {searchQuery
                        ? `Tidak ada murid yang cocok dengan kata kunci "${searchQuery}"`
                        : 'Belum ada murid bimbingan yang terdaftar!'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setIsAddStudentModalOpen(true);
                      }}
                      className="comic-btn-primary px-4 py-2 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-black text-xs font-black cursor-pointer shadow-[2px_2px_0px_0px_#000] inline-flex items-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Rekrut Murid Sekarang</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-3.5">
                  {filteredMentees.map((m) => {
                    const percent = Math.round((m.hoursDone / m.targetHours) * 100);
                    return (
                      <div
                        key={m.id}
                        id={`mentee-card-${m.id}`}
                        onClick={() => setSelectedStudentForDetail(m)}
                        className="p-3.5 rounded-xl border-2 border-black bg-white hover:bg-yellow-50/80 transition-all space-y-2.5 shadow-[2px_2px_0px_0px_#000] cursor-pointer group hover:translate-x-0.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={m.avatar}
                              alt={m.name}
                              className="w-11 h-11 rounded-xl object-cover border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] shrink-0 bg-white"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-black text-slate-900 truncate group-hover:text-blue-700 flex items-center gap-1.5">
                                <span>{m.name}</span>
                                {m.department && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 border border-purple-300 text-purple-900 font-bold hidden sm:inline">
                                    {m.department}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-bold text-slate-600 truncate font-mono">
                                {m.nim} • {m.major}
                              </div>
                              <div className="text-[10px] text-blue-700 font-black truncate">
                                {m.institution}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-sky-100 group-hover:bg-sky-200 border border-black text-black hidden sm:inline-block">
                              Lihat Dosir 👁️
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Hapus ${m.name} dari daftar bimbingan?`)) {
                                  handleDeleteStudent(m.id);
                                }
                              }}
                              className="p-1.5 rounded-lg border border-transparent hover:border-black hover:bg-rose-100 text-slate-400 hover:text-rose-700 transition-colors"
                              title="Hapus Murid"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1.5 border-t border-slate-200">
                          <div className="flex items-center justify-between text-[11px] font-black">
                            <span className="text-slate-600">Progres EXP Jam:</span>
                            <span className="font-mono text-slate-900 bg-yellow-200 px-2 py-0.5 rounded border border-black">
                              {m.hoursDone} / {m.targetHours} Jam ({percent}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-3 rounded-full border border-black p-0.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-sky-400 to-blue-600 h-full rounded-full border-r border-black"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Modal Tambah Murid Magang */}
      <StudentAddModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onStudentAdded={handleStudentAdded}
        mentorInstitution={profile?.institution}
      />

      {/* Modal Detail & Dosir Murid Magang */}
      <StudentDetailModal
        student={selectedStudentForDetail}
        isOpen={!!selectedStudentForDetail}
        onClose={() => setSelectedStudentForDetail(null)}
        onDeleteStudent={handleDeleteStudent}
      />
    </div>
  );
};
