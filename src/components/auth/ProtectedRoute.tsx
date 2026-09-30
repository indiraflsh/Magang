import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldAlert, ArrowRight, LogIn, Lock } from 'lucide-react';
import { AuthModalOrPage } from './AuthModalOrPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallbackToAuth?: boolean;
  onRedirectToRoleDashboard?: (role: UserRole) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallbackToAuth = true,
  onRedirectToRoleDashboard
}) => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600">Memverifikasi sesi autentikasi pengguna...</p>
      </div>
    );
  }

  // Case 1: User is not authenticated
  if (!user || !profile) {
    if (fallbackToAuth) {
      return (
        <div className="py-6 space-y-6">
          <div className="max-w-md mx-auto p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-3">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Halaman Terproteksi:</span> Anda harus masuk atau mendaftarkan akun terlebih dahulu untuk mengakses fitur ini.
            </div>
          </div>
          <AuthModalOrPage />
        </div>
      );
    }

    return (
      <div className="min-h-[350px] bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
          <LogIn className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Diperlukan Login</h3>
          <p className="text-xs text-slate-500 mt-1">
            Silakan masuk dengan akun siswa atau pembimbing Anda untuk melihat data.
          </p>
        </div>
      </div>
    );
  }

  // Case 2: Role-based check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    const roleLabels: Record<UserRole, string> = {
      student: 'Siswa / Mahasiswa Magang',
      mentor: 'Pembimbing Lapangan (Mentor)',
      coordinator: 'Koordinator Magang Kampus',
      admin: 'Administrator Sistem'
    };

    const targetRoleLabel = allowedRoles.map(r => roleLabels[r]).join(' atau ');
    const currentRoleLabel = roleLabels[profile.role] || profile.role;

    return (
      <div className="max-w-xl mx-auto my-8 bg-white rounded-2xl border border-rose-200/80 shadow-xs p-6 sm:p-8 space-y-5">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
              Akses Ditolak (Role-Based Access Control)
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Halaman Khusus: {targetRoleLabel}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Akun Anda saat ini terdaftar dengan peran <span className="font-bold text-slate-800">{currentRoleLabel}</span>. 
              Sesuai aturan keamanan Supabase Row-Level Security (RLS), Anda hanya dapat mengakses dashboard yang sesuai dengan peran aktif Anda.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-800">Beralih ke Dashboard yang Tepat:</div>
            <div className="text-[11px] text-slate-500">
              Klik tombol untuk langsung diarahkan ke portal {currentRoleLabel}.
            </div>
          </div>

          <button
            id="btn-redirect-to-my-role"
            type="button"
            onClick={() => onRedirectToRoleDashboard && onRedirectToRoleDashboard(profile.role)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            <span>Buka Dashboard Saya</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Allowed
  return <>{children}</>;
};
