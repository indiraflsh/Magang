-- ==============================================================================
-- SISTEM MANAJEMEN & TRACKING MAGANG (INTERNSHIP MANAGEMENT SYSTEM)
-- Database Schema & Row Level Security (RLS) for Supabase PostgreSQL
-- ==============================================================================

-- 1. EXTENSIONS & HELPER FUNCTIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper function to automatically update `updated_at` timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. TABEL: PROFILES (Extends Supabase auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'mentor', 'coordinator', 'admin')) DEFAULT 'student',
  phone_number TEXT,
  institution TEXT, -- Universitas / Sekolah
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for role and email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Trigger for updated_at on profiles
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 3. TABEL: INTERNSHIP_PROFILES (Detail Data Program Magang Siswa)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.internship_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id_number TEXT NOT NULL, -- NIM / NISN
  institution_name TEXT NOT NULL, -- Asal Sekolah / Perguruan Tinggi
  major TEXT NOT NULL, -- Jurusan / Program Studi
  company_name TEXT NOT NULL, -- Tempat / Instansi Magang
  company_address TEXT,
  department TEXT NOT NULL, -- Divisi / Bagian
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Pembimbing Lapangan
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_required_hours INT NOT NULL DEFAULT 600, -- Target jam magang (contoh 600 jam)
  accumulated_hours NUMERIC(6, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'pending', 'cancelled')) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_internship_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_internship_user_id ON public.internship_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_internship_mentor_id ON public.internship_profiles(mentor_id);
CREATE INDEX IF NOT EXISTS idx_internship_status ON public.internship_profiles(status);

DROP TRIGGER IF EXISTS tr_internship_profiles_updated_at ON public.internship_profiles;
CREATE TRIGGER tr_internship_profiles_updated_at
  BEFORE UPDATE ON public.internship_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 4. TABEL: ATTENDANCE (Presensi & Absensi Harian)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attendance (
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
  notes TEXT, -- Keterangan atau alasan permohonan izin/sakit
  attachment_url TEXT, -- Surat dokter atau surat izin jika sick/permission
  approval_status TEXT NOT NULL CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_internship_attendance_date UNIQUE(internship_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_internship_date ON public.attendance(internship_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON public.attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_approval ON public.attendance(approval_status);

DROP TRIGGER IF EXISTS tr_attendance_updated_at ON public.attendance;
CREATE TRIGGER tr_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 5. TABEL: DAILY_JOURNALS (Jurnal & Catatan Aktivitas Harian)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.daily_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID NOT NULL REFERENCES public.internship_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_title TEXT NOT NULL,
  activity_description TEXT NOT NULL, -- Penjelasan kegiatan
  challenges TEXT, -- Kendala yang dihadapi
  solutions_or_results TEXT, -- Solusi yang diterapkan & hasil capaian
  attachment_url TEXT, -- Dokumentasi kegiatan (foto/dokumen)
  learning_category TEXT DEFAULT 'Technical', -- Kategori: Technical, Softskills, Manajemen, dll
  duration_hours NUMERIC(4, 2) NOT NULL DEFAULT 8.0,
  approval_status TEXT NOT NULL CHECK (approval_status IN ('draft', 'submitted', 'approved', 'revision_requested')) DEFAULT 'submitted',
  mentor_feedback TEXT, -- Catatan ulasan dari pembimbing lapangan
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_journals_internship_date ON public.daily_journals(internship_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_journals_user_id ON public.daily_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_journals_approval ON public.daily_journals(approval_status);

DROP TRIGGER IF EXISTS tr_daily_journals_updated_at ON public.daily_journals;
CREATE TRIGGER tr_daily_journals_updated_at
  BEFORE UPDATE ON public.daily_journals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 6. TABEL: EVALUATIONS (Penilaian Kinerja Berkala / Akhir Magang)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID NOT NULL REFERENCES public.internship_profiles(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Pembimbing yang menilai
  evaluation_period TEXT NOT NULL CHECK (evaluation_period IN ('monthly', 'midterm', 'final')) DEFAULT 'final',
  discipline_score NUMERIC(5, 2) NOT NULL CHECK (discipline_score BETWEEN 0 AND 100), -- 0 - 100
  technical_skill_score NUMERIC(5, 2) NOT NULL CHECK (technical_skill_score BETWEEN 0 AND 100),
  initiative_score NUMERIC(5, 2) NOT NULL CHECK (initiative_score BETWEEN 0 AND 100),
  teamwork_score NUMERIC(5, 2) NOT NULL CHECK (teamwork_score BETWEEN 0 AND 100),
  attitude_score NUMERIC(5, 2) NOT NULL CHECK (attitude_score BETWEEN 0 AND 100),
  final_score NUMERIC(5, 2) NOT NULL CHECK (final_score BETWEEN 0 AND 100), -- Skor rata-rata / kalkulasi
  grade TEXT NOT NULL, -- 'A', 'A-', 'B+', 'B', 'C', dll
  strengths TEXT, -- Kelebihan siswa
  areas_for_improvement TEXT, -- Saran perbaikan
  general_notes TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_internship_id ON public.evaluations(internship_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator_id ON public.evaluations(evaluator_id);

DROP TRIGGER IF EXISTS tr_evaluations_updated_at ON public.evaluations;
CREATE TRIGGER tr_evaluations_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 7. SUPABASE AUTH TRIGGER: Otomatis Tambah Profil Saat User Mendaftar
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS di semua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Helper function: Memeriksa role pengguna yang sedang login
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 8.1. POLICIES: PROFILES
-- Siapapun yang terautentikasi dapat membaca profil rekan (untuk melihat nama mentor/siswa)
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- User hanya dapat mengubah profil mereka sendiri
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 8.2. POLICIES: INTERNSHIP_PROFILES
-- Siswa dapat membaca profil magang milik mereka sendiri
CREATE POLICY "Students can view their own internship profile"
  ON public.internship_profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    mentor_id = auth.uid() OR
    public.current_user_role() IN ('coordinator', 'admin')
  );

-- Siswa atau Admin dapat mendaftarkan profil magang
CREATE POLICY "Users can insert their own internship profile"
  ON public.internship_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    public.current_user_role() IN ('coordinator', 'admin')
  );

-- Pembimbing & Admin dapat memperbarui internship profile (misal assign mentor / status selesai)
CREATE POLICY "Mentors and coordinators can update internship profile"
  ON public.internship_profiles FOR UPDATE
  TO authenticated
  USING (
    mentor_id = auth.uid() OR
    public.current_user_role() IN ('coordinator', 'admin')
  );

-- 8.3. POLICIES: ATTENDANCE
-- Siswa membaca absensinya sendiri; Pembimbing membaca absensi siswa bimbingannya; Admin membaca semua
CREATE POLICY "View attendance policy"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.internship_profiles ip
      WHERE ip.id = attendance.internship_id AND ip.mentor_id = auth.uid()
    ) OR
    public.current_user_role() IN ('coordinator', 'admin')
  );

-- Siswa dapat mengisi absensi mereka sendiri
CREATE POLICY "Students can record their own attendance"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- Siswa dapat memperbarui absensi jika belum disetujui (misal clock-out di hari yang sama)
CREATE POLICY "Students can update their attendance before approval"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND approval_status = 'pending'
  );

-- Pembimbing & Admin dapat menyetujui / menolak absensi
CREATE POLICY "Mentors can verify attendance"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.internship_profiles ip
      WHERE ip.id = attendance.internship_id AND ip.mentor_id = auth.uid()
    ) OR
    public.current_user_role() IN ('coordinator', 'admin')
  );

-- 8.4. POLICIES: DAILY_JOURNALS
-- Siswa membaca jurnalnya; Mentor membaca jurnal siswa bimbingannya; Admin membaca semua
CREATE POLICY "View daily journals policy"
  ON public.daily_journals FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.internship_profiles ip
      WHERE ip.id = daily_journals.internship_id AND ip.mentor_id = auth.uid()
    ) OR
    public.current_user_role() IN ('coordinator', 'admin')
  );

-- Siswa membuat jurnal harian
CREATE POLICY "Students can insert daily journals"
  ON public.daily_journals FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- Siswa dapat mengedit jurnal mereka jika statusnya draft atau revision_requested
CREATE POLICY "Students can update their editable daily journals"
  ON public.daily_journals FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND approval_status IN ('draft', 'submitted', 'revision_requested')
  );

-- Pembimbing dapat mengulas & memberi nilai/approve jurnal
CREATE POLICY "Mentors can approve or review daily journals"
  ON public.daily_journals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.internship_profiles ip
      WHERE ip.id = daily_journals.internship_id AND ip.mentor_id = auth.uid()
    ) OR
    public.current_user_role() IN ('coordinator', 'admin')
  );

-- 8.5. POLICIES: EVALUATIONS
-- Siswa hanya bisa membaca evaluasi jika sudah di-publish; Mentor & Admin bisa membaca semua evaluasi yang relevan
CREATE POLICY "View evaluations policy"
  ON public.evaluations FOR SELECT
  TO authenticated
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.internship_profiles ip
        WHERE ip.id = evaluations.internship_id AND ip.user_id = auth.uid()
      ) AND is_published = TRUE
    ) OR
    evaluator_id = auth.uid() OR
    public.current_user_role() IN ('coordinator', 'admin')
  );

-- Pembimbing & Admin dapat mengisi evaluasi
CREATE POLICY "Mentors can insert evaluations"
  ON public.evaluations FOR INSERT
  TO authenticated
  WITH CHECK (
    evaluator_id = auth.uid() OR
    public.current_user_role() IN ('coordinator', 'admin')
  );

-- Pembimbing & Admin dapat mengedit evaluasi
CREATE POLICY "Mentors can update evaluations"
  ON public.evaluations FOR UPDATE
  TO authenticated
  USING (
    evaluator_id = auth.uid() OR
    public.current_user_role() IN ('coordinator', 'admin')
  );

-- ==============================================================================
-- 9. SUPABASE STORAGE BUCKETS CONFIGURATION (Catatan / Eksekusi Manual)
-- ==============================================================================
-- Di Supabase Dashboard -> Storage, buat 2 bucket berikut (set Public atau buat Storage RLS):
-- 1. 'attendance-proofs' : Menyimpan foto clock-in/clock-out & surat izin/sakit
-- 2. 'journal-attachments' : Menyimpan dokumen/foto bukti kegiatan harian
