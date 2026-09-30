import React from 'react';
import { 
  X, 
  GraduationCap, 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Briefcase, 
  ExternalLink,
  Trash2,
  CheckCircle2,
  Award
} from 'lucide-react';
import { NewStudentData } from './StudentAddModal';

interface StudentDetailModalProps {
  student: NewStudentData | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleteStudent?: (id: string) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  isOpen,
  onClose,
  onDeleteStudent
}) => {
  if (!isOpen || !student) return null;

  const percent = Math.round((student.hoursDone / student.targetHours) * 100);

  const handleOpenWhatsApp = () => {
    if (!student.phone) return;
    const cleanNumber = student.phone.replace(/[^0-9]/g, '');
    const intlNumber = cleanNumber.startsWith('0') ? '62' + cleanNumber.slice(1) : cleanNumber;
    window.open(`https://wa.me/${intlNumber}?text=Halo%20${encodeURIComponent(student.name)},%20ini%20pembimbing%20magang%20kamu.`, '_blank');
  };

  return (
    <div 
      id="modal-student-detail-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <div 
        id="modal-student-detail-container" 
        className="comic-card bg-white w-full max-w-lg rounded-3xl border-[3.5px] border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden my-6 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-sky-300 p-4 sm:p-5 border-b-[3px] border-black flex items-center justify-between shrink-0 relative">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎒</span>
            <div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-black border border-black uppercase tracking-wider">
                KARTU PROFIL MURID
              </span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                DOSIR HERO SISWA MAGANG
              </h2>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-student-detail-modal"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border-2 border-black bg-white hover:bg-rose-100 text-black flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_0px_#000]"
          >
            <X className="w-5 h-5 text-black stroke-[3]" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Main info card */}
          <div className="p-4 bg-yellow-100 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000] flex items-center gap-4">
            <img
              src={student.avatar}
              alt={student.name}
              className="w-16 h-16 rounded-2xl object-cover border-[2.5px] border-black shadow-[2px_2px_0px_0px_#000] bg-white shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-black text-yellow-300 uppercase">
                {student.status || 'Aktif Magang'}
              </span>
              <h3 className="text-base font-black text-slate-900 truncate mt-1">
                {student.name}
              </h3>
              <p className="text-xs font-mono font-bold text-slate-700 truncate">
                NIM: {student.nim}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="p-4 bg-white rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_#000] space-y-2">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1 text-slate-700">
                <Clock className="w-4 h-4 text-blue-600" />
                Akumulasi Jam Magang:
              </span>
              <span className="font-mono bg-yellow-200 px-2 py-0.5 rounded border border-black">
                {student.hoursDone} / {student.targetHours} Jam ({percent}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-4 rounded-full border border-black p-0.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-400 to-blue-600 h-full rounded-full border-r border-black"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Detail specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border-2 border-black">
              <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-600" />
                Asal Institusi
              </span>
              <div className="font-black text-slate-900 mt-1">{student.institution}</div>
              <div className="text-[11px] font-bold text-slate-600">{student.major}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border-2 border-black">
              <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                Penempatan Divisi
              </span>
              <div className="font-black text-purple-950 mt-1">{student.department}</div>
              <div className="text-[11px] font-bold text-slate-600">Squad Pembimbing</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border-2 border-black">
              <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                Email Akun
              </span>
              <div className="font-bold text-slate-900 mt-1 truncate">{student.email}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border-2 border-black">
              <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Periode Magang
              </span>
              <div className="font-bold text-slate-900 mt-1">
                {student.startDate || '2026-08-01'} s/d {student.endDate || '2026-12-31'}
              </div>
            </div>
          </div>

          {/* Notes if any */}
          {student.notes && (
            <div className="p-3 bg-purple-50 rounded-xl border-2 border-black text-xs">
              <span className="text-[10px] font-black text-purple-800 uppercase">Catatan Pembimbing:</span>
              <p className="font-bold text-slate-800 mt-0.5">{student.notes}</p>
            </div>
          )}

          {/* Quick Contact & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {student.phone && (
              <button
                type="button"
                id="btn-whatsapp-student"
                onClick={handleOpenWhatsApp}
                className="comic-btn-primary flex-1 py-2.5 px-3 rounded-xl border-2 border-black bg-emerald-300 hover:bg-emerald-400 text-black text-xs font-black flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Chat WhatsApp Siswa</span>
              </button>
            )}

            <a
              href={`mailto:${student.email}`}
              className="comic-btn-primary flex-1 py-2.5 px-3 rounded-xl border-2 border-black bg-sky-300 hover:bg-sky-400 text-black text-xs font-black flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Kirim Email</span>
            </a>

            {onDeleteStudent && (
              <button
                type="button"
                id="btn-delete-student"
                onClick={() => {
                  if (window.confirm(`Yakin ingin menghapus ${student.name} dari daftar bimbingan magang?`)) {
                    onDeleteStudent(student.id);
                    onClose();
                  }
                }}
                className="comic-btn-primary py-2.5 px-3 rounded-xl border-2 border-black bg-rose-200 hover:bg-rose-300 text-rose-950 text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                title="Hapus Murid"
              >
                <Trash2 className="w-4 h-4 text-rose-700" />
                <span>Hapus</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
