import React, { useState, useRef } from 'react';
import { 
  X, 
  UserPlus, 
  Upload, 
  Sparkles, 
  GraduationCap, 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Briefcase, 
  Check, 
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { optimizeAvatarImage, uploadAvatar } from '../../lib/storage';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export interface NewStudentData {
  id: string;
  name: string;
  nim: string;
  email: string;
  phone?: string;
  institution: string;
  major: string;
  department: string;
  hoursDone: number;
  targetHours: number;
  avatar: string;
  status: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

interface StudentAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentAdded: (student: NewStudentData) => void;
  mentorInstitution?: string;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

const DEPARTMENT_PRESETS = [
  'Frontend Squad',
  'Backend & Cloud Squad',
  'UI/UX Design & Product Squad',
  'Quality Assurance & Testing',
  'Mobile Apps Squad (Flutter/React Native)',
  'Data Science & AI Squad',
  'DevOps & System Infrastructure',
  'IoT & Embedded System'
];

export const StudentAddModal: React.FC<StudentAddModalProps> = ({
  isOpen,
  onClose,
  onStudentAdded,
  mentorInstitution
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [nim, setNim] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [major, setMajor] = useState('');
  const [department, setDepartment] = useState('Frontend Squad');
  const [targetHours, setTargetHours] = useState(600);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // End date default: 5 months ahead
  const defaultEndDate = new Date();
  defaultEndDate.setMonth(defaultEndDate.getMonth() + 5);
  const [endDate, setEndDate] = useState(defaultEndDate.toISOString().split('T')[0]);
  
  const [notes, setNotes] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle avatar file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Harap unggah file foto berformat gambar (JPG, PNG, WebP).');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const optimized = await optimizeAvatarImage(file);
      setCustomAvatarPreview(optimized.dataUrl);
      setSelectedAvatar(optimized.dataUrl);

      // If Supabase live, upload directly
      if (isSupabaseConfigured) {
        const uploadRes = await uploadAvatar('new-student', file);
        if (uploadRes.url) {
          setSelectedAvatar(uploadRes.url);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses foto dari galeri.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!name.trim()) {
      setErrorMessage('Nama lengkap murid wajib diisi!');
      return;
    }
    if (!nim.trim()) {
      setErrorMessage('NIM / NISN wajib diisi!');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Alamat email aktif yang valid wajib diisi!');
      return;
    }
    if (!institution.trim()) {
      setErrorMessage('Asal sekolah / universitas wajib diisi!');
      return;
    }

    setIsSubmitting(true);

    try {
      const studentId = `student-${Date.now()}`;
      const newStudent: NewStudentData = {
        id: studentId,
        name: name.trim(),
        nim: nim.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        institution: institution.trim(),
        major: major.trim() || 'Teknik Informatika',
        department: department.trim(),
        hoursDone: 0,
        targetHours: Number(targetHours) || 600,
        avatar: selectedAvatar,
        status: 'Aktif',
        startDate,
        endDate,
        notes: notes.trim() || undefined
      };

      // If Supabase is live, attempt DB inserts for profiles and internship_profiles
      if (isSupabaseConfigured) {
        try {
          const generatedUuid = crypto.randomUUID();
          await supabase.from('profiles').insert({
            id: generatedUuid,
            email: email.trim(),
            full_name: name.trim(),
            avatar_url: selectedAvatar,
            role: 'student',
            phone_number: phone.trim() || null,
            institution: institution.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

          await supabase.from('internship_profiles').insert({
            user_id: generatedUuid,
            student_id_number: nim.trim(),
            institution_name: institution.trim(),
            major: major.trim() || 'Teknik Informatika',
            company_name: mentorInstitution || 'PT Telkom Indonesia',
            department: department.trim(),
            start_date: startDate,
            end_date: endDate,
            total_required_hours: Number(targetHours) || 600,
            accumulated_hours: 0,
            status: 'active'
          });
        } catch (dbErr) {
          console.warn('Supabase insert note (falling back to local state):', dbErr);
        }
      }

      onStudentAdded(newStudent);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kendala saat menyimpan murid baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      id="modal-add-student-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <div 
        id="modal-add-student-container" 
        className="comic-card bg-white w-full max-w-2xl rounded-3xl border-[3.5px] border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden my-6 max-h-[92vh] flex flex-col"
      >
        {/* Comic Modal Header */}
        <div className="bg-yellow-300 p-4 sm:p-5 border-b-[3px] border-black flex items-center justify-between shrink-0 relative">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center text-black font-black text-xl">
              🦸
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-pink-400 text-white border border-black uppercase tracking-wider">
                  POW! REKRUT SISWA
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-300 text-black border border-black uppercase tracking-wider">
                  S-RANK
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5">
                TAMBAH HERO MURID MAGANG
              </h2>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-add-student-modal"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border-2 border-black bg-white hover:bg-rose-100 text-black flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_0px_#000] transition-transform active:translate-x-0.5 active:translate-y-0.5"
          >
            <X className="w-5 h-5 text-black stroke-[3]" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-200 border-2 border-black rounded-2xl text-rose-950 text-xs font-black shadow-[2px_2px_0px_0px_#000] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-900 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Avatar Selection */}
          <div className="p-4 bg-sky-50 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                1. FOTO PROFIL / AVATAR HERO
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 bg-sky-200 border border-black rounded-md">
                Galeri & Kartun
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Main Avatar Preview */}
              <div className="relative shrink-0">
                <img
                  src={selectedAvatar}
                  alt="Avatar Preview"
                  className="w-20 h-20 rounded-2xl object-cover border-[3px] border-black shadow-[3px_3px_0px_0px_#000] bg-white"
                />
                <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-yellow-300 border-2 border-black flex items-center justify-center font-black text-xs shadow-xs">
                  ⭐
                </span>
              </div>

              {/* Upload from Gallery / Device Button */}
              <div className="flex-1 w-full space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="input-file-add-student-avatar"
                />

                <button
                  type="button"
                  id="btn-upload-student-avatar-gallery"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="comic-btn-primary w-full py-2.5 px-3 rounded-xl border-2 border-black bg-white hover:bg-yellow-100 text-black text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#000]"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>{isUploading ? 'Memproses Foto...' : '📁 Unggah Foto dari Galeri Perangkat'}</span>
                </button>

                {/* Preset Avatar choices */}
                <div>
                  <div className="text-[11px] font-bold text-slate-600 mb-1.5">
                    Atau pilih cepat karakter avatar komik:
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {AVATAR_PRESETS.map((avatarUrl, idx) => {
                      const isSelected = selectedAvatar === avatarUrl;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedAvatar(avatarUrl)}
                          className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                            isSelected
                              ? 'border-black ring-2 ring-yellow-400 scale-110 shadow-[2px_2px_0px_0px_#000]'
                              : 'border-slate-300 hover:border-black opacity-80 hover:opacity-100'
                          }`}
                        >
                          <img src={avatarUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Identitas Pokok Murid */}
          <div className="space-y-3.5">
            <div className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-black pb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              2. IDENTITAS SISWA / MAHASISWA
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                  Nama Lengkap Murid *
                </label>
                <input
                  type="text"
                  id="input-add-student-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="contoh: Muhammad Rizky Pratama"
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] focus:shadow-[3px_3px_0px_0px_#000] text-slate-900 font-bold"
                />
              </div>

              {/* NIM / NISN */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                  NIM / NISN *
                </label>
                <input
                  type="text"
                  id="input-add-student-nim"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  placeholder="contoh: 2207411088"
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] focus:shadow-[3px_3px_0px_0px_#000] text-slate-900 font-bold font-mono"
                />
              </div>

              {/* Email Akun */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                  Email Siswa (Aktif) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    id="input-add-student-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama.siswa@kampus.ac.id"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] focus:shadow-[3px_3px_0px_0px_#000] text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* No WhatsApp */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                  No. WhatsApp / HP (Opsional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    id="input-add-student-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="contoh: 0812-3456-7890"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] focus:shadow-[3px_3px_0px_0px_#000] text-slate-900 font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Asal Sekolah / Kampus */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                  Asal Kampus / Sekolah (SMK) *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="input-add-student-institution"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="contoh: Politeknik Negeri Bandung / SMKN 1"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] focus:shadow-[3px_3px_0px_0px_#000] text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* Jurusan / Program Studi */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                  Jurusan / Program Studi
                </label>
                <input
                  type="text"
                  id="input-add-student-major"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="contoh: D4 Teknik Informatika / RPL"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] focus:shadow-[3px_3px_0px_0px_#000] text-slate-900 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Penempatan Magang & Target */}
          <div className="space-y-3.5">
            <div className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-black pb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-purple-600" />
              3. DIVISI PENEMPATAN & TARGET MAGANG
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Divisi / Squad */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                  Divisi / Squad Penempatan
                </label>
                <select
                  id="select-add-student-department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] focus:shadow-[3px_3px_0px_0px_#000] text-slate-900 font-bold cursor-pointer"
                >
                  {DEPARTMENT_PRESETS.map((dept, i) => (
                    <option key={i} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Jam Magang */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                  Target Jam Wajib (EXP Target)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    id="input-add-student-target-hours"
                    value={targetHours}
                    onChange={(e) => setTargetHours(Number(e.target.value))}
                    min={100}
                    max={1200}
                    step={10}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] focus:shadow-[3px_3px_0px_0px_#000] text-slate-900 font-bold font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Tanggal Mulai */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                  Tanggal Mulai Magang
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    id="input-add-student-start-date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* Tanggal Selesai */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                  Estimasi Tanggal Selesai
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    id="input-add-student-end-date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] text-slate-900 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Catatan Khusus / Keahlian Awal */}
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                Catatan Khusus / Keahlian Awal (Opsional)
              </label>
              <textarea
                id="input-add-student-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="contoh: Mahasiswa telah menguasai React, Tailwind, dan Git. Ditempatkan di proyek Redesign Portal."
                rows={2}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] text-slate-900 font-bold"
              />
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t-2 border-black flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              id="btn-cancel-add-student"
              onClick={onClose}
              disabled={isSubmitting}
              className="comic-btn-primary px-4 py-2.5 rounded-xl border-2 border-black bg-white hover:bg-slate-100 text-black text-xs font-black cursor-pointer shadow-[2px_2px_0px_0px_#000]"
            >
              Batal
            </button>

            <button
              type="submit"
              id="btn-save-add-student"
              disabled={isSubmitting}
              className="comic-btn-primary px-6 py-2.5 rounded-xl border-2 border-black bg-yellow-300 hover:bg-yellow-400 text-black text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#000] disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4 text-black" />
              <span>{isSubmitting ? 'MENYIMPAN DATA...' : '💥 REKRUT & SIMPAN MURID!'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
