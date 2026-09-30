export type UserRole = 'student' | 'mentor' | 'coordinator' | 'admin';

export type AttendanceStatus = 'present' | 'late' | 'sick' | 'permission' | 'absent';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type JournalStatus = 'draft' | 'submitted' | 'approved' | 'revision_requested';
export type EvaluationPeriod = 'monthly' | 'midterm' | 'final';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: UserRole;
  phone_number?: string | null;
  institution?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InternshipProfile {
  id: string;
  user_id: string;
  student_id_number: string;
  institution_name: string;
  major: string;
  company_name: string;
  company_address?: string | null;
  department: string;
  mentor_id?: string | null;
  start_date: string;
  end_date: string;
  total_required_hours: number;
  accumulated_hours: number;
  status: 'active' | 'completed' | 'pending' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Joins
  user?: UserProfile;
  mentor?: UserProfile;
}

export interface Attendance {
  id: string;
  internship_id: string;
  user_id: string;
  date: string;
  clock_in?: string | null;
  clock_out?: string | null;
  status: AttendanceStatus;
  duration_minutes: number;
  clock_in_photo_url?: string | null;
  clock_out_photo_url?: string | null;
  clock_in_lat?: number | null;
  clock_in_lng?: number | null;
  clock_in_address?: string | null;
  notes?: string | null;
  attachment_url?: string | null;
  approval_status: ApprovalStatus;
  verified_by?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  user?: UserProfile;
}

export interface DailyJournal {
  id: string;
  internship_id: string;
  user_id: string;
  date: string;
  activity_title: string;
  activity_description: string;
  challenges?: string | null;
  solutions_or_results?: string | null;
  attachment_url?: string | null;
  learning_category?: string;
  duration_hours: number;
  approval_status: JournalStatus;
  mentor_feedback?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: UserProfile;
}

export interface Evaluation {
  id: string;
  internship_id: string;
  evaluator_id: string;
  evaluation_period: EvaluationPeriod;
  discipline_score: number;
  technical_skill_score: number;
  initiative_score: number;
  teamwork_score: number;
  attitude_score: number;
  final_score: number;
  grade: string;
  strengths?: string | null;
  areas_for_improvement?: string | null;
  general_notes?: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  evaluator?: UserProfile;
}
