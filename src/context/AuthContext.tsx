import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  logOutFirebase, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { uploadAvatar } from '../lib/storage';
import { UserProfile, UserRole, InternshipProfile } from '../types';

export interface RegisterFormData {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone_number?: string;
  institution?: string;
  // Siswa specific
  student_id_number?: string;
  major?: string;
  company_name?: string;
  department?: string;
}

export interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  internship: InternshipProfile | null;
  isLoading: boolean;
  isSupabaseLive: boolean;
  isFirebaseLive: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (data: RegisterFormData) => Promise<{ error?: string }>;
  signInWithGoogleAuth: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  signInDemo: (role: UserRole) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>;
  uploadAvatarPhoto: (file: File) => Promise<{ url?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Sample initial mock profiles for Demo Mode & Fallbacks
export const DEMO_PROFILES: Record<UserRole, { profile: UserProfile; internship: InternshipProfile | null }> = {
  student: {
    profile: {
      id: 'demo-student-uuid-001',
      email: 'fauzan.siswa@magang.ac.id',
      full_name: 'Muhammad Fauzan Azhim',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'student',
      phone_number: '0812-3456-7890',
      institution: 'Politeknik Negeri Jakarta',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    internship: {
      id: 'demo-internship-uuid-001',
      user_id: 'demo-student-uuid-001',
      student_id_number: '2207411032',
      institution_name: 'Politeknik Negeri Jakarta',
      major: 'Teknik Informatika (D4)',
      company_name: 'PT Telkom Indonesia (Persero) Tbk',
      company_address: 'Jl. Japati No. 1, Sadang Serang, Coblong, Kota Bandung',
      department: 'Digital Platform & Experience (Frontend Squad)',
      mentor_id: 'demo-mentor-uuid-002',
      start_date: '2026-08-01',
      end_date: '2026-12-31',
      total_required_hours: 600,
      accumulated_hours: 248.5,
      status: 'active',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  mentor: {
    profile: {
      id: 'demo-mentor-uuid-002',
      email: 'hendra.kusuma@telkom.co.id',
      full_name: 'Ir. Hendra Kusuma, S.Kom., M.Kom.',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'mentor',
      phone_number: '0811-9876-5432',
      institution: 'PT Telkom Indonesia (Divisi Digital & IT)',
      created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    internship: null
  },
  coordinator: {
    profile: {
      id: 'demo-coord-uuid-003',
      email: 'koordinator.magang@pnj.ac.id',
      full_name: 'Dr. Siti Nurhaliza, M.T.',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      role: 'coordinator',
      phone_number: '0813-8888-7777',
      institution: 'Unit Pengelola Magang & Karir PNJ',
      created_at: new Date(Date.now() - 365 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    internship: null
  },
  admin: {
    profile: {
      id: 'demo-admin-uuid-004',
      email: 'admin.super@magang.id',
      full_name: 'Administrator Pusat',
      avatar_url: null,
      role: 'admin',
      phone_number: '0819-0000-1111',
      institution: 'Sistem Manajemen Magang',
      created_at: new Date(Date.now() - 365 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    internship: null
  }
};

const LOCAL_STORAGE_KEY = 'internship_app_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [internship, setInternship] = useState<InternshipProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on mount
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        if (isSupabaseConfigured) {
          // Check live Supabase session
          const { data: { session }, error } = await supabase.auth.getSession();
          if (!error && session?.user) {
            setUser(session.user);
            await fetchProfileAndInternship(session.user.id, session.user.email);
            setIsLoading(false);
            return;
          }
        }

        // Fallback: check local storage for demo session or previous login
        const savedSession = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed && parsed.profile) {
            setUser({ id: parsed.profile.id, email: parsed.profile.email });
            setProfile(parsed.profile);
            setInternship(parsed.internship || null);
            setIsLoading(false);
            return;
          }
        }

        // Default initial demo state for smooth preview experience: Siswa
        const defaultDemo = DEMO_PROFILES.student;
        setUser({ id: defaultDemo.profile.id, email: defaultDemo.profile.email });
        setProfile(defaultDemo.profile);
        setInternship(defaultDemo.internship);
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // Listen to Firebase Auth state
    const unsubscribeFirebase = onAuthStateChanged(auth, async (fbUser) => {
      if (!mounted) return;
      if (fbUser) {
        setUser({ id: fbUser.uid, email: fbUser.email });
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            const newProf: UserProfile = {
              id: fbUser.uid,
              email: fbUser.email || 'user@example.com',
              full_name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Hero Siswa Magang'),
              role: 'student',
              avatar_url: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              institution: 'Sekolah / Kampus Mitra',
              phone_number: fbUser.phoneNumber || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            await setDoc(userDocRef, newProf);
            setProfile(newProf);
          }
        } catch (fbErr) {
          console.warn('Firestore profile fetch notice:', fbErr);
        }
        setIsLoading(false);
      }
    });

    // Listen to Supabase auth changes if live
    let authListener: any = null;
    if (isSupabaseConfigured) {
      const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfileAndInternship(session.user.id, session.user.email);
        } else if (event === 'SIGNED_OUT') {
          // Only clear if not in demo session
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (!saved) {
            setUser(null);
            setProfile(null);
            setInternship(null);
          }
        }
      });
      authListener = listener;
    }

    return () => {
      mounted = false;
      unsubscribeFirebase();
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const fetchProfileAndInternship = async (userId: string, email?: string) => {
    try {
      if (!isSupabaseConfigured) return;

      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profileErr && profileData) {
        setProfile(profileData as UserProfile);

        if (profileData.role === 'student') {
          const { data: internData } = await supabase
            .from('internship_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (internData) {
            setInternship(internData as InternshipProfile);
          }
        }
      } else {
        // Create fallback profile in state if missing in DB yet
        const fallbackProf: UserProfile = {
          id: userId,
          email: email || 'user@example.com',
          full_name: email?.split('@')[0] || 'Pengguna Magang',
          role: 'student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setProfile(fallbackProf);
      }
    } catch (e) {
      console.warn('Profile fetch warning (expected if table not created yet):', e);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          setIsLoading(false);
          return { error: error.message };
        }
        if (data.user) {
          setUser(data.user);
          await fetchProfileAndInternship(data.user.id, data.user.email);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setIsLoading(false);
          return {};
        }
      }

      // Demo sign in simulation based on email keywords or matching demo
      let selectedRole: UserRole = 'student';
      if (email.includes('mentor') || email.includes('hendra')) {
        selectedRole = 'mentor';
      } else if (email.includes('coord') || email.includes('siti')) {
        selectedRole = 'coordinator';
      }

      const mockData = DEMO_PROFILES[selectedRole];
      const customProfile = {
        ...mockData.profile,
        email: email,
        full_name: email.split('@')[0].replace('.', ' ').toUpperCase() || mockData.profile.full_name
      };

      setUser({ id: customProfile.id, email: customProfile.email });
      setProfile(customProfile);
      setInternship(selectedRole === 'student' ? mockData.internship : null);

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        profile: customProfile,
        internship: mockData.internship
      }));

      setIsLoading(false);
      return {};
    } catch (err: any) {
      setIsLoading(false);
      return { error: err.message || 'Terjadi kesalahan saat masuk' };
    }
  };

  const signUp = async (data: RegisterFormData): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.full_name,
              role: data.role,
              phone_number: data.phone_number || null,
              institution: data.institution || null
            }
          }
        });

        if (authError) {
          setIsLoading(false);
          return { error: authError.message };
        }

        if (authData.user) {
          const newUserId = authData.user.id;
          
          // Insert to public.profiles
          const newProfile: UserProfile = {
            id: newUserId,
            email: data.email,
            full_name: data.full_name,
            role: data.role,
            phone_number: data.phone_number || null,
            institution: data.institution || null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          try {
            await supabase.from('profiles').upsert(newProfile);

            if (data.role === 'student' && data.student_id_number) {
              const newInternship: Partial<InternshipProfile> = {
                user_id: newUserId,
                student_id_number: data.student_id_number,
                institution_name: data.institution || 'Kampus Mitra',
                major: data.major || 'Teknik Informatika',
                company_name: data.company_name || 'PT Mitra Magang',
                department: data.department || 'Divisi IT',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 150 * 86400000).toISOString().split('T')[0],
                total_required_hours: 600,
                accumulated_hours: 0,
                status: 'active'
              };
              await supabase.from('internship_profiles').insert(newInternship);
            }
          } catch (dbErr) {
            console.warn('Database insert warning (handled safely):', dbErr);
          }

          setUser(authData.user);
          setProfile(newProfile);
          setIsLoading(false);
          return {};
        }
      }

      // Demo sign up simulation
      const newUserId = `user-reg-${Date.now()}`;
      const newProfile: UserProfile = {
        id: newUserId,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        phone_number: data.phone_number || '0812-0000-0000',
        institution: data.institution || (data.role === 'student' ? 'Universitas Indonesia' : 'PT Digital Nusantara'),
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let newInternship: InternshipProfile | null = null;
      if (data.role === 'student') {
        newInternship = {
          id: `internship-${Date.now()}`,
          user_id: newUserId,
          student_id_number: data.student_id_number || '220199281',
          institution_name: data.institution || 'Politeknik Negeri',
          major: data.major || 'Rekayasa Perangkat Lunak',
          company_name: data.company_name || 'PT Inovasi Digital',
          company_address: 'Gedung Cyber 2, Kuningan, Jakarta Selatan',
          department: data.department || 'Engineering Squad',
          mentor_id: 'demo-mentor-uuid-002',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0],
          total_required_hours: 600,
          accumulated_hours: 0,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      setUser({ id: newUserId, email: data.email });
      setProfile(newProfile);
      setInternship(newInternship);

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        profile: newProfile,
        internship: newInternship
      }));

      setIsLoading(false);
      return {};
    } catch (err: any) {
      setIsLoading(false);
      return { error: err.message || 'Gagal mendaftarkan akun baru' };
    }
  };

  const signInWithGoogleAuth = async (): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res.error) {
        setIsLoading(false);
        return { error: res.error };
      }
      if (res.user) {
        const userDocRef = doc(db, 'users', res.user.uid);
        let currentProfile: UserProfile;
        try {
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            currentProfile = snap.data() as UserProfile;
          } else {
            currentProfile = {
              id: res.user.uid,
              email: res.user.email || 'user@example.com',
              full_name: res.user.displayName || (res.user.email ? res.user.email.split('@')[0] : 'Hero Siswa Magang'),
              role: 'student',
              avatar_url: res.user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              institution: 'Sekolah / Kampus Mitra',
              phone_number: res.user.phoneNumber || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            await setDoc(userDocRef, currentProfile);
          }
          setProfile(currentProfile);
          setUser({ id: res.user.uid, email: res.user.email });
          setInternship(DEMO_PROFILES.student.internship);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
            profile: currentProfile,
            internship: DEMO_PROFILES.student.internship
          }));
        } catch (fsErr) {
          handleFirestoreError(fsErr, OperationType.WRITE, 'users');
        }
      }
      setIsLoading(false);
      return {};
    } catch (err: any) {
      setIsLoading(false);
      return { error: err?.message || 'Gagal masuk dengan akun Google' };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await logOutFirebase();
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setUser(null);
      setProfile(null);
      setInternship(null);
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const signInDemo = (role: UserRole) => {
    setIsLoading(true);
    const demo = DEMO_PROFILES[role] || DEMO_PROFILES.student;
    setUser({ id: demo.profile.id, email: demo.profile.email });
    setProfile(demo.profile);
    setInternship(demo.internship);

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      profile: demo.profile,
      internship: demo.internship
    }));

    setIsLoading(false);
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ error?: string }> => {
    if (!profile) return { error: 'Belum ada profil aktif' };

    const updated = {
      ...profile,
      ...updates,
      updated_at: new Date().toISOString()
    };

    setProfile(updated);

    // Sync to Firestore if authenticated or valid ID
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), updated, { merge: true });
      } catch (fbErr) {
        handleFirestoreError(fbErr, OperationType.UPDATE, 'users');
      }
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', profile.id);
        if (error) return { error: error.message };
      } catch (e: any) {
        console.warn('Supabase profile update warning:', e);
      }
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        ...parsed,
        profile: updated
      }));
    }

    return {};
  };

  const uploadAvatarPhoto = async (file: File): Promise<{ url?: string; error?: string }> => {
    if (!profile) return { error: 'Belum ada profil aktif' };
    const res = await uploadAvatar(profile.id, file);
    if (res.error || !res.url) {
      return { error: res.error || 'Gagal mengunggah foto profil' };
    }
    await updateProfile({ avatar_url: res.url });
    return { url: res.url };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        internship,
        isLoading,
        isSupabaseLive: isSupabaseConfigured,
        isFirebaseLive: true,
        signIn,
        signUp,
        signInWithGoogleAuth,
        signOut,
        signInDemo,
        updateProfile,
        uploadAvatarPhoto
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
