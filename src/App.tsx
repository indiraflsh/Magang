import React, { useState } from 'react';
import { 
  Database, 
  ShieldCheck, 
  Copy, 
  Check, 
  Layers, 
  GraduationCap, 
  Clock, 
  BookOpen, 
  Award, 
  Users, 
  ChevronRight, 
  KeyRound, 
  FileCode2,
  HardDrive,
  CheckCircle2,
  ListOrdered,
  Briefcase,
  LogIn,
  LogOut,
  User,
  Shield,
  ArrowRightLeft,
  Sparkles,
  LayoutDashboard
} from 'lucide-react';
import { DatabaseTablesViewer } from './components/DatabaseTablesViewer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';
import { AutoSaveIndicator } from './components/common/AutoSaveIndicator';
import { AuthModalOrPage } from './components/auth/AuthModalOrPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { MentorDashboard } from './components/dashboard/MentorDashboard';
import { ProfileEditModal } from './components/auth/ProfileEditModal';
import { UserRole } from './types';

const SQL_SCHEMA = `-- ==============================================================================
-- SISTEM MANAJEMEN & TRACKING MAGANG (INTERNSHIP MANAGEMENT SYSTEM)
-- Database Schema & Row Level Security (RLS) for Supabase PostgreSQL
-- ==============================================================================

-- 1. EXTENSIONS & HELPER FUNCTIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper function to automatically update updated_at timestamps
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
  institution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

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
  notes TEXT,
  attachment_url TEXT,
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
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 8.1. POLICIES: PROFILES
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 8.2. POLICIES: INTERNSHIP_PROFILES
CREATE POLICY "Students can view their own internship profile"
  ON public.internship_profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    mentor_id = auth.uid() OR
    public.current_user_role() IN ('coordinator', 'admin')
  );

CREATE POLICY "Users can insert their own internship profile"
  ON public.internship_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    public.current_user_role() IN ('coordinator', 'admin')
  );

CREATE POLICY "Mentors and coordinators can update internship profile"
  ON public.internship_profiles FOR UPDATE
  TO authenticated
  USING (
    mentor_id = auth.uid() OR
    public.current_user_role() IN ('coordinator', 'admin')
  );

-- 8.3. POLICIES: ATTENDANCE
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

CREATE POLICY "Students can record their own attendance"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Students can update their attendance before approval"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND approval_status = 'pending'
  );

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

CREATE POLICY "Students can insert daily journals"
  ON public.daily_journals FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Students can update their editable daily journals"
  ON public.daily_journals FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND approval_status IN ('draft', 'submitted', 'revision_requested')
  );

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

CREATE POLICY "Mentors can insert evaluations"
  ON public.evaluations FOR INSERT
  TO authenticated
  WITH CHECK (
    evaluator_id = auth.uid() OR
    public.current_user_role() IN ('coordinator', 'admin')
  );

CREATE POLICY "Mentors can update evaluations"
  ON public.evaluations FOR UPDATE
  TO authenticated
  USING (
    evaluator_id = auth.uid() OR
    public.current_user_role() IN ('coordinator', 'admin')
  );
`;

function MainApp() {
  const { user, profile, signOut, signInDemo, isSupabaseLive } = useAuth();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'auth' | 'tables' | 'overview' | 'sql' | 'storage'>('dashboard');
  const [selectedTable, setSelectedTable] = useState<string>('profiles');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  // For testing protected route simulation: which view is being requested in dashboard tab
  const [dashboardViewTarget, setDashboardViewTarget] = useState<'auto' | 'student' | 'mentor'>('auto');

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const currentRole = profile?.role || 'student';
  const effectiveView = dashboardViewTarget === 'auto' ? currentRole : dashboardViewTarget;

  const handleToggleRoleDemo = () => {
    if (currentRole === 'student') {
      signInDemo('mentor');
    } else {
      signInDemo('student');
    }
    setDashboardViewTarget('auto');
  };

  return (
    <div id="main-container" className="min-h-screen comic-dots-bg text-slate-900 flex flex-col font-sans">
      {/* Top Header - Comic Book Edition */}
      <header id="app-header" className="border-b-[3px] border-black bg-white sticky top-0 z-30 shadow-[0_4px_0_0_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Comic Brand Logo & Chapter Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-yellow-300 border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000] flex items-center justify-center text-black font-black text-xl shrink-0 comic-animate-float">
              ⭐
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>MAGANG HEROES</span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-md bg-pink-400 text-white border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] rotate-[-2deg]">
                    KOMIK! 💥
                  </span>
                </h1>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-950 border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-800" />
                  Edisi Lengkap: Presensi & Jurnal 🎯
                </span>
              </div>
              <p className="text-xs text-slate-600 font-bold hidden sm:block">
                Petualangan Menuju Profesional • Misi Harian • Buku Catatan (Logbook) • Sensei Review! ✨
              </p>
            </div>
          </div>

          {/* User Status Bar & Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {user && profile ? (
              <div className="flex items-center gap-2">
                {/* Role Switcher Demo Button */}
                <button
                  type="button"
                  id="btn-quick-switch-role"
                  onClick={handleToggleRoleDemo}
                  title="Ganti ke peran lain untuk pengujian"
                  className="comic-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-200 hover:bg-purple-300 text-purple-950 text-xs cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-purple-900" />
                  <span className="hidden md:inline">Ganti Karakter:</span>
                  <span className="underline decoration-wavy decoration-purple-600">{currentRole === 'student' ? '→ Sensei / Mentor' : '→ Siswa Hero'}</span>
                </button>

                {/* Auto-Save Progress Indicator */}
                <AutoSaveIndicator />

                {/* User Pill with Profile Trigger */}
                <button
                  type="button"
                  id="btn-open-my-profile"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-black shadow-[2.5px_2.5px_0px_0px_#000] bg-white hover:bg-yellow-50 transition-all cursor-pointer group"
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border-2 border-black"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-500 text-white border-2 border-black text-xs font-black flex items-center justify-center">
                      {profile.full_name.charAt(0)}
                    </div>
                  )}
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-none truncate max-w-[130px]">
                      {profile.full_name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold capitalize leading-none mt-0.5">
                      {profile.role === 'student' ? '🎒 Siswa Magang' : '🧑‍🏫 Sensei Mentor'}
                    </div>
                  </div>
                  <User className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-900" />
                </button>

                {/* Sign Out Button */}
                <button
                  type="button"
                  id="btn-logout"
                  onClick={() => signOut()}
                  title="Keluar Akun"
                  className="p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] bg-rose-100 hover:bg-rose-200 text-rose-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="btn-nav-to-auth"
                onClick={() => setActiveTab('auth')}
                className="comic-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl bg-yellow-300 hover:bg-yellow-400 text-black shadow-[3px_3px_0px_0px_#000] cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-black" />
                <span>Masuk Markas / Daftar</span>
              </button>
            )}

            <button
              id="btn-copy-sql-header"
              onClick={handleCopySql}
              className="comic-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-white hover:bg-slate-100 text-slate-800 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-700" />}
              <span className="hidden sm:inline">{copied ? 'Tersalin!' : 'SQL Schema'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="content-body" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {/* Comic Navigation Tabs */}
        <div id="navigation-tabs" className="flex gap-2 sm:gap-3 mb-6 overflow-x-auto pb-2">
          <button
            id="tab-btn-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-black flex items-center gap-2 rounded-xl border-2 border-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-yellow-300 text-black shadow-[3px_3px_0px_0px_#000] translate-y-[-1px]'
                : 'bg-white text-slate-700 hover:bg-yellow-50 shadow-[1.5px_1.5px_0px_0px_#000]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Markas Magang (Dashboard)</span>
          </button>

          <button
            id="tab-btn-auth"
            onClick={() => setActiveTab('auth')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-black flex items-center gap-2 rounded-xl border-2 border-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'auth'
                ? 'bg-pink-300 text-black shadow-[3px_3px_0px_0px_#000] translate-y-[-1px]'
                : 'bg-white text-slate-700 hover:bg-pink-50 shadow-[1.5px_1.5px_0px_0px_#000]'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Pintu Masuk (Auth)</span>
          </button>

          <button
            id="tab-btn-tables"
            onClick={() => setActiveTab('tables')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-black flex items-center gap-2 rounded-xl border-2 border-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'tables'
                ? 'bg-cyan-300 text-black shadow-[3px_3px_0px_0px_#000] translate-y-[-1px]'
                : 'bg-white text-slate-700 hover:bg-cyan-50 shadow-[1.5px_1.5px_0px_0px_#000]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Lemari Arsip Database (5)</span>
          </button>

          <button
            id="tab-btn-sql"
            onClick={() => setActiveTab('sql')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-black flex items-center gap-2 rounded-xl border-2 border-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'sql'
                ? 'bg-emerald-300 text-black shadow-[3px_3px_0px_0px_#000] translate-y-[-1px]'
                : 'bg-white text-slate-700 hover:bg-emerald-50 shadow-[1.5px_1.5px_0px_0px_#000]'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>Mantra SQL Supabase</span>
          </button>

          <button
            id="tab-btn-overview"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-black flex items-center gap-2 rounded-xl border-2 border-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-300 text-black shadow-[3px_3px_0px_0px_#000] translate-y-[-1px]'
                : 'bg-white text-slate-700 hover:bg-amber-50 shadow-[1.5px_1.5px_0px_0px_#000]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Peta Petualangan (Roadmap)</span>
          </button>

          <button
            id="tab-btn-storage"
            onClick={() => setActiveTab('storage')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-black flex items-center gap-2 rounded-xl border-2 border-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'storage'
                ? 'bg-violet-300 text-black shadow-[3px_3px_0px_0px_#000] translate-y-[-1px]'
                : 'bg-white text-slate-700 hover:bg-violet-50 shadow-[1.5px_1.5px_0px_0px_#000]'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Gudang Foto & Bukti</span>
          </button>
        </div>

        {/* Tab 1: Role-Protected Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Comic Simulation bar for Role Access & Protected Route testing */}
            <div className="p-3.5 bg-yellow-50 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-base">📡</span>
                <span className="text-xs font-black text-slate-900">
                  RADAR PERAN & SIMULASI:
                </span>
                <span className="text-xs font-bold text-slate-700">
                  Kamu sedang menjelajah sebagai <strong className="px-1.5 py-0.5 bg-yellow-300 rounded border border-black text-black capitalize font-black">{currentRole === 'student' ? '🦸 Siswa Magang' : '🧑‍🏫 Sensei Mentor'}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-test-view-student"
                  onClick={() => setDashboardViewTarget('student')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border-2 border-black ${
                    effectiveView === 'student'
                      ? 'bg-sky-400 text-black shadow-[2px_2px_0px_0px_#000]'
                      : 'bg-white text-slate-700 hover:bg-sky-50 shadow-[1px_1px_0px_0px_#000]'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Portal Siswa</span>
                </button>

                <button
                  type="button"
                  id="btn-test-view-mentor"
                  onClick={() => setDashboardViewTarget('mentor')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border-2 border-black ${
                    effectiveView === 'mentor'
                      ? 'bg-purple-400 text-black shadow-[2px_2px_0px_0px_#000]'
                      : 'bg-white text-slate-700 hover:bg-purple-50 shadow-[1px_1px_0px_0px_#000]'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Portal Pembimbing</span>
                </button>
              </div>
            </div>

            {/* Render Protected Content */}
            {effectiveView === 'student' ? (
              <ProtectedRoute
                allowedRoles={['student']}
                onRedirectToRoleDashboard={(role) => setDashboardViewTarget(role as 'student' | 'mentor')}
              >
                <StudentDashboard onOpenProfileEdit={() => setIsProfileModalOpen(true)} />
              </ProtectedRoute>
            ) : (
              <ProtectedRoute
                allowedRoles={['mentor']}
                onRedirectToRoleDashboard={(role) => setDashboardViewTarget(role as 'student' | 'mentor')}
              >
                <MentorDashboard onOpenProfileEdit={() => setIsProfileModalOpen(true)} />
              </ProtectedRoute>
            )}
          </div>
        )}

        {/* Tab 2: Auth Screen (Login & Register) */}
        {activeTab === 'auth' && (
          <div className="py-2">
            <AuthModalOrPage 
              onSuccess={() => setActiveTab('dashboard')} 
            />
          </div>
        )}

        {/* Tab: Daftar Tabel Database (5) */}
        {activeTab === 'tables' && (
          <DatabaseTablesViewer
            initialSelectedTable={selectedTable}
            onSelectTable={(tableName) => setSelectedTable(tableName)}
            onNavigateToSqlEditor={() => setActiveTab('sql')}
          />
        )}

        {/* Tab: Overview & Roadmap */}
        {activeTab === 'overview' && (
          <div id="overview-section" className="space-y-6">
            {/* Confirmation Banner */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-base font-bold text-slate-900">Konfirmasi Pemahaman Kebutuhan Aplikasi</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Saya memahami dengan seksama bahwa kita akan membangun <strong>Sistem Manajemen & Tracking Magang</strong> secara bertahap (step-by-step) dengan clean UI modern, TypeScript type-safe, dan backend Supabase (PostgreSQL + Auth + Storage).
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        Portal Siswa / Mahasiswa Magang
                      </div>
                      <p className="text-xs text-slate-600">
                        Presensi Clock-in/Clock-out berbasis foto & GPS, Jurnal Harian (kegiatan, kendala, hasil), permohonan izin/sakit, dan ringkasan jam kerja magang.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        Portal Pembimbing Lapangan
                      </div>
                      <p className="text-xs text-slate-600">
                        Monitoring daftar peserta bimbingan, verifikasi/approval presensi & jurnal harian, pemberian ulasan/revisi, serta form evaluasi kinerja berkala/akhir.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step-by-Step Implementation Roadmap */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <ListOrdered className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Rencana Pengerjaan Bertahap (Roadmap)</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div 
                  onClick={() => setActiveTab('tables')}
                  className="p-3.5 rounded-lg border-2 border-blue-600 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <div className="text-xs font-bold text-blue-700 mb-1 flex items-center justify-between">
                    <span>Langkah 1 (Aktif)</span>
                    <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">Buka 5 Tabel</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">Database Schema & RLS</div>
                  <p className="text-xs text-slate-500 mt-1">Struktur 5 tabel, trigger auth, relasi foreign key, dan security policies.</p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Langkah 2</div>
                  <div className="text-sm font-semibold text-slate-800">Autentikasi & Setup Profil</div>
                  <p className="text-xs text-slate-500 mt-1">Sistem login, sign up dengan role switcher (Siswa vs Pembimbing).</p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Langkah 3</div>
                  <div className="text-sm font-semibold text-slate-800">Modul Siswa Magang</div>
                  <p className="text-xs text-slate-500 mt-1">Clock-in/out GPS + foto bukti, form Jurnal Harian, izin/sakit.</p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Langkah 4</div>
                  <div className="text-sm font-semibold text-slate-800">Modul Pembimbing</div>
                  <p className="text-xs text-slate-500 mt-1">Dashboard bimbingan, approval workflow, form evaluasi/grading.</p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Langkah 5</div>
                  <div className="text-sm font-semibold text-slate-800">Ekspor Laporan Magang</div>
                  <p className="text-xs text-slate-500 mt-1">Generasi rekap laporan siap cetak (PDF & format Excel).</p>
                </div>
              </div>
            </div>

            {/* Quick Actions to execute SQL */}
            <div className="bg-slate-900 text-white p-6 rounded-xl shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
                    <KeyRound className="w-3.5 h-3.5" />
                    Instruksi Eksekusi di Supabase
                  </div>
                  <h4 className="text-base font-bold text-white">Jalankan di Supabase SQL Editor</h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    Buka proyek Supabase Anda &rarr; Klik menu <strong>SQL Editor</strong> di sidebar kiri &rarr; Buat <strong>New Query</strong> &rarr; Tempel (paste) skema SQL lengkap &rarr; Tekan tombol <strong>Run</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Script SQL'}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('sql')}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  >
                    Lihat Kode SQL
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Daftar Tabel Database (5) */}
        {activeTab === 'tables' && (
          <DatabaseTablesViewer
            initialSelectedTable={selectedTable}
            onSelectTable={(tableName) => setSelectedTable(tableName)}
            onNavigateToSqlEditor={() => setActiveTab('sql')}
          />
        )}

        {/* Tab 3: Full SQL Script */}
        {activeTab === 'sql' && (
          <div id="sql-script-section" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm font-bold text-slate-900">supabase/schema.sql</div>
                  <p className="text-xs text-slate-500">File skema lengkap PostgreSQL yang sudah disimpan ke direktori proyek.</p>
                </div>
              </div>
              <button
                id="btn-copy-sql-code"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Semua SQL'}</span>
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span>PostgreSQL Migration Script for Supabase</span>
                <span>UTF-8 • SQL</span>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[550px] leading-relaxed select-all">
                {SQL_SCHEMA}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 4: Storage & RLS */}
        {activeTab === 'storage' && (
          <div id="storage-section" className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Supabase Storage Configuration</h3>
                  <p className="text-xs text-slate-500">Konfigurasi bucket penyimpanan berkas media foto presensi & dokumen jurnal</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Untuk mendukung unggah foto absensi harian (Clock-in/out), surat sakit/izin dokter, serta foto dokumentasi kegiatan jurnal, buat 2 bucket di menu <strong>Storage &rarr; New Bucket</strong> di Supabase:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      attendance-proofs
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">Max size: 5MB</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">
                    Menyimpan foto selfie clock-in/out dan lampiran berkas surat izin/sakit.
                  </p>
                  <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200/80">
                    Path pattern: /&#123;internship_id&#125;/&#123;date&#125;_clockin.jpg
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      journal-attachments
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">Max size: 10MB</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">
                    Menyimpan foto dokumentasi kegiatan harian siswa dan file pendukung pekerjaan.
                  </p>
                  <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200/80">
                    Path pattern: /&#123;internship_id&#125;/&#123;journal_id&#125;.jpg
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Row Level Security (RLS) Ringkasan Aturan</h3>
                  <p className="text-xs text-slate-500">Perlindungan data multi-role antara Siswa dan Pembimbing</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">Tabel</th>
                      <th className="py-2.5 px-3">Siswa (Student)</th>
                      <th className="py-2.5 px-3">Pembimbing (Mentor)</th>
                      <th className="py-2.5 px-3">Koordinator / Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">profiles</td>
                      <td className="py-2.5 px-3">Read all, Update profil sendiri</td>
                      <td className="py-2.5 px-3">Read all, Update profil sendiri</td>
                      <td className="py-2.5 px-3">Read & Manage all</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">internship_profiles</td>
                      <td className="py-2.5 px-3">Read milik sendiri</td>
                      <td className="py-2.5 px-3">Read & Update bimbingan sendiri</td>
                      <td className="py-2.5 px-3">Full access</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">attendance</td>
                      <td className="py-2.5 px-3">Insert & update sebelum diverifikasi</td>
                      <td className="py-2.5 px-3">Read & Verifikasi (Approve/Reject)</td>
                      <td className="py-2.5 px-3">Full access</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">daily_journals</td>
                      <td className="py-2.5 px-3">Insert & edit (draft / revisi)</td>
                      <td className="py-2.5 px-3">Read, Review & Approve / Beri saran</td>
                      <td className="py-2.5 px-3">Full access</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">evaluations</td>
                      <td className="py-2.5 px-3">Read only jika is_published = true</td>
                      <td className="py-2.5 px-3">Insert, Update nilai & publish</td>
                      <td className="py-2.5 px-3">Full access</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Comic Footer */}
      <footer id="app-footer" className="border-t-[3px] border-black bg-yellow-100 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-base">💥</span>
            <span>
              <strong>MAGANG HEROES COMIC EDITION</strong> — Misi harian, logbook kegiatan, review mentor, dan status magang seru!
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-slate-700 bg-white px-3 py-1 rounded-full border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]">
            <span>⭐ Tetap Semangat & Raih Skor Maksimal!</span>
          </div>
        </div>
      </footer>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <MainApp />
      </ProgressProvider>
    </AuthProvider>
  );
}
