import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DailyJournal, UserProfile } from '../types';
import { NewStudentData } from '../components/dashboard/StudentAddModal';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export interface AttendanceRecord {
  id: string;
  date: string;
  dayName: string;
  clockIn: string;
  clockOut?: string;
  durationHours: number;
  status: 'Hadir Tepat Waktu' | 'Terlambat' | 'Izin' | 'Sakit' | 'WFH';
  approvalStatus: 'approved' | 'pending' | 'rejected';
  location?: string;
}

export interface StudentProgressState {
  attendanceStatus: 'not_clocked_in' | 'clocked_in' | 'clocked_out';
  clockInTime?: string;
  clockOutTime?: string;
  lastAttendanceDate: string;
  streakDays: number;
  accumulatedHours: number;
  totalRequiredHours: number;
  attendanceHistory: AttendanceRecord[];
}

export interface AttendanceQueueItem {
  id: string;
  studentName: string;
  date: string;
  time: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface JournalQueueItem {
  id: string;
  studentName: string;
  title: string;
  category: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface AutoSaveMeta {
  isSaving: boolean;
  lastSavedAt: string | null;
  lastAction: string;
  version: number;
}

interface ProgressContextType {
  // Student progress
  studentProgress: StudentProgressState;
  journals: DailyJournal[];
  clockIn: () => void;
  clockOut: () => void;
  addJournal: (journal: DailyJournal) => void;
  deleteJournal: (id: string) => void;

  // Mentor progress
  mentees: NewStudentData[];
  attendanceQueue: AttendanceQueueItem[];
  journalQueue: JournalQueueItem[];
  addMentee: (mentee: NewStudentData) => void;
  deleteMentee: (id: string) => void;
  approveAttendance: (id: string, studentName: string) => void;
  rejectAttendance: (id: string, studentName: string) => void;
  approveJournal: (id: string, studentName: string, feedback?: string) => void;

  // Auto-save info
  autoSaveMeta: AutoSaveMeta;
  resetAllProgress: () => void;
  notifySave: (actionName: string) => void;
}

const STORAGE_KEYS = {
  STUDENT_PROGRESS: 'magang_student_progress_v2',
  JOURNALS: 'internship_student_journals',
  MENTEES: 'internship_mentor_mentees',
  ATTENDANCE_QUEUE: 'magang_mentor_attendance_queue_v2',
  JOURNAL_QUEUE: 'internship_mentor_queue',
  AUTOSAVE_TIMESTAMP: 'magang_autosave_last_saved'
};

const INITIAL_ATTENDANCE_HISTORY: AttendanceRecord[] = [
  {
    id: 'att-hist-1',
    date: '2026-09-15',
    dayName: 'Selasa',
    clockIn: '08:02 WIB',
    clockOut: '17:00 WIB',
    durationHours: 8.0,
    status: 'Hadir Tepat Waktu',
    approvalStatus: 'approved',
    location: 'Bandung Digital Valley'
  },
  {
    id: 'att-hist-2',
    date: '2026-09-14',
    dayName: 'Senin',
    clockIn: '07:58 WIB',
    clockOut: '17:05 WIB',
    durationHours: 8.0,
    status: 'Hadir Tepat Waktu',
    approvalStatus: 'approved',
    location: 'Telkom Landmark Tower'
  },
  {
    id: 'att-hist-3',
    date: '2026-09-11',
    dayName: 'Jumat',
    clockIn: '08:15 WIB',
    clockOut: '16:45 WIB',
    durationHours: 7.5,
    status: 'WFH',
    approvalStatus: 'approved',
    location: 'Remote WFH (GPS Valid)'
  }
];

const INITIAL_STUDENT_PROGRESS: StudentProgressState = {
  attendanceStatus: 'clocked_in',
  clockInTime: '08:02 WIB',
  clockOutTime: undefined,
  lastAttendanceDate: '2026-09-15',
  streakDays: 28,
  accumulatedHours: 248.5,
  totalRequiredHours: 600,
  attendanceHistory: INITIAL_ATTENDANCE_HISTORY
};

const INITIAL_JOURNALS: DailyJournal[] = [
  {
    id: 'jrn-demo-001',
    internship_id: 'demo-internship-uuid-001',
    user_id: 'demo-student-uuid-001',
    date: '2026-09-15',
    activity_title: 'Implementasi Autentikasi Supabase & RLS Multi-Role',
    activity_description: 'Membangun arsitektur login, trigger auth untuk auto-profile siswa, serta pengujian proteksi tabel RLS di dashboard.',
    challenges: 'Penanganan token expiry saat simulasi pergantian peran pengguna.',
    solutions_or_results: 'Menggunakan trigger custom auth dan validasi helper JWT supabase secara aman.',
    attachment_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    learning_category: 'Backend & Cloud Infrastructure',
    duration_hours: 8.0,
    approval_status: 'submitted',
    mentor_feedback: null,
    verified_by: null,
    verified_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'jrn-demo-002',
    internship_id: 'demo-internship-uuid-001',
    user_id: 'demo-student-uuid-001',
    date: '2026-09-14',
    activity_title: 'Desain Wireframe UI Dashboard & Diskusi Sprint',
    activity_description: 'Menyusun wireframe komponen kartu profil siswa dan modul logbook jurnal interaktif sesuai masukan UI lead.',
    challenges: null,
    solutions_or_results: 'Wireframe disetujui dalam sesi sprint review mingguan.',
    attachment_url: null,
    learning_category: 'UI/UX Design & Prototyping',
    duration_hours: 8.0,
    approval_status: 'approved',
    mentor_feedback: 'Desain bersih dan mudah dipahami oleh pengguna baru.',
    verified_by: 'demo-mentor-uuid-002',
    verified_at: '2026-09-14T17:00:00Z',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

const INITIAL_MENTEES: NewStudentData[] = [
  {
    id: 'm-1',
    name: 'Muhammad Fauzan Azhim',
    nim: '2207411032',
    email: 'fauzan.siswa@magang.ac.id',
    phone: '0812-3456-7890',
    institution: 'Politeknik Negeri Jakarta',
    major: 'Teknik Informatika (D4)',
    department: 'Frontend Squad',
    hoursDone: 248.5,
    targetHours: 600,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'Aktif',
    startDate: '2026-08-01',
    endDate: '2026-12-31'
  },
  {
    id: 'm-2',
    name: 'Adinda Putri Maharani',
    nim: '2207411045',
    email: 'adinda.putri@ui.ac.id',
    phone: '0813-9876-5432',
    institution: 'Universitas Indonesia',
    major: 'Ilmu Komputer (S1)',
    department: 'Backend & Cloud Squad',
    hoursDone: 310.0,
    targetHours: 600,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'Aktif',
    startDate: '2026-08-01',
    endDate: '2026-12-31'
  },
  {
    id: 'm-3',
    name: 'Bagas Aditya Prasetyo',
    nim: '2207411018',
    email: 'bagas.aditya@itb.ac.id',
    phone: '0815-1234-5678',
    institution: 'Institut Teknologi Bandung',
    major: 'Teknik Elektro (S1)',
    department: 'IoT & Firmware Squad',
    hoursDone: 195.0,
    targetHours: 600,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'Aktif',
    startDate: '2026-08-01',
    endDate: '2026-12-31'
  }
];

const INITIAL_ATTENDANCE_QUEUE: AttendanceQueueItem[] = [
  {
    id: 'att-1',
    studentName: 'Muhammad Fauzan Azhim',
    date: 'Hari Ini',
    time: '08:02 - 17:00 WIB',
    location: 'Bandung Digital Valley (GPS Valid)',
    status: 'pending'
  },
  {
    id: 'att-2',
    studentName: 'Adinda Putri Maharani',
    date: 'Hari Ini',
    time: '08:15 - 17:15 WIB',
    location: 'Telkom Landmark Tower (GPS Valid)',
    status: 'pending'
  }
];

const INITIAL_JOURNAL_QUEUE: JournalQueueItem[] = [
  {
    id: 'jrn-demo-001',
    studentName: 'Muhammad Fauzan Azhim',
    title: 'Implementasi Autentikasi Supabase & RLS Multi-Role',
    category: 'Backend & Cloud Infrastructure',
    date: 'Hari Ini',
    status: 'pending'
  },
  {
    id: 'jrn-2',
    studentName: 'Bagas Aditya Prasetyo',
    title: 'Debugging MQTT Broker & Sensor Kalibrasi',
    category: 'Hardware & IoT',
    date: 'Kemarin',
    status: 'pending'
  }
];

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Student Progress State (Persistent)
  const [studentProgress, setStudentProgress] = useState<StudentProgressState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENT_PROGRESS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.accumulatedHours === 'number') return parsed;
      }
    } catch (e) {
      console.warn('Gagal membaca progress siswa:', e);
    }
    return INITIAL_STUDENT_PROGRESS;
  });

  // 2. Student Journals State (Persistent)
  const [journals, setJournals] = useState<DailyJournal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.JOURNALS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Gagal membaca jurnal:', e);
    }
    return INITIAL_JOURNALS;
  });

  // 3. Mentor Mentees State (Persistent)
  const [mentees, setMentees] = useState<NewStudentData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MENTEES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Gagal membaca daftar mentee:', e);
    }
    return INITIAL_MENTEES;
  });

  // 4. Mentor Attendance Queue (Persistent)
  const [attendanceQueue, setAttendanceQueue] = useState<AttendanceQueueItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_QUEUE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Gagal membaca antrean presensi:', e);
    }
    return INITIAL_ATTENDANCE_QUEUE;
  });

  // 5. Mentor Journal Queue (Persistent)
  const [journalQueue, setJournalQueue] = useState<JournalQueueItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.JOURNAL_QUEUE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Gagal membaca antrean review jurnal:', e);
    }
    return INITIAL_JOURNAL_QUEUE;
  });

  // 6. Auto-Save Tracker & Feedback
  const [autoSaveMeta, setAutoSaveMeta] = useState<AutoSaveMeta>(() => {
    const savedTs = localStorage.getItem(STORAGE_KEYS.AUTOSAVE_TIMESTAMP);
    return {
      isSaving: false,
      lastSavedAt: savedTs || 'Baru Saja',
      lastAction: 'Sesi Aktif',
      version: 1
    };
  });

  // Helper to trigger save feedback & persist timestamp
  const notifySave = useCallback((actionName: string) => {
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setAutoSaveMeta((prev) => ({
      ...prev,
      isSaving: true,
      lastAction: actionName
    }));

    try {
      localStorage.setItem(STORAGE_KEYS.AUTOSAVE_TIMESTAMP, timeNow);
    } catch (e) {
      // ignore
    }

    setTimeout(() => {
      setAutoSaveMeta((prev) => ({
        ...prev,
        isSaving: false,
        lastSavedAt: timeNow,
        version: prev.version + 1
      }));
    }, 450);
  }, []);

  // Save student progress to localStorage and Firestore whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENT_PROGRESS, JSON.stringify(studentProgress));
    } catch (e) {
      console.warn('Auto-save student progress error:', e);
    }

    // Sync to Firestore progress collection
    if (auth.currentUser) {
      const progressRef = doc(db, 'progress', auth.currentUser.uid);
      setDoc(progressRef, {
        id: auth.currentUser.uid,
        user_id: auth.currentUser.uid,
        attendance_status: studentProgress.attendanceStatus,
        clock_in_time: studentProgress.clockInTime || null,
        clock_out_time: studentProgress.clockOutTime || null,
        last_attendance_date: studentProgress.lastAttendanceDate,
        streak_days: studentProgress.streakDays,
        accumulated_hours: studentProgress.accumulatedHours,
        total_required_hours: studentProgress.totalRequiredHours,
        updated_at: new Date().toISOString()
      }, { merge: true }).catch((err) => {
        console.warn('Firestore progress auto-sync notice:', err);
      });
    }
  }, [studentProgress]);

  // Save journals to localStorage and Firestore whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(journals));
    } catch (e) {
      console.warn('Auto-save journals error:', e);
    }

    if (auth.currentUser && journals.length > 0) {
      // Sync latest journals to Firestore
      journals.slice(0, 5).forEach((j) => {
        setDoc(doc(db, 'journals', j.id), {
          ...j,
          user_id: auth.currentUser?.uid || j.user_id,
          updated_at: new Date().toISOString()
        }, { merge: true }).catch((err) => {
          console.warn('Firestore journal auto-sync notice:', err);
        });
      });
    }
  }, [journals]);

  // Save mentees to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MENTEES, JSON.stringify(mentees));
    } catch (e) {
      console.warn('Auto-save mentees error:', e);
    }
  }, [mentees]);

  // Save attendance queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE_QUEUE, JSON.stringify(attendanceQueue));
    } catch (e) {
      console.warn('Auto-save attendance queue error:', e);
    }
  }, [attendanceQueue]);

  // Save journal queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.JOURNAL_QUEUE, JSON.stringify(journalQueue));
    } catch (e) {
      console.warn('Auto-save journal queue error:', e);
    }
  }, [journalQueue]);

  // Actions: Clock In
  const clockIn = useCallback(() => {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const todayStr = new Date().toISOString().split('T')[0];

    setStudentProgress((prev) => ({
      ...prev,
      attendanceStatus: 'clocked_in',
      clockInTime: timeStr,
      clockOutTime: undefined,
      lastAttendanceDate: todayStr
    }));

    // Add to mentor attendance queue if not present
    setAttendanceQueue((prev) => {
      const exists = prev.some((item) => item.studentName === 'Muhammad Fauzan Azhim');
      if (exists) return prev;
      return [
        {
          id: `att-realtime-${Date.now()}`,
          studentName: 'Muhammad Fauzan Azhim',
          date: 'Hari Ini (' + todayStr + ')',
          time: `${timeStr} - Masuk`,
          location: 'Bandung Digital Valley (GPS Valid)',
          status: 'pending'
        },
        ...prev
      ];
    });

    notifySave('Presensi Masuk (Clock In)');
  }, [notifySave]);

  // Actions: Clock Out
  const clockOut = useCallback(() => {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const todayStr = new Date().toISOString().split('T')[0];
    const duration = 8.0;

    setStudentProgress((prev) => {
      const newAccumulated = +(prev.accumulatedHours + duration).toFixed(1);
      const newStreak = prev.streakDays + 1;

      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        date: todayStr,
        dayName: new Date().toLocaleDateString('id-ID', { weekday: 'long' }),
        clockIn: prev.clockInTime || '08:00 WIB',
        clockOut: timeStr,
        durationHours: duration,
        status: 'Hadir Tepat Waktu',
        approvalStatus: 'approved',
        location: 'Bandung Digital Valley'
      };

      return {
        ...prev,
        attendanceStatus: 'clocked_out',
        clockOutTime: timeStr,
        accumulatedHours: newAccumulated,
        streakDays: newStreak,
        attendanceHistory: [newRecord, ...prev.attendanceHistory]
      };
    });

    // Also update mentor mentees' progress
    setMentees((prev) =>
      prev.map((m) => {
        if (m.name === 'Muhammad Fauzan Azhim') {
          return {
            ...m,
            hoursDone: +(m.hoursDone + duration).toFixed(1)
          };
        }
        return m;
      })
    );

    notifySave('Presensi Pulang (Clock Out & Jam Bertambah)');
  }, [notifySave]);

  // Actions: Add Journal
  const addJournal = useCallback((newJournal: DailyJournal) => {
    setJournals((prev) => [newJournal, ...prev]);

    // If submitted, sync into mentor queue
    if (newJournal.approval_status === 'submitted') {
      const queueItem: JournalQueueItem = {
        id: newJournal.id,
        studentName: 'Muhammad Fauzan Azhim',
        title: newJournal.activity_title,
        category: newJournal.learning_category || 'Technical',
        date: 'Hari Ini (' + newJournal.date + ')',
        status: 'pending'
      };
      setJournalQueue((prev) => [queueItem, ...prev.filter((q) => q.id !== newJournal.id)]);
    }

    notifySave(`Jurnal "${newJournal.activity_title}" Disimpan`);
  }, [notifySave]);

  // Actions: Delete Journal
  const deleteJournal = useCallback((id: string) => {
    setJournals((prev) => prev.filter((j) => j.id !== id));
    setJournalQueue((prev) => prev.filter((q) => q.id !== id));
    notifySave('Jurnal Dihapus');
  }, [notifySave]);

  // Actions: Add Mentee
  const addMentee = useCallback((newMentee: NewStudentData) => {
    setMentees((prev) => [newMentee, ...prev]);
    notifySave(`Murid Baru "${newMentee.name}" Ditambahkan`);
  }, [notifySave]);

  // Actions: Delete Mentee
  const deleteMentee = useCallback((id: string) => {
    setMentees((prev) => prev.filter((m) => m.id !== id));
    notifySave('Murid Bimbingan Dihapus');
  }, [notifySave]);

  // Actions: Mentor Approve Attendance
  const approveAttendance = useCallback((id: string, studentName: string) => {
    setAttendanceQueue((prev) => prev.filter((item) => item.id !== id));
    notifySave(`Presensi ${studentName} Disetujui Sensei`);
  }, [notifySave]);

  // Actions: Mentor Reject Attendance
  const rejectAttendance = useCallback((id: string, studentName: string) => {
    setAttendanceQueue((prev) => prev.filter((item) => item.id !== id));
    notifySave(`Presensi ${studentName} Ditolak`);
  }, [notifySave]);

  // Actions: Mentor Approve Journal
  const approveJournal = useCallback((id: string, studentName: string, feedback?: string) => {
    setJournalQueue((prev) => prev.filter((item) => item.id !== id));

    // Update in student's journal list
    setJournals((prev) =>
      prev.map((j) => {
        if (j.id === id) {
          return {
            ...j,
            approval_status: 'approved',
            mentor_feedback: feedback || 'Disetujui oleh pembimbing lapangan. Kerja bagus & pertahankan!',
            verified_at: new Date().toISOString()
          };
        }
        return j;
      })
    );

    notifySave(`Jurnal ${studentName} Disetujui & Dinilai`);
  }, [notifySave]);

  // Reset to default initial state
  const resetAllProgress = useCallback(() => {
    setStudentProgress(INITIAL_STUDENT_PROGRESS);
    setJournals(INITIAL_JOURNALS);
    setMentees(INITIAL_MENTEES);
    setAttendanceQueue(INITIAL_ATTENDANCE_QUEUE);
    setJournalQueue(INITIAL_JOURNAL_QUEUE);

    localStorage.removeItem(STORAGE_KEYS.STUDENT_PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.JOURNALS);
    localStorage.removeItem(STORAGE_KEYS.MENTEES);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE_QUEUE);
    localStorage.removeItem(STORAGE_KEYS.JOURNAL_QUEUE);

    notifySave('Reset ke Data Awal Sukses');
  }, [notifySave]);

  return (
    <ProgressContext.Provider
      value={{
        studentProgress,
        journals,
        clockIn,
        clockOut,
        addJournal,
        deleteJournal,
        mentees,
        attendanceQueue,
        journalQueue,
        addMentee,
        deleteMentee,
        approveAttendance,
        rejectAttendance,
        approveJournal,
        autoSaveMeta,
        resetAllProgress,
        notifySave
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};
