export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
  profile_picture?: string;
  skills?: string[];
  bio?: string;
  phone?: string;
  auth_token?: string;
  created_at?: string;
}

export interface Course {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string;
  price: number;
  category: string;
  instructor_id: string;
  instructor_name?: string;
  students_enrolled?: number;
  rating?: number;
  level?: string;
  duration?: string;
  status: 'published' | 'draft';
  features?: string[];
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  _id?: string;
  course_id: string;
  title: string;
  duration?: string;
  module_order: number;
  created_at: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  _id?: string;
  module_id?: string;
  course_id: string;
  title: string;
  content?: string;
  video_url?: string;
  lesson_order: number;
  is_free_preview?: boolean;
  is_live?: boolean;
  created_at: string;
}

export interface Enrollment {
  id: string;
  _id?: string;
  student_id: string;
  course_id: string;
  batch_id?: string;
  progress: number;
  student_status: 'active' | 'inactive' | 'pending' | 'completed';
  payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_id?: string;
  amount_paid: number;
  enrolled_at: string;
  completed_lessons?: string[];
  updated_at?: string;
  course_details?: Course;
}

export interface EnrollmentRequest {
  id: string;
  student_id: string;
  course_id: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  teacher_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  status: 'locked' | 'pending' | 'submitted' | 'graded';
  score?: number;
  submission_url?: string;
  feedback?: string;
  submitted_at?: string;
  graded_at?: string;
}

export interface Doubt {
  id: string;
  _id?: string;
  student_id: string;
  teacher_id?: string;
  course_id?: string;
  lesson_id?: string;
  title: string;
  description?: string;
  status: 'pending' | 'resolved';
  reply?: string;
  created_at: string;
  resolved_at?: string;
}

export interface Job {
  id: string;
  _id?: string;
  title: string;
  company: string;
  location: string;
  salary?: number;
  apply_url?: string;
  description?: string;
  skills?: string[];
  is_active: boolean;
  created_at: string;
}

export interface MockInterview {
  id: string;
  student_id: string;
  teacher_id: string;
  interview_type?: string;
  scheduled_at: string;
  meet_link?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  score?: number;
  notes?: string;
  created_at: string;
}

export interface LiveClass {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  meeting_link: string;
  is_live: boolean;
  teacher_id: string;
  created_at: string;
}

export interface Recording {
  id: string;
  live_class_id?: string;
  course_id: string;
  title: string;
  video_url: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  live_class_id?: string;
  course_id: string;
  user_id: string;
  join_time: string;
  leave_time?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'general' | 'assignment' | 'doubt' | 'interview' | 'course';
  related_entity_id?: string;
  related_entity_type?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  description: string;
  amount: number;
  related_enrollment_id?: string;
  related_profile_id?: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  student_id: string;
  target: string;
  target_teacher_id?: string;
  rating: number;
  comment?: string;
  type: 'teacher_rating' | 'platform_feedback' | 'complaint';
  is_resolved: boolean;
  created_at: string;
}

export interface Batch {
  id: string;
  name: string;
  course_id: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
}
