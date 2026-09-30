import React, { useState } from 'react';
import { useAuth, RegisterFormData } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { 
  GraduationCap, 
  Briefcase, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Building, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';

interface AuthModalOrPageProps {
  onSuccess?: () => void;
  defaultRole?: UserRole;
  defaultMode?: 'login' | 'register';
}

export const AuthModalOrPage: React.FC<AuthModalOrPageProps> = ({
  onSuccess,
  defaultRole = 'student',
  defaultMode = 'login'
}) => {
  const { 
    signIn, 
    signUp, 
    signInDemo, 
    signInWithGoogleAuth, 
    isSupabaseLive, 
    isFirebaseLive, 
    isLoading 
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState<string>('fauzan.siswa@magang.ac.id');
  const [loginPassword, setLoginPassword] = useState<string>('password123');

  // Register form states
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regInstitution, setRegInstitution] = useState<string>('');
  
  // Siswa specific
  const [regStudentId, setRegStudentId] = useState<string>('');
  const [regMajor, setRegMajor] = useState<string>('');
  const [regCompany, setRegCompany] = useState<string>('');
  const [regDepartment, setRegDepartment] = useState<string>('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginEmail || !loginPassword) {
      setErrorMsg('Harap isi alamat email dan password');
      return;
    }

    setIsSubmitting(true);
    const res = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg('Berhasil masuk! Mengarahkan ke dashboard...');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 500);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regFullName.trim()) {
      setErrorMsg('Nama lengkap wajib diisi');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg('Alamat email wajib diisi');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Kata sandi minimal harus 6 karakter');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok');
      return;
    }

    if (selectedRole === 'student' && !regStudentId.trim()) {
      setErrorMsg('Nomor Induk Mahasiswa (NIM/NISN) wajib diisi untuk siswa magang');
      return;
    }

    const payload: RegisterFormData = {
      email: regEmail,
      password: regPassword,
      full_name: regFullName,
      role: selectedRole,
      phone_number: regPhone,
      institution: regInstitution,
      student_id_number: regStudentId,
      major: regMajor,
      company_name: regCompany,
      department: regDepartment
    };

    setIsSubmitting(true);
    const res = await signUp(payload);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg('Akun berhasil didaftarkan! Mengarahkan ke dashboard...');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 500);
    }
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    setErrorMsg(null);
    signInDemo(role);
    setSuccessMsg(`Berhasil login demo sebagai ${role === 'student' ? 'Siswa Magang' : 'Pembimbing Lapangan'}!`);
    setTimeout(() => {
      if (onSuccess) onSuccess();
    }, 400);
  };

  return (
    <div id="auth-page-container" className="max-w-xl mx-auto w-full animate-fade-in">
      {/* Container Card */}
      <div className="comic-card bg-white rounded-3xl border-[3.5px] border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden">
        {/* Banner Top */}
        <div className="bg-yellow-300 p-6 sm:p-7 text-black border-b-[3px] border-black relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-black tracking-wider uppercase px-3 py-1 rounded-full bg-white text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-black" />
                POW! SUPABASE AUTH & PROFILES
              </span>
              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] ${
                isSupabaseLive 
                  ? 'bg-emerald-300 text-emerald-950' 
                  : 'bg-amber-200 text-amber-950'
              }`}>
                {isSupabaseLive ? '● Supabase Live' : '○ Mode Petualangan Demo'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
              {mode === 'login' ? '⚡ MASUK KE MARKAS MAGANG' : '💥 DAFTAR PAHLAWAN MAGANG BARU'}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
              {mode === 'login'
                ? 'Kelola presensi harian, logbook kegiatan, dan bimbingan berkala!'
                : 'Pilih peranmu (Siswa Magang atau Sensei Pembimbing) untuk memulai!'}
            </p>
          </div>
        </div>

        {/* Mode Switch Tabs (Masuk vs Daftar) */}
        <div className="flex border-b-2 border-black bg-pink-100 p-1.5 gap-1.5">
          <button
            type="button"
            id="tab-auth-login"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl border-2 border-black transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-black shadow-[2px_2px_0px_0px_#000]'
                : 'bg-transparent text-slate-700 hover:bg-white/50 border-transparent'
            }`}
          >
            Masuk Akun (Login) 🔑
          </button>
          <button
            type="button"
            id="tab-auth-register"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl border-2 border-black transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-black shadow-[2px_2px_0px_0px_#000]'
                : 'bg-transparent text-slate-700 hover:bg-white/50 border-transparent'
            }`}
          >
            Daftar Baru (Register) 📝
          </button>
        </div>

        <div className="p-5 sm:p-7 space-y-5">
          {/* Status Alert Banner */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-200 border-2 border-black rounded-2xl text-rose-950 text-xs font-black shadow-[2px_2px_0px_0px_#000] flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-900 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-200 border-2 border-black rounded-2xl text-emerald-950 text-xs font-black shadow-[2px_2px_0px_0px_#000] flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-900 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{successMsg}</div>
            </div>
          )}

          {/* Firebase Google Auth Button */}
          <div className="space-y-2">
            <button
              type="button"
              id="btn-google-signin"
              onClick={async () => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setIsSubmitting(true);
                const res = await signInWithGoogleAuth();
                setIsSubmitting(false);
                if (res.error) {
                  setErrorMsg(res.error);
                } else {
                  setSuccessMsg('🔥 Login Google Firebase Berhasil!');
                  setTimeout(() => {
                    if (onSuccess) onSuccess();
                  }, 500);
                }
              }}
              disabled={isSubmitting}
              className="comic-btn-primary w-full py-3 px-4 rounded-xl border-2 border-black bg-white hover:bg-slate-50 text-slate-900 text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 shadow-[3px_3px_0px_0px_#000] cursor-pointer transition-transform"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Masuk dengan Google (Firebase Auth)</span>
              <span className="text-[10px] bg-amber-200 text-amber-950 font-black px-1.5 py-0.5 rounded border border-black ml-1">
                LIVE 🔥
              </span>
            </button>
            
            <div className="flex items-center my-3">
              <div className="flex-1 border-t-2 border-black"></div>
              <span className="px-3 text-[10px] sm:text-[11px] font-black uppercase text-slate-500 bg-white">atau gunakan akun email / demo</span>
              <div className="flex-1 border-t-2 border-black"></div>
            </div>
          </div>

          {/* Quick Demo Login Option */}
          <div className="p-4 bg-amber-50 rounded-2xl border-2 border-black shadow-[2.5px_2.5px_0px_0px_#000]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-600" />
                ⭐ Uji Coba Kilat (1-Click Demo Login)
              </span>
              <span className="text-[10px] bg-yellow-200 border border-black px-2 py-0.5 rounded-md font-black text-black">Langsung Masuk</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-demo-student-login"
                onClick={() => handleQuickDemoLogin('student')}
                className="comic-btn-primary p-2.5 rounded-xl border-2 border-black bg-white hover:bg-cyan-100 text-left transition-colors flex items-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#000]"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-300 border border-black text-black flex items-center justify-center shrink-0 font-black">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 truncate">Siswa Magang</div>
                  <div className="text-[10px] text-slate-600 font-bold truncate">Fauzan Azhim</div>
                </div>
              </button>

              <button
                type="button"
                id="btn-demo-mentor-login"
                onClick={() => handleQuickDemoLogin('mentor')}
                className="comic-btn-primary p-2.5 rounded-xl border-2 border-black bg-white hover:bg-purple-100 text-left transition-colors flex items-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#000]"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-300 border border-black text-black flex items-center justify-center shrink-0 font-black">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 truncate">Sensei Pembimbing</div>
                  <div className="text-[10px] text-slate-600 font-bold truncate">Ir. Hendra Kusuma</div>
                </div>
              </button>
            </div>
          </div>

          {/* Form 1: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                  📧 Email Akun
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama@kampus.ac.id atau nama@perusahaan.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] focus:shadow-[3px_3px_0px_0px_#000] text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    🔒 Kata Sandi (Password)
                  </label>
                  <span className="text-[10px] text-slate-600 font-bold">Min. 6 Karakter</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] focus:shadow-[3px_3px_0px_0px_#000] text-slate-900 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-login"
                disabled={isSubmitting || isLoading}
                className="comic-btn-primary w-full mt-2 py-3 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000] cursor-pointer disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4 text-black" />
                <span>{isSubmitting ? 'MEMVERIFIKASI...' : 'MASUK SEKARANG! 🚀'}</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-xs text-blue-800 hover:text-blue-950 font-black cursor-pointer underline decoration-2"
                >
                  Belum memiliki akun? Daftar hero baru di sini ✨
                </button>
              </div>
            </form>
          )}

          {/* Form 2: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Role Selection Cards */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  1. Pilih Peran Pahlawan (Role) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Option: Student */}
                  <button
                    type="button"
                    id="role-select-student"
                    onClick={() => setSelectedRole('student')}
                    className={`comic-card p-3.5 rounded-2xl border-2 border-black text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedRole === 'student'
                        ? 'bg-cyan-200 shadow-[3px_3px_0px_0px_#000]'
                        : 'bg-white hover:bg-slate-50 shadow-[2px_2px_0px_0px_#000]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-xl border-2 border-black flex items-center justify-center font-black ${
                        selectedRole === 'student' ? 'bg-black text-yellow-300' : 'bg-slate-100 text-slate-800'
                      }`}>
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      {selectedRole === 'student' && (
                        <span className="text-[10px] font-black bg-black text-white px-1.5 py-0.5 rounded-md">AKTIF</span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-950">Siswa / Mahasiswa</div>
                      <div className="text-[11px] text-slate-700 font-bold mt-0.5">Peserta Magang 🎓</div>
                    </div>
                  </button>

                  {/* Option: Mentor */}
                  <button
                    type="button"
                    id="role-select-mentor"
                    onClick={() => setSelectedRole('mentor')}
                    className={`comic-card p-3.5 rounded-2xl border-2 border-black text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedRole === 'mentor'
                        ? 'bg-purple-200 shadow-[3px_3px_0px_0px_#000]'
                        : 'bg-white hover:bg-slate-50 shadow-[2px_2px_0px_0px_#000]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-xl border-2 border-black flex items-center justify-center font-black ${
                        selectedRole === 'mentor' ? 'bg-black text-yellow-300' : 'bg-slate-100 text-slate-800'
                      }`}>
                        <Briefcase className="w-4 h-4" />
                      </div>
                      {selectedRole === 'mentor' && (
                        <span className="text-[10px] font-black bg-black text-white px-1.5 py-0.5 rounded-md">AKTIF</span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-950">Pembimbing Lapangan</div>
                      <div className="text-[11px] text-slate-700 font-bold mt-0.5">Sensei Industri 💼</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Data Akun Utama */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Informasi Akun & Kontak
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nama Lengkap (beserta gelar jika ada) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      id="input-reg-fullname"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder={selectedRole === 'student' ? 'contoh: Ahmad Rizky Saputra' : 'contoh: Ir. Hendra Kusuma, M.Kom'}
                      required
                      className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Email Aktif *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        id="input-reg-email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="nama@email.com"
                        required
                        className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      No. WhatsApp / Telepon
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        id="input-reg-phone"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="0812-xxxx-xxxx"
                        className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Kata Sandi *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="input-reg-password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min. 6 Karakter"
                        required
                        className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Konfirmasi Sandi *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="input-reg-confirm-password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Ulangi Sandi"
                        required
                        className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Khusus Peran */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. {selectedRole === 'student' ? 'Data Akademik & Instansi Magang' : 'Instansi & Penempatan Kerja'}
                </div>

                {selectedRole === 'student' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          NIM / NISN *
                        </label>
                        <input
                          type="text"
                          id="input-reg-student-id"
                          value={regStudentId}
                          onChange={(e) => setRegStudentId(e.target.value)}
                          placeholder="contoh: 2207411032"
                          required
                          className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Jurusan / Program Studi
                        </label>
                        <input
                          type="text"
                          id="input-reg-major"
                          value={regMajor}
                          onChange={(e) => setRegMajor(e.target.value)}
                          placeholder="contoh: Teknik Informatika"
                          className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Asal Universitas / Kampus / Sekolah
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          id="input-reg-institution"
                          value={regInstitution}
                          onChange={(e) => setRegInstitution(e.target.value)}
                          placeholder="contoh: Politeknik Negeri Jakarta"
                          className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Nama Perusahaan / Instansi Magang
                        </label>
                        <input
                          type="text"
                          id="input-reg-company"
                          value={regCompany}
                          onChange={(e) => setRegCompany(e.target.value)}
                          placeholder="contoh: PT Telkom Indonesia"
                          className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Divisi / Departemen Penugasan
                        </label>
                        <input
                          type="text"
                          id="input-reg-department"
                          value={regDepartment}
                          onChange={(e) => setRegDepartment(e.target.value)}
                          placeholder="contoh: Software Engineering Squad"
                          className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nama Perusahaan / Kantor Pembimbing
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          id="input-reg-institution-mentor"
                          value={regInstitution}
                          onChange={(e) => setRegInstitution(e.target.value)}
                          placeholder="contoh: PT Telkom Indonesia (Persero) Tbk"
                          className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Jabatan / Posisi di Perusahaan
                      </label>
                      <input
                        type="text"
                        id="input-reg-department-mentor"
                        value={regDepartment}
                        onChange={(e) => setRegDepartment(e.target.value)}
                        placeholder="contoh: Senior Technical Lead / Manager IT"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800"
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                id="btn-submit-register"
                disabled={isSubmitting || isLoading}
                className="comic-btn-primary w-full mt-3 py-3 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000] cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>{isSubmitting ? 'MENDAFTARKAN AKUN...' : 'DAFTAR SEKARANG & BUAT PROFIL! 🚀'}</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-blue-800 hover:text-blue-950 font-black cursor-pointer underline decoration-2"
                >
                  Sudah punya akun? Masuk di sini ✨
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
