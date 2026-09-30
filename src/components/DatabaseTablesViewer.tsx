import React, { useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Clock, 
  BookOpen, 
  Award, 
  ShieldCheck, 
  Check, 
  Copy, 
  Key, 
  Database,
  ArrowRight,
  Lock,
  ChevronLeft,
  ChevronRight,
  Code2,
  Table as TableIcon
} from 'lucide-react';

export interface ColumnDetail {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  nullable: boolean;
  description: string;
}

export interface TableItem {
  id: string;
  name: string;
  displayName: string;
  badge: string;
  colorTheme: string; // e.g. blue, emerald, amber, purple, rose
  icon: React.ElementType;
  description: string;
  columns: ColumnDetail[];
  relationships: {
    source: string;
    target: string;
    type: string;
    description: string;
  }[];
  rlsRules: {
    role: string;
    permissions: string;
    explanation: string;
  }[];
  sqlDdl: string;
}

export const DATABASE_TABLES: TableItem[] = [
  {
    id: 'profiles',
    name: 'profiles',
    displayName: 'User Profiles',
    badge: 'Core Auth & Roles',
    colorTheme: 'blue',
    icon: Users,
    description: 'Menyimpan profil pengguna yang tersinkronisasi langsung dengan auth.users Supabase. Mengatur peran akses multi-role (Siswa, Pembimbing, Koordinator, Admin).',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, isForeign: true, nullable: false, description: 'Primary key merujuk ke auth.users(id) ON DELETE CASCADE' },
      { name: 'email', type: 'TEXT', nullable: false, description: 'Alamat email aktif pengguna' },
      { name: 'full_name', type: 'TEXT', nullable: false, description: 'Nama lengkap siswa atau pembimbing' },
      { name: 'avatar_url', type: 'TEXT', nullable: true, description: 'URL foto avatar profil pengguna' },
      { name: 'role', type: 'TEXT', nullable: false, description: "Peran pengguna: 'student' | 'mentor' | 'coordinator' | 'admin' (default: 'student')" },
      { name: 'phone_number', type: 'TEXT', nullable: true, description: 'Nomor WhatsApp / telepon aktif' },
      { name: 'institution', type: 'TEXT', nullable: true, description: 'Asal universitas, politeknik, atau SMK' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Stempel waktu pendaftaran akun' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Stempel waktu pembaruan profil terakhir (otomatis via trigger)' }
    ],
    relationships: [
      { source: 'public.profiles.id', target: 'auth.users.id', type: '1-to-1', description: 'Ekstensi metadata data autentikasi Supabase' },
      { source: 'public.profiles.id', target: 'internship_profiles.user_id', type: '1-to-1', description: 'Satu akun siswa memiliki satu riwayat program magang' },
      { source: 'public.profiles.id', target: 'internship_profiles.mentor_id', type: '1-to-Many', description: 'Satu pembimbing mengampu banyak siswa bimbingan magang' }
    ],
    rlsRules: [
      { role: 'Semua User Login', permissions: 'SELECT', explanation: 'Dapat melihat data profil sesama peserta dan mentor untuk keperluan interaksi di dashboard.' },
      { role: 'Pemilik Akun', permissions: 'UPDATE', explanation: 'Hanya diizinkan mengedit profil miliknya sendiri dengan validasi (auth.uid() = id).' },
      { role: 'Koordinator / Admin', permissions: 'ALL', explanation: 'Mempunyai akses penuh untuk mengubah peran dan mengelola akun jika diperlukan.' }
    ],
    sqlDdl: `CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'mentor', 'coordinator', 'admin')) DEFAULT 'student',
  phone_number TEXT,
  institution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);`
  },
  {
    id: 'internship_profiles',
    name: 'internship_profiles',
    displayName: 'Internship Details',
    badge: 'Program & Instansi',
    colorTheme: 'indigo',
    icon: GraduationCap,
    description: 'Menyimpan rincian kontrak magang peserta: identitas akademik (NIM/NISN), instansi/perusahaan tempat magang, target jam, rentang tanggal, dan pembimbing lapangan.',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, nullable: false, description: 'Primary key unik menggunakan gen_random_uuid()' },
      { name: 'user_id', type: 'UUID', isForeign: true, nullable: false, description: 'Foreign key ke public.profiles(id) siswa magang' },
      { name: 'student_id_number', type: 'TEXT', nullable: false, description: 'Nomor Induk Mahasiswa (NIM) atau NISN' },
      { name: 'institution_name', type: 'TEXT', nullable: false, description: 'Nama asal kampus / sekolah mitra' },
      { name: 'major', type: 'TEXT', nullable: false, description: 'Jurusan / Program Studi (contoh: Teknik Informatika)' },
      { name: 'company_name', type: 'TEXT', nullable: false, description: 'Nama instansi, BUMN, atau perusahaan magang' },
      { name: 'company_address', type: 'TEXT', nullable: true, description: 'Alamat fisik kantor tempat kegiatan magang' },
      { name: 'department', type: 'TEXT', nullable: false, description: 'Divisi atau departemen penugasan' },
      { name: 'mentor_id', type: 'UUID', isForeign: true, nullable: true, description: 'Foreign key ke public.profiles(id) pembimbing lapangan' },
      { name: 'start_date', type: 'DATE', nullable: false, description: 'Tanggal mulai efektif kegiatan magang' },
      { name: 'end_date', type: 'DATE', nullable: false, description: 'Tanggal akhir periode kegiatan magang' },
      { name: 'total_required_hours', type: 'INT', nullable: false, description: 'Target total jam magang (standar: 600 jam)' },
      { name: 'accumulated_hours', type: 'NUMERIC(6,2)', nullable: false, description: 'Jumlah jam magang yang sudah disetujui pembimbing' },
      { name: 'status', type: 'TEXT', nullable: false, description: "Status program: 'active' | 'completed' | 'pending' | 'cancelled'" }
    ],
    relationships: [
      { source: 'internship_profiles.user_id', target: 'public.profiles.id', type: 'Many-to-1', description: 'Menghubungkan data magang dengan akun siswa' },
      { source: 'internship_profiles.mentor_id', target: 'public.profiles.id', type: 'Many-to-1', description: 'Menghubungkan siswa dengan pembimbing lapangannya' },
      { source: 'internship_profiles.id', target: 'attendance.internship_id', type: '1-to-Many', description: 'Parent record untuk semua catatan presensi harian' }
    ],
    rlsRules: [
      { role: 'Siswa (Student)', permissions: 'SELECT', explanation: 'Hanya dapat melihat rincian profil magang milik mereka sendiri.' },
      { role: 'Pembimbing (Mentor)', permissions: 'SELECT, UPDATE', explanation: 'Dapat memonitor rincian magang siswa bimbingannya dan memperbarui progress jam magang.' },
      { role: 'Koordinator / Admin', permissions: 'ALL', explanation: 'Dapat mengatur penugasan pembimbing, menyetujui pendaftaran, dan mengubah status magang.' }
    ],
    sqlDdl: `CREATE TABLE IF NOT EXISTS public.internship_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id_number TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  major TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_address TEXT,
  department TEXT NOT NULL,
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_required_hours INT NOT NULL DEFAULT 600,
  accumulated_hours NUMERIC(6, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'pending', 'cancelled')) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_internship_dates CHECK (end_date >= start_date)
);`
  },
  {
    id: 'attendance',
    name: 'attendance',
    displayName: 'Attendance & GPS',
    badge: 'Presensi & Geotag',
    colorTheme: 'emerald',
    icon: Clock,
    description: 'Pencatatan presensi harian siswa (Clock-in, Clock-out), koordinat GPS, foto bukti kehadiran, permohonan izin/sakit, dan verifikasi pembimbing.',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, nullable: false, description: 'Primary key presensi unik (gen_random_uuid())' },
      { name: 'internship_id', type: 'UUID', isForeign: true, nullable: false, description: 'Foreign key ke public.internship_profiles(id)' },
      { name: 'user_id', type: 'UUID', isForeign: true, nullable: false, description: 'Foreign key ke public.profiles(id) siswa' },
      { name: 'date', type: 'DATE', nullable: false, description: 'Tanggal presensi (Constraint UNIQUE per internship_id & date)' },
      { name: 'clock_in', type: 'TIMESTAMPTZ', nullable: true, description: 'Waktu presensi masuk siswa' },
      { name: 'clock_out', type: 'TIMESTAMPTZ', nullable: true, description: 'Waktu presensi pulang siswa' },
      { name: 'status', type: 'TEXT', nullable: false, description: "Status: 'present' | 'late' | 'sick' | 'permission' | 'absent'" },
      { name: 'duration_minutes', type: 'INT', nullable: false, description: 'Durasi jam kerja harian terhitung dalam menit' },
      { name: 'clock_in_photo_url', type: 'TEXT', nullable: true, description: 'URL foto selfie bukti kehadiran dari Supabase Storage' },
      { name: 'clock_out_photo_url', type: 'TEXT', nullable: true, description: 'URL foto bukti clock-out' },
      { name: 'clock_in_lat', type: 'NUMERIC(10,7)', nullable: true, description: 'Titik latitude GPS lokasi saat presensi masuk' },
      { name: 'clock_in_lng', type: 'NUMERIC(10,7)', nullable: true, description: 'Titik longitude GPS lokasi saat presensi masuk' },
      { name: 'clock_in_address', type: 'TEXT', nullable: true, description: 'Alamat hasil reverse-geocoding lokasi presensi' },
      { name: 'notes', type: 'TEXT', nullable: true, description: 'Keterangan pengajuan izin atau diagnosa sakit' },
      { name: 'attachment_url', type: 'TEXT', nullable: true, description: 'URL surat izin atau surat keterangan dokter' },
      { name: 'approval_status', type: 'TEXT', nullable: false, description: "Status verifikasi: 'pending' | 'approved' | 'rejected'" },
      { name: 'verified_by', type: 'UUID', isForeign: true, nullable: true, description: 'Foreign key ke public.profiles(id) pembimbing pemverifikasi' },
      { name: 'rejection_reason', type: 'TEXT', nullable: true, description: 'Alasan penolakan jika status ditolak oleh pembimbing' }
    ],
    relationships: [
      { source: 'attendance.internship_id', target: 'internship_profiles.id', type: 'Many-to-1', description: 'Menghubungkan presensi ke program magang siswa' },
      { source: 'attendance.user_id', target: 'profiles.id', type: 'Many-to-1', description: 'Menghubungkan presensi ke akun siswa' },
      { source: 'attendance.verified_by', target: 'profiles.id', type: 'Many-to-1', description: 'Menghubungkan verifikator presensi ke akun pembimbing' }
    ],
    rlsRules: [
      { role: 'Siswa (Student)', permissions: 'SELECT, INSERT, UPDATE', explanation: 'Dapat menginput presensi harian miliknya sendiri dan mengupdate clock-out jika approval_status masih pending.' },
      { role: 'Pembimbing (Mentor)', permissions: 'SELECT, UPDATE', explanation: 'Dapat memonitor presensi siswa bimbingannya dan mengubah status verifikasi (Approve/Reject).' },
      { role: 'Koordinator / Admin', permissions: 'ALL', explanation: 'Akses penuh untuk melihat rekap kehadiran seluruh instansi magang.' }
    ],
    sqlDdl: `CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID NOT NULL REFERENCES public.internship_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('present', 'late', 'sick', 'permission', 'absent')) DEFAULT 'present',
  duration_minutes INT NOT NULL DEFAULT 0,
  clock_in_photo_url TEXT,
  clock_out_photo_url TEXT,
  clock_in_lat NUMERIC(10, 7),
  clock_in_lng NUMERIC(10, 7),
  clock_in_address TEXT,
  notes TEXT,
  attachment_url TEXT,
  approval_status TEXT NOT NULL CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_internship_attendance_date UNIQUE(internship_id, date)
);`
  },
  {
    id: 'daily_journals',
    name: 'daily_journals',
    displayName: 'Daily Journals',
    badge: 'Log Kegiatan Harian',
    colorTheme: 'amber',
    icon: BookOpen,
    description: 'Catatan harian siswa mengenai aktivitas kerja, kendala teknis yang dihadapi, solusi pemecahan, dokumentasi foto/berkas, dan catatan umpan balik pembimbing.',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, nullable: false, description: 'Primary key jurnal (gen_random_uuid())' },
      { name: 'internship_id', type: 'UUID', isForeign: true, nullable: false, description: 'Foreign key ke public.internship_profiles(id)' },
      { name: 'user_id', type: 'UUID', isForeign: true, nullable: false, description: 'Foreign key ke public.profiles(id) siswa' },
      { name: 'date', type: 'DATE', nullable: false, description: 'Tanggal pelaksanaan aktivitas kerja' },
      { name: 'activity_title', type: 'TEXT', nullable: false, description: 'Judul topik tugas atau modul yang dikerjakan' },
      { name: 'activity_description', type: 'TEXT', nullable: false, description: 'Uraian rinci proses dan langkah-langkah kerja harian' },
      { name: 'challenges', type: 'TEXT', nullable: true, description: 'Hambatan atau masalah teknis yang dialami di lapangan' },
      { name: 'solutions_or_results', type: 'TEXT', nullable: true, description: 'Solusi yang diterapkan serta hasil pencapaian kerja' },
      { name: 'attachment_url', type: 'TEXT', nullable: true, description: 'URL foto dokumentasi kegiatan atau tautan berkas kerja' },
      { name: 'learning_category', type: 'TEXT', nullable: true, description: 'Kategori pembelajaran: Technical, Softskill, Manajemen, dsb' },
      { name: 'duration_hours', type: 'NUMERIC(4,2)', nullable: false, description: 'Estimasi durasi pengerjaan (default: 8.0 jam)' },
      { name: 'approval_status', type: 'TEXT', nullable: false, description: "Status: 'draft' | 'submitted' | 'approved' | 'revision_requested'" },
      { name: 'mentor_feedback', type: 'TEXT', nullable: true, description: 'Catatan evaluasi, saran, atau perbaikan dari pembimbing' },
      { name: 'verified_by', type: 'UUID', isForeign: true, nullable: true, description: 'Foreign key pembimbing yang memverifikasi' }
    ],
    relationships: [
      { source: 'daily_journals.internship_id', target: 'internship_profiles.id', type: 'Many-to-1', description: 'Menghubungkan catatan jurnal ke periode magang siswa' },
      { source: 'daily_journals.user_id', target: 'profiles.id', type: 'Many-to-1', description: 'Menghubungkan penulis jurnal ke akun siswa' },
      { source: 'daily_journals.verified_by', target: 'profiles.id', type: 'Many-to-1', description: 'Menghubungkan reviewer jurnal ke pembimbing lapangan' }
    ],
    rlsRules: [
      { role: 'Siswa (Student)', permissions: 'SELECT, INSERT, UPDATE', explanation: 'Dapat menulis jurnal harian dan merevisi konten selama berstatus draft atau revision_requested.' },
      { role: 'Pembimbing (Mentor)', permissions: 'SELECT, UPDATE', explanation: 'Dapat membaca jurnal siswa bimbingannya, memberi umpan balik, dan menyetujui (Approved) atau meminta revisi.' },
      { role: 'Koordinator / Admin', permissions: 'ALL', explanation: 'Dapat melihat seluruh arsip jurnal kegiatan untuk audit laporan akhir magang.' }
    ],
    sqlDdl: `CREATE TABLE IF NOT EXISTS public.daily_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID NOT NULL REFERENCES public.internship_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_title TEXT NOT NULL,
  activity_description TEXT NOT NULL,
  challenges TEXT,
  solutions_or_results TEXT,
  attachment_url TEXT,
  learning_category TEXT DEFAULT 'Technical',
  duration_hours NUMERIC(4, 2) NOT NULL DEFAULT 8.0,
  approval_status TEXT NOT NULL CHECK (approval_status IN ('draft', 'submitted', 'approved', 'revision_requested')) DEFAULT 'submitted',
  mentor_feedback TEXT,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`
  },
  {
    id: 'evaluations',
    name: 'evaluations',
    displayName: 'Student Evaluations',
    badge: 'Penilaian Kinerja & Rapor',
    colorTheme: 'rose',
    icon: Award,
    description: 'Lembar evaluasi kinerja siswa magang secara berkala (bulanan/tengah periode/akhir). Menilai indikator kedisiplinan, kompetensi teknis, inisiatif, etika, dan nilai akhir.',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, nullable: false, description: 'Primary key lembar evaluasi (gen_random_uuid())' },
      { name: 'internship_id', type: 'UUID', isForeign: true, nullable: false, description: 'Foreign key ke public.internship_profiles(id)' },
      { name: 'evaluator_id', type: 'UUID', isForeign: true, nullable: false, description: 'Foreign key ke public.profiles(id) pembimbing penilai' },
      { name: 'evaluation_period', type: 'TEXT', nullable: false, description: "Periode penilaian: 'monthly' | 'midterm' | 'final'" },
      { name: 'discipline_score', type: 'NUMERIC(5,2)', nullable: false, description: 'Skor kedisiplinan & ketepatan waktu (skala 0 - 100)' },
      { name: 'technical_skill_score', type: 'NUMERIC(5,2)', nullable: false, description: 'Skor kecakapan teknis & kualitas hasil kerja (0 - 100)' },
      { name: 'initiative_score', type: 'NUMERIC(5,2)', nullable: false, description: 'Skor proaktivitas & kemampuan pemecahan masalah (0 - 100)' },
      { name: 'teamwork_score', type: 'NUMERIC(5,2)', nullable: false, description: 'Skor kerja sama tim & komunikasi interpersonal (0 - 100)' },
      { name: 'attitude_score', type: 'NUMERIC(5,2)', nullable: false, description: 'Skor etika profesi, tata krama, dan tanggung jawab (0 - 100)' },
      { name: 'final_score', type: 'NUMERIC(5,2)', nullable: false, description: 'Rata-rata tertimbang nilai keseluruhan (0 - 100)' },
      { name: 'grade', type: 'TEXT', nullable: false, description: "Predikat nilai mutu huruf: 'A', 'A-', 'B+', 'B', 'C'" },
      { name: 'strengths', type: 'TEXT', nullable: true, description: 'Poin keunggulan dan pencapaian menonjol siswa selama magang' },
      { name: 'areas_for_improvement', type: 'TEXT', nullable: true, description: 'Saran dan rekomendasi perbaikan kompetensi siswa' },
      { name: 'general_notes', type: 'TEXT', nullable: true, description: 'Catatan umum atau rekomendasi dari perusahaan' },
      { name: 'is_published', type: 'BOOLEAN', nullable: false, description: 'Status publikasi nilai (siswa hanya bisa melihat jika TRUE)' }
    ],
    relationships: [
      { source: 'evaluations.internship_id', target: 'internship_profiles.id', type: 'Many-to-1', description: 'Menghubungkan lembar nilai ke siswa peserta magang' },
      { source: 'evaluations.evaluator_id', target: 'profiles.id', type: 'Many-to-1', description: 'Menghubungkan penilai ke akun pembimbing lapangan' }
    ],
    rlsRules: [
      { role: 'Siswa (Student)', permissions: 'SELECT (Restricted)', explanation: 'Hanya diizinkan membaca nilai miliknya jika nilai sudah dipublikasikan (is_published = TRUE).' },
      { role: 'Pembimbing (Mentor)', permissions: 'SELECT, INSERT, UPDATE', explanation: 'Dapat membuat, mengedit draf nilai, dan mempublikasikan evaluasi untuk siswa binaannya.' },
      { role: 'Koordinator / Admin', permissions: 'ALL', explanation: 'Dapat memonitor seluruh nilai siswa dan mengekspor transkrip nilai magang.' }
    ],
    sqlDdl: `CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID NOT NULL REFERENCES public.internship_profiles(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  evaluation_period TEXT NOT NULL CHECK (evaluation_period IN ('monthly', 'midterm', 'final')) DEFAULT 'final',
  discipline_score NUMERIC(5, 2) NOT NULL CHECK (discipline_score BETWEEN 0 AND 100),
  technical_skill_score NUMERIC(5, 2) NOT NULL CHECK (technical_skill_score BETWEEN 0 AND 100),
  initiative_score NUMERIC(5, 2) NOT NULL CHECK (initiative_score BETWEEN 0 AND 100),
  teamwork_score NUMERIC(5, 2) NOT NULL CHECK (teamwork_score BETWEEN 0 AND 100),
  attitude_score NUMERIC(5, 2) NOT NULL CHECK (attitude_score BETWEEN 0 AND 100),
  final_score NUMERIC(5, 2) NOT NULL CHECK (final_score BETWEEN 0 AND 100),
  grade TEXT NOT NULL,
  strengths TEXT,
  areas_for_improvement TEXT,
  general_notes TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`
  }
];

interface DatabaseTablesViewerProps {
  initialSelectedTable?: string;
  onSelectTable?: (tableName: string) => void;
  onNavigateToSqlEditor?: () => void;
}

export const DatabaseTablesViewer: React.FC<DatabaseTablesViewerProps> = ({
  initialSelectedTable = 'profiles',
  onSelectTable,
  onNavigateToSqlEditor
}) => {
  // 1. State selectedTable untuk melacak tabel mana yang sedang dipilih
  const [selectedTable, setSelectedTable] = useState<string>(initialSelectedTable);
  const [copiedTableDdl, setCopiedTableDdl] = useState<boolean>(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'columns' | 'relationships' | 'rls' | 'ddl'>('columns');

  // Ambil objek tabel aktif
  const currentTable = DATABASE_TABLES.find((t) => t.id === selectedTable) || DATABASE_TABLES[0];
  const currentIndex = DATABASE_TABLES.findIndex((t) => t.id === selectedTable);

  const handleSelectTable = (tableId: string) => {
    setSelectedTable(tableId);
    if (onSelectTable) {
      onSelectTable(tableId);
    }
  };

  const handleCopyDdl = () => {
    navigator.clipboard.writeText(currentTable.sqlDdl);
    setCopiedTableDdl(true);
    setTimeout(() => setCopiedTableDdl(false), 2000);
  };

  const handlePreviousTable = () => {
    const prevIndex = (currentIndex - 1 + DATABASE_TABLES.length) % DATABASE_TABLES.length;
    handleSelectTable(DATABASE_TABLES[prevIndex].id);
  };

  const handleNextTable = () => {
    const nextIndex = (currentIndex + 1) % DATABASE_TABLES.length;
    handleSelectTable(DATABASE_TABLES[nextIndex].id);
  };

  return (
    <div id="database-tables-viewer-component" className="space-y-6">
      {/* 1. Header Bagian Tabel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Database Supabase PostgreSQL
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            DAFTAR TABEL DATABASE (5)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Klik kartu tabel di bawah ini untuk memilih dan menampilkan rincian struktur kolom, relasi relasional, dan kebijakan keamanan RLS.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-prev-table"
            onClick={handlePreviousTable}
            title="Tabel Sebelumnya"
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-600 px-2 py-1 bg-slate-100 rounded-md">
            {currentIndex + 1} / {DATABASE_TABLES.length}
          </span>
          <button
            id="btn-next-table"
            onClick={handleNextTable}
            title="Tabel Selanjutnya"
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. DAFTAR 5 KARTU TABEL (INTERAKTIF & DAPAT DIKLIK) */}
      <div 
        id="table-selector-cards-grid" 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5"
      >
        {DATABASE_TABLES.map((table, index) => {
          const IconComp = table.icon;
          const isSelected = selectedTable === table.id;

          return (
            <button
              key={table.id}
              id={`table-card-${table.id}`}
              onClick={() => handleSelectTable(table.id)}
              className={`relative text-left p-4 rounded-xl transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/75 shadow-md ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/90 shadow-2xs hover:shadow-xs'
              }`}
            >
              {/* Badge Kategori & Status Dipilih */}
              <div className="flex items-center justify-between gap-2 w-full mb-3">
                <span 
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {table.badge}
                </span>

                {isSelected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100/90 px-1.5 py-0.5 rounded">
                    <Check className="w-3 h-3 text-blue-600 stroke-[2.5]" />
                    <span>Aktif</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400">
                    #0{index + 1}
                  </span>
                )}
              </div>

              {/* Icon & Nama Tabel */}
              <div className="space-y-1.5 my-1">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-mono">public.</div>
                    <div className={`text-sm font-bold font-mono tracking-tight leading-tight ${
                      isSelected ? 'text-blue-900' : 'text-slate-800'
                    }`}>
                      {table.name}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 pt-1 leading-relaxed">
                  {table.description}
                </p>
              </div>

              {/* Footer Kartu: Jumlah Kolom & Indikator */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">
                  {table.columns.length} Kolom
                </span>
                
                <span className={`flex items-center gap-1 font-semibold ${
                  isSelected ? 'text-blue-600' : 'text-slate-400'
                }`}>
                  <span>{isSelected ? 'Terpilih' : 'Pilih'}</span>
                  <ArrowRight className={`w-3 h-3 transition-transform ${isSelected ? 'translate-x-0.5' : ''}`} />
                </span>
              </div>

              {/* Indikator Panah Aktif (Menunjuk ke Panel Rincian di Bawah) */}
              {isSelected && (
                <div className="hidden lg:block absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-blue-600 rotate-45 rounded-2xs shadow-xs" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. RINCIAN TABEL TERPILIH (OTOMATIS BERUBAH SAAT KARTU DIKLIK) */}
      <div 
        id={`table-detail-panel-${currentTable.id}`}
        className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden"
      >
        {/* Detail Panel Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <currentTable.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {currentTable.badge}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  RLS Protected
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {currentTable.columns.length} Total Kolom
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
                public.{currentTable.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {currentTable.description}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-copy-selected-ddl"
              onClick={handleCopyDdl}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-2xs cursor-pointer"
            >
              {copiedTableDdl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedTableDdl ? 'DDL Disalin!' : 'Salin DDL Tabel Ini'}</span>
            </button>

            {onNavigateToSqlEditor && (
              <button
                id="btn-open-full-sql"
                onClick={onNavigateToSqlEditor}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Buka SQL Editor</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Navigation Tabs Rincian */}
        <div className="flex border-b border-slate-100 px-5 sm:px-6 gap-2 sm:gap-6 bg-slate-50/50 overflow-x-auto">
          <button
            onClick={() => setActiveDetailTab('columns')}
            className={`py-3 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeDetailTab === 'columns'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            Struktur Kolom & Tipe Data ({currentTable.columns.length})
          </button>

          <button
            onClick={() => setActiveDetailTab('relationships')}
            className={`py-3 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeDetailTab === 'relationships'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            Relasi Relasional ({currentTable.relationships.length})
          </button>

          <button
            onClick={() => setActiveDetailTab('rls')}
            className={`py-3 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeDetailTab === 'rls'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            Kebijakan Keamanan (RLS)
          </button>

          <button
            onClick={() => setActiveDetailTab('ddl')}
            className={`py-3 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeDetailTab === 'ddl'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Cuplikan SQL DDL
          </button>
        </div>

        {/* Tab Konten 1: Struktur Kolom */}
        {activeDetailTab === 'columns' && (
          <div className="p-5 sm:p-6 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3 rounded-l-lg">Nama Kolom</th>
                  <th className="py-2.5 px-3">Tipe Data</th>
                  <th className="py-2.5 px-3">Atribut</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Keterangan & Peran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentTable.columns.map((col) => (
                  <tr key={col.name} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                      {col.isPrimary && (
                        <span title="Primary Key" className="p-0.5 rounded bg-amber-100 text-amber-700">
                          <Key className="w-3 h-3" />
                        </span>
                      )}
                      <span>{col.name}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-blue-700 font-semibold">
                      {col.type}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {col.isPrimary && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                            PRIMARY KEY
                          </span>
                        )}
                        {col.isForeign && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 text-[10px] font-bold border border-indigo-200">
                            FOREIGN KEY
                          </span>
                        )}
                        {!col.nullable ? (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
                            NOT NULL
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-400 text-[10px] font-mono">
                            NULLABLE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 leading-relaxed">
                      {col.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Konten 2: Relasi Database */}
        {activeDetailTab === 'relationships' && (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Koneksi Antar Tabel (Relational Foreign Keys)
            </div>
            <div className="space-y-3">
              {currentTable.relationships.map((rel, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-blue-700">{rel.source}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800">{rel.target}</span>
                    </div>
                    <p className="text-xs text-slate-600">{rel.description}</p>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 shrink-0 self-start sm:self-center">
                    {rel.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Konten 3: RLS Rules */}
        {activeDetailTab === 'rls' && (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Row Level Security diaktifkan dengan perintah: <code className="font-mono font-bold">ALTER TABLE public.{currentTable.name} ENABLE ROW LEVEL SECURITY;</code>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {currentTable.rlsRules.map((rule, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-900">{rule.role}</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                        {rule.permissions}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rule.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Konten 4: SQL DDL */}
        {activeDetailTab === 'ddl' && (
          <div className="p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono font-semibold">PostgreSQL DDL Definition</span>
              <button
                onClick={handleCopyDdl}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copiedTableDdl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedTableDdl ? 'Disalin!' : 'Salin Script'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
              {currentTable.sqlDdl}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
